import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { schedulingApi } from '../services/api';
import ChatInterface from '../components/chat/ChatInterface';
import ScheduleGantt from '../components/gantt/ScheduleGantt';
import { PageTransition } from '../components/effects/PageTransition';
import { DataLoading } from '../components/effects/LoadingAnimation';
import { CardGlow } from '../components/effects/ParticleBackground';

export default function Dashboard() {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulingApi.listSchedules().then((res) => res.data),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* 标题区域 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gradient">排产仪表盘</h2>
            <p className="text-muted-foreground mt-1">实时监控生产排程状态</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-tech-cyan rounded-full animate-pulse shadow-neon-cyan" />
            <span className="text-sm text-muted-foreground">实时同步</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 甘特图区域 */}
          <CardGlow className="lg:col-span-2">
            <div className="card-tech">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                  排产甘特图
                </h3>
                <div className="text-xs text-muted-foreground">
                  {schedules?.length || 0} 个任务
                </div>
              </div>

              {isLoading ? (
                <DataLoading message="加载排产数据..." />
              ) : schedules && schedules.length > 0 ? (
                <ScheduleGantt schedules={schedules} />
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-tech-blue/20 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tech-blue/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-tech-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground mb-2">暂无排产数据</p>
                    <p className="text-sm text-muted-foreground/70">
                      请先在数据管理页面添加订单和资源，然后执行排产
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardGlow>

          {/* AI对话区域 */}
          <CardGlow>
            <div className="card-tech h-full">
              <ChatInterface />
            </div>
          </CardGlow>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardGlow>
            <div className="data-panel">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">总订单数</p>
                <div className="w-8 h-8 rounded-lg bg-tech-blue/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-tech-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gradient">{schedules?.length || 0}</p>
            </div>
          </CardGlow>

          <CardGlow>
            <div className="data-panel">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">已排产</p>
                <div className="w-8 h-8 rounded-lg bg-tech-cyan/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-tech-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-tech-cyan">{schedules?.length || 0}</p>
            </div>
          </CardGlow>

          <CardGlow>
            <div className="data-panel">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">资源利用率</p>
                <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-neon-purple">--</p>
            </div>
          </CardGlow>

          <CardGlow>
            <div className="data-panel">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">准时率</p>
                <div className="w-8 h-8 rounded-lg bg-gradient-success flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-success bg-clip-text text-transparent">--</p>
            </div>
          </CardGlow>
        </div>
      </div>
    </PageTransition>
  );
}
