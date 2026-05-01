import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { api } from '../../services/api';
import type { Session, Message } from '../../types/session';

function formatMessageContent(content: string) {
  return content.split('\n').map((line, i) => (
    <p key={i} className="mb-1">{line || '\u00A0'}</p>
  ));
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchSession(id);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSession = async (sessionId: string) => {
    try {
      const response = await api.get(`/api/v1/sessions/${sessionId}`);
      setSession(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('获取会话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempMessage: Message = {
      id: Date.now(),
      conversation_id: Number(id),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await api.post(`/api/v1/sessions/${id}/messages`, {
        role: 'user',
        content: userMessage,
      });

      const response = await api.post('/api/v1/chat/message', {
        message: userMessage,
        context: { conversation_id: id },
      });

      const botResponse = await api.post(`/api/v1/sessions/${id}/messages`, {
        role: 'assistant',
        content: response.data.message || response.data.content || '已收到您的消息',
      });
      setMessages(prev => [...prev, botResponse.data]);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{session?.title || '会话详情'}</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-dark-card/50 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>开始发送消息进行对话</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-tech text-white'
                    : 'bg-dark-card border border-tech-blue/20'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {formatMessageContent(msg.content)}
                </div>
                <p className="text-xs opacity-60 mt-2">
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 rounded-lg bg-dark-card border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}