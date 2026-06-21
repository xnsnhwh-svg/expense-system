from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Invoice, Expense, ExpenseStatus
from app.services.file_service import file_service
from app.services.validation_service import validation_service
import aiohttp
import base64
import json
from app.config import settings
from datetime import datetime
try:
    import fitz
except ImportError:
    fitz = None

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

# OCR识别 - 多类型票据支持
OCR_ENDPOINTS = [
    ("vat_invoice", "增值税发票", {"InvoiceCode": "invoice_code", "InvoiceNum": "invoice_no", "InvoiceDate": "invoice_date", "SellerName": "seller_name", "PurchaserName": "buyer_name", "TotalAmount": "amount", "TaxAmount": "tax_amount"}),
    ("train_ticket", "火车票", {"ticket_num": "invoice_no", "date": "invoice_date", "start_station": "seller_name", "ticket_rates": "amount"}),
    ("taxi_receipt", "出租车票", {"receipt_num": "invoice_no", "date": "invoice_date", "fare": "amount"}),
    ("quota_invoice", "定额发票", {"invoice_code": "invoice_code", "invoice_num": "invoice_no", "invoice_date": "invoice_date", "amount": "amount"}),
    ("air_ticket", "飞机票", {"ticket_no": "invoice_no", "date": "invoice_date", "fare": "amount", "total": "amount"}),
    ("receipt", "通用票据", {"receipt_num": "invoice_no", "date": "invoice_date", "amount": "amount"}),
    ("business_license", "营业执照", {}),
    ("bank_receipt", "银行回单", {}),
    ("idcard", "身份证", {}),
    ("general_basic", "通用文字", {}),
]


async def recognize_invoice(image_path: str) -> dict:
    """调用百度OCR识别发票，支持10种票据类型"""
    if not settings.BAIDU_OCR_API_KEY:
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
                "ocr_confidence": 0.95,
                "invoice_type": "mock"
            },
            "mock": True
        }

    try:
        access_token = await get_baidu_access_token()

        ext = image_path.lower().split('.')[-1]
        if ext == 'pdf':
            doc = fitz.open(image_path)
            page = doc[0]
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            doc.close()
            image_base64 = base64.b64encode(img_bytes).decode()
        else:
            with open(image_path, "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode()

        for endpoint, invoice_type, field_map in OCR_ENDPOINTS:
            url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/{endpoint}"
            params = {"access_token": access_token}
            data = {"image": image_base64}

            async with aiohttp.ClientSession() as session:
                async with session.post(url, params=params, data=data) as resp:
                    result = await resp.json()

            if "error_code" in result:
                continue

            words = result.get("words_result", {})
            if not words:
                continue

            if invoice_type == "通用文字":
                words_list = result.get("words_result", [])
                raw_text = " ".join([w.get("words", "") for w in words_list])
                from app.agents.tools import InvoiceParser
                amount = InvoiceParser.extract_amount(raw_text)
                invoice_no = InvoiceParser.extract_invoice_no(raw_text)
                invoice_date = InvoiceParser.extract_date(raw_text)
                return {
                    "success": True,
                    "data": {
                        "invoice_code": "",
                        "invoice_no": invoice_no or f"AUTO-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                        "invoice_date": invoice_date,
                        "seller_name": "通用识别",
                        "buyer_name": "",
                        "amount": str(amount) if amount > 0 else "0",
                        "tax_amount": "0",
                        "ocr_confidence": 0.65,
                        "invoice_type": invoice_type,
                        "raw_text": raw_text
                    }
                }

            result_data = {"invoice_type": invoice_type, "ocr_confidence": 0.9}
            for api_field, our_field in field_map.items():
                val = words.get(api_field, "")
                if isinstance(val, dict):
                    val = val.get("word", "")
                result_data[our_field] = val

            if invoice_type == "增值税发票":
                total = float(result_data.get("amount", "0") or 0)
                tax = float(result_data.get("tax_amount", "0") or 0)
                result_data["amount"] = str(total + tax)

            result_data.setdefault("invoice_code", "")
            result_data.setdefault("invoice_no", "")
            result_data.setdefault("invoice_date", "")
            result_data.setdefault("seller_name", "")
            result_data.setdefault("buyer_name", "")
            result_data.setdefault("amount", "0")
            result_data.setdefault("tax_amount", "0")

            return {"success": True, "data": result_data}

        return {"success": False, "error": "无法识别该票据类型，请尝试上传清晰的图片"}

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

        raw_date = ocr_result["data"].get("invoice_date")
        if raw_date:
            for fmt in ["%Y-%m-%d", "%Y年%m月%d日", "%Y/%m/%d", "%Y.%m.%d"]:
                try:
                    invoice.invoice_date = datetime.strptime(raw_date, fmt).date()
                    break
                except ValueError:
                    continue

        invoice.seller_name = ocr_result["data"].get("seller_name")
        invoice.buyer_name = ocr_result["data"].get("buyer_name")
        invoice.invoice_amount = float(ocr_result["data"].get("amount", 0))
        invoice.ocr_confidence = ocr_result["data"].get("ocr_confidence")
        invoice.ocr_raw_text = json.dumps(ocr_result["data"], ensure_ascii=False)
        invoice.invoice_type = ocr_result["data"].get("invoice_type", "")
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
        "validation_result": inv.validation_result,
        "validation_message": inv.validation_message,
        "validation_details": json.loads(inv.validation_details) if inv.validation_details else None
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

    invoice.validation_result = result["overall"]
    invoice.validation_message = result["summary"]
    invoice.validation_details = json.dumps(result["details"], ensure_ascii=False)
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
        invoice.validation_result = result["overall"]
        invoice.validation_message = result["summary"]
        invoice.validation_details = json.dumps(result["details"], ensure_ascii=False)
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


@router.delete("/delete/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    """删除发票（从数据库中彻底删除）"""
    import os
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="发票不存在")

    expense = db.query(Expense).filter(Expense.id == invoice.expense_id).first()
    if expense and expense.status not in [ExpenseStatus.DRAFT, ExpenseStatus.RETURNED]:
        raise HTTPException(status_code=400, detail="只有草稿或退回状态的报销单可以删除发票")

    file_path = invoice.image_url
    if file_path:
        full_path = os.path.join("uploads", "invoices", os.path.basename(file_path))
        if os.path.exists(full_path):
            os.remove(full_path)

    db.delete(invoice)
    db.commit()
    return {"success": True}