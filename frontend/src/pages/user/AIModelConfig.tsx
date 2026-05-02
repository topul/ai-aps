import { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

interface AIConfigItem {
  id: number;
  name: string;
  provider: string;
  api_key?: string;
  api_base?: string;
  model: string;
  parameters: { temperature?: number; max_tokens?: number };
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export default function AIModelConfig() {
  const [configs, setConfigs] = useState<AIConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    api_key: '',
    api_base: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2000,
    is_default: false,
  });

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/api/v1/ai-config');
      setConfigs(response.data);
    } catch { console.error('获取配置失败'); }
    finally { setLoading(false); }
  };

  const handleEdit = async (config: AIConfigItem) => {
    try {
      const response = await api.get(`/api/v1/ai-config/${config.id}/detail`);
      const detail = response.data;
      setEditingId(config.id);
      setFormData({
        name: detail.name,
        provider: detail.provider,
        api_key: detail.api_key || '',
        api_base: detail.api_base || '',
        model: detail.model,
        temperature: detail.parameters?.temperature || 0.7,
        max_tokens: detail.parameters?.max_tokens || 2000,
        is_default: config.is_default,
      });
      setTestResult(null);
    } catch { alert('获取配置详情失败'); }
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      provider: 'openai',
      api_key: '',
      api_base: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 2000,
      is_default: false,
    });
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await api.post('/api/v1/ai-config/test-connection', {
        provider: formData.provider,
        api_key: formData.api_key,
        api_base: formData.provider === 'custom' ? formData.api_base : null,
        model: formData.model,
        parameters: {
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
        },
      });
      if (response.data.status === 'success') {
        setTestResult({ success: true, message: response.data.message || '连接成功' });
      } else {
        setTestResult({ success: false, message: response.data.message || '连接失败' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.response?.data?.detail || '连接失败' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      formData.name = `${formData.provider}_${formData.model}`;
    }
    try {
      if (editingId) {
        await api.put(`/api/v1/ai-config/${editingId}`, {
          name: formData.name,
          provider: formData.provider,
          api_key: formData.api_key || undefined,
          api_base: formData.provider === 'custom' ? formData.api_base : null,
          model: formData.model,
          parameters: {
            temperature: formData.temperature,
            max_tokens: formData.max_tokens,
          },
          is_active: true,
          is_default: formData.is_default,
        });
      } else {
        await api.post('/api/v1/ai-config', {
          name: formData.name,
          provider: formData.provider,
          api_key: formData.api_key,
          api_base: formData.provider === 'custom' ? formData.api_base : null,
          model: formData.model,
          parameters: {
            temperature: formData.temperature,
            max_tokens: formData.max_tokens,
          },
          is_active: true,
          is_default: formData.is_default,
        });
      }
      alert('保存成功');
      fetchConfigs();
      handleNew();
    } catch (error: any) {
      alert('保存失败: ' + (error.response?.data?.detail || ''));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此配置吗？')) return;
    try {
      await api.delete(`/api/v1/ai-config/${id}`);
      fetchConfigs();
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.post(`/api/v1/ai-config/${id}/set-default`);
      fetchConfigs();
    } catch (error: any) {
      alert(error.response?.data?.detail || '设置失败');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* 配置列表 */}
      <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">AI模型配置</h3>
          <button onClick={handleNew} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-tech text-white text-sm">
            <Plus className="w-3.5 h-3.5" /> 新建
          </button>
        </div>
        
        {configs.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无配置，点击新建添加</p>
        ) : (
          <div className="space-y-2">
            {configs.map(config => (
              <div key={config.id} className={`flex items-center justify-between p-3 rounded-lg border ${config.is_default ? 'bg-tech-blue/10 border-tech-blue/30' : 'bg-dark-bg border-tech-blue/10'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{config.name}</span>
                    {config.is_default && <span className="text-xs bg-tech-blue/30 px-2 py-0.5 rounded text-tech-blue">默认</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.provider} / {config.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!config.is_default && (
                    <button onClick={() => handleSetDefault(config.id)} className="text-xs text-muted-foreground hover:text-white">设为默认</button>
                  )}
                  <button onClick={() => handleEdit(config)} className="p-1.5 rounded hover:bg-tech-blue/20 text-muted-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!config.is_default && (
                    <button onClick={() => handleDelete(config.id)} className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 编辑表单 */}
      {(editingId !== null || formData.name || formData.api_key) && (
        <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20 space-y-6">
          <h3 className="text-lg font-medium text-white">{editingId ? '编辑配置' : '新建配置'}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">配置名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
                placeholder="my-config"
              />
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">模型提供商</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">模型名称</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">API Key {editingId && '(留空则不修改)'}</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {formData.provider === 'custom' && (
              <div className="col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">API Base URL</label>
                <input
                  type="text"
                  value={formData.api_base}
                  onChange={(e) => setFormData({ ...formData, api_base: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
                  placeholder="https://api.example.com/v1"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Max Tokens</label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_default" className="text-sm text-muted-foreground">设为默认配置</label>
            </div>
          </div>
          
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{testResult.message}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !formData.api_key}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tech-blue/30 text-muted-foreground hover:text-white disabled:opacity-50"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}