import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <div className="serif" style={{ fontSize: '6rem', color: 'var(--accent-purple)', lineHeight: 1 }}>404</div>
          <h2 className="serif" style={{ fontSize: '2rem', marginTop: 16, marginBottom: 12 }}>Page Not Found</h2>
          <p className="text-muted" style={{ maxWidth: 360, margin: '0 auto 24px', fontSize: '0.9rem' }}>
            Oops! The hackathon you are looking for might have closed, or this link is broken.
          </p>
          <Link to="/" className="btn btn-primary">Go back home</Link>
        </div>
      </div>
    </div>
  );
}
