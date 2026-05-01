import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Edit, Search } from 'lucide-react';
import { downloadTemplate } from '../../utils/template';
import { api } from '../../services/api';

interface BOMFormData {
  product_id: number;
  material_id: number;
  quantity: number;
  sequence: number;
}

export default function BOMManagement() {
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BOMFormData>({ product_id: 0, material_id: 0, quantity: 0, sequence: 0 });

  useEffect(() => { fetchBOMs(); }, []);

  const fetchBOMs = async () => {
    try {
      const response = await api.get('/api/v1/bom?skip=0&limit=1000');
      setBoms(response.data);
    } catch (error) { console.error('获取BOM失败:', error); }
    finally { setLoading(false); }
  };

  const handleDownloadTemplate = () => downloadTemplate('bom', 'BOM管理模板');

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    try {
      await api.post('/api/v1/import-export/bom', formDataFile);
      fetchBOMs();
      alert('导入成功');
    } catch { alert('导入失败'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/v1/bom/${editingId}`, formData);
      else await api.post('/api/v1/bom', formData);
      fetchBOMs();
      resetForm();
    } catch { console.error('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.delete(`/api/v1/bom/${id}`);
      fetchBOMs();
    } catch { console.error('删除失败'); }
  };

  const handleEdit = (bom: any) => {
    setFormData({ product_id: bom.product_id, material_id: bom.material_id, quantity: bom.quantity, sequence: bom.sequence });
    setEditingId(bom.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ product_id: 0, material_id: 0, quantity: 0, sequence: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">BOM管理</h2>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Download className="w-4 h-4" />模板下载</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"><Upload className="w-4 h-4" />导入</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"><Plus className="w-4 h-4" />新建BOM</button>
        </div>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white" /></div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">{editingId ? '编辑BOM' : '新建BOM'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-muted-foreground mb-1">产品ID *</label><input type="number" value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">物料ID *</label><input type="number" value={formData.material_id} onChange={(e) => setFormData({...formData, material_id: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" required /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">数量</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">工序序号</label><input type="number" value={formData.sequence} onChange={(e) => setFormData({...formData, sequence: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white" /></div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground">取消</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-tech text-white">保存</button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg"><tr><th className="px-4 py-3 text-left text-sm text-muted-foreground">ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">产品ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">物料ID</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">数量</th><th className="px-4 py-3 text-left text-sm text-muted-foreground">工序</th><th className="px-4 py-3 text-right text-sm text-muted-foreground">操作</th></tr></thead>
          <tbody>
            {boms.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td></tr> : boms.map((bom) => (
              <tr key={bom.id} className="border-t border-tech-blue/10">
                <td className="px-4 py-3 text-white">{bom.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{bom.product_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{bom.material_id}</td>
                <td className="px-4 py-3 text-muted-foreground">{bom.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{bom.sequence}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleEdit(bom)} className="p-1.5 rounded-lg text-muted-foreground hover:text-white"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(bom.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 ml-1"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}