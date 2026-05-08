// components/ExpertList.jsx - Paginated expert listing with search & filter
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchExperts } from '../services/api';

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <span className="expert-rating">
      ⭐ {rating.toFixed(1)}
    </span>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="expert-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
      <div className="expert-card-header">
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 16, width: '70%' }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, width: '100%' }} />
      <div className="skeleton" style={{ height: 12, width: '80%' }} />
      <div className="expert-meta">
        <div className="skeleton" style={{ height: 14, width: 60 }} />
        <div className="skeleton" style={{ height: 14, width: 80 }} />
      </div>
    </div>
  );
}

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

  // Debounce ref - reset page when search/category changes
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

  // Debounced search: fire request 300ms after last keystroke
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      loadExperts({ page: 1, limit: 6, search, category });
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search, category]); // eslint-disable-line

  // Page change without debounce
  useEffect(() => {
    loadExperts({ page, limit: 6, search, category });
  }, [page]); // eslint-disable-line

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div>
      {/* ── Search & Filter Bar ── */}
      <div className="search-bar">
        <div className="input-group" style={{ flex: 2 }}>
          <span className="input-icon">🔍</span>
          <input
            id="expert-search"
            className="input"
            type="text"
            placeholder="Search experts by name..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <select
          id="category-filter"
          className="select"
          value={category}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {['Technology', 'Business', 'Health', 'Education', 'Design'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(search || category) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Results Count ── */}
      {!loading && !error && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {pagination.total || 0} expert{pagination.total !== 1 ? 's' : ''} found
          {search && ` for "${search}"`}
          {category && ` in ${category}`}
        </p>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => loadExperts({ page, limit: 6, search, category })}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Expert Cards Grid ── */}
      <div className="expert-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : experts.length === 0 && !error
            ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <span className="empty-icon">🔍</span>
                <h3>No experts found</h3>
                <p>Try a different search term or category.</p>
              </div>
            )
            : experts.map((expert) => (
              <div
                key={expert._id}
                id={`expert-card-${expert._id}`}
                className="expert-card"
                onClick={() => navigate(`/experts/${expert._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/experts/${expert._id}`)}
              >
                <div className="expert-card-header">
                  <img
                    className="expert-avatar"
                    src={expert.profileImage || `https://api.dicebear.com/8.x/avataaars/svg?seed=${expert.name}`}
                    alt={expert.name}
                    onError={(e) => { e.target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${expert.name}`; }}
                  />
                  <div className="expert-info">
                    <h3>{expert.name}</h3>
                    <span className="expert-category">{expert.category}</span>
                  </div>
                </div>

                <p className="expert-bio">{expert.bio}</p>

                <div className="expert-meta">
                  <StarRating rating={expert.rating} />
                  <span className="expert-exp">🎓 {expert.experience} yrs</span>
                  <span className="expert-rate">${expert.hourlyRate}/hr</span>
                </div>
              </div>
            ))
        }
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!pagination.hasNext}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
