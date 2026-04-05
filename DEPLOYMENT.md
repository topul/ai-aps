# AI-APS 智能排产系统 - 部署指南

## 🚀 快速启动（推荐）

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### 一键启动

```bash
cd /Users/topul/Documents/code/ai-aps

# 启动所有服务（自动构建、迁移数据库、创建测试数据）
./start.sh

# 或者手动启动
docker compose up -d --build
```

### 访问应用

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 停止服务

```bash
./stop.sh

# 或者
docker compose down

# 完全清理（包括数据卷）
docker compose down -v
```

## 📦 服务说明

### 1. PostgreSQL (postgres)
- 端口: 5432
- 数据库: ai_aps
- 用户名: postgres
- 密码: postgres
- 数据持久化: postgres_data volume

### 2. Redis (redis)
- 端口: 6379
- 用途: 缓存 + Celery 消息队列
- 数据持久化: redis_data volume

### 3. Backend (FastAPI)
- 端口: 8000
- 自动运行数据库迁移
- 健康检查: /health
- API 文档: /docs

### 4. Celery Worker
- 处理异步排产任务
- 并发数: 2
- 日志级别: info

### 5. Frontend (React)
- 端口: 5173
- 热重载开发模式
- 自动连接后端 API

## 🔧 开发模式

### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp ../.env.example ../.env
# 编辑 .env 文件

# 运行数据库迁移
alembic upgrade head

# 创建测试数据
python seed_data.py

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动 Celery Worker（另一个终端）
celery -A app.tasks.celery_app worker --loglevel=info
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
echo "VITE_API_URL=http://localhost:8000" > .env

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🗄️ 数据库管理

### 创建新的迁移

```bash
cd backend
alembic revision --autogenerate -m "描述变更内容"
```

### 应用迁移

```bash
alembic upgrade head
```

### 回滚迁移

```bash
alembic downgrade -1  # 回滚一个版本
```

### 查看迁移历史

```bash
alembic history
alembic current
```

### 重置数据库

```bash
# 停止服务
docker compose down

# 删除数据卷
docker volume rm ai-aps_postgres_data

# 重新启动
docker compose up -d
```

## 📊 测试数据

系统启动时会自动创建测试数据：
- 3 个产品
- 10 个订单
- 4 个物料
- 6 个 BOM 记录
- 5 个资源（3台机器 + 2个工人）
- 35 个日历记录（7天工作日历）
- 1 个默认排产配置

### 手动创建测试数据

```bash
# Docker 环境
docker compose exec backend python seed_data.py

# 本地环境
cd backend
python seed_data.py
```

## 🔍 日志查看

### 查看所有服务日志

```bash
docker compose logs -f
```

### 查看特定服务日志

```bash
docker compose logs -f backend
docker compose logs -f celery-worker
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f redis
```

### 查看最近 100 行日志

```bash
docker compose logs --tail=100 backend
```

## 🐛 故障排查

### 后端无法启动

1. 检查 PostgreSQL 是否就绪
```bash
docker compose ps postgres
docker compose logs postgres
```

2. 检查数据库连接
```bash
docker compose exec postgres psql -U postgres -d ai_aps -c "\dt"
```

3. 检查后端日志
```bash
docker compose logs backend
```

### 前端无法连接后端

1. 检查后端健康状态
```bash
curl http://localhost:8000/health
```

2. 检查 CORS 配置
- 确保 `.env` 中的 `CORS_ORIGINS` 包含前端地址

3. 检查前端环境变量
```bash
cat frontend/.env
```

### Celery 任务不执行

1. 检查 Redis 连接
```bash
docker compose exec redis redis-cli ping
```

2. 检查 Celery Worker 状态
```bash
docker compose logs celery-worker
```

3. 检查任务队列
```bash
docker compose exec redis redis-cli
> KEYS *
> LLEN celery
```

### 排产失败

1. 检查订单和资源数据
```bash
curl http://localhost:8000/api/v1/orders
curl http://localhost:8000/api/v1/resources
```

2. 查看排产日志
```bash
docker compose logs celery-worker | grep -i "scheduling"
```

3. 检查 OR-Tools 安装
```bash
docker compose exec backend python -c "from ortools.sat.python import cp_model; print('OK')"
```

## 🔐 安全配置

### 生产环境配置

1. 修改 `.env` 文件：
```bash
# 生成强密码
SECRET_KEY=$(openssl rand -hex 32)

# 修改数据库密码
POSTGRES_PASSWORD=your_strong_password

# 配置 LLM API Key
ANTHROPIC_API_KEY=your_api_key
```

2. 限制端口暴露
```yaml
# docker-compose.yml
services:
  postgres:
    ports:
      - "127.0.0.1:5432:5432"  # 只允许本地访问
```

3. 启用 HTTPS（使用 Nginx 反向代理）

## 📈 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_orders_due_date ON orders(due_date);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_schedules_resource_id ON schedules(resource_id);
```

### Celery 优化

```bash
# 增加并发数
celery -A app.tasks.celery_app worker --concurrency=4

# 使用 gevent 池
celery -A app.tasks.celery_app worker --pool=gevent --concurrency=100
```

### 前端优化

```bash
# 生产构建
npm run build

# 使用 Nginx 提供静态文件
```

## 🔄 更新和维护

### 更新代码

```bash
git pull
docker compose down
docker compose up -d --build
```

### 备份数据

```bash
# 备份数据库
docker compose exec postgres pg_dump -U postgres ai_aps > backup.sql

# 恢复数据库
docker compose exec -T postgres psql -U postgres ai_aps < backup.sql
```

### 清理 Docker 资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes
```

## 📞 获取帮助

- 查看 README.md
- 查看 QUICKSTART.md
- 查看 API 文档: http://localhost:8000/docs
- 查看实现计划: `/Users/topul/.claude/plans/humble-dazzling-horizon.md`
