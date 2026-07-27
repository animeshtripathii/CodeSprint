import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiExternalLink, FiAward } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

export default function LeaderboardPage() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const DUMMY_MAP = {
    'hack-dummy-1': {
      title: 'Code-With-AI',
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, lRes] = await Promise.all([
          api.get(`/hackathons/${id}`).catch(() => ({ data: { data: DUMMY_MAP[id] || { title: 'Code-With-AI' } } })),
          api.get(`/leaderboard/${id}`)
        ]);
        setHackathon(hRes.data?.data || { title: 'Code-With-AI' });
        setLeaderboard(lRes.data?.data || []);
      } catch (err) {
        setHackathon(DUMMY_MAP[id] || { title: 'Code-With-AI' });
        setLeaderboard([
          {
            rank: 1,
            submissionId: 'sub-demo-1',
            projectName: 'Code-With-AI Project Entry',
            problemStatement: 'Multi-agent AI hackathon platform for vibe coding',
            techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'AI'],
            team: { name: 'Solo Team' },
            averageScore: 9.6,
            totalScore: 9.6,
            reviewCount: 2
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleRow = (idx) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, paddingLeft: 28, paddingRight: 28 }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 36 }}>
          <Link to={`/hackathons/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <FiArrowLeft /> Back to Hackathon Detail
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              Live Standings
            </span>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
            Hackathon Leaderboard
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title || 'Live Team Rankings'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⌛</div>
            <div>Loading live standings...</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="liquid-glass text-center" style={{ borderRadius: 24, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏆</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>No Scored Submissions Yet</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Judges are currently reviewing team submissions. Standings will update automatically.</div>
          </div>
        ) : (
          <>
            {/* 👑 PODIUM DISPLAY (Top 3) */}
            {podium.length > 0 && (
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap' }}>
                
                {/* 🥈 2nd Place */}
                {podium[1] && (
                  <div className="liquid-glass text-center" style={{ width: 230, borderRadius: 22, padding: '24px 18px', borderTop: '4px solid #cbd5e1', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🥈</div>
                    <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>2nd Place</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[1].team?.name || 'Runner Up'}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{podium[1].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      Score: {(podium[1].averageScore || podium[1].totalScore || 8.5)?.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* 👑 1st Place Champion */}
                {podium[0] && (
                  <div className="liquid-glass text-center" style={{ width: 260, borderRadius: 24, padding: '32px 20px', borderTop: '5px solid #fbbf24', transform: 'translateY(-12px)', boxShadow: '0 12px 32px rgba(251,191,36,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: 6 }}>👑</div>
                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>1st Place Champion</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[0].team?.name || 'Winner'}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>{podium[0].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 99, background: '#ffffff', color: '#060709', fontSize: '0.9rem', fontWeight: 800 }}>
                      Score: {(podium[0].averageScore || podium[0].totalScore || 9.6)?.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* 🥉 3rd Place */}
                {podium[2] && (
                  <div className="liquid-glass text-center" style={{ width: 230, borderRadius: 22, padding: '24px 18px', borderTop: '4px solid #b45309', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🥉</div>
                    <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>3rd Place</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[2].team?.name || '3rd Team'}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{podium[2].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      Score: {(podium[2].averageScore || podium[2].totalScore || 8.0)?.toFixed(2)}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Live Standings Table */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: 24, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 18 }}>
                Full Leaderboard Standings ({leaderboard.length})
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '12px' }}>Rank</th>
                      <th style={{ padding: '12px' }}>Team & Project</th>
                      <th style={{ padding: '12px' }}>Tech Stack</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, idx) => (
                      <tr key={item.submissionId || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: idx < 3 ? '#ffffff' : 'rgba(255,255,255,0.6)' }}>
                          #{item.rank || idx + 1}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{item.projectName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            Team: {item.team?.name || 'Solo Team'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(item.techStack || ['AI', 'React']).map(t => (
                              <span key={t} style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '2px 7px', borderRadius: 6 }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                          {(item.averageScore || item.totalScore || 8.5)?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
