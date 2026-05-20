from crewai import Agent, Crew, Process, Task
from crewai.tasks import TaskTemplate

class ExpenseOrchestrator:
    """编排中心 - 协调OCR、校验、审批三个Agent"""

    def __init__(self):
        self.ocr_agent = self._create_ocr_agent()
        self.check_agent = self._create_check_agent()
        self.approval_agent = self._create_approval_agent()
        self.crew = self._create_crew()

    def _create_ocr_agent(self) -> Agent:
        return Agent(
            role="OCR识别专家",
            goal="从发票图片中准确提取关键信息",
            backstory="你是专业的OCR识别专家，擅长从各种发票中提取文字信息。",
            verbose=True
        )

    def _create_check_agent(self) -> Agent:
        return Agent(
            role="合规校验专家",
            goal="判断发票是否符合报销规则",
            backstory="你是企业财务合规专家，擅长识别虚假发票、重复报销等问题。",
            verbose=True
        )

    def _create_approval_agent(self) -> Agent:
        return Agent(
            role="审批路由专家",
            goal="将报销单分发给合适的审批人",
            backstory="你是企业审批流程专家，擅长根据金额、类别将报销单路由到正确的审批节点。",
            verbose=True
        )

    def _create_crew(self) -> Crew:
        return Crew(
            agents=[self.ocr_agent, self.check_agent, self.approval_agent],
            process=Process.sequential,
            verbose=True
        )

    def process_expense(self, invoice_path: str, expense_data: dict) -> dict:
        """处理一笔报销的完整流程"""
        # Step 1: OCR识别
        ocr_result = self.crew.kickoff(
            inputs={
                "invoice_path": invoice_path,
                "action": "ocr"
            }
        )

        # Step 2: 合规校验
        check_result = self.crew.kickoff(
            inputs={
                "ocr_data": ocr_result,
                "expense_data": expense_data,
                "action": "check"
            }
        )

        # Step 3: 审批路由
        approval_result = self.crew.kickoff(
            inputs={
                "check_data": check_result,
                "action": "route"
            }
        )

        return {
            "status": "success",
            "ocr": ocr_result,
            "check": check_result,
            "approval": approval_result
        }