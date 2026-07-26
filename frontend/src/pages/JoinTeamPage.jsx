import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiCheck, FiArrowRight, FiLock, FiAlertCircle } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';
import axios from 'axios';

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

  const codeParam = searchParams.get('code') || '';
  const teamIdParam = searchParams.get('teamId') || '';

  const [inputCode, setInputCode] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (teamIdParam) {
      fetchTeamDetails(teamIdParam);
    }
  }, [teamIdParam]);

  const fetchTeamDetails = async (tId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(`/api/teams/${tId}`);
      setTeamInfo(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not find team details. Please verify the link or team code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return toast.error('Please enter a team code');
    toast.success(`Searching for team ${inputCode}...`);
  };

  const handleJoinTeam = async () => {
    if (!user) {
      toast.error('Please log in first to join this team');
      return navigate(`/login?redirect=/join-team?code=${inputCode}&teamId=${teamIdParam}`);
    }

    setJoining(true);
    try {
      if (teamInfo?._id) {
        await axios.post(`/api/teams/${teamInfo._id}/members`, {
          email: user.email,
        });
      }
      toast.success(`Joined ${teamInfo?.name || 'the team'} successfully!`);
      navigate(`/teams/${teamInfo?._id || teamIdParam}/workspace`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to join team.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 120, paddingBottom: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="liquid-glass" style={{ width: '100%', maxWidth: 520, borderRadius: 24, padding: 36 }}>
          
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 12 }}>
              <QrIcon size={28} />
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', margin: '0 0 6px 0', color: '#fff' }}>
              Join Hackathon Team
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Enter a team invite code or scan a team pass to join workspace.
            </p>
          </div>

          {!teamInfo ? (
            <form onSubmit={handleSearchCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Team Invite Code</label>
                <input
                  type="text"
                  placeholder="e.g. TEAM-8X92K"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {errorMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiAlertCircle /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                Find Team Space <FiArrowRight />
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Team Found</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#fff' }}>{teamInfo.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{teamInfo.members?.length || 1} current members</div>
              </div>

              <button
                onClick={handleJoinTeam}
                disabled={joining}
                style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {joining ? 'Joining Team...' : '🚀 Confirm & Join Team'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
