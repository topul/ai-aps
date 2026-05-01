import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Search } from 'lucide-react';
import { api } from '../../services/api';
import type { Session } from '../../types/session';

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/api/v1/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const response = await api.post('/api/v1/sessions', { title: '新会话' });
      const newSession = response.data;
      setSessions([newSession, ...sessions]);
      window.location.href = `/sessions/${newSession.id}`;
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('确定要删除这个会话吗？')) return;
    
    try {
      await api.delete(`/api/v1/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-2xl font-bold text-white">会话列表</h2>
        <button
          onClick={createSession}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          新建会话
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索会话..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
        />
      </div>

      <div className="grid gap-3">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无会话，点击新建会话开始对话</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-dark-card border border-tech-blue/20 hover:border-tech-blue/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{session.title || '新会话'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(session.updated_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}