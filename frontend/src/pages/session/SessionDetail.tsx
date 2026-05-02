import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../../services/api';
import type { Message } from '../../types/session';

interface SessionDetailProps {
  sessionId: number;
}

function formatMessageContent(content: string) {
  return content.split('\n').map((line, i) => (
    <p key={i} className="mb-1">{line || '\u00A0'}</p>
  ));
}

export default function SessionDetail({ sessionId }: SessionDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) fetchSession(sessionId);
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSession = async (id: number) => {
    try {
      const response = await api.get(`/api/v1/sessions/${id}`);
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
    if (!input.trim() || sending || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempMessage: Message = {
      id: Date.now(),
      conversation_id: sessionId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await api.post(`/api/v1/sessions/${sessionId}/messages`, {
        role: 'user',
        content: userMessage,
      });

      const response = await api.post('/api/v1/chat/message/sync', {
        message: userMessage,
        context: { conversation_id: sessionId },
      });

      const replyContent = response.data.response || '已收到您的消息';
      
      const botResponse = await api.post(`/api/v1/sessions/${sessionId}/messages`, {
        role: 'assistant',
        content: replyContent,
      });
      setMessages(prev => [...prev, botResponse.data]);
    } catch (error: any) {
      console.error('发送消息失败:', error);
      const errorMsg = error.response?.data?.response || error.message || '发送失败';
      const botResponse = await api.post(`/api/v1/sessions/${sessionId}/messages`, {
        role: 'assistant',
        content: errorMsg,
      });
      setMessages(prev => [...prev, botResponse.data]);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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

      <form onSubmit={sendMessage} className="p-4 border-t border-tech-blue/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}