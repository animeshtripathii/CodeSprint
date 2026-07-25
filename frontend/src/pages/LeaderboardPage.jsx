import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiExternalLink, FiZap } from 'react-icons/fi';
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

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 40, width: '40%', margin: '0 auto 20px' }} />
          <div className="skeleton" style={{ height: 250, maxWidth: '1000px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  // Separate top 3 for the podium
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <Link to={`/hackathons/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Hackathon Detail
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>Hackathon Leaderboard</h1>
          <p className="text-sm text-muted">{hackathon?.title}</p>
        </div>

        {/* PODIUM DISPLAY (Top 3) */}
        {podium.length > 0 && (
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap' }}>
            {/* 2nd Place */}
            {podium[1] && (
              <div className="card text-center" style={{ width: 220, borderTop: '4px solid #8B8B9A', height: 'fit-content', padding: '24px 16px' }}>
                <div style={{ fontSize: '2rem' }}>🥈</div>
                <h3 className="serif" style={{ fontSize: '1.1rem', margin: '8px 0' }}>{podium[1].team?.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)', marginBottom: 12 }}>{podium[1].projectName}</div>
                <div className="chip chip-gray">Score: {podium[1].averageScore?.toFixed(2)}</div>
              </div>
            )}

            {/* 1st Place */}
            {podium[0] && (
              <div className="card text-center glow-gold" style={{ width: 240, borderTop: '4px solid var(--accent-gold)', padding: '32px 16px', border: '1px solid var(--accent-gold)' }}>
                <div style={{ fontSize: '3rem', transform: 'scale(1.2)' }}>👑</div>
                <h3 className="serif" style={{ fontSize: '1.25rem', margin: '8px 0' }}>{podium[0].team?.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted-dark)', marginBottom: 12 }}>{podium[0].projectName}</div>
                <div className="chip chip-gold">Score: {podium[0].averageScore?.toFixed(2)}</div>
              </div>
            )}

            {/* 3rd Place */}
            {podium[2] && (
              <div className="card text-center" style={{ width: 200, borderTop: '4px solid #D4A843', height: 'fit-content', padding: '20px 16px' }}>
                <div style={{ fontSize: '1.8rem' }}>🥉</div>
                <h3 className="serif" style={{ fontSize: '1rem', margin: '8px 0' }}>{podium[2].team?.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)', marginBottom: 12 }}>{podium[2].projectName}</div>
                <div className="chip chip-gray">Score: {podium[2].averageScore?.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {/* REST OF LEADERBOARD TABLE */}
        <div className="card" style={{ padding: 0 }}>
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">Leaderboard is empty</div>
              <div className="empty-subtitle">Submissions are either pending or not yet reviewed.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                    <th>Team & Project</th>
                    <th>Tech Stack</th>
                    <th style={{ width: 120 }}>Avg Score</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, idx) => {
                    const isExpanded = expandedRow === idx;
                    return (
                      <>
                        <tr key={row._id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(idx)}>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div>
                              <strong style={{ fontSize: '0.9rem' }}>{row.projectName}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>by {row.team?.name}</div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {row.techStack?.slice(0, 3).map(t => (
                                <span key={t} className="chip chip-gray" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{t}</span>
                              ))}
                              {row.techStack?.length > 3 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted-dark)' }}>+{row.techStack.length - 3} more</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 60, flexShrink: 0 }}>
                                <div className="progress-fill" style={{ width: `${(row.averageScore / 10) * 100}%` }} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{row.averageScore?.toFixed(1)}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-icon">
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} style={{ background: 'rgba(0,0,0,0.01)', padding: '16px 24px' }}>
                              <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', textTransform: 'uppercase' }}>Problem Statement</div>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-dark)', marginTop: 4 }}>{row.problemStatement}</p>
                                </div>

                                <div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', textTransform: 'uppercase' }}>Solution</div>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-dark)', marginTop: 4 }}>{row.solution}</p>
                                </div>

                                {row.aiSummary && (
                                  <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: 12, background: 'rgba(62,207,142,0.03)', padding: 10, borderRadius: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                                      <FiZap size={10} /> AI Summary
                                    </div>
                                    <p style={{ fontSize: '0.82rem', fontStyle: 'italic', marginTop: 2 }}>{row.aiSummary}</p>
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                  <a href={row.githubRepo} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline" style={{ display: 'inline-flex', gap: 4 }}>
                                    GitHub <FiExternalLink size={12} />
                                  </a>
                                  {row.liveDemo && (
                                    <a href={row.liveDemo} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline" style={{ display: 'inline-flex', gap: 4 }}>
                                      Live Demo <FiExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
