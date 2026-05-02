import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Message } from '../../types/session';
import ReactMarkdown from 'react-markdown';

interface SessionDetailProps {
  sessionId: number;
}

function formatMessageContent(content: string) {
  if (!content) return <p className="mb-1">...</p>;
  return <ReactMarkdown>{content}</ReactMarkdown>;
}

function formatTime(isoString: string) {
  try {
    let date = new Date(isoString);
    if (isNaN(date.getTime())) {
      date = new Date(isoString + '+00:00');
    }
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch { return '--:--'; }
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

    let assistantId = Date.now() + 1;
    let assistantContent = '';

    try {
      const userResp = await api.post(`/api/v1/sessions/${sessionId}/messages`, {
        role: 'user',
        content: userMessage,
      });
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, id: userResp.data.id } : m));

      const response = await fetch('http://localhost:8000/api/v1/chat/message/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ message: userMessage, context: { conversation_id: sessionId } }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const matches = text.matchAll(/data:\s*(.+)/g);
          for (const match of matches) {
            const data = match[1].trim();
            if (data === '[DONE]') break;
            assistantContent += data;
            setMessages(prev => {
              const exists = prev.find(m => m.id === assistantId);
              if (exists) {
                return prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { id: assistantId, conversation_id: sessionId, role: 'assistant', content: assistantContent, created_at: new Date().toISOString() }];
            });
          }
        }

        await api.post(`/api/v1/sessions/${sessionId}/messages`, {
          role: 'assistant',
          content: assistantContent || '已收到您的消息',
        });
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      const errorMsg = error.response?.data?.response || error.message || '发送失败';
      setMessages(prev => [...prev, { id: assistantId, conversation_id: sessionId, role: 'assistant', content: errorMsg, created_at: new Date().toISOString() }]);
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
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-lg bg-dark-card border border-tech-blue/20">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI 正在思考...</span>
              </div>
            </div>
          </div>
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