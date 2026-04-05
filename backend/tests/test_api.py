import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# 测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    """测试健康检查端点"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root():
    """测试根端点"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "AI-APS API"


def test_create_order():
    """测试创建订单"""
    # 先创建产品
    product_data = {
        "product_code": "TEST001",
        "name": "测试产品",
        "processing_time": 60
    }
    # TODO: 需要先实现产品 API

    order_data = {
        "order_no": "TEST001",
        "product_id": 1,
        "quantity": 10,
        "priority": 1,
        "due_date": "2024-12-31T23:59:59"
    }
    # response = client.post("/api/v1/orders", json=order_data)
    # assert response.status_code == 200


def test_list_orders():
    """测试获取订单列表"""
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_material():
    """测试创建物料"""
    material_data = {
        "material_code": "M001",
        "name": "测试物料",
        "unit": "kg",
        "stock_quantity": 100,
        "lead_time": 3
    }
    response = client.post("/api/v1/materials", json=material_data)
    assert response.status_code == 200
    data = response.json()
    assert data["material_code"] == "M001"
    assert data["name"] == "测试物料"


def test_list_materials():
    """测试获取物料列表"""
    response = client.get("/api/v1/materials")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_resource():
    """测试创建资源"""
    resource_data = {
        "resource_code": "R001",
        "name": "测试资源",
        "type": "machine",
        "capacity": 1.0,
        "status": "available"
    }
    response = client.post("/api/v1/resources", json=resource_data)
    assert response.status_code == 200
    data = response.json()
    assert data["resource_code"] == "R001"
    assert data["name"] == "测试资源"


def test_list_resources():
    """测试获取资源列表"""
    response = client.get("/api/v1/resources")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
