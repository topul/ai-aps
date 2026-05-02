import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import type { Message } from '../../types/session';
import ReactMarkdown from 'react-markdown';

interface SessionDetailProps {
  sessionId: number;
}

interface MessageWithReasoning extends Message {
  reasoning_content?: string;
}

function formatMessageContent(content: string) {
  if (!content) return <span className="text-muted-foreground">...</span>;
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
  const [messages, setMessages] = useState<MessageWithReasoning[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
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

    const tempMessage: MessageWithReasoning = {
      id: Date.now(),
      conversation_id: sessionId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    let assistantContent = '';
    let assistantId = Date.now() + 1;
    let reasoningContent = '';

    try {
      const userResp = await api.post(`/api/v1/sessions/${sessionId}/messages`, {
        role: 'user',
        content: userMessage,
      });
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, id: userResp.data.id } : m));

      setMessages(prev => [...prev, { id: assistantId, conversation_id: sessionId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);

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
            
            if (data.startsWith('[REASONING]')) {
              const content = data.slice(12);
              reasoningContent += content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, reasoning_content: (m.reasoning_content || '') + content } : m));
              continue;
            }
            
            if (data.startsWith('[REASONING')) continue;
            
            assistantContent += data;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
          }
        }

        await api.post(`/api/v1/sessions/${sessionId}/messages`, {
          role: 'assistant',
          content: assistantContent || '已收到您的消息',
          reasoning_content: reasoningContent || undefined,
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
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg ${msg.role === 'user' ? 'bg-gradient-tech text-white' : 'bg-dark-card border border-tech-blue/20'}`}>
                {msg.reasoning_content && !msg.content && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">深度思考中...</span>
                  </div>
                )}
                {msg.reasoning_content && msg.content && expandedReasoning.has(msg.id) && (
                  <div className="mb-3 p-3 rounded-lg bg-black/20 border border-gray-700">
                    <button type="button" onClick={() => setExpandedReasoning(prev => { const next = new Set(prev); next.has(msg.id) ? next.delete(msg.id) : next.add(msg.id); return next; })} className="flex items-center gap-2 w-full text-gray-400 text-xs hover:text-gray-300">
                      <Sparkles className="w-3 h-3" />
                      <span>深度思考</span>
                      {expandedReasoning.has(msg.id) ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                    </button>
                    {expandedReasoning.has(msg.id) && <div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{msg.reasoning_content}</div>}
                  </div>
                )}
                {msg.reasoning_content && msg.content && !expandedReasoning.has(msg.id) && (
                  <button type="button" onClick={() => setExpandedReasoning(prev => new Set(prev).add(msg.id))} className="flex items-center gap-2 mb-2 text-xs text-gray-500 hover:text-gray-400">
                    <Sparkles className="w-3 h-3" />
                    <span>查看深度思考</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <div className="text-sm">{formatMessageContent(msg.content)}</div>
                {msg.content && !sending && <p className="text-xs opacity-60 mt-2">{formatTime(msg.created_at)}</p>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-tech-blue/20">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入消息..." className="flex-1 px-4 py-3 rounded-lg bg-dark-bg border border-tech-blue/20 text-white focus:outline-none focus:border-tech-blue/50" disabled={sending} />
          <button type="submit" disabled={sending || !input.trim()} className="px-4 py-2 rounded-lg bg-gradient-tech text-white hover:opacity-90 disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}