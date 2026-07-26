import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import { User, Mail, Shield, Award, CheckCircle2, Github, Globe, Sparkles, Building, Code2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [updating, setUpdating] = useState(false);

  const role = user?.role || 'participant';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.patch('/users/profile', {
        name,
        bio,
        organization,
        skills: skillsArray,
        githubUsername
      });
      await refreshUser();
      toast.success('Profile updated successfully! 🎉');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const roleMeta = {
    organizer: { badge: 'Organizer 🏗️', bg: 'rgba(255,255,255,0.12)', color: '#ffffff', desc: 'Hackathon Host & Event Director' },
    judge: { badge: 'Judge ⚖️', bg: 'rgba(251,191,36,0.14)', color: '#fbbf24', desc: 'Expert Evaluator & Submission Judge' },
    participant: { badge: 'Developer ⚡', bg: 'rgba(56,189,248,0.14)', color: '#38bdf8', desc: 'Hackathon Participant & Builder' },
    admin: { badge: 'Platform Admin 🛡️', bg: 'rgba(168,85,247,0.14)', color: '#c084fc', desc: 'Platform Administrator' }
  }[role] || { badge: 'Member', bg: 'rgba(255,255,255,0.1)', color: '#fff', desc: 'Platform Member' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050507', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative', padding: '32px 36px' }}>
        
        {/* Canvas Dotted Background */}
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1080, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }}>
              Account Settings
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', margin: '0 0 6px 0', lineHeight: 1.05 }}>
              User Profile Console
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Manage your personal information, role details, organization, and evaluation skills.
            </p>
          </div>

          {/* Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
            
            {/* Left Card — Avatar & Role Overview */}
            <div className="liquid-glass" style={{ borderRadius: 24, padding: 32, textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, color: '#060709',
                margin: '0 auto 16px', boxShadow: '0 0 32px rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.4)'
              }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>

              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', margin: '0 0 4px 0', color: '#fff' }}>
                {user?.name || 'User Name'}
              </h2>

              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
                {user?.email}
              </div>

              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 99, background: roleMeta.bg, color: roleMeta.color, fontSize: '0.75rem', fontWeight: 700, marginBottom: 16 }}>
                {roleMeta.badge}
              </div>

              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 20 }}>
                {user?.bio || roleMeta.desc}
              </p>

              {/* Dynamic Role Metrics */}
              <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
                {role === 'organizer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>1+</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Hackathons</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>Active</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Organizer</div>
                    </div>
                  </div>
                )}
                {role === 'judge' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>⚖️ Verified</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Judge Role</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>Live</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Evaluator</div>
                    </div>
                  </div>
                )}
                {role === 'participant' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>⚡ Active</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Builder</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>GitHub</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{user?.githubUsername ? 'Connected' : 'Ready'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Tags */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                {(user?.skills || []).map(s => (
                  <span key={s} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 8 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Right Card — Edit Profile Form */}
            <div className="liquid-glass" style={{ borderRadius: 24, padding: 32 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Edit Profile Details
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Name & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Full Name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Email Address (Account ID)</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'not-allowed', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Bio / Headline */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Headline / Professional Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={role === 'judge' ? 'e.g. Lead AI Researcher @ Open Lab. Focused on computer vision and multi-agent systems.' : role === 'organizer' ? 'e.g. Director of Developer Relations @ TechForge.' : 'e.g. Full-stack React & AI developer.'}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Organization & GitHub */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Organization / University</label>
                    <input
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      placeholder="e.g. Stanford / Google AI"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>GitHub Username</label>
                    <input
                      value={githubUsername}
                      onChange={e => setGithubUsername(e.target.value)}
                      placeholder="e.g. octocat"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Skills & Expertise */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>Skills & Evaluation Focus (comma-separated)</label>
                  <input
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. AI, Systems Architecture, React, Smart Contracts, UX Design"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="submit"
                    disabled={updating}
                    style={{ padding: '12px 32px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(255,255,255,0.35)' }}
                  >
                    {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
