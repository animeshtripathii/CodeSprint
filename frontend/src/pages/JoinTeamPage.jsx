import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FiUsers, FiArrowRight, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

const QrIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export default function JoinTeamPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const codeParam   = searchParams.get('code')   || '';
  const teamIdParam = searchParams.get('teamId') || '';

  const [inputCode, setInputCode] = useState(codeParam);
  const [loading,   setLoading]   = useState(false);
  const [joining,   setJoining]   = useState(false);
  const [teamInfo,  setTeamInfo]  = useState(null);
  const [errorMsg,  setErrorMsg]  = useState('');

  // ── Auto-fetch team from URL params on mount ──────────────────────────────
  useEffect(() => {
    if (teamIdParam) {
      fetchTeamById(teamIdParam);
    } else if (codeParam) {
      fetchTeamByCode(codeParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamIdParam, codeParam]);

  // Fetch by MongoDB _id (used when teamId is in the URL)
  const fetchTeamById = async (tId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/teams/${tId}`);
      setTeamInfo(res.data?.data || res.data);
    } catch (err) {
      setErrorMsg('Could not load team details. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch by invite code (e.g. TEAM-ABC123 or just ABC123)
  const fetchTeamByCode = async (code) => {
    const clean = (code || '').trim().toUpperCase().replace(/^TEAM-/, '');
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/teams/code/${clean}`);
      setTeamInfo(res.data?.data || res.data);
    } catch (err) {
      setErrorMsg('No team found with that code. Double-check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return toast.error('Please enter a team invite code');
    fetchTeamByCode(inputCode.trim());
  };

  const handleJoinTeam = async () => {
    if (!user) {
      toast.error('Please log in first to join a team');
      const targetUrl = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    setJoining(true);
    try {
      // Use the self-join endpoint — no leader permission needed
      await api.post(`/teams/${teamInfo._id}/join`);
      toast.success(`🎉 Joined ${teamInfo?.name || 'the team'} successfully!`);
      navigate(`/teams/${teamInfo._id}/workspace`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to join team. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />
      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 120, paddingBottom: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="liquid-glass" style={{ width: '100%', maxWidth: 520, borderRadius: 24, padding: 36 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 12 }}>
              <QrIcon size={28} />
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', margin: '0 0 6px 0', color: '#fff' }}>
              Join Hackathon Team
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Enter your team invite code or scan the team QR pass to join.
            </p>
          </div>

          {/* Code search form — always visible */}
          <form onSubmit={handleSearchCode} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Enter code e.g. TEAM-8X92K"
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px 16px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              {loading ? '...' : <><FiSearch /> Find</>}
            </button>
          </form>

          {/* Error message */}
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <FiAlertCircle /> {errorMsg}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
              Searching for team...
            </div>
          )}

          {/* Team found — show info and join button */}
          {!loading && teamInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Team Found ✓</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#fff', marginBottom: 6 }}>{teamInfo.name}</div>

                {teamInfo.hackathon?.title && (
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                    🏆 {teamInfo.hackathon.title}
                  </div>
                )}

                {/* Members list */}
                {Array.isArray(teamInfo.members) && teamInfo.members.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                      {teamInfo.members.length} / {teamInfo.hackathon?.maxTeamSize || 4} members
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {teamInfo.members.map((m, i) => {
                        const name   = typeof m === 'object' ? m.name   : 'Member';
                        const avatar = typeof m === 'object' ? m.avatar : '';
                        const isLeader = teamInfo.leader && (
                          typeof teamInfo.leader === 'object'
                            ? teamInfo.leader._id === m._id
                            : teamInfo.leader === m._id || teamInfo.leader === m
                        );
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                              {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#fff' }}>{name}</span>
                            {isLeader && <span style={{ fontSize: '0.6rem', background: 'rgba(251,191,36,0.18)', color: '#fbbf24', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>Leader</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Team full guard */}
              {teamInfo.members?.length >= (teamInfo.hackathon?.maxTeamSize || 4) ? (
                <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ This team is full
                </div>
              ) : (
                <button
                  onClick={handleJoinTeam}
                  disabled={joining}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <FiUsers /> {joining ? 'Joining...' : 'Confirm & Join Team →'}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
