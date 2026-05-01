import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Database, 
  CalendarRange, 
  Puzzle,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useMenuStore } from '../../stores/useMenuStore';
import { cn } from '../../utils/cn';

const menuItems = [
  {
    key: 'sessions',
    label: '会话',
    icon: MessageSquare,
    path: '/sessions',
    children: []
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
];

interface MenuItemProps {
  item: typeof menuItems[0];
  collapsed: boolean;
}

function MenuItemComponent({ item, collapsed }: MenuItemProps) {
  const { expandedKeys, toggleExpanded } = useMenuStore();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedKeys.includes(item.key);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => {
            toggleExpanded(item.key);
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'text-muted-foreground hover:text-white hover:bg-tech-blue/10',
            isExpanded && 'bg-tech-blue/10 text-white'
          )}
        >
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>
        {!collapsed && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-tech-blue/20 pl-2">
            {item.children!.map((child) => (
              <NavLink
                key={child.key}
                to={child.path}
                className={({ isActive }) => cn(
                  'block px-3 py-2 rounded-lg text-sm transition-all duration-200',
                  isActive
                    ? 'bg-gradient-tech text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-tech-blue/10'
                )}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-gradient-tech text-white'
          : 'text-muted-foreground hover:text-white hover:bg-tech-blue/10'
      )}
    >
      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { collapsed, toggleCollapsed } = useMenuStore();

  return (
    <aside
      className={cn(
        'h-screen bg-dark-card border-r border-tech-blue/20 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-tech-blue/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-tech flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient">AI-APS</h1>
            </div>
          )}
        </div>
      </div>

      {/* 折叠按钮 */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-card border border-tech-blue/30 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-tech-blue/20 transition-colors"
      >
        {collapsed ? (
          <PanelLeft className="w-4 h-4" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>

      {/* 菜单项 */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <MenuItemComponent key={item.key} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}