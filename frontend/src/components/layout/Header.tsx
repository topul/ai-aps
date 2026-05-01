import { useLocation, Link } from 'react-router-dom';
import { User, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUserStore } from '../../stores/useUserStore';
import { cn } from '../../utils/cn';

const breadcrumbMap: Record<string, string> = {
  '/': '首页',
  '/sessions': '会话',
  '/sessions/:id': '会话详情',
  '/data': '数据管理',
  '/data/process-route': '工艺路线',
  '/data/materials': '物料管理',
  '/data/bom': 'BOM管理',
  '/data/resources': '资源管理',
  '/data/calendar': '工作日历',
  '/production': '生产计划',
  '/production/pending-orders': '待排订单',
  '/production/order-plan': '订单计划',
  '/production/material-plan': '物料计划',
  '/production/resource-plan': '资源计划',
  '/integration': '集成中心',
  '/integration/inbound': '入站配置',
  '/integration/outbound': '出站配置',
  '/integration/logs': '请求日志',
  '/user/profile': '用户信息',
  '/user/settings': '个人设置',
};

function getBreadcrumb(pathname: string): string[] {
  const paths = ['/'];
  for (const [path, label] of Object.entries(breadcrumbMap)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      if (path !== '/') {
        paths.push(label);
      }
    }
  }
  if (paths.length === 1) {
    paths.push('首页');
  }
  return paths;
}

export default function Header() {
  const location = useLocation();
  const { user, logout } = useUserStore();
  const breadcrumbs = getBreadcrumb(location.pathname);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-dark-card border-b border-tech-blue/20">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-tech-blue/40">/</span>}
            <span className={cn(index === breadcrumbs.length - 1 ? 'text-white' : 'text-muted-foreground')}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* 用户头像 */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-tech-blue/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-tech flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {user?.username || '用户'}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[180px] bg-dark-card rounded-lg border border-tech-blue/20 p-1 shadow-lg z-50"
            sideOffset={8}
          >
            <DropdownMenu.Item asChild>
              <Link
                to="/user/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white hover:bg-tech-blue/10 cursor-pointer outline-none"
              >
                <User className="w-4 h-4" />
                用户信息
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                to="/user/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white hover:bg-tech-blue/10 cursor-pointer outline-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                个人设置
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-tech-blue/20 my-1" />
            <DropdownMenu.Item
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0m-4 4l4 4m-4-4l4-4m-4 4V4m0 0l4 4m-4-4l-4 4" />
              </svg>
              退出登录
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}