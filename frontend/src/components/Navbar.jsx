import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  FiHome, FiSearch, FiUser, FiBell, FiLogOut, FiChevronDown,
  FiPlus, FiGrid, FiStar, FiMenu, FiX
} from 'react-icons/fi';

const Navbar = ({ dark = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(window.scrollY);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(prevScrollPos > current || current < 20);
      setScrolled(current > 10);
      setPrevScrollPos(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/hackathons', label: 'Browse' },
    { to: '/join-team', label: 'Join Team' },
    ...(user?.role === 'organizer' ? [{ to: '/hackathons/create', label: 'Create Event' }] : []),
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        height:62,
        display:'flex', alignItems:'center',
        padding:'0 28px',
        background: scrolled ? 'rgba(5,5,7,0.92)' : 'rgba(5,5,7,0.6)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
        transition: `transform 0.3s cubic-bezier(0.22,1,0.36,1), background 0.25s, border-color 0.25s`,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', maxWidth:1180, margin:'0 auto' }}>

          {/* Logo */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-primary)', textDecoration:'none' }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:'linear-gradient(135deg, #ffffff, #cbd5e1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.72rem', fontWeight:800, color:'#060709',
              fontFamily:'Space Grotesk, sans-serif',
              boxShadow:'0 0 14px rgba(255,255,255,0.3)',
            }}>CS</div>
            <span style={{ fontFamily:'Space Grotesk, sans-serif', fontWeight:700, fontSize:'1.05rem', letterSpacing:'-0.02em', color:'var(--text-primary)' }}>
              CodeSprint
            </span>
          </Link>

          {/* Center nav links — desktop */}
          <div style={{ display:'flex', alignItems:'center', gap:2 }} className="navbar-links">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={{
                padding:'6px 13px', borderRadius:8,
                fontSize:'0.875rem', fontWeight:500,
                color: isActive(l.to) ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive(l.to) ? 'rgba(255,255,255,0.07)' : 'transparent',
                transition:'all 0.15s ease',
                textDecoration:'none',
              }}
              onMouseEnter={e=>{if(!isActive(l.to)){e.target.style.color='var(--text-primary)';e.target.style.background='rgba(255,255,255,0.05)';}}}
              onMouseLeave={e=>{if(!isActive(l.to)){e.target.style.color='var(--text-secondary)';e.target.style.background='transparent';}}}
              >{l.label}</Link>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {user ? (
              <>
                {/* Notification bell */}
                <Link to="/notifications" style={{
                  width:36, height:36, borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                  color:'var(--text-secondary)', transition:'all 0.15s ease',
                  textDecoration:'none',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='var(--text-primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--text-secondary)';}}
                >
                  <FiBell size={15} />
                </Link>

                {/* User menu */}
                <div style={{ position:'relative' }}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'5px 12px 5px 5px',
                      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:10, cursor:'pointer', transition:'all 0.15s ease',
                      color:'var(--text-primary)',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                  >
                    <div style={{
                      width:26, height:26, borderRadius:7,
                      background:'linear-gradient(135deg, #ffffff, #cbd5e1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.72rem', fontWeight:800, color:'#060709',
                    }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize:'0.82rem', fontWeight:600 }}>{user.name?.split(' ')[0]}</span>
                    <FiChevronDown size={12} style={{ color:'var(--text-tertiary)' }} />
                  </button>

                  {menuOpen && (
                    <>
                      <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:998 }} />
                      <div style={{
                        position:'absolute', right:0, top:'110%',
                        minWidth:190, zIndex:999,
                        background:'var(--bg-elevated)',
                        border:'1px solid rgba(255,255,255,0.1)',
                        borderRadius:14, padding:6,
                        boxShadow:'0 16px 48px rgba(0,0,0,0.7)',
                      }}>
                        {/* User info header */}
                        <div style={{ padding:'10px 12px 8px', borderBottom:'1px solid var(--glass-border)', marginBottom:4 }}>
                          <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize:'0.72rem', color:'var(--text-tertiary)', marginTop:1 }}>{user.email}</div>
                        </div>

                        <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
                          display:'flex', alignItems:'center', gap:9,
                          padding:'8px 12px', borderRadius:8,
                          fontSize:'0.82rem', color:'var(--text-secondary)',
                          textDecoration:'none', transition:'all 0.12s ease',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='var(--text-primary)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)';}}
                        >
                          <FiUser size={13} /> Profile
                        </Link>

                        <div style={{ height:1, background:'var(--glass-border)', margin:'4px 0' }} />

                        <button onClick={handleLogout} style={{
                          display:'flex', alignItems:'center', gap:9, width:'100%',
                          padding:'8px 12px', borderRadius:8,
                          fontSize:'0.82rem', color:'var(--accent-rose)',
                          background:'none', border:'none', cursor:'pointer', transition:'all 0.12s ease',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(251,113,133,0.1)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                        >
                          <FiLogOut size={13} /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  padding:'7px 16px', borderRadius:8, fontSize:'0.85rem', fontWeight:500,
                  color:'var(--text-secondary)', background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)', textDecoration:'none',
                  transition:'all 0.15s ease',
                }}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='rgba(255,255,255,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
                >Log in</Link>

                <Link to="/register" style={{
                  padding:'7px 18px', borderRadius:8, fontSize:'0.85rem', fontWeight:800,
                  color:'#060709', textDecoration:'none',
                  background:'#ffffff',
                  boxShadow:'0 4px 14px rgba(255,255,255,0.3)',
                  border:'none',
                  transition:'all 0.15s ease',
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(255,255,255,0.5)'; e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 14px rgba(255,255,255,0.3)'; e.currentTarget.style.transform='none';}}
                >Sign up →</Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display:'none', width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-secondary)', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
              className="mobile-menu-btn"
            >
              {mobileOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:999,
          background:'rgba(5,5,7,0.97)', backdropFilter:'blur(20px)',
          display:'flex', flexDirection:'column', padding:'80px 24px 40px',
        }}>
          <button onClick={() => setMobileOpen(false)} style={{ position:'absolute', top:18, right:20, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', cursor:'pointer' }}>
            <FiX size={16} />
          </button>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} style={{
              display:'block', padding:'14px 0', fontSize:'1.3rem', fontWeight:700,
              color: isActive(l.to) ? '#818cf8' : 'var(--text-secondary)',
              borderBottom:'1px solid var(--glass-border)', textDecoration:'none',
              fontFamily:'Space Grotesk, sans-serif', letterSpacing:'-0.02em',
            }}>{l.label}</Link>
          ))}
          <div style={{ marginTop:32, display:'flex', flexDirection:'column', gap:12 }}>
            {user ? (
              <button onClick={handleLogout} style={{ padding:'13px', borderRadius:10, background:'rgba(251,113,133,0.1)', border:'1px solid rgba(251,113,133,0.25)', color:'var(--accent-rose)', fontSize:'0.95rem', fontWeight:700, cursor:'pointer' }}>
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={()=>setMobileOpen(false)} style={{ padding:'13px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-secondary)', fontSize:'0.95rem', fontWeight:600, textAlign:'center', textDecoration:'none' }}>Log in</Link>
                <Link to="/register" onClick={()=>setMobileOpen(false)} style={{ padding:'13px', borderRadius:10, background:'#ffffff', color:'#060709', fontSize:'0.95rem', fontWeight:800, textAlign:'center', textDecoration:'none' }}>Sign up free →</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width:768px) {
          .navbar-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
