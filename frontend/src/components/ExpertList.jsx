// 👥 ExpertList Component displays a searchable and filterable grid of available experts.
// Integrates debounced search, category filtering, and paginated data fetching from the backend.
// Added feature: real-time debounced search for experts.
// components/ExpertList.jsx - Paginated expert listing with search & filter
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Star, GraduationCap, Clock, BadgeCheck, Briefcase, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { fetchExperts } from '../services/api';

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1.5 text-premium-gold">
      <Star className="w-4 h-4 fill-current" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="surface-1 p-6 animate-subtle-pulse">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-premium-700" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-4 bg-premium-700 rounded-md w-2/3" />
          <div className="h-3 bg-premium-700 rounded-md w-1/3" />
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-6">
        <div className="h-3 bg-premium-700 rounded-md w-full" />
        <div className="h-3 bg-premium-700 rounded-md w-5/6" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-premium-border/50">
        <div className="h-4 bg-premium-700 rounded-md w-16" />
        <div className="h-4 bg-premium-700 rounded-md w-16" />
      </div>
    </div>
  );
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6 }
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExpertList() {
  const navigate = useNavigate();
  const [experts, setExperts]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [page, setPage]             = useState(1);

  const debounceTimer = useRef(null);

  const loadExperts = useCallback(async (params) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchExperts(params);
      setExperts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1); 
      loadExperts({ page: 1, limit: 6, search, category });
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search, category, loadExperts]); 

  useEffect(() => {
    loadExperts({ page, limit: 6, search, category });
  }, [page, loadExperts, search, category]); 

  const handleSearchChange = (e) => setSearch(e.target.value);
  
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="w-full flex flex-col gap-10">
      
      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-premium-text-tertiary" />
          <input
            id="expert-search"
            className="input-matte pl-12 pr-4 py-3 w-full"
            type="text"
            placeholder="Search experts by name..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="relative w-full md:w-64 flex-shrink-0">
          <select
            id="category-filter"
            className="input-matte appearance-none cursor-pointer w-full"
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {['Technology', 'Business', 'Health', 'Education', 'Design'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {(search || category) && (
          <button
            className="btn-ghost flex items-center gap-2 flex-shrink-0"
            onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* ── Results Count ── */}
      {!loading && !error && (
        <p className="text-sm text-premium-text-tertiary font-medium">
          {pagination.total || 0} expert{pagination.total !== 1 ? 's' : ''} found
          {search && <span className="text-premium-text-secondary"> for "{search}"</span>}
          {category && <span className="text-premium-text-secondary"> in {category}</span>}
        </p>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="surface-2 p-6 flex items-center justify-between border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3 text-red-400">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => loadExperts({ page, limit: 6, search, category })}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Expert Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : experts.length === 0 && !error ? (
        <div className="surface-1 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-premium-700 flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-premium-text-tertiary" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No experts found</h3>
          <p className="text-premium-text-secondary">Try a different search term or category.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {experts.map((expert) => (
            <motion.div
              variants={cardVariants}
              key={expert.id}
              id={`expert-card-${expert.id}`}
              className="surface-1 p-7 cursor-pointer group hover:-translate-y-2 hover:border-premium-gold/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(231,200,115,0.05)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden relative"
              onClick={() => navigate(`/experts/${expert.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/experts/${expert.id}`)}
            >
              {/* Subtle top light effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-premium-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-premium-gold/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <img
                    className="w-20 h-20 rounded-2xl border border-premium-border/50 relative z-10 object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 shadow-2xl"
                    src={expert.profileImage}
                    alt={expert.name}
                    onError={(e) => { e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${expert.name}&backgroundColor=050505&fontFamily=Inter&fontWeight=600`; }}
                  />
                  {expert.verified && (
                    <div className="absolute -bottom-2 -right-2 z-20 bg-premium-900 rounded-full p-0.5 border border-premium-border">
                      <div className="bg-premium-gold rounded-full p-1 shadow-[0_0_10px_rgba(231,200,115,0.4)]">
                        <BadgeCheck className="w-3.5 h-3.5 text-premium-900" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-premium-gold/5 border border-premium-gold/10">
                    <Star className="w-3.5 h-3.5 text-premium-gold fill-premium-gold/20" />
                    <span className="text-sm font-semibold text-premium-gold">{expert.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-premium-text-tertiary">
                    {expert.category}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-premium-gold transition-colors duration-300">{expert.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-premium-text-secondary">
                  <Briefcase className="w-3.5 h-3.5 text-premium-gold/60" />
                  <span className="text-xs font-medium">{expert.role} @ <span className="text-white">{expert.company}</span></span>
                </div>
              </div>

              <p className="text-sm text-premium-text-secondary leading-relaxed mb-8 line-clamp-2 min-h-[40px]">
                {expert.bio}
              </p>

              {/* Trust Indicators Section */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-premium-800 flex items-center justify-center border border-premium-border">
                    <Users className="w-4 h-4 text-premium-text-tertiary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-tighter">Sessions</p>
                    <p className="text-xs font-semibold text-white">{expert.sessionsCompleted}+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-premium-800 flex items-center justify-center border border-premium-border">
                    <TrendingUp className="w-4 h-4 text-premium-text-tertiary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-tighter">Retention</p>
                    <p className="text-xs font-semibold text-white">{expert.repeatClientPct}% repeat</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-premium-border/50">
                <div className="flex items-center gap-1.5 text-premium-text-tertiary">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">{expert.responseTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white tracking-tight">${expert.hourlyRate}<span className="text-xs font-medium text-premium-text-tertiary tracking-normal">/hr</span></span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            className="btn-secondary px-3"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
          >
            Previous
          </button>

          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`w-10 h-10 rounded-xl font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  p === page 
                    ? 'bg-premium-gold text-premium-900 shadow-[0_0_15px_rgba(231,200,115,0.2)]' 
                    : 'text-premium-text-secondary hover:bg-premium-800 hover:text-white'
                }`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="btn-secondary px-3"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!pagination.hasNext}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
