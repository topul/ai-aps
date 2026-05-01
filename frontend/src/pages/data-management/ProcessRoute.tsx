import { Download, Upload, Plus, Trash2, Edit, Search } from 'lucide-react';
import { downloadTemplate } from '../../utils/template';
import { api } from '../../services/api';
import { useState, useEffect, useRef } from 'react';

interface ProcessRouteFormData {
  code: string;
  product_id: number;
  sequence: number;
  resource_id: number;
  standard_hours: number;
}

export default function ProcessRoute() {
  const [processRoutes, setProcessRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProcessRouteFormData>({ code: '', product_id: 0, sequence: 0, resource_id: 0, standard_hours: 0 });

  useEffect(() => { fetchProcessRoutes(); }, []);

  const fetchProcessRoutes = async () => {
    try {
      const response = await api.get('/api/v1/process-routes?skip=0&limit=1000');
      setProcessRoutes(response.data);
    } catch (error) { console.error('获取工艺路线失败:', error); }
    finally { setLoading(false); }
  };

  const handleDownloadTemplate = () => downloadTemplate('process-route', '工艺路线模板');

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    try {
      await api.post('/api/v1/import-export/process-routes', formDataFile);
      fetchProcessRoutes();
      alert('导入成功');
    } catch { alert('导入失败'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/v1/process-routes/${editingId}`, formData);
      else await api.post('/api/v1/process-routes', formData);
      fetchProcessRoutes();
      resetForm();
    } catch { console.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.delete(`/api/v1/process-routes/${id}`);
      fetchProcessRoutes();
    } catch { console.error('删除失败'); }
  };

  const handleEdit = (item: any) => {
    setFormData({ code: item.code, product_id: item.product_id, sequence: item.sequence, resource_id: item.resource_id, standard_hours: item.standard_hours });
    setEditingId(item.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ code: '', product_id: 0, sequence: 0, resource_id: 0, standard_hours: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">工艺路线</h2>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Download className="w-4 h-4" />模板下载</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Upload className="w-4 h-4" />导入</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"><Plus className="w-4 h-4" />新建工艺路线</button>
        </div>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white" /></div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">{editingId ? '编辑工艺路线' : '新建工艺路线'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-muted-foreground mb-1">工艺路线编码 *</label><input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">产品ID *</label><input type="number" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">工序序号</label><input type="number" value={formData.sequence} onChange={(e) => setFormData({...formData, sequence: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">资源ID</label><input type="number" value={formData.resource_id} onChange={(e) => setFormData({...formData, resource_id: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">标准工时(分钟)</label><input type="number" value={formData.standard_hours} onChange={(e) => setFormData({...formData, standard_hours: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground">取消</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-tech text-white">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg"><tr><th className="px-4 py-3 text-left text-sm text-muted-foreground">ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">编码</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">产品ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">工序</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">资源ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">标准工时</th><th className="px-4 py-3 text-right text-sm text-muted-foreground">操作</th></tr></thead>
          <tbody>
            {processRoutes.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr> : processRoutes.map((item) => (
              <tr key={item.id} className="border-t border-tech-blue/10">
                <td className="px-4 py-3 text-white">{item.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.product_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.sequence}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.resource_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.standard_hours}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 ml-1"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}