// components/ExpertDetail.jsx - Premium Expert profile + intelligent slot grid
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, GraduationCap, Clock, Calendar as CalendarIcon, CircleDot, Zap, TrendingUp, Info, BadgeCheck, Briefcase, MessageSquare, Users } from 'lucide-react';
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

const parseTime = (timeStr) => {
  // e.g. "09:00 AM" -> returns hours 0-23
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expert, setExpert]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  
  // UX State
  const [activeDate, setActiveDate]     = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const loadExpert = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchExpertById(id);
      setExpert(res.data);
      if (res.data.availability?.length > 0) {
        setActiveDate(res.data.availability[0].date);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadExpert(); }, [loadExpert]);

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

  // ── Derived Data for UX ──
  const activeDayData = useMemo(() => {
    if (!expert || !activeDate) return null;
    return expert.availability.find(a => a.date === activeDate);
  }, [expert, activeDate]);

  const groupedSlots = useMemo(() => {
    if (!activeDayData) return { morning: [], afternoon: [], evening: [] };
    const groups = { morning: [], afternoon: [], evening: [] };
    
    activeDayData.slots.forEach(slot => {
      const { hours } = parseTime(slot.time);
      if (hours < 12) groups.morning.push(slot);
      else if (hours < 17) groups.afternoon.push(slot);
      else groups.evening.push(slot);
    });
    return groups;
  }, [activeDayData]);

  // Find the fastest available slot
  const fastestAvailable = useMemo(() => {
    if (!expert) return null;
    for (const avail of expert.availability) {
      const freeSlot = avail.slots.find(s => !s.isBooked);
      if (freeSlot) return { date: avail.date, time: freeSlot.time };
    }
    return null;
  }, [expert]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-10 animate-subtle-pulse">
        <div className="surface-1 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-premium-700 shrink-0" />
          <div className="flex-1 w-full space-y-4">
            <div className="h-8 bg-premium-700 rounded-md w-1/2" />
            <div className="h-4 bg-premium-700 rounded-md w-1/4" />
          </div>
        </div>
        <div className="surface-1 p-8 h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="surface-2 p-6 flex flex-col items-center justify-center gap-4 border-red-500/20 bg-red-500/5 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-400 font-medium">{error}</p>
          <button className="btn-secondary mt-2" onClick={loadExpert}>Retry Connection</button>
        </div>
      </div>
    );
  }

  if (!expert) return null;

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto relative pb-40"
    >
      {/* ── Back Button ── */}
      <motion.button
        variants={itemVariants}
        className="group flex items-center gap-2 text-premium-text-secondary hover:text-white transition-colors duration-300 mb-8"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
        <span className="text-sm font-medium">Back to Experts</span>
      </motion.button>

      {/* ── Expert Profile Header ── */}
      <motion.div variants={itemVariants} className="surface-1 p-8 md:p-14 mb-12 relative overflow-hidden shadow-2xl shadow-black/80 group">
        {/* Cinematic light effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-premium-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-premium-gold/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-premium-gold/10 rounded-3xl blur-2xl opacity-50" />
            <img
              src={expert.profileImage}
              alt={expert.name}
              className="w-32 h-32 md:w-44 md:h-44 rounded-3xl border border-premium-border/50 relative z-10 object-cover shadow-2xl"
              onError={(e) => { e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${expert.name}&backgroundColor=050505&fontFamily=Inter&fontWeight=600`; }}
            />
            {expert.verified && (
              <div className="absolute -bottom-3 -right-3 z-20 bg-premium-900 rounded-full p-1 border border-premium-border/50">
                <div className="bg-premium-gold rounded-full p-1.5 shadow-[0_0_20px_rgba(231,200,115,0.4)]">
                  <BadgeCheck className="w-5 h-5 text-premium-900" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{expert.name}</h1>
                <div className="flex items-center gap-2 text-premium-gold">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm font-semibold tracking-wide uppercase">{expert.role} @ <span className="text-white">{expert.company}</span></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-premium-800 text-premium-gold border border-premium-gold/20 tracking-widest uppercase">
                  {expert.category}
                </span>
                <div className="flex items-center gap-1.5 text-premium-text-tertiary">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{expert.responseTime}</span>
                </div>
              </div>
            </div>
            
            <p className="text-premium-text-secondary text-lg leading-relaxed mb-10 max-w-3xl font-light">
              {expert.bio}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-premium-border/30">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-premium-gold mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xl font-bold text-white">{expert.rating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-premium-text-tertiary uppercase tracking-widest font-bold">Client Rating</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-premium-gold mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xl font-bold text-white">{expert.sessionsCompleted}+</span>
                </div>
                <span className="text-[10px] text-premium-text-tertiary uppercase tracking-widest font-bold">Sessions Done</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-premium-gold mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xl font-bold text-white">{expert.repeatClientPct}%</span>
                </div>
                <span className="text-[10px] text-premium-text-tertiary uppercase tracking-widest font-bold">Repeat Rate</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-premium-gold mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xl font-bold text-white">${expert.hourlyRate}</span>
                </div>
                <span className="text-[10px] text-premium-text-tertiary uppercase tracking-widest font-bold">Hourly Rate</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Booking UX Redesign ── */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="flex justify-between items-end mb-6 border-b border-premium-border/50 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Select a Session</h2>
            <p className="text-sm text-premium-text-tertiary mt-1">Times are shown in your local timezone</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-premium-800/80 border border-premium-border">
            <CircleDot className="w-3 h-3 text-premium-gold animate-pulse" />
            <span className="text-xs font-semibold text-premium-text-secondary tracking-wider uppercase">Live Booking</span>
          </div>
        </div>

        {/* ── Smart Date Navigation ── */}
        {(!expert.availability || expert.availability.length === 0) ? (
          <div className="surface-1 py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-premium-800 border border-premium-border flex items-center justify-center mb-6">
              <CalendarIcon className="w-8 h-8 text-premium-text-tertiary" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No availability right now</h3>
            <p className="text-premium-text-secondary max-w-md">
              {expert.name} is currently fully booked. Please check back later for new openings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
              {expert.availability.map((avail) => {
                const isActive = activeDate === avail.date;
                const formatted = formatDate(avail.date);
                const isFullyBooked = avail.slots.every(s => s.isBooked);
                
                return (
                  <button
                    key={avail.date}
                    onClick={() => setActiveDate(avail.date)}
                    className={`
                      relative snap-start shrink-0 px-6 py-4 rounded-2xl flex flex-col items-center transition-all duration-300
                      ${isActive 
                        ? 'bg-white text-premium-900 shadow-[0_4px_20px_rgba(255,255,255,0.15)]' 
                        : 'surface-1 text-premium-text hover:bg-premium-800 border-transparent'
                      }
                      ${isFullyBooked && !isActive ? 'opacity-50' : ''}
                    `}
                  >
                    <span className={`text-xs font-semibold tracking-wider uppercase mb-1 ${isActive ? 'text-premium-600' : 'text-premium-text-tertiary'}`}>
                      {formatted.split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold">
                      {formatted === 'Today' || formatted === 'Tomorrow' ? formatted : formatted.split(' ')[1] + ' ' + formatted.split(' ')[2]}
                    </span>
                    {isActive && (
                      <motion.div layoutId="date-indicator" className="absolute -bottom-1 w-8 h-1 rounded-full bg-premium-gold" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Premium Time Slots ── */}
            <AnimatePresence mode="wait">
              {activeDayData && (
                <motion.div
                  key={activeDayData.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="surface-1 p-8"
                >
                  {activeDayData.slots.every(s => s.isBooked) ? (
                    <div className="py-12 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-premium-800 flex items-center justify-center mb-4">
                        <Info className="w-6 h-6 text-premium-text-tertiary" />
                      </div>
                      <h4 className="text-lg font-medium text-white mb-1">Fully Booked</h4>
                      <p className="text-premium-text-secondary text-sm">All sessions for this date are taken.</p>
                      <button 
                        onClick={() => {
                          const nextAvail = expert.availability.find(a => !a.slots.every(s => s.isBooked));
                          if (nextAvail) setActiveDate(nextAvail.date);
                        }}
                        className="mt-6 text-sm font-medium text-premium-gold hover:text-white transition-colors"
                      >
                        Find next available date →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {['morning', 'afternoon', 'evening'].map(period => {
                        const slots = groupedSlots[period];
                        if (!slots.length) return null;
                        
                        return (
                          <div key={period}>
                            <h4 className="text-sm font-semibold text-premium-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                              {period === 'morning' ? '⛅ Morning' : period === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {slots.map((slot) => {
                                const isSelected = selectedSlot?.timeSlot === slot.time && selectedSlot?.date === activeDayData.date;
                                const isFastest = fastestAvailable?.date === activeDayData.date && fastestAvailable?.time === slot.time;
                                
                                return (
                                  <button
                                    key={slot.time}
                                    disabled={slot.isBooked}
                                    onClick={() => handleSlotClick(activeDayData.date, slot.time)}
                                    className={`
                                      relative group px-4 py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border
                                      ${isSelected 
                                        ? 'bg-premium-gold text-premium-900 border-premium-gold shadow-[0_0_20px_rgba(231,200,115,0.3)] scale-[1.02]' 
                                        : slot.isBooked 
                                          ? 'bg-premium-900/50 border-transparent text-premium-text-tertiary opacity-40 cursor-not-allowed' 
                                          : 'bg-premium-800 border-premium-border/50 text-white hover:border-premium-gold/50 hover:bg-premium-700'
                                      }
                                    `}
                                  >
                                    <span className="font-semibold text-sm z-10">{slot.time}</span>
                                    
                                    {/* Smart Indicators */}
                                    {isFastest && !slot.isBooked && !isSelected && (
                                      <span className="absolute -top-2.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Zap className="w-2 h-2 fill-current" /> Next
                                      </span>
                                    )}
                                    {slot.isBooked && (
                                      <span className="text-[10px] uppercase tracking-widest font-semibold mt-1 z-10 opacity-70">Taken</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Smart Sticky Summary Panel ── */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
            className="fixed bottom-0 left-0 w-full z-50 p-6 pointer-events-none flex justify-center"
          >
            <div className="w-full max-w-4xl pointer-events-auto">
              <div className="glass-nav rounded-2xl p-5 md:px-8 md:py-6 flex flex-col sm:flex-row items-center justify-between border border-premium-gold/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(231,200,115,0.1)] gap-6">
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-12 h-12 rounded-full bg-premium-800 border border-premium-border items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-premium-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      {formatDate(selectedSlot.date)} <span className="text-premium-gold">•</span> {selectedSlot.timeSlot}
                    </h4>
                    <p className="text-sm text-premium-text-secondary mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      Excellent choice. High demand slot.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-medium text-premium-text-secondary hover:text-white hover:bg-premium-800 transition-colors border border-transparent hover:border-premium-border" 
                    onClick={() => setSelectedSlot(null)}
                  >
                    Clear
                  </button>
                  <button 
                    id="book-now-btn" 
                    className="btn-gold flex-1 sm:flex-none py-3 px-8 shadow-[0_0_20px_rgba(231,200,115,0.3)]" 
                    onClick={handleBookNow}
                  >
                    Confirm & Continue
                  </button>
                </div>
                
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
