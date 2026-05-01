import { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { AIConfig } from '../../types/user';

export default function AIModelConfig() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    provider: 'openai',
    api_key: '',
    api_base_url: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2000,
    is_default: false,
  });

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/api/v1/ai-config');
      const configs: AIConfig[] = response.data;
      if (configs.length > 0) {
        const defaultConfig = configs.find((c: AIConfig) => c.is_default);
        if (defaultConfig) {
          setFormData({
            provider: defaultConfig.provider,
            api_key: defaultConfig.api_key || '',
            api_base_url: defaultConfig.api_base_url || '',
            model: defaultConfig.model,
            temperature: defaultConfig.temperature || 0.7,
            max_tokens: defaultConfig.max_tokens || 2000,
            is_default: true,
          });
        }
      }
    } catch { console.error('获取配置失败'); }
    finally { setLoading(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await api.post('/api/v1/ai-config/test', formData);
      setTestResult({ success: true, message: '连接成功' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.response?.data?.detail || '连接失败' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/api/v1/ai-config', formData);
      alert('保存成功');
      fetchConfigs();
    } catch { alert('保存失败'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20 space-y-6">
      <h3 className="text-lg font-medium text-white">AI模型配置</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">模型提供商</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom (自定义)</option>
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
          <label className="block text-sm text-muted-foreground mb-1">API Key</label>
          <input
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-tech-blue/20 text-white"
            placeholder="sk-..."
          />
        </div>
        
        {formData.provider === 'custom' && (
          <div className="col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">API Base URL</label>
            <input
              type="text"
              value={formData.api_base_url}
              onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
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
  );
}