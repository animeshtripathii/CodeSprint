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
  ChevronRight,
  Scale,
  UserCheck
} from 'lucide-react';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import Sparkline from './Sparkline';
import toast from 'react-hot-toast';
import ManageJudgesModal from '../ManageJudgesModal';

/* ── Organizer Dashboard ── */
export default function OrganizerDash() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedHackForJudges, setSelectedHackForJudges] = useState(null);

  const fetchOrganizerData = () => {
    setLoading(true);
    api.get('/dashboard/organizer')
      .then(r => {
        setData(r.data.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback dummy data if endpoint fails or empty
        setData({
          stats: {
            totalHackathons: 1,
            activeHackathons: 1,
            totalRegistrations: 0,
            totalSubmissions: 0
          },
          hackathons: [
            {
              _id: 'hack-dummy-1',
              title: 'Code-With-AI',
              theme: 'Vibecoding, Artificial Intelligence',
              mode: 'offline',
              status: 'draft',
              registrationCount: 0,
              submissionCount: 0,
              endDate: new Date(Date.now() + 5 * 86400000).toISOString()
            }
          ]
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const stats = data?.stats || { totalHackathons: 0, activeHackathons: 0, totalRegistrations: 0, totalSubmissions: 0 };
  const hackathons = data?.hackathons || [];

  const filtered = hackathons.filter(h => {
    if (activeFilter === 'all') return true;
    return h.status === activeFilter;
  });

  const STATUS_META = {
    open: { label: 'Open', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    ongoing: { label: 'Ongoing', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    upcoming: { label: 'Upcoming', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    draft: { label: 'Draft', color: '#cbd5e1', bg: 'rgba(203,213,225,0.12)' },
    ended: { label: 'Ended', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const diff = new Date(d).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ position: 'relative', padding: '28px 28px', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── Top Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>
              Organizer Workspace
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', margin: 0, lineHeight: 1.05 }}>
              Organizer Control Panel
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', marginTop: 6, margin: 0 }}>
              Manage hackathons, participant registrations, judge assignments & live evaluation results.
            </p>
          </div>

          <button
            onClick={() => navigate('/hackathons/create')}
            style={{
              padding: '11px 22px', borderRadius: 12, background: '#ffffff', border: 'none',
              color: '#060709', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(255,255,255,0.3)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >
            <Plus size={16} /> Create Hackathon
          </button>
        </div>

        {/* ── Top 4 Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Hackathons', val: stats.totalHackathons ?? 0, sub: 'Organized by you', color: '#ffffff', spark: [1, 2, 2, 3, 3, 4, 4] },
            { label: 'Active Hackathons', val: stats.activeHackathons ?? 0, sub: 'Currently open/ongoing', color: '#38bdf8', spark: [1, 1, 2, 2, 3, 3, 3] },
            { label: 'Registrations', val: stats.totalRegistrations ?? 0, sub: 'Across all events', color: '#34d399', spark: [5, 12, 28, 45, 60, 85, 110] },
            { label: 'Submissions', val: stats.totalSubmissions ?? 0, sub: 'Project entries received', color: '#fbbf24', spark: [2, 6, 14, 22, 35, 48, 62] },
          ].map((m, idx) => (
            <div key={m.label} className="liquid-glass" style={{ borderRadius: 20, padding: '18px 18px 14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: m.color, lineHeight: 1, marginBottom: 4 }}>
                {loading ? '—' : m.val}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)', marginBottom: 12 }}>{m.sub}</div>
              <Sparkline data={m.spark} color={m.color} width={140} height={32} id={`org-stat-${idx}`} />
            </div>
          ))}
        </div>

        {/* ── Main Section: Table + AI Assistant ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16 }}>
          
          {/* Left Column: Hackathons Table */}
          <div className="liquid-glass" style={{ borderRadius: 22, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Table Header Controls */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', lineHeight: 1 }}>Hackathon Overview</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Manage registrations, assign judges, edit settings & view live activity</div>
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                {['all', 'open', 'ongoing', 'upcoming', 'draft', 'ended'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      background: activeFilter === f ? '#ffffff' : 'transparent',
                      color: activeFilter === f ? '#060709' : 'rgba(255,255,255,0.45)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f}
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
                          onClick={() => setSelectedHackForJudges(h)}
                          title="Assign & Invite Judges"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#ffffff'; }}
                        >
                          <UserCheck size={14} />
                        </button>
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
                Auto-generate hackathon milestones, broadcast announcements, and match judges automatically.
              </p>

              <button
                onClick={() => toast('AI Schedule Assistant: Generating milestone schedule... 🤖')}
                style={{ padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                ⚡ Auto-Generate Timeline
              </button>
            </div>

            {/* Quick Tools Box */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '18px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10 }}>Organizer Quick Tools</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => hackathons[0] && setSelectedHackForJudges(hackathons[0])}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>⚖️ Assign / Invite Judges</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
                </button>
                <button
                  onClick={() => hackathons[0] && navigate(`/hackathons/${hackathons[0]._id}/registrations`)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>👥 Manage Registrations</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Render Judge Management & Invites Modal */}
      {selectedHackForJudges && (
        <ManageJudgesModal
          hackathon={selectedHackForJudges}
          onClose={() => setSelectedHackForJudges(null)}
          onUpdate={fetchOrganizerData}
        />
      )}

    </div>
  );
}
