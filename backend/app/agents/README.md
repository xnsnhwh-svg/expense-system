# CrewAI Multi-Agent Orchestration

## Overview

This module implements a multi-agent expense reimbursement system using CrewAI. The system coordinates three specialized agents in a sequential workflow to process expense claims from invoice submission to approval routing.

## Architecture

### Agents

| Agent | Role | Responsibility |
|-------|------|----------------|
| **OCR Agent** | OCR识别专家 | Extracts structured data from invoice images (invoice number, date, amount, seller, buyer, etc.) |
| **Check Agent** | 合规校验专家 | Validates invoice authenticity, detects duplicates, verifies amount match, checks budget |
| **Approval Agent** | 审批路由专家 | Determines approval workflow based on validation results and expense amount |

### Workflow

```
Invoice Image → [OCR Agent] → Structured Data → [Check Agent] → Validation Result → [Approval Agent] → Route Decision
```

### Sequential Process

1. **OCR Recognition**: Extract text and structured data from invoice image
2. **Compliance Check**: Validate against business rules (duplicates, amount match, budget)
3. **Approval Routing**: Determine correct approval path based on amount and validation status

### Rules

- **Error level issues**: Reject expense
- **Warning level issues**: Flag for manual review
- **Amount >= 5000**: Require both finance and manager approval
- **Amount < 5000**: Finance approval only

## Usage

```python
from backend.app.agents import ExpenseOrchestrator

orchestrator = ExpenseOrchestrator()

result = orchestrator.process_expense(
    invoice_path="/path/to/invoice.jpg",
    expense_data={
        "amount": 1500.00,
        "department": "IT",
        "submitter": "zhangsan"
    }
)
```

## Components

- `orchestrator.py`: Main coordinator managing the agent crew
- `tasks.py`: Task definitions for each agent
- `tools.py`: Utility classes (InvoiceParser, ValidationRules)
- `agents_init.py`: Module exports

## Dependencies

All dependencies are listed in `requirements.txt` and include:
- crewai==0.80.0
- fastapi==0.109.0
- sqlalchemy==2.0.25
- Other supporting libraries