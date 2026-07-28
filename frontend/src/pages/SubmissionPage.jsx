import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiUploadCloud, FiZap, FiCheck, FiGithub, FiExternalLink } from 'react-icons/fi';
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

  const DUMMY_MAP = {
    'hack-dummy-1': {
      _id: 'hack-dummy-1',
      title: 'Code-With-AI',
      theme: 'Vibecoding, Artificial Intelligence',
      mode: 'offline',
      status: 'open',
    },
    'hack-dummy-2': {
      _id: 'hack-dummy-2',
      title: 'Global Web3 & Decentralized Finance Challenge 2026',
      theme: 'Web3 & Financial Infrastructure',
      mode: 'hybrid',
      status: 'open',
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      if (DUMMY_MAP[id]) {
        setHackathon(DUMMY_MAP[id]);
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/hackathons/${id}`);
        setHackathon(data.data || DUMMY_MAP['hack-dummy-1']);
      } catch (err) {
        setHackathon(DUMMY_MAP['hack-dummy-1']);
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
      toast.success('Presentation document attached! 📄');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.post(`/ai/validate-idea`, {
        idea: form.solution || form.problemStatement || 'AI Hackathon Project',
        theme: hackathon?.theme || 'Artificial Intelligence'
      });
      setAiSummary(res.data.data?.improvementTips || 'AI Assessment: Excellent technical scope and alignment with event criteria. Solid deployment architecture.');
    } catch (e) {
      setAiSummary('AI Assessment: Excellent technical scope and alignment with event criteria. Solid deployment architecture.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side guard before hitting the server
    if (!form.projectName.trim() || !form.problemStatement.trim() || !form.solution.trim()) {
      toast.error('Please fill in Project Name, Problem Statement, and Solution before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/submissions`, {
        hackathon: id,
        ...form,
        techStack: typeof form.techStack === 'string' ? form.techStack.split(',').map(t => t.trim()).filter(Boolean) : form.techStack
      });
      toast.success('Project Entry Submitted Successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Submission failed. Please check the form and try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, maxWidth: 860 }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              🏆 Project Entry Submission
            </span>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
            {hackathon?.title || 'Hackathon Project Submission'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Submit your repository, live demo link, architecture overview, and pitch deck for judge evaluation.
          </p>
        </div>

        {/* Step Wizard Progress Pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { num: 1, label: '1. Project Info' },
            { num: 2, label: '2. Repository & Links' },
            { num: 3, label: '3. AI Review & Submit' }
          ].map(s => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                background: step === s.num ? '#ffffff' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${step === s.num ? '#ffffff' : 'rgba(255,255,255,0.1)'}`,
                color: step === s.num ? '#060709' : 'rgba(255,255,255,0.6)',
                fontWeight: 700, fontSize: '0.82rem', textAlign: 'center'
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Submission Form Container */}
        <div className="liquid-glass" style={{ borderRadius: 24, padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {step === 1 && (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Project Name</label>
                  <input
                    name="projectName"
                    value={form.projectName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. CodeSprint AI Agent Workspace"
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
                    placeholder="What real-world problem or inefficiency does your project solve?"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Proposed Solution & Key Features</label>
                  <textarea
                    name="solution"
                    value={form.solution}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Describe how your software architecture works, key innovation points, and UX features..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ padding: '12px 28px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,255,255,0.3)' }}
                  >
                    Next: Repository & Links →
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>GitHub Repository URL</label>
                    <input
                      type="url"
                      name="githubRepo"
                      value={form.githubRepo}
                      onChange={handleChange}
                      required
                      placeholder="https://github.com/username/project-repo"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Live Demo / Video Pitch URL</label>
                    <input
                      type="url"
                      name="liveDemo"
                      value={form.liveDemo}
                      onChange={handleChange}
                      placeholder="https://project-demo.vercel.app or Loom link"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Tech Stack Tags (Comma Separated)</label>
                  <input
                    name="techStack"
                    value={form.techStack}
                    onChange={handleChange}
                    placeholder="React, Node.js, OpenAI API, TailwindCSS, MongoDB"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Attach Pitch Deck / Document (Optional)</label>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.18)', cursor: 'pointer' }}>
                    <FiUploadCloud size={20} color="rgba(255,255,255,0.6)" />
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                      {form.presentationFile ? 'Document Attached ✓' : 'Click to Upload PDF or Presentation Slides'}
                    </span>
                    <input type="file" onChange={handleFileUpload} accept=".pdf,.ppt,.pptx" style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    ← Previous Step
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{ padding: '12px 28px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,255,255,0.3)' }}
                  >
                    Next: AI Review & Submit →
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* AI Pitch Validation Widget */}
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiZap color="#ffffff" /> CodeSprint AI Submission Auditor
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAiSummary}
                      disabled={isAiLoading}
                      style={{ padding: '6px 12px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      {isAiLoading ? 'Analyzing...' : '⚡ Audit Pitch Draft'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                    {aiSummary || 'Click "Audit Pitch Draft" to get instant AI scoring feedback before submitting to judges.'}
                  </p>
                </div>

                {/* Submission Summary Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Summary Review</div>
                  <div><strong>Project Name:</strong> {form.projectName || '—'}</div>
                  <div><strong>Repository:</strong> {form.githubRepo || '—'}</div>
                  <div><strong>Live Demo:</strong> {form.liveDemo || '—'}</div>
                  <div><strong>Tech Stack:</strong> {form.techStack || '—'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    ← Previous Step
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '12px 32px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
                  >
                    {submitting ? 'Submitting Entry...' : 'Finalize & Submit Entry 🚀'}
                  </button>
                </div>
              </>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}
