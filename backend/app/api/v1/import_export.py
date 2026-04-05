from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Order, Product, Material, Resource, Schedule
import pandas as pd
from io import BytesIO
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/orders/import")
async def import_orders(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    从Excel导入订单

    Excel格式要求:
    - order_no: 订单号
    - product_code: 产品编码
    - quantity: 数量
    - priority: 优先级 (0-2)
    - due_date: 交期 (YYYY-MM-DD)
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="只支持Excel文件 (.xlsx, .xls)")

    try:
        # 读取Excel文件
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))

        # 验证必需列
        required_columns = ['order_no', 'product_code', 'quantity', 'priority', 'due_date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需列: {', '.join(missing_columns)}"
            )

        # 导入订单
        imported_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                # 查找产品
                product = db.query(Product).filter(
                    Product.product_code == row['product_code']
                ).first()

                if not product:
                    errors.append(f"行 {index + 2}: 产品 {row['product_code']} 不存在")
                    continue

                # 检查订单号是否已存在
                existing_order = db.query(Order).filter(
                    Order.order_no == row['order_no']
                ).first()

                if existing_order:
                    errors.append(f"行 {index + 2}: 订单号 {row['order_no']} 已存在")
                    continue

                # 创建订单
                order = Order(
                    order_no=row['order_no'],
                    product_id=product.id,
                    quantity=float(row['quantity']),
                    priority=int(row['priority']),
                    due_date=pd.to_datetime(row['due_date']),
                    status='pending'
                )
                db.add(order)
                imported_count += 1

            except Exception as e:
                errors.append(f"行 {index + 2}: {str(e)}")

        db.commit()

        return {
            "status": "success",
            "imported_count": imported_count,
            "total_rows": len(df),
            "errors": errors
        }

    except Exception as e:
        logger.error(f"导入订单失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")


@router.get("/orders/export")
async def export_orders(db: Session = Depends(get_db)):
    """导出所有订单到Excel"""
    try:
        # 查询订单
        orders = db.query(Order).all()

        # 构建数据
        data = []
        for order in orders:
            product = db.query(Product).filter(Product.id == order.product_id).first()
            data.append({
                '订单号': order.order_no,
                '产品编码': product.product_code if product else '',
                '产品名称': product.name if product else '',
                '数量': order.quantity,
                '优先级': order.priority,
                '交期': order.due_date.strftime('%Y-%m-%d'),
                '状态': order.status,
                '创建时间': order.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        # 创建DataFrame
        df = pd.DataFrame(data)

        # 写入Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='订单', index=False)

            # 调整列宽
            worksheet = writer.sheets['订单']
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).apply(len).max(), len(col)) + 2
                worksheet.set_column(i, i, max_len)

        output.seek(0)

        # 返回文件
        filename = f"orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        logger.error(f"导出订单失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@router.get("/schedules/export")
async def export_schedules(db: Session = Depends(get_db)):
    """导出排产结果到Excel"""
    try:
        # 查询排产结果
        schedules = db.query(Schedule).all()

        if not schedules:
            raise HTTPException(status_code=404, detail="没有排产结果可导出")

        # 构建数据
        data = []
        for schedule in schedules:
            order = db.query(Order).filter(Order.id == schedule.order_id).first()
            resource = db.query(Resource).filter(Resource.id == schedule.resource_id).first()
            product = db.query(Product).filter(Product.id == order.product_id).first() if order else None

            duration = (schedule.end_time - schedule.start_time).total_seconds() / 3600

            data.append({
                '排产ID': schedule.id,
                '订单号': order.order_no if order else '',
                '产品名称': product.name if product else '',
                '数量': order.quantity if order else '',
                '资源编码': resource.resource_code if resource else '',
                '资源名称': resource.name if resource else '',
                '开始时间': schedule.start_time.strftime('%Y-%m-%d %H:%M:%S'),
                '结束时间': schedule.end_time.strftime('%Y-%m-%d %H:%M:%S'),
                '时长(小时)': round(duration, 2),
                '状态': schedule.status
            })

        # 创建DataFrame
        df = pd.DataFrame(data)

        # 写入Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='排产结果', index=False)

            # 调整列宽
            worksheet = writer.sheets['排产结果']
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).apply(len).max(), len(col)) + 2
                worksheet.set_column(i, i, max_len)

        output.seek(0)

        # 返回文件
        filename = f"schedules_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        logger.error(f"导出排产结果失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@router.get("/template/orders")
async def download_order_template():
    """下载订单导入模板"""
    # 创建模板数据
    template_data = {
        'order_no': ['ORD0001', 'ORD0002'],
        'product_code': ['P001', 'P002'],
        'quantity': [10, 20],
        'priority': [1, 2],
        'due_date': ['2024-12-31', '2024-12-30']
    }

    df = pd.DataFrame(template_data)

    # 写入Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='订单模板', index=False)

        # 添加说明
        workbook = writer.book
        worksheet = writer.sheets['订单模板']

        # 添加注释
        worksheet.write('A8', '说明:')
        worksheet.write('A9', '- order_no: 订单号，必须唯一')
        worksheet.write('A10', '- product_code: 产品编码，必须在系统中存在')
        worksheet.write('A11', '- quantity: 订单数量')
        worksheet.write('A12', '- priority: 优先级，0-2，数字越大优先级越高')
        worksheet.write('A13', '- due_date: 交期，格式 YYYY-MM-DD')

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=order_template.xlsx"}
    )
