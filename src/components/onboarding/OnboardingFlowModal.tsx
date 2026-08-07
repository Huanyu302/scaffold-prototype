import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  ChevronDown,
  X,
  Compass,
  Briefcase,
  Layers,
  FileText,
  Target,
  UserCheck,
  BookOpen,
  Award,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export type CopilotPersonaType = 'goal-oriented' | 'insightful-explorer' | 'academic-scholar';

const PRESET_MAJORS = [
  'Product Design',
  'HCI / UX (Human-Computer Interaction)',
  'Computer Science & Software Eng.',
  'Mechanical & Mechatronics Eng.',
  'Business, Innovation & Strategy',
  'Data Science & Applied Analytics',
  'Architecture & Built Environment',
  'Bioengineering & Medical Tech',
  'Electrical & Information Eng.',
  'Industrial & Systems Eng.'
];

const QUICK_MAJOR_CHIPS = [
  'Product Design',
  'HCI / UX',
  'Computer Science',
  'Mechanical Eng.',
  'Business & Strategy',
  'Data Science',
  'Architecture',
  'Bioengineering'
];

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  // Step state: 0 = Auth Screen, 1 = Academic Profile, 2 = Deliverable Domains, 3 = Feedback Focus, 4 = Copilot Persona
  const [step, setStep] = useState<number>(0);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Step 1 State: Academic Level & Field of Study
  const [academicLevel, setAcademicLevel] = useState<string>('');
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [majorSearchInput, setMajorSearchInput] = useState<string>('');
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);

  // Step 2 State: Deliverable Artifact Domains
  const [deliverableDomains, setDeliverableDomains] = useState<string[]>([]);

  // Step 3 State: Feedback Focus & Outcomes
  const [feedbackStages, setFeedbackStages] = useState<string[]>([]);
  const [targetCareerRole, setTargetCareerRole] = useState<string>('');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');

  // Step 4 State: AI Copilot Persona
  const [copilotPersona, setCopilotPersona] = useState<CopilotPersonaType | ''>('');

  // Submitting transition state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic career role preset chips mapping based on Step 1 major
  const dynamicCareerPresets = useMemo(() => {
    const field = (fieldOfStudy || majorSearchInput).toLowerCase();
    if (field.includes('design') || field.includes('hci') || field.includes('ux')) {
      return ['UX Researcher', 'Product Designer', 'CMF Specialist', 'Design Strategist'];
    }
    if (field.includes('computer') || field.includes('mechanical') || field.includes('eng') || field.includes('software')) {
      return ['Hardware PM', 'Robotics Engineer', 'Software Architect', 'Systems Engineer'];
    }
    if (field.includes('business') || field.includes('strategy') || field.includes('finance')) {
      return ['Product Manager', 'Strategy Consultant', 'Business Analyst', 'Venture Analyst'];
    }
    if (field.includes('data') || field.includes('bio') || field.includes('analytics')) {
      return ['Data Scientist', 'AI Researcher', 'Bio-Tech Analyst', 'Systems Engineer'];
    }
    return ['Product Manager', 'Data Analyst', 'UX Researcher', 'Strategy Consultant'];
  }, [fieldOfStudy, majorSearchInput]);

  // Filtered Combobox Suggestion List for Step 1
  const filteredMajors = useMemo(() => {
    if (!majorSearchInput.trim()) return PRESET_MAJORS;
    return PRESET_MAJORS.filter(m => m.toLowerCase().includes(majorSearchInput.toLowerCase()));
  }, [majorSearchInput]);

  // Step Validation Logic
  const canProceedStep1 = academicLevel !== '' && (fieldOfStudy !== '' || majorSearchInput.trim() !== '');
  const canProceedStep2 = deliverableDomains.length > 0;
  const canProceedStep3 = feedbackStages.length > 0;
  const canProceedStep4 = copilotPersona !== '';

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      setStep(1); // Proceed to Step 1 Onboarding
    }, 600);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(s => s + 1);
    } else if (step === 4 && canProceedStep4) {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onComplete) onComplete();
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{
          opacity: isSubmitting ? 0 : 1,
          scale: isSubmitting ? 0.95 : 1,
          y: isSubmitting ? -10 : 0
        }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col relative my-auto min-h-[580px]"
      >
        {/* ======================================================== */}
        {/* MODAL TOP HEADER BAR */}
        {/* ======================================================== */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-20">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] flex items-center justify-center text-white shadow-sm">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-heading font-black text-slate-900 tracking-tight">
                Scaffold
              </span>
              <span className="ml-2 text-[10px] font-sf-pro font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                AI Feedback Engine
              </span>
            </div>
          </div>

          {/* Progress Indicator (Step 1 of 4) */}
          {step > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-heading font-extrabold text-slate-500">
                Step <strong className="text-slate-900">{step}</strong> of 4
              </span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <motion.div
                  className="h-full bg-indigo-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* INTERIOR DYNAMIC CANVAS (ANIMATED STEPS) */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* ---------------------------------------------------- */}
            {/* PAGE 0: AUTH REGISTRATION / LOGIN SCREEN */}
            {/* ---------------------------------------------------- */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6 max-w-md mx-auto w-full my-auto py-2"
              >
                <div className="text-center flex flex-col gap-2">
                  <h2 className="text-2xl font-heading font-black text-slate-900">
                    Welcome to Scaffold
                  </h2>
                  <p className="text-xs text-slate-500 font-body leading-relaxed max-w-sm mx-auto">
                    Sign up or log in to get tailored feedback insights for your academic journey.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-extrabold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-extrabold text-slate-700">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Primary Form Button */}
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-heading font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Login Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10.5px] font-sf-pro font-semibold text-slate-400">
                    Or continue with
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setStep(1)}
                    className="py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-heading font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-heading font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.88-1.01 3 .1.01 2.22-.55 2.9-1.37z" />
                    </svg>
                    <span>Apple</span>
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-heading font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z" />
                      <path fill="#81bc06" d="M12 1h10v10H12z" />
                      <path fill="#05a6f0" d="M1 12h10v10H1z" />
                      <path fill="#ffba08" d="M12 12h10v10H12z" />
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>

                {/* Auth Mode Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(m => (m === 'signup' ? 'login' : 'signup'))}
                    className="text-xs font-heading font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {authMode === 'signup'
                      ? 'Already have an account? Log In'
                      : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 1: ACADEMIC PROFILE & FIELD OF STUDY */}
            {/* ---------------------------------------------------- */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="text-xl font-sf-pro font-bold text-slate-900">
                    Tell us about your academic background
                  </h2>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    Help us tailor feedback analysis to your level and discipline.
                  </p>
                </div>

                {/* Region A: Academic Level (Single Select Chips) */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-heading font-extrabold text-slate-700 uppercase tracking-wider">
                    Academic Standing
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'Undergraduate', label: 'Undergraduate' },
                      { id: 'Postgraduate', label: 'Postgraduate' },
                      { id: 'Other', label: 'Other Learners' }
                    ].map(item => {
                      const isSelected = academicLevel === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAcademicLevel(item.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-heading transition-all cursor-pointer border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900 font-black shadow-2xs ring-1 ring-indigo-600/30'
                              : 'bg-white border-slate-200 text-slate-700 font-bold hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Region B: Major / Field of Study (Search Input + Combobox + Quick Preset Chips) */}
                <div className="flex flex-col gap-2.5 relative">
                  <label className="text-xs font-heading font-extrabold text-slate-700 uppercase tracking-wider">
                    Primary Field of Study
                  </label>

                  {/* Input Search Field with Combobox Toggle */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={majorSearchInput}
                        onFocus={() => setIsMajorDropdownOpen(true)}
                        onChange={(e) => {
                          setMajorSearchInput(e.target.value);
                          setFieldOfStudy(e.target.value);
                          setIsMajorDropdownOpen(true);
                        }}
                        placeholder="🔍 Search major or type custom field..."
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setIsMajorDropdownOpen(!isMajorDropdownOpen)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMajorDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Dropdown Suggestions List (Combobox) */}
                    {isMajorDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                        {filteredMajors.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setFieldOfStudy(m);
                              setMajorSearchInput(m);
                              setIsMajorDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-heading font-bold transition-colors flex items-center justify-between cursor-pointer ${
                              fieldOfStudy === m ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{m}</span>
                            {fieldOfStudy === m && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        ))}

                        {/* Custom Field Fallback */}
                        {majorSearchInput.trim() !== '' && !filteredMajors.includes(majorSearchInput.trim()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const customVal = majorSearchInput.trim();
                              if (customVal) {
                                setFieldOfStudy(customVal);
                                setMajorSearchInput(customVal);
                              }
                              setIsMajorDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-heading font-extrabold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer border border-dashed border-indigo-200"
                          >
                            <span>Add custom field: "{majorSearchInput.trim()}"</span>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Preset Major Chips */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-xs font-sf-pro font-semibold text-slate-400">
                      Popular Disciplines:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_MAJOR_CHIPS.map(chip => {
                        const isSelected = fieldOfStudy === chip || majorSearchInput === chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setFieldOfStudy(chip);
                              setMajorSearchInput(chip);
                              setIsMajorDropdownOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-100/80 text-slate-600 border-slate-200/80 hover:bg-slate-200/60'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: DELIVERABLE ARTIFACT DOMAINS (MULTI-SELECT) */}
            {/* ---------------------------------------------------- */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="text-xl font-sf-pro font-bold text-slate-900">
                    What forms of deliverables do your project-based learning usually involve?
                  </h2>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    (Multi-select)
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      id: 'concept-prototyping',
                      title: '🎨 Concept & Physical Prototyping',
                      subtext: 'e.g., Physical models, interactive interfaces, CMF specifications'
                    },
                    {
                      id: 'empirical-research',
                      title: '📄 Empirical Research & Reports',
                      subtext: 'e.g., Qualitative interviews, user research, literature reviews'
                    },
                    {
                      id: 'systems-engineering',
                      title: '⚙️ Systems & Engineering Development',
                      subtext: 'e.g., Software architecture, hardware integration, algorithmic models'
                    },
                    {
                      id: 'data-analytics',
                      title: '📊 Data & Analytical Models',
                      subtext: 'e.g., Quantitative experiments, statistical analysis, data visualization'
                    },
                    {
                      id: 'strategy-business',
                      title: '📈 Strategy & Business Design',
                      subtext: 'e.g., Service design, business model canvas, innovation strategy'
                    }
                  ].map(item => {
                    const isSelected = deliverableDomains.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setDeliverableDomains(prev =>
                            prev.includes(item.id)
                              ? prev.filter(d => d !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/30 border-indigo-600 shadow-2xs ring-1 ring-indigo-600/20'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <h4 className="text-xs font-heading font-extrabold text-slate-900">
                            {item.title}
                          </h4>
                          <p className="text-[11px] font-body text-slate-500">
                            {item.subtext}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: FEEDBACK FOCUS & OUTCOMES (CONDITIONAL EXPANSION) */}
            {/* ---------------------------------------------------- */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="text-xl font-sf-pro font-bold text-slate-900">
                    Which stages of feedback and outcome synthesis do you value the most?
                  </h2>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    (Multi-select)
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      id: 'formative-feedback',
                      title: '🔄 Formative Feedback in Progress',
                      subtext: 'e.g., Daily drafts, mid-term reviews, and instructor critiques for iterative tuning.'
                    },
                    {
                      id: 'summative-assessment',
                      title: '🏁 Summative Assessment at Completion',
                      subtext: 'e.g., Final evaluations, rubric breakdowns, and instructor summary comments.'
                    },
                    {
                      id: 'knowledge-notes',
                      title: '📖 Knowledge Repository & Long-term Plans',
                      subtext: 'e.g., Structuring feedback into knowledge notes and long-term actionable plans.'
                    },
                    {
                      id: 'career-alignment',
                      title: '💼 Target Career Competency Alignment',
                      subtext: 'e.g., Translating academic assets into target role match rates and resume bullet points.'
                    }
                  ].map(item => {
                    const isSelected = feedbackStages.includes(item.id);
                    const isOption4 = item.id === 'career-alignment';

                    return (
                      <div key={item.id} className="flex flex-col gap-2">
                        <div
                          onClick={() => {
                            setFeedbackStages(prev =>
                              prev.includes(item.id)
                                ? prev.filter(s => s !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/30 border-indigo-600 shadow-2xs ring-1 ring-indigo-600/20'
                              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <h4 className="text-xs font-heading font-extrabold text-slate-900">
                              {item.title}
                            </h4>
                            <p className="text-[11px] font-body text-slate-500">
                              {item.subtext}
                            </p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* CONDITIONAL EXPANSION PANEL FOR OPTION 4 */}
                        {isOption4 && isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 bg-slate-50 border border-indigo-200 rounded-xl flex flex-col gap-3 ml-2"
                          >
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-heading font-extrabold text-slate-800">
                                Set a career 'North Star' as an AI assessment benchmark (changeable anytime):
                              </span>
                            </div>

                            {/* Dynamic Role Preset Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {dynamicCareerPresets.map(role => {
                                const isRoleSelected = targetCareerRole === role;
                                return (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => setTargetCareerRole(role)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-heading transition-all cursor-pointer border ${
                                      isRoleSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
                                    }`}
                                  >
                                    {role}
                                  </button>
                                );
                              })}

                              {/* Fallback Tag Chip */}
                              <button
                                type="button"
                                onClick={() => setTargetCareerRole('Still Exploring')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-heading transition-all cursor-pointer border ${
                                  targetCareerRole === 'Still Exploring'
                                    ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                                    : 'bg-slate-200/80 text-slate-600 border-slate-300 hover:bg-slate-300/60 font-bold'
                                }`}
                              >
                                🧭 Still Exploring (View General Competency Diagnosis)
                              </button>
                            </div>

                            {/* Search Input for Custom Role */}
                            <div className="relative flex items-center mt-1">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                              <input
                                type="text"
                                value={customRoleInput}
                                onChange={(e) => {
                                  setCustomRoleInput(e.target.value);
                                  setTargetCareerRole(e.target.value);
                                }}
                                placeholder="🔍 Search or type custom role..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 4: AI COPILOT PERSONA (SINGLE SELECT & QUOTES) */}
            {/* ---------------------------------------------------- */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-xl font-sf-pro font-bold text-slate-900">
                    What role would you like your persistent AI Assistant to play when analyzing feedback?
                  </h2>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    (Single-select)
                  </p>
                </div>

                {/* Scenario Quote Banner */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] font-heading font-bold leading-relaxed">
                    <strong>Demo Scenario:</strong> When instructor feedback notes: 
                    <span className="italic font-medium ml-1">"User research sample size is too small, and interviews lack depth, failing to support design decisions":</span>
                  </div>
                </div>

                {/* Persona Cards List */}
                <div className="flex flex-col gap-3">
                  {[
                    {
                      id: 'goal-oriented',
                      title: '🎯 Goal-Oriented Coach',
                      subtext: 'Direct on weaknesses, objective and concise, action-driven.',
                      quote: '"Your user research has a clear shortfall: insufficient sample size and lack of depth. Next steps: 1. Conduct 3-5 additional user interviews; 2. Refactor probing questions to reinforce design decision rationale."'
                    },
                    {
                      id: 'insightful-explorer',
                      title: '💡 Insightful Explorer',
                      subtext: 'Encouraging, highlights strengths, thought-provoking.',
                      quote: '"Great intuition on the design proposal! However, the instructor noticed the research sample was small, which might obscure your full reasoning. Try interviewing a few more users—it will make your design justification shine!"'
                    },
                    {
                      id: 'academic-scholar',
                      title: '📚 Academic Scholar',
                      subtext: 'Focuses on methodology, rigorous standards, academic rigor.',
                      quote: '"Evaluation indicates room for improvement in qualitative research validity. Primary bottlenecks stem from sample representativeness and interview depth. Recommend adopting a semi-structured interview framework to re-align evidence with design decisions."'
                    }
                  ].map(item => {
                    const isSelected = copilotPersona === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setCopilotPersona(item.id as CopilotPersonaType)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/30 border-indigo-600 shadow-2xs ring-1 ring-indigo-600/20'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-heading font-extrabold text-slate-900">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-heading font-bold text-slate-500">
                              • {item.subtext}
                            </span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Quote Box Container */}
                        <div className="p-2.5 bg-slate-50/90 border border-slate-200/80 rounded-lg text-[10.5px] font-heading text-slate-700 italic leading-relaxed">
                          {item.quote}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER NAVIGATION BAR */}
        {/* ======================================================== */}
        {step > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between relative z-20">
            {/* Back Button */}
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {/* Next / Complete Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3) ||
                (step === 4 && !canProceedStep4) ||
                isSubmitting
              }
              className={`px-5 py-2.5 rounded-xl text-xs font-heading font-black transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                step === 4
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg disabled:opacity-40'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg disabled:opacity-40 disabled:hover:bg-indigo-600'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step === 4 ? 'Complete & Enter Platform' : 'Next'}</span>
                  {step === 4 ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
