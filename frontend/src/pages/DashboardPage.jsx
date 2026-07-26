import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ParticipantDash from '../components/dashboards/ParticipantDash';
import OrganizerDash from '../components/dashboards/OrganizerDash';
import JudgeDash from '../components/dashboards/JudgeDash';
import AdminDash from '../components/dashboards/AdminDash';

/* ── Main Router for Dashboards ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const isJudge = user?.role === 'judge';

  const Dash = {
    participant: ParticipantDash,
    organizer: OrganizerDash,
    judge: JudgeDash,
    admin: AdminDash,
  }[user?.role] || ParticipantDash;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050507' }}>
      {!isJudge && <Sidebar />}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Dash />
      </main>
    </div>
  );
}
