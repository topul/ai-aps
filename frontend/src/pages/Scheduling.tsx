import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulingApi, ordersApi } from '../services/api';
import ScheduleGantt from '../components/gantt/ScheduleGantt';

export default function Scheduling() {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list().then((res) => res.data),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulingApi.listSchedules().then((res) => res.data),
  });

  const { data: analysis } = useQuery({
    queryKey: ['analysis', schedules?.map((s: any) => s.id)],
    queryFn: () => {
      if (!schedules || schedules.length === 0) return null;
      return schedulingApi.analyzeSchedules(schedules.map((s: any) => s.id)).then((res) => res.data);
    },
    enabled: !!schedules && schedules.length > 0,
  });

  const runSchedulingMutation = useMutation({
    mutationFn: (orderIds: number[]) =>
      schedulingApi.run({ order_ids: orderIds, config_id: 1, async_mode: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setSelectedOrders([]);
    },
  });

  const handleRunScheduling = () => {
    if (selectedOrders.length === 0) {
      alert('请先选择订单');
      return;
    }
    runSchedulingMutation.mutate(selectedOrders);
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">智能排产</h2>
        <button
          onClick={handleRunScheduling}
          disabled={selectedOrders.length === 0 || runSchedulingMutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {runSchedulingMutation.isPending ? '排产中...' : '执行排产'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 订单选择 */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">选择订单</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <label
                  key={order.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrderSelection(order.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{order.order_no}</div>
                    <div className="text-sm text-muted-foreground">
                      数量: {order.quantity} | 优先级: {order.priority}
                    </div>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">暂无订单</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              已选择 {selectedOrders.length} 个订单
            </p>
          </div>
        </div>

        {/* 排产结果 */}
        <div className="lg:col-span-2 bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">排产结果</h3>
          {schedulesLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : schedules && schedules.length > 0 ? (
            <ScheduleGantt schedules={schedules} />
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">暂无排产结果</p>
                <p className="text-sm text-muted-foreground">
                  请选择订单并点击"执行排产"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 分析结果 */}
      {analysis && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">排产分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 资源利用率 */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">资源利用率</p>
              {analysis.resource_utilization &&
                Object.entries(analysis.resource_utilization).map(([name, data]: [string, any]) => (
                  <div key={name} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="font-medium">{data.utilization_rate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${data.utilization_rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>

            {/* 准时率 */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">准时率</p>
              <div className="text-3xl font-bold">{analysis.on_time_rate?.on_time_rate}%</div>
              <div className="text-sm text-muted-foreground mt-2">
                准时: {analysis.on_time_rate?.on_time_count} | 延期:{' '}
                {analysis.on_time_rate?.late_count}
              </div>
            </div>

            {/* 瓶颈资源 */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">瓶颈资源</p>
              {analysis.bottleneck_resources?.map((resource: any, idx: number) => (
                <div key={idx} className="text-sm mb-1">
                  {resource.resource_name}: {resource.task_count} 任务
                </div>
              ))}
            </div>

            {/* 完工统计 */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">完工统计</p>
              <div className="text-sm space-y-1">
                <div>平均时长: {analysis.completion_stats?.avg_duration_hours}h</div>
                <div>最短: {analysis.completion_stats?.min_duration_hours}h</div>
                <div>最长: {analysis.completion_stats?.max_duration_hours}h</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
