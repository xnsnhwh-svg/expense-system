from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Invoice, Expense
from app.services.file_service import file_service
from app.services.validation_service import validation_service
import aiohttp
import base64
import json
from app.config import settings
from datetime import datetime

router = APIRouter(prefix="/invoice", tags=["发票"])

# 百度OCR Token获取
async def get_baidu_access_token():
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": settings.BAIDU_OCR_API_KEY,
        "client_secret": settings.BAIDU_OCR_SECRET_KEY
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as resp:
            result = await resp.json()
            return result.get("access_token")

# OCR识别
async def recognize_invoice(image_path: str) -> dict:
    """调用百度OCR识别发票"""
    if not settings.BAIDU_OCR_API_KEY:
        # 没有配置API时，返回模拟数据
        return {
            "success": True,
            "data": {
                "invoice_code": "1234567890",
                "invoice_no": f"MOCK-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "invoice_date": datetime.now().strftime("%Y-%m-%d"),
                "seller_name": "示例销售方",
                "buyer_name": "软通动力",
                "amount": "1000.00",
                "tax_amount": "100.00",
                "ocr_confidence": 0.95
            },
            "mock": True
        }

    try:
        access_token = await get_baidu_access_token()

        with open(image_path, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()

        url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice"
        params = {"access_token": access_token}
        data = {"image": image_base64}

        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params, data=data) as resp:
                result = await resp.json()

        if "words_result" in result:
            words = result["words_result"]
            return {
                "success": True,
                "data": {
                    "invoice_code": words.get("InvoiceCode", ""),
                    "invoice_no": words.get("InvoiceNo", ""),
                    "invoice_date": words.get("InvoiceDate", ""),
                    "seller_name": words.get("SellerName", ""),
                    "buyer_name": words.get("BuyerName", ""),
                    "amount": words.get("TotalAmount", "0"),
                    "tax_amount": words.get("TaxAmount", "0"),
                    "ocr_confidence": 0.9
                }
            }
        else:
            return {"success": False, "error": result.get("error_msg", "识别失败")}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/upload/{expense_id}")
async def upload_invoice(
    expense_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传发票并自动OCR识别"""
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="只支持 JPG、PNG、PDF 格式")

    # 保存文件
    file_path = file_service.save_file(file, subfolder="invoices")

    # 获取完整路径
    import os
    full_path = os.path.join("uploads", "invoices", os.path.basename(file_path))

    # 创建发票记录
    invoice = Invoice(
        expense_id=expense_id,
        image_url=file_path,
        created_at=int(datetime.now().timestamp())
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # 调用OCR识别
    ocr_result = await recognize_invoice(full_path)

    if ocr_result["success"]:
        invoice.invoice_code = ocr_result["data"].get("invoice_code")
        invoice.invoice_no = ocr_result["data"].get("invoice_no")
        invoice.invoice_date = datetime.strptime(ocr_result["data"].get("invoice_date", "2024-01-01"), "%Y-%m-%d").date() if ocr_result["data"].get("invoice_date") else None
        invoice.seller_name = ocr_result["data"].get("seller_name")
        invoice.buyer_name = ocr_result["data"].get("buyer_name")
        invoice.invoice_amount = float(ocr_result["data"].get("amount", 0))
        invoice.ocr_confidence = ocr_result["data"].get("ocr_confidence")
        invoice.ocr_raw_text = json.dumps(ocr_result["data"], ensure_ascii=False)
        db.commit()

        return {
            "id": invoice.id,
            "image_url": invoice.image_url,
            "ocr_result": ocr_result["data"],
            "is_mock": ocr_result.get("mock", False)
        }
    else:
        return {
            "id": invoice.id,
            "image_url": invoice.image_url,
            "ocr_error": ocr_result.get("error"),
            "is_mock": True
        }

@router.get("/list/{expense_id}")
def list_invoices(expense_id: int, db: Session = Depends(get_db)):
    """获取报销单的所有发票"""
    invoices = db.query(Invoice).filter(Invoice.expense_id == expense_id).all()
    return [{
        "id": inv.id,
        "invoice_no": inv.invoice_no,
        "invoice_amount": float(inv.invoice_amount) if inv.invoice_amount else 0,
        "invoice_date": str(inv.invoice_date) if inv.invoice_date else None,
        "seller_name": inv.seller_name,
        "image_url": inv.image_url,
        "ocr_confidence": float(inv.ocr_confidence) if inv.ocr_confidence else None,
        "validation_result": inv.validation_result
    } for inv in invoices]

@router.post("/validate/{invoice_id}")
async def validate_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """对发票进行AI校验"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票不存在")

    result = validation_service.validate_invoice(invoice, db)

    # 更新发票校验结果
    invoice.validation_result = result["overall"]
    invoice.validation_message = result["summary"]
    db.commit()

    return result

@router.post("/validate-expense/{expense_id}")
async def validate_expense_invoices(
    expense_id: int,
    db: Session = Depends(get_db)
):
    """对报销单的所有发票进行校验"""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")

    invoices = db.query(Invoice).filter(Invoice.expense_id == expense_id).all()

    if not invoices:
        return {
            "overall": "invalid",
            "details": [],
            "summary": "没有上传发票",
            "can_submit": False
        }

    results = []
    for invoice in invoices:
        result = validation_service.validate_invoice(invoice, db)
        # 更新每张发票的校验结果
        invoice.validation_result = result["overall"]
        invoice.validation_message = result["summary"]
        results.append({
            "invoice_id": invoice.id,
            "invoice_no": invoice.invoice_no,
            **result
        })

    db.commit()

    # 汇总报销单整体校验结果
    has_error = any(r["overall"] == "invalid" for r in results)
    has_warning = any(r["overall"] == "warning" for r in results)

    if has_error:
        overall = "invalid"
    elif has_warning:
        overall = "warning"
    else:
        overall = "valid"

    return {
        "expense_id": expense_id,
        "overall": overall,
        "invoices": results,
        "can_submit": overall != "invalid"
    }