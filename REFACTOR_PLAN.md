# AI-APS 前端改造计划

## 一、概述

本次改造旨在优化 AI-APS 系统的前端布局和用户体验，主要变更包括：

1. **导航模式变更**：从顶部水平导航改为左侧垂直菜单栏
2. **菜单结构重组**：按照业务模块重新组织菜单结构
3. **用户中心**：添加用户头像、个人设置、AI模型配置等功能
4. **会话管理**：将AI对话独立为会话模块，支持历史记录查看

---

## 二、目标菜单结构

```
├── 会话 (一级菜单)
│   ├── 会话列表
│   └── 会话详情（点击具体会话后显示）
│
├── 数据管理 (一级菜单)
│   ├── 工艺路线 (支持模板下载、导入)
│   ├── 物料管理 (支持模板下载、导入)
│   ├── BOM管理 (支持模板下载、导入)
│   ├── 资源管理 (支持模板下载、导入)
│   └── 工作日历
│
├── 生产计划 (一级菜单)
│   ├── 待排订单 (列表，非甘特图)
│   ├── 订单计划 (甘特图)
│   ├── 物料计划 (甘特图)
│   └── 资源计划 (甘特图)
│
└── 集成中心 (一级菜单)
    ├── 入站配置
    ├── 出站配置
    └── 请求日志
```

---

## 三、技术选型

基于现有项目技术栈，采用以下方案：

| 功能 | 技术方案 | 说明 |
|------|----------|------|
| 侧边菜单 | Radix UI + TailwindCSS | 利用现有 @radix-ui/react-* 组件 |
| 路由管理 | React Router DOM v6 | 使用嵌套路由实现二级菜单 |
| 状态管理 | Zustand (已有) | 管理用户状态、菜单折叠状态 |
| UI组件 | 现有 Radix UI 组件库 | 保持风格一致 |
| 图标 | lucide-react (已有) | 使用图标库中的图标 |
| 甘特图 | @visactor/vtable-gantt (已有) | 生产计划甘特图使用 |
| 表格 | @visactor/vtable (已有) | 待排订单列表使用 |
| 文件上传 | 现有实现 (Upload组件) | 支持模板下载和导入 |

---

## 四、详细改造内容

### 4.1 新增/修改的文件结构

```
frontend/src/
├── components/
│   ├── layout/                    # 新增：布局组件目录
│   │   ├── AppLayout.tsx         # 主布局组件（左侧菜单+右侧内容）
│   │   ├── Sidebar.tsx           # 左侧菜单栏
│   │   ├── SidebarMenu.tsx       # 菜单项组件
│   │   ├── SidebarMenuItem.tsx   # 单个菜单项（支持二级菜单）
│   │   ├── Header.tsx            # 顶部栏（面包屑、用户头像）
│   │   └── UserDropdown.tsx      # 用户头像下拉菜单
│   │
│   ├── chat/                     # 现有：聊天组件
│   │   └── ChatInterface.tsx     # 改造为会话详情组件
│   │
│   ├── gantt/                    # 现有：甘特图组件
│   │   └── ScheduleGantt.tsx    # 改造支持多种甘特图
│   │
│   └── common/                  # 新增：通用组件
│       ├── DataTable.tsx         # 通用数据表格（带导入功能）
│       └── ImportButton.tsx     # 导入按钮组件
│
├── pages/
│   ├── session/                   # 新增：会话模块
│   │   ├── SessionList.tsx        # 会话列表页
│   │   └── SessionDetail.tsx      # 会话详情页
│   │
│   ├── data-management/           # 改造：数据管理模块
│   │   ├── ProcessRoute.tsx       # 工艺路线（含模板下载/导入）
│   │   ├── MaterialManagement.tsx # 物料管理（含模板下载/导入）
│   │   ├── BOMManagement.tsx      # BOM管理（含模板下载/导入）
│   │   ├── ResourceManagement.tsx # 资源管理（含模板下载/导入）
│   │   └── WorkCalendar.tsx       # 工作日历
│   │
│   ├── production-plan/           # 改造：生产计划模块
│   │   ├── PendingOrders.tsx      # 待排订单列表（使用vtable）
│   │   ├── OrderPlan.tsx          # 订单计划甘特图
│   │   ├── MaterialPlan.tsx       # 物料计划甘特图
│   │   └── ResourcePlan.tsx       # 资源计划甘特图
│   │
│   ├── integration/               # 新增：集成中心模块
│   │   ├── InboundConfig.tsx    # 入站配置
│   │   ├── OutboundConfig.tsx   # 出站配置
│   │   └── RequestLog.tsx      # 请求日志
│   │
│   ├── user/                      # 新增：用户相关页面
│   │   ├── UserProfile.tsx        # 用户信息页
│   │   ├── UserSettings.tsx       # 个人设置页
│   │   └── AIModelConfig.tsx      # AI模型配置（嵌入在个人设置中）
│   │
│   ├── auth/                      # 新增：认证页面
│   │   └── Login.tsx             # 登录页
│   │
│   ├── Dashboard.tsx              # 改造：保留作为首页
│   └── ...                        # 其他现有页面
│
├── stores/                        # 新增：状态管理
│   ├── useUserStore.ts           # 用户状态
│   ├── useMenuStore.ts           # 菜单状态（折叠等）
│   └── useSessionStore.ts      # 会话状态
│
├── services/
│   ├── api.ts                     # 改造：添加Token拦截器
│   ├── authService.ts             # 新增：认证相关API
│   ├── sessionService.ts          # 新增：会话相关API
│   └── integrationService.ts      # 新增：集成中心API
│
├── types/
│   ├── index.ts                   # 改造：添加新类型定义
│   ├── menu.ts                    # 新增：菜单类型
│   ├── user.ts                    # 新增：用户类型
│   └── session.ts                 # 新增：会话类型
│
├── hooks/                         # 新增自定义Hooks
│   ├── useAuth.ts                # 认证Hook
│   └── usePermission.ts          # 权限Hook（如需）
│
├── utils/
│   ├── template.ts                # 新增：模板生成工具
│   └── import.ts                 # 新增：导入解析工具
│
├── App.tsx                        # 改造：使用新布局
└── main.tsx                       # 可能添加路由守卫
```

### 4.2 路由设计

采用嵌套路由结构：

```typescript
// App.tsx 路由配置
<Routes>
  {/* 公开路由 */}
  <Route path="/login" element={<Login />} />
  
  {/* 需要认证的路由 */}
  <Route path="/" element={<AppLayout />}>
    {/* 首页 */}
    <Route index element={<Dashboard />} />
    
    {/* 会话模块 */}
    <Route path="sessions" element={<SessionList />} />
    <Route path="sessions/:id" element={<SessionDetail />} />
    
    {/* 数据管理模块 */}
    <Route path="data" element={<DataManagementLayout />}>
      <Route path="process-route" element={<ProcessRoute />} />
      <Route path="materials" element={<MaterialManagement />} />
      <Route path="bom" element={<BOMManagement />} />
      <Route path="resources" element={<ResourceManagement />} />
      <Route path="calendar" element={<WorkCalendar />} />
    </Route>
    
    {/* 生产计划模块 */}
    <Route path="production" element={<ProductionPlanLayout />}>
      <Route path="pending-orders" element={<PendingOrders />} />
      <Route path="order-plan" element={<OrderPlan />} />
      <Route path="material-plan" element={<MaterialPlan />} />
      <Route path="resource-plan" element={<ResourcePlan />} />
    </Route>
    
    {/* 集成中心模块 */}
    <Route path="integration" element={<IntegrationCenterLayout />}>
      <Route path="inbound" element={<InboundConfig />} />
      <Route path="outbound" element={<OutboundConfig />} />
      <Route path="logs" element={<RequestLog />} />
    </Route>
    
    {/* 用户相关 */}
    <Route path="user/profile" element={<UserProfile />} />
    <Route path="user/settings" element={<UserSettings />} />
  </Route>
</Routes>
```

### 4.3 菜单组件设计

#### Sidebar.tsx - 侧边菜单栏

```typescript
// 菜单配置数据结构
const menuItems = [
  {
    key: 'sessions',
    label: '会话',
    icon: MessageSquare,
    path: '/sessions',
    children: [] // 无二级菜单，直接跳转
  },
  {
    key: 'data',
    label: '数据管理',
    icon: Database,
    path: '/data',
    children: [
      { key: 'process-route', label: '工艺路线', path: '/data/process-route' },
      { key: 'materials', label: '物料管理', path: '/data/materials' },
      { key: 'bom', label: 'BOM管理', path: '/data/bom' },
      { key: 'resources', label: '资源管理', path: '/data/resources' },
      { key: 'calendar', label: '工作日历', path: '/data/calendar' }
    ]
  },
  {
    key: 'production',
    label: '生产计划',
    icon: CalendarRange,
    path: '/production',
    children: [
      { key: 'pending-orders', label: '待排订单', path: '/production/pending-orders' },
      { key: 'order-plan', label: '订单计划', path: '/production/order-plan' },
      { key: 'material-plan', label: '物料计划', path: '/production/material-plan' },
      { key: 'resource-plan', label: '资源计划', path: '/production/resource-plan' }
    ]
  },
  {
    key: 'integration',
    label: '集成中心',
    icon: Puzzle,
    path: '/integration',
    children: [
      { key: 'inbound', label: '入站配置', path: '/integration/inbound' },
      { key: 'outbound', label: '出站配置', path: '/integration/outbound' },
      { key: 'logs', label: '请求日志', path: '/integration/logs' }
    ]
  }
]
```

**功能特性：**
- 支持折叠/展开
- 二级菜单支持展开/收起
- 高亮当前激活菜单项
- 图标配合文字显示
- 用户头像显示在右上角Header组件中

### 4.4 用户中心设计

#### Header.tsx - 顶部栏（带用户头像）

```typescript
export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-dark-card border-b border-tech-blue/20">
      {/* 面包屑 */}
      <Breadcrumb />
      
      {/* 用户头像 */}
      <UserDropdown />
    </header>
  );
}
```

#### UserDropdown.tsx - 用户头像下拉菜单

```typescript
// 下拉菜单项
const userMenuItems = [
  {
    key: 'profile',
    label: '用户信息',
    icon: User,
    path: '/user/profile'
  },
  {
    key: 'settings',
    label: '个人设置',
    icon: Settings,
    path: '/user/settings'
  },
  { type: 'divider' },
  {
    key: 'logout',
    label: '退出登录',
    icon: LogOut,
    onClick: handleLogout
  }
]
```

#### AIModelConfig.tsx - AI模型配置

个人设置页面Tab页，支持：

1. **模型提供商选择**：OpenAI、Anthropic、Custom（自定义兼容OpenAI格式）
2. **配置项**：
   - API Key
   - API Base URL（自定义时需要）
   - 模型名称
   - 温度参数
   - 最大Token数
3. **功能**：
   - 测试连接
   - 保存配置
   - 设为默认配置

### 4.5 会话模块设计

#### SessionList.tsx - 会话列表

- 显示所有历史会话
- 支持搜索/筛选
- 支持新建会话
- 支持删除会话

#### SessionDetail.tsx - 会话详��

- 复用现有 ChatInterface 组件
- 显示具体会话的消息历史
- 支持继续对话

### 4.6 生产计划模块设计

#### PendingOrders.tsx - 待排订单列表（非甘特图）

- 使用 @visactor/vtable 表格组件
- 显示订单基本信息（订单号、产品、数量、截止日期等）
- 支持选择订单进行排产
- 不使用甘特图

#### 甘特图页面

- OrderPlan.tsx：订单计划甘特图
- MaterialPlan.tsx：物料计划甘特图
- ResourcePlan.tsx：资源计划甘特图
- 基于 @visactor/vtable-gantt 组件

### 4.7 数据管理模块 - 模板下载和导入

各模块（工艺路线、物料管理、BOM管理、资源管理）统一支持：

```typescript
// 通用导入按钮组件
function ImportButton({ 
  templateType, 
  onImport 
}: { 
  templateType: 'material' | 'bom' | 'resource' | 'process-route',
  onImport: (data: any[]) => void 
}) {
  // 模板下载
  const handleDownloadTemplate = () => {
    const template = generateTemplate(templateType);
    downloadExcel(template, `${templateType}_template.xlsx`);
  };
  
  // 文件导入
  const handleFileImport = async (file: File) => {
    const data = await parseExcel(file, templateType);
    onImport(data);
  };
  
  return (
    <div className="flex gap-2">
      <Button onClick={handleDownloadTemplate}>
        模板下载
      </Button>
      <Upload onChange={handleFileImport}>
        导入
      </Upload>
    </div>
  );
}
```

---

## 五、后端改造内容

### 5.1 需要新增的数据库模型

```python
# backend/app/models/session.py (新增)
class Conversation(Base):
    """会话模型"""
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255))  # 会话标题
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(Base):
    """消息模型"""
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20))  # 'user' 或 'assistant'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# backend/app/models/integration.py (新增)
class IntegrationConfig(Base):
    """集成配置模型"""
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    config_type = Column(String(20))  # 'inbound' 或 'outbound'
    config_data = Column(JSON)  # 配置详情
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IntegrationLog(Base):
    """集成日志模型"""
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("integration_configs.id"))
    request_data = Column(JSON)
    response_data = Column(JSON)
    status = Column(String(20))  # 'success' 或 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 5.2 需要新增的API接口

| 模块 | 接口路径 | 方法 | 说明 |
|------|----------|------|------|
| **会话** | | | |
| | /api/v1/sessions | GET | 获取会话列表 |
| | /api/v1/sessions | POST | 创建新会话 |
| | /api/v1/sessions/{id} | GET | 获取会话详情（含消息） |
| | /api/v1/sessions/{id} | DELETE | 删除会话 |
| | /api/v1/sessions/{id}/messages | POST | 发送消息 |
| **集成中心** | | | |
| | /api/v1/integration/inbound | GET | 获取入站配置列表 |
| | /api/v1/integration/inbound | POST | 创建入站配置 |
| | /api/v1/integration/inbound/{id} | PUT | 更新入站配置 |
| | /api/v1/integration/inbound/{id} | DELETE | 删除入站配置 |
| | /api/v1/integration/outbound | GET | 获取出站配置列表 |
| | /api/v1/integration/outbound | POST | 创建出站配置 |
| | /api/v1/integration/outbound/{id} | PUT | 更新出站配置 |
| | /api/v1/integration/outbound/{id} | DELETE | 删除出站配置 |
| | /api/v1/integration/logs | GET | 获取请求日志 |
| | /api/v1/integration/logs/{id} | GET | 获取日志详情 |
| **模板** | | | | |
| | /api/v1/templates/{type} | GET | 下载模板文件 |

### 5.3 后端文件变更

```
backend/app/
├── models/
│   ├── session.py           # 新增：会话模型
│   ├── message.py         # 新增：消息模型
│   ├── integration.py    # 新增：集成配置和日志模型
│   └── ...
│
├── api/v1/
│   ├── session.py          # 新增：会话API
│   ├── integration.py   # 新增：集成中心API
│   ├── template.py       # 新增：模板下载API
│   └── ...
│
├── schemas/
│   ├── session.py       # 新增：会话Schema
│   ├── integration.py  # 新增：集成Schema
│   └── ...
│
└── services/
    ├── session_service.py    # ���增：会话服务
    ├── integration_service.py  # 新增：集成服务
    └── template_service.py  # 新增：模板服务
```

### 5.4 需要扩展的现有API

| 模块 | 扩展内容 |
|------|----------|
| auth.py | 添加登出接口、刷新Token接口 |
| ai_config.py | 添加用户级AI配置（个人设置中） |

---

## 六、实施步骤

### 阶段一：基础架构搭建（1-2天）

1. **创建布局组件**
   - [ ] 创建 `components/layout/AppLayout.tsx`
   - [ ] 创建 `components/layout/Sidebar.tsx`
   - [ ] 创建 `components/layout/Header.tsx`
   - [ ] 创建 `components/layout/UserDropdown.tsx`

2. **状态管理**
   - [ ] 创建 `stores/useUserStore.ts`
   - [ ] 创建 `stores/useMenuStore.ts`

3. **类型定义**
   - [ ] 更新 `types/index.ts`
   - [ ] 创建 `types/menu.ts`
   - [ ] 创建 `types/user.ts`

### 阶段二：认证功能完善（1天）

1. **前端认证**
   - [ ] 创建 `pages/auth/Login.tsx`
   - [ ] 创建 `services/authService.ts`
   - [ ] 更新 `services/api.ts` 添加Token拦截器
   - [ ] 创建 `hooks/useAuth.ts`
   - [ ] 添加路由守卫

2. **后端认证扩展**
   - [ ] 扩展 auth.py 添加登出接口

### 阶段三：菜单与路由（1天）

1. **路由配置**
   - [ ] 更新 `App.tsx` 路由配置
   - [ ] 创建各模块页面占位组件

2. **菜单实现**
   - [ ] 完成 Sidebar 组件
   - [ ] 实现二级菜单展开/收起
   - [ ] 实现菜单高亮

### 阶段四：会话模块（1-2天）

1. **后端API**
   - [ ] 创建 session.py 模型
   - [ ] 创建 session.py API接口
   - [ ] 创建 session_service.py

2. **前端页面**
   - [ ] 创建 `pages/session/SessionList.tsx`
   - [ ] 改造 `components/chat/ChatInterface.tsx`
   - [ ] 创建 `pages/session/SessionDetail.tsx`

### 阶段五：数据管理模块改造（1-2天）

1. **模板和导入功能**
   - [ ] 创建 `components/common/ImportButton.tsx`
   - [ ] 创建 `utils/template.ts`
   - [ ] 创建 `utils/import.ts`
   - [ ] 后端创建 template.py API

2. **现有页面改造**
   - [ ] 改造 `pages/DataManagement.tsx` 为二级菜单结构
   - [ ] 创建 `pages/data-management/ProcessRoute.tsx`（含导入）
   - [ ] 创建 `pages/data-management/MaterialManagement.tsx`（含导入）
   - [ ] 创建 `pages/data-management/BOMManagement.tsx`（含导入）
   - [ ] 创建 `pages/data-management/ResourceManagement.tsx`（含导入）
   - [ ] 创建 `pages/data-management/WorkCalendar.tsx`

### 阶段六：生产计划模块（2-3天）

1. **待排订单列表**
   - [ ] 创建 `pages/production-plan/PendingOrders.tsx`（列表，非甘特图）
   - [ ] 对接后端订单API

2. **甘特图页面**
   - [ ] 创建 `pages/production-plan/OrderPlan.tsx`
   - [ ] 创建 `pages/production-plan/MaterialPlan.tsx`
   - [ ] 创建 `pages/production-plan/ResourcePlan.tsx`
   - [ ] 对接后端排产结果API

### 阶段七：集成中心模块（1-2天）

1. **后端API**
   - [ ] 创建 integration.py 模型
   - [ ] 创建 integration.py API接口
   - [ ] 创建 integration_service.py

2. **前端页面**
   - [ ] 创建 `pages/integration/InboundConfig.tsx`
   - [ ] 创建 `pages/integration/OutboundConfig.tsx`
   - [ ] 创建 `pages/integration/RequestLog.tsx`

### 阶段八：用户中心模块（1天）

1. **前端页面**
   - [ ] 创建 `pages/user/UserProfile.tsx`
   - [ ] 创建 `pages/user/UserSettings.tsx`
   - [ ] 创建 `pages/user/AIModelConfig.tsx`（个人设置Tab中）

2. **后端扩展**
   - [ ] 扩展 ai_config.py 支持用户级配置

### 阶段九：测试与优化（1-2天）

1. **功能测试**
   - [ ] 测试所有菜单跳转
   - [ ] 测试用户登录/登出
   - [ ] 测试会话功能
   - [ ] 测试模板下载和导入
   - [ ] 测试各模块功能

2. **样式优化**
   - [ ] 统一组件样式
   - [ ] 响应式适配
   - [ ] 加载状态优化

---

## 七、关键代码示例

### 7.1 AppLayout.tsx 基本结构

```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-dark-bg">
      {/* 左侧菜单 */}
      <Sidebar />
      
      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 7.2 api.ts Token拦截器

```typescript
// 添加请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 7.3 模板下载功能

```typescript
// utils/template.ts
export function generateTemplate(type: string) {
  const templates = {
    material: [
      ['物料编码', '物料名称', '规格', '单位', '安全库存'],
      ['M001', '螺丝', 'M10*50', '个', '100']
    ],
    bom: [
      ['BOM编码', '产品编码', '物料编码', '数量'],
      ['BOM001', 'P001', 'M001', '10']
    ],
    resource: [
      ['资源编码', '资源名称', '类型', '产能'],
      ['R001', '生产线A', 'machine', '100']
    ],
    'process-route': [
      ['工艺路线编码', '产品编码', '工序序号', '资源编码', '标准工时'],
      ['PR001', 'P001', '1', 'R001', '60']
    ]
  };
  return templates[type];
}
```

---

## 八、注意事项

1. **向后兼容**：改造过程中保留现有功能，确保不影响已有业务
2. **渐进式改造**：可以按模块逐步实施，不必一次性完成
3. **样式统一**：新组件遵循现有设计风格（tech-blue/tech-cyan配色）
4. **数据mock**：后端API未就绪时，前端可使用mock数据
5. **权限控制**：后续可根据需要添加细粒度权限控制

---

## 九、预估工作量

| 阶段 | 内容 | 预估时间 |
|------|------|----------|
| 阶段一 | 基础架构搭建 | 1-2天 |
| 阶段二 | 认证功能完善 | 1天 |
| 阶段三 | 菜单与路由 | 1天 |
| 阶段四 | 会话模块 | 1-2天 |
| 阶段五 | 数据管理模块 | 1-2天 |
| 阶段六 | 生产计划模块 | 2-3天 |
| 阶段七 | 集成中心模块 | 1-2天 |
| 阶段八 | 用户中心模块 | 1天 |
| 阶段九 | 测试与优化 | 1-2天 |
| **总计** | | **10-16天** |

---

## 十、确认事项

请确认以下内容后再开始实施：

1. [x] 菜单结构是否符合预期？
2. [x] 待排订单是列表（非甘特图）
3. [x] 数据管理模块支持模板下载和导入
4. [x] 后端需要配合新增API
5. [x] 用户头像位置：右上角

---

**文档版本**：v1.1  
**创建日期**：2026-05-01  
**最后更新**：2026-05-01