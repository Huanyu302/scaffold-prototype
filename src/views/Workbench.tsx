import React, { useState, useEffect } from 'react';
import { Library, RefreshCw, BookMarked, Compass, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Workbench: React.FC = () => {
  const { setRoute, setActiveRightTab, userProfile } = useAppStore();
  const [animateEntry, setAnimateEntry] = useState(false);

  const isNewUser = userProfile.userFlowMode === 'new-onboarded';

  // Trigger smooth page entry animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateEntry(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleContinueActiveDraft = () => {
    const store = useAppStore.getState();
    if (!store.isLaunched) {
      useAppStore.setState({ isLaunched: true });
    }
    setRoute('formative-sandbox');
  };

  const handleBrowseNotes = () => {
    setRoute('global-competency');
  };

  const handleDiscussLongTermPlans = () => {
    setRoute('global-competency');
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-center items-center p-6 bg-slate-50 transition-all duration-700 ease-out ${
        animateEntry ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center gap-6">
        
        {/* Minimalist Top Welcome Card */}
        <div className="w-full p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur-md shadow-xs flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-400">
          
          {/* Brand Icon Logo matching the top-left ActivityBar logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] shadow-blue-500/25 flex items-center justify-center text-white shadow-md group hover:scale-105 transition-transform mb-0.5">
            <Library className="w-7 h-7" />
          </div>

          {/* Platform Name, Subtitle, and Single-Wrap Grey Text */}
          <div className="flex flex-col items-center gap-1.5 font-sf-pro">
            {/* Platform Name */}
            <h1 className="text-3xl sm:text-4xl font-sf-pro font-bold text-slate-900 tracking-tight">
              Scaffold
            </h1>

            {/* Subtitle */}
            <h2 className="text-sm sm:text-base font-sf-pro font-semibold text-[#00A3C4] tracking-tight">
              Your Intelligent Feedback Copilot
            </h2>

            {/* Smaller Grey Body Text (Wraps exactly once into 2 lines) */}
            <p className="font-sf-pro text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed mt-1">
              A premium space designed to process academic feedback, stimulate critical self-reflection, and develop long-term growth.
            </p>
          </div>

        </div>

        {/* 3 Action Recommendation Cards Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          
          {/* Card 1: Continue Active Draft */}
          <div
            onClick={handleContinueActiveDraft}
            className="p-5 rounded-2xl bg-white/90 border border-slate-200/90 hover:border-cyan-500/80 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-4 font-sf-pro"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                <RefreshCw className="w-5 h-5 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-sf-pro font-bold text-slate-900 leading-snug">
                Continue Active Draft
              </h3>
              <p className="text-[11px] font-sf-pro font-normal text-slate-500 leading-relaxed">
                Resume formative feedback review and logical verification checkers for ongoing drafts.
              </p>
            </div>
          </div>

          {/* Card 2: Browse My Notes */}
          <div
            onClick={handleBrowseNotes}
            className="p-5 rounded-2xl bg-white/90 border border-slate-200/90 hover:border-indigo-500/80 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-4 font-sf-pro"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <BookMarked className="w-5 h-5 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-sf-pro font-bold text-slate-900 leading-snug">
                Browse My Notes
              </h3>
              <p className="text-[11px] font-sf-pro font-normal text-slate-500 leading-relaxed">
                Access compiled reflection insights, action plans, and literature notes repository.
              </p>
            </div>
          </div>

          {/* Card 3: Discuss Long-Term Plans */}
          <div
            onClick={handleDiscussLongTermPlans}
            className="p-5 rounded-2xl bg-white/90 border border-slate-200/90 hover:border-amber-500/80 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between gap-4 font-sf-pro"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-sf-pro font-bold text-slate-900 leading-snug">
                Discuss Long-Term Plans
              </h3>
              <p className="text-[11px] font-sf-pro font-normal text-slate-500 leading-relaxed">
                Engage with your AI copilot to outline, refine, and action your long-term goals.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Workbench;
