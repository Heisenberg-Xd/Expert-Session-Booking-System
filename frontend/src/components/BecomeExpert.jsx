// components/BecomeExpert.jsx - Premium multi-step onboarding for new experts
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Link, Briefcase, GraduationCap, 
  DollarSign, Globe, FileText, CheckCircle2, 
  ArrowRight, ArrowLeft, Send, Sparkles 
} from 'lucide-react';
import { submitExpertApplication } from '../services/api';

const STEPS = [
  { id: 'identity', title: 'Identity', description: 'Basic professional info' },
  { id: 'expertise', title: 'Expertise', description: 'Your niche and experience' },
  { id: 'motivation', title: 'Motivation', description: 'Why you want to join' },
  { id: 'finish', title: 'Review', description: 'Final verification' }
];

export default function BecomeExpert() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedIn: '',
    company: '',
    role: '',
    category: 'Technology',
    experience: '5',
    hourlyRate: '100',
    portfolio: '',
    bio: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitExpertApplication(formData);
      setIsSuccess(true);
    } catch (err) {
      alert('Error submitting application: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-1 p-12 text-center max-w-lg shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-premium-gold/20 via-premium-gold to-premium-gold/20" />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">Application Received</h2>
          <p className="text-premium-text-secondary mb-8 leading-relaxed">
            Thank you for applying to join our network of elite experts. Our team will review your profile and LinkedIn credentials within the next 48 hours.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-gold px-10 py-3"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Progress Stepper */}
      <div className="flex justify-between mb-16 relative">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-premium-border -translate-y-1/2 z-0" />
        {STEPS.map((step, idx) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-2
              ${idx <= currentStep 
                ? 'bg-premium-gold border-premium-gold text-premium-900 shadow-[0_0_15px_rgba(231,200,115,0.4)]' 
                : 'bg-premium-900 border-premium-border text-premium-text-tertiary'}
            `}>
              {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
            </div>
            <div className="hidden sm:flex flex-col items-center">
              <span className={`text-xs font-bold uppercase tracking-widest ${idx <= currentStep ? 'text-white' : 'text-premium-text-tertiary'}`}>
                {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
        className="surface-1 p-8 md:p-12 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24 text-premium-gold" />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">{STEPS[currentStep].title}</h2>
          <p className="text-premium-text-secondary">{STEPS[currentStep].description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <input 
                  type="text" required name="name" value={formData.name} onChange={handleChange}
                  className="input-matte w-full" placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Work Email
                </label>
                <input 
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  className="input-matte w-full" placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Link className="w-3 h-3" /> LinkedIn Profile URL
                </label>
                <input 
                  type="url" required name="linkedIn" value={formData.linkedIn} onChange={handleChange}
                  className="input-matte w-full" placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Current Company
                </label>
                <input 
                  type="text" required name="company" value={formData.company} onChange={handleChange}
                  className="input-matte w-full" placeholder="e.g. Google, Stripe"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Current Role
                </label>
                <input 
                  type="text" required name="role" value={formData.role} onChange={handleChange}
                  className="input-matte w-full" placeholder="e.g. Staff Engineer, VP Product"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  Expertise Category
                </label>
                <select 
                  name="category" value={formData.category} onChange={handleChange}
                  className="input-matte w-full appearance-none cursor-pointer"
                >
                  {['Technology', 'Business', 'Health', 'Education', 'Design'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-3 h-3" /> Years of Experience
                </label>
                <input 
                  type="number" required name="experience" value={formData.experience} onChange={handleChange}
                  className="input-matte w-full" min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Expected Hourly Rate ($)
                </label>
                <input 
                  type="number" required name="hourlyRate" value={formData.hourlyRate} onChange={handleChange}
                  className="input-matte w-full" min="50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Portfolio / Personal Website
                </label>
                <input 
                  type="url" name="portfolio" value={formData.portfolio} onChange={handleChange}
                  className="input-matte w-full" placeholder="https://..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Professional Bio
                </label>
                <textarea 
                  required name="bio" value={formData.bio} onChange={handleChange}
                  className="input-matte w-full min-h-[120px] py-4" 
                  placeholder="Tell us about your background and achievements..."
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-premium-text-tertiary uppercase tracking-wider">
                  Why do you want to join our expert network?
                </label>
                <textarea 
                  required name="reason" value={formData.reason} onChange={handleChange}
                  className="input-matte w-full min-h-[160px] py-4" 
                  placeholder="Share your motivation and how you can help our clients..."
                />
              </div>
              <div className="p-4 rounded-xl bg-premium-gold/5 border border-premium-gold/10">
                <p className="text-xs text-premium-text-secondary leading-relaxed">
                  <Sparkles className="w-3 h-3 inline mr-2 text-premium-gold" />
                  Our network is highly curated. We look for experts who are not only skilled but also passionate about mentoring and high-impact consultation.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-premium-border bg-premium-900/50">
                  <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-widest mb-1">Name</p>
                  <p className="text-sm font-semibold text-white">{formData.name}</p>
                </div>
                <div className="p-4 rounded-xl border border-premium-border bg-premium-900/50">
                  <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-widest mb-1">Category</p>
                  <p className="text-sm font-semibold text-white">{formData.category}</p>
                </div>
                <div className="p-4 rounded-xl border border-premium-border bg-premium-900/50">
                  <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-widest mb-1">Company</p>
                  <p className="text-sm font-semibold text-white">{formData.company}</p>
                </div>
                <div className="p-4 rounded-xl border border-premium-border bg-premium-900/50">
                  <p className="text-[10px] font-bold text-premium-text-tertiary uppercase tracking-widest mb-1">Rate</p>
                  <p className="text-sm font-semibold text-white">${formData.hourlyRate}/hr</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-xl bg-premium-gold/5 border border-premium-gold/10">
                <CheckCircle2 className="w-5 h-5 text-premium-gold shrink-0 mt-0.5" />
                <p className="text-xs text-premium-text-secondary leading-relaxed">
                  By submitting, you agree to our expert code of conduct and verify that all information provided is accurate and verifiable.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-10 border-t border-premium-border/50">
            <button 
              type="button"
              onClick={prevStep}
              className={`btn-ghost flex items-center gap-2 ${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < STEPS.length - 1 ? (
              <button 
                type="button"
                onClick={nextStep}
                className="btn-gold flex items-center gap-2 px-8"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="btn-gold flex items-center gap-2 px-10 shadow-[0_0_30px_rgba(231,200,115,0.2)]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-premium-900/30 border-t-premium-900 rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Submit Application</>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
