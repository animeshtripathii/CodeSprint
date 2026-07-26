import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Layers,
  Plus,
  User,
  Settings,
  Award,
  ChevronRight
} from 'lucide-react';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import Sparkline from './Sparkline';
import toast from 'react-hot-toast';

/* ── Organizer Dashboard ── */
export default function OrganizerDash() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/organizer')
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_META = {
    draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', label: 'Draft' },
    upcoming:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.14)',  label: 'Upcoming' },
    open:      { color: '#34d399', bg: 'rgba(52,211,153,0.14)',  label: 'Open' },
    ongoing:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.14)',  label: 'Ongoing' },
    ended:     { color: '#cbd5e1', bg: 'rgba(203,213,225,0.12)', label: 'Ended' },
    cancelled: { color: '#fb7185', bg: 'rgba(251,113,133,0.14)', label: 'Cancelled' },
  };

  const hackathons = data?.hackathons || [];
  const filtered = activeFilter === 'all' ? hackathons : hackathons.filter(h => h.status === activeFilter);
  const statuses = ['all', 'open', 'ongoing', 'upcoming', 'draft', 'ended'];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const daysUntil  = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / 86400000);
  };

  const SPARK_DATA_ORG = [
    [4, 6, 8, 12, 16, 22, 28, 35, 42],
    [10, 18, 32, 45, 68, 92, 120, 154, 185],
    [2, 5, 12, 24, 38, 55, 72, 89, 104],
    [5, 12, 20, 32, 48, 64, 80, 95, 112]
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#050507', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Animated Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <div style={{ position: 'relative', zIndex: 10, padding: '28px 32px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 0 16px rgba(255,255,255,0.3)' }}>🏗️</div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Organizer Console</div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.1rem', lineHeight: 1, margin: 0 }}>
                  Welcome back, {user?.name?.split(' ')[0] || 'Organizer'} 👋
                </h1>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/hackathons')}
              style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            >
              <Layers size={14} /> Browse All
            </button>
            <button
              onClick={() => navigate('/hackathons/create')}
              style={{ padding: '9px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              <Plus size={15} /> + Create Hackathon
            </button>
          </div>
        </div>

        {/* ── 4 Top Stat Cards (with Sparklines) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Hackathons', val: loading ? '—' : (data?.totalHackathons ?? 0), icon: '🏆', color: '#ffffff', change: '+2 active', spark: SPARK_DATA_ORG[0] },
            { label: 'Total Registrations', val: loading ? '—' : (data?.totalRegistrations ?? 0), icon: '👥', color: '#38bdf8', change: '▲ +18% growth', spark: SPARK_DATA_ORG[1] },
            { label: 'Total Submissions', val: loading ? '—' : (data?.totalSubmissions ?? 0), icon: '📦', color: '#34d399', change: '▲ 84% conversion', spark: SPARK_DATA_ORG[2] },
            { label: 'Reviews Completed', val: loading ? '—' : (data?.totalReviews ?? 0), icon: '⭐', color: '#fbbf24', change: '▲ 92% scored', spark: SPARK_DATA_ORG[3] },
          ].map((s, i) => (
            <div key={s.label} className="liquid-glass" style={{ borderRadius: 22, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {s.change}
                </span>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginBottom: 12 }}>{s.label}</div>
              <Sparkline data={s.spark} color={s.color} width={180} height={36} id={`orgStat${i}`} />
            </div>
          ))}
        </div>

        {/* ── Main Workspace Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>

          {/* Left Column — Hackathons Overview Table */}
          <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Table Header & Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', margin: 0 }}>Hackathon Overview</h2>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Manage registrations, edit settings & view live submission activity</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 18, border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      background: activeFilter === s ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      color: activeFilter === s ? '#060709' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
                <div>Loading hackathons...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏗️</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No hackathons found</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {activeFilter === 'all' ? "You haven't created any hackathons yet." : `No hackathons with status: ${activeFilter}`}
                </div>
                <button onClick={() => navigate('/hackathons/create')} style={{ padding: '10px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, cursor: 'pointer' }}>
                  + Create Your First Hackathon
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                  <div>Hackathon</div><div>Status</div><div>Registrations</div><div>Submissions</div><div>End Date</div><div>Actions</div>
                </div>
                {filtered.map((h, i) => {
                  const meta = STATUS_META[h.status] || STATUS_META.draft;
                  const days = daysUntil(h.endDate);
                  return (
                    <div
                      key={h._id}
                      style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr auto', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/hackathons/${h._id}`)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3, color: '#fff' }}>{h.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {h.theme && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 20 }}>{h.theme}</span>}
                          {h.mode && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{h.mode}</span>}
                        </div>
                      </div>

                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: '0.7rem', fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                          {meta.label}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#38bdf8' }}>{h.registrationCount ?? 0}</div>

                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#34d399' }}>{h.submissionCount ?? 0}</div>

                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{formatDate(h.endDate)}</div>
                        {days !== null && days >= 0 && <div style={{ fontSize: '0.65rem', color: days < 3 ? '#fb7185' : 'rgba(255,255,255,0.38)', marginTop: 2 }}>{days === 0 ? 'Ends today!' : `${days}d left`}</div>}
                        {days !== null && days < 0 && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Ended</div>}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/registrations`)}
                          title="Manage registrations"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <User size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/edit`)}
                          title="Edit hackathon"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <Settings size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/leaderboard`)}
                          title="View leaderboard"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <Award size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column — AI Organizer Assistant & Quick Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* AI Organizer Assistant Card */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '20px 18px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🤖</div>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Organizer AI</span>
                </div>
                <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Pro</span>
              </div>

              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.3rem', lineHeight: 1.25, marginBottom: 7 }}>
                AI Timeline & Schedule Assistant
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 16 }}>
                Auto-generate hackathon timeline milestones, broadcast announcement templates, and smart judge assignments for top submissions.
              </p>

              <button
                onClick={() => toast('AI Assistant generating schedule timeline...')}
                style={{ padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                ⚡ Launch Organizer AI
              </button>
            </div>

            {/* Organizer Quick Tools Widget */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>Organizer Quick Tools</div>
              {[
                { icon: '📋', label: 'Manage Registrations', desc: 'Approve & export candidates', onClick: () => hackathons[0] && navigate(`/hackathons/${hackathons[0]._id}/registrations`) },
                { icon: '⚖️', label: 'Assign Judges', desc: 'Coordinate review workload', onClick: () => navigate('/dashboard') },
                { icon: '📢', label: 'Send Announcement', desc: 'Broadcast update to teams', onClick: () => toast('Announcement modal coming soon!') },
                { icon: '🏆', label: 'Live Leaderboards', desc: 'Publish final judge scores', onClick: () => hackathons[0] && navigate(`/hackathons/${hackathons[0]._id}/leaderboard`) },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.onClick}
                  style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.76rem', color: '#fff' }}>{t.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{t.desc}</div>
                  </div>
                  <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── 4 Bottom Stakent Metric Cells ── */}
        <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Participant Velocity', sub: 'Daily signups growth', val: '+42/day', change: '+24%', pos: true, spark: [12, 18, 24, 30, 35, 42, 48, 52, 58], color: '#ffffff' },
              { label: 'Judge Activity Rate', sub: 'Judges actively online', val: '94.2%', change: '+5.4%', pos: true, spark: [70, 75, 82, 88, 90, 92, 94, 94.2, 94.2], color: '#38bdf8' },
              { label: 'Submission Conversion', sub: 'Registered teams submitted', val: '86.4%', change: '+8.1%', pos: true, spark: [50, 58, 65, 72, 78, 82, 84, 86, 86.4], color: '#34d399' },
              { label: 'Avg Review Score', sub: 'Across submitted projects', val: '7.85/10', change: '+0.4', pos: true, spark: [6.2, 6.8, 7.1, 7.4, 7.6, 7.7, 7.8, 7.85, 7.85], color: '#fbbf24' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{m.sub}</div>
                  </div>
                  <span style={{ fontSize: '0.56rem', padding: '2px 6px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700 }}>24H</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                    ▲ {m.change}
                  </div>
                </div>
                <Sparkline data={m.spark} color={m.color} width={130} height={32} id={`orgBot${i}`} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
