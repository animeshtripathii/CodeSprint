import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiTrash, FiPlus, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreateHackathonPage() {
  const { id } = useParams(); // present if editing
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    theme: '',
    mode: 'online',
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    prizePool: '',
    maxTeamSize: 4,
    judgingCriteria: [{ criterion: 'Innovation', maxScore: 10, description: '' }],
    tags: '',
    status: 'draft',
    banner: ''
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/hackathons/${id}`)
        .then(res => {
          const h = res.data.data;
          // Format dates to YYYY-MM-DDThh:mm for datetime-local inputs
          const formatDate = d => d ? new Date(d).toISOString().slice(0, 16) : '';
          setForm({
            ...h,
            startDate: formatDate(h.startDate),
            endDate: formatDate(h.endDate),
            registrationDeadline: formatDate(h.registrationDeadline),
            tags: h.tags?.join(', ') || '',
            judgingCriteria: h.judgingCriteria || [{ criterion: '', maxScore: 10, description: '' }]
          });
        })
        .catch(() => toast.error('Failed to load hackathon data'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Judging Criteria helpers
  const handleAddCriterion = () => {
    setForm(f => ({
      ...f,
      judgingCriteria: [...f.judgingCriteria, { criterion: '', maxScore: 10, description: '' }]
    }));
  };

  const handleRemoveCriterion = index => {
    setForm(f => ({
      ...f,
      judgingCriteria: f.judgingCriteria.filter((_, i) => i !== index)
    }));
  };

  const handleCriterionChange = (index, field, value) => {
    const updated = [...form.judgingCriteria];
    updated[index][field] = value;
    setForm(f => ({ ...f, judgingCriteria: updated }));
  };

  // Mock Upload (in production, uploads to Cloudinary or returns mock URL)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate file upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, banner: reader.result }));
      toast.success('Banner image added!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      maxTeamSize: Number(form.maxTeamSize),
    };

    try {
      if (isEdit) {
        await api.patch(`/hackathons/${id}`, payload);
        toast.success('Hackathon updated successfully!');
      } else {
        await api.post('/hackathons', payload);
        toast.success('Hackathon created successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 40, width: '30%', margin: '0 auto 20px' }} />
          <div className="skeleton" style={{ height: 300, maxWidth: '800px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64, maxWidth: '800px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>
            {isEdit ? 'Edit Hackathon' : 'Create Hackathon'}
          </h1>
          <p className="text-sm text-muted">Set up the structure, timeline, rules, and scoring system.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Basic Info */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Basic Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Hackathon Title</label>
                <input className="input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. AI Innovation Challenge" required />
              </div>

              <div>
                <label className="input-label">Short Description</label>
                <textarea className="input" name="description" value={form.description} onChange={handleChange} rows={5} placeholder="What is this hackathon about? Goals, themes, challenges..." required />
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Theme / Domain</label>
                  <input className="input" name="theme" value={form.theme} onChange={handleChange} placeholder="e.g. HealthTech, AI, Web3" required />
                </div>
                <div>
                  <label className="input-label">Prize Pool</label>
                  <input className="input" name="prizePool" value={form.prizePool} onChange={handleChange} placeholder="e.g. $10,000 / Cash prizes" required />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="input-label">Mode</label>
                  <select className="input" name="mode" value={form.mode} onChange={handleChange}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Max Team Size</label>
                  <input className="input" type="number" min={1} max={10} name="maxTeamSize" value={form.maxTeamSize} onChange={handleChange} required />
                </div>
              </div>

              {form.mode !== 'online' && (
                <div>
                  <label className="input-label">Venue / Physical Location</label>
                  <input className="input" name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Bangalore Tech Center, Main Hall" required />
                </div>
              )}

              <div>
                <label className="input-label">Tags (comma-separated)</label>
                <input className="input" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. machine learning, beginners, web development" />
              </div>
            </div>
          </div>

          {/* Section 2: Banner Image */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Banner Banner</h3>
            <div style={{ border: '2px dashed var(--border-light)', borderRadius: 8, padding: 24, textAlign: 'center', background: '#fff', position: 'relative' }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <FiUploadCloud size={28} style={{ color: 'var(--text-muted-dark)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Click or drag a cover banner image to upload</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted-dark)', marginTop: 4 }}>PNG, JPG or WEBP up to 5MB</div>

              {form.banner && (
                <div style={{ marginTop: 16 }}>
                  <img src={form.banner} alt="Preview" style={{ maxHeight: 150, margin: '0 auto', borderRadius: 6, objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Registration Deadline</label>
                <input className="input" type="datetime-local" name="registrationDeadline" value={form.registrationDeadline} onChange={handleChange} required />
              </div>
              <div className="grid-2">
                <div>
                  <label className="input-label">Start Date & Time</label>
                  <input className="input" type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required />
                </div>
                <div>
                  <label className="input-label">End Date & Time</label>
                  <input className="input" type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Judging Criteria */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Judging Criteria</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={handleAddCriterion}>
                <FiPlus /> Add Criterion
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {form.judgingCriteria.map((c, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 2 }}>
                      <label className="input-label">Criterion Name</label>
                      <input className="input" value={c.criterion} onChange={e => handleCriterionChange(idx, 'criterion', e.target.value)} placeholder="e.g. Design, Code Quality" required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Max Score</label>
                      <input className="input" type="number" min={1} max={100} value={c.maxScore} onChange={e => handleCriterionChange(idx, 'maxScore', Number(e.target.value))} required />
                    </div>
                    {form.judgingCriteria.length > 1 && (
                      <button type="button" className="btn btn-icon btn-danger" style={{ height: 'fit-content', marginTop: 24 }} onClick={() => handleRemoveCriterion(idx)}>
                        <FiTrash size={14} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="input-label">Description (optional)</label>
                    <input className="input" value={c.description} onChange={e => handleCriterionChange(idx, 'description', e.target.value)} placeholder="Brief guideline for the judges" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Status */}
          {isEdit && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Publish Status</h3>
              <div>
                <select className="input" name="status" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming (Announced but registrations closed)</option>
                  <option value="open">Open (Accepting registrations)</option>
                  <option value="ongoing">Ongoing (Hackathon running)</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link to="/dashboard" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Hackathon' : 'Create Hackathon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
