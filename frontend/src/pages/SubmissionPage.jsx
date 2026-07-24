import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiUploadCloud, FiZap, FiCheck } from 'react-icons/fi';
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
    presentationFile: '', // DataURI in mock
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

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 300, maxWidth: '800px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64, maxWidth: '800px' }}>
        <div style={{ marginBottom: 32 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>Submit Project</h1>
          <p className="text-sm text-muted">{hackathon.title}</p>
        </div>

        {/* Form Progress Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, position: 'relative' }}>
          {[
            { num: 1, label: 'Info' },
            { num: 2, label: 'Links' },
            { num: 3, label: 'Slides' },
            { num: 4, label: 'Confirm' },
          ].map(s => (
            <div key={s.num} style={{ textAlign: 'center', zIndex: 1, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 8px',
                background: step >= s.num ? 'var(--accent-purple)' : '#fff',
                color: step >= s.num ? '#fff' : 'var(--text-muted-dark)',
                border: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justify: 'center',
                fontWeight: 600, fontSize: '0.85rem'
              }}>
                {step > s.num ? <FiCheck /> : s.num}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted-dark)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* STEP 1: INFO */}
          {step === 1 && (
            <div className="card page-enter">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Project Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">Project Name</label>
                  <input className="input" name="projectName" value={form.projectName} onChange={handleChange} placeholder="e.g. HealthSphere" required />
                </div>
                <div>
                  <label className="input-label">Problem Statement</label>
                  <textarea className="input" name="problemStatement" value={form.problemStatement} onChange={handleChange} rows={3} placeholder="What problem does your project solve?" required />
                </div>
                <div>
                  <label className="input-label">Our Solution</label>
                  <textarea className="input" name="solution" value={form.solution} onChange={handleChange} rows={5} placeholder="Describe your product architecture, design, and features..." required />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LINKS */}
          {step === 2 && (
            <div className="card page-enter">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Links & Stack</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">GitHub Repository URL</label>
                  <input className="input" name="githubRepo" value={form.githubRepo} onChange={handleChange} placeholder="https://github.com/..." required />
                </div>
                <div>
                  <label className="input-label">Live Demo URL (optional)</label>
                  <input className="input" name="liveDemo" value={form.liveDemo} onChange={handleChange} placeholder="https://..." />
                </div>
                <div>
                  <label className="input-label">Tech Stack (comma-separated)</label>
                  <input className="input" name="techStack" value={form.techStack} onChange={handleChange} placeholder="e.g. React, Node.js, Mongoose" required />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SLIDES */}
          {step === 3 && (
            <div className="card page-enter">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Pitch & Presentation</h3>
              <div style={{ border: '2px dashed var(--border-light)', borderRadius: 8, padding: 32, textAlign: 'center', background: '#fff', position: 'relative' }}>
                <input type="file" accept=".pdf,.ppt,.pptx" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                <FiUploadCloud size={32} style={{ color: 'var(--text-muted-dark)', marginBottom: 8 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload project pitch deck / slides</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', marginTop: 4 }}>PDF, PPTX up to 10MB</div>
                {form.presentationFile && (
                  <div className="chip chip-green" style={{ marginTop: 12 }}>
                    ✓ Document Loaded
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {step === 4 && (
            <div className="card page-enter">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Confirm Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>Project Name</div>
                  <strong style={{ fontSize: '1rem' }}>{form.projectName}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>Solution Pitch</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>{form.solution}</p>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>GitHub</div>
                  <p style={{ fontSize: '0.85rem' }}>{form.githubRepo}</p>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={handleGenerateAiSummary} disabled={isAiLoading}>
                    <FiZap /> AI Validate Pitch Before Submit
                  </button>
                </div>

                {aiSummary && (
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    <strong>✨ AI Improvement Tip:</strong> {aiSummary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 12, justify: 'flex-end', marginLeft: 'auto' }}>
            {step > 1 && (
              <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-green btn-lg" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Pitch'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
