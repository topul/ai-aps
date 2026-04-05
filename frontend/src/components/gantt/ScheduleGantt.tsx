import { useEffect, useRef } from 'react';
import type { Schedule } from '../../types';
import { format } from 'date-fns';

interface ScheduleGanttProps {
  schedules: Schedule[];
}

export default function ScheduleGantt({ schedules }: ScheduleGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // TODO: 完整集成 @visactor/vtable-gantt
  // 当前使用简化的时间轴视图

  if (!schedules || schedules.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">暂无排产数据</p>
      </div>
    );
  }

  // 按资源分组
  const groupedByResource = schedules.reduce((acc, schedule) => {
    const key = schedule.resource_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);

  // 计算时间范围
  const allTimes = schedules.flatMap(s => [
    new Date(s.start_time).getTime(),
    new Date(s.end_time).getTime()
  ]);
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const timeRange = maxTime - minTime;

  const getPosition = (time: string) => {
    const t = new Date(time).getTime();
    return ((t - minTime) / timeRange) * 100;
  };

  const getWidth = (start: string, end: string) => {
    const startPos = getPosition(start);
    const endPos = getPosition(end);
    return endPos - startPos;
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500',
  ];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* 时间轴标题 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{format(new Date(minTime), 'yyyy-MM-dd HH:mm')}</span>
        <span>排产甘特图</span>
        <span>{format(new Date(maxTime), 'yyyy-MM-dd HH:mm')}</span>
      </div>

      {/* 甘特图主体 */}
      <div className="space-y-3">
        {Object.entries(groupedByResource).map(([resourceId, resourceSchedules], idx) => (
          <div key={resourceId} className="space-y-1">
            <div className="text-sm font-medium">资源 #{resourceId}</div>
            <div className="relative h-12 bg-muted/30 rounded-lg">
              {resourceSchedules.map((schedule) => {
                const left = getPosition(schedule.start_time);
                const width = getWidth(schedule.start_time, schedule.end_time);
                const colorClass = colors[schedule.order_id % colors.length];

                return (
                  <div
                    key={schedule.id}
                    className={`absolute h-10 top-1 ${colorClass} rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer group`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                    title={`订单 #${schedule.order_id}\n${format(new Date(schedule.start_time), 'HH:mm')} - ${format(new Date(schedule.end_time), 'HH:mm')}`}
                  >
                    <div className="flex items-center justify-center h-full text-white text-xs font-medium px-2 truncate">
                      订单 #{schedule.order_id}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div>订单 #{schedule.order_id}</div>
                      <div>资源 #{schedule.resource_id}</div>
                      <div>{format(new Date(schedule.start_time), 'MM-dd HH:mm')}</div>
                      <div>至 {format(new Date(schedule.end_time), 'MM-dd HH:mm')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-sm pt-4 border-t">
        <span className="text-muted-foreground">图例:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>已排产任务</span>
        </div>
        <div className="text-muted-foreground text-xs">
          提示: 鼠标悬停查看详情
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold">{schedules.length}</div>
          <div className="text-sm text-muted-foreground">总任务数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{Object.keys(groupedByResource).length}</div>
          <div className="text-sm text-muted-foreground">使用资源数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {Math.round((maxTime - minTime) / (1000 * 60 * 60))}h
          </div>
          <div className="text-sm text-muted-foreground">总时长</div>
        </div>
      </div>
    </div>
  );
}
