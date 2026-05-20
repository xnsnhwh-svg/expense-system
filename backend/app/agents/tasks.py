from crewai import Task
from crewai.tasks import TaskTemplate

def create_ocr_task(agent, invoice_path: str) -> Task:
    return Task(
        description=f"""
        请从发票图片中提取以下信息：
        - 发票号码 (invoice_no)
        - 发票代码 (invoice_code)
        - 开票日期 (invoice_date)
        - 销售方名称 (seller_name)
        - 购买方名称 (buyer_name)
        - 发票金额 (amount)
        - 税额 (tax_amount)

        图片路径: {invoice_path}
        """,
        agent=agent,
        expected_output="返回JSON格式的结构化发票数据"
    )

def create_check_task(agent, ocr_data: dict, expense_data: dict) -> Task:
    return Task(
        description=f"""
        请对以下发票进行合规校验：

        OCR识别结果: {ocr_data}
        报销单数据: {expense_data}

        校验规则：
        1. 真实性校验：发票号码是否存在、识别置信度
        2. 重复报销：同一发票号码是否已有报销记录
        3. 金额一致：发票金额与报销金额是否一致
        4. 预算校验：是否超出部门预算

        返回：passed (true/false), level (info/warning/error), messages
        """,
        agent=agent,
        expected_output="返回校验结果JSON"
    )

def create_approval_task(agent, check_data: dict) -> Task:
    return Task(
        description=f"""
        根据校验结果确定审批流程：

        校验结果: {check_data}

        规则：
        - 如果check有error级别问题 → 驳回
        - 如果check有warning级别问题 → 标记需要人工复核
        - 如果金额>=5000元 → 需要主管+财务双重审批
        - 如果金额<5000元 → 仅需财务审批

        返回审批路由建议和下一个审批人
        """,
        agent=agent,
        expected_output="返回路由决策JSON"
    )