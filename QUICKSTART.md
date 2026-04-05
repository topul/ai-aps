# 快速启动指南

## 项目已创建完成！

智能排产系统的基础架构已经搭建完毕，包括：

### ✅ 已完成的工作

**后端 (FastAPI)**
- ✅ 完整的项目结构
- ✅ 数据库模型（订单、物料、BOM、资源、日历、排产结果）
- ✅ RESTful API 路由
- ✅ OR-Tools 排产引擎基础实现
- ✅ Celery 异步任务支持
- ✅ Alembic 数据库迁移配置
- ✅ Docker 配置

**前端 (React + TypeScript)**
- ✅ Vite + React 18 项目
- ✅ Tailwind CSS + shadcn/ui 配置
- ✅ React Router 路由
- ✅ TanStack Query 数据请求
- ✅ 仪表盘页面
- ✅ 数据管理页面
- ✅ AI 对话组件（基础版）
- ✅ 甘特图组件（基础版）

**基础设施**
- ✅ Docker Compose 配置
- ✅ 环境变量模板
- ✅ README 文档

## 下一步：启动项目

### 方式一：使用 Docker（推荐）

1. 确保已安装 Docker 和 Docker Compose

2. 启动所有服务：
```bash
cd /Users/topul/Documents/code/ai-aps
docker compose up -d
```

3. 访问应用：
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:8000
   - API 文档: http://localhost:8000/docs

### 方式二：本地开发

**启动后端：**
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Mac/Linux

# 安装依赖
pip install -r requirements.txt

# 运行数据库迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload
```

**启动前端：**
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**启动 Celery Worker（可选）：**
```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

## 需要完善的功能

### 高优先级
1. **完善 OR-Tools 排产算法**
   - 当前是基础实现，需要根据实际业务调整约束和目标函数
   - 文件：`backend/app/services/scheduler.py`

2. **集成真实的甘特图组件**
   - 使用 @visactor/vtable-gantt 替换当前的简单列表
   - 文件：`frontend/src/components/gantt/ScheduleGantt.tsx`

3. **实现 AI 对话功能**
   - 集成 Claude API 或 OpenAI API
   - 实现流式响应
   - 文件：`backend/app/services/chat_agent.py`

### 中优先级
4. **数据导入/导出功能**
   - Excel 导入订单、物料等数据
   - 排产结果导出

5. **排产结果分析**
   - 资源利用率计算
   - 准时率统计
   - 瓶颈识别
   - 文件：`backend/app/services/analyzer.py`

6. **配置管理界面**
   - 排产参数配置表单
   - 配置模板管理

### 低优先级
7. **用户认证和权限**
8. **数据可视化图表**（使用 recharts）
9. **移动端适配**
10. **单元测试和集成测试**

## 技术栈说明

### 前端
- React 18 + TypeScript
- Vite（构建工具）
- Tailwind CSS（样式）
- shadcn/ui（UI 组件）
- React Router（路由）
- TanStack Query（数据请求）
- Zustand（状态管理，待使用）
- @visactor/vtable-gantt（甘特图，待集成）

### 后端
- FastAPI（Web 框架）
- SQLAlchemy 2.0（ORM）
- Alembic（数据库迁移）
- OR-Tools（排产引擎）
- Celery（异步任务）
- PostgreSQL（数据库）
- Redis（缓存和消息队列）

### AI
- Anthropic Claude API（待集成）
- LangChain（待集成）
- ChromaDB（向量数据库，待集成）

## 开发建议

1. **先完善数据层**：确保能正常创建订单、物料、资源等基础数据
2. **测试排产引擎**：用小规模数据测试 OR-Tools 求解
3. **逐步完善 UI**：先实现基本功能，再优化用户体验
4. **最后集成 AI**：AI 对话是锦上添花的功能

## 常见问题

**Q: 数据库连接失败？**
A: 检查 `.env` 文件中的 `DATABASE_URL` 配置，确保 PostgreSQL 已启动

**Q: 前端无法连接后端？**
A: 检查 `frontend/.env` 中的 `VITE_API_URL` 配置

**Q: OR-Tools 安装失败？**
A: 确保使用 Python 3.11+，可能需要安装 C++ 编译器

**Q: 如何添加测试数据？**
A: 访问 http://localhost:8000/docs 使用 Swagger UI 手动添加，或编写数据导入脚本

## 项目文件说明

### 关键配置文件
- `.env` - 环境变量配置
- `docker-compose.yml` - Docker 服务编排
- `backend/alembic.ini` - 数据库迁移配置
- `frontend/vite.config.ts` - Vite 配置
- `frontend/tailwind.config.js` - Tailwind 配置

### 核心代码文件
- `backend/app/main.py` - FastAPI 应用入口
- `backend/app/services/scheduler.py` - 排产引擎
- `backend/app/models/` - 数据库模型
- `frontend/src/App.tsx` - React 应用入口
- `frontend/src/pages/Dashboard.tsx` - 仪表盘页面
- `frontend/src/pages/DataManagement.tsx` - 数据管理页面

## 联系和支持

如有问题，请查看：
- 项目 README: `/Users/topul/Documents/code/ai-aps/README.md`
- 实现计划: `/Users/topul/.claude/plans/humble-dazzling-horizon.md`

祝开发顺利！🚀
