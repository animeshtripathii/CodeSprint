import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiUsers, FiAward, FiMapPin, FiArrowRight, FiCheck, FiUserPlus, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import TeamRegistrationModal from '../components/TeamRegistrationModal';

const QrIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export default function HackathonDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerStatus, setRegisterStatus] = useState(null); // 'none', 'pending', 'approved', 'rejected'
  const [myTeam, setMyTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const DUMMY_MAP = {
    'hack-dummy-1': {
      _id: 'hack-dummy-1',
      title: 'HackForge 2026 — AI & Multi-Agent Innovation Sprint',
      description: 'Build cutting-edge multi-agent systems, generative AI tools, and full-stack autonomous web apps. 48 hours of high-speed development with real-time team collaboration.',
      theme: 'Artificial Intelligence & Autonomous Agents',
      mode: 'online',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 432000000).toISOString(),
      registrationDeadline: new Date(Date.now() + 345600000).toISOString(),
      prizePool: '$15,000',
      maxTeamSize: 4,
      status: 'open',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      tags: ['AI', 'React', 'Node.js', 'Agents'],
      judges: [{ name: 'Sarah Judge' }],
      judgingCriteria: [
        { criterion: 'Innovation', maxScore: 10, description: 'Novelty of the concept.' },
        { criterion: 'Technical Execution', maxScore: 10, description: 'Code quality and execution.' },
        { criterion: 'Presentation', maxScore: 10, description: 'Pitch & UI polish.' }
      ]
    },
    'hack-dummy-2': {
      _id: 'hack-dummy-2',
      title: 'Global Web3 & Decentralized Finance Challenge 2026',
      description: 'Design open-source financial tools, smart contracts, and secure access control API platforms. Test your skills against global hackathon teams.',
      theme: 'Web3 & Financial Infrastructure',
      mode: 'hybrid',
      venue: 'San Francisco Tech Hub',
      startDate: new Date(Date.now() + 172800000).toISOString(),
      endDate: new Date(Date.now() + 518400000).toISOString(),
      registrationDeadline: new Date(Date.now() + 432000000).toISOString(),
      prizePool: '$25,000',
      maxTeamSize: 4,
      status: 'open',
      bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
      tags: ['Web3', 'Finance', 'Security'],
      judges: [{ name: 'Alex Organizer' }],
      judgingCriteria: [
        { criterion: 'Security & Access Control', maxScore: 10, description: 'Data privacy and RBAC.' },
        { criterion: 'Feasibility', maxScore: 10, description: 'Real-world deployment readiness.' }
      ]
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hackathons/${id}`);
        setHackathon(res.data.data);

        if (user) {
          try {
            const regRes = await api.get(`/registrations/hackathon/${id}/status`);
            setRegisterStatus(regRes.data.data.status);
            if (regRes.data.data.team) {
              setMyTeam(regRes.data.data.team);
            }
          } catch (e) {
            setRegisterStatus('none');
          }
        }
      } catch (err) {
        if (DUMMY_MAP[id]) {
          setHackathon(DUMMY_MAP[id]);
        } else {
          setHackathon(DUMMY_MAP['hack-dummy-1']);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="wekraft-bg min-h-screen">
        <Navbar dark={true} />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 400, maxWidth: '1200px', margin: '0 auto 40px', borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="wekraft-bg min-h-screen">
        <Navbar dark={true} />
        <div style={{ paddingTop: 120, textAlign: 'center' }} className="empty-state">
          <div className="empty-icon">😢</div>
          <div className="empty-title text-white">Hackathon not found</div>
          <Link to="/hackathons" className="btn-blue-glow mt-4">Back to Hackathons</Link>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = new Date(hackathon.registrationDeadline) < new Date();

  return (
    <div className="wekraft-bg min-h-screen">
      <Navbar dark={true} />

      <div style={{ paddingTop: 60 }}>
        {/* Banner Hero */}
        <div style={{
          position: 'relative',
          height: '380px',
          background: hackathon.banner ? `url(${hackathon.banner}) no-repeat center/cover` : 'linear-gradient(135deg, #090a0f, #1b68ff22)',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #08090d 0%, rgba(8,9,13,0.4) 100%)' }} />

          <div className="container" style={{ position: 'relative', zIndex: 1, color: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`chip status-${hackathon.status}`}>{hackathon.status}</span>
              <span className="chip chip-dark">{hackathon.mode}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gradient-electric">{hackathon.title}</h1>
            <p className="text-slate-300 text-lg" style={{ maxWidth: '640px' }}>{hackathon.theme}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="container" style={{ padding: '48px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Left panel: Info */}
          <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* About */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">About Hackathon</h2>
              <div style={{ whiteSpace: 'pre-wrap', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7 }}>
                {hackathon.description}
              </div>
            </div>

            {/* Judging Criteria */}
            {hackathon.judgingCriteria && hackathon.judgingCriteria.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Judging Criteria</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {hackathon.judgingCriteria.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                      <div>
                        <strong className="text-white font-semibold" style={{ fontSize: '0.95rem' }}>{c.criterion}</strong>
                        <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                      </div>
                      <div className="badge-glow" style={{ padding: '4px 10px', background: 'rgba(27,104,255,0.15)', border: '1px solid rgba(27,104,255,0.3)', borderRadius: 20, fontSize: '0.75rem', color: '#60a5fa', height: 'fit-content' }}>
                        Max {c.maxScore} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid-3" style={{ gap: 16 }}>
              <div className="glass-card p-5 text-center">
                <FiCalendar size={22} style={{ color: '#818cf8', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Timeline</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: 4, color: '#fff' }}>
                  {new Date(hackathon.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(hackathon.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="glass-card p-5 text-center">
                <FiAward size={22} style={{ color: '#f59e0b', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Prize Pool</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 4, color: '#fbbf24' }}>
                  {hackathon.prizePool || '$0'}
                </div>
              </div>

              <div className="glass-card p-5 text-center">
                <FiUsers size={22} style={{ color: '#34d399', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Team Limit</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: 4, color: '#fff' }}>
                  Max {hackathon.maxTeamSize || 4} members
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Registration details */}
          <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
            <div className="glass-panel p-6" style={{ position: 'sticky', top: '92px', border: '1px solid rgba(27,104,255,0.3)' }}>
              <h3 className="text-xl font-bold text-white mb-2" style={{ color: '#fff' }}>Participate & Register</h3>
              <p className="text-xs text-slate-400 mb-6">
                Register as a Team Leader to generate a QR pass & team code, or join an existing team via invite code.
              </p>

              {user && myTeam ? (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                    <FiCheck className="inline-block mr-1" /> Registered in <strong>{myTeam.name}</strong>
                  </div>
                  <Link to={`/teams/${myTeam._id}/workspace`} className="btn-blue-glow w-full justify-center">
                    Open Team Workspace <FiArrowRight />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    className="btn-blue-glow w-full justify-center text-sm"
                    onClick={() => {
                      if (!user) return navigate('/login');
                      setShowTeamModal(true);
                    }}
                    disabled={isDeadlinePassed}
                  >
                    <FiShield /> Register Team (Team Leader)
                  </button>

                  <button
                    className="btn-glass w-full justify-center text-sm"
                    onClick={() => {
                      if (!user) return navigate('/login');
                      navigate(`/join-team?hackathonId=${id}`);
                    }}
                  >
                    <FiUserPlus /> Join Team via QR / Code
                  </button>

                  {isDeadlinePassed && (
                    <p className="text-xs text-red-400 text-center mt-2">
                      The deadline to register has passed.
                    </p>
                  )}
                </div>
              )}

              {/* Side metadata list */}
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Deadline:</span>
                  <strong>{new Date(hackathon.registrationDeadline).toLocaleDateString()}</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Judges:</span>
                  <strong>{hackathon.judges?.length || 0} assigned</strong>
                </div>
                {hackathon.tags && hackathon.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {hackathon.tags.map(t => <span key={t} className="chip chip-dark text-xs">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Registration Modal with QR Generator */}
      <TeamRegistrationModal 
        hackathon={hackathon}
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={(team) => {
          setMyTeam(team);
        }}
      />
    </div>
  );
}
