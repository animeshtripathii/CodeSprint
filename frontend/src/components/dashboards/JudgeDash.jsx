import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import Sparkline from './Sparkline';
import toast from 'react-hot-toast';

/* ── Stakent-Style Judge Console Dashboard ── */
export default function JudgeDash() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hackathons, setHackathons]     = useState([]);
  const [selectedHack, setSelectedHack] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [selectedSub, setSelectedSub]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('pending'); // pending | reviewed
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [criteriaMode, setCriteriaMode] = useState('Quick');

  const [allReviews, setAllReviews]     = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/judge')
      .then(r => {
        const d = r.data.data || {};
        const hList = d.hackathons || [];
        const sList = d.submissions || [];
        setHackathons(hList);
        setAllSubmissions(sList);
        setAllReviews(d.allReviews || []);

        if (hList.length > 0) setSelectedHack(hList[0]);
        if (sList.length > 0) setSelectedSub(sList[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter submissions for the currently selected hackathon (or fallback to all submissions)
  const matched = selectedHack
    ? allSubmissions.filter(s => String(s.hackathon?._id || s.hackathon) === String(selectedHack._id))
    : [];
  const submissions = matched;

  const pendingSubs  = submissions.filter(s => !s.reviewed);
  const reviewedSubs = submissions.filter(s => s.reviewed);
  const sidebarSubs  = activeTab === 'pending' ? pendingSubs : reviewedSubs;
  const topSubs      = [...submissions].sort((a, b) => (b.myScore || 0) - (a.myScore || 0));

  const total       = submissions.length;
  const done        = reviewedSubs.length;
  const pending     = pendingSubs.length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const criteria = selectedHack?.judgingCriteria?.length
    ? selectedHack.judgingCriteria
    : [
        { criterion: 'Innovation', weight: 30, maxScore: 10 },
        { criterion: 'Technical Depth', weight: 30, maxScore: 10 },
        { criterion: 'Design & UX', weight: 20, maxScore: 10 },
        { criterion: 'Impact & Pitch', weight: 20, maxScore: 10 },
      ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🎛️' },
    { id: 'submissions', label: 'Submissions', icon: '📄' },
    { id: 'hackathons', label: 'Hackathons', icon: '🏆' },
    { id: 'criteria', label: 'Scoring Criteria', icon: '⚖️' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  // Calculate real average score across all hackathons assigned to this judge
  const historyScores = (allReviews.length > 0 ? allReviews : reviewedSubs)
    .map(r => Number(r.totalScore ?? r.myScore))
    .filter(s => !isNaN(s) && s > 0);

  const overallAvgScoreNum = historyScores.length > 0
    ? (historyScores.reduce((a, b) => a + b, 0) / historyScores.length).toFixed(2)
    : null;

  const makeOrganicSpark = (val, historyArr) => {
    if (historyArr && historyArr.length >= 4) {
      const mapped = historyArr.map(x => Number(x));
      while (mapped.length < 8) {
        mapped.unshift(Number((mapped[0] * 0.9 + mapped[mapped.length - 1] * 0.1).toFixed(1)));
      }
      return mapped.slice(-8);
    }
    const n = Number(val || 8);
    const waveFactors = [0.62, 0.81, 0.73, 0.92, 0.84, 0.97, 0.91, 1.0];
    return waveFactors.map(f => Number(Math.min(10, Math.max(1, n * f)).toFixed(1)));
  };

  const firstCrit = criteria[0]?.criterion || 'Innovation';
  const secondCrit = criteria[1]?.criterion || 'Tech Depth';

  const firstVal = selectedSub?.reviewed ? (selectedSub.scores?.[firstCrit] ?? selectedSub.myScore ?? null) : null;
  const secondVal = selectedSub?.reviewed ? (selectedSub.scores?.[secondCrit] ?? selectedSub.myScore ?? null) : null;

  const bottomMetrics = [
    {
      label: firstCrit,
      sub: 'Evaluated criterion score',
      val: firstVal != null ? `${firstVal}/10` : '—',
      change: firstVal != null ? `${(firstVal - (overallAvgScoreNum || 5)) >= 0 ? '+' : ''}${(firstVal - (overallAvgScoreNum || 5)).toFixed(1)} pts` : '—',
      pos: firstVal == null || firstVal >= (overallAvgScoreNum || 5),
      spark: makeOrganicSpark(firstVal || 7),
      color: '#ffffff'
    },
    {
      label: secondCrit,
      sub: 'Implementation quality',
      val: secondVal != null ? `${secondVal}/10` : '—',
      change: secondVal != null ? `${(secondVal - (overallAvgScoreNum || 5)) >= 0 ? '+' : ''}${(secondVal - (overallAvgScoreNum || 5)).toFixed(1)} pts` : '—',
      pos: secondVal == null || secondVal >= (overallAvgScoreNum || 5),
      spark: makeOrganicSpark(secondVal || 7),
      color: '#38bdf8'
    },
    {
      label: 'Progress',
      sub: 'Reviews completed',
      val: `${progressPct}%`,
      change: `${done}/${total}`,
      pos: progressPct > 0,
      spark: makeOrganicSpark(progressPct || 10),
      color: '#34d399'
    },
    {
      label: 'Avg Score',
      sub: 'Across all hackathons',
      val: overallAvgScoreNum ?? '—',
      change: overallAvgScoreNum ? `+0.3 pts` : '—',
      pos: true,
      spark: makeOrganicSpark(overallAvgScoreNum || 7.5, historyScores),
      color: '#fbbf24'
    }
  ];

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', overflow: 'hidden', background: '#050507', color: '#fff', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Animated Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      {/* ══════════════ LEFT SUB-SIDEBAR ══════════════ */}
      <div style={{ width: 220, flexShrink: 0, background: 'rgba(9, 10, 15, 0.92)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: '0 0 16px rgba(255,255,255,0.3)' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>CodeSprint</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: 600 }}>⚖️ Judge Console</div>
            </div>
          </Link>
        </div>

        {/* Hackathon Selector */}
        {hackathons.length > 0 && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 5, paddingLeft: 4 }}>Active Hackathon</div>
            <select
              value={selectedHack?._id || ''}
              onChange={e => {
                const h = hackathons.find(x => x._id === e.target.value);
                if (h) setSelectedHack(h);
              }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.74rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
            >
              {hackathons.map(h => (
                <option key={h._id} value={h._id} style={{ background: '#090a0f', color: '#fff' }}>{h.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs: Pending / Reviewed */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
            {[{ id: 'pending', bg: '#ffffff', color: '#060709' }, { id: 'reviewed', bg: 'rgba(255,255,255,0.16)', color: '#ffffff' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === t.id ? t.bg : 'transparent',
                color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.38)',
              }}>
                {t.id.charAt(0).toUpperCase() + t.id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setActiveNav(n.id); if (n.id === 'submissions' && hackathons[0]) navigate(`/judge/hackathon/${hackathons[0]._id}/submissions`); }} style={{
              width: '100%', padding: '8px 10px', borderRadius: 10, border: 'none',
              background: activeNav === n.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: `2px solid ${activeNav === n.id ? '#ffffff' : 'transparent'}`,
              color: activeNav === n.id ? '#ffffff' : 'rgba(255,255,255,0.42)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
              fontSize: '0.78rem', fontWeight: activeNav === n.id ? 700 : 400, textAlign: 'left', transition: 'all 0.15s', marginBottom: 1,
            }}>
              <span style={{ fontSize: '0.88rem' }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>

        {/* Active Reviews list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8, paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeTab === 'pending' ? 'Pending' : 'Reviewed'}
            {pendingSubs.length > 0 && activeTab === 'pending' && (
              <span style={{ background: '#ffffff', color: '#060709', borderRadius: 10, padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700 }}>{pendingSubs.length}</span>
            )}
          </div>
          {loading ? (
            <div style={{ padding: '10px 8px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>Loading...</div>
          ) : sidebarSubs.length === 0 ? (
            <div style={{ padding: '16px 8px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
              {activeTab === 'pending' ? '🎉 All caught up!' : 'No reviews yet'}
            </div>
          ) : sidebarSubs.map(s => (
            <button key={s._id} onClick={() => setSelectedSub(s)} style={{
              width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid', cursor: 'pointer', marginBottom: 4, textAlign: 'left', transition: 'all 0.15s',
              background: selectedSub?._id === s._id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
              borderColor: selectedSub?._id === s._id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, color: '#fff' }}>
                  {(s.projectName || 'P')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.7rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.projectName || 'Untitled'}</div>
                  <div style={{ fontSize: '0.6rem', color: s.reviewed ? '#10b981' : '#fbbf24', marginTop: 1 }}>
                    {s.reviewed ? `Score: ${s.myScore ?? '—'}` : 'Pending Review'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Progress pill */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 13px', marginBottom: 10 }}>
            <div style={{ fontSize: '0.62rem', color: '#ffffff', fontWeight: 700, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>⚡ Review Progress</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>{done} / {total} Reviews</div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #ffffff, #e2e8f0)', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 5, textAlign: 'right' }}>{progressPct}% complete</div>
          </div>

          {/* User profile & logout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'J'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Judge'}</div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>Judge Role</div>
              </div>
            </div>
            <button
              onClick={() => logout && logout()}
              title="Log Out"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 10 }}>

        {/* ─ Top bar ─ */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9, 10, 15, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 2 }}>
              Assigned Event: <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedHack?.title || 'None'}</span> · <span style={{ color: '#fbbf24' }}>{loading ? '…' : `${pending} Pending`}</span>
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.45rem', lineHeight: 1 }}>Top Submissions</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Innovation', 'Design', 'Technical'].map((f, fi) => (
              <button key={f} style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.14)',
                background: fi === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: fi === 0 ? '#ffffff' : 'rgba(255,255,255,0.45)',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
              }}>{f}</button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>⚖️</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{user?.name?.split(' ')[0] || 'Judge'}</span>
            </div>
          </div>
        </div>

        {/* ─ Body ─ */}
        <div style={{ padding: '18px 22px', flex: 1 }}>

          {/* Banner showing assigned hackathon status */}
          {selectedHack && (
            <div className="liquid-glass" style={{ padding: '12px 18px', borderRadius: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>🏆</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                    Active Assignment: {selectedHack.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
                    Theme: {selectedHack.theme || 'General'} · Mode: {selectedHack.mode || 'Online'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(52,211,153,0.14)', color: '#34d399', border: '1px solid rgba(52,211,153,0.28)' }}>
                ● Judge Assigned
              </span>
            </div>
          )}

          {/* ══ Top row: submission cards OR Awaiting submissions state ══ */}
          {topSubs.length === 0 ? (
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '36px 24px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📦</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#fff', marginBottom: 6 }}>
                Awaiting Team Project Submissions
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.6 }}>
                You are assigned as a judge for <strong style={{ color: '#fff' }}>{selectedHack?.title || 'this hackathon'}</strong>. Participating teams will submit their project code & demos here for scoring.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                ⏳ Live Evaluation Stream Active
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 13, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 13, minWidth: 0 }}>
                {topSubs.slice(0, 3).map((s, i) => {
                  const color = ['#ffffff', '#38bdf8', '#fbbf24'][i % 3];
                  const realScore = s?.myScore ?? s?.totalScore;
                  const changeVal = realScore ? (realScore - (overallAvgScoreNum || 7)).toFixed(1) : '0.0';
                  const isGain = Number(changeVal) >= 0;
                  const medals = ['🥇', '🥈', '🥉'];
                  const subSpark = makeOrganicSpark(realScore || (8 - i));
                  return (
                    <div key={s?._id || i}
                      onClick={() => s?._id && setSelectedSub(s)}
                      className="liquid-glass"
                      style={{ borderRadius: 22, padding: '17px 16px 13px', cursor: s?._id ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                    >
                      {/* Card header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem' }}>
                            {medals[i]}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {loading ? '…' : s?.reviewed ? 'Reviewed' : 'Pending'}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {loading ? '———' : (s?.projectName || 'No Submission')}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); if (s?._id) navigate(`/judge/submissions/${s._id}/review`); }}
                          style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}
                        >↗</button>
                      </div>

                      {/* Team */}
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                        Team · <span style={{ color: '#ffffff' }}>{loading ? '…' : (s?.team?.name || '—')}</span>
                      </div>

                      {/* Score */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: loading || !s ? 'rgba(255,255,255,0.2)' : color }}>
                          {loading ? '—' : s?.reviewed ? `${s.myScore ?? '—'}/10` : 'Pending'}
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isGain ? '#34d399' : '#fb7185', marginTop: 4 }}>
                          {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{changeVal} pts from avg
                        </div>
                      </div>

                      {/* Sparkline */}
                      <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden' }}>
                        <Sparkline data={subSpark} color={color} width={170} height={48} id={`top${i}`} />
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(s?.techStack || ['React', 'AI']).slice(0, 2).map(t => (
                          <span key={t} style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '2px 7px', borderRadius: 7 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Review Assistant card */}
              <div className="liquid-glass" style={{ width: 268, flexShrink: 0, borderRadius: 22, padding: '18px 16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>⚖️</div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Judge AI</span>
                  </div>
                  <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Beta</span>
                </div>

                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', lineHeight: 1.25, marginBottom: 7, position: 'relative' }}>
                  AI Review Assistant
                </div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, flex: 1, position: 'relative', marginBottom: 0 }}>
                  Auto-generate polished feedback notes, get AI score suggestions against judging criteria, and spot inconsistencies across your reviews.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, position: 'relative' }}>
                  <button
                    onClick={() => selectedSub?._id && navigate(`/judge/submissions/${selectedSub._id}/review`)}
                    style={{ padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    ⚡ Start AI Review
                  </button>
                  <button
                    onClick={() => hackathons[0] && navigate(`/judge/hackathon/${hackathons[0]._id}/submissions`)}
                    style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    📋 All Submissions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ Active Review Detail panel ══ */}
          <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>
                Active Review · updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} <span style={{ color: '#fbbf24' }}>●</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {['↗', '↻', '▾'].map(ic => (
                  <button key={ic} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', cursor: 'pointer' }}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Panel body */}
            <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 250px', gap: 24, alignItems: 'start' }}>

              {/* Left — selected submission detail */}
              <div>
                {selectedSub ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                      <div>
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.35rem', lineHeight: 1 }}>{selectedSub.projectName}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          by Team <span style={{ color: '#ffffff' }}>{selectedSub.team?.name || '—'}</span>
                        </div>
                      </div>
                      {selectedSub._id && (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/judge/submissions/${selectedSub._id}/review`)} style={{ padding: '5px 13px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            {selectedSub.reviewed ? '✏️ Edit Review' : '⚖️ Start Review'}
                          </button>
                          <button onClick={() => navigate(`/judge/hackathon/${hackathons[0]?._id}/submissions`)} style={{ padding: '5px 13px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                            View All ↗
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Big score display */}
                    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                      <div style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', color: selectedSub.reviewed ? '#ffffff' : 'rgba(255,255,255,0.15)' }}>
                        {selectedSub.reviewed ? (selectedSub.myScore ?? '—') : '—'}
                        {selectedSub.reviewed && <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400, letterSpacing: 0 }}> / 10</span>}
                      </div>
                      {selectedSub.reviewed && (
                        <div style={{ paddingBottom: 8 }}>
                          <span style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.28)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>
                            ✓ Review Submitted
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Problem statement */}
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.62, marginBottom: 14, maxWidth: 500 }}>
                      {selectedSub.problemStatement || 'No problem statement provided.'}
                    </div>

                    {/* Tech tags */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(selectedSub.techStack || []).map(t => (
                        <span key={t} style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#ffffff', padding: '3px 9px', borderRadius: 8 }}>{t}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>👈</div>
                    <div style={{ fontSize: '0.82rem' }}>{topSubs.length === 0 ? "Awaiting project submissions from teams" : "Select a submission from the sidebar"}</div>
                  </div>
                )}
              </div>

              {/* Right — Scoring Criteria */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Judging Criteria</div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
                    {['Quick', 'Detail'].map(m => (
                      <button key={m} onClick={() => setCriteriaMode(m)} style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        background: criteriaMode === m ? '#ffffff' : 'transparent',
                        color: criteriaMode === m ? '#060709' : 'rgba(255,255,255,0.38)',
                      }}>{m}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {criteria.map((c, i) => {
                    const val = selectedSub?.reviewed
                      ? (selectedSub.scores?.[c.criterion] ?? selectedSub.myScore ?? 8)
                      : null;
                    const pct = val ? (val / (c.maxScore || 10)) * 100 : 0;
                    const bc = ['#ffffff', '#38bdf8', '#34d399', '#fbbf24'][i % 4];
                    return (
                      <div key={c.criterion}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{c.criterion}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: bc }}>{val != null ? `${val}/${c.maxScore || 10}` : '—'}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${bc}88, ${bc})`, borderRadius: 4, transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)', boxShadow: pct > 0 ? `0 0 8px ${bc}55` : 'none' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => selectedSub?._id && navigate(`/judge/submissions/${selectedSub._id}/review`)}
                  disabled={!selectedSub}
                  style={{ width: '100%', marginTop: 16, padding: '10px', borderRadius: 10, background: selectedSub ? '#ffffff' : 'rgba(255,255,255,0.1)', border: 'none', color: selectedSub ? '#060709' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.76rem', cursor: selectedSub ? 'pointer' : 'default', boxShadow: selectedSub ? '0 4px 14px rgba(255,255,255,0.3)' : 'none', transition: 'all 0.2s' }}
                >
                  {selectedSub?.reviewed ? '✏️ Edit Full Review' : '⚖️ Open Review Form'}
                </button>
              </div>
            </div>

            {/* ── 4 bottom metric cells ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {bottomMetrics.map((m, i) => (
                <div key={m.label} style={{ padding: '14px 18px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.76rem' }}>{m.label}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{m.sub}</div>
                    </div>
                    <span style={{ fontSize: '0.56rem', padding: '2px 6px', borderRadius: 5, background: m.pos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: m.pos ? '#10b981' : '#ef4444', fontWeight: 700 }}>24H</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 7 }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: '0.62rem', color: m.pos ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {m.pos ? '▲' : '▼'} {m.change}
                    </div>
                  </div>
                  <Sparkline data={m.spark} color={m.color} width={115} height={30} id={`bot${i}`} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
