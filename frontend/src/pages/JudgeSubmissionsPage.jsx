import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

export default function JudgeSubmissionsPage() {
  const { hackathonId } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, sRes] = await Promise.all([
          api.get(`/hackathons/${hackathonId}`),
          api.get(`/submissions/hackathon/${hackathonId}`)
        ]);
        setHackathon(hRes.data.data);
        setSubmissions(sRes.data.data);
      } catch (e) {
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hackathonId]);

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, paddingLeft: 28, paddingRight: 28 }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 36 }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <FiArrowLeft /> Back to Judge Console
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
            Review Submissions
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title || 'Assigned Hackathon Submissions'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⌛</div>
            <div>Loading submissions...</div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="liquid-glass text-center" style={{ borderRadius: 24, padding: 48 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>No Submissions Yet</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Teams have not submitted any project entries for this hackathon.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {submissions.map(s => (
              <div key={s._id} className="liquid-glass" style={{ borderRadius: 22, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Team: {s.team?.name || '—'}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.reviewed ? 'rgba(52,211,153,0.14)' : 'rgba(251,191,36,0.14)', color: s.reviewed ? '#34d399' : '#fbbf24', border: s.reviewed ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(251,191,36,0.28)' }}>
                      {s.reviewed ? '✓ Reviewed' : 'Pending Review'}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.3rem', margin: '0 0 8px 0', color: '#fff' }}>{s.projectName}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
                    {s.problemStatement}
                  </p>

                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
                    {(s.techStack || []).map(t => (
                      <span key={t} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
                    ))}
                  </div>
                </div>

                <Link
                  to={`/judge/submissions/${s._id}/review`}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none',
                    color: '#060709', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <FiFileText /> {s.reviewed ? 'Edit Review' : 'Start Review'}
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
