import { useState, useEffect } from 'react';
import { Play, Search } from 'lucide-react';
import { api } from '../../services/api';
import type { Order } from '../../types/index';

export default function PendingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/v1/orders?skip=0&limit=1000');
      setOrders(response.data.filter((o: Order) => o.status === 'pending'));
    } catch (error) { console.error('获取订单失败:', error); }
    finally { setLoading(false); }
  };

  const handleSelect = (id: number) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleSchedule = async () => {
    if (selectedOrders.length === 0) return;
    try {
      await api.post('/api/v1/scheduling/run', { order_ids: selectedOrders });
      alert('排产成功');
      fetchOrders();
    } catch { alert('排产失败'); }
  };

  const filteredOrders = orders.filter(o => 
    o.order_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">待排订单</h2>
        <button
          onClick={handleSchedule}
          disabled={selectedOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          开始排产 ({selectedOrders.length})
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索订单..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
        />
      </div>

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0} onChange={handleSelectAll} className="w-4 h-4" />
              </th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">订单号</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">产品ID</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">数量</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">优先级</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">截止日期</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无待排订单</td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-tech-blue/10">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => handleSelect(order.id)} className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3 text-white">{order.order_no}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.product_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.priority}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.due_date}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">{order.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}