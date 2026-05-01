import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Schedule } from '../../types/index';

export default function OrderPlan() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/api/v1/scheduling/schedules?skip=0&limit=100');
      setSchedules(response.data);
    } catch (error) { console.error('获取排产结果失败:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">订单计划（甘特图）</h2>
      <div className="p-8 rounded-lg bg-dark-card border border-tech-blue/20 text-center text-muted-foreground">
        <p>甘特图组件开发中...</p>
        <p className="text-sm mt-2">排产结果数量: {schedules.length}</p>
      </div>
    </div>
  );
}