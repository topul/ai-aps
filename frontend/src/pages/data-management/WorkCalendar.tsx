import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useState, useEffect } from 'react';

interface CalendarFormData {
  resource_id: number;
  date: string;
  shift_start: string;
  shift_end: string;
  is_working_day: boolean;
}

export default function WorkCalendar() {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CalendarFormData>({ resource_id: 0, date: '', shift_start: '09:00', shift_end: '18:00', is_working_day: true });

  useEffect(() => { fetchCalendars(); }, []);

  const fetchCalendars = async () => {
    try {
      const response = await api.get('/api/v1/calendar?skip=0&limit=1000');
      setCalendars(response.data);
    } catch (error) { console.error('获取日历失败:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/v1/calendar/${editingId}`, formData);
      else await api.post('/api/v1/calendar', formData);
      fetchCalendars();
      resetForm();
    } catch { console.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.delete(`/api/v1/calendar/${id}`);
      fetchCalendars();
    } catch { console.error('删除失败'); }
  };

  const handleEdit = (item: any) => {
    setFormData({ resource_id: item.resource_id, date: item.date, shift_start: item.shift_start, shift_end: item.shift_end, is_working_day: item.is_working_day });
    setEditingId(item.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ resource_id: 0, date: '', shift_start: '09:00', shift_end: '18:00', is_working_day: true });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">工作日历</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"><Plus className="w-4 h-4" />新建日历</button>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white" /></div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">{editingId ? '编辑日历' : '新建日历'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-muted-foreground mb-1">资源ID *</label><input type="number" value={formData.resource_id} onChange={(e) => setFormData({...formData, resource_id: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">日期 *</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">班次开始</label><input type="time" value={formData.shift_start} onChange={(e) => setFormData({...formData, shift_start: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">班次结束</label><input type="time" value={formData.shift_end} onChange={(e) => setFormData({...formData, shift_end: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={formData.is_working_day} onChange={(e) => setFormData({...formData, is_working_day: e.target.checked})} className="w-4 h-4" /><label className="text-sm text-muted-foreground">是否工作日</label></div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground">取消</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-tech text-white">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg"><tr><th className="px-4 py-3 text-left text-sm text-muted-foreground">ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">资源ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">日期</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">班次</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">是否工作日</th><th className="px-4 py-3 text-right text-sm text-muted-foreground">操作</th></tr></thead>
          <tbody>
            {calendars.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr> : calendars.map((item) => (
              <tr key={item.id} className="border-t border-tech-blue/10">
                <td className="px-4 py-3 text-white">{item.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.resource_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.shift_start}-{item.shift_end}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${item.is_working_day ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.is_working_day ? '是' : '否'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 ml-1"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}