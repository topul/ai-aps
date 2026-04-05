# Import all models here for Alembic to detect them
from app.models.order import Order, Product
from app.models.material import Material, BOM
from app.models.resource import Resource
from app.models.calendar import Calendar
from app.models.schedule import Schedule, SchedulingConfig
from app.models.user import User
from app.models.dependency import TaskDependency, DependencyType
from app.models.ai_config import AIConfig

__all__ = [
    "Order",
    "Product",
    "Material",
    "BOM",
    "Resource",
    "Calendar",
    "Schedule",
    "SchedulingConfig",
    "User",
    "TaskDependency",
    "DependencyType",
    "AIConfig",
]
