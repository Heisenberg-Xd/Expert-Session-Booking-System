// components/BookingForm.jsx - Session booking form with validation
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createBooking } from '../services/api';
import toast from 'react-hot-toast';

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ booking, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your session with <strong style={{ color: 'var(--text-primary)' }}>{booking.expertName}</strong> has been booked.
        </p>
        <div
          className="card"
          style={{ textAlign: 'left', marginBottom: '1.5rem', background: 'var(--color-surface-2)' }}
        >
          {[
            ['📅 Date', new Date(booking.bookingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
            ['⏰ Time', booking.timeSlot],
            ['👤 Name', booking.userName],
            ['📧 Email', booking.userEmail],
            ['🔖 Status', booking.status],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose}>Book Another</button>
          <button className="btn btn-primary" onClick={() => window.location.href = '/my-bookings'}>
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({ id, label, error, children }) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {error && <span className="form-error">⚠ {error}</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingForm() {
  const { id } = useParams();
  const { state } = useLocation();   // expert, date, timeSlot from navigation
  const navigate = useNavigate();

  const expert   = state?.expert;
  const date     = state?.date;
  const timeSlot = state?.timeSlot;

  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    notes: '',
  });
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [successData, setSuccess] = useState(null);

  // If navigation state is missing (direct URL access), redirect back
  if (!expert || !date || !timeSlot) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No slot selected. Please pick a slot first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Experts</button>
      </div>
    );
  }

  const validate = () => {
    const newErrors = {};
    if (!form.userName.trim() || form.userName.trim().length < 2)
      newErrors.userName = 'Name must be at least 2 characters';
    if (!form.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail))
      newErrors.userEmail = 'Enter a valid email address';
    if (!form.userPhone || !/^\d{10}$/.test(form.userPhone.replace(/[\s\-\+]/g, '')))
      newErrors.userPhone = 'Enter a valid 10-digit phone number';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await createBooking({
        expertId: id,
        ...form,
        bookingDate: date,
        timeSlot,
      });
      setSuccess(res.data);
      toast.success('Booking confirmed! 🎉');
    } catch (err) {
      // 409 = race condition - slot was just taken by someone else
      if (err.message.includes('already booked') || err.message.includes('Slot')) {
        toast.error('⚡ Slot just got booked! Please choose another time.');
        navigate(`/experts/${id}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      {successData && (
        <SuccessModal booking={successData} onClose={() => navigate(`/experts/${id}`)} />
      )}

      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          ← Back
        </button>

        {/* ── Booking Summary Card ── */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.05) 100%)',
            borderColor: 'rgba(99,102,241,0.3)',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📋 Session Summary</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={expert.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expert.name}`}
              alt={expert.name}
              style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--color-primary)' }}
            />
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{expert.name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {expert.category} · ${expert.hourlyRate}/hr
              </p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{timeSlot}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* ── Booking Form ── */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>👤 Your Details</h2>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <Field id="userName" label="Full Name *" error={errors.userName}>
              <input
                id="userName"
                name="userName"
                className={`input ${errors.userName ? 'input-error' : ''}`}
                type="text"
                placeholder="Rohit Kumar"
                value={form.userName}
                onChange={handleChange}
                autoComplete="name"
                style={errors.userName ? { borderColor: 'var(--color-error)' } : {}}
              />
            </Field>

            <Field id="userEmail" label="Email Address *" error={errors.userEmail}>
              <input
                id="userEmail"
                name="userEmail"
                className="input"
                type="email"
                placeholder="rohit@example.com"
                value={form.userEmail}
                onChange={handleChange}
                autoComplete="email"
                style={errors.userEmail ? { borderColor: 'var(--color-error)' } : {}}
              />
            </Field>

            <Field id="userPhone" label="Phone Number *" error={errors.userPhone}>
              <input
                id="userPhone"
                name="userPhone"
                className="input"
                type="tel"
                placeholder="9876543210"
                value={form.userPhone}
                onChange={handleChange}
                autoComplete="tel"
                maxLength={15}
                style={errors.userPhone ? { borderColor: 'var(--color-error)' } : {}}
              />
            </Field>

            <Field id="notes" label="Notes (optional)">
              <textarea
                id="notes"
                name="notes"
                className="input"
                placeholder="What would you like to discuss in this session?"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </Field>

            <button
              id="confirm-booking-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Confirming Booking...
                </>
              ) : (
                '✓ Confirm Booking'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
