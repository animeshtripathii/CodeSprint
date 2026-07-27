import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  FiSearch, FiFilter, FiCalendar, FiUsers, FiAward,
  FiChevronRight, FiGlobe, FiMapPin, FiX, FiGrid, FiList, FiPlus
} from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    open: { label:'Open', color:'#34d399', bg:'rgba(52,211,153,0.12)', border:'rgba(52,211,153,0.28)', dot:'#34d399' },
    upcoming: { label:'Upcoming', color:'#38bdf8', bg:'rgba(56,189,248,0.12)', border:'rgba(56,189,248,0.28)', dot:'#38bdf8' },
    ongoing: { label:'Ongoing', color:'#fbbf24', bg:'rgba(251,191,36,0.12)', border:'rgba(251,191,36,0.28)', dot:'#fbbf24' },
    ended: { label:'Ended', color:'#94a3b8', bg:'rgba(148,163,184,0.12)', border:'rgba(148,163,184,0.2)', dot:'#94a3b8' },
  };
  const s = map[status] || map.ended;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      padding:'4px 12px', borderRadius:999, fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.02em',
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
};

/* ── Mode badge ── */
const ModeBadge = ({ mode }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:5,
    background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)',
    border:'1px solid rgba(255,255,255,0.12)',
    padding:'4px 11px', borderRadius:999, fontSize:'0.72rem', fontWeight:600,
  }}>
    {mode === 'online' ? <FiGlobe size={11}/> : <FiMapPin size={11}/>}
    {mode?.charAt(0).toUpperCase() + mode?.slice(1)}
  </span>
);

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div className="liquid-glass" style={{ borderRadius:22, overflow:'hidden', height:340 }}>
    <div className="skeleton" style={{ height:160 }} />
    <div style={{ padding:20 }}>
      <div className="skeleton" style={{ height:20, width:'70%', marginBottom:12 }} />
      <div className="skeleton" style={{ height:14, width:'50%', marginBottom:8 }} />
      <div className="skeleton" style={{ height:14, width:'60%' }} />
    </div>
  </div>
);

/* ── Filter Pill ── */
const FilterPill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:'7px 18px', borderRadius:999, fontSize:'0.78rem', fontWeight:700,
    background: active ? '#ffffff' : 'rgba(255,255,255,0.05)',
    color: active ? '#060709' : 'rgba(255,255,255,0.6)',
    border: active ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.12)',
    boxShadow: active ? '0 4px 14px rgba(255,255,255,0.25)' : 'none',
    cursor:'pointer', transition:'all 0.2s ease',
    whiteSpace:'nowrap',
  }}>{label}</button>
);

export default function HackathonsPage() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search:'', mode:'', status:'', theme:'' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const DUMMY_HACKATHONS = [
    {
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
      tags: ['AI', 'React', 'Node.js', 'Agents']
    },
    {
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
      tags: ['Web3', 'Finance', 'Security']
    }
  ];

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const params = { page, limit:9, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await api.get('/hackathons', { params });
      if (data?.data?.hackathons && data.data.hackathons.length > 0) {
        setHackathons(data.data.hackathons);
        setTotal(data.data.total);
      } else {
        setHackathons(DUMMY_HACKATHONS);
        setTotal(DUMMY_HACKATHONS.length);
      }
    } catch (err) {
      setHackathons(DUMMY_HACKATHONS);
      setTotal(DUMMY_HACKATHONS.length);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHackathons(); }, [page, filters]);

  const handleFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ search:'', mode:'', status:'', theme:'' }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);
  const pages = Math.ceil(total / 9);

  return (
    <div style={{ position:'relative', background:'#050507', minHeight:'100vh', color:'#f0f2ff', fontFamily:"'Inter', sans-serif", overflow:'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div style={{ position:'relative', zIndex:10 }}>

        {/* ── Page Hero Header ── */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'120px 24px 40px' }}>
          
          {/* Header Liquid Panel */}
          <div className="liquid-glass" style={{ padding:'36px 40px', borderRadius:28, marginBottom:40 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:24, justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{
                  fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
                  color:'rgba(255,255,255,0.5)', marginBottom:8, display:'flex', alignItems:'center', gap:8,
                }}>
                  🏆 Discover & Compete
                </div>
                <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:'clamp(2.2rem, 5vw, 3.2rem)', fontWeight:400, letterSpacing:'-0.02em', marginBottom:8, color:'#ffffff', lineHeight:1 }}>
                  Browse Hackathons
                </h1>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.95rem', maxWidth:520, lineHeight:1.6, margin:0 }}>
                  Find your next challenge. Filter by mode, status, and theme to discover open hackathons and prize pools.
                </p>
              </div>

              {/* Action Buttons & View toggle */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button
                  onClick={() => navigate('/hackathons/create')}
                  style={{
                    padding:'10px 20px', borderRadius:12, background:'#ffffff', border:'none',
                    color:'#060709', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:6, boxShadow:'0 4px 18px rgba(255,255,255,0.3)', transition:'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  <FiPlus size={16} /> Create Hackathon
                </button>

                <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:4 }}>
                  {[['grid',<FiGrid size={15}/>],['list',<FiList size={15}/>]].map(([m,icon])=>(
                    <button key={m} onClick={()=>setViewMode(m)} style={{
                      width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                      background: viewMode===m ? '#ffffff' : 'transparent',
                      color: viewMode===m ? '#060709' : 'rgba(255,255,255,0.5)',
                      border: 'none', cursor:'pointer', transition:'all 0.15s ease',
                    }}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search & filter row */}
            <div style={{ marginTop:28, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              {/* Search input */}
              <div style={{ position:'relative', flex:1, minWidth:260, maxWidth:480 }}>
                <FiSearch size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.4)' }} />
                <input
                  placeholder="Search hackathons, themes, tags..."
                  style={{
                    width:'100%', padding:'10px 14px 10px 40px', borderRadius:12,
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.14)',
                    color:'#ffffff', fontSize:'0.88rem', outline:'none', boxSizing:'border-box',
                    transition:'all 0.2s'
                  }}
                  value={filters.search}
                  onChange={e => handleFilter('search', e.target.value)}
                />
              </div>

              {/* Quick filter pills */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <FilterPill label="All" active={!filters.status} onClick={() => handleFilter('status','')} />
                <FilterPill label="🟢 Open" active={filters.status==='open'} onClick={() => handleFilter('status', filters.status==='open'?'':'open')} />
                <FilterPill label="🔵 Upcoming" active={filters.status==='upcoming'} onClick={() => handleFilter('status', filters.status==='upcoming'?'':'upcoming')} />
                <FilterPill label="🟡 Ongoing" active={filters.status==='ongoing'} onClick={() => handleFilter('status', filters.status==='ongoing'?'':'ongoing')} />
                <FilterPill label="🔴 Previous / Ended" active={filters.status==='ended'} onClick={() => handleFilter('status', filters.status==='ended'?'':'ended')} />
              </div>

              {/* More filters button */}
              <button onClick={()=>setShowFilters(!showFilters)} style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'10px 16px', borderRadius:12, fontSize:'0.82rem', fontWeight:600,
                background: showFilters ? '#ffffff' : 'rgba(255,255,255,0.05)',
                border: showFilters ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color: showFilters ? '#060709' : 'rgba(255,255,255,0.7)',
                cursor:'pointer', transition:'all 0.15s ease',
              }}>
                <FiFilter size={13} /> Filters {hasFilters && <span style={{ background:'rgba(255,255,255,0.2)', color: showFilters ? '#060709' : '#fff', borderRadius:999, padding:'1px 6px', fontSize:'0.65rem', fontWeight:700 }}>{Object.values(filters).filter(Boolean).length}</span>}
              </button>

              {hasFilters && (
                <button onClick={clearFilters} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'10px 14px', borderRadius:12, fontSize:'0.8rem', fontWeight:600,
                  background:'rgba(251,113,133,0.12)', border:'1px solid rgba(251,113,133,0.28)',
                  color:'#fb7185', cursor:'pointer', transition:'all 0.15s ease',
                }}><FiX size={13}/>Clear</button>
              )}
            </div>

            {/* Extended filter panel */}
            {showFilters && (
              <div className="liquid-glass" style={{
                marginTop:16, padding:20, borderRadius:18, display:'flex', gap:32, flexWrap:'wrap',
              }}>
                <div>
                  <label style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:10 }}>Mode</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {['', 'online', 'offline', 'hybrid'].map(m => (
                      <FilterPill key={m} label={m===''?'Any':(m.charAt(0).toUpperCase()+m.slice(1))} active={filters.mode===m} onClick={()=>handleFilter('mode',m)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:10 }}>Theme Keyword</label>
                  <input placeholder="e.g. AI, Web3, Health..." style={{ padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.14)', color:'#fff', fontSize:'0.82rem', outline:'none', width:220 }}
                    value={filters.theme} onChange={e => handleFilter('theme', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="container" style={{ paddingTop:36, paddingBottom:80, paddingLeft:28, paddingRight:28 }}>
          {/* Result count */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>
              {loading ? 'Loading...' : `${total} hackathon${total!==1?'s':''} found`}
            </span>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="liquid-glass" style={{ padding:54, textAlign:'center', borderRadius:24 }}>
              <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🔍</div>
              <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:6 }}>No hackathons found</div>
              <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.45)', marginBottom:20 }}>Try adjusting your search terms or filters</div>
              <button onClick={clearFilters} style={{ padding:'9px 20px', borderRadius:10, background:'#ffffff', border:'none', color:'#060709', fontWeight:700, cursor:'pointer' }}>
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {hackathons.map(h => <HackathonCard key={h._id} h={h} />)}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {hackathons.map(h => <HackathonListRow key={h._id} h={h} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:48, flexWrap:'wrap' }}>
              {[...Array(pages)].map((_,i) => (
                <button key={i} onClick={() => setPage(i+1)} style={{
                  width:38, height:38, borderRadius:10,
                  background: page===i+1 ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: page===i+1 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  color: page===i+1 ? '#060709' : 'rgba(255,255,255,0.7)',
                  fontSize:'0.85rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s ease',
                }}>{i+1}</button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Modern Animated Hackathon Card (Grid view) ── */
function HackathonCard({ h }) {
  return (
    <div
      className="liquid-glass"
      style={{
        borderRadius: 22, overflow: 'hidden',
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        display: 'flex', flexDirection: 'column', position: 'relative'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Card Header Banner */}
      <div style={{
        height: 160, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {h.bannerUrl
          ? <img src={h.bannerUrl} alt={h.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
          : <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>🏆</span>
        }
        
        {/* Status overlay */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <StatusBadge status={h.status} />
        </div>

        {/* Prize Pool Badge */}
        {h.prizePool && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(251,191,36,0.38)', borderRadius: 10, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiAward size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24' }}>{h.prizePool}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <ModeBadge mode={h.mode} />
          {h.theme && (
            <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 11px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {h.theme}
            </span>
          )}
        </div>

        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.25rem', marginBottom: 10, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          {h.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
            <FiCalendar size={13} style={{ flexShrink: 0 }} />
            {new Date(h.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(h.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {h.maxTeamSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
              <FiUsers size={13} style={{ flexShrink: 0 }} /> Up to {h.maxTeamSize} members per team
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to={`/hackathons/${h._id}`} style={{
            flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
            color: '#ffffff', textDecoration: 'none', textAlign: 'center',
            transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            Details
          </Link>
          
          {h.status === 'open' && (
            <Link to={`/hackathons/${h._id}`} style={{
              flex: 1.3, padding: '9px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
              background: '#ffffff', color: '#060709', textDecoration: 'none', textAlign: 'center',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              boxShadow: '0 4px 14px rgba(255,255,255,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              Register <FiChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modern Hackathon List Row (List view) ── */
function HackathonListRow({ h }) {
  return (
    <div
      className="liquid-glass"
      style={{
        borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
        🏆
      </div>
      
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <StatusBadge status={h.status} />
          <ModeBadge mode={h.mode} />
        </div>
        
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.3rem', color: '#ffffff', letterSpacing: '-0.01em', margin: '0 0 6px 0' }}>
          {h.title}
        </h3>
        
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiCalendar size={12}/> {new Date(h.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(h.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {h.maxTeamSize && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}><FiUsers size={12}/> {h.maxTeamSize} max</span>}
          {h.prizePool && <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><FiAward size={12}/> {h.prizePool}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <Link to={`/hackathons/${h._id}`} style={{
          padding: '9px 18px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
          color: '#ffffff', textDecoration: 'none', transition: 'all 0.15s ease',
        }}>
          View
        </Link>
        {h.status === 'open' && (
          <Link to={`/hackathons/${h._id}`} style={{
            padding: '9px 20px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
            background: '#ffffff', color: '#060709', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Register <FiChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
