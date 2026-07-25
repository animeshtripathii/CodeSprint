import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FiSearch, FiEdit, FiTrash } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data.data);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId, currentBlockedStatus) => {
    try {
      const updatedStatus = !currentBlockedStatus;
      await api.patch(`/admin/users/${userId}/block`, { blocked: updatedStatus });
      toast.success(updatedStatus ? 'User account blocked' : 'User account unblocked');

      // Update locally
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, blocked: updatedStatus } : u));
    } catch (e) {
      toast.error('Block toggle failed');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('User role updated!');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
    } catch (e) {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content page-enter">
        <div style={{ marginBottom: 32 }}>
          <h1 className="text-h2 serif">User Management</h1>
          <p className="text-sm text-muted">Inspect users, assign system roles, and manage access.</p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <input
              className="input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="input" style={{ width: 180 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="participant">Participant</option>
            <option value="organizer">Organizer</option>
            <option value="judge">Judge</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Table list */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading user base database...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No users matched search criteria</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} style={{ borderLeft: u.blocked ? '3px solid var(--accent-red)' : 'none' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{u.name?.[0]?.toUpperCase()}</div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          className="input"
                          style={{ width: 140, padding: '4px 8px', fontSize: '0.8rem' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="participant">Participant</option>
                          <option value="organizer">Organizer</option>
                          <option value="judge">Judge</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`chip chip-${u.blocked ? 'red' : 'green'}`} style={{ fontSize: '0.75rem' }}>
                          {u.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={`btn btn-sm ${u.blocked ? 'btn-green' : 'btn-danger'}`}
                          onClick={() => handleToggleBlock(u._id, u.blocked)}
                        >
                          {u.blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
