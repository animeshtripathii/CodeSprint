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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, lRes] = await Promise.all([
          api.get(`/hackathons/${id}`),
          api.get(`/submissions/hackathon/${id}/leaderboard`)
        ]);
        setHackathon(hRes.data.data);
        setLeaderboard(lRes.data.data);
      } catch (err) {
        toast.error('Failed to load leaderboard');
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
          <div className="liquid-glass text-center" style={{ borderRadius: 24, padding: 48 }}>
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
                  <div className="liquid-glass text-center" style={{ width: 230, borderRadius: 22, padding: '24px 18px', borderTop: '4px solid #cbd5e1' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🥈</div>
                    <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>2nd Place</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[1].team?.name || 'Runner Up'}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{podium[1].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      Score: {podium[1].averageScore?.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* 👑 1st Place Champion */}
                {podium[0] && (
                  <div className="liquid-glass text-center" style={{ width: 260, borderRadius: 24, padding: '32px 20px', borderTop: '4px solid #fbbf24', border: '1px solid rgba(251,191,36,0.5)', boxShadow: '0 0 32px rgba(251,191,36,0.25)' }}>
                    <div style={{ fontSize: '3.2rem', marginBottom: 6 }}>👑</div>
                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Grand Champion</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.45rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[0].team?.name || 'Winner'}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{podium[0].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 99, background: '#fbbf24', color: '#060709', fontSize: '0.88rem', fontWeight: 800, boxShadow: '0 4px 16px rgba(251,191,36,0.4)' }}>
                      Score: {podium[0].averageScore?.toFixed(2)} / 10
                    </div>
                  </div>
                )}

                {/* 🥉 3rd Place */}
                {podium[2] && (
                  <div className="liquid-glass text-center" style={{ width: 220, borderRadius: 22, padding: '20px 18px', borderTop: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>🥉</div>
                    <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>3rd Place</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.2rem', margin: '0 0 4px 0', color: '#fff' }}>{podium[2].team?.name || '3rd Place'}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{podium[2].projectName}</div>
                    <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      Score: {podium[2].averageScore?.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FULL LEADERBOARD TABLE */}
            <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.9rem' }}>
                Full Ranking Table
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                <div>Rank</div><div>Team</div><div>Project Name</div><div>Avg Score</div><div>Reviews</div><div>Detail</div>
              </div>

              {leaderboard.map((item, idx) => (
                <div key={item._id || idx}>
                  <div
                    onClick={() => toggleRow(idx)}
                    style={{
                      display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1fr 1fr auto', padding: '16px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', cursor: 'pointer',
                      background: expandedRow === idx ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>
                      #{idx + 1}
                    </div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{item.team?.name || '—'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{item.projectName}</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{item.averageScore?.toFixed(2) || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{item.reviews?.length || 0} judges</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {expandedRow === idx ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>

                  {/* Expanded breakdown */}
                  {expandedRow === idx && (
                    <div style={{ padding: '16px 20px 20px 100px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 8 }}>
                        Problem Statement & Links
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 12, maxWidth: 600 }}>
                        {item.problemStatement || 'No description provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {item.repoUrl && (
                          <a href={item.repoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                            <FiExternalLink size={12} /> Repository
                          </a>
                        )}
                        {item.demoUrl && (
                          <a href={item.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                            <FiExternalLink size={12} /> Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
