import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Library,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  ChevronDown,
  Compass,
  GraduationCap,
  BookOpen,
  Palette,
  FileText,
  Cpu,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Award,
  BookMarked,
  Target,
  Lightbulb
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

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

type PageStage = 'login' | 'signup' | 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-4-career' | 'step-5';

const pageVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: 'easeOut'
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: 'easeIn'
    }
  })
};

export const AuthOnboardingView: React.FC = () => {
  const { loginAsExistingUser, loginAsNewOnboardedUser, setRoute } = useAppStore();

  // Page stage state
  const [pageStage, setPageStage] = useState<PageStage>('login');
  const [direction, setDirection] = useState<number>(1);
  
  // Pre-filled simulated user info for 1-click registration/login!
  const [fullName, setFullName] = useState('Alex Chen');
  const [email, setEmail] = useState('alex.chen@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Step 1 State: Academic Standing
  const [academicLevel, setAcademicLevel] = useState<string>('');
  
  // Step 2 State: Field of Study
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [majorSearchInput, setMajorSearchInput] = useState<string>('');
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);

  // Step 3 State: Deliverable Artifact Domains
  const [deliverableDomains, setDeliverableDomains] = useState<string[]>([]);

  // Step 4 State: Feedback Focus & Outcomes
  const [feedbackStages, setFeedbackStages] = useState<string[]>([]);

  // Dedicated Step 4-Career State: Target Career Role Benchmark
  const [targetCareerRole, setTargetCareerRole] = useState<string>('');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');

  // Step 5 State: AI Copilot Persona & Flip state
  const [copilotPersona, setCopilotPersona] = useState<string>('');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Submitting transition state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Is Option 4 ('career-alignment') selected in Step 4?
  const hasCareerAlignment = useMemo(() => {
    return feedbackStages.includes('career-alignment');
  }, [feedbackStages]);

  // Total steps: 6 if Career Alignment is selected, 5 if not triggered
  const totalSteps = useMemo(() => {
    return hasCareerAlignment ? 6 : 5;
  }, [hasCareerAlignment]);

  // Current step number for progress bar (1 to totalSteps)
  const stepNumber = useMemo(() => {
    switch (pageStage) {
      case 'step-1': return 1;
      case 'step-2': return 2;
      case 'step-3': return 3;
      case 'step-4': return 4;
      case 'step-4-career': return 5;
      case 'step-5': return hasCareerAlignment ? 6 : 5;
      default: return 0;
    }
  }, [pageStage, hasCareerAlignment]);

  // Dynamic career role preset chips mapping based on Step 2 major (7-8 options per discipline)
  const dynamicCareerPresets = useMemo(() => {
    const field = (fieldOfStudy || majorSearchInput).toLowerCase();
    if (field.includes('design') || field.includes('hci') || field.includes('ux')) {
      return ['Product Designer', 'UX Researcher', 'Interaction Designer', 'Design Strategist', 'CMF Specialist', 'Service Designer', 'Creative Director'];
    }
    if (field.includes('computer') || field.includes('mechanical') || field.includes('eng') || field.includes('software')) {
      return ['Software Engineer', 'Product Manager', 'Robotics Engineer', 'Systems Architect', 'Hardware PM', 'AI Engineer', 'Frontend Specialist'];
    }
    if (field.includes('business') || field.includes('strategy') || field.includes('finance')) {
      return ['Product Manager', 'Strategy Consultant', 'Business Analyst', 'Venture Analyst', 'Operations Lead', 'Marketing Strategist', 'Financial Analyst'];
    }
    if (field.includes('data') || field.includes('bio') || field.includes('analytics')) {
      return ['Data Scientist', 'AI Researcher', 'Data Engineer', 'Quantitative Analyst', 'ML Engineer', 'Bio-Tech Analyst', 'BI Specialist'];
    }
    return ['Product Designer', 'Product Manager', 'UX Researcher', 'Software Engineer', 'Data Analyst', 'Strategy Consultant', 'Creative Director'];
  }, [fieldOfStudy, majorSearchInput]);

  // Filtered Combobox Suggestion List for Step 2
  const filteredMajors = useMemo(() => {
    if (!majorSearchInput.trim()) return PRESET_MAJORS;
    return PRESET_MAJORS.filter(m => m.toLowerCase().includes(majorSearchInput.toLowerCase()));
  }, [majorSearchInput]);

  // Step Validation Logic
  const canProceedStep1 = academicLevel !== '';
  const canProceedStep2 = fieldOfStudy !== '' || majorSearchInput.trim() !== '';
  const canProceedStep3 = deliverableDomains.length > 0;
  const canProceedStep4 = feedbackStages.length > 0;
  const canProceedStep4Career = targetCareerRole !== '' || customRoleInput.trim() !== '';
  const canProceedStep5 = copilotPersona !== '';

  const goToStage = (nextStage: PageStage, dir: number = 1) => {
    setDirection(dir);
    setPageStage(nextStage);
  };

  // Sign In submit handler: Directly logs in as Existing User
  const handleLoginExistingUser = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      loginAsExistingUser();
    }, 450);
  };

  // Sign Up form submit handler: Begins Step 1 of Onboarding
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      goToStage('step-1', 1);
    }, 450);
  };

  // Quick shortcut for Continue with (Google, Apple, Microsoft): Bypasses Q&A steps directly to default New User interface
  const handleQuickNewUserLogin = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      loginAsNewOnboardedUser({
        email: 'alex.chen@university.edu',
        academicLevel: 'Postgraduate',
        fieldOfStudy: 'Design Engineering',
        deliverableDomains: ['creative-design'],
        feedbackStages: ['formative-feedback', 'summative-evaluation', 'career-alignment'],
        targetCareerRole: 'Product Manager',
        copilotPersona: 'action-coach'
      });
    }, 450);
  };

  const handleNext = () => {
    if (pageStage === 'step-1') {
      goToStage('step-2', 1);
    } else if (pageStage === 'step-2') {
      goToStage('step-3', 1);
    } else if (pageStage === 'step-3') {
      goToStage('step-4', 1);
    } else if (pageStage === 'step-4') {
      if (hasCareerAlignment) {
        goToStage('step-4-career', 1);
      } else {
        goToStage('step-5', 1);
      }
    } else if (pageStage === 'step-4-career') {
      goToStage('step-5', 1);
    } else if (pageStage === 'step-5' && canProceedStep5) {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (pageStage === 'step-5') {
      if (hasCareerAlignment) {
        goToStage('step-4-career', -1);
      } else {
        goToStage('step-4', -1);
      }
    } else if (pageStage === 'step-4-career') {
      goToStage('step-4', -1);
    } else if (pageStage === 'step-4') {
      goToStage('step-3', -1);
    } else if (pageStage === 'step-3') {
      goToStage('step-2', -1);
    } else if (pageStage === 'step-2') {
      goToStage('step-1', -1);
    } else if (pageStage === 'step-1') {
      goToStage('login', -1);
    }
  };

  // Completion handler: Enters New Onboarded User Branch with surveyed preferences
  const handleComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      loginAsNewOnboardedUser({
        email: email || 'alex.chen@university.edu',
        academicLevel: academicLevel || 'Postgraduate',
        fieldOfStudy: fieldOfStudy || majorSearchInput || 'Design Engineering',
        deliverableDomains: deliverableDomains.length > 0 ? deliverableDomains : ['creative-design'],
        feedbackStages: feedbackStages.length > 0 ? feedbackStages : ['formative-feedback', 'summative-evaluation', 'career-alignment'],
        targetCareerRole: hasCareerAlignment ? (targetCareerRole || customRoleInput || 'Product Manager') : 'Product Manager',
        copilotPersona: copilotPersona as any
      });
    }, 800);
  };

  return (
    /* fixed inset-0 z-50 Fullscreen Viewport Canvas (My Archive Cyan/Slate Palette) */
    <div className="fixed inset-0 z-50 bg-slate-50 bg-gradient-to-br from-cyan-50/30 via-slate-50 to-indigo-50/20 flex flex-col justify-between items-center p-2 sm:p-4 select-none overflow-y-auto custom-scrollbar">
      
      {/* Spacer top */}
      <div className="h-1" />

      {/* ======================================================== */}
      {/* ANIMATED ROOT CONTAINER: MODAL CARD (AUTH) vs AIRY PAGE (Q&A) */}
      {/* ======================================================== */}
      <main className="w-full my-auto flex flex-col justify-center items-center relative py-2">
        <AnimatePresence mode="popLayout">
          
          {/* ===================================================== */}
          {/* STATE A: AUTH MODAL CARD (stepNumber === 0) */}
          {/* ===================================================== */}
          {stepNumber === 0 && (
            <motion.div
              key="auth-modal-wrapper"
              initial={{ opacity: 0, x: direction < 0 ? -240 : 0, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -240, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-10 min-h-[500px] flex flex-col justify-between relative overflow-hidden"
            >
              <AnimatePresence custom={direction} mode="popLayout">
                {/* LOG IN PAGE */}
                {pageStage === 'login' && (
                  <motion.div
                    key="login-page"
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col gap-6 max-w-md mx-auto w-full my-auto py-2"
                  >
                    <div className="text-center flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] shadow-blue-500/25 flex items-center justify-center text-white shadow-md mb-1">
                        <Library className="w-7 h-7" />
                      </div>
                      
                      <h2 className="text-2xl font-sf-pro font-bold text-slate-900 tracking-tight">
                        Welcome to Scaffold
                      </h2>
                      <p className="text-xs text-slate-500 font-body leading-relaxed max-w-sm mx-auto">
                        Sign in to access your feedback insights and long-term repository.
                      </p>
                    </div>

                    <form onSubmit={handleLoginExistingUser} className="flex flex-col gap-4">
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

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
                            placeholder="••••••••••••"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full mt-2 py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-sf-pro font-bold transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isAuthLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Sign In</span>
                        )}
                      </button>
                    </form>

                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10.5px] font-sf-pro font-semibold text-slate-400">
                        Or continue with
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleQuickNewUserLogin()}
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
                        type="button"
                        onClick={() => handleQuickNewUserLogin()}
                        className="py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-heading font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.88-1.01 3 .1.01 2.22-.55 2.9-1.37z" />
                        </svg>
                        <span>Apple</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickNewUserLogin()}
                        className="py-2.5 px-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-heading font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H1z" />
                        </svg>
                        <span>Microsoft</span>
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <span className="text-xs font-heading text-slate-500">
                        Don't have an account?{" "}
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStage('signup', 1)}
                        className="text-xs font-heading font-extrabold text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer ml-0.5"
                      >
                        Sign Up
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* SIGN UP PAGE */}
                {pageStage === 'signup' && (
                  <motion.div
                    key="signup-page"
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col gap-6 max-w-md mx-auto w-full my-auto py-2 relative"
                  >
                    <div className="flex items-center justify-between w-full">
                      <button
                        type="button"
                        onClick={() => goToStage('login', -1)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                      <div />
                    </div>

                    <div className="text-center flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] shadow-blue-500/25 flex items-center justify-center text-white shadow-md mb-1">
                        <Library className="w-7 h-7" />
                      </div>
                      
                      <h2 className="text-2xl font-sf-pro font-bold text-slate-900 tracking-tight">
                        Create your Scaffold account
                      </h2>
                    </div>

                    <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-heading font-extrabold text-slate-700">
                          Full Name
                        </label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Chen"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

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
                            placeholder="••••••••••••"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-heading font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full mt-2 py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-sf-pro font-bold transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isAuthLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center pt-1">
                      <span className="text-xs font-heading text-slate-500">
                        Already have an account?{" "}
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStage('login', -1)}
                        className="text-xs font-heading font-extrabold text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer ml-0.5"
                      >
                        Log In
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===================================================== */}
          {/* STATE B: SPACIOUS Q&A PAGE LAYOUT (stepNumber > 0) */}
          {/* Expanded Height & Pushed Header / Footer to Top & Bottom */}
          {/* ===================================================== */}
          {stepNumber > 0 && (
            <motion.div
              key="qa-page-layout-wrapper"
              initial={{ opacity: 0, x: 240 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 240 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="w-full max-w-2xl sm:max-w-3xl h-[620px] sm:h-[660px] my-auto py-2 sm:py-3 px-4 sm:px-8 flex flex-col justify-between relative overflow-hidden"
            >
              {/* ---------------------------------------------------- */}
              {/* TOP REGION: ANCHORED HEADER BAR (PUSHED TO VERY TOP) */}
              {/* ---------------------------------------------------- */}
              <div className="flex-shrink-0 flex items-center justify-between pb-2.5 mb-1 border-b border-slate-200/60 relative z-20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] shadow-blue-500/20 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <Library className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col justify-center gap-0.5">
                    <span className="text-sm font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                      Scaffold
                    </span>
                    <span className="text-[11px] font-sf-pro font-medium text-slate-400 leading-snug">
                      Onboarding Guide
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Slim Flat Dynamic Progress Bar */}
                  <div className="w-32 sm:w-44 h-1.5 bg-slate-200/90 rounded-full overflow-hidden" title={`Progress: ${Math.round((stepNumber / totalSteps) * 100)}%`}>
                    <motion.div
                      className="h-full bg-cyan-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      loginAsExistingUser();
                      setRoute('workbench');
                    }}
                    className="text-xs font-heading font-bold text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    Exit
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* MIDDLE REGION: EXPANDED QUESTION CONTENT */}
              {/* ---------------------------------------------------- */}
              <div className="flex-1 flex flex-col justify-center my-auto relative overflow-hidden py-3 sm:py-4">
                <AnimatePresence custom={direction} mode="popLayout">
                  {/* STEP 1: ACADEMIC STANDING (Toggle Deselect Support) */}
                  {pageStage === 'step-1' && (
                    <motion.div
                      key="step-1-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-8 sm:gap-9 py-1 max-w-xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-xl sm:text-2xl font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          Select your current academic standing
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          Help us tailor feedback depth and expectations to your educational level.
                        </p>
                      </div>

                      {/* Balanced option pills width (360px max width) with pr-6 padding */}
                      <div className="flex flex-col gap-3.5 max-w-[360px] sm:max-w-[380px] mx-auto w-full">
                        {[
                          { id: 'Undergraduate', icon: GraduationCap, label: 'Undergraduate' },
                          { id: 'Postgraduate', icon: BookOpen, label: 'Postgraduate' },
                          { id: 'Other', icon: User, label: 'Other Learners' }
                        ].map(item => {
                          const isSelected = academicLevel === item.id;
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAcademicLevel(prev => prev === item.id ? '' : item.id)}
                              className={`py-3.5 pl-5 pr-6 rounded-2xl text-left transition-all cursor-pointer border flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-cyan-50/30 border-cyan-500 text-slate-900 shadow-xs ring-1 ring-cyan-500/30 font-bold'
                                  : 'bg-white/90 border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-white font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  <IconComponent className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <span className="text-xs sm:text-sm font-sf-pro font-bold">{item.label}</span>
                              </div>
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isSelected ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: PRIMARY FIELD OF STUDY (Toggle Deselect Support) */}
                  {pageStage === 'step-2' && (
                    <motion.div
                      key="step-2-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-8 sm:gap-9 py-1 max-w-xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-xl sm:text-2xl font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          What is your primary field of study?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          We customize feedback rubrics, terminology, and benchmarks for your discipline.
                        </p>
                      </div>

                      <div className="flex flex-col gap-4 relative max-w-md sm:max-w-lg mx-auto w-full">
                        <div className="relative">
                          <div className="relative flex items-center">
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                            <input
                              type="text"
                              value={majorSearchInput}
                              onFocus={() => setIsMajorDropdownOpen(true)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMajorSearchInput(val);
                                setFieldOfStudy(val);
                                setIsMajorDropdownOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const customVal = majorSearchInput.trim();
                                  if (customVal) {
                                    setFieldOfStudy(customVal);
                                    setMajorSearchInput(customVal);
                                    setIsMajorDropdownOpen(false);
                                  }
                                }
                              }}
                              placeholder="Search major or type custom field..."
                              className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-heading font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setIsMajorDropdownOpen(!isMajorDropdownOpen)}
                              className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isMajorDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {isMajorDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto p-2 flex flex-col gap-1">
                              {filteredMajors.map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    if (fieldOfStudy === m) {
                                      setFieldOfStudy('');
                                      setMajorSearchInput('');
                                    } else {
                                      setFieldOfStudy(m);
                                      setMajorSearchInput(m);
                                    }
                                    setIsMajorDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                    fieldOfStudy === m ? 'bg-cyan-50 text-cyan-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{m}</span>
                                  {fieldOfStudy === m && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                                </button>
                              ))}

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
                                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-heading font-extrabold text-cyan-600 bg-cyan-50/50 hover:bg-cyan-50 transition-colors flex items-center justify-between cursor-pointer border border-dashed border-cyan-200"
                                >
                                  <span>Add custom field: "{majorSearchInput.trim()}"</span>
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2.5 items-center text-center pt-1 max-w-xl mx-auto w-full">
                          <span className="text-xs font-sf-pro font-semibold text-slate-400">
                            Popular Disciplines:
                          </span>
                          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto w-full">
                            {QUICK_MAJOR_CHIPS.map(chip => {
                              const isSelected = fieldOfStudy === chip || majorSearchInput === chip;
                              return (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => {
                                    if (fieldOfStudy === chip || majorSearchInput === chip) {
                                      setFieldOfStudy('');
                                      setMajorSearchInput('');
                                    } else {
                                      setFieldOfStudy(chip);
                                      setMajorSearchInput(chip);
                                    }
                                    setIsMajorDropdownOpen(false);
                                  }}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-sf-pro font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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

                  {/* STEP 3: DELIVERABLE ARTIFACT DOMAINS (Toggles Off on Re-click) */}
                  {pageStage === 'step-3' && (
                    <motion.div
                      key="step-3-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-7 sm:gap-8 py-1 max-w-xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-lg sm:text-[21px] font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          What forms of deliverables do your
                          <br className="hidden sm:inline" />
                          project-based learning usually involve?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          Select the artifact types you produce to customize analysis frameworks.
                        </p>
                      </div>

                      {/* Vertically stacked 5 options in 1 column */}
                      <div className="flex flex-col gap-2.5 max-w-[440px] sm:max-w-[460px] mx-auto w-full">
                        {[
                          { id: 'creative-design', icon: Palette, title: 'Creative Design & Prototypes' },
                          { id: 'papers-reports', icon: FileText, title: 'Papers, Reports & Essays' },
                          { id: 'software-code', icon: Cpu, title: 'Software Code & Technical Systems' },
                          { id: 'data-analytical', icon: BarChart3, title: 'Data & Analytical Dashboards' },
                          { id: 'pitch-decks', icon: TrendingUp, title: 'Pitch Decks & Strategy Frameworks' }
                        ].map(item => {
                          const isSelected = deliverableDomains.includes(item.id);
                          const IconComponent = item.icon;
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
                              className={`py-3 pl-5 pr-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-cyan-50/30 border-cyan-500 text-slate-900 shadow-xs ring-1 ring-cyan-500/30 font-bold'
                                  : 'bg-white/90 border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-white font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  <IconComponent className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-sf-pro font-bold text-slate-900">
                                  {item.title}
                                </h4>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-cyan-500 border-cyan-500 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: FEEDBACK FOCUS & OUTCOMES (Toggles Off on Re-click) */}
                  {pageStage === 'step-4' && (
                    <motion.div
                      key="step-4-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-7 sm:gap-8 py-1 max-w-xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-lg sm:text-[21px] font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          Which stages of feedback and outcome synthesis
                          <br className="hidden sm:inline" />
                          do you value the most?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          Select your key priorities for tracking growth, synthesis, and competency.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2.5 max-w-[440px] sm:max-w-[460px] mx-auto w-full">
                        {[
                          { id: 'formative-feedback', icon: RefreshCw, title: 'Formative Feedback in Progress' },
                          { id: 'summative-assessment', icon: Award, title: 'Summative Assessment at Completion' },
                          { id: 'knowledge-notes', icon: BookMarked, title: 'Knowledge Repository & Long-term Plans' },
                          { id: 'career-alignment', icon: Target, title: 'Target Career Competency Alignment' }
                        ].map(item => {
                          const isSelected = feedbackStages.includes(item.id);
                          const IconComponent = item.icon;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setFeedbackStages(prev =>
                                  prev.includes(item.id)
                                    ? prev.filter(s => s !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                              className={`py-3 pl-5 pr-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-cyan-50/30 border-cyan-500 text-slate-900 shadow-xs ring-1 ring-cyan-500/30 font-bold'
                                  : 'bg-white/90 border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-white font-bold'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  <IconComponent className="w-4 h-4 stroke-[2.2]" />
                                </div>
                                <h4 className="text-xs sm:text-sm font-sf-pro font-bold text-slate-900">
                                  {item.title}
                                </h4>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-cyan-500 border-cyan-500 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4-CAREER: TARGET CAREER ROLE BENCHMARK (Toggle Deselect Support) */}
                  {pageStage === 'step-4-career' && (
                    <motion.div
                      key="step-4-career-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-6 sm:gap-7 py-1 max-w-xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-xl sm:text-2xl font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          What is your target career goal or role?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          We map your academic feedback against industry expectations for this position.
                        </p>
                      </div>

                      {/* 1. Centered input field with grey centered placeholder prompt */}
                      <div className="max-w-md mx-auto w-full">
                        <input
                          type="text"
                          value={customRoleInput || targetCareerRole}
                          onChange={(e) => {
                            setCustomRoleInput(e.target.value);
                            setTargetCareerRole(e.target.value);
                          }}
                          placeholder="Type your target career role here..."
                          className="w-full py-3 px-5 bg-white border border-slate-200 focus:border-cyan-500 rounded-2xl text-xs sm:text-sm font-heading font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xs text-center"
                        />
                      </div>

                      {/* 2. Inferred preset role chips */}
                      <div className="flex flex-col gap-2.5 items-center text-center max-w-xl mx-auto w-full">
                        <span className="text-xs font-sf-pro font-semibold text-slate-400">
                          Or select a recommended role for {fieldOfStudy || 'your discipline'}:
                        </span>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-xl mx-auto w-full">
                          {dynamicCareerPresets.map(role => {
                            const isRoleSelected = targetCareerRole === role;
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  if (targetCareerRole === role) {
                                    setTargetCareerRole('');
                                    setCustomRoleInput('');
                                  } else {
                                    setTargetCareerRole(role);
                                    setCustomRoleInput(role);
                                  }
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-sf-pro font-bold transition-all cursor-pointer border ${
                                  isRoleSelected
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                    : 'bg-white/90 text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-white'
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => {
                              if (targetCareerRole === 'Still Exploring') {
                                setTargetCareerRole('');
                                setCustomRoleInput('');
                              } else {
                                setTargetCareerRole('Still Exploring');
                                setCustomRoleInput('Still Exploring');
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-heading transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
                              targetCareerRole === 'Still Exploring'
                                ? 'bg-cyan-500 text-white border-cyan-500 font-extrabold shadow-2xs'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/80 font-bold'
                            }`}
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Still Exploring</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Bottom note in clean non-bold font */}
                      <div className="text-center pt-2">
                        <span className="text-xs sm:text-sm font-heading font-medium text-slate-400">
                          * You can change or update your target role anytime inside the platform workbench.
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: ASSISTANT PERSONA (Toggle Deselect Support) */}
                  {pageStage === 'step-5' && (
                    <motion.div
                      key="step-5-page"
                      custom={direction}
                      variants={pageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="flex flex-col gap-5 sm:gap-6 py-1 max-w-2xl sm:max-w-3xl mx-auto w-full"
                    >
                      <div className="flex flex-col gap-1.5 text-center">
                        <h2 className="text-lg sm:text-[21px] font-sf-pro font-bold text-slate-900 tracking-tight leading-snug">
                          What is your preferred assistant persona
                          <br className="hidden sm:inline" />
                          and communication style for your learning?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-body leading-relaxed">
                          Select a companion style that best aligns with how you like to engage, reflect, and grow.
                        </p>
                      </div>

                      {/* Horizontal 3-column interactive 3D Flip Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-2xl sm:max-w-3xl mx-auto w-full">
                        {[
                          {
                            id: 'action-coach',
                            icon: Target,
                            title: 'Direct Action Coach',
                            description: 'Clear, solution-driven feedback with prioritized next steps',
                            example: '"Let\'s focus straight on the main priority: your sample size needs expanding. Here is your quick 2-step fix to satisfy the rubric..."'
                          },
                          {
                            id: 'empathetic-mentor',
                            icon: Sparkles,
                            title: 'Empathetic Mentor',
                            description: 'Warm, encouraging feedback highlighting strengths & growth',
                            example: '"You have a great conceptual foundation! To make your argument unbeatable, try interviewing 3 more users to turn intuition into solid proof."'
                          },
                          {
                            id: 'thinking-challenger',
                            icon: Lightbulb,
                            title: 'Thinking Challenger',
                            description: 'Probing questions & prompts to deepen independent thinking',
                            example: '"The reviewer questioned your sample size, which could undermine your user needs analysis. If asked to defend this in a review, how would you justify your sample choice?"'
                          }
                        ].map(item => {
                          const isSelected = copilotPersona === item.id;
                          const isFlipped = !!flippedCards[item.id];
                          const IconComponent = item.icon;

                          return (
                            <div
                              key={item.id}
                              onClick={() => setFlippedCards(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="relative h-[245px] sm:h-[260px] w-full cursor-pointer perspective-[1000px]"
                            >
                              <motion.div
                                className="w-full h-full relative"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                                style={{ transformStyle: 'preserve-3d' }}
                              >
                                {/* FRONT FACE */}
                                <div
                                  style={{ backfaceVisibility: 'hidden' }}
                                  className={`absolute inset-0 p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-cyan-50/30 border-cyan-500 text-slate-900 shadow-xs ring-1 ring-cyan-500/30'
                                      : 'bg-white/90 border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                      <IconComponent className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>

                                    {/* Unified Rounded Square Checkbox */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCopilotPersona(prev => prev === item.id ? '' : item.id);
                                      }}
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                                        isSelected
                                          ? 'bg-cyan-500 border-cyan-500 text-white'
                                          : 'border-slate-300 bg-white hover:border-cyan-400'
                                      }`}
                                      title={isSelected ? 'Click to unselect persona' : 'Click to select persona'}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  </div>

                                  <div className="flex flex-col gap-2 my-auto">
                                    {/* Prominent Original Card Title (Black & Bold) */}
                                    <h3 className="text-[15px] sm:text-base font-sf-pro font-bold text-slate-900 leading-tight">
                                      {item.title}
                                    </h3>
                                    {/* Uniform 12px normal description text */}
                                    <p className="text-xs font-normal text-slate-600 leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 text-xs font-normal text-slate-400 text-center">
                                    Flip to view example
                                  </div>
                                </div>

                                {/* BACK FACE */}
                                <div
                                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                  className={`absolute inset-0 p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                                    isSelected
                                      ? 'bg-cyan-50/30 border-cyan-500 text-slate-900 shadow-xs ring-1 ring-cyan-500/30'
                                      : 'bg-white/90 border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-sf-pro font-semibold text-cyan-600">
                                      Sample Response
                                    </span>

                                    {/* Unified Rounded Square Checkbox (rounded-md with Toggle Deselect) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCopilotPersona(prev => prev === item.id ? '' : item.id);
                                      }}
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                                        isSelected
                                          ? 'bg-cyan-500 border-cyan-500 text-white'
                                          : 'border-slate-300 bg-white hover:border-cyan-400'
                                      }`}
                                      title={isSelected ? 'Click to unselect persona' : 'Click to select persona'}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  </div>

                                  {/* Uniform 12px normal sample response text (no bold, no italic) */}
                                  <p className="text-xs font-normal text-slate-700 leading-relaxed my-auto">
                                    {item.example}
                                  </p>

                                  <div className="pt-2 border-t border-slate-100 text-xs font-normal text-slate-400 text-center">
                                    Flip back to overview
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom note in clean non-bold font for Step 5 */}
                      <div className="text-center pt-1">
                        <span className="text-xs sm:text-sm font-heading font-medium text-slate-400">
                          * You can change or update your AI Assistant style anytime inside the platform workbench.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------------------------------------------- */}
              {/* BOTTOM REGION: ANCHORED NAVIGATION (PUSHED TO VERY BOTTOM) */}
              {/* ---------------------------------------------------- */}
              <div className="flex-shrink-0 pt-2.5 mt-1 border-t border-slate-200/60 flex items-center justify-between relative z-20">
                {stepNumber > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2.5 rounded-xl text-xs font-heading font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goToStage('login', -1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-heading font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Auth Page</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (pageStage === 'step-1' && !canProceedStep1) ||
                    (pageStage === 'step-2' && !canProceedStep2) ||
                    (pageStage === 'step-3' && !canProceedStep3) ||
                    (pageStage === 'step-4' && !canProceedStep4) ||
                    (pageStage === 'step-4-career' && !canProceedStep4Career) ||
                    (pageStage === 'step-5' && !canProceedStep5) ||
                    isSubmitting
                  }
                  className="px-6 py-3 rounded-xl text-xs font-sf-pro font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-900"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{pageStage === 'step-5' ? 'Enter the Platform' : 'Next'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Branding Subtext */}
      <footer className="py-2 text-center text-[11px] font-heading font-bold text-slate-400">
        © 2026 Scaffold AI Feedback Platform • Academic Competency Framework
      </footer>
    </div>
  );
};

export default AuthOnboardingView;
