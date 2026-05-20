import re
from datetime import datetime

class InvoiceParser:
    """发票信息解析工具"""

    @staticmethod
    def extract_amount(text: str) -> float:
        """从文本中提取金额"""
        patterns = [
            r'[¥￥]?\s*(\d+\.?\d*)',
            r'金额[：:]\s*(\d+\.?\d*)',
            r'小写[：:]\s*(\d+\.?\d*)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return float(match.group(1))
        return 0.0

    @staticmethod
    def extract_date(text: str) -> str:
        """从文本中提取日期"""
        pattern = r'(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})'
        match = re.search(pattern, text)
        if match:
            return f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
        return ""

    @staticmethod
    def extract_invoice_no(text: str) -> str:
        """从文本中提取发票号码"""
        pattern = r'发票号码[：:]\s*([A-Z0-9]{10,})'
        match = re.search(pattern, text)
        if match:
            return match.group(1)
        # 尝试通用20位数字
        pattern2 = r'\b(\d{20})\b'
        match2 = re.search(pattern2, text)
        if match2:
            return match2.group(1)
        return ""

class ValidationRules:
    """校验规则引擎"""

    @staticmethod
    def check_duplicate(invoice_no: str, existing_invoices: list) -> dict:
        """检查重复报销"""
        if invoice_no in existing_invoices:
            return {
                "passed": False,
                "level": "error",
                "message": f"发票号码{invoice_no}已有报销记录"
            }
        return {"passed": True, "level": "info", "message": "无重复报销"}

    @staticmethod
    def check_amount_match(invoice_amount: float, expense_amount: float) -> dict:
        """检查金额一致性"""
        if abs(invoice_amount - expense_amount) > 0.01:
            return {
                "passed": False,
                "level": "warning",
                "message": f"发票金额({invoice_amount})与报销金额({expense_amount})不一致"
            }
        return {"passed": True, "level": "info", "message": "金额一致"}

    @staticmethod
    def check_budget(expense_amount: float, department_budget: float) -> dict:
        """检查预算"""
        if expense_amount > department_budget:
            return {
                "passed": False,
                "level": "warning",
                "message": f"报销金额({expense_amount})超出部门预算({department_budget})"
            }
        return {"passed": True, "level": "info", "message": "预算充足"}

    @staticmethod
    def get_approval_route(expense_amount: float, has_warning: bool) -> dict:
        """确定审批路由"""
        if has_warning:
            return {
                "route": "manual_review",
                "approvers": ["finance", "manager"],
                "message": "需要人工复核"
            }
        if expense_amount >= 5000:
            return {
                "route": "double_approval",
                "approvers": ["finance", "manager"],
                "message": "需要财务+主管双重审批"
            }
        return {
            "route": "single_approval",
            "approvers": ["finance"],
            "message": "仅需财务审批"
        }