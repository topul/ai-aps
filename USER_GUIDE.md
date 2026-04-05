# AI-APS 智能排产系统 - 使用指南

## 📖 目录

1. [系统概述](#系统概述)
2. [快速开始](#快速开始)
3. [功能详解](#功能详解)
4. [API 使用](#api-使用)
5. [常见问题](#常见问题)
6. [最佳实践](#最佳实践)

---

## 系统概述

AI-APS 是一个基于 Google OR-Tools 的智能排产系统，帮助企业优化生产计划，提高资源利用率。

### 核心功能

- 🎯 **智能排产**: 基于约束编程的自动排产
- 📊 **可视化**: 甘特图展示排产结果
- 📈 **分析报告**: 资源利用率、准时率等指标
- 💬 **AI 对话**: 自然语言交互（开发中）
- 📦 **数据管理**: 订单、物料、资源等基础数据

### 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   FastAPI   │────▶│ PostgreSQL  │
│  前端界面    │     │   后端API   │     │   数据库    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Celery    │
                    │  异步任务    │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  OR-Tools   │
                    │  排产引擎    │
                    └─────────────┘
```

---

## 快速开始

### 1. 启动系统

```bash
cd /Users/topul/Documents/code/ai-aps

# 一键启动
./start.sh

# 等待服务启动（约30秒）
```

### 2. 访问系统

- **前端界面**: http://localhost:5173
- **API 文档**: http://localhost:8000/docs
- **后端健康检查**: http://localhost:8000/health

### 3. 查看测试数据

系统已自动创建测试数据：
- 3 个产品（产品A、B、C）
- 10 个订单（ORD0001-ORD0010）
- 4 个物料（原料A、B、C、D）
- 5 个资源（3台机器 + 2个工人）

---

## 功能详解

### 1. 数据管理

#### 1.1 订单管理

**访问路径**: 数据管理 → 订单管理

**功能**:
- 查看所有订单
- 创建新订单
- 查看订单详情

**字段说明**:
- **订单号**: 唯一标识，如 ORD0001
- **产品ID**: 关联的产品
- **数量**: 订单数量
- **优先级**: 0-2，数字越大优先级越高
- **交期**: 期望完成日期
- **状态**: pending（待排产）、scheduled（已排产）等

**操作示例**:
```bash
# 通过 API 创建订单
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_no": "ORD0011",
    "product_id": 1,
    "quantity": 20,
    "priority": 2,
    "due_date": "2024-12-31T23:59:59"
  }'
```

#### 1.2 物料管理

**访问路径**: 数据管理 → 物料管理

**功能**:
- 查看物料库存
- 添加新物料
- 更新库存数量

**字段说明**:
- **物料编码**: 唯一标识，如 M001
- **名称**: 物料名称
- **单位**: kg、pcs、m 等
- **库存数量**: 当前库存
- **提前期**: 采购提前期（天）

#### 1.3 资源管理

**访问路径**: 数据管理 → 资源管理

**功能**:
- 查看生产资源
- 添加新资源
- 更新资源状态

**资源类型**:
- **machine**: 机器设备
- **worker**: 操作工人
- **tool**: 工具设备

**资源状态**:
- **available**: 可用
- **busy**: 忙碌
- **maintenance**: 维护中
- **offline**: 离线

### 2. 智能排产

#### 2.1 执行排产

**访问路径**: 智能排产

**步骤**:
1. 在左侧订单列表中勾选要排产的订单
2. 点击右上角"执行排产"按钮
3. 等待排产完成（通常几秒到几分钟）
4. 查看甘特图展示的排产结果

**排产算法**:
- 使用 Google OR-Tools CP-SAT 求解器
- 优化目标：最小化最大完工时间
- 考虑因素：
  - 资源容量约束
  - 订单优先级
  - 交期约束
  - 物料可用性

#### 2.2 查看排产结果

**甘特图说明**:
- 横轴：时间轴
- 纵轴：资源（按资源ID分组）
- 色块：排产任务
  - 不同颜色代表不同订单
  - 鼠标悬停查看详情

**统计信息**:
- 总任务数
- 使用资源数
- 总时长

#### 2.3 排产分析

**资源利用率**:
- 显示每个资源的使用时间和利用率百分比
- 利用率 = 使用时间 / 总时间跨度

**准时率**:
- 准时订单数 / 总订单数
- 平均延期时间（小时）

**瓶颈资源**:
- 任务数最多的前3个资源
- 帮助识别生产瓶颈

**完工统计**:
- 平均任务时长
- 最短/最长任务时长
- 总时长

### 3. 仪表盘

**访问路径**: 仪表盘

**功能**:
- 快速查看排产结果
- AI 对话助手（开发中）
- 关键指标概览

---

## API 使用

### 1. API 文档

访问 http://localhost:8000/docs 查看完整的 API 文档（Swagger UI）

### 2. 常用 API

#### 2.1 获取订单列表

```bash
GET /api/v1/orders?skip=0&limit=100
```

**响应示例**:
```json
[
  {
    "id": 1,
    "order_no": "ORD0001",
    "product_id": 1,
    "quantity": 10,
    "priority": 0,
    "due_date": "2024-04-05T00:00:00",
    "status": "pending",
    "created_at": "2024-04-04T16:00:00"
  }
]
```

#### 2.2 执行排产

```bash
POST /api/v1/scheduling/run
Content-Type: application/json

{
  "order_ids": [1, 2, 3],
  "config_id": 1,
  "async_mode": false
}
```

**响应示例**:
```json
{
  "task_id": null,
  "status": "completed",
  "message": "排产完成，生成 3 个排产计划"
}
```

#### 2.3 获取排产结果

```bash
GET /api/v1/scheduling/schedules
```

**响应示例**:
```json
[
  {
    "id": 1,
    "order_id": 1,
    "resource_id": 1,
    "start_time": "2024-04-04T08:00:00",
    "end_time": "2024-04-04T09:00:00",
    "status": "pending"
  }
]
```

#### 2.4 分析排产结果

```bash
POST /api/v1/scheduling/analyze
Content-Type: application/json

[1, 2, 3]
```

---

## 常见问题

### Q1: 排产失败怎么办？

**可能原因**:
1. 没有可用资源
2. 订单数据不完整
3. 求解超时

**解决方法**:
1. 检查资源状态是否为 available
2. 确保订单关联的产品有加工时间
3. 增加求解时间限制（修改配置）

### Q2: 如何修改排产配置？

**方法1**: 通过 API
```bash
POST /api/v1/scheduling/configs
{
  "name": "自定义配置",
  "parameters": {
    "objective": "minimize_makespan",
    "max_solve_time": 600,
    "constraints": {
      "resource_capacity": true,
      "material_availability": true
    }
  }
}
```

**方法2**: 直接修改数据库
```sql
UPDATE scheduling_configs 
SET parameters = '{"objective": "minimize_tardiness", "max_solve_time": 600}'
WHERE id = 1;
```

### Q3: 如何导入大量数据？

**方法1**: 使用 API 批量导入
```python
import requests

orders = [
    {"order_no": f"ORD{i:04d}", "product_id": 1, "quantity": 10, ...}
    for i in range(100)
]

for order in orders:
    requests.post("http://localhost:8000/api/v1/orders", json=order)
```

**方法2**: 直接导入数据库
```bash
# 准备 CSV 文件
# 使用 PostgreSQL COPY 命令导入
docker compose exec postgres psql -U postgres -d ai_aps -c "\COPY orders FROM '/path/to/orders.csv' CSV HEADER"
```

### Q4: 如何备份数据？

```bash
# 备份数据库
docker compose exec postgres pg_dump -U postgres ai_aps > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T postgres psql -U postgres ai_aps < backup_20240404.sql
```

### Q5: 如何查看日志？

```bash
# 查看所有日志
docker compose logs -f

# 查看后端日志
docker compose logs -f backend

# 查看 Celery 日志
docker compose logs -f celery-worker

# 查看最近100行
docker compose logs --tail=100 backend
```

---

## 最佳实践

### 1. 数据准备

**建议顺序**:
1. 创建产品（设置加工时间）
2. 创建物料
3. 创建 BOM（产品-物料关系）
4. 创建资源
5. 创建工作日历
6. 创建订单
7. 执行排产

### 2. 排产优化

**提高排产质量**:
1. 合理设置订单优先级
2. 准确设置产品加工时间
3. 考虑资源产能系数
4. 设置合理的交期

**提高求解速度**:
1. 减少订单数量（分批排产）
2. 减少资源数量
3. 降低求解时间限制
4. 使用更快的硬件

### 3. 系统维护

**定期任务**:
- 每天备份数据库
- 每周清理过期排产结果
- 每月检查系统性能

**监控指标**:
- API 响应时间
- 排产成功率
- 资源利用率
- 数据库大小

### 4. 性能优化

**数据库优化**:
```sql
-- 创建索引
CREATE INDEX idx_orders_due_date ON orders(due_date);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);

-- 定期清理
DELETE FROM schedules WHERE created_at < NOW() - INTERVAL '30 days';
```

**Celery 优化**:
```bash
# 增加并发数
celery -A app.tasks.celery_app worker --concurrency=8
```

---

## 附录

### A. 数据模型关系

```
Product (产品)
    ↓ 1:N
Order (订单) ──→ Schedule (排产结果) ──→ Resource (资源)
    ↓ N:M                                      ↓ 1:N
Material (物料) ←── BOM (物料清单)        Calendar (日历)
```

### B. 排产算法伪代码

```python
for each order:
    for each resource:
        create optional task
        
for each order:
    ensure exactly one resource is selected
    
for each resource:
    ensure no task overlap
    
minimize: max(completion_time) + priority_penalty + tardiness_penalty
```

### C. 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接 | postgresql://... |
| REDIS_URL | Redis 连接 | redis://... |
| MAX_SOLVE_TIME_SECONDS | 最大求解时间 | 300 |
| CORS_ORIGINS | 允许的跨域来源 | http://localhost:5173 |

---

## 获取帮助

- 📖 查看文档: README.md, DEPLOYMENT.md
- 🐛 报告问题: 查看日志并描述问题
- 💡 功能建议: 欢迎提出改进建议

祝使用愉快！🎉
