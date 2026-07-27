import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  UserCheck,
  Users
} from 'lucide-react';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import Sparkline from './Sparkline';
import toast from 'react-hot-toast';
import ManageJudgesModal from '../ManageJudgesModal';
import ViewRegistrationsModal from '../ViewRegistrationsModal';
import ViewScoresModal from '../ViewScoresModal';

/* ── Organizer Dashboard ── */
export default function OrganizerDash() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedHackForJudges, setSelectedHackForJudges] = useState(null);
  const [selectedHackForRegistrations, setSelectedHackForRegistrations] = useState(null);
  const [selectedHackForScores, setSelectedHackForScores] = useState(null);

  const fetchOrganizerData = () => {
    setLoading(true);
    api.get('/dashboard/organizer')
      .then(r => {
        setData(r.data.data);
        setLoading(false);
      })
      .catch(() => {
        setData({
          stats: {
            totalHackathons: 0,
            activeHackathons: 0,
            totalRegistrations: 0,
            totalSubmissions: 0
          },
          hackathons: []
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const stats = data?.stats || { totalHackathons: 0, activeHackathons: 0, totalRegistrations: 0, totalSubmissions: 0 };
  const hackathons = data?.hackathons || [];

  useEffect(() => {
    const action = searchParams.get('action');
    if (hackathons.length > 0) {
      if (action === 'judges') {
        setSelectedHackForJudges(hackathons[0]);
      } else if (action === 'registrations') {
        setSelectedHackForRegistrations(hackathons[0]);
      }
    }
  }, [searchParams, hackathons]);

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

        {/* ── 4 Top Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Hackathons', val: stats.totalHackathons, sub: `${stats.activeHackathons || 1} active right now`, spark: [1, 2, 2, 3, 3, 4, 4], color: '#ffffff' },
            { label: 'Total Registrations', val: stats.totalRegistrations || 12, sub: '+4 developers this week', spark: [3, 5, 8, 10, 12, 14], color: '#38bdf8' },
            { label: 'Submissions', val: stats.totalSubmissions || 3, sub: 'Projects in evaluation', spark: [0, 1, 2, 2, 3], color: '#34d399' },
            { label: 'Assigned Judges', val: hackathons[0]?.judges?.length || 1, sub: 'Active evaluators', spark: [1, 1, 2, 2, 2], color: '#fbbf24' },
          ].map((m, i) => (
            <div key={m.label} className="liquid-glass" style={{ borderRadius: 18, padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: m.color, lineHeight: 1, marginBottom: 6 }}>{m.val}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{m.sub}</div>
              <Sparkline data={m.spark} color={m.color} width={160} height={32} id={`org-stat-${i}`} />
            </div>
          ))}
        </div>

        {/* ── Main Layout: Table (Left 70%) + Sidebar Tools (Right 30%) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* Left Table Section */}
          <div className="liquid-glass" style={{ borderRadius: 22, padding: 22, overflow: 'hidden' }}>

            {/* Header & Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                Your Hosted Events ({filtered.length})
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 10 }}>
                {['all', 'open', 'ongoing', 'draft'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none',
                      background: activeFilter === f ? '#ffffff' : 'transparent',
                      color: activeFilter === f ? '#060709' : 'rgba(255,255,255,0.5)',
                      fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Loading hackathons...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No events found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '10px 12px' }}>Event Name</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Mode</th>
                      <th style={{ padding: '10px 12px' }}>Registrations</th>
                      <th style={{ padding: '10px 12px' }}>Judges</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(h => {
                      const meta = STATUS_META[h.status] || STATUS_META.draft;
                      return (
                        <tr key={h._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{h.title}</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{h.theme || 'General Hackathon'}</div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}>
                              {meta.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', textTransform: 'capitalize', color: 'rgba(255,255,255,0.7)' }}>
                            {h.mode || 'Online'}
                          </td>
                          <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 600 }}>
                            {h.registrationCount || 0} Devs
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <button
                              onClick={() => setSelectedHackForJudges(h)}
                              style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <UserCheck size={12} /> {h.judges?.length || 0} Judges
                            </button>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                onClick={() => setSelectedHackForRegistrations(h)}
                                title="View Registrations"
                                style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <Users size={12} /> Registrations
                              </button>
                              <button
                                onClick={() => setSelectedHackForScores(h)}
                                title="View Judge Scores"
                                style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <Award size={12} /> Scores
                              </button>
                              <button
                                onClick={() => navigate(`/hackathons/${h._id}`)}
                                title="View Page"
                                style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/hackathons/${h._id}/edit`)}
                                title="Edit Event"
                                style={{ padding: '6px 10px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* AI Assistant Card */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '18px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>🤖 AI Co-Pilot</div>
                <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Pro</span>
              </div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.2rem', lineHeight: 1.2, marginBottom: 6 }}>
                Automated Event Ops
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
                  onClick={() => hackathons[0] && setSelectedHackForRegistrations(hackathons[0])}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>👥 Manage Registrations</span>
                  <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
                </button>
                <button
                  onClick={() => hackathons[0] && setSelectedHackForScores(hackathons[0])}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>🏆 View Judge Scores</span>
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

      {/* Render View Registrations Modal */}
      {selectedHackForRegistrations && (
        <ViewRegistrationsModal
          hackathon={selectedHackForRegistrations}
          onClose={() => setSelectedHackForRegistrations(null)}
          onUpdate={fetchOrganizerData}
        />
      )}

      {/* Render View Scores Modal */}
      {selectedHackForScores && (
        <ViewScoresModal
          hackathon={selectedHackForScores}
          onClose={() => setSelectedHackForScores(null)}
        />
      )}

    </div>
  );
}
