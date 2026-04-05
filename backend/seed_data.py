"""
测试数据种子文件
用于快速创建测试数据
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import Product, Order, Material, BOM, Resource, Calendar, SchedulingConfig
from app.core.database import SessionLocal


def seed_data():
    """创建测试数据"""
    db = SessionLocal()

    try:
        print("开始创建测试数据...")

        # 1. 创建产品
        products = [
            Product(product_code="P001", name="产品A", description="标准产品A", processing_time=60),
            Product(product_code="P002", name="产品B", description="标准产品B", processing_time=90),
            Product(product_code="P003", name="产品C", description="标准产品C", processing_time=120),
        ]
        db.add_all(products)
        db.flush()
        print(f"✓ 创建了 {len(products)} 个产品")

        # 2. 创建订单
        base_date = datetime.now()
        orders = [
            Order(
                order_no=f"ORD{str(i+1).zfill(4)}",
                product_id=products[i % 3].id,
                quantity=10 + i * 5,
                priority=i % 3,
                due_date=base_date + timedelta(days=i+1),
                status="pending"
            )
            for i in range(10)
        ]
        db.add_all(orders)
        db.flush()
        print(f"✓ 创建了 {len(orders)} 个订单")

        # 3. 创建物料
        materials = [
            Material(material_code="M001", name="原料A", unit="kg", stock_quantity=1000, lead_time=3),
            Material(material_code="M002", name="原料B", unit="kg", stock_quantity=800, lead_time=5),
            Material(material_code="M003", name="原料C", unit="pcs", stock_quantity=500, lead_time=2),
            Material(material_code="M004", name="原料D", unit="m", stock_quantity=2000, lead_time=7),
        ]
        db.add_all(materials)
        db.flush()
        print(f"✓ 创建了 {len(materials)} 个物料")

        # 4. 创建BOM
        bom_items = [
            BOM(product_id=products[0].id, material_id=materials[0].id, quantity=2.5, sequence=1),
            BOM(product_id=products[0].id, material_id=materials[1].id, quantity=1.0, sequence=2),
            BOM(product_id=products[1].id, material_id=materials[1].id, quantity=3.0, sequence=1),
            BOM(product_id=products[1].id, material_id=materials[2].id, quantity=5.0, sequence=2),
            BOM(product_id=products[2].id, material_id=materials[2].id, quantity=8.0, sequence=1),
            BOM(product_id=products[2].id, material_id=materials[3].id, quantity=10.0, sequence=2),
        ]
        db.add_all(bom_items)
        db.flush()
        print(f"✓ 创建了 {len(bom_items)} 个BOM记录")

        # 5. 创建资源
        resources = [
            Resource(resource_code="M001", name="加工中心1号", type="machine", capacity=1.0, status="available"),
            Resource(resource_code="M002", name="加工中心2号", type="machine", capacity=1.0, status="available"),
            Resource(resource_code="M003", name="加工中心3号", type="machine", capacity=0.8, status="available"),
            Resource(resource_code="W001", name="操作工A", type="worker", capacity=1.0, status="available"),
            Resource(resource_code="W002", name="操作工B", type="worker", capacity=1.0, status="available"),
        ]
        db.add_all(resources)
        db.flush()
        print(f"✓ 创建了 {len(resources)} 个资源")

        # 6. 创建日历（工作日历）
        from datetime import time, date
        calendars = []
        for resource in resources:
            # 为每个资源创建未来7天的工作日历
            for day_offset in range(7):
                work_date = date.today() + timedelta(days=day_offset)
                # 周一到周五工作
                is_working = work_date.weekday() < 5
                calendars.append(
                    Calendar(
                        resource_id=resource.id,
                        date=work_date,
                        shift_start=time(8, 0),
                        shift_end=time(17, 0),
                        is_working_day=is_working
                    )
                )
        db.add_all(calendars)
        db.flush()
        print(f"✓ 创建了 {len(calendars)} 个日历记录")

        # 7. 创建默认排产配置
        default_config = SchedulingConfig(
            name="默认配置",
            parameters={
                "objective": "minimize_makespan",
                "max_solve_time": 300,
                "constraints": {
                    "resource_capacity": True,
                    "material_availability": True,
                    "sequence": True
                }
            },
            is_default=True,
            created_by="system"
        )
        db.add(default_config)
        db.flush()
        print(f"✓ 创建了默认排产配置")

        db.commit()
        print("\n✅ 测试数据创建完成！")
        print(f"   - {len(products)} 个产品")
        print(f"   - {len(orders)} 个订单")
        print(f"   - {len(materials)} 个物料")
        print(f"   - {len(bom_items)} 个BOM记录")
        print(f"   - {len(resources)} 个资源")
        print(f"   - {len(calendars)} 个日历记录")
        print(f"   - 1 个排产配置")

    except Exception as e:
        print(f"❌ 创建测试数据失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
