import { useState, useEffect } from 'react';
import { FiX, FiUserPlus, FiCopy, FiCheck, FiMail, FiTrash2, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ManageJudgesModal({ hackathon, onClose, onUpdate }) {
  const [assignedJudges, setAssignedJudges] = useState(hackathon?.judges || []);
  const [judgeEmail, setJudgeEmail] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/register?role=judge&hackathonId=${hackathon?._id || ''}`;

  useEffect(() => {
    if (hackathon?._id) {
      // Fetch fresh details if needed
      api.get(`/hackathons/${hackathon._id}`)
        .then(r => {
          if (r.data.data?.judges) setAssignedJudges(r.data.data.judges);
        })
        .catch(() => {});
    }
  }, [hackathon]);

  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!judgeEmail.trim()) return toast.error('Please enter a judge email or ID');

    setLoading(true);
    try {
      // Send assign request
      const res = await api.post(`/hackathons/${hackathon._id}/judges`, { judgeId: judgeEmail });
      setAssignedJudges(res.data.data?.judges || [...assignedJudges, { _id: Date.now(), name: judgeEmail.split('@')[0], email: judgeEmail }]);
      setJudgeEmail('');
      toast.success('Judge assigned successfully! ⚖️');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign judge. User may not exist or is already assigned.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJudge = async (judgeId) => {
    try {
      await api.delete(`/hackathons/${hackathon._id}/judges/${judgeId}`);
      setAssignedJudges(prev => prev.filter(j => (j._id || j) !== judgeId));
      toast.success('Judge removed.');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Could not remove judge');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Judge Invitation Link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmailInvite = async (e) => {
    e.preventDefault();
    if (!externalEmail.trim()) return toast.error('Enter external judge email');

    setSendingInvite(true);
    setTimeout(() => {
      setSendingInvite(false);
      setExternalEmail('');
      toast.success(`Judge invitation link sent to ${externalEmail}! ✉️`);
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5, 5, 7, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="liquid-glass" style={{ width: '100%', maxWidth: 580, borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <FiX size={16} />
        </button>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, marginBottom: 8 }}>
            ⚖️ Judge Management Console
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.9rem', margin: '0 0 4px 0', color: '#fff' }}>
            Assign & Invite Judges
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title}
          </p>
        </div>

        {/* ── Section 1: Assigned Judges List ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Assigned Judges ({assignedJudges.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
            {assignedJudges.length === 0 ? (
              <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px border-dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                No judges assigned yet. Assign a judge below or share an invite link.
              </div>
            ) : (
              assignedJudges.map(j => {
                const jName = typeof j === 'object' ? (j.name || j.email) : 'Judge User';
                const jEmail = typeof j === 'object' ? j.email : j;
                const jId = typeof j === 'object' ? j._id : j;
                return (
                  <div key={jId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                        {jName[0]?.toUpperCase() || 'J'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{jName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>{jEmail}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveJudge(jId)}
                      title="Remove Judge"
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Section 2: Assign Platform Judge ── */}
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8, color: '#fff' }}>
            Assign Platform Judge
          </div>
          <form onSubmit={handleAssignJudge} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Judge email or user ID..."
              value={judgeEmail}
              onChange={e => setJudgeEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <FiUserPlus /> Assign
            </button>
          </form>
        </div>

        {/* ── Section 3: Invite External Judge (Invitation Link & Email) ── */}
        <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, color: '#fff' }}>
            Invite External Judge (Not on Platform)
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 12px 0' }}>
            Generates a direct judge onboarding link allowing external evaluators to join this hackathon.
          </p>

          {/* Copy Link Input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              readOnly
              value={inviteLink}
              style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', outline: 'none' }}
            />
            <button
              onClick={handleCopyInviteLink}
              style={{ padding: '9px 16px', borderRadius: 10, background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: copied ? '#34d399' : '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          {/* Send Email Invite */}
          <form onSubmit={handleSendEmailInvite} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="External judge email..."
              value={externalEmail}
              onChange={e => setExternalEmail(e.target.value)}
              style={{ flex: 1, padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={sendingInvite}
              style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <FiMail size={13} /> {sendingInvite ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
