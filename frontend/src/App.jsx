import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ExpertList from './components/ExpertList';
import ExpertDetail from './components/ExpertDetail';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
            <span className="logo-dot" />
            ExpertConnect
          </NavLink>
          <ul className="navbar-nav">
            <li><NavLink to="/" end>Experts</NavLink></li>
            <li><NavLink to="/my-bookings">My Bookings</NavLink></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Navbar />

      {isHome && (
        <section className="hero">
          <div className="container">
            <h1>Connect with World-Class Experts</h1>
            <p>Book 1-on-1 sessions with top professionals in Technology, Business, Health, Education &amp; Design. Real-time availability, zero double-booking.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="stat-number">10+</div>
                <div className="stat-label">Verified Experts</div>
              </div>
              <div className="hero-stat">
                <div className="stat-number">5</div>
                <div className="stat-label">Categories</div>
              </div>
              <div className="hero-stat">
                <div className="stat-number">100%</div>
                <div className="stat-label">Race-Safe Booking</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="container" style={{ paddingTop: isHome ? '0' : '2rem', paddingBottom: '3rem' }}>
        <Routes>
          <Route path="/"                   element={<ExpertList />} />
          <Route path="/experts/:id"        element={<ExpertDetail />} />
          <Route path="/book/:id"           element={<BookingForm />} />
          <Route path="/my-bookings"        element={<MyBookings />} />
        </Routes>
      </main>
    </>
  );
}
