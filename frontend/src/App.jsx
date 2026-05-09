// ⚛️ Main Frontend Application entry point.
// Manages routing, global navigation, and aesthetic dark mode layout.
import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck } from 'lucide-react';
import ExpertList from './components/ExpertList';
import ExpertDetail from './components/ExpertDetail';
import BookingForm from './components/BookingForm';
import ManageBooking from './components/ManageBooking';
import BecomeExpert from './components/BecomeExpert';
import { Hero2 } from './components/ui/hero-2-1';
import { Menu, X } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const [activeToken, setActiveToken] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for an active session token when Navbar mounts or when a custom event is dispatched
    const checkToken = () => {
      const token = localStorage.getItem('expertConnect_activeSession');
      setActiveToken(token);
    };
    checkToken();
    
    window.addEventListener('storage', checkToken);
    window.addEventListener('sessionUpdated', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('sessionUpdated', checkToken);
    };
  }, []);

  return (
    <>
      <nav className="glass-nav z-50 relative">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 text-white no-underline group">
          <div className="w-2.5 h-2.5 rounded-full bg-premium-gold shadow-[0_0_10px_rgba(231,200,115,0.4)] group-hover:shadow-[0_0_15px_rgba(231,200,115,0.6)] transition-shadow duration-300" />
          <span className="font-semibold tracking-tight text-lg">ExpertConnect</span>
        </NavLink>
        
        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-premium-text-secondary hover:text-white'}`
              }
            >
              Experts
            </NavLink>
          </li>
          {activeToken && (
            <li>
              <button 
                onClick={() => navigate(`/manage/${activeToken}`)}
                className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full bg-premium-800 border border-premium-border text-white hover:border-premium-gold/50 transition-colors duration-300"
              >
                <CalendarCheck className="w-4 h-4 text-premium-gold" />
                Your Session
              </button>
            </li>
          )}
          <li>
            <NavLink 
              to="/apply" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-300 ${isActive ? 'text-premium-gold' : 'text-premium-text-secondary hover:text-white'}`
              }
            >
              Become an Expert
            </NavLink>
          </li>
          <li>
            <a 
              href="https://github.com/kartikesh" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-medium text-premium-text-secondary hover:text-white transition-colors duration-300"
            >
              Support
            </a>
          </li>
        </ul>
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col p-6 bg-black/95 md:hidden pt-24"
          >
            <div className="flex flex-col space-y-6">
              <NavLink 
                to="/" 
                end
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between border-b border-premium-border pb-4 text-lg text-white"
              >
                Experts
              </NavLink>
              {activeToken && (
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(`/manage/${activeToken}`);
                  }}
                  className="flex items-center justify-between border-b border-premium-border pb-4 text-lg text-premium-gold"
                >
                  Your Session
                </button>
              )}
              <NavLink 
                to="/apply" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between border-b border-premium-border pb-4 text-lg text-white"
              >
                Become an Expert
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: [0.22, 1, 0.36, 1], duration: 0.8 }
  }
};

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <AnimatePresence mode="wait">
        {isHome && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero2 />
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-grow w-full max-w-7xl mx-auto px-6 pb-24 ${isHome ? 'pt-0' : 'pt-12'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route path="/"                   element={<ExpertList />} />
              <Route path="/experts/:id"        element={<ExpertDetail />} />
              <Route path="/book/:id"           element={<BookingForm />} />
              <Route path="/manage/:token"      element={<ManageBooking />} />
              <Route path="/apply"              element={<BecomeExpert />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
