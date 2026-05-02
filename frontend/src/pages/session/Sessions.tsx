import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Search, Edit2, Check, X, MoreVertical } from 'lucide-react';
import { api } from '../../services/api';
import type { Session } from '../../types/session';
import SessionDetail from './SessionDetail';

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

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
      navigate(`/sessions/${newSession.id}`);
    } catch (error: any) {
      console.error('创建会话失败:', error);
      alert('创建会话失败: ' + (error.response?.data?.detail || error.message || '未知错误'));
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;
    
    try {
      await api.delete(`/api/v1/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (id && parseInt(id) === sessionId) {
        navigate('/sessions');
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  const startEditTitle = (session: Session, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || '新会话');
  };

  const saveTitle = async (sessionId: number) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const response = await api.put(`/api/v1/sessions/${sessionId}`, { title: editTitle.trim() });
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, title: response.data.title } : s));
    } catch (error) {
      console.error('保存标题失败:', error);
    }
    setEditingId(null);
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* 左侧会话列表 */}
      <div className="w-80 flex flex-col bg-dark-card/50 rounded-lg border border-tech-blue/20 overflow-hidden">
        <div className="p-4 border-b border-tech-blue/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">会话</h2>
            <button
              onClick={createSession}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-tech text-white text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              新建
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索会话..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无会话</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/sessions/${session.id}`)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  id && parseInt(id) === session.id
                    ? 'bg-tech-blue/20 border border-tech-blue/30'
                    : 'hover:bg-dark-bg border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveTitle(session.id)}
                        className="flex-1 px-1 py-0.5 text-sm bg-dark-bg border border-tech-blue/30 rounded text-white"
                        autoFocus
                      />
                      <button onClick={() => saveTitle(session.id)} className="p-1 text-green-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-white text-sm truncate flex-1">{session.title || '新会话'}</h3>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === session.id ? null : session.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-white"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === session.id && (
                          <div className="absolute right-0 top-6 w-24 rounded-lg bg-dark-card border border-tech-blue/20 shadow-lg z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditTitle(session, e);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-dark-bg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              编辑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id, e);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(session.updated_at).toLocaleString('zh-CN')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧会话内容 */}
      <div className="flex-1 bg-dark-card/50 rounded-lg border border-tech-blue/20 overflow-hidden">
        {id ? (
          <SessionDetail sessionId={parseInt(id)} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>选择一个会话或新建会话</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
