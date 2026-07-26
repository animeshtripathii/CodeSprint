import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiTrash, FiPlus, FiUploadCloud } from 'react-icons/fi';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (isEdit) {
        await api.put(`/hackathons/${id}`, payload);
        toast.success('Hackathon updated successfully!');
      } else {
        await api.post('/hackathons', payload);
        toast.success('Hackathon created successfully! 🎉');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hackathon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <Navbar dark={true} />

      <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: 96, paddingBottom: 64, maxWidth: 900 }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 32 }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1 }}>
            {isEdit ? 'Edit Hackathon Details' : 'Create New Hackathon'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Configure event dates, prize pools, judging criteria, and registration parameters.
          </p>
        </div>

        {/* Form Container */}
        <div className="liquid-glass" style={{ borderRadius: 24, padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Title & Theme */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Hackathon Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. AI & Web3 Innovation Challenge 2026"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Main Theme / Category</label>
                <input
                  name="theme"
                  value={form.theme}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Artificial Intelligence, Web3, HealthTech"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Event Overview & Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Explain the hackathon rules, schedule, tracks, and submission guidelines..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Mode & Venue & Prize */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Mode</label>
                <select
                  name="mode"
                  value={form.mode}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(9,10,15,0.95)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="online">Online</option>
                  <option value="offline">In-Person (Offline)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Prize Pool Amount</label>
                <input
                  name="prizePool"
                  value={form.prizePool}
                  onChange={handleChange}
                  placeholder="e.g. $25,000"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Max Team Size</label>
                <input
                  type="number"
                  name="maxTeamSize"
                  value={form.maxTeamSize}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Start Date</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>End Date</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Judging Criteria */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Judging Criteria Parameters</label>
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  style={{ padding: '6px 12px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <FiPlus /> Add Criterion
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.judgingCriteria.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      placeholder="Criterion Name (e.g. Innovation)"
                      value={c.criterion}
                      onChange={e => handleCriterionChange(idx, 'criterion', e.target.value)}
                      style={{ flex: 2, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <input
                      type="number"
                      placeholder="Max Score"
                      value={c.maxScore}
                      onChange={e => handleCriterionChange(idx, 'maxScore', e.target.value)}
                      style={{ width: 100, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer' }}
                    >
                      <FiTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '12px 32px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
              >
                {submitting ? 'Saving...' : isEdit ? 'Update Hackathon' : 'Publish Hackathon 🚀'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
