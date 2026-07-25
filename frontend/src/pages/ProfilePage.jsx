import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.patch('/users/profile', { name, skills: skillsArray });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content page-enter">
        <div style={{ marginBottom: 32 }}>
          <h1 className="text-h2 serif">Your Profile</h1>
          <p className="text-sm text-muted">Update your details, tags, and workspace skills.</p>
        </div>

        <div className="grid-2">
          {/* Card left: details info */}
          <form onSubmit={handleSubmit} className="card">
            <h2 className="text-h3 serif" style={{ marginBottom: 20 }}>Personal Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div>
                <label className="input-label">Email (Immutable)</label>
                <input className="input" value={user?.email} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>

              <div>
                <label className="input-label">Role</label>
                <span className="chip chip-purple" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
              </div>

              <div>
                <label className="input-label">Skills (comma-separated)</label>
                <input className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node.js, Python, Figma" />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 8 }} disabled={updating}>
                {updating ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>

          {/* Card right: quick avatar summary */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', align: 'center', justify: 'center', padding: '48px 24px' }}>
            <div className="avatar avatar-xl" style={{ margin: '0 auto 20px', width: 90, height: 90, fontSize: '2rem' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="serif" style={{ fontSize: '1.5rem', marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted-dark)', marginBottom: 16 }}>{user?.email}</div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {user?.skills?.map(s => (
                <span key={s} className="chip chip-gray" style={{ fontSize: '0.75rem' }}>{s}</span>
              )) || <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>No skills added yet.</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
