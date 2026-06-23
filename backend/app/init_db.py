from app.database import engine, Base, SessionLocal
from app.models import User, UserRole
from app.utils.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="系统管理员",
                role=UserRole.ADMIN,
                department="IT"
            )
            db.add(admin)

        if not db.query(User).filter(User.username == "finance").first():
            finance = User(
                username="finance",
                hashed_password=get_password_hash("finance123"),
                full_name="财务人员",
                role=UserRole.FINANCE,
                department="财务部"
            )
            db.add(finance)

        if not db.query(User).filter(User.username == "employee").first():
            employee = User(
                username="employee",
                hashed_password=get_password_hash("employee123"),
                full_name="测试员工",
                role=UserRole.EMPLOYEE,
                department="研发部"
            )
            db.add(employee)

        if not db.query(User).filter(User.username == "manager").first():
            manager = User(
                username="manager",
                hashed_password=get_password_hash("manager123"),
                full_name="主管",
                role=UserRole.MANAGER,
                department="管理部"
            )
            db.add(manager)

        db.commit()
        print("数据库初始化完成！")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()