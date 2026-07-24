import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  FiSearch, FiFilter, FiCalendar, FiUsers, FiAward,
  FiChevronRight, FiGlobe, FiMapPin, FiX, FiGrid, FiList
} from 'react-icons/fi';

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    open: { label:'Open', color:'#34d399', bg:'rgba(52,211,153,0.1)', border:'rgba(52,211,153,0.22)', dot:'#34d399' },
    upcoming: { label:'Upcoming', color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.22)', dot:'#a78bfa' },
    ongoing: { label:'Ongoing', color:'#fbbf24', bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.22)', dot:'#fbbf24' },
    ended: { label:'Ended', color:'#6b7280', bg:'rgba(107,114,128,0.1)', border:'rgba(107,114,128,0.2)', dot:'#6b7280' },
  };
  const s = map[status] || map.ended;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      padding:'3px 10px', borderRadius:999, fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.01em',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, flexShrink:0, ...(status==='open'?{animation:'pulse-ring 2s infinite'}:{}) }} />
      {s.label}
    </span>
  );
};

/* ── Mode badge ── */
const ModeBadge = ({ mode }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:5,
    background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)',
    border:'1px solid var(--glass-border)',
    padding:'3px 10px', borderRadius:999, fontSize:'0.7rem', fontWeight:600,
  }}>
    {mode === 'online' ? <FiGlobe size={10}/> : <FiMapPin size={10}/>}
    {mode?.charAt(0).toUpperCase() + mode?.slice(1)}
  </span>
);

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:16, overflow:'hidden' }}>
    <div className="skeleton" style={{ height:160 }} />
    <div style={{ padding:20 }}>
      <div className="skeleton" style={{ height:18, width:'65%', marginBottom:12 }} />
      <div className="skeleton" style={{ height:13, width:'45%', marginBottom:8 }} />
      <div className="skeleton" style={{ height:13, width:'55%' }} />
    </div>
  </div>
);

/* ── Filter Pill ── */
const FilterPill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:'6px 16px', borderRadius:999, fontSize:'0.8rem', fontWeight:600,
    background: active ? 'rgba(91,110,248,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#a5b4fc' : 'var(--text-secondary)',
    border: active ? '1px solid rgba(91,110,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
    cursor:'pointer', transition:'all 0.15s ease',
    whiteSpace:'nowrap',
  }}>{label}</button>
);

export default function HackathonsPage() {
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
      title: 'HackForge 2026 — AI & Multi-Agent Innovation Sprint',
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
    <div style={{ background:'var(--bg-base)', minHeight:'100vh', color:'var(--text-primary)' }}>
      <Navbar dark={true} />

      {/* ── Page header ── */}
      <div style={{
        paddingTop:62,
        background:'linear-gradient(180deg, rgba(91,110,248,0.08) 0%, transparent 100%)',
        borderBottom:'1px solid var(--glass-border)',
      }}>
        <div className="container" style={{ padding:'60px 24px 48px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
            <div>
              <span style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:700, color:'var(--accent-primary)', display:'block', marginBottom:10 }}>
                Discover
              </span>
              <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:800, letterSpacing:'-0.035em', marginBottom:8, color:'var(--text-primary)' }}>
                Browse Hackathons
              </h1>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem', maxWidth:460, lineHeight:1.6 }}>
                Find your next challenge. Filter by mode, status, and theme to discover the perfect event.
              </p>
            </div>

            {/* View toggle */}
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', borderRadius:10, padding:4 }}>
              {[['grid',<FiGrid size={14}/>],['list',<FiList size={14}/>]].map(([m,icon])=>(
                <button key={m} onClick={()=>setViewMode(m)} style={{
                  width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
                  background: viewMode===m ? 'rgba(91,110,248,0.25)' : 'transparent',
                  color: viewMode===m ? '#a5b4fc' : 'var(--text-tertiary)',
                  border: viewMode===m ? '1px solid rgba(91,110,248,0.3)' : '1px solid transparent',
                  cursor:'pointer', transition:'all 0.15s ease',
                }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* Search & filter row */}
          <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:1, minWidth:260, maxWidth:460 }}>
              <FiSearch size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)' }} />
              <input
                className="input"
                placeholder="Search hackathons, themes..."
                style={{ paddingLeft:38, borderRadius:10 }}
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
            </div>

            {/* More filters */}
            <button onClick={()=>setShowFilters(!showFilters)} style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 16px', borderRadius:10, fontSize:'0.82rem', fontWeight:600,
              background: showFilters ? 'rgba(91,110,248,0.15)' : 'rgba(255,255,255,0.04)',
              border: showFilters ? '1px solid rgba(91,110,248,0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: showFilters ? '#a5b4fc' : 'var(--text-secondary)',
              cursor:'pointer', transition:'all 0.15s ease',
            }}>
              <FiFilter size={13} /> Filters {hasFilters && <span style={{ background:'rgba(91,110,248,0.2)', color:'#a5b4fc', borderRadius:999, padding:'0 6px', fontSize:'0.68rem', fontWeight:700 }}>{Object.values(filters).filter(Boolean).length}</span>}
            </button>

            {hasFilters && (
              <button onClick={clearFilters} style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'9px 14px', borderRadius:10, fontSize:'0.8rem', fontWeight:600,
                background:'rgba(251,113,133,0.08)', border:'1px solid rgba(251,113,133,0.2)',
                color:'var(--accent-rose)', cursor:'pointer', transition:'all 0.15s ease',
              }}><FiX size={12}/>Clear</button>
            )}
          </div>

          {/* Extended filter panel */}
          {showFilters && (
            <div style={{
              marginTop:16, padding:20,
              background:'rgba(255,255,255,0.03)',
              border:'1px solid var(--glass-border)',
              borderRadius:14, display:'flex', gap:32, flexWrap:'wrap',
            }}>
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-tertiary)', display:'block', marginBottom:10 }}>Mode</label>
                <div style={{ display:'flex', gap:6 }}>
                  {['', 'online', 'offline', 'hybrid'].map(m => (
                    <FilterPill key={m} label={m===''?'Any':(m.charAt(0).toUpperCase()+m.slice(1))} active={filters.mode===m} onClick={()=>handleFilter('mode',m)} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-tertiary)', display:'block', marginBottom:10 }}>Theme</label>
                <input className="input" placeholder="e.g. AI, Web3, Health..." style={{ borderRadius:8, width:200 }}
                  value={filters.theme} onChange={e => handleFilter('theme', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container" style={{ paddingTop:40, paddingBottom:80 }}>
        {/* Result count */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <span style={{ fontSize:'0.82rem', color:'var(--text-tertiary)', fontWeight:500 }}>
            {loading ? 'Loading...' : `${total} hackathon${total!==1?'s':''} found`}
          </span>
        </div>

        {/* Grid / List */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No hackathons found</div>
            <div className="empty-subtitle">Try different filters or search terms</div>
            <button onClick={clearFilters} className="btn-glass btn-sm">Clear all filters</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
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
                width:38, height:38, borderRadius:8,
                background: page===i+1 ? 'rgba(91,110,248,0.2)' : 'rgba(255,255,255,0.04)',
                border: page===i+1 ? '1px solid rgba(91,110,248,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: page===i+1 ? '#a5b4fc' : 'var(--text-secondary)',
                fontSize:'0.85rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s ease',
              }}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hackathon Card (Grid view) ── */
function HackathonCard({ h }) {
  return (
    <div style={{
      background:'var(--glass-bg)',
      border:'1px solid var(--glass-border)',
      borderRadius:16, overflow:'hidden',
      transition:'all 0.25s ease',
      display:'flex', flexDirection:'column',
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.border='1px solid rgba(91,110,248,0.25)';
      e.currentTarget.style.transform='translateY(-3px)';
      e.currentTarget.style.boxShadow='0 12px 36px rgba(0,0,0,0.5)';
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.border='1px solid var(--glass-border)';
      e.currentTarget.style.transform='none';
      e.currentTarget.style.boxShadow='none';
    }}
    >
      {/* Banner */}
      <div style={{
        height:160, position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(91,110,248,0.15) 0%, rgba(167,139,250,0.1) 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {h.banner
          ? <img src={h.banner} alt={h.title} style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
          : <span style={{ fontSize:'2.5rem', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}>🏆</span>
        }
        {/* Status overlay */}
        <div style={{ position:'absolute', top:12, left:12 }}>
          <StatusBadge status={h.status} />
        </div>
        {h.prizePool && (
          <div style={{ position:'absolute', top:12, right:12, background:'rgba(5,5,7,0.8)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:8, padding:'4px 10px', display:'flex', alignItems:'center', gap:5 }}>
            <FiAward size={11} style={{ color:'#fbbf24' }} />
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#fbbf24' }}>{h.prizePool}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:20, flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          <ModeBadge mode={h.mode} />
          {h.theme && (
            <span style={{ background:'rgba(255,255,255,0.04)', color:'var(--text-tertiary)', border:'1px solid var(--glass-border)', padding:'3px 10px', borderRadius:999, fontSize:'0.7rem', fontWeight:600 }}>
              {h.theme}
            </span>
          )}
        </div>

        <h3 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'1rem', marginBottom:8, color:'var(--text-primary)', lineHeight:1.3, letterSpacing:'-0.01em' }}>
          {h.title}
        </h3>

        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:'auto', paddingBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>
            <FiCalendar size={12} style={{ flexShrink:0 }} />
            {new Date(h.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {new Date(h.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
          </div>
          {h.maxTeamSize && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'var(--text-tertiary)' }}>
              <FiUsers size={12} style={{ flexShrink:0 }} /> Up to {h.maxTeamSize} members per team
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, paddingTop:16, borderTop:'1px solid var(--glass-border)' }}>
          <Link to={`/hackathons/${h._id}`} style={{
            flex:1, padding:'8px', borderRadius:8, fontSize:'0.8rem', fontWeight:600,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            color:'var(--text-secondary)', textDecoration:'none', textAlign:'center',
            transition:'all 0.15s ease', display:'flex', alignItems:'center', justifyContent:'center',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.color='var(--text-primary)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='var(--text-secondary)';}}
          >Details</Link>
          {h.status === 'open' && (
            <Link to={`/hackathons/${h._id}`} style={{
              flex:1, padding:'8px', borderRadius:8, fontSize:'0.8rem', fontWeight:700,
              background:'linear-gradient(135deg,#5b6ef8,#7f8fff)',
              color:'#fff', textDecoration:'none', textAlign:'center',
              transition:'all 0.15s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              boxShadow:'0 3px 12px rgba(91,110,248,0.35)',
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 5px 18px rgba(91,110,248,0.55)';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 3px 12px rgba(91,110,248,0.35)';e.currentTarget.style.transform='none';}}
            >Register <FiChevronRight size={13}/></Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Hackathon List Row (List view) ── */
function HackathonListRow({ h }) {
  return (
    <div style={{
      background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:14,
      padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
      transition:'all 0.2s ease',
    }}
    onMouseEnter={e=>{e.currentTarget.style.border='1px solid rgba(91,110,248,0.2)';e.currentTarget.style.background='rgba(255,255,255,0.05)';}}
    onMouseLeave={e=>{e.currentTarget.style.border='1px solid var(--glass-border)';e.currentTarget.style.background='var(--glass-bg)';}}
    >
      <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,rgba(91,110,248,0.2),rgba(167,139,250,0.15))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', flexShrink:0 }}>
        🏆
      </div>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
          <StatusBadge status={h.status} />
          <ModeBadge mode={h.mode} />
        </div>
        <h3 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{h.title}</h3>
        <div style={{ display:'flex', gap:16, marginTop:5, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:5 }}>
            <FiCalendar size={11}/> {new Date(h.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
          </span>
          {h.maxTeamSize && <span style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', display:'flex', alignItems:'center', gap:5 }}><FiUsers size={11}/> {h.maxTeamSize} max</span>}
          {h.prizePool && <span style={{ fontSize:'0.75rem', color:'#fbbf24', display:'flex', alignItems:'center', gap:5 }}><FiAward size={11}/> {h.prizePool}</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <Link to={`/hackathons/${h._id}`} style={{
          padding:'8px 18px', borderRadius:8, fontSize:'0.8rem', fontWeight:600,
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          color:'var(--text-secondary)', textDecoration:'none', transition:'all 0.15s ease',
        }}
        onMouseEnter={e=>{e.currentTarget.style.color='var(--text-primary)';e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
        onMouseLeave={e=>{e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.background='rgba(255,255,255,0.05)';}}
        >View</Link>
        {h.status==='open' && (
          <Link to={`/hackathons/${h._id}`} style={{
            padding:'8px 18px', borderRadius:8, fontSize:'0.8rem', fontWeight:700,
            background:'linear-gradient(135deg,#5b6ef8,#7f8fff)', color:'#fff',
            textDecoration:'none', boxShadow:'0 3px 10px rgba(91,110,248,0.35)', transition:'all 0.15s ease',
            display:'flex', alignItems:'center', gap:5,
          }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 5px 18px rgba(91,110,248,0.5)';}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 3px 10px rgba(91,110,248,0.35)';}}
          >Register <FiChevronRight size={13}/></Link>
        )}
      </div>
    </div>
  );
}
