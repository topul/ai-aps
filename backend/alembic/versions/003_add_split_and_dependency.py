"""add split and dependency

Revision ID: 003
Revises: 002
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 添加订单拆单字段
    op.add_column('orders', sa.Column('parent_order_id', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('split_strategy', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('split_index', sa.Integer(), server_default='0', nullable=False))
    op.add_column('orders', sa.Column('is_split', sa.Boolean(), server_default='false', nullable=False))

    # 添加外键约束
    op.create_foreign_key(
        'fk_orders_parent_order_id',
        'orders', 'orders',
        ['parent_order_id'], ['id'],
        ondelete='CASCADE'
    )

    # 创建任务依赖表
    op.create_table(
        'task_dependencies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('predecessor_id', sa.Integer(), nullable=False),
        sa.Column('successor_id', sa.Integer(), nullable=False),
        sa.Column('dependency_type', sa.Enum('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish', name='dependencytype'), nullable=False),
        sa.Column('lag_time', sa.Integer(), server_default='0', nullable=False),
        sa.ForeignKeyConstraint(['predecessor_id'], ['schedules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['successor_id'], ['schedules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 创建索引
    op.create_index('ix_task_dependencies_predecessor_id', 'task_dependencies', ['predecessor_id'])
    op.create_index('ix_task_dependencies_successor_id', 'task_dependencies', ['successor_id'])


def downgrade() -> None:
    # 删除任务依赖表
    op.drop_index('ix_task_dependencies_successor_id', table_name='task_dependencies')
    op.drop_index('ix_task_dependencies_predecessor_id', table_name='task_dependencies')
    op.drop_table('task_dependencies')

    # 删除订单拆单字段
    op.drop_constraint('fk_orders_parent_order_id', 'orders', type_='foreignkey')
    op.drop_column('orders', 'is_split')
    op.drop_column('orders', 'split_index')
    op.drop_column('orders', 'split_strategy')
    op.drop_column('orders', 'parent_order_id')
