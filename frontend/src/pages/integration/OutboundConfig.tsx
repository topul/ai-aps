import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { api } from '../../services/api';

interface IntegrationConfig {
  id: number;
  name: string;
  config_type: string;
  config_data: Record<string, any>;
  is_active: boolean;
}

export default function OutboundConfig() {
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', config_type: 'api', config_data: '{}' });

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/api/v1/integration/outbound');
      setConfigs(response.data);
    } catch { console.error('获取配置失败'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, config_data: JSON.parse(formData.config_data) };
      if (editingId) await api.put(`/api/v1/integration/outbound/${editingId}`, data);
      else await api.post('/api/v1/integration/outbound', data);
      fetchConfigs();
      resetForm();
    } catch { alert('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try {
      await api.delete(`/api/v1/integration/outbound/${id}`);
      fetchConfigs();
    } catch { alert('删除失败'); }
  };

  const handleEdit = (config: IntegrationConfig) => {
    setFormData({ name: config.name, config_type: config.config_type, config_data: JSON.stringify(config.config_data) });
    setEditingId(config.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', config_type: 'api', config_data: '{}' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">出站配置</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"><Plus className="w-4 h-4" />新建配置</button>
      </div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">{editingId ? '编辑配置' : '新建配置'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-muted-foreground mb-1">名称 *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">类型</label><select value={formData.config_type} onChange={(e) => setFormData({...formData, config_type: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"><option value="api">API</option><option value="webhook">Webhook</option><option value="file">文件</option></select></div>
            <div><label className="block text-sm text-muted-foreground mb-1">配置(JSON)</label><textarea value={formData.config_data} onChange={(e) => setFormData({...formData, config_data: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white h-32" /></div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground">取消</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-tech text-white">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {configs.length === 0 ? <div className="p-8 text-center text-muted-foreground">暂无配置</div> : configs.map((config) => (
          <div key={config.id} className="p-4 rounded-lg bg-dark-card border border-tech-blue/20 flex items-center justify-between">
            <div><h3 className="font-medium text-white">{config.name}</h3><p className="text-sm text-muted-foreground">{config.config_type}</p></div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(config)} className="p-2 rounded-lg text-muted-foreground hover:text-white"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(config.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}