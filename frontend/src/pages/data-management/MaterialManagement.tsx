import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Edit, Search } from 'lucide-react';
import { downloadTemplate } from '../../utils/template';
import { api } from '../../services/api';
import type { Material } from '../../types/index';

interface MaterialFormData {
  material_code: string;
  name: string;
  spec?: string;
  unit: string;
  stock_quantity: number;
  lead_time: number;
  supplier?: string;
}

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    material_code: '',
    name: '',
    spec: '',
    unit: '',
    stock_quantity: 0,
    lead_time: 0,
    supplier: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/api/v1/materials?skip=0&limit=1000');
      setMaterials(response.data);
    } catch (error) {
      console.error('获取物料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate('material', '物料管理模板');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/v1/import-export/materials', formData);
      fetchMaterials();
      alert('导入成功');
    } catch (error) {
      alert('导入失败');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/v1/materials/${editingId}`, formData);
      } else {
        await api.post('/api/v1/materials', formData);
      }
      fetchMaterials();
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await api.delete(`/api/v1/materials/${id}`);
      fetchMaterials();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleEdit = (material: Material) => {
    setFormData({
      material_code: material.material_code,
      name: material.name,
      spec: '',
      unit: material.unit,
      stock_quantity: material.stock_quantity,
      lead_time: material.lead_time,
      supplier: material.supplier || '',
    });
    setEditingId(material.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      material_code: '',
      name: '',
      spec: '',
      unit: '',
      stock_quantity: 0,
      lead_time: 0,
      supplier: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredMaterials = materials.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.material_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">物料管理</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white hover:border-tech-blue/50 transition-colors"
          >
            <Download className="w-4 h-4" />
            模板下载
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white hover:border-tech-blue/50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            新建物料
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索物料..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
        />
      </div>

      {showForm && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
          <h3 className="text-lg font-medium text-white mb-4">
            {editingId ? '编辑物料' : '新增物料'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">物料编码 *</label>
              <input
                type="text"
                value={formData.material_code}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">物料名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">规格</label>
              <input
                type="text"
                value={formData.spec}
                onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">单位 *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">安全库存</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">提前期(天)</label>
              <input
                type="number"
                value={formData.lead_time}
                onChange={(e) => setFormData({ ...formData, lead_time: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">供应商</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
              />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-tech text-white"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">物料编码</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">物料名称</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">规格</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">单位</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">安全库存</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">提前期</th>
              <th className="px-4 py-3 text-right text-sm text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} className="border-t border-tech-blue/10">
                  <td className="px-4 py-3 text-white">{material.material_code}</td>
                  <td className="px-4 py-3 text-white">{material.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-muted-foreground">{material.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{material.stock_quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{material.lead_time}天</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(material)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-tech-blue/20"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}