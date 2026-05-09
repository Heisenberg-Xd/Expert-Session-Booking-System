// 🗃️ ManageBooking Component
// Secure, token-based premium client portal for managing a specific session.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { fetchBookingByToken, updateBookingStatus } from '../services/api';
import toast from 'react-hot-toast';

export default function ManageBooking() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await fetchBookingByToken(token);
        setBooking(res.data);
        
        // Ensure local session is synced in case they accessed via email link
        if (localStorage.getItem('expertConnect_activeSession') !== token) {
          localStorage.setItem('expertConnect_activeSession', token);
          window.dispatchEvent(new Event('sessionUpdated'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [token]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(newStatus);
    try {
      await updateBookingStatus(token, newStatus);
      setBooking((prev) => ({ ...prev, status: newStatus.toLowerCase() }));
      toast.success(`Booking ${newStatus.toLowerCase()}`, {
        style: { background: '#171717', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
    } catch (err) {
      toast.error(err.message, {
        style: { background: '#171717', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto pt-10 flex flex-col gap-6 animate-subtle-pulse">
        <div className="surface-1 h-32 rounded-2xl" />
        <div className="surface-1 h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto mt-20 surface-1 py-16 flex flex-col items-center text-center px-6"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Invalid or Expired Link</h3>
        <p className="text-premium-text-secondary max-w-sm mb-8">
          We couldn't securely verify this booking link. Please check your email for the correct link or contact support.
        </p>
        <button className="btn-gold" onClick={() => navigate('/')}>
          Return Home
        </button>
      </motion.div>
    );
  }

  const date = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const expertName = booking.expertId?.name || booking.expertName || 'Expert';
  const expertCat  = booking.expertId?.category || booking.category || '';

  const styles = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
        className="mb-8 flex items-center justify-between border-b border-premium-border/50 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium tracking-widest uppercase text-premium-text-tertiary">Secure Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manage Session</h1>
        </div>
        <span className={`capitalize px-4 py-1.5 rounded-full text-sm font-medium border ${styles[booking.status]}`}>
          {booking.status}
        </span>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6, delay: 0.1 }}
        className="surface-1 p-8"
      >
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          <img
            src={booking.expertId?.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expertName}`}
            alt={expertName}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border border-premium-border object-cover shadow-2xl shadow-black/50"
          />
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-1">{expertName}</h2>
            <span className="text-premium-gold font-medium mb-4 inline-block">{expertCat}</span>
            <p className="text-sm text-premium-text-secondary max-w-md">
              1-on-1 consultation session. Please ensure you join a few minutes early to test your connection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 bg-premium-800/30 p-6 rounded-2xl border border-premium-border/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-premium-700/50 flex items-center justify-center shrink-0 border border-premium-border/50">
              <CalendarIcon className="w-5 h-5 text-premium-text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-premium-text-tertiary uppercase tracking-wider mb-1">Date</span>
              <span className="text-base font-medium text-white">{date}</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-premium-700/50 flex items-center justify-center shrink-0 border border-premium-border/50">
              <Clock className="w-5 h-5 text-premium-text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-premium-text-tertiary uppercase tracking-wider mb-1">Time (Local)</span>
              <span className="text-base font-medium text-white">{booking.timeSlot}</span>
            </div>
          </div>
        </div>

        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-premium-border/50">
            {booking.status === 'pending' && (
              <button
                className="btn-gold flex-1 flex items-center justify-center gap-2"
                disabled={updating}
                onClick={() => handleStatusChange('CONFIRMED')}
              >
                {updating === 'CONFIRMED' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Attendance
              </button>
            )}
            {booking.status === 'confirmed' && (
              <button
                className="btn-secondary text-premium-text flex-1 flex items-center justify-center gap-2"
                disabled={updating}
                onClick={() => handleStatusChange('COMPLETED')}
              >
                {updating === 'COMPLETED' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark as Completed
              </button>
            )}
            <button
              className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 border border-red-500/20 text-red-400 hover:bg-red-500/10 flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={updating}
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
                  handleStatusChange('CANCELLED');
                }
              }}
            >
              {updating === 'CANCELLED' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel Booking
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
