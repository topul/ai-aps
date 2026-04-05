# 功能更新说明

## 🎉 新增功能

### 1. 数据导入导出 ✅

**功能说明**:
- Excel 批量导入订单
- 导出订单数据到 Excel
- 导出排产结果到 Excel
- 下载导入模板

**使用方法**:
1. 访问"导入导出"页面
2. 下载订入模板
3. 填写订单数据
4. 上传 Excel 文件导入
5. 或点击导出按钮下载数据

**API 端点**:
- `POST /api/v1/import-export/orders/import` - 导入订单
- `GET /api/v1/import-export/orders/export` - 导出订单
- `GET /api/v1/import-export/schedules/export` - 导出排产结果
- `GET /api/v1/import-export/template/orders` - 下载模板

### 2. 用户认证系统 ✅

**功能说明**:
- 用户注册和登录
- JWT Token 认证
- 用户信息管理
- 权限控制

**使用方法**:
```bash
# 注册用户
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "管理员"
  }'

# 登录获取 Token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# 使用 Token 访问受保护的 API
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**API 端点**:
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户信息
- `PUT /api/v1/auth/me` - 更新用户信息

### 3. AI 对话功能 ✅

**功能说明**:
- 集成 Claude API 或 OpenAI API
- 流式响应
- 意图识别（查询、分析、排产、解释）
- 自动获取系统上下文

**配置方法**:
在 `.env` 文件中添加以下配置之一:

```bash
# 使用 Claude (推荐)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_api_key_here
LLM_MODEL=claude-3-5-sonnet-20241022

# 或使用 OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

**使用示例**:
- "查询所有订单"
- "分析当前排产结果"
- "为什么订单 ORD0001 排在明天？"
- "资源利用率最高的是哪个？"

**API 端点**:
- `POST /api/v1/chat/message` - 发送消息（流式）
- `POST /api/v1/chat/message/sync` - 发送消息（同步）

## 📝 数据库更新

新增用户表:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

运行迁移:
```bash
docker compose exec backend alembic upgrade head
```

## 🔧 依赖更新

新增 Python 包:
- `openpyxl` - Excel 读写
- `pandas` - 数据处理
- `xlsxwriter` - Excel 写入
- `python-jose` - JWT 处理
- `passlib` - 密码哈希

更新依赖:
```bash
docker compose down
docker compose up -d --build
```

## 🎯 使用流程

### 1. 导入订单数据
1. 访问 http://localhost:5173/import-export
2. 下载模板
3. 填写数据
4. 上传导入

### 2. 执行排产
1. 访问 http://localhost:5173/scheduling
2. 选择订单
3. 执行排产

### 3. 导出结果
1. 返回导入导出页面
2. 点击"导出排产结果"
3. 下载 Excel 文件

### 4. AI 对话
1. 配置 API Key
2. 重启服务
3. 在仪表盘或排产页面使用 AI 助手

## ⚠️ 注意事项

1. **AI 功能需要配置 API Key**
   - 未配置时会显示提示信息
   - 支持 Claude 和 OpenAI
   - API 调用会产生费用

2. **导入数据前请备份**
   - 重复的订单号会被跳过
   - 产品编码必须存在

3. **用户认证是可选的**
   - 当前所有 API 都可以直接访问
   - 如需启用认证，需要在 API 中添加依赖

## 🚀 下一步

剩余待实现功能:
- ✅ 数据导入导出
- ✅ 用户认证系统
- ✅ AI 对话功能
- 🚧 实时更新（WebSocket）
- 🚧 完整甘特图（@visactor/vtable-gantt）

## 📞 获取帮助

- 查看 API 文档: http://localhost:8000/docs
- 查看用户手册: USER_GUIDE.md
- 查看部署指南: DEPLOYMENT.md
