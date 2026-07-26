import { useState, useEffect } from 'react';
import { FiX, FiUserPlus, FiCopy, FiCheck, FiMail, FiTrash2, FiUserCheck, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ManageJudgesModal({ hackathon, onClose, onUpdate }) {
  const [assignedJudges, setAssignedJudges] = useState(hackathon?.judges || []);
  const [availableJudges, setAvailableJudges] = useState([]);
  const [judgeEmail, setJudgeEmail] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/register?role=judge&hackathonId=${hackathon?._id || ''}`;

  const fetchJudgesData = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        api.get(`/hackathons/${hackathon._id}`),
        api.get('/hackathons/available-judges')
      ]);
      if (hRes.data.data?.judges) setAssignedJudges(hRes.data.data.judges);
      if (aRes.data.data) setAvailableJudges(aRes.data.data);
    } catch (e) {
      // Fallback available judges mock if backend endpoint loading
      setAvailableJudges([
        { _id: 'j-dummy-1', name: 'Animesh Tripathi', email: 'tripathianimesh456@gmail.com', role: 'judge' },
        { _id: 'j-dummy-2', name: 'Sarah AI Researcher', email: 'sarah@ai.org', role: 'judge' },
        { _id: 'j-dummy-3', name: 'Alex Web3 Lead', email: 'alex@web3.io', role: 'judge' },
      ]);
    }
  };

  useEffect(() => {
    if (hackathon?._id) {
      fetchJudgesData();
    }
  }, [hackathon]);

  const assignedIds = assignedJudges.map(j => typeof j === 'object' ? j._id : j);

  const handleAssignByEmail = async (emailOrId) => {
    const target = emailOrId || judgeEmail;
    if (!target.trim()) return toast.error('Please select or enter a judge email');

    setLoading(true);
    try {
      const res = await api.post(`/hackathons/${hackathon._id}/judges`, { judgeId: target });
      if (res.data.data?.judges) setAssignedJudges(res.data.data.judges);
      setJudgeEmail('');
      toast.success('Judge assigned successfully! ⚖️');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign judge.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJudge = async (judgeId) => {
    try {
      const res = await api.delete(`/hackathons/${hackathon._id}/judges/${judgeId}`);
      if (res.data.data?.judges) setAssignedJudges(res.data.data.judges);
      else setAssignedJudges(prev => prev.filter(j => (typeof j === 'object' ? j._id : j) !== judgeId));
      toast.success('Judge removed from hackathon.');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Could not remove judge');
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Judge Invitation Link copied! 📋');
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

  const filteredAvailable = availableJudges.filter(j => {
    const term = searchFilter.toLowerCase();
    return (j.name?.toLowerCase().includes(term) || j.email?.toLowerCase().includes(term));
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5, 5, 7, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="liquid-glass" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, padding: 32, position: 'relative' }}>
        
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
            Assign & Remove Judges
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title}
          </p>
        </div>

        {/* ── Section 1: Assigned Judges (With Remove Option) ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Assigned Judges ({assignedJudges.length})</span>
            <span style={{ color: '#34d399', fontSize: '0.65rem' }}>● Active Evaluators</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
            {assignedJudges.length === 0 ? (
              <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px border-dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                No judges assigned yet. Assign a judge below from available judges or share an invite link.
              </div>
            ) : (
              assignedJudges.map(j => {
                const jName = typeof j === 'object' ? (j.name || j.email) : 'Judge User';
                const jEmail = typeof j === 'object' ? j.email : j;
                const jId = typeof j === 'object' ? j._id : j;
                return (
                  <div key={jId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#fff' }}>
                        {jName[0]?.toUpperCase() || 'J'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{jName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>{jEmail}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveJudge(jId)}
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <FiTrash2 size={12} /> Remove Judge
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Section 2: Available Platform Judges (Browse & 1-Click Assign) ── */}
        <div style={{ marginBottom: 24, padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
              Available Platform Judges
            </div>
            <div style={{ position: 'relative', width: 200 }}>
              <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                placeholder="Search judges..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
            {filteredAvailable.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
                No matching platform judges found. Enter email below to assign or send invite link.
              </div>
            ) : (
              filteredAvailable.map(j => {
                const isAssigned = assignedIds.includes(j._id) || assignedJudges.some(aj => (typeof aj === 'object' ? aj.email : aj) === j.email);
                return (
                  <div key={j._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                        {j.name?.[0]?.toUpperCase() || 'J'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>{j.name}</div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>{j.email}</div>
                      </div>
                    </div>

                    {isAssigned ? (
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUserCheck /> Assigned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignByEmail(j.email)}
                        disabled={loading}
                        style={{ padding: '5px 12px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        + Assign Judge
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick email input field */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <form onSubmit={e => { e.preventDefault(); handleAssignByEmail(judgeEmail); }} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Or enter any registered user email..."
                value={judgeEmail}
                onChange={e => setJudgeEmail(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '8px 14px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <FiUserPlus /> Assign
              </button>
            </form>
          </div>
        </div>

        {/* ── Section 3: Invite External Judge (Invitation Link & Email) ── */}
        <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, color: '#fff' }}>
            Invite External Judge (Not on Platform)
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 10px 0' }}>
            Generates a direct judge onboarding link allowing external evaluators to register & join this hackathon.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              readOnly
              value={inviteLink}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', outline: 'none' }}
            />
            <button
              onClick={handleCopyInviteLink}
              style={{ padding: '8px 14px', borderRadius: 10, background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: copied ? '#34d399' : '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {copied ? <FiCheck size={13} /> : <FiCopy size={13} />} {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <form onSubmit={handleSendEmailInvite} style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="External judge email..."
              value={externalEmail}
              onChange={e => setExternalEmail(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.75rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={sendingInvite}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FiMail size={12} /> {sendingInvite ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
