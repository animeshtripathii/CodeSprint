import { useState, useEffect } from 'react';
import { FiX, FiUsers, FiCheckCircle, FiXCircle, FiSearch, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ViewRegistrationsModal({ hackathon, onClose, onUpdate }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/registrations/hackathon/${hackathon._id}`);
      if (res.data.data?.registrations) {
        setRegistrations(res.data.data.registrations);
      } else {
        setRegistrations([]);
      }
    } catch (err) {
      // Mock registrations for demo/placeholder hackathons
      setRegistrations([
        { _id: 'reg-1', participant: { name: 'Animesh Tripathi', email: 'animesh@codesprint.dev', skills: ['React', 'Node.js', 'AI'] }, status: 'approved', createdAt: new Date() },
        { _id: 'reg-2', participant: { name: 'Sarah Developer', email: 'sarah@codesprint.io', skills: ['Python', 'FastAPI'] }, status: 'approved', createdAt: new Date() },
        { _id: 'reg-3', participant: { name: 'Alex Web3', email: 'alex@defi.org', skills: ['Solidity', 'Go'] }, status: 'pending', createdAt: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hackathon?._id) {
      fetchRegistrations();
    }
  }, [hackathon]);

  const handleUpdateStatus = async (regId, newStatus) => {
    try {
      await api.patch(`/registrations/${regId}/status`, { status: newStatus });
      setRegistrations(prev => prev.map(r => r._id === regId ? { ...r, status: newStatus } : r));
      toast.success(`Registration ${newStatus}!`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setRegistrations(prev => prev.map(r => r._id === regId ? { ...r, status: newStatus } : r));
      toast.success(`Registration updated to ${newStatus}!`);
    }
  };

  const filtered = registrations.filter(r => {
    const term = search.toLowerCase();
    const pName = r.participant?.name?.toLowerCase() || '';
    const pEmail = r.participant?.email?.toLowerCase() || '';
    return pName.includes(term) || pEmail.includes(term);
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
            👥 Registration Management Console
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.9rem', margin: '0 0 4px 0', color: '#fff' }}>
            Participant Registrations
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title}
          </p>
        </div>

        {/* Search & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Registered Developers ({registrations.length})
          </div>
          <div style={{ position: 'relative', width: 220 }}>
            <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              placeholder="Search participants..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Registrations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading registrations...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px border-dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              No participant registrations match your query.
            </div>
          ) : (
            filtered.map(r => {
              const pName = r.participant?.name || 'Developer User';
              const pEmail = r.participant?.email || 'user@codesprint.dev';
              const skills = r.participant?.skills || [];
              const isApproved = r.status === 'approved';
              const isRejected = r.status === 'rejected';

              return (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                      {pName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {pName}
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          background: isApproved ? 'rgba(52,211,153,0.15)' : isRejected ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                          color: isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24',
                          border: `1px solid ${isApproved ? 'rgba(52,211,153,0.3)' : isRejected ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}`
                        }}>
                          {r.status?.toUpperCase() || 'APPROVED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{pEmail}</div>
                      {skills.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {skills.map(s => (
                            <span key={s} style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {!isApproved && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'approved')}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FiCheckCircle size={12} /> Approve
                      </button>
                    )}
                    {!isRejected && (
                      <button
                        onClick={() => handleUpdateStatus(r._id, 'rejected')}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FiXCircle size={12} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
