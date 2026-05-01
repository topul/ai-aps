import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import SessionList from './pages/session/SessionList';
import SessionDetail from './pages/session/SessionDetail';
import MaterialManagement from './pages/data-management/MaterialManagement';
import ResourceManagement from './pages/data-management/ResourceManagement';
import BOMManagement from './pages/data-management/BOMManagement';
import ProcessRoute from './pages/data-management/ProcessRoute';
import WorkCalendar from './pages/data-management/WorkCalendar';
import PendingOrders from './pages/production-plan/PendingOrders';
import OrderPlan from './pages/production-plan/OrderPlan';
import MaterialPlan from './pages/production-plan/MaterialPlan';
import ResourcePlan from './pages/production-plan/ResourcePlan';
import InboundConfig from './pages/integration/InboundConfig';
import OutboundConfig from './pages/integration/OutboundConfig';
import RequestLog from './pages/integration/RequestLog';
import UserProfile from './pages/user/UserProfile';
import UserSettings from './pages/user/UserSettings';
import { useUserStore } from './stores/useUserStore';
import './index.css';

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useUserStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken && !token) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<Navigate to="/sessions" replace />} />
            
            {/* 会话模块 */}
            <Route path="sessions" element={<SessionList />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            
            {/* 数据管理模块 */}
            <Route path="data" element={<Navigate to="/data/materials" replace />} />
            <Route path="data/process-route" element={<ProcessRoute />} />
            <Route path="data/materials" element={<MaterialManagement />} />
            <Route path="data/bom" element={<BOMManagement />} />
            <Route path="data/resources" element={<ResourceManagement />} />
            <Route path="data/calendar" element={<WorkCalendar />} />
            
            {/* 生产计划模块 */}
            <Route path="production" element={<Navigate to="/production/pending-orders" replace />} />
            <Route path="production/pending-orders" element={<PendingOrders />} />
            <Route path="production/order-plan" element={<OrderPlan />} />
            <Route path="production/material-plan" element={<MaterialPlan />} />
            <Route path="production/resource-plan" element={<ResourcePlan />} />
            
            {/* 集成中心模块 */}
            <Route path="integration" element={<Navigate to="/integration/inbound" replace />} />
            <Route path="integration/inbound" element={<InboundConfig />} />
            <Route path="integration/outbound" element={<OutboundConfig />} />
            <Route path="integration/logs" element={<RequestLog />} />
            
            {/* 用户相关 */}
            <Route path="user/profile" element={<UserProfile />} />
            <Route path="user/settings" element={<UserSettings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;