import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';

interface IntegrationLog {
  id: number;
  config_id: number;
  request_data: Record<string, any>;
  response_data: Record<string, any>;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function RequestLog() {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/v1/integration/logs?skip=0&limit=100');
      setLogs(response.data);
    } catch { console.error('获取日志失败'); }
    finally { setLoading(false); }
  };

  const filteredLogs = logs.filter(log => log.status.includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">请求日志</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white" />
      </div>

      <div className="rounded-lg bg-dark-card border border-tech-blue/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">配置ID</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">状态</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">时间</th>
              <th className="px-4 py-3 text-left text-sm text-muted-foreground">错误信息</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">暂无日志</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-tech-blue/10">
                  <td className="px-4 py-3 text-white">{log.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.config_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.error_message || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}