import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiUploadCloud, FiZap, FiCheck, FiSparkles } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

export default function SubmissionPage() {
  const { id } = useParams(); // hackathon ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [form, setForm] = useState({
    projectName: '',
    problemStatement: '',
    solution: '',
    githubRepo: '',
    liveDemo: '',
    techStack: '',
    presentationFile: '',
  });

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/hackathons/${id}`);
        setHackathon(data.data);
      } catch (err) {
        toast.error('Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, presentationFile: reader.result }));
      toast.success('Presentation document added!');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.post(`/ai/validate-idea`, {
        idea: form.solution,
        theme: hackathon.theme
      });
      setAiSummary(res.data.data.improvementTips);
    } catch (e) {
      toast.error('Could not generate AI summary');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/submissions`, {
        hackathon: id,
        ...form,
        techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Project submitted successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, maxWidth: 880 }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 32 }}>
          <Link to={`/hackathons/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <FiArrowLeft /> Back to Hackathon
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
            Submit Project Entry
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {hackathon?.title || 'Finalize your hackathon demo, repository URL & presentation'}
          </p>
        </div>

        {/* Form Container */}
        <div className="liquid-glass" style={{ borderRadius: 24, padding: 36 }}>
          
          {/* Step Indicator */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 18 }}>
            {[
              { num: 1, title: 'Project Details' },
              { num: 2, title: 'Code & Demo Links' },
              { num: 3, title: 'AI Assistant & Submit' }
            ].map(s => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none', textAlign: 'left',
                  background: step === s.num ? '#ffffff' : 'rgba(255,255,255,0.04)',
                  color: step === s.num ? '#060709' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step {s.num}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>{s.title}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Project Title</label>
                  <input
                    name="projectName"
                    value={form.projectName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. HackForge AI Assistant"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Problem Statement</label>
                  <textarea
                    name="problemStatement"
                    value={form.problemStatement}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Describe the challenge your team is tackling..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Solution & Architecture</label>
                  <textarea
                    name="solution"
                    value={form.solution}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Explain your approach, technology stack, and core features..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)' }}
                  >
                    Next: Code Links →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>GitHub Repository URL</label>
                  <input
                    name="githubRepo"
                    value={form.githubRepo}
                    onChange={handleChange}
                    required
                    placeholder="https://github.com/org/repo"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Live Demo / Video Pitch URL</label>
                  <input
                    name="liveDemo"
                    value={form.liveDemo}
                    onChange={handleChange}
                    placeholder="https://demo.app or https://youtube.com/watch?v=..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Technologies Used (comma separated)</label>
                  <input
                    name="techStack"
                    value={form.techStack}
                    onChange={handleChange}
                    placeholder="React, Node.js, Tailwind, OpenAI"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)' }}
                  >
                    Next: AI Review & Submit →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* AI Review Card */}
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiSparkles color="#ffffff" /> AI Submission Feedback
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAiSummary}
                      disabled={isAiLoading}
                      style={{ padding: '6px 14px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      {isAiLoading ? 'Analyzing...' : '⚡ Generate AI Feedback'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, margin: 0 }}>
                    {aiSummary || 'Click "Generate AI Feedback" to receive automated improvements on your submission pitch and technical overview.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '12px 32px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
                  >
                    {submitting ? 'Submitting Entry...' : '🚀 Finalize & Submit Entry'}
                  </button>
                </div>
              </div>
            )}
          </form>

        </div>

      </div>
    </div>
  );
}
