import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import getSocket from '../services/socket';
import { X, Send, Megaphone, MessageSquare, Shield, Users, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommunityChatModal({ hackathon, isOpen, onClose }) {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general'); // 'announcements' | 'general' | 'judges'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const isOrganizer = user && (hackathon?.organizer?._id === user._id || hackathon?.organizer === user._id || user.role === 'admin' || user.role === 'organizer');
  const isJudge = user && (hackathon?.judges || []).some(j => (j._id || j) === user._id || user.role === 'judge');

  useEffect(() => {
    if (!isOpen || !hackathon?._id) return;

    const socket = getSocket();
    const hackathonId = hackathon._id;

    socket.emit('joinHackathon', hackathonId);
    if (isOrganizer || isJudge) {
      socket.emit('joinJudgeRoom', hackathonId);
    }

    fetchChannelMessages(activeChannel);

    const handleCommunityNew = (msg) => {
      if (msg.channel === activeChannel) {
        setMessages(prev => [...prev.filter(m => m._id !== msg._id), msg]);
      }
    };

    const handleJudgeNew = (msg) => {
      if (activeChannel === 'judges') {
        setMessages(prev => [...prev.filter(m => m._id !== msg._id), msg]);
      }
    };

    socket.on('community:new', handleCommunityNew);
    socket.on('judge:new', handleJudgeNew);

    return () => {
      socket.off('community:new', handleCommunityNew);
      socket.off('judge:new', handleJudgeNew);
      socket.emit('leaveHackathon', hackathonId);
      if (isOrganizer || isJudge) {
        socket.emit('leaveJudgeRoom', hackathonId);
      }
    };
  }, [isOpen, hackathon?._id, activeChannel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChannelMessages = async (ch) => {
    setLoading(true);
    try {
      const res = await api.get(`/community/${hackathon._id}/messages`, {
        params: { channel: ch }
      });
      const list = res.data?.data?.messages || [];
      setMessages(list);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeChannel === 'announcements' && !isOrganizer) {
      return toast.error('Only the Organizer can post announcements!');
    }
    if (activeChannel === 'judges' && !isOrganizer && !isJudge) {
      return toast.error('Judges Lounge is restricted to Judges and Organizers!');
    }

    const text = inputText;
    setInputText('');

    try {
      const res = await api.post(`/community/${hackathon._id}/messages`, {
        text,
        channel: activeChannel,
      });
      if (res.data?.data) {
        setMessages(prev => [...prev.filter(m => m._id !== res.data.data._id), res.data.data]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5, 5, 8, 0.82)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 860, height: '82vh', background: 'rgba(12, 13, 20, 0.95)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#060709', fontWeight: 800 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {hackathon?.title || 'Hackathon Community Hub'}
                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', fontWeight: 700 }}>● Live Socket</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Real-time collaboration between Organizers, Participants & Judges
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body grid: Channels + Messages */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          
          {/* Channel Sidebar */}
          <div style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, padding: '4px 8px', marginBottom: 2 }}>
              Channels
            </div>

            {[
              { id: 'general', label: 'General Chat', icon: MessageSquare, badge: 'All' },
              { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: 'Broadcast' },
              { id: 'judges', label: 'Judges Lounge', icon: Shield, badge: 'Private', lock: !isOrganizer && !isJudge },
            ].map(ch => {
              const Icon = ch.icon;
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => !ch.lock && setActiveChannel(ch.id)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid',
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                    borderColor: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                    color: ch.lock ? 'rgba(255,255,255,0.25)' : isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                    cursor: ch.lock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 500, transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={16} color={isActive ? '#fff' : 'rgba(255,255,255,0.45)'} />
                    <span>{ch.label}</span>
                  </div>
                  {ch.lock ? <Lock size={12} /> : (
                    <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 6, background: isActive ? '#fff' : 'rgba(255,255,255,0.06)', color: isActive ? '#060709' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                      {ch.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat Feed */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'rgba(5,6,10,0.5)' }}>
            
            {/* Feed Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeChannel === 'announcements' && <span>📢 <strong>Announcements Channel</strong> — Official updates from the Organizer</span>}
              {activeChannel === 'general' && <span>💬 <strong>General Community</strong> — Connect with participants and judges</span>}
              {activeChannel === 'judges' && <span>⚖️ <strong>Judges Lounge</strong> — Confidential evaluation discussion for Judges & Organizers</span>}
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading live messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
                  No messages in this channel yet. Be the first to start the conversation!
                </div>
              ) : messages.map((m, idx) => {
                const isMe = m.sender?._id === user?._id || m.sender === user?._id;
                const roleTag = m.sender?.role || 'participant';
                const roleColor = roleTag === 'organizer' ? '#fbbf24' : roleTag === 'judge' ? '#a78bfa' : '#38bdf8';

                return (
                  <div key={m._id || idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                      {(m.sender?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ maxWidth: '72%' }}>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginBottom: 3, textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 6, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{m.sender?.name || 'Participant'}</span>
                        <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 4, background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`, fontWeight: 700 }}>
                          {roleTag.toUpperCase()}
                        </span>
                        <span>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 16, fontSize: '0.82rem', lineHeight: 1.5,
                        background: isMe ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        color: isMe ? '#060709' : '#ffffff',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: isMe ? '0 4px 14px rgba(255,255,255,0.25)' : 'none',
                      }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder={
                  activeChannel === 'announcements' && !isOrganizer
                    ? 'Only Organizer can post announcements...'
                    : activeChannel === 'judges' && !isOrganizer && !isJudge
                    ? 'Restricted to Judges...'
                    : `Message #${activeChannel}...`
                }
                disabled={activeChannel === 'announcements' && !isOrganizer}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || (activeChannel === 'announcements' && !isOrganizer)}
                style={{
                  padding: '10px 18px', borderRadius: 12, background: inputText.trim() ? '#ffffff' : 'rgba(255,255,255,0.1)',
                  border: 'none', color: inputText.trim() ? '#060709' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.8rem',
                  cursor: inputText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                }}
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
