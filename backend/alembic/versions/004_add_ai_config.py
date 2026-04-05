"""add ai config

Revision ID: 004
Revises: 003
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 创建AI配置表
    op.create_table(
        'ai_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('api_key', sa.String(), nullable=False),
        sa.Column('api_base', sa.String(), nullable=True),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 创建索引
    op.create_index('ix_ai_configs_provider', 'ai_configs', ['provider'])
    op.create_index('ix_ai_configs_is_default', 'ai_configs', ['is_default'])


def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_ai_configs_is_default', table_name='ai_configs')
    op.drop_index('ix_ai_configs_provider', table_name='ai_configs')

    # 删除表
    op.drop_table('ai_configs')
