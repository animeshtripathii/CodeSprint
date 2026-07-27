import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DottedGlowBackground } from '../ui/dotted-glow-background';

/* ── Admin Dashboard ── */
export default function AdminDash() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/admin').then(r => setData(r.data.data)).catch(() => {}); }, []);

  return (
    <div style={{ position: 'relative', padding: '32px 28px', background: '#050507', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', marginBottom: 6 }}>Admin Control</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Platform-wide overview and management.</p>
      </div>
    </div>
  );
}
