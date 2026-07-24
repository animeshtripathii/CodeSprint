import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSignIn } from '@clerk/clerk-react';
import { Eye, EyeOff, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: '0.9rem',
  fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, background 0.2s',
};
const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: "'Inter', sans-serif",
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { signIn, isLoaded: clerkSignInLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await login(form.email, form.password); toast.success('Welcome back!'); navigate(from, { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'Invalid credentials'); }
  };

  const handleSocialLogin = async (provider) => {
    if (!clerkSignInLoaded || !signIn) {
      toast.error('Clerk SSO authentication is initializing...');
      return;
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider === 'google' ? 'oauth_google' : 'oauth_github',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: from,
      });
    } catch (err) {
      toast.error(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.28); }
        input:focus { border-color: rgba(255,255,255,0.28) !important; background: rgba(255,255,255,0.07) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      
      <div style={{ position: 'relative', minHeight: '100vh', background: '#050507', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
        
        {/* Animated Canvas Dotted Glow Background */}
        <DottedGlowBackground gap={18} radius={1.8} opacity={0.75} color="rgba(255,255,255,0.18)" glowColor="rgba(129, 140, 248, 0.85)" speedMin={0.3} speedMax={1.4} />

        {/* Ambient Radial Spotlights */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.15) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(70px)' }} />

        {/* Centered Form Wrapper */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420 }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Zap size={22} color="white" strokeWidth={2.5} />
              <span style={{ color: 'white', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.03em' }}>HackForge</span>
            </Link>
          </div>

          {/* Centered Glass Form Card */}
          <div className="liquid-glass" style={{ borderRadius: 24, padding: '36px 32px' }}>

            {/* Heading */}
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '2.5rem', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 8px 0' }}>
                Welcome back
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: 0 }}>
                Sign in to continue building
              </p>
            </div>

            {/* Clerk Social Login Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
              >
                <GoogleIcon /> Continue with Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
              >
                <GithubIcon /> Continue with GitHub
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>OR WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 12, marginBottom: 24 }}>
                <AlertCircle size={15} color="#fb7185" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#fb7185', fontFamily: "'Inter', sans-serif" }}>{error}</span>
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={set} required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.28)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontFamily: "'Inter', sans-serif", transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set} required
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.28)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ marginTop: 4, padding: '13px', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, color: 'white', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em', transition: 'background 0.2s, transform 0.15s', backdropFilter: 'blur(4px)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}>
                {loading
                  ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Signing in...</>
                  : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: "'Inter', sans-serif" }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>
                Create one for free →
              </Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: 24, fontFamily: "'Inter', sans-serif" }}>
            By continuing you agree to our Terms &amp; Privacy Policy.
          </p>

        </div>

      </div>
    </>
  );
}
