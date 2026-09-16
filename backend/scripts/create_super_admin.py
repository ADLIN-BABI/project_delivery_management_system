#!/usr/bin/env python3
"""
Bootstrap script for initial Super Admin creation.
"""
import sys
import os
import argparse
import getpass
import re

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.enums import UserRole, UserStatus
from app.models.audit_log import AuditLog

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"


def validate_email(email: str) -> bool:
    return bool(re.match(EMAIL_REGEX, email.strip()))


def create_super_admin(
    full_name: str,
    email: str,
    password: str,
    phone: str = None,
    force: bool = False,
) -> bool:
    db = SessionLocal()
    try:
        existing_super_admin = db.execute(
            select(User).where(User.role == UserRole.SUPER_ADMIN)
        ).scalar_one_or_none()

        if existing_super_admin and not force:
            print("\n[ERROR] A Super Admin already exists in the system:")
            print(f"  ID: {existing_super_admin.id}")
            print(f"  Email: {existing_super_admin.email}")
            print(f"  Created At: {existing_super_admin.created_at}")
            print("To override or create an additional Super Admin, use the '--force' flag.\n")
            return False

        existing_user = db.execute(
            select(User).where(User.email == email.strip().lower())
        ).scalar_one_or_none()

        if existing_user:
            print(f"\n[ERROR] A user with email '{email}' already exists.")
            return False

        password_hash = get_password_hash(password)
        super_admin = User(
            full_name=full_name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            phone=phone.strip() if phone else None,
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
        )
        db.add(super_admin)
        db.flush()

        audit = AuditLog(
            user_id=super_admin.id,
            action="BOOTSTRAP_SUPER_ADMIN",
            entity_type="User",
            entity_id=str(super_admin.id),
            new_values={
                "email": super_admin.email,
                "role": super_admin.role.value,
                "status": super_admin.status.value,
            },
        )
        db.add(audit)
        db.commit()

        print("\n" + "=" * 60)
        print(" [SUCCESS] Super Admin created successfully!")
        print("=" * 60)
        print(f"  ID:         {super_admin.id}")
        print(f"  Name:       {super_admin.full_name}")
        print(f"  Email:      {super_admin.email}")
        print(f"  Role:       {super_admin.role.value}")
        print(f"  Status:     {super_admin.status.value}")
        print("=" * 60 + "\n")
        return True

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Failed to create Super Admin: {exc}\n")
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Bootstrap the initial Super Admin account.")
    parser.add_argument("--name", help="Full Name of the Super Admin")
    parser.add_argument("--email", help="Email Address")
    parser.add_argument("--password", help="Password")
    parser.add_argument("--phone", help="Phone Number (optional)")
    parser.add_argument("--force", action="store_true", help="Force creation even if Super Admin exists")

    args = parser.parse_args()

    if args.name and args.email and args.password:
        if not validate_email(args.email):
            print(f"[ERROR] Invalid email format: {args.email}")
            sys.exit(1)
        if len(args.password) < 8:
            print("[ERROR] Password must be at least 8 characters long.")
            sys.exit(1)

        success = create_super_admin(
            full_name=args.name,
            email=args.email,
            password=args.password,
            phone=args.phone,
            force=args.force,
        )
        sys.exit(0 if success else 1)

    print("\n" + "=" * 60)
    print(" PROJECT DELIVERY MANAGEMENT SYSTEM - SUPER ADMIN BOOTSTRAP")
    print("=" * 60)

    try:
        full_name = input("Enter Full Name: ").strip()
        while not full_name:
            print("Name cannot be empty.")
            full_name = input("Enter Full Name: ").strip()

        email = input("Enter Email Address: ").strip()
        while not validate_email(email):
            print("Invalid email format.")
            email = input("Enter Email Address: ").strip()

        phone = input("Enter Phone Number (optional, press Enter to skip): ").strip() or None

        password = getpass.getpass("Enter Password (min 8 characters): ")
        while len(password) < 8:
            print("Password must be at least 8 characters long.")
            password = getpass.getpass("Enter Password (min 8 characters): ")

        confirm_password = getpass.getpass("Confirm Password: ")
        while password != confirm_password:
            print("Passwords do not match. Please try again.")
            password = getpass.getpass("Enter Password: ")
            confirm_password = getpass.getpass("Confirm Password: ")

        success = create_super_admin(
            full_name=full_name,
            email=email,
            password=password,
            phone=phone,
            force=args.force,
        )
        sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)


if __name__ == "__main__":
    main()
