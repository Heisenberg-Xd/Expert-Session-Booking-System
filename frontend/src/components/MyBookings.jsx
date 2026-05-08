// components/MyBookings.jsx - Personal booking list with real-time status updates
import { useState, useEffect, useCallback } from 'react';
import { fetchBookingsByEmail, updateBookingStatus } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import toast from 'react-hot-toast';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const icons = { pending: '🕐', confirmed: '✅', completed: '🎓', cancelled: '❌' };
  return (
    <span className={`badge badge-${status}`}>
      {icons[status]} {status}
    </span>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onStatusChange, updating }) {
  const date = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  // Determine what action buttons to show based on status
  const actions = {
    pending:   [{ label: '✓ Confirm', status: 'confirmed', style: 'btn-primary' }],
    confirmed: [{ label: '✓ Complete', status: 'completed', style: 'btn-primary' }],
    completed: [],
    cancelled: [],
  };

  const expertName = booking.expertId?.name || booking.expertName || 'Expert';
  const expertCat  = booking.expertId?.category || booking.category || '';

  return (
    <div
      className="card"
      style={{ marginBottom: '1rem', transition: 'opacity 0.2s', opacity: updating === booking._id ? 0.6 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <img
            src={booking.expertId?.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expertName}`}
            alt={expertName}
            style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--color-border)' }}
          />
          <div>
            <p style={{ fontWeight: 700, marginBottom: 2 }}>{expertName}</p>
            {expertCat && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', background: 'rgba(99,102,241,0.1)', padding: '1px 7px', borderRadius: 999 }}>
                {expertCat}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', margin: '1rem 0 0', fontSize: '0.85rem' }}>
        {[
          ['📅 Date', date],
          ['⏰ Time', booking.timeSlot],
          ['👤 Name', booking.userName],
          ['📧 Email', booking.userEmail],
          ...(booking.notes ? [['📝 Notes', booking.notes]] : []),
        ].map(([k, v]) => (
          <div key={k}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{k}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
          </div>
        ))}
      </div>

      {actions[booking.status]?.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          {actions[booking.status].map((action) => (
            <button
              key={action.status}
              className={`btn ${action.style} btn-sm`}
              disabled={updating === booking._id}
              onClick={() => onStatusChange(booking._id, action.status)}
            >
              {updating === booking._id ? <span className="spinner" /> : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyBookings() {
  const [email, setEmail]         = useState('');
  const [inputEmail, setInput]    = useState('');
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [updating, setUpdating]   = useState(null);
  const [statusFilter, setFilter] = useState('');

  const loadBookings = useCallback(async (targetEmail, status) => {
    if (!targetEmail) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchBookingsByEmail(targetEmail, status);
      setBookings(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when email or status filter changes
  useEffect(() => {
    if (email) loadBookings(email, statusFilter);
  }, [email, statusFilter, loadBookings]);

  // Join user's personal Socket.io room for real-time status updates
  useEffect(() => {
    if (!email) return;

    const socket = connectSocket();
    socket.emit('join-user-room', email);

    const handleStatusUpdate = ({ bookingId, status, expertName }) => {
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status } : b)
      );
      toast.success(`Booking with ${expertName || 'expert'} is now ${status}!`);
    };

    socket.on('booking-status-updated', handleStatusUpdate);
    return () => {
      socket.off('booking-status-updated', handleStatusUpdate);
    };
  }, [email]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputEmail.trim().toLowerCase();
    if (!trimmed) return;
    setEmail(trimmed);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdating(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: newStatus } : b)
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Enter your email to view and manage your booked sessions.
        </p>
      </div>

      {/* ── Email Search ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
          <span className="input-icon">📧</span>
          <input
            id="bookings-email"
            className="input"
            type="email"
            placeholder="your@email.com"
            value={inputEmail}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button id="search-bookings-btn" type="submit" className="btn btn-primary" disabled={!inputEmail.trim()}>
          Search Bookings
        </button>
      </form>

      {/* ── Status Filter ── */}
      {email && bookings.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ── Empty state ── */}
      {!loading && email && filtered.length === 0 && !error && (
        <div className="empty-state card">
          <span className="empty-icon">📭</span>
          <h3>No bookings found</h3>
          <p>
            {statusFilter
              ? `No ${statusFilter} bookings for ${email}.`
              : `No bookings found for ${email}. Try booking a session!`}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => window.location.href = '/'}
          >
            Browse Experts
          </button>
        </div>
      )}

      {/* ── Welcome prompt (no email yet) ── */}
      {!email && !loading && (
        <div className="empty-state card">
          <span className="empty-icon">🔐</span>
          <h3>Enter your email above</h3>
          <p>We'll find all sessions linked to your email address.</p>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 Try: rohit@example.com · divya@example.com · amit@example.com
          </div>
        </div>
      )}

      {/* ── Booking Cards ── */}
      {!loading && filtered.map((booking) => (
        <BookingCard
          key={booking._id}
          booking={booking}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      ))}
    </div>
  );
}
