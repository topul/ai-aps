import { Outlet } from 'react-router-dom';
import { ParticleBackground } from '../effects/ParticleBackground';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <ParticleBackground />
      
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