import { Download, Upload, Plus, Trash2, Edit, Search } from 'lucide-react';
import { downloadTemplate } from '../../utils/template';
import { api } from '../../services/api';
import type { Resource } from '../../types/index';
import { useState, useEffect, useRef } from 'react';

interface ResourceFormData {
  resource_code: string;
  name: string;
  type: 'machine' | 'worker' | 'tool';
  capacity: number;
  status: 'available' | 'busy' | 'maintenance' | 'offline';
}

export default function ResourceManagement() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    resource_code: '',
    name: '',
    type: 'machine',
    capacity: 0,
    status: 'available',
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      const response = await api.get('/api/v1/resources?skip=0&limit=1000');
      setResources(response.data);
    } catch (error) {
      console.error('获取资源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => downloadTemplate('resource', '资源管理模板');

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    try {
      await api.post('/api/v1/import-export/resources', formDataFile);
      fetchResources();
      alert('导入成功');
    } catch { alert('导入失败'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/v1/resources/${editingId}`, formData);
      else await api.post('/api/v1/resources', formData);
      fetchResources();
      resetForm();
    } catch { console.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.delete(`/api/v1/resources/${id}`);
      fetchResources();
    } catch { console.error('删除失败'); }
  };

  const handleEdit = (resource: Resource) => {
    setFormData({
      resource_code: resource.resource_code,
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      status: resource.status,
    });
    setEditingId(resource.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ resource_code: '', name: '', type: 'machine', capacity: 0, status: 'available' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredResources = resources.filter(r => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.resource_code?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">资源管理</h2>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Download className="w-4 h-4" />模板下载</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Upload className="w-4 h-4" />导入</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"><Plus className="w-4 h-4" />新建资源</button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="搜索资源..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50" />
      </div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">{editingId ? '编辑资源' : '新建资源'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-muted-foreground mb-1">资源编码 *</label><input type="text" value={formData.resource_code} onChange={(e) => setFormData({...formData, resource_code: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">资源名称 *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">类型</label><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"><option value="machine">设备</option><option value="worker">人员</option><option value="tool">工具</option></select></div>
            <div><label className="block text-sm text-muted-foreground mb-1">产能</label><input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground">取消</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-tech text-white">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg"><tr><th className="px-4 py-3 text-left text-sm text-muted-foreground">资源编码</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">资源名称</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">类型</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">产能</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">状态</th><th className="px-4 py-3 text-right text-sm text-muted-foreground">操作</th></tr></thead>
          <tbody>
            {filteredResources.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr> : filteredResources.map((r) => (
              <tr key={r.id} className="border-t border-tech-blue/10">
                <td className="px-4 py-3 text-white">{r.resource_code}</td>
                <td className="px-4 py-3 text-white">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.type === 'machine' ? '设备' : r.type === 'worker' ? '人员' : '工具'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.capacity}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${r.status === 'available' ? 'bg-green-500/20 text-green-400' : r.status === 'busy' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{r.status === 'available' ? '可用' : r.status === 'busy' ? '使用中' : '离线'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-tech-blue/20"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 ml-1"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}