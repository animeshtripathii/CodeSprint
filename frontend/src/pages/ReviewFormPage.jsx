import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiZap, FiExternalLink, FiSparkles } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sRes = await api.get(`/submissions/${submissionId}`);
        setSubmission(sRes.data.data);

        const hRes = await api.get(`/hackathons/${sRes.data.data.hackathon}`);
        setHackathon(hRes.data.data);

        const initialScores = {};
        hRes.data.data.judgingCriteria?.forEach(c => {
          initialScores[c.criterion] = 5;
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
        idea: comments || 'Evaluation review notes',
        theme: hackathon.theme
      });
      const tip = res.data.data.improvementTips;
      setComments(prev => (prev ? `${prev}\n\n🤖 AI Feedback: ${tip}` : `🤖 AI Feedback: ${tip}`));
      toast.success('AI review notes generated!');
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
      navigate(`/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const maxPossible = hackathon?.judgingCriteria?.reduce((sum, c) => sum + c.maxScore, 0) || 1;

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, maxWidth: 960 }}>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⌛</div>
            <div>Loading submission for evaluation...</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
                <FiArrowLeft /> Back to Judge Console
              </Link>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
                Evaluate: {submission?.projectName}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                by Team <span style={{ color: '#fff', fontWeight: 600 }}>{submission?.team?.name || '—'}</span> · {hackathon?.title}
              </p>
            </div>

            {/* Split layout: Submission overview vs Judge scoring sheet */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
              
              {/* Left Column — Submission Info & Links */}
              <div className="liquid-glass" style={{ borderRadius: 24, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Problem Statement</div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                    {submission?.problemStatement || 'No details provided.'}
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Tech Stack</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(submission?.techStack || []).map(t => (
                      <span key={t} style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', padding: '3px 9px', borderRadius: 8 }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                  {submission?.githubRepo && (
                    <a href={submission.githubRepo} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <FiExternalLink /> GitHub Repo
                    </a>
                  )}
                  {submission?.liveDemo && (
                    <a href={submission.liveDemo} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <FiExternalLink /> Live Demo
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column — Judge Scoring Sheet */}
              <div className="liquid-glass" style={{ borderRadius: 24, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Score Breakdown</div>
                  <div style={{ padding: '6px 14px', borderRadius: 99, background: '#ffffff', color: '#060709', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(255,255,255,0.3)' }}>
                    Total: {totalScore} / {maxPossible}
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {(hackathon?.judgingCriteria || []).map((c) => (
                    <div key={c.criterion} style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.criterion}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>{scores[c.criterion] || 0} / {c.maxScore}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={c.maxScore}
                        value={scores[c.criterion] || 0}
                        onChange={e => handleScoreChange(c.criterion, e.target.value)}
                        style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
                      />
                    </div>
                  ))}

                  {/* Feedback Notes */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Judge Feedback & Remarks</label>
                      <button
                        type="button"
                        onClick={handleGenerateAiFeedback}
                        disabled={isAiLoading}
                        style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FiSparkles /> {isAiLoading ? 'Polishing...' : 'AI Polish Note'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="Write constructive notes, feedback on execution, design, and innovation..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
                  >
                    {submitting ? 'Submitting Score...' : '⚖️ Finalize & Submit Evaluation'}
                  </button>
                </form>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
