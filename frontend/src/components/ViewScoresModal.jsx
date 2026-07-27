import { useState, useEffect } from 'react';
import { FiX, FiAward, FiSearch, FiStar, FiMessageSquare } from 'react-icons/fi';
import api from '../services/api';

export default function ViewScoresModal({ hackathon, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/hackathon/${hackathon._id}`);
      if (res.data?.data) {
        setReviews(res.data.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hackathon?._id) {
      fetchScores();
    }
  }, [hackathon]);

  const filteredReviews = reviews.filter(r => {
    const term = search.toLowerCase();
    const subName = r.submission?.projectName?.toLowerCase() || '';
    const teamName = r.submission?.team?.name?.toLowerCase() || '';
    const judgeName = r.judge?.name?.toLowerCase() || '';
    return subName.includes(term) || teamName.includes(term) || judgeName.includes(term);
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5, 5, 7, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div className="liquid-glass" style={{
        width: '100%', maxWidth: 780, maxHeight: '85vh',
        borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(255, 255, 255, 0.14)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
      }}>

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiAward size={13} /> Evaluation Scores & Feedback
            </div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#fff', margin: 0, lineHeight: 1.1 }}>
              Judge Reviews — {hackathon?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search by project name, team, or judge..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 14px 9px 38px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Loading evaluations...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>⚖️</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>No Submitted Reviews Yet</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Judges assigned to this hackathon have not submitted evaluations yet.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredReviews.map(r => {
                const sub = r.submission || {};
                const judge = r.judge || {};
                const scoresMap = r.scores ? (r.scores instanceof Map ? Object.fromEntries(r.scores) : r.scores) : {};

                return (
                  <div key={r._id} style={{
                    padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                          {sub.projectName || 'Project Submission'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          Team: <strong style={{ color: '#fff' }}>{sub.team?.name || 'Solo Team'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', padding: '6px 14px', borderRadius: 99 }}>
                        <FiStar size={14} color="#fbbf24" />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>
                          {r.totalScore ?? '—'} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(251,191,36,0.7)' }}>/ 10</span>
                        </span>
                      </div>
                    </div>

                    {/* Judge Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content', marginBottom: 12 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                        {judge.name?.[0]?.toUpperCase() || 'J'}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                        Evaluated by: {judge.name || 'Assigned Judge'} ({judge.email || 'Judge'})
                      </span>
                    </div>

                    {/* Criteria breakdown */}
                    {Object.keys(scoresMap).length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {Object.entries(scoresMap).map(([criterion, score]) => (
                          <div key={criterion} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.72rem', color: '#fff' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{criterion}: </span>
                            <strong>{score}/10</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comments */}
                    {r.comments && (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginTop: 8, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, borderLeft: '3px solid #38bdf8', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <FiMessageSquare size={13} style={{ marginTop: 2, flexShrink: 0, color: '#38bdf8' }} />
                        <div>{r.comments}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: 10, background: '#ffffff',
              border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
