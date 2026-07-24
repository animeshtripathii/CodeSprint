import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiArrowLeft, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ManageRegistrationsPage() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, rRes] = await Promise.all([
          api.get(`/hackathons/${id}`),
          api.get(`/registrations/hackathon/${id}`)
        ]);
        setHackathon(hRes.data.data);
        setRegistrations(rRes.data.data);
      } catch (err) {
        toast.error('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdateStatus = async (regId, status) => {
    try {
      await api.patch(`/registrations/${regId}/status`, { status });
      toast.success(`Registration ${status}!`);

      // Update local state
      setRegistrations(prev =>
        prev.map(r => r._id === regId ? { ...r, status, approvedAt: status === 'approved' ? new Date() : null } : r)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const filteredRegs = registrations.filter(r => filter === 'all' || r.status === filter);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ paddingTop: 100, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 40, width: '40%', margin: '0 auto 20px' }} />
          <div className="skeleton" style={{ height: 250, maxWidth: '1000px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 96, paddingBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-muted-dark)' }}>
            <FiArrowLeft /> Back to Organizer Hub
          </Link>
          <h1 className="text-h2 serif" style={{ marginTop: 12 }}>Manage Registrations</h1>
          <p className="text-sm text-muted">{hackathon?.title}</p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {f} ({registrations.filter(r => f === 'all' || r.status === f).length})
            </button>
          ))}
        </div>

        {/* Table List */}
        <div className="card" style={{ padding: 0 }}>
          {filteredRegs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No registrations found</div>
              <div className="empty-subtitle">There are no {filter} registrations matching this filter.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Email</th>
                    <th>Date Registered</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{r.participant?.name?.[0]?.toUpperCase()}</div>
                          <span style={{ fontWeight: 500 }}>{r.participant?.name}</span>
                        </div>
                      </td>
                      <td>{r.participant?.email}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span className={`chip status-${r.status}`} style={{ fontSize: '0.75rem' }}>
                          {r.status === 'pending' && <FiClock style={{ marginRight: 4 }} />}
                          {r.status === 'approved' && <FiCheck style={{ marginRight: 4 }} />}
                          {r.status === 'rejected' && <FiX style={{ marginRight: 4 }} />}
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-sm btn-green"
                              onClick={() => handleUpdateStatus(r._id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleUpdateStatus(r._id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {r.status !== 'pending' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>
                            Decision locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
