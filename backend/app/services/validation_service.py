from sqlalchemy.orm import Session
from app.models import Invoice, Expense
from datetime import datetime

class ValidationService:
    """发票AI校验服务"""

    def validate_invoice(self, invoice: Invoice, db: Session) -> dict:
        """对发票进行全面校验"""
        results = []

        # 1. 真实性校验
        results.append(self._check_reality(invoice))

        # 2. 重复报销校验
        results.append(self._check_duplicate(invoice, db))

        # 3. 金额一致性校验
        results.append(self._check_amount_match(invoice, db))

        # 4. OCR置信度校验
        results.append(self._check_ocr_confidence(invoice))

        # 汇总结果
        has_error = any(r["level"] == "error" for r in results)
        has_warning = any(r["level"] == "warning" for r in results)

        if has_error:
            overall = "invalid"
        elif has_warning:
            overall = "warning"
        else:
            overall = "valid"

        return {
            "overall": overall,
            "details": results,
            "can_submit": not has_error,
            "summary": self._generate_summary(results)
        }

    def _check_reality(self, invoice: Invoice) -> dict:
        """真实性校验"""
        invoice_type = getattr(invoice, 'invoice_type', '') or ''

        # 火车票、机票等交通票据不需要发票号码
        transport_types = ['火车票', '机票', '汽车票', '船票', '出租车票', '交通票']
        is_transport = any(t in invoice_type for t in transport_types)

        if is_transport:
            if not invoice.invoice_amount or float(invoice.invoice_amount) <= 0:
                return {
                    "code": "REALITY_CHECK",
                    "name": "票据真实性",
                    "passed": False,
                    "level": "error",
                    "message": "票据金额缺失或无效"
                }
            return {
                "code": "REALITY_CHECK",
                "name": "票据真实性",
                "passed": True,
                "level": "info",
                "message": f"交通票据校验通过（{invoice_type}）"
            }

        # 增值税发票等需要发票号码
        if not invoice.invoice_no or len(str(invoice.invoice_no)) < 8:
            return {
                "code": "REALITY_CHECK",
                "name": "发票真实性",
                "passed": False,
                "level": "error",
                "message": "发票号码缺失或无效"
            }

        if not invoice.seller_name:
            return {
                "code": "REALITY_CHECK",
                "name": "发票真实性",
                "passed": False,
                "level": "warning",
                "message": "销售方信息缺失"
            }

        return {
            "code": "REALITY_CHECK",
            "name": "发票真实性",
            "passed": True,
            "level": "info",
            "message": "真实性校验通过"
        }

    def _check_duplicate(self, invoice: Invoice, db: Session) -> dict:
        """重复报销校验"""
        if not invoice.invoice_no:
            return {
                "code": "DUPLICATE_CHECK",
                "name": "重复报销",
                "passed": True,
                "level": "info",
                "message": "无发票号码，跳过重复校验"
            }

        # 查找同一发票号码的其他已报销记录
        existing = db.query(Invoice).join(Expense).filter(
            Invoice.invoice_no == invoice.invoice_no,
            Invoice.id != invoice.id,
            Expense.status.in_(["pending_finance", "pending_manager", "approved", "paid"])
        ).first()

        if existing:
            return {
                "code": "DUPLICATE_CHECK",
                "name": "重复报销",
                "passed": False,
                "level": "error",
                "message": f"发现重复报销！该发票已于{existing.created_at}提交报销"
            }

        return {
            "code": "DUPLICATE_CHECK",
            "name": "重复报销",
            "passed": True,
            "level": "info",
            "message": "无重复报销记录"
        }

    def _check_amount_match(self, invoice: Invoice, db: Session) -> dict:
        """金额一致性校验"""
        expense = invoice.expense
        if not expense:
            return {
                "code": "AMOUNT_CHECK",
                "name": "金额一致性",
                "passed": True,
                "level": "info",
                "message": "无法关联报销单"
            }

        if not invoice.invoice_amount:
            return {
                "code": "AMOUNT_CHECK",
                "name": "金额一致性",
                "passed": False,
                "level": "warning",
                "message": "无法从发票提取金额"
            }

        diff = abs(float(invoice.invoice_amount) - float(expense.amount))
        if diff > 0.01:
            return {
                "code": "AMOUNT_CHECK",
                "name": "金额一致性",
                "passed": False,
                "level": "warning",
                "message": f"发票金额({invoice.invoice_amount})与报销金额({expense.amount})不一致，差额{diff:.2f}元"
            }

        return {
            "code": "AMOUNT_CHECK",
            "name": "金额一致性",
            "passed": True,
            "level": "info",
            "message": "金额一致"
        }

    def _check_ocr_confidence(self, invoice: Invoice) -> dict:
        """OCR置信度校验"""
        if not invoice.ocr_confidence:
            return {
                "code": "OCR_CONFIDENCE",
                "name": "识别置信度",
                "passed": True,
                "level": "info",
                "message": "无置信度数据"
            }

        confidence = float(invoice.ocr_confidence)
        if confidence < 0.7:
            return {
                "code": "OCR_CONFIDENCE",
                "name": "识别置信度",
                "passed": False,
                "level": "warning",
                "message": f"OCR识别置信度较低({confidence*100:.1f}%)，建议人工复核"
            }

        if confidence < 0.85:
            return {
                "code": "OCR_CONFIDENCE",
                "name": "识别置信度",
                "passed": True,
                "level": "info",
                "message": f"识别置信度中等({confidence*100:.1f}%)"
            }

        return {
            "code": "OCR_CONFIDENCE",
            "name": "识别置信度",
            "passed": True,
            "level": "info",
            "message": f"识别置信度良好({confidence*100:.1f}%)"
        }

    def _generate_summary(self, results: list) -> str:
        """生成校验摘要"""
        passed_count = sum(1 for r in results if r["passed"])
        total_count = len(results)
        error_count = sum(1 for r in results if r["level"] == "error")
        warning_count = sum(1 for r in results if r["level"] == "warning")

        if error_count > 0:
            return f"校验未通过：{error_count}个错误，{warning_count}个警告"
        elif warning_count > 0:
            return f"校验通过但有{warning_count}个警告，建议关注"
        else:
            return f"校验通过（{passed_count}/{total_count}项检查均通过）"


validation_service = ValidationService()