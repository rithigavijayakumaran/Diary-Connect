import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios.get('/api/messages/conversations')
      .then(r => setConversations(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const openConversation = async (conv) => {
    setActive(conv);
    const res = await axios.get(`/api/messages/${conv.partner._id}`);
    setMessages(res.data.data);
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      const res = await axios.post('/api/messages', { receiverId: active.partner._id, content: text });
      setMessages(prev => [...prev, res.data.data]);
      setText('');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        <p>Secure communication with your trade partners</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--white)', minHeight: 520 }}>
        {/* Conversation list */}
        <div style={{ borderRight: '1px solid var(--gray-200)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Conversations
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button key={conv.conversation} onClick={() => openConversation(conv)}
                style={{
                  display: 'block', width: '100%', padding: '14px 16px', textAlign: 'left',
                  borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                  background: active?.conversation === conv.conversation ? 'var(--gray-100)' : 'transparent',
                  border: 'none', transition: 'background var(--transition)'
                }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)', marginBottom: 3 }}>{conv.partner?.company || conv.partner?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage?.content}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat panel */}
        {active ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: '0.9375rem' }}>
              {active.partner?.company || active.partner?.name}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--gray-400)', marginLeft: 8 }}>{active.partner?.country}</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 360 }}>
              {messages.map((m, i) => {
                const currentUserId = user?._id || user?.id;
                const senderId = m.sender?._id || m.sender;
                const mine = String(senderId) === String(currentUserId);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 4, padding: '0 4px', fontWeight: 500 }}>
                      {mine ? 'You' : (m.sender?.company || m.sender?.name || active.partner?.company || active.partner?.name || 'Partner')}
                    </div>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px',
                      background: mine ? 'var(--black)' : 'var(--gray-100)',
                      color: mine ? 'var(--white)' : 'var(--gray-800)',
                      borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '0.875rem', lineHeight: 1.5
                    }}>
                      <div>{m.content}</div>
                      <div style={{ fontSize: '0.7rem', color: mine ? 'var(--gray-400)' : 'var(--gray-500)', marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--gray-100)' }}>
              <input className="form-input" value={text} onChange={e => setText(e.target.value)}
                placeholder="Type a message..." style={{ flex: 1 }} required />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Send'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-center" style={{ flexDirection: 'column', gap: 8, color: 'var(--gray-300)' }}>
            <div style={{ fontSize: '2rem' }}>💬</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--gray-400)' }}>Select a conversation</div>
          </div>
        )}
      </div>
    </div>
  );
}
