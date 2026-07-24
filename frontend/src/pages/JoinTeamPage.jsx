import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiCheck, FiArrowRight, FiLock, FiAlertCircle } from 'react-icons/fi';
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
    // If team code formatted as TEAM-XXXXXX, extract or search
    toast.success(`Searching for team ${inputCode}...`);
  };

  const handleJoinTeam = async () => {
    if (!user) {
      toast.error('Please log in first to join this team');
      return navigate(`/login?redirect=/join-team?code=${inputCode}&teamId=${teamIdParam}`);
    }

    setJoining(true);
    try {
      // Add member call
      if (teamInfo?._id) {
        await axios.post(`/api/teams/${teamInfo._id}/members`, {
          email: user.email,
        });
      }
      toast.success(`Joined ${teamInfo?.name || 'the team'} successfully!`);
      navigate(`/teams/${teamInfo?._id || teamIdParam}/workspace`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to join team. You may already be in a team for this hackathon.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="wekraft-bg min-h-screen">
      <Navbar dark={true} />

      <div className="container section flex flex-col items-center justify-center min-h-screen" style={{ paddingTop: 100 }}>
        <div className="glass-panel w-full max-w-lg p-8 relative" style={{ border: '1px solid rgba(27,104,255,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'rgba(27,104,255,0.15)', border: '1px solid rgba(27,104,255,0.3)', color: '#60a5fa' }}>
              <FiQrCode size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ color: '#fff' }}>Join Hackathon Team</h2>
            <p className="text-xs text-slate-400">Enter a team invite code or scan a team QR pass to collaborate.</p>
          </div>

          {!teamInfo ? (
            <form onSubmit={handleSearchCode} className="flex flex-col gap-4">
              <div>
                <label className="input-label-dark block text-xs font-medium mb-1 text-slate-300">Team Code</label>
                <input 
                  type="text" 
                  className="input input-dark w-full text-center text-lg font-mono tracking-widest uppercase"
                  placeholder="e.g. TEAM-7X9A21"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  style={{ background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#38bdf8' }}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs" style={{ background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d' }}>
                  <FiAlertCircle /> {errorMsg}
                </div>
              )}

              <button type="submit" className="btn-blue-glow w-full justify-center">
                Search Team & Pass <FiArrowRight />
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="qr-ticket-box text-left">
                <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Verified Team Pass</span>
                  <span className="code-badge-lg" style={{ fontSize: '0.9rem', padding: '2px 8px' }}>
                    {codeParam || `TEAM-${teamInfo._id?.slice(-6).toUpperCase()}`}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1" style={{ color: '#fff' }}>{teamInfo.name}</h3>
                <p className="text-xs text-slate-400 mb-3">Hackathon: <span className="text-slate-200">{teamInfo.hackathon?.title || 'Open Hackathon'}</span></p>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span className="text-slate-500 block">Leader</span>
                    <span className="font-semibold text-white">{teamInfo.leader?.name || 'Team Leader'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Members</span>
                    <span className="font-semibold text-white">{teamInfo.members?.length || 1} Registered</span>
                  </div>
                </div>
              </div>

              {user ? (
                <button 
                  onClick={handleJoinTeam} 
                  disabled={joining}
                  className="btn-blue-glow w-full justify-center text-base py-3"
                >
                  {joining ? 'Joining Team...' : 'Accept Invite & Join Team Now'} <FiCheck />
                </button>
              ) : (
                <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs text-slate-300 mb-3">You need an account to join this team.</p>
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/login?redirect=/join-team?code=${inputCode}&teamId=${teamIdParam}`}
                      className="btn-glass btn-sm w-1/2 justify-center"
                    >
                      Log In
                    </Link>
                    <Link 
                      to={`/register?redirect=/join-team?code=${inputCode}&teamId=${teamIdParam}`}
                      className="btn-blue-glow btn-sm w-1/2 justify-center"
                    >
                      Sign Up →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
