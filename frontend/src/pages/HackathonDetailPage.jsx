import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiUsers, FiAward, FiMapPin, FiArrowRight, FiCheck, FiUserPlus, FiShield, FiGlobe } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
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
  const [registerStatus, setRegisterStatus] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const DUMMY_MAP = {
    'hack-dummy-1': {
      _id: 'hack-dummy-1',
      title: 'CodeSprint 2026 — AI & Multi-Agent Innovation Sprint',
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

  const handleRegisterSolo = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/registrations', { hackathon: id });
      setRegisterStatus('approved');
      toast.success('Successfully registered for this hackathon! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 88, paddingBottom: 64, paddingLeft: 28, paddingRight: 28 }}>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⌛</div>
            <div>Loading hackathon details...</div>
          </div>
        ) : (
          <>
            {/* Banner Header */}
            <div className="liquid-glass" style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
              <div style={{
                height: 240, position: 'relative',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {hackathon.bannerUrl && (
                  <img src={hackathon.bannerUrl} alt={hackathon.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.8 }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(5,5,7,0.95) 100%)' }} />

                {hackathon.prizePool && (
                  <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 2, background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(251,191,36,0.38)', borderRadius: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiAward size={14} style={{ color: '#fbbf24' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fbbf24' }}>{hackathon.prizePool}</span>
                  </div>
                )}
              </div>

              {/* Title Block */}
              <div style={{ padding: '24px 32px 28px', marginTop: -40, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.28)', color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>
                    ● {hackathon.status?.toUpperCase() || 'OPEN'}
                  </span>
                  <span style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>
                    {hackathon.mode === 'online' ? <FiGlobe size={11} /> : <FiMapPin size={11} />} {hackathon.mode}
                  </span>
                  {hackathon.theme && (
                    <span style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600 }}>
                      {hackathon.theme}
                    </span>
                  )}
                </div>

                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: '0 0 10px 0', lineHeight: 1.1 }}>
                  {hackathon.title}
                </h1>
                <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.6)', maxWidth: 780, lineHeight: 1.6, margin: 0 }}>
                  {hackathon.description}
                </p>
              </div>
            </div>

            {/* Main Content & Registration Sidebar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              
              {/* Left Column — Details, Criteria & Judges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Dates & Schedule */}
                <div className="liquid-glass" style={{ borderRadius: 22, padding: '24px 26px' }}>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', margin: '0 0 16px 0' }}>Schedule & Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Event Duration</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCalendar size={14} />
                        {new Date(hackathon.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(hackathon.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>Team Constraints</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiUsers size={14} /> Up to {hackathon.maxTeamSize || 4} members per team
                      </div>
                    </div>
                  </div>
                </div>

                {/* Judging Criteria Parameters */}
                <div className="liquid-glass" style={{ borderRadius: 22, padding: '24px 26px' }}>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', margin: '0 0 16px 0' }}>Judging Criteria</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(hackathon.judgingCriteria || []).map((c, idx) => (
                      <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{c.criterion}</div>
                          {c.description && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.description}</div>}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                          Max {c.maxScore} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column — Registration Card & Leaderboard Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Registration Card */}
                <div className="liquid-glass" style={{ borderRadius: 22, padding: '24px 22px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 6px 0' }}>Registration Status</h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                    Register solo or form a team workspace to submit your entry.
                  </p>

                  {registerStatus === 'approved' ? (
                    <>
                      <div style={{ padding: 16, borderRadius: 14, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>✓ Registration Approved</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>You are registered for this hackathon!</div>
                      </div>
                      <Link
                        to={`/hackathons/${id}/submit`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '12px', borderRadius: 12, background: '#ffffff', border: 'none',
                          color: '#060709', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
                          boxShadow: '0 4px 16px rgba(255,255,255,0.3)', marginBottom: 8
                        }}
                      >
                        🚀 Submit Project Entry →
                      </Link>
                    </>
                  ) : registerStatus === 'pending' ? (
                    <div style={{ padding: 16, borderRadius: 14, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>⏳ Registration Pending</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Organizer review in progress.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        onClick={() => setShowTeamModal(true)}
                        style={{ padding: '12px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <FiUserPlus /> Register Team / Form Workspace
                      </button>
                      <button
                        onClick={handleRegisterSolo}
                        style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Register as Solo Participant
                      </button>
                    </div>
                  )}

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '18px 0' }} />

                  <Link
                    to={`/hackathons/${id}/leaderboard`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    <FiAward style={{ color: '#fbbf24' }} /> View Live Leaderboard ↗
                  </Link>
                </div>

              </div>

            </div>
          </>
        )}

      </div>

      {showTeamModal && (
        <TeamRegistrationModal
          hackathonId={id}
          maxTeamSize={hackathon?.maxTeamSize || 4}
          onClose={() => setShowTeamModal(false)}
          onSuccess={() => {
            setShowTeamModal(false);
            setRegisterStatus('approved');
            toast.success('Team registered successfully!');
          }}
        />
      )}

    </div>
  );
}
