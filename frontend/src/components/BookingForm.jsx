// components/BookingForm.jsx - Session booking form with validation
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, Tag, CheckCircle2, ChevronRight } from 'lucide-react';
import { createBooking } from '../services/api';
import toast from 'react-hot-toast';

// ─── Animation Variants ───────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } }
};

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ booking, onClose, navigate }) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const secureLink = `${window.location.origin}/manage/${booking.managementToken}`;

  useEffect(() => {
    // 1. Securely store session for persistent access
    localStorage.setItem('expertConnect_activeSession', booking.managementToken);
    window.dispatchEvent(new Event('sessionUpdated'));

    // 2. Start auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/manage/${booking.managementToken}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking.managementToken, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secureLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-premium-900/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
        className="relative w-full max-w-lg surface-1 p-8 md:p-10 text-center overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(231,200,115,0.1)]"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-premium-gold/20 via-premium-gold to-premium-gold/20" />
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.1 }}
          className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20"
        >
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Booking Confirmed</h2>
        <p className="text-premium-text-secondary mb-8 leading-relaxed max-w-sm mx-auto">
          Your session with <span className="text-white font-medium">{booking.expertName}</span> has been securely scheduled.
        </p>
        
        <div className="surface-2 rounded-xl p-6 text-left mb-8 space-y-4 border border-premium-gold/10">
          <div className="flex justify-between items-center pb-4 border-b border-premium-border/50">
            <div className="flex items-center gap-2 text-premium-text-tertiary">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm">Date</span>
            </div>
            <span className="text-sm font-medium text-white">
              {new Date(booking.bookingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-premium-text-tertiary">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Time</span>
            </div>
            <span className="text-sm font-medium text-white">{booking.timeSlot}</span>
          </div>
        </div>

        {/* Minimal Backup Link UI */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-premium-text-tertiary">Backup Access Link:</span>
          <button 
            onClick={handleCopy}
            className="text-xs font-semibold text-premium-gold hover:text-white transition-colors"
          >
            {copied ? 'Copied to clipboard!' : 'Copy Link'}
          </button>
        </div>
        
        {/* Countdown Auto-Redirect */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-3 text-premium-text-secondary">
            <div className="w-4 h-4 border-2 border-premium-gold/30 border-t-premium-gold rounded-full animate-spin" />
            <span className="text-sm font-medium">Redirecting to your session portal in {countdown}s...</span>
          </div>
          <button 
            className="text-xs font-medium text-premium-text-tertiary hover:text-white transition-colors underline underline-offset-4 opacity-50 hover:opacity-100" 
            onClick={onClose}
          >
            Cancel automatic redirect
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({ id, label, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-premium-text-secondary pl-1">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 font-medium pl-1 overflow-hidden"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
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

  if (!expert || !date || !timeSlot) {
    return (
      <div className="w-full max-w-lg mx-auto pt-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-premium-700 flex items-center justify-center mb-6">
          <CalendarIcon className="w-8 h-8 text-premium-text-tertiary" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">No slot selected</h2>
        <p className="text-premium-text-secondary mb-8">Please select an expert and choose an available time slot first.</p>
        <button className="btn-secondary" onClick={() => navigate('/')}>Browse Experts</button>
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
    } catch (err) {
      // Show the error message but STAY on the booking page.
      // Do NOT navigate on failure — user should select a new slot themselves.
      toast.error(err.message || 'Booking failed. Please try again.', {
        style: { background: '#171717', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <AnimatePresence>
        {successData && (
          <SuccessModal booking={successData} onClose={() => navigate(`/experts/${id}`)} navigate={navigate} />
        )}
      </AnimatePresence>

      <motion.div 
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl mx-auto pb-20"
      >
        <motion.button
          variants={itemVariants}
          className="group flex items-center gap-2 text-premium-text-secondary hover:text-white transition-colors duration-300 mb-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          <span className="text-sm font-medium">Back to Profile</span>
        </motion.button>

        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Finalize Booking</h1>
          <p className="text-premium-text-secondary">Review the session details and enter your information.</p>
        </motion.div>

        {/* ── Booking Summary Card ── */}
        <motion.div variants={itemVariants} className="surface-1 p-6 md:p-8 mb-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-premium-gold/5 to-transparent opacity-50" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <img
                src={expert.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expert.name}`}
                alt={expert.name}
                className="w-16 h-16 rounded-full border border-premium-border object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-white tracking-tight">{expert.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-premium-text-secondary">{expert.category}</span>
                  <span className="w-1 h-1 rounded-full bg-premium-700" />
                  <span className="text-sm text-premium-gold font-medium">${expert.hourlyRate}/hr</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-premium-border/50" />
            
            <div className="flex flex-col md:items-end">
              <p className="text-xl font-semibold text-white tracking-tight">{timeSlot}</p>
              <p className="text-sm text-premium-text-secondary mt-1">{formattedDate}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Booking Form ── */}
        <motion.div variants={itemVariants} className="surface-1 p-6 md:p-10">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field id="userName" label="Full Name" error={errors.userName}>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-text-tertiary" />
                  <input
                    id="userName"
                    name="userName"
                    className={`input-matte pl-11 ${errors.userName ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    type="text"
                    placeholder="John Doe"
                    value={form.userName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </Field>

              <Field id="userEmail" label="Email Address" error={errors.userEmail}>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-text-tertiary" />
                  <input
                    id="userEmail"
                    name="userEmail"
                    className={`input-matte pl-11 ${errors.userEmail ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    type="email"
                    placeholder="john@example.com"
                    value={form.userEmail}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </Field>
            </div>

            <Field id="userPhone" label="Phone Number" error={errors.userPhone}>
              <input
                id="userPhone"
                name="userPhone"
                className={`input-matte ${errors.userPhone ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.userPhone}
                onChange={handleChange}
                autoComplete="tel"
                maxLength={15}
              />
            </Field>

            <Field id="notes" label="Preparation Notes (Optional)">
              <textarea
                id="notes"
                name="notes"
                className="input-matte min-h-[120px] resize-y"
                placeholder="Briefly describe what you'd like to achieve in this session..."
                value={form.notes}
                onChange={handleChange}
              />
            </Field>

            <div className="pt-4 mt-2 border-t border-premium-border/50">
              <button
                id="confirm-booking-btn"
                type="submit"
                className="btn-gold w-full py-4 text-base tracking-wide flex justify-center items-center gap-3 relative overflow-hidden"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-premium-900/30 border-t-premium-900 rounded-full animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm Booking</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}
