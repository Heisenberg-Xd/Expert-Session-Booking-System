// components/ExpertDetail.jsx - Expert profile + real-time slot grid
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExpertById } from '../services/api';
import useRealTimeSlots from '../hooks/useRealTimeSlots';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expert, setExpert]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null); // { date, timeSlot }

  const loadExpert = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchExpertById(id);
      setExpert(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadExpert(); }, [loadExpert]);

  /**
   * Real-time slot update handler.
   * When another user books a slot, this fires and patches local state
   * without a full re-fetch — optimistic UI update.
   */
  const handleSlotBooked = useCallback(({ bookingDate, timeSlot }) => {
    setExpert((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        availability: prev.availability.map((avail) => {
          const availDate = new Date(avail.date);
          availDate.setHours(0, 0, 0, 0);
          const bookedDate = new Date(bookingDate);
          bookedDate.setHours(0, 0, 0, 0);

          if (availDate.getTime() !== bookedDate.getTime()) return avail;

          return {
            ...avail,
            slots: avail.slots.map((slot) =>
              slot.time === timeSlot ? { ...slot, isBooked: true } : slot
            ),
          };
        }),
      };
    });

    // If this window had this slot selected, deselect it (it's gone)
    setSelectedSlot((prev) => {
      if (!prev) return prev;
      const prevDate = new Date(prev.date);
      prevDate.setHours(0, 0, 0, 0);
      const bookedDate = new Date(bookingDate);
      bookedDate.setHours(0, 0, 0, 0);
      if (prevDate.getTime() === bookedDate.getTime() && prev.timeSlot === timeSlot) {
        return null;
      }
      return prev;
    });
  }, []);

  useRealTimeSlots(id, handleSlotBooked, null);

  const handleSlotClick = (date, timeSlot) => {
    setSelectedSlot({ date, timeSlot });
  };

  const handleBookNow = () => {
    if (!selectedSlot) return;
    navigate(`/book/${id}`, { state: { expert, ...selectedSlot } });
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 24, width: '40%' }} />
            <div className="skeleton" style={{ height: 16, width: '25%' }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 80 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>
        <button className="btn btn-secondary" onClick={loadExpert}>Retry</button>
      </div>
    );
  }

  if (!expert) return null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* ── Back Button ── */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.5rem' }}
      >
        ← Back to Experts
      </button>

      {/* ── Expert Profile Header ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={expert.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expert.name}`}
            alt={expert.name}
            style={{ width: 88, height: 88, borderRadius: '50%', border: '3px solid var(--color-primary)', flexShrink: 0 }}
            onError={(e) => { e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${expert.name}`; }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem' }}>{expert.name}</h1>
              <span className="expert-category">{expert.category}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>{expert.bio}</p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem' }}>⭐ <strong>{expert.rating.toFixed(1)}</strong> rating</span>
              <span style={{ fontSize: '0.9rem' }}>🎓 <strong>{expert.experience} years</strong> experience</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}>
                <strong>${expert.hourlyRate}/hr</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Real-Time Indicator ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ flex: 1, marginBottom: 0 }}>Available Slots</h2>
        <div className="live-badge">
          <span className="live-dot" />
          LIVE
        </div>
      </div>

      {/* ── Availability by Date ── */}
      {(!expert.availability || expert.availability.length === 0) ? (
        <div className="empty-state card">
          <span className="empty-icon">📅</span>
          <h3>No available slots</h3>
          <p>This expert has no upcoming availability. Check back later.</p>
        </div>
      ) : (
        expert.availability.map((avail) => (
          <div key={avail.date} className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
              📅 {formatDate(avail.date)}
            </h3>
            <div className="slots-grid">
              {avail.slots.map((slot) => {
                const isSelected =
                  selectedSlot?.timeSlot === slot.time &&
                  new Date(selectedSlot?.date).toDateString() === new Date(avail.date).toDateString();

                return (
                  <button
                    key={slot.time}
                    className={`slot-btn ${isSelected ? 'selected' : slot.isBooked ? 'booked' : 'available'}`}
                    disabled={slot.isBooked}
                    onClick={() => !slot.isBooked && handleSlotClick(avail.date, slot.time)}
                    title={slot.isBooked ? 'Already booked' : `Book ${slot.time}`}
                  >
                    {slot.time}
                    {slot.isBooked && <span style={{ display: 'block', fontSize: '0.65rem', marginTop: 1 }}>Booked</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* ── Sticky Book Now CTA ── */}
      {selectedSlot && (
        <div
          style={{
            position: 'sticky',
            bottom: '1.5rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-glow)',
            animation: 'slideUp 0.25s ease',
          }}
        >
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected slot</p>
            <p style={{ fontWeight: 700 }}>
              {formatDate(selectedSlot.date)} · {selectedSlot.timeSlot}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setSelectedSlot(null)}>Cancel</button>
            <button id="book-now-btn" className="btn btn-primary btn-lg" onClick={handleBookNow}>
              Book Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
