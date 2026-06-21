from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Message, Expense, User, UserRole, Notification, ChatReadStatus
from app.utils.security import get_current_user
from datetime import datetime
from sqlalchemy import func

router = APIRouter(prefix="/chat", tags=["聊天"])


class SendMessageRequest(BaseModel):
    content: str


@router.get("/{expense_id}")
def get_messages(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")

    if current_user.role == UserRole.EMPLOYEE and expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看")

    messages = db.query(Message).filter(
        Message.expense_id == expense_id
    ).order_by(Message.created_at.asc()).all()

    read_status = db.query(ChatReadStatus).filter(
        ChatReadStatus.user_id == current_user.id,
        ChatReadStatus.expense_id == expense_id
    ).first()
    if read_status:
        read_status.last_read_at = datetime.utcnow()
    else:
        db.add(ChatReadStatus(user_id=current_user.id, expense_id=expense_id))
    db.commit()

    return [{
        "id": m.id,
        "expense_id": m.expense_id,
        "sender_id": m.sender_id,
        "sender_name": m.sender.full_name if m.sender else "",
        "sender_role": m.sender.role.value if m.sender else "",
        "content": m.content,
        "created_at": m.created_at.isoformat() if m.created_at else None
    } for m in messages]


@router.post("/{expense_id}")
def send_message(
    expense_id: int,
    req: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="报销单不存在")

    if current_user.role == UserRole.EMPLOYEE and expense.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")

    if not req.content.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    msg = Message(
        expense_id=expense_id,
        sender_id=current_user.id,
        content=req.content.strip()
    )
    db.add(msg)

    if current_user.role == UserRole.EMPLOYEE:
        finance_users = db.query(User).filter(User.role.in_([UserRole.FINANCE, UserRole.ADMIN])).all()
        for fu in finance_users:
            db.add(Notification(
                user_id=fu.id,
                title=f"{current_user.full_name}回复了{expense.expense_no}",
                content=req.content.strip()[:100],
                expense_id=expense_id
            ))
    else:
        db.add(Notification(
            user_id=expense.employee_id,
            title=f"{current_user.full_name}对{expense.expense_no}发来消息",
            content=req.content.strip()[:100],
            expense_id=expense_id
        ))

    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "expense_id": msg.expense_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name,
        "sender_role": current_user.role.value,
        "content": msg.content,
        "created_at": msg.created_at.isoformat()
    }


@router.get("/list/my")
def list_my_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        expense_ids = db.query(Expense.id).filter(
            Expense.employee_id == current_user.id,
            Expense.is_deleted == 0
        ).subquery()
    else:
        expense_ids = db.query(Expense.id).filter(
            Expense.is_deleted == 0
        ).subquery()

    messages = db.query(Message).filter(
        Message.expense_id.in_(expense_ids)
    ).order_by(Message.created_at.desc()).limit(200).all()

    read_statuses = {}
    for rs in db.query(ChatReadStatus).filter(
        ChatReadStatus.user_id == current_user.id
    ).all():
        read_statuses[rs.expense_id] = rs.last_read_at

    expense_map = {}
    for m in messages:
        if m.expense_id not in expense_map:
            last_read = read_statuses.get(m.expense_id)
            unread = 0
            if m.sender_id != current_user.id:
                if not last_read or m.created_at > last_read:
                    unread = 1

            expense_map[m.expense_id] = {
                "expense_id": m.expense_id,
                "expense_no": m.expense.expense_no if m.expense else "",
                "last_message": m.content,
                "last_sender": m.sender.full_name if m.sender else "",
                "last_time": m.created_at.isoformat() if m.created_at else None,
                "unread": unread
            }

    return list(expense_map.values())


@router.get("/unread/count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.EMPLOYEE:
        expense_ids = db.query(Expense.id).filter(
            Expense.employee_id == current_user.id,
            Expense.is_deleted == 0
        ).all()
    else:
        expense_ids = db.query(Expense.id).filter(
            Expense.is_deleted == 0
        ).all()
    expense_ids = [e[0] for e in expense_ids]

    if not expense_ids:
        return {"count": 0}

    read_statuses = {}
    for rs in db.query(ChatReadStatus).filter(
        ChatReadStatus.user_id == current_user.id,
        ChatReadStatus.expense_id.in_(expense_ids)
    ).all():
        read_statuses[rs.expense_id] = rs.last_read_at

    count = 0
    for eid in expense_ids:
        last_read = read_statuses.get(eid)
        if last_read:
            has_new = db.query(Message).filter(
                Message.expense_id == eid,
                Message.sender_id != current_user.id,
                Message.created_at > last_read
            ).first()
            if has_new:
                count += 1
        else:
            has_any = db.query(Message).filter(
                Message.expense_id == eid,
                Message.sender_id != current_user.id
            ).first()
            if has_any:
                count += 1

    return {"count": count}
