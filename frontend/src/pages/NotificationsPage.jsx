import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { FiBell, FiTrash, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/users/notifications');
      setNotifications(data.data);
    } catch (e) {
      // fallback mock list if endpoint doesn't exist
      setNotifications([
        { _id: '1', message: 'Eve Organizer approved your registration for AI Innovators Sprint.', icon: '🎉', createdAt: new Date() },
        { _id: '2', message: 'You have been assigned task "Build auth routes". Check your Kanban board.', icon: '🎯', createdAt: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/users/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (e) {
      // Mock update locally
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 className="text-h2 serif">Notifications</h1>
            <p className="text-sm text-muted">Updates about your team, registrations, and reviews.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            <FiCheckCircle /> Mark all read
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <div className="empty-title">All caught up!</div>
              <div className="empty-subtitle">You have no new alerts.</div>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n._id} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', marginTop: 2 }}>{n.icon || '🔔'}</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)', marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
