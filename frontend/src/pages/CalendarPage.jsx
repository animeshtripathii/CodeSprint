import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Calendar, Trophy, Clock, Users,
  FileText, Star, Zap, AlertCircle, CheckCircle2, Eye, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function startOfMonth(year, month) { return new Date(year, month, 1); }
function daysInMonth(year, month)  { return new Date(year, month + 1, 0).getDate(); }
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
function isoDate(d) { return d.toISOString().slice(0, 10); }

/* ─── event colour / type mapping per role ─────────────────────────────────── */
const EVENT_META = {
  registration_deadline: { label: 'Reg. Deadline', color: '#ff6b6b', icon: AlertCircle },
  hackathon_start:       { label: 'Starts',         color: '#1b68ff', icon: Zap         },
  hackathon_end:         { label: 'Ends',            color: '#a855f7', icon: CheckCircle2},
  submission_due:        { label: 'Submit',          color: '#f59e0b', icon: FileText    },
  judging:               { label: 'Judging',         color: '#06b6d4', icon: Star        },
  ongoing:               { label: 'Ongoing',         color: '#22c55e', icon: Trophy      },
};

/* Build calendar events from hackathon list depending on the viewer's role */
function buildEvents(hackathons, role, userId) {
  const events = [];

  hackathons.forEach(h => {
    const regDeadline = h.registrationDeadline ? new Date(h.registrationDeadline) : null;
    const start       = h.startDate            ? new Date(h.startDate)            : null;
    const end         = h.endDate              ? new Date(h.endDate)              : null;

    // ── Always show start & end ───────────────────────────────────────────────
    if (start) events.push({ date: start, type: 'hackathon_start', hackathon: h });
    if (end)   events.push({ date: end,   type: 'hackathon_end',   hackathon: h });

    // ── Role-specific extras ──────────────────────────────────────────────────
    if (role === 'participant') {
      if (regDeadline) events.push({ date: regDeadline, type: 'registration_deadline', hackathon: h });
      if (start && end) {
        // mark all days in range as "ongoing" (just show badge on first day)
        const now = new Date();
        if (now >= start && now <= end) {
          events.push({ date: now, type: 'ongoing', hackathon: h });
        }
      }
    }

    if (role === 'organizer') {
      if (regDeadline) events.push({ date: regDeadline, type: 'registration_deadline', hackathon: h });
      // submission due = end date for organizer
      if (end) events.push({ date: end, type: 'submission_due', hackathon: h });
    }

    if (role === 'judge') {
      // Judging starts when hackathon ends
      if (end) events.push({ date: end, type: 'judging', hackathon: h });
    }

    if (role === 'admin') {
      if (regDeadline) events.push({ date: regDeadline, type: 'registration_deadline', hackathon: h });
      if (end) events.push({ date: end, type: 'submission_due', hackathon: h });
    }
  });

  return events;
}

/* ─── tiny pill badge ───────────────────────────────────────────────────────── */
function EventPill({ event, onClick }) {
  const meta = EVENT_META[event.type] || { label: event.type, color: '#999', icon: Calendar };
  const Icon = meta.icon;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className="event-pill"
      style={{ '--pill-color': meta.color }}
      title={`${meta.label}: ${event.hackathon.title}`}
    >
      <Icon size={9} style={{ flexShrink: 0 }} />
      <span className="event-pill-text">{event.hackathon.title}</span>
    </button>
  );
}

/* ─── detail side panel ─────────────────────────────────────────────────────── */
function DetailPanel({ events, date, onClose, navigate, role }) {
  if (!events.length) return null;
  return (
    <div className="detail-panel" onClick={e => e.stopPropagation()}>
      <div className="detail-panel-header">
        <div>
          <div className="detail-date-label">{DAYS[date.getDay()]}</div>
          <div className="detail-date-number">{date.getDate()}</div>
          <div className="detail-month-label">{MONTHS[date.getMonth()]} {date.getFullYear()}</div>
        </div>
        <button className="detail-close" onClick={onClose}>✕</button>
      </div>
      <div className="detail-events">
        {events.map((ev, i) => {
          const meta = EVENT_META[ev.type] || { label: ev.type, color: '#999', icon: Calendar };
          const Icon = meta.icon;
          const h = ev.hackathon;
          return (
            <div key={i} className="detail-event-card" style={{ '--ev-color': meta.color }}>
              <div className="detail-ev-type">
                <Icon size={13} style={{ color: meta.color }} />
                <span style={{ color: meta.color }}>{meta.label}</span>
              </div>
              <div className="detail-ev-title">{h.title}</div>
              {h.theme && <div className="detail-ev-meta">Theme: {h.theme}</div>}
              {h.mode  && <div className="detail-ev-meta">Mode: {h.mode}</div>}
              {h.venue && <div className="detail-ev-meta">Venue: {h.venue}</div>}
              {h.prizePool && <div className="detail-ev-meta">Prize: {h.prizePool}</div>}
              {h.status && (
                <span className="detail-ev-status" data-status={h.status}>{h.status}</span>
              )}
              <div className="detail-ev-dates">
                <span>Start: {h.startDate ? new Date(h.startDate).toLocaleDateString() : '—'}</span>
                <span>End: {h.endDate ? new Date(h.endDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="detail-ev-actions">
                <button
                  className="det-btn det-btn-view"
                  onClick={() => navigate(`/hackathons/${h._id}`)}
                >
                  <Eye size={12} /> View
                </button>
                {(role === 'judge') && (
                  <button
                    className="det-btn det-btn-judge"
                    onClick={() => navigate(`/judge/hackathon/${h._id}/submissions`)}
                  >
                    <Star size={12} /> Review
                  </button>
                )}
                {(role === 'organizer' || role === 'admin') && (
                  <button
                    className="det-btn det-btn-manage"
                    onClick={() => navigate(`/hackathons/${h._id}/registrations`)}
                  >
                    <Users size={12} /> Manage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Legend ────────────────────────────────────────────────────────────────── */
function Legend({ role }) {
  const types =
    role === 'participant' ? ['hackathon_start','hackathon_end','registration_deadline','ongoing'] :
    role === 'organizer'   ? ['hackathon_start','hackathon_end','registration_deadline','submission_due'] :
    role === 'judge'       ? ['hackathon_start','hackathon_end','judging'] :
    /* admin */               ['hackathon_start','hackathon_end','registration_deadline','submission_due'];

  return (
    <div className="cal-legend">
      {types.map(t => {
        const meta = EVENT_META[t];
        return (
          <div key={t} className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: meta.color }} />
            <span>{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function CalendarPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const role      = user?.role || 'participant';

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);

  /* ── fetch all hackathons ─────────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    api.get('/hackathons')
      .then(r => {
        const data = r.data?.data || r.data || [];
        setHackathons(Array.isArray(data) ? data : data.hackathons || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(
    () => buildEvents(hackathons, role, user?._id),
    [hackathons, role, user?._id]
  );

  /* ── month navigation ─────────────────────────────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  /* ── calendar grid ────────────────────────────────────────────────────────── */
  const firstDow    = startOfMonth(viewYear, viewMonth).getDay();
  const numDays     = daysInMonth(viewYear, viewMonth);
  const prevDays    = daysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);
  const totalCells  = Math.ceil((firstDow + numDays) / 7) * 7;

  /* ── events by iso date ───────────────────────────────────────────────────── */
  const eventMap = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      const key = isoDate(ev.date);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  /* ── upcoming events list ─────────────────────────────────────────────────── */
  const upcoming = useMemo(() => {
    return events
      .filter(ev => ev.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, 6);
  }, [events]);

  const handleDayClick = (date, evs) => {
    if (evs.length === 0) return;
    setSelectedDate(date);
    setSelectedEvents(evs);
  };

  const closePanel = () => { setSelectedDate(null); setSelectedEvents([]); };

  /* ── this month event count ───────────────────────────────────────────────── */
  const monthEventCount = useMemo(() => {
    return events.filter(ev =>
      ev.date.getFullYear() === viewYear && ev.date.getMonth() === viewMonth
    ).length;
  }, [events, viewYear, viewMonth]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', color: '#fff', overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="cal-topbar">
          <div>
            <h1 className="cal-title">Calendar</h1>
            <p className="cal-subtitle">Hackathon timeline for all your events</p>
          </div>
          <div className="cal-topbar-right">
            <Legend role={role} />
            {(role === 'organizer' || role === 'admin') && (
              <button className="cal-new-btn" onClick={() => navigate('/hackathons/create')}>
                <Plus size={14} /> New Hackathon
              </button>
            )}
          </div>
        </div>

        <div className="cal-body" onClick={closePanel}>

          {/* ── Month Nav + summary ──────────────────────────────────────── */}
          <div className="cal-nav-row">
            <div className="cal-month-heading">
              <h2 className="cal-month-label">{MONTHS[viewMonth]} {viewYear}</h2>
              {monthEventCount > 0 && (
                <span className="cal-ev-count">{monthEventCount} event{monthEventCount !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="cal-nav-btns">
              <button className="cal-nav-btn" onClick={goToday}>Today</button>
              <button className="cal-nav-btn cal-nav-icon" onClick={prevMonth}><ChevronLeft size={16}/></button>
              <button className="cal-nav-btn cal-nav-icon" onClick={nextMonth}><ChevronRight size={16}/></button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

            {/* ── Grid ─────────────────────────────────────────────────── */}
            <div className="cal-grid-wrap" onClick={e => e.stopPropagation()}>
              {/* Day headers */}
              <div className="cal-grid-header">
                {DAYS.map(d => <div key={d} className="cal-dow">{d}</div>)}
              </div>

              {/* Cells */}
              <div className="cal-grid">
                {Array.from({ length: totalCells }, (_, idx) => {
                  const cellNum = idx - firstDow + 1;
                  let cellDate, inMonth;

                  if (cellNum < 1) {
                    // Previous month
                    const d = prevDays + cellNum;
                    const mo = viewMonth === 0 ? 11 : viewMonth - 1;
                    const yr = viewMonth === 0 ? viewYear - 1 : viewYear;
                    cellDate = new Date(yr, mo, d);
                    inMonth = false;
                  } else if (cellNum > numDays) {
                    // Next month
                    const d = cellNum - numDays;
                    const mo = viewMonth === 11 ? 0 : viewMonth + 1;
                    const yr = viewMonth === 11 ? viewYear + 1 : viewYear;
                    cellDate = new Date(yr, mo, d);
                    inMonth = false;
                  } else {
                    cellDate = new Date(viewYear, viewMonth, cellNum);
                    inMonth = true;
                  }

                  const key    = isoDate(cellDate);
                  const evs    = eventMap[key] || [];
                  const isToday = sameDay(cellDate, today);
                  const isSel  = selectedDate && sameDay(cellDate, selectedDate);
                  const isHov  = hoveredDay === key;

                  return (
                    <div
                      key={idx}
                      className={`cal-cell ${!inMonth ? 'cal-cell-ghost' : ''} ${isToday ? 'cal-cell-today' : ''} ${isSel ? 'cal-cell-selected' : ''} ${evs.length > 0 ? 'cal-cell-has-events' : ''}`}
                      onClick={() => handleDayClick(cellDate, evs)}
                      onMouseEnter={() => setHoveredDay(key)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div className="cal-cell-num">
                        <span className={isToday ? 'cal-today-bubble' : ''}>{cellDate.getDate()}</span>
                      </div>
                      <div className="cal-cell-events">
                        {evs.slice(0, 3).map((ev, i) => (
                          <EventPill key={i} event={ev} onClick={(ev) => { setSelectedDate(cellDate); setSelectedEvents(evs); }} />
                        ))}
                        {evs.length > 3 && (
                          <div className="cal-more-badge">+{evs.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right panel: detail or upcoming ──────────────────────── */}
            <div className="cal-sidebar-panel" onClick={e => e.stopPropagation()}>
              {selectedDate && selectedEvents.length > 0 ? (
                <DetailPanel
                  events={selectedEvents}
                  date={selectedDate}
                  onClose={closePanel}
                  navigate={navigate}
                  role={role}
                />
              ) : (
                <div className="upcoming-panel">
                  <div className="upcoming-header">
                    <Clock size={14} style={{ color: '#1b68ff' }} />
                    <span>Upcoming</span>
                  </div>
                  {loading ? (
                    <div className="cal-loading">Loading…</div>
                  ) : upcoming.length === 0 ? (
                    <div className="cal-empty">No upcoming events</div>
                  ) : (
                    upcoming.map((ev, i) => {
                      const meta = EVENT_META[ev.type] || { label: ev.type, color: '#999' };
                      const daysLeft = Math.ceil((ev.date - today) / 86400000);
                      return (
                        <div key={i} className="upcoming-item" style={{ '--ev-color': meta.color }}
                          onClick={() => navigate(`/hackathons/${ev.hackathon._id}`)}>
                          <div className="upcoming-dot" style={{ background: meta.color }} />
                          <div className="upcoming-info">
                            <div className="upcoming-name">{ev.hackathon.title}</div>
                            <div className="upcoming-type">{meta.label}</div>
                          </div>
                          <div className="upcoming-days">
                            {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline styles ────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Top bar ── */
        .cal-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          flex-shrink: 0;
        }
        .cal-title {
          font-family: 'Instrument Serif', serif;
          font-size: 1.9rem;
          font-weight: 400;
          margin: 0 0 2px;
          line-height: 1;
        }
        .cal-subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.38);
          margin: 0;
        }
        .cal-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cal-new-btn {
          display: flex; align-items: center; gap: 6px;
          background: #1b68ff; color: #fff;
          border: none; border-radius: 10px;
          padding: 8px 16px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s;
        }
        .cal-new-btn:hover { opacity: 0.85; }

        /* ── Legend ── */
        .cal-legend { display: flex; flex-wrap: wrap; gap: 10px 18px; }
        .cal-legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.73rem; color: rgba(255,255,255,0.55); }
        .cal-legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── Body ── */
        .cal-body {
          flex: 1; min-height: 0; display: flex; flex-direction: column;
          padding: 16px 20px 16px 20px; gap: 12px; overflow: hidden;
        }

        /* ── Nav row ── */
        .cal-nav-row {
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .cal-month-heading { display: flex; align-items: center; gap: 10px; }
        .cal-month-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.35rem; font-weight: 700; margin: 0; color: #fff;
        }
        .cal-ev-count {
          background: rgba(27,104,255,0.18); color: #6fa3ff;
          border: 1px solid rgba(27,104,255,0.3);
          border-radius: 20px; font-size: 0.72rem; font-weight: 600;
          padding: 2px 10px;
        }
        .cal-nav-btns { display: flex; gap: 6px; }
        .cal-nav-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7); border-radius: 8px;
          padding: 6px 14px; font-size: 0.78rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .cal-nav-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .cal-nav-icon { padding: 6px 10px; }

        /* ── Grid wrap ── */
        .cal-grid-wrap {
          flex: 1; display: flex; flex-direction: column; min-width: 0;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
        }
        .cal-grid-header {
          display: grid; grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
        }
        .cal-dow {
          text-align: center; padding: 9px 4px;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
        }
        .cal-grid {
          flex: 1; display: grid; grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 1fr; overflow-y: auto;
        }

        /* ── Calendar cell ── */
        .cal-cell {
          border-right: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 6px 7px 4px;
          display: flex; flex-direction: column; gap: 3px;
          cursor: default; transition: background 0.12s; min-height: 80px;
          position: relative;
        }
        .cal-cell:nth-child(7n) { border-right: none; }
        .cal-cell-ghost { opacity: 0.3; }
        .cal-cell-has-events { cursor: pointer; }
        .cal-cell-has-events:hover { background: rgba(27,104,255,0.06); }
        .cal-cell-selected { background: rgba(27,104,255,0.1) !important; }
        .cal-cell-today { background: rgba(27,104,255,0.04); }

        .cal-cell-num {
          display: flex; justify-content: flex-end;
          font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.55);
        }
        .cal-today-bubble {
          background: #1b68ff; color: #fff;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700;
        }
        .cal-cell-events { display: flex; flex-direction: column; gap: 2px; min-height: 0; }
        .cal-more-badge {
          font-size: 0.63rem; color: rgba(255,255,255,0.4); padding: 1px 4px;
          background: rgba(255,255,255,0.06); border-radius: 4px;
          align-self: flex-start;
        }

        /* ── Event pill ── */
        .event-pill {
          display: flex; align-items: center; gap: 3px;
          background: color-mix(in srgb, var(--pill-color) 18%, transparent);
          border: 1px solid color-mix(in srgb, var(--pill-color) 40%, transparent);
          color: var(--pill-color);
          border-radius: 4px; padding: 1px 5px; font-size: 0.64rem;
          font-weight: 600; width: 100%; text-align: left;
          cursor: pointer; transition: background 0.12s; overflow: hidden;
          white-space: nowrap;
        }
        .event-pill:hover { background: color-mix(in srgb, var(--pill-color) 30%, transparent); }
        .event-pill-text { overflow: hidden; text-overflow: ellipsis; min-width: 0; }

        /* ── Sidebar panel ── */
        .cal-sidebar-panel {
          width: 260px; flex-shrink: 0;
          display: flex; flex-direction: column;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
          background: rgba(255,255,255,0.025);
        }

        /* ── Detail panel ── */
        .detail-panel { display: flex; flex-direction: column; height: 100%; }
        .detail-panel-header {
          padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; justify-content: space-between; align-items: flex-start;
          background: rgba(27,104,255,0.08);
        }
        .detail-date-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); }
        .detail-date-number { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; line-height: 1; color: #fff; }
        .detail-month-label { font-size: 0.73rem; color: rgba(255,255,255,0.4); }
        .detail-close {
          background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.5);
          width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
          font-size: 0.75rem; display: flex; align-items: center; justify-content: center;
        }
        .detail-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .detail-events { flex: 1; overflow-y: auto; padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
        .detail-event-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid color-mix(in srgb, var(--ev-color) 25%, rgba(255,255,255,0.08));
          border-left: 3px solid var(--ev-color);
          border-radius: 10px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .detail-ev-type { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .detail-ev-title { font-size: 0.88rem; font-weight: 700; color: #fff; line-height: 1.25; }
        .detail-ev-meta { font-size: 0.72rem; color: rgba(255,255,255,0.4); }
        .detail-ev-status {
          display: inline-block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          padding: 2px 8px; border-radius: 20px; align-self: flex-start;
        }
        .detail-ev-status[data-status="open"]    { background: rgba(34,197,94,0.15); color: #4ade80; }
        .detail-ev-status[data-status="ongoing"] { background: rgba(27,104,255,0.15); color: #6fa3ff; }
        .detail-ev-status[data-status="ended"]   { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.35); }
        .detail-ev-status[data-status="upcoming"]{ background: rgba(245,158,11,0.15); color: #fbbf24; }
        .detail-ev-status[data-status="draft"]   { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }
        .detail-ev-dates { display: flex; flex-direction: column; gap: 2px; font-size: 0.7rem; color: rgba(255,255,255,0.35); }
        .detail-ev-actions { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
        .det-btn {
          display: flex; align-items: center; gap: 4px;
          border: none; border-radius: 6px; padding: 4px 10px;
          font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
        }
        .det-btn:hover { opacity: 0.8; }
        .det-btn-view   { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .det-btn-judge  { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .det-btn-manage { background: rgba(27,104,255,0.2); color: #6fa3ff; }

        /* ── Upcoming panel ── */
        .upcoming-panel { display: flex; flex-direction: column; height: 100%; }
        .upcoming-header {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 16px 10px;
          font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.6);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .upcoming-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer; transition: background 0.12s;
        }
        .upcoming-item:hover { background: rgba(255,255,255,0.04); }
        .upcoming-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .upcoming-info { flex: 1; min-width: 0; }
        .upcoming-name { font-size: 0.78rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .upcoming-type { font-size: 0.65rem; color: rgba(255,255,255,0.35); margin-top: 1px; }
        .upcoming-days { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .cal-loading, .cal-empty { padding: 24px; text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
