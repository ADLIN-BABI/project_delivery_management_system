import logging
from sqlalchemy import text, select
from app.core.database import engine, Base, SessionLocal
import app.models  # Register all models: User, AuditLog, Project, ProjectTask, Client, Delivery
from app.models.user import User
from app.models.enums import UserRole, UserStatus
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash

logger = logging.getLogger("pdm.backend.init_db")


def init_db():
    """
    Initializes database schemas, enum types, and default super admin user if absent.
    Safe and idempotent.
    """
    try:
        # 1. Ensure Postgres enum types exist
        with engine.connect() as connection:
            connection.execute(
                text(
                    """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
                        CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
                        CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'BANNED', 'INACTIVE');
                    END IF;
                END$$;
            """
                )
            )
            connection.commit()

        # 2. Create all missing tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")

        # 3. Seed default Super Admin accounts if not existing
        with SessionLocal() as db:
            default_accounts = [
                {
                    "email": "superadmin@wenoxo.com",
                    "full_name": "Super Administrator",
                    "password": "Admin@123!",
                    "role": UserRole.SUPER_ADMIN,
                },
                {
                    "email": "admin@gmail.com",
                    "full_name": "Administrator",
                    "password": "123456",
                    "role": UserRole.SUPER_ADMIN,
                },
            ]

            for acc in default_accounts:
                existing = db.execute(
                    select(User).where(User.email == acc["email"])
                ).scalar_one_or_none()

                if not existing:
                    logger.info(f"Default user '{acc['email']}' not found. Creating account...")
                    u = User(
                        full_name=acc["full_name"],
                        email=acc["email"],
                        password_hash=get_password_hash(acc["password"]),
                        role=acc["role"],
                        status=UserStatus.ACTIVE,
                    )
                    db.add(u)
                    db.flush()

                    audit = AuditLog(
                        user_id=u.id,
                        action="BOOTSTRAP_DEFAULT_ADMIN",
                        entity_type="User",
                        entity_id=str(u.id),
                        new_values={
                            "email": u.email,
                            "role": u.role.value,
                            "status": u.status.value,
                        },
                    )
                    db.add(audit)
                    logger.info(f"Default user created: {acc['email']}")
                else:
                    logger.info(f"Existing user verified: {existing.email}")

            db.commit()
    except Exception as exc:
        logger.error(f"Error during database initialization: {exc}", exc_info=True)
        raise exc
