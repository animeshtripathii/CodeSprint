import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiZap, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReviewFormPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sRes = await api.get(`/submissions/${submissionId}`);
        setSubmission(sRes.data.data);

        const hRes = await api.get(`/hackathons/${sRes.data.data.hackathon}`);
        setHackathon(hRes.data.data);

        // Initialize score maps
        const initialScores = {};
        hRes.data.data.judgingCriteria?.forEach(c => {
          initialScores[c.criterion] = 5; // default center score
        });
        setScores(initialScores);
      } catch (err) {
        toast.error('Failed to load review details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleScoreChange = (criterion, value) => {
    setScores(prev => ({ ...prev, [criterion]: Number(value) }));
  };

  const handleGenerateAiFeedback = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.post(`/ai/validate-idea`, {
        idea: comments,
        theme: hackathon.theme
      });
      setAiFeedback(res.data.data.improvementTips);
      // Append or replace judge's comments with AI polished paragraph
      setComments(prev => `${prev}\n\n🤖 AI polished note: ${res.data.data.improvementTips}`);
    } catch (e) {
      toast.error('AI feedback generation failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/reviews`, {
        submission: submissionId,
        scores,
        comments
      });
      toast.success('Review submitted successfully!');
      navigate(`/judge/hackathon/${hackathon._id}/submissions`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 350, maxWidth: '1000px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const maxPossible = hackathon?.judgingCriteria?.reduce((sum, c) => sum + c.maxScore, 0) || 1;

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <Link to={`/judge/hackathon/${hackathon?._id}/submissions`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Submissions
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>Judge Review Form</h1>
          <p className="text-sm text-muted">{submission.projectName} — by {submission.team?.name}</p>
        </div>

        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
          {/* LEFT: Project Details Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <h2 className="text-h3 serif" style={{ marginBottom: 16 }}>Pitch & Concept</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', textTransform: 'uppercase' }}>Problem Statement</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-dark)', marginTop: 4 }}>{submission.problemStatement}</p>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', textTransform: 'uppercase' }}>Our Solution</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-dark)', marginTop: 4 }}>{submission.solution}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-h3 serif" style={{ marginBottom: 16 }}>Resources</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href={submission.githubRepo} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', gap: 4 }}>
                  GitHub Repo <FiExternalLink size={12} />
                </a>
                {submission.liveDemo && (
                  <a href={submission.liveDemo} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', gap: 4 }}>
                    Live Demo <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Scoring Form Panel */}
          <form onSubmit={handleSubmit} className="card">
            <h2 className="text-h3 serif" style={{ marginBottom: 20 }}>Criterion Scoring</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {hackathon?.judgingCriteria?.map((c, i) => (
                <div key={i} style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justify: 'space-between', align: 'center', marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{c.criterion}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>{c.description}</div>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{scores[c.criterion]} / {c.maxScore}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={c.maxScore}
                    value={scores[c.criterion]}
                    onChange={(e) => handleScoreChange(c.criterion, e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8 }}>
                <strong>Total Project Score:</strong>
                <span className="chip chip-purple" style={{ fontSize: '0.95rem' }}>{totalScore} / {maxPossible} pts</span>
              </div>

              <div>
                <label className="input-label">Comments & Feedback</label>
                <textarea
                  className="input"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide feedback on innovation, design, feasibility..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline w-full" onClick={handleGenerateAiFeedback} disabled={isAiLoading}>
                  <FiZap /> AI Polish Notes
                </button>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" style={{ justify: 'center' }} disabled={submitting}>
                {submitting ? 'Submitting Review...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
