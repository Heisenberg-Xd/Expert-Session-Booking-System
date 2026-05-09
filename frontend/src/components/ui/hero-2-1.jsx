import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function Hero2() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[90vh] overflow-hidden bg-black flex flex-col justify-center">
      {/* Premium Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[600px] rounded-full bg-premium-gold/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[500px] rounded-full bg-premium-900/40 blur-[100px]" />
        {/* Grain Texture */}
        <div className="absolute inset-0 bg-noise opacity-15 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full pt-16 pb-24">
        <div className="container mx-auto px-4 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 rounded-full border border-premium-gold/20 bg-premium-gold/5 px-5 py-2 backdrop-blur-md"
          >
            <span className="text-sm font-semibold tracking-wide text-premium-gold uppercase">
              Premium Knowledge Marketplace
            </span>
            <ArrowRight className="h-4 w-4 text-premium-gold" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="mx-auto max-w-5xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl tracking-tight"
          >
            Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-premium-text-secondary">World-Class Experts</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-xl text-premium-text-tertiary leading-relaxed font-light tracking-wide"
          >
            Book premium consultations in real time. Expert sessions designed for modern professionals looking for exclusive, high-impact guidance.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="mt-12 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
          >
            <button 
              onClick={() => {
                const el = document.querySelector('.grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-gold flex items-center justify-center h-14 px-10 shadow-[0_0_30px_rgba(231,200,115,0.2)]"
            >
              Browse Experts
            </button>
            <button 
              onClick={() => navigate('/apply')}
              className="btn-ghost flex items-center justify-center h-14 px-10 border border-premium-border/50 bg-premium-900/30 hover:bg-premium-900 hover:border-premium-border"
            >
              Become an Expert
            </button>
          </motion.div>


        </div>
      </div>
    </div>
  );
}
