"""Initial Route 53 Clone Schema Migration

Revision ID: 001_initial_route53_schema
Revises: 
Create Date: 2026-08-13 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_initial_route53_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. sessions table
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_sessions_token"), "sessions", ["token"], unique=True)

    # 3. hosted_zones table
    op.create_table(
        "hosted_zones",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("caller_reference", sa.String(length=128), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_private", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("record_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("caller_reference"),
    )
    op.create_index(op.f("ix_hosted_zones_user_id"), "hosted_zones", ["user_id"], unique=False)
    op.create_index(op.f("ix_hosted_zones_name"), "hosted_zones", ["name"], unique=False)

    # 4. dns_records table
    op.create_table(
        "dns_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("hosted_zone_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("ttl", sa.Integer(), nullable=False, server_default=sa.text("300")),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("is_system_record", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["hosted_zone_id"], ["hosted_zones.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_dns_records_hosted_zone_id"), "dns_records", ["hosted_zone_id"], unique=False)
    op.create_index(op.f("ix_dns_records_name"), "dns_records", ["name"], unique=False)
    op.create_index(op.f("ix_dns_records_type"), "dns_records", ["type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dns_records_type"), table_name="dns_records")
    op.drop_index(op.f("ix_dns_records_name"), table_name="dns_records")
    op.drop_index(op.f("ix_dns_records_hosted_zone_id"), table_name="dns_records")
    op.drop_table("dns_records")

    op.drop_index(op.f("ix_hosted_zones_name"), table_name="hosted_zones")
    op.drop_index(op.f("ix_hosted_zones_user_id"), table_name="hosted_zones")
    op.drop_table("hosted_zones")

    op.drop_index(op.f("ix_sessions_token"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
