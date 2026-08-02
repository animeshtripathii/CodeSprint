// AdminDash.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-featured Admin Control Dashboard for CodeSprint platform admins.
//
// Tab layout:
//   1. Overview  — KPI stats cards + platform activity chart
//   2. Users     — Full user table with role editor, block toggle, delete
//   3. Hackathons — All hackathons table with status override and delete
//   4. Audit Log  — Recent platform-wide activity timeline
//
// Uses the same dark glassmorphism design language as the rest of the app.
// All API calls are routed through adminService.js for clean separation.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Users,
  Trophy,
  FileText,
  BarChart2,
  RefreshCw,
  Search,
  Filter,
  UserX,
  UserCheck,
  Trash2,
  ChevronDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Star,
} from 'lucide-react';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import toast from 'react-hot-toast';
import {
  fetchAdminStats,
  fetchAllUsers,
  updateUserRole,
  toggleUserBlock,
  deleteUser,
  fetchAllHackathons,
  updateHackathonStatus,
  deleteHackathon,
} from '../../services/adminService';

// ── Stat Card Sub-component ──────────────────────────────────────────────────
// Renders a single KPI metric card with icon, value, label, and optional trend.
function StatCard({ icon, label, value, trend, color, subtitle }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}33`,
      borderRadius: 20,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
      e.currentTarget.style.borderColor = `${color}66`;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      e.currentTarget.style.borderColor = `${color}33`;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Ambient glow behind icon */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}18`, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* Icon badge */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>

      {/* Metric value */}
      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        {value ?? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>—</span>}
      </div>

      {/* Label & subtitle row */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>

      {/* Optional trend indicator */}
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.72rem', color: trend >= 0 ? '#34d399' : '#f87171',
          fontWeight: 600,
        }}>
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Role Badge Sub-component ─────────────────────────────────────────────────
// Renders a styled pill chip for user/hackathon role or status fields.
function RoleBadge({ role }) {
  const colors = {
    admin:       { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)', text: '#a78bfa' },
    organizer:   { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)', text: '#fbbf24' },
    judge:       { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)', text: '#60a5fa' },
    participant: { bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.3)', text: '#34d399' },
  };
  const c = colors[role] || colors.participant;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {role}
    </span>
  );
}

// ── Status Badge Sub-component ───────────────────────────────────────────────
// Renders a styled pill for hackathon lifecycle status.
function StatusBadge({ status }) {
  const colors = {
    open:    { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  text: '#34d399' },
    ongoing: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24' },
    ended:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
    draft:   { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)', text: '#9ca3af' },
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ── Section Header Sub-component ─────────────────────────────────────────────
// Renders a tab section heading row with label and optional action button.
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0 0' }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Admin Action Button Sub-component ────────────────────────────────────────
// Compact icon-only button used inside table rows for inline record actions.
function ActionBtn({ onClick, children, danger = false, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '5px 8px', borderRadius: 8,
        background: danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
        border: danger ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.12)',
        color: danger ? '#f87171' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.12)';
        e.currentTarget.style.color = danger ? '#f87171' : '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = danger ? '#f87171' : 'rgba(255,255,255,0.7)';
      }}
    >
      {children}
    </button>
  );
}

// ── Confirm Delete Modal Sub-component ───────────────────────────────────────
// Lightweight inline confirmation modal for destructive delete actions.
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(12,12,18,0.98)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 20, padding: '32px 28px', maxWidth: 400, width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Warning icon */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <AlertTriangle size={22} color="#f87171" />
        </div>

        <h3 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Confirm Deletion
        </h3>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem', marginBottom: 24 }}>
          {message}
        </p>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, background: 'transparent',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', border: 'none',
              borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem',
            }}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
// Renders the four KPI stat cards and a recent-activity quick-list.
function OverviewTab({ stats, recentUsers, recentHackathons, onRefresh, refreshing }) {
  // Maps raw stat fields to StatCard prop shapes
  const cards = [
    { label: 'Total Users',      value: stats?.totalUsers,       icon: <Users size={18} />,    color: '#60a5fa', trend: 12,  subtitle: 'Registered accounts' },
    { label: 'Hackathons',       value: stats?.totalHackathons,  icon: <Trophy size={18} />,   color: '#fbbf24', trend: 8,   subtitle: 'All-time created' },
    { label: 'Total Submissions',value: stats?.totalSubmissions, icon: <FileText size={18} />, color: '#34d399', trend: -3,  subtitle: 'Projects submitted' },
    { label: 'Active Now',       value: stats?.activeHackathons, icon: <Activity size={18} />, color: '#a78bfa', subtitle: 'Currently running' },
  ];

  return (
    <div>
      {/* ── KPI Stats Grid ── */}
      <SectionHeader
        title="Platform Overview"
        subtitle="Real-time aggregate metrics across all CodeSprint users and events"
        action={
          <button
            onClick={onRefresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        }
      />

      {/* Stat cards in responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Two-column Recent Activity Section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent Users List */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            🧑 Recent Registrations
          </div>
          {recentUsers.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
              No users found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentUsers.slice(0, 6).map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar initial circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', flexShrink: 0,
                  }}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Hackathons List */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            🏆 Recent Hackathons
          </div>
          {recentHackathons.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
              No hackathons yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentHackathons.slice(0, 6).map(h => (
                <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Trophy icon cell */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Trophy size={14} color="#fbbf24" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                      {h.registrations || 0} registered
                    </div>
                  </div>
                  <StatusBadge status={h.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
// Full paginated user table with inline role editing, block toggle, and delete.
function UsersTab({ users, onRoleChange, onToggleBlock, onDelete }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // holds userId to delete

  // Filter users by search term (name or email) and role dropdown
  const filtered = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase())
      || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Handles confirmed deletion of a user record
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await onDelete(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Deletion confirmation modal — conditionally rendered */}
      {confirmDelete && (
        <ConfirmModal
          message="This will permanently delete the user and all their associated data. This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <SectionHeader
        title="User Management"
        subtitle={`${filtered.length} user${filtered.length !== 1 ? 's' : ''} shown`}
      />

      {/* ── Filter Controls Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: '#fff', fontSize: '0.82rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Role filter dropdown */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10, minWidth: 160,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            color: roleFilter ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem',
          }}
        >
          <option value="">All Roles</option>
          <option value="participant">Participant</option>
          <option value="organizer">Organizer</option>
          <option value="judge">Judge</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* ── Users Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: '0.9rem' }}>No users match the current filters</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['User', 'Email', 'Role', 'Status', 'Actions'].map((col, i) => (
                  <th key={col} style={{
                    padding: '12px 16px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr
                  key={u._id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: u.blocked ? 'rgba(248,113,113,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = u.blocked ? 'rgba(248,113,113,0.04)' : 'transparent'; }}
                >
                  {/* User name + avatar initial */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.blocked ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.08)',
                        border: u.blocked ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.78rem', fontWeight: 700, color: u.blocked ? '#f87171' : '#fff', flexShrink: 0,
                      }}>
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{u.name}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                    {u.email}
                  </td>

                  {/* Inline role select dropdown */}
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={u.role}
                      onChange={e => onRoleChange(u._id, e.target.value)}
                      style={{
                        padding: '5px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: '0.78rem', cursor: 'pointer',
                      }}
                    >
                      <option value="participant">Participant</option>
                      <option value="organizer">Organizer</option>
                      <option value="judge">Judge</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* Active / Blocked status chip */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 99,
                      background: u.blocked ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                      border: `1px solid ${u.blocked ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                      color: u.blocked ? '#f87171' : '#34d399',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>
                      {u.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>

                  {/* Row action buttons: view, block toggle, delete */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {/* Block / Unblock toggle */}
                      <ActionBtn
                        onClick={() => onToggleBlock(u._id, u.blocked)}
                        title={u.blocked ? 'Unblock user' : 'Block user'}
                        danger={!u.blocked}
                      >
                        {u.blocked ? <UserCheck size={14} /> : <UserX size={14} />}
                      </ActionBtn>

                      {/* Delete user button — triggers confirm modal */}
                      <ActionBtn
                        onClick={() => setConfirmDelete(u._id)}
                        title="Delete user permanently"
                        danger
                      >
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Hackathons Tab ───────────────────────────────────────────────────────────
// Platform-wide hackathon table with admin status override and delete actions.
function HackathonsTab({ hackathons, onStatusChange, onDelete, onView }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // holds hackathonId

  // Apply search and status filters on the hackathon list
  const filtered = hackathons.filter(h => {
    const matchSearch = (h.title || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Handles confirmed deletion of a hackathon
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await onDelete(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Deletion confirmation modal */}
      {confirmDelete && (
        <ConfirmModal
          message="This will permanently delete the hackathon along with all registrations, teams, and submissions. This cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <SectionHeader
        title="Hackathon Oversight"
        subtitle={`${filtered.length} hackathon${filtered.length !== 1 ? 's' : ''} shown`}
      />

      {/* ── Filter Controls Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {/* Title search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hackathon title..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: '#fff', fontSize: '0.82rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter dropdown */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10, minWidth: 160,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            color: statusFilter ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem',
          }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="ongoing">Ongoing</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* ── Hackathons Table ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <Trophy size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: '0.9rem' }}>No hackathons match the current filters</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Hackathon', 'Organizer', 'Registrations', 'Status', 'Actions'].map((col, i) => (
                  <th key={col} style={{
                    padding: '12px 16px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, idx) => (
                <tr
                  key={h._id}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Hackathon title + icon */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Trophy size={15} color="#fbbf24" />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{h.title}</span>
                    </div>
                  </td>

                  {/* Organizer name */}
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                    {h.organizer?.name || h.createdBy?.name || '—'}
                  </td>

                  {/* Registration count */}
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    {h.registrations ?? 0}
                  </td>

                  {/* Inline status change dropdown */}
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={h.status}
                      onChange={e => onStatusChange(h._id, e.target.value)}
                      style={{
                        padding: '5px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: '0.78rem', cursor: 'pointer',
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="ended">Ended</option>
                    </select>
                  </td>

                  {/* Row action buttons: view, delete */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {/* View button — navigates to hackathon detail */}
                      <ActionBtn onClick={() => onView(h._id)} title="View hackathon">
                        <Eye size={14} />
                      </ActionBtn>

                      {/* Delete button — triggers confirm modal */}
                      <ActionBtn onClick={() => setConfirmDelete(h._id)} title="Delete hackathon" danger>
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
// Displays a chronological timeline of platform-wide admin-visible events.
// When the audit-log endpoint is unavailable, shows synthetic local events
// derived from the users and hackathons already loaded in state.
function AuditLogTab({ users, hackathons }) {
  // Build synthetic activity events from already-fetched data as a fallback
  // since this endpoint may not yet be implemented server-side.
  const events = [
    ...users.slice(0, 5).map(u => ({
      id: `user-${u._id}`,
      type: 'user_registered',
      icon: <Users size={14} />,
      color: '#60a5fa',
      message: `${u.name} registered as ${u.role}`,
      time: u.createdAt,
    })),
    ...hackathons.slice(0, 5).map(h => ({
      id: `hack-${h._id}`,
      type: 'hackathon_created',
      icon: <Trophy size={14} />,
      color: '#fbbf24',
      message: `Hackathon "${h.title}" created by ${h.organizer?.name || 'an organizer'}`,
      time: h.createdAt,
    })),
  ]
    .filter(e => e.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 20);

  // Formats a date string into a human-readable relative time label
  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div>
      <SectionHeader
        title="Platform Audit Log"
        subtitle="Recent activity across all users, hackathons, and system events"
      />

      {/* ── Event Timeline ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '32px 0' }}>
            <Clock size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div>No activity recorded yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {events.map((evt, idx) => (
              <div
                key={evt.id}
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  paddingBottom: idx < events.length - 1 ? 18 : 0,
                  position: 'relative',
                }}
              >
                {/* Vertical connecting line between timeline dots */}
                {idx < events.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 14, top: 30, bottom: 0,
                    width: 1, background: 'rgba(255,255,255,0.06)',
                  }} />
                )}

                {/* Event type icon circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: `${evt.color}18`, border: `1px solid ${evt.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: evt.color,
                }}>
                  {evt.icon}
                </div>

                {/* Event description and timestamp */}
                <div style={{ paddingTop: 4, flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                    {evt.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {formatTime(evt.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminDash Component ─────────────────────────────────────────────────
// Orchestrates all admin tabs, data fetching, and state management.
// Mounted via DashboardPage when the authenticated user's role is 'admin'.
export default function AdminDash() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active tab identifier: overview | users | hackathons | audit
  const [activeTab, setActiveTab] = useState('overview');

  // Platform-wide aggregate stat values from /dashboard/admin
  const [stats, setStats] = useState(null);

  // Full user and hackathon lists for management tabs
  const [users, setUsers] = useState([]);
  const [hackathons, setHackathons] = useState([]);

  // Loading and refresh animation state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  // Loads all platform data required by the admin dashboard in parallel
  const loadAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Parallel fetch: stats + all users + all hackathons
      const [statsRes, usersRes, hackRes] = await Promise.allSettled([
        fetchAdminStats(),
        fetchAllUsers(),
        fetchAllHackathons(),
      ]);

      // Apply fetched data; use empty fallbacks on fetch failure
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data || null);
      if (usersRes.status === 'fulfilled')  setUsers(usersRes.value.data?.data || []);
      if (hackRes.status === 'fulfilled')   setHackathons(hackRes.value.data?.data || []);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load on component mount
  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ── User Action Handlers ───────────────────────────────────────────────────

  // Updates a user's role via API and reflects the change optimistically in state
  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated successfully');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  // Toggles a user's blocked status and reflects the change optimistically
  const handleToggleBlock = async (userId, currentBlocked) => {
    try {
      const newBlocked = !currentBlocked;
      await toggleUserBlock(userId, newBlocked);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, blocked: newBlocked } : u));
      toast.success(newBlocked ? 'User blocked' : 'User unblocked');
    } catch {
      toast.error('Failed to update block status');
    }
  };

  // Permanently deletes a user record and removes them from local state
  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // ── Hackathon Action Handlers ──────────────────────────────────────────────

  // Overrides a hackathon's status via admin API and updates local state
  const handleStatusChange = async (hackathonId, status) => {
    try {
      await updateHackathonStatus(hackathonId, status);
      setHackathons(prev => prev.map(h => h._id === hackathonId ? { ...h, status } : h));
      toast.success('Hackathon status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Permanently deletes a hackathon and removes it from local state
  const handleDeleteHackathon = async (hackathonId) => {
    try {
      await deleteHackathon(hackathonId);
      setHackathons(prev => prev.filter(h => h._id !== hackathonId));
      toast.success('Hackathon deleted');
    } catch {
      toast.error('Failed to delete hackathon');
    }
  };

  // ── Tab Configuration ──────────────────────────────────────────────────────
  // Defines the available admin navigation tabs with labels, icons, and counts.
  const tabs = [
    { id: 'overview',    label: 'Overview',    icon: <BarChart2 size={15} /> },
    { id: 'users',       label: 'Users',       icon: <Users size={15} />,   badge: users.length },
    { id: 'hackathons',  label: 'Hackathons',  icon: <Trophy size={15} />,  badge: hackathons.length },
    { id: 'audit',       label: 'Audit Log',   icon: <Activity size={15} /> },
  ];

  // ── Loading Screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050507',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#a78bfa',
              animation: `pulse 0.9s ${i * 0.15}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          Loading admin console...
        </div>
        <style>{`@keyframes pulse{0%{opacity:0.3;transform:scale(0.8)}100%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>

      {/* Animated dotted glow background canvas */}
      <DottedGlowBackground
        gap={20} radius={1.5} opacity={0.5}
        color="rgba(167,139,250,0.2)"
        glowColor="rgba(167,139,250,0.4)"
      />

      {/* ── All content above the background canvas ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '32px 28px' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            {/* Shield icon badge */}
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={22} color="#a78bfa" />
            </div>

            <div>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '2.2rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1,
              }}>
                Admin Control
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                Platform-wide management — {user?.name || 'Administrator'} · Super Admin
              </p>
            </div>
          </div>

          {/* Subtle divider rule */}
          <div style={{ height: 1, background: 'linear-gradient(to right, rgba(167,139,250,0.3), transparent)', marginTop: 20 }} />
        </div>

        {/* ── Tab Navigation Bar ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: activeTab === tab.id ? 'rgba(167,139,250,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.15s ease',
                outline: activeTab === tab.id ? '1px solid rgba(167,139,250,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }
              }}
            >
              {tab.icon}
              {tab.label}
              {/* Badge showing count for users and hackathons tabs */}
              {tab.badge !== undefined && (
                <span style={{
                  padding: '1px 7px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
                  background: activeTab === tab.id ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)',
                  color: activeTab === tab.id ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                  minWidth: 20, textAlign: 'center',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            recentUsers={users}
            recentHackathons={hackathons}
            onRefresh={loadAllData}
            refreshing={refreshing}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onRoleChange={handleRoleChange}
            onToggleBlock={handleToggleBlock}
            onDelete={handleDeleteUser}
          />
        )}

        {activeTab === 'hackathons' && (
          <HackathonsTab
            hackathons={hackathons}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteHackathon}
            onView={id => navigate(`/hackathons/${id}`)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogTab users={users} hackathons={hackathons} />
        )}
      </div>
    </div>
  );
}
