import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiFileText, FiCheckCircle } from 'react-icons/fi';
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

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 250, maxWidth: '1000px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>Review Submissions</h1>
          <p className="text-sm text-muted">{hackathon?.title}</p>
        </div>

        <div className="grid-3" style={{ gap: 20 }}>
          {submissions.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: 'span 3' }}>
              <div className="empty-icon">📦</div>
              <div className="empty-title">No submissions yet</div>
              <div className="empty-subtitle">Teams have not submitted any projects for this hackathon.</div>
            </div>
          ) : (
            submissions.map(s => {
              // check if current judge user has reviewed
              const hasReviewed = false; // logic would tie to judge user review list

              return (
                <div key={s._id} className="card" style={{ display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>Team: {s.team?.name}</strong>
                      {hasReviewed ? (
                        <span className="chip chip-green" style={{ fontSize: '0.65rem' }}>
                          <FiCheckCircle style={{ marginRight: 4 }} /> Reviewed
                        </span>
                      ) : (
                        <span className="chip chip-gold" style={{ fontSize: '0.65rem' }}>
                          Pending Review
                        </span>
                      )}
                    </div>

                    <h3 className="serif" style={{ fontSize: '1.25rem', marginBottom: 8 }}>{s.projectName}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted-dark)', marginBottom: 16, lineClamp: 3, overflow: 'hidden' }}>
                      {s.problemStatement}
                    </p>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
                      {s.techStack?.map(t => (
                        <span key={t} className="chip chip-gray" style={{ fontSize: '0.65rem' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <Link to={`/judge/submissions/${s._id}/review`} className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                    <FiFileText /> {hasReviewed ? 'Edit Review' : 'Start Review'}
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
