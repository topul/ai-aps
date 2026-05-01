# AI-APS 智能排产系统

基于Google OR-Tools的智能排产系统，支持AI对话式交互和可视化甘特图展示。

## 功能特性

- 🎯 **灵活的排产引擎**: 基于Google OR-Tools，支持多种优化目标和约束条件
- 📊 **可视化甘特图**: 使用VTable Gantt展示排产结果，支持交互操作
- 💬 **AI对话交互**: 通过自然语言进行排产和结果查询
- 📦 **完整的数据管理**: 工艺路线、物料、BOM、生产资源、日历等
- ⚙️ **可配置模型**: 用户可自定义排产参数和AI模型
- 📈 **结果分析**: 资源利用率、准时率等多维度分析
- 🔗 **集成中心**: 支持与外部系统对接（入站/出站配置）

## 技术栈

### 前端
- React 19 + TypeScript + Vite
- Radix UI + Tailwind CSS
- @visactor/vtable-gantt
- Zustand + TanStack Query
- React Hook Form + Zod

### 后端
- FastAPI + Python 3.11+
- Google OR-Tools
- PostgreSQL + Redis
- SQLAlchemy 2.0 + Alembic
- Celery

### AI
- Claude API / OpenAI API / Custom API
- LangChain
- ChromaDB

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (推荐)

### 使用Docker (推荐)

1. 克隆项目并配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

2. 启动所有服务:
```bash
docker compose up -d --build
```

3. 访问应用:
- 前端: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

4. 登录账号:
- 用户名: `admin`
- 密码: `admin123`

### 本地开发

#### 后端

1. 创建虚拟环境并安装依赖:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. 运行数据库迁移:
```bash
alembic upgrade head
```

3. 启动开发服务器:
```bash
uvicorn app.main:app --reload
```

4. 启动Celery worker (另一个终端):
```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

#### 前端

1. 安装依赖:
```bash
cd frontend
npm install
```

2. 启动开发服务器:
```bash
npm run dev
```

## 项目结构

```
ai-aps/
├── frontend/           # React前端应用
│   └── src/
│       ├── pages/           # 页面组件
│       ├── components/      # 共享组件
│       ├── stores/          # Zustand状态管理
│       ├── services/       # API服务
│       └── types/          # TypeScript类型
├── backend/            # FastAPI后端应用
│   └── app/
│       ├── api/v1/        # API路由
│       ├── models/         # 数据模型
│       ├── schemas/        # Pydantic schemas
│       ├── services/       # 业务逻辑
│       └── core/          # 核心配置
├── docker compose.yml  # Docker编排
├── .env.example      # 环境变量模板
└── AGENTS.md        # 开发者指南
```

## 核心功能

### 1. 菜单导航
- 左侧垂直菜单栏
- 会话：AI对话历史记录
- 数据管理：工艺路线、物料管理、BOM管理、资源管理、工作日历
- 生产计划：待排订单、订单计划、物料计划、资源计划
- 集成中心：入站配置、出站配置、请求日志

### 2. 数据管理
- 工艺路线管理：支持模板下载、导入
- 物料管理：支持模板下载、导入
- BOM管理：支持模板下载、导入
- 资源管理：支持模板下载、导入
- 工作日历：班次设置

### 3. 生产计划
- 待排订单：选择订单进行排产
- 订单计划：甘特图展示
- 物料计划：甘特图展示
- 资源计划：甘特图展示

### 4. 排产配置
- 优化目标选择：最小化完工时间、最大化准时率等
- 约束条件设置：资源容量、物料可用性、工序顺序
- 配置模板：保存和加载常用配置

### 5. 排产执行
- 异步排产任务
- 实时进度跟踪
- 结果保存和历史记录

### 6. 用户中心
- 用户信息
- 个人设置
- AI模型配置（支持OpenAI、Anthropic、Custom API）

### 7. AI对话
- 自然语言排产："帮我排一下本周的订单"
- 结果查询："为什么订单A123排在明天？"
- 数据分析："资源利用率最高的是哪个设备？"

## API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

## 开发指南

### 添加新的数据模型

1. 在 `backend/app/models/` 创建模型
2. 在 `backend/app/schemas/` 创建Pydantic schema
3. 创建数据库迁移: `alembic revision --autogenerate -m "描述"`
4. 应用迁移: `alembic upgrade head`
5. 在 `backend/app/api/v1/` 创建API路由
6. 注册路由到 `backend/app/main.py`

### 添加新的前端页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/App.tsx` 添加路由
3. 如需状态管理，在 `frontend/src/stores/` 创建Zustand store

## 测试

### 后端测试
```bash
cd backend
pytest
```

### 前端测试
```bash
cd frontend
npm run test
```

### 前端构建检查
```bash
cd frontend
npm run build
```

## 部署

### 生产环境部署

1. 修改 `.env` 文件中的生产配置
2. 构建并启动:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！