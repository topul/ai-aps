import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import DataManagement from './pages/DataManagement';
import Scheduling from './pages/Scheduling';
import ImportExport from './pages/ImportExport';
import AIConfigPage from './pages/AIConfigPage';
import { ParticleBackground } from './components/effects/ParticleBackground';
import './index.css';

const queryClient = new QueryClient();

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        relative px-4 py-2 rounded-lg transition-all duration-300
        ${isActive
          ? 'text-white bg-gradient-tech shadow-neon-blue'
          : 'text-muted-foreground hover:text-white hover:bg-tech-blue/10'
        }
      `}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-tech rounded-full" />
      )}
    </Link>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen">
      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 导航栏 */}
      <nav className="border-b border-tech-blue/20 backdrop-blur-md bg-dark-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-tech flex items-center justify-center shadow-neon-blue">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">AI-APS</h1>
                <p className="text-xs text-muted-foreground">智能排产系统</p>
              </div>
            </div>

            {/* 导航链接 */}
            <div className="flex gap-2">
              <NavLink to="/">仪表盘</NavLink>
              <NavLink to="/scheduling">智能排产</NavLink>
              <NavLink to="/data">数据管理</NavLink>
              <NavLink to="/import-export">导入导出</NavLink>
              <NavLink to="/ai-config">AI配置</NavLink>
            </div>

            {/* 状态指示器 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tech-blue/10 border border-tech-blue/30">
                <div className="w-2 h-2 bg-tech-cyan rounded-full animate-pulse shadow-neon-cyan" />
                <span className="text-xs text-muted-foreground">在线</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/ai-config" element={<AIConfigPage />} />
        </Routes>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-tech-blue/20 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 AI-APS 智能排产系统</p>
            <div className="flex items-center gap-4">
              <span>基于 OR-Tools 驱动</span>
              <span>•</span>
              <span>实时排产引擎</span>
              <span>•</span>
              <span>支持多种AI模型</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
