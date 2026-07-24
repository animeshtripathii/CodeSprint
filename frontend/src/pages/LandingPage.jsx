import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  ArrowRight,
  Camera,
  X,
  Zap,
  Menu,
} from 'lucide-react';

/* useVideoFade – RAF-based fade (no CSS transitions).
   Resumes from current opacity. fadingOutRef blocks re-trigger. */
function useVideoFade(videoRef) {
  const rafRef = useRef(null);
  const fadingOutRef = useRef(false);

  const cancelRaf = () => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const fadeTo = (target, duration, onComplete) => {
    cancelRaf();
    const video = videoRef.current;
    if (!video) return;
    const startOp = video.style.opacity !== '' ? parseFloat(video.style.opacity) : 0;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      video.style.opacity = String(startOp + (target - startOp) * progress);
      if (progress < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { rafRef.current = null; if (onComplete) onComplete(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return {
    fadeIn: () => fadeTo(1, 500),
    fadeOut: (cb) => fadeTo(0, 500, cb),
    cancelRaf,
    fadingOutRef,
  };
}

/* Full-screen video with 17% downward shift */
function VideoBackground() {
  const videoRef = useRef(null);
  const { fadeIn, fadeOut, cancelRaf, fadingOutRef } = useVideoFade(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = '0';

    const onCanPlay = () => { video.play().catch(() => {}); fadingOutRef.current = false; fadeIn(); };
    const onTimeUpdate = () => {
      if (!video || fadingOutRef.current) return;
      const rem = video.duration - video.currentTime;
      if (rem > 0 && rem <= 0.55) { fadingOutRef.current = true; fadeOut(); }
    };
    const onEnded = () => {
      cancelRaf();
      video.style.opacity = '0';
      fadingOutRef.current = false;
      setTimeout(() => { video.currentTime = 0; video.play().catch(() => {}); fadeIn(); }, 100);
    };

    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    return () => {
      cancelRaf();
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        muted playsInline preload="auto"
        style={{
          position: 'absolute', top: '50%', left: '50%',
          minWidth: '100%', minHeight: '100%', width: 'auto', height: 'auto',
          transform: 'translate(-50%, calc(-50% + 17%))',
          objectFit: 'cover', opacity: 0, willChange: 'opacity',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.5) 100%)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to top, #000 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{ position: 'relative', zIndex: 20, padding: '24px 24px 0' }}>
      {/* Pill container — position:relative so the centered nav can use absolute */}
      <div
        className="liquid-glass"
        style={{
          borderRadius: 9999,
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 900,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* ── LEFT: Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, zIndex: 1 }}>
          <Zap size={20} color="white" strokeWidth={2.5} />
          <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.03em', fontFamily: "'Inter', sans-serif" }}>
            HackForge
          </span>
        </Link>

        {/* ── CENTER: Nav links — absolutely centered in the pill ── */}
        <div
          id="desktop-nav"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {[{ label: 'Hackathons', to: '/hackathons' }, { label: 'Features', to: '#' }, { label: 'Leaderboard', to: '#' }].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              onClick={e => to === '#' && e.preventDefault()}
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em',
                padding: '6px 14px',
                borderRadius: 9999,
                transition: 'color 0.2s, background 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── RIGHT: Auth buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, zIndex: 1 }}>
          <Link
            id="signup-btn"
            to="/register"
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.01em',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
          >
            Sign Up
          </Link>

          <Link
            to="/login"
            className="liquid-glass"
            style={{
              borderRadius: 9999,
              padding: '7px 20px',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.01em',
              transition: 'background 0.2s',
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
          >
            Login
          </Link>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, display: 'none' }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="liquid-glass"
          style={{ maxWidth: 900, margin: '8px auto 0', borderRadius: 20, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {[{ label: 'Hackathons', to: '/hackathons' }, { label: 'Features', to: '#' }, { label: 'Leaderboard', to: '#' }, { label: 'Sign Up', to: '/register' }].map(({ label, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)}
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter',sans-serif" }}
            >{label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}


function HeroContent() {
  return (
    <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', transform: 'translateY(-20%)' }}>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(2.6rem, 7.5vw, 5.5rem)', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.05, whiteSpace: 'nowrap', margin: '0 0 32px 0' }}>
        Built for the bold
      </h1>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link to="/hackathons" className="liquid-glass"
          style={{ borderRadius: 9999, padding: '12px 32px', color: 'white', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', fontFamily: "'Inter',sans-serif", letterSpacing: '-0.01em', transition: 'background 0.2s', display: 'inline-block' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}>
          Browse active hackathons
        </Link>
      </div>
    </div>
  );
}

function SocialFooter() {
  return (
    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', gap: 16, paddingBottom: 48 }}>
      {[{ icon: Camera, label: 'Instagram' }, { icon: X, label: 'Twitter' }, { icon: Globe, label: 'Website' }].map(({ icon: Icon, label }) => (
        <a key={label} href="#" aria-label={label} className="liquid-glass"
          style={{ borderRadius: 9999, padding: 16, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'color 0.2s, background 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}>
          <Icon size={20} />
        </a>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          #desktop-nav { display: none !important; }
          #signup-btn  { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 641px) { #mobile-menu-btn { display: none !important; } }
        input::placeholder { color: rgba(255,255,255,0.38); }
        input:focus { outline: none; box-shadow: none; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <VideoBackground />
        <Navbar />
        <HeroContent />
        <SocialFooter />
      </div>
    </>
  );
}
