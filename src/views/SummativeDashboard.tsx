import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, FileText, FileInput, Loader2, AlertCircle, GraduationCap, Layers, ChevronUp, ChevronDown, MessageSquare, BookOpen, X, CheckCircle2, FolderOpen, Plus, Rocket, Pencil, Check } from 'lucide-react';
import { useAppStore, compileMaterialTexts, SummativeAcademicRecommendation, SummativeAdvancedExploration } from '../store/useAppStore';
import { RadarChartWrapper } from '../components/deconstruct/RadarChartWrapper';
import { ScoreBarGroup } from '../components/deconstruct/ScoreBarGroup';
import { OriginalTextPanel } from '../components/deconstruct/OriginalTextPanel';
import { DocumentViewer } from '../components/deconstruct/DocumentViewer';
import { FreeformCopilotChat } from '../components/chat/FreeformCopilotChat';
import { processSummativeFeedback, generateMockSummativeParsedResponse, alignGlobalSummaryWithGrade, calculateWeightedGrade } from '../utils/geminiService';

const getContributionRange = (scoreStr: string, weightPct: number) => {
  const clean = scoreStr.toLowerCase();
  let min = 0;
  let max = 100;
  let isRange = false;

  const rangeMatch = /(\d+)\s*-\s*(\d+)/.exec(clean);
  if (rangeMatch) {
    min = parseInt(rangeMatch[1]);
    max = parseInt(rangeMatch[2]);
    isRange = true;
  } else {
    const ltMatch = /<\s*(\d+)/.exec(clean);
    if (ltMatch) {
      min = 0;
      max = parseInt(ltMatch[1]);
      isRange = true;
    } else {
      const numMatch = /(\d+)/.exec(clean);
      if (numMatch) {
        min = parseInt(numMatch[1]);
        max = min;
        isRange = false;
      } else {
        if (clean.includes('excellent') || clean.includes('distinction') || clean.includes('outstanding') || clean.includes('a')) {
          min = 80; max = 90; isRange = true;
        } else if (clean.includes('very good') || clean.includes('good') || clean.includes('merit') || clean.includes('b')) {
          min = 60; max = 70; isRange = true;
        } else if (clean.includes('satisfactory') || clean.includes('pass') || clean.includes('c') || clean.includes('d')) {
          min = 50; max = 60; isRange = true;
        } else {
          min = 35; max = 45; isRange = true;
        }
      }
    }
  }

  const contribMin = (weightPct / 100) * min;
  const contribMax = (weightPct / 100) * max;
  const scorePercentage = isRange ? (min + max) / 2 : min;
  const contribSingle = (weightPct / 100) * scorePercentage;

  return {
    isRange,
    scoreMin: min,
    scoreMax: max,
    contribMin,
    contribMax,
    contribSingle,
    scorePercentage
  };
};

export const SummativeDashboard: React.FC = () => {
  const {
    activeProject,
    summativeFeedbackData,
    highlightedTextRange,
    savedNotes,
    addNote,
    removeNote,
    savedPlans,
    addPlan,
    removePlan,
    setRoute,
    setHighlightedTextRange,
    setSummativeFeedbackData,
    hasUnreadChatNotification,
    setHasUnreadChatNotification
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [finalGrade, setFinalGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showMaterialReminder, setShowMaterialReminder] = useState(false);
  const [showSummativeInputValidationError, setShowSummativeInputValidationError] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<'transcript' | 'chatbox' | 'document' | 'input'>('chatbox');
  const [outcomeFilter, setOutcomeFilter] = useState<'good' | 'bad' | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'briefing' | 'longterm'>('briefing');

  useEffect(() => {
    if (activeRightTab === 'chatbox') {
      setHasUnreadChatNotification(false);
    }
  }, [activeRightTab, setHasUnreadChatNotification]);

  const academicInsightsRef = React.useRef<HTMLDivElement>(null);
  const futureExplorationsRef = React.useRef<HTMLDivElement>(null);
  const firstKeyPointRef = React.useRef<HTMLDivElement>(null);

  // Card edit states
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingTag, setEditingTag] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [cardOverrides, setCardOverrides] = useState<Record<string, { title?: string; tag?: string; content?: string }>>({});

  // Custom Transferable Entry states (Note vs Plan switchable pills)
  const [customType, setCustomType] = useState<'note' | 'plan'>('note');
  const [customTitle, setCustomTitle] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [addedSuccessToast, setAddedSuccessToast] = useState<string | null>(null);

  // Guide Action temporary highlight flashing states
  const [isFlashingBriefingBtn, setIsFlashingBriefingBtn] = useState<boolean>(false);
  const [isFlashingAddNoteBtn, setIsFlashingAddNoteBtn] = useState<boolean>(false);
  const [isFlashingAddPlanBtn, setIsFlashingAddPlanBtn] = useState<boolean>(false);

  const handleAddCustomEntrySubmit = () => {
    const title = customTitle.trim();
    if (!title) return;
    const tag = customTag.trim() || activeProject?.folderTag || 'product design';
    const content = customContent.trim();
    const sourceProjectName = activeProject?.projectName || 'Summative Workspace';
    const addedAt = new Date().toLocaleDateString();

    if (customType === 'note') {
      addNote({
        id: `note-custom-${Date.now()}`,
        title,
        tag,
        keyTakeaway: content || title,
        sourceProjectName,
        addedAt
      });
      setAddedSuccessToast('Note saved to Long-Term Repos!');
    } else {
      addPlan({
        id: `plan-custom-${Date.now()}`,
        title,
        tag,
        suggestedAction: content || title,
        sourceProjectName,
        addedAt
      });
      setAddedSuccessToast('Plan saved to Long-Term Repos!');
    }

    setCustomTitle('');
    setCustomContent('');
    setCustomTag('');
    setTimeout(() => {
      setAddedSuccessToast(null);
    }, 2500);
  };

  React.useEffect(() => {
    if (summativeFeedbackData) {
      setInputText(summativeFeedbackData.originalFeedbackText || '');
      setFinalGrade(summativeFeedbackData.grade || '');
    } else {
      setInputText('');
      setFinalGrade('');
    }
  }, [summativeFeedbackData]);

  const handleBackToWorkbench = () => {
    setRoute('workbench');
  };

  const handleProcessFeedback = async (force = false) => {
    if (!inputText.trim()) {
      setErrorMsg('Please input or paste tutor feedback text first.');
      return;
    }

    const selectedMaterials = (activeProject?.summativeMaterials || []).filter(m => m.selected !== false);
    if (!force && selectedMaterials.length === 0) {
      setShowMaterialReminder(true);
      return;
    }

    setShowMaterialReminder(false);
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(selectedMaterials);
      const parsed = await processSummativeFeedback(inputText, undefined, courseHandbookText, currentAssignmentText, finalGrade.trim());
      parsed.projectId = activeProject?.projectId || '';
      parsed.originalFeedbackText = inputText;

      if (finalGrade.trim()) {
        parsed.grade = finalGrade.trim();
      }
      if (parsed.globalSummary) {
        parsed.globalSummary = alignGlobalSummaryWithGrade(parsed.globalSummary, parsed.grade === '?' ? '' : parsed.grade);
      }

      setSummativeFeedbackData(parsed);
      setIsEditing(false);
      setActiveRightTab('chatbox');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process feedback. Please verify your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-heading font-bold text-slate-800">No Active Project Context Found</h3>
        <p className="text-slate-500 font-body text-xs max-w-xs leading-normal">
          Please select or create an active project workspace first before accessing the summative dashboard.
        </p>
        <button
          onClick={handleBackToWorkbench}
          className="mt-2 py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-heading text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Go to Workbench
        </button>
      </div>
    );
  }

  const handleDimensionHighlight = (start: number, end: number, exactPhrase?: string) => {
    setActiveRightTab('transcript');
    setHighlightedTextRange({ start, end, exactPhrase, timestamp: Date.now() });
  };

  const strengths = summativeFeedbackData?.keyStrengths || [];
  const critiques = summativeFeedbackData?.areasForImprovement || [];


  const getScoreBadgeClass = (scoreStr: string): string => {
    const clean = scoreStr.toLowerCase();

    const distinctionPill = 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
    const meritPill = 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
    const passPill = 'bg-[#FEF7E0] text-[#B06000] border border-[#FDE293] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
    const focusPill = 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';

    // 1. Check numeric range first if present (e.g., "(60-70)" or "88/100")
    const rangeMatch = /(\d+)\s*-\s*(\d+)/.exec(clean);
    if (rangeMatch) {
      const avg = (parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2;
      if (avg >= 70) return distinctionPill;
      if (avg >= 60) return meritPill;
      if (avg >= 50) return passPill;
      return focusPill;
    }

    // 2. Try to parse slash: "85/100"
    const slashMatch = /(\d+)\s*\/\s*(\d+)/.exec(clean);
    if (slashMatch) {
      const pct = (parseInt(slashMatch[1]) / parseInt(slashMatch[2])) * 100;
      if (pct >= 70) return distinctionPill;
      if (pct >= 60) return meritPill;
      if (pct >= 50) return passPill;
      return focusPill;
    }

    // 3. Standalone number check: e.g. "72", "68", "58", "52", "45"
    const numMatch = /(\d+)/.exec(clean);
    if (numMatch) {
      const val = parseInt(numMatch[1]);
      if (val >= 70) return distinctionPill;
      if (val >= 60) return meritPill;
      if (val >= 50) return passPill;
      return focusPill;
    }

    // 4. Comparison operators like "<50"
    if (clean.includes('<50') || clean.includes('< 50') || clean.includes('under 50') || clean.includes('below 50')) {
      return focusPill;
    }
    if (clean.includes('>70') || clean.includes('> 70') || clean.includes('above 70') || clean.includes('>80') || clean.includes('> 80')) {
      return distinctionPill;
    }

    // 5. Level 4: Excellent, Outstanding, Distinction, Exceptional, Superb, Perfect, Brilliant
    const excellentKeywords = ['excellent', 'outstanding', 'distinction', 'exceptional', 'superb', 'perfect', 'brilliant', 'high pass', 'stellar', 'expert', 'mastery', 'first'];
    if (excellentKeywords.some(keyword => clean.includes(keyword))) {
      return distinctionPill;
    }

    // 6. Level 3: Very Good, Good, Merit, Proficient, Solid, Strong, Commendable, Competent
    const goodKeywords = ['very good', 'good', 'merit', 'proficient', 'solid', 'strong', 'commendable', 'competent', 'sound', 'very positive', 'high merit', '2:1', 'upper second'];
    if (goodKeywords.some(keyword => clean.includes(keyword))) {
      return meritPill;
    }

    // 7. Level 2: Satisfactory, Pass, Average, Acceptable, Adequate, Fair, Sufficient, Moderate
    const passKeywords = ['satisfactory', 'pass', 'average', 'acceptable', 'adequate', 'fair', 'sufficient', 'moderate', '2:2', 'lower second', 'third'];
    if (passKeywords.some(keyword => clean.includes(keyword))) {
      return passPill;
    }

    // 8. Level 1: Fail, Poor, Inadequate, Weak, Unacceptable, Unsatisfactory
    const failKeywords = ['fail', 'poor', 'inadequate', 'weak', 'unacceptable', 'unsatisfactory', 'failed', 'focus', 'resit'];
    if (failKeywords.some(keyword => clean.includes(keyword))) {
      return focusPill;
    }

    // 9. Letter grades B, A, C, D
    const gradeLetterMatch = /\b([a-f])\s*([+\-])?\b/i.exec(clean);
    if (gradeLetterMatch) {
      const letter = gradeLetterMatch[1].toUpperCase();
      if (letter === 'A') return distinctionPill;
      if (letter === 'B') return meritPill;
      if (letter === 'C' || letter === 'D') return passPill;
      return focusPill;
    }

    return 'bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
  };

  const getOverallGradeStyle = (gradeStr: string): { container: string; pulse: string } => {
    const clean = gradeStr.toLowerCase().trim();

    // Check numeric grade value (e.g., "75", "68", "54", "45")
    const numMatch = /(\d+)/.exec(clean);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num >= 70) {
        return {
          container: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
          pulse: 'bg-emerald-400/10'
        };
      }
      if (num >= 60) {
        return {
          container: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
          pulse: 'bg-blue-400/10'
        };
      }
      if (num >= 50) {
        return {
          container: 'bg-[#FEF7E0] text-[#B06000] border border-[#FDE293]',
          pulse: 'bg-amber-400/10'
        };
      }
      return {
        container: 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]',
        pulse: 'bg-rose-400/10'
      };
    }

    if (clean.includes('distinction') || clean.includes('excellent') || clean.includes('outstanding') || clean.includes('green') || clean.includes('a')) {
      if (!clean.includes('fail') && !clean.includes('poor')) {
        return {
          container: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
          pulse: 'bg-emerald-400/10'
        };
      }
    }

    if (clean.includes('merit') || clean.includes('good') || clean.includes('b')) {
      if (!clean.includes('fail') && !clean.includes('poor')) {
        return {
          container: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
          pulse: 'bg-blue-400/10'
        };
      }
    }

    if (clean.includes('pass') || clean.includes('satisfactory') || clean.includes('average') || clean.includes('c') || clean.includes('d')) {
      if (!clean.includes('fail') && !clean.includes('poor')) {
        return {
          container: 'bg-[#FEF7E0] text-[#B06000] border border-[#FDE293]',
          pulse: 'bg-amber-400/10'
        };
      }
    }

    if (clean.includes('fail') || clean.includes('poor') || clean.includes('f') || clean.includes('<50') || clean.includes('under 50')) {
      return {
        container: 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]',
        pulse: 'bg-rose-400/10'
      };
    }

    return {
      container: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
      pulse: 'bg-blue-400/10'
    };
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-50 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 select-none"
    >

      {/* Top Header Bar */}
      {(() => {
        const tagColorMap: Record<string, string> = {
          'product design': '#00A3C4',
          'research': '#10B981',
          'interactive design': '#8B5CF6',
          'innovation strategy': '#F59E0B'
        };

        const rawTag = (activeProject?.folderTag || '').toLowerCase();
        const folderTagColor = activeProject?.tagColor || tagColorMap[rawTag] || '#4F46E5';
        
        const toTitleCase = (str: string) => str.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

        const headerLine1 = activeProject?.folderTag && activeProject?.folderName
          ? `${toTitleCase(activeProject.folderTag)} • ${activeProject.folderName}`
          : (activeProject?.folderName ? `My Archive • ${activeProject.folderName}` : 'My Archive • Project Workspace');

        return (
          <div className="w-full max-w-[1530px] mx-auto flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-3">
              {/* Far left Folder Icon matching Tag Color */}
              <div className="p-2 bg-slate-100/80 rounded-xl border border-slate-200/50 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5" style={{ color: folderTagColor }} />
              </div>

              <div className="flex flex-col justify-start">
                {/* Line 1: Tag Name • Folder Name */}
                <span className="text-[10px] font-sf-pro font-medium text-slate-400 tracking-normal leading-tight">
                  {headerLine1}
                </span>
                {/* Line 2: File Name */}
                <span className="text-base font-sf-pro font-bold text-slate-900 tracking-normal leading-tight mt-0.5">
                  {activeProject?.projectName || 'Draft Project Workspace'}
                </span>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Main Layout Area - 2 Column Grid aligned with Formative Sandbox */}
      <div className="w-full max-w-[1530px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch flex-1 min-h-[600px]">

        {/* LEFT COLUMN: Pending Placeholder OR Hydrated Competency Analytics */}
        <div className={`flex flex-col ${!summativeFeedbackData ? 'gap-6 justify-center min-h-[500px]' : 'h-[calc(100vh-120px)] min-h-[500px]'}`}>
          {!summativeFeedbackData ? (
            /* Left Pending Slate */
            <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col items-center justify-center text-center gap-4 h-full min-h-[500px] font-sf-pro">
              <div className="p-4 bg-blue-50/50 text-blue-500 rounded-2xl">
                <Sparkles className="w-8 h-8 text-brand-summative-primary" />
              </div>
              <h3 className="text-base font-sf-pro font-bold text-slate-800">Evaluation Insights Pending</h3>
              <p className="text-xs text-slate-400 font-sf-pro leading-relaxed max-w-xs">
                Please enter your final feedback on the right to generate performance analytics, transferable insights, and learning plans.
              </p>
            </div>
          ) : (
            /* Left Hydrated Insights Stack */
            <div className="h-full flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">

              {/* Segmented Tab Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex-shrink-0 select-none">
                <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('briefing')}
                    title="Feedback Briefing"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeLeftTab === 'briefing'
                        ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${activeLeftTab === 'briefing' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeLeftTab === 'briefing' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                      Briefing
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('longterm')}
                    title="Transferable Key Insights"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeLeftTab === 'longterm'
                        ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <GraduationCap className={`w-3.5 h-3.5 flex-shrink-0 ${activeLeftTab === 'longterm' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeLeftTab === 'longterm' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                      Transferable Key
                    </span>
                  </button>
                </div>
              </div>

              {/* Contents Viewport */}
              <div className="flex-1 p-4 min-h-0 relative select-none">
                {activeLeftTab === 'briefing' ? (
                <div className="flex flex-col gap-3 h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 scrollbar-thin">
                    {/* Executive Dashboard Overview */}
                    {!isOverviewExpanded ? (
                      /* Collapsed Dashboard Bar */
                      <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-sm h-11 box-border flex items-center justify-between gap-4 flex-shrink-0 hover:bg-white transition-colors duration-200 select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Grade</span>
                          {(() => {
                            const rawGrade = summativeFeedbackData?.grade;
                            const isExplicitGrade = Boolean(rawGrade && rawGrade !== "?" && !summativeFeedbackData?.isAutoCalculated);
                            const computedGrade = calculateWeightedGrade(summativeFeedbackData?.subScores);
                            const effectiveGrade = rawGrade && rawGrade !== "?" ? rawGrade : (computedGrade || "?");
                            const isAICalculated = Boolean(summativeFeedbackData?.isAutoCalculated || (!isExplicitGrade && computedGrade));
                            return (
                              <div className="flex items-center gap-1.5">
                                <div className="inline-flex items-center justify-center bg-blue-50 border border-blue-100 text-brand-summative-primary font-heading font-extrabold text-[10px] px-2 py-0.5 rounded-md select-none whitespace-nowrap">
                                  {effectiveGrade}
                                </div>
                                {isAICalculated && (
                                  <span className="text-[9px] font-sf-pro font-medium text-slate-400 select-none whitespace-nowrap">
                                    (Auto-calculated)
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          onClick={() => setIsOverviewExpanded(true)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-150 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center"
                          title="Expand Overview"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Real Briefing Card */
                      <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm min-h-[160px] h-auto box-border flex flex-col justify-between gap-3.5 flex-shrink-0 hover:bg-white transition-colors duration-200 select-none">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none whitespace-nowrap">Grade</span>
                            {(() => {
                              const rawGrade = summativeFeedbackData?.grade;
                              const isExplicitGrade = Boolean(rawGrade && rawGrade !== "?" && !summativeFeedbackData?.isAutoCalculated);
                              const computedGrade = calculateWeightedGrade(summativeFeedbackData?.subScores);
                              const effectiveGrade = rawGrade && rawGrade !== "?" ? rawGrade : (computedGrade || "?");
                              const isAICalculated = Boolean(summativeFeedbackData?.isAutoCalculated || (!isExplicitGrade && computedGrade));

                              if (effectiveGrade !== "?") {
                                const style = getOverallGradeStyle(effectiveGrade);
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <div className={`inline-flex items-center justify-center font-heading font-extrabold text-xs px-2.5 py-0.5 rounded-full relative overflow-hidden whitespace-nowrap animate-in zoom-in-95 duration-250 ${style.container}`}>
                                      <span className="relative z-10">{effectiveGrade}</span>
                                      <span className={`absolute inset-0 animate-pulse rounded-full pointer-events-none ${style.pulse}`} />
                                    </div>
                                    {isAICalculated && (
                                      <span className="text-[10px] font-sf-pro font-medium text-slate-400 select-none whitespace-nowrap">
                                        (Auto-calculated)
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div className="w-7 h-7 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-xs font-heading font-extrabold text-slate-400 whitespace-nowrap">
                                  ?
                                </div>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-2 select-none">
                            {outcomeFilter !== null && (
                              <button
                                onClick={() => setOutcomeFilter(null)}
                                className="text-[10px] font-sf-pro font-medium text-slate-400 hover:text-rose-500 transition-colors mr-2 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              >
                                <X className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                                <span>Clear filters</span>
                              </button>
                            )}
                            <button
                              onClick={() => setIsOverviewExpanded(false)}
                              className="p-1 text-slate-400 hover:text-slate-655 hover:bg-slate-50 border border-slate-150 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center"
                              title="Collapse Overview"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-slate-100/60 pt-2 flex flex-col gap-1.5 select-text flex-shrink-0">
                          <div className="flex justify-between items-center w-full select-none">
                            <div className="flex items-center gap-1.5 select-none">
                              <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Grade Breakdown</span>
                              {(!summativeFeedbackData.subScores || summativeFeedbackData.subScores.length === 0) && (
                                <span className="text-[11px] font-sf-pro font-normal text-slate-400 select-none">(not mentioned)</span>
                              )}
                            </div>
                          </div>

                          {summativeFeedbackData.subScores && summativeFeedbackData.subScores.length > 0 ? (
                            <div className="flex flex-col gap-1 bg-slate-50/50 border border-slate-100 rounded-lg p-2 animate-in fade-in duration-300">
                              {summativeFeedbackData.subScores.map((scoreItem, sIdx) => (
                                <div key={sIdx} className="flex justify-between items-center gap-3.5 text-[11px] py-1 border-b border-dashed border-slate-100 last:border-b-0">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                    <span className="font-semibold text-slate-700 whitespace-normal break-words leading-relaxed text-left">
                                      {scoreItem.dimension}
                                    </span>
                                    {scoreItem.weight && (
                                      <span className="font-semibold text-slate-700 flex-shrink-0 self-center">
                                        {scoreItem.weight.startsWith('(') ? scoreItem.weight : `(${scoreItem.weight})`}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`font-heading flex-shrink-0 whitespace-nowrap self-center ${getScoreBadgeClass(scoreItem.score)}`}>
                                    {scoreItem.score}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Outcomes Metrics Badges (Interactive Buttons) */}
                        <div className="flex items-center justify-start gap-2.5 w-full border-t border-slate-100/60 pt-2 flex-shrink-0 select-none">
                          <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal mr-1 select-none whitespace-nowrap">Outcomes</span>

                          <button
                            onClick={() => {
                              setOutcomeFilter(outcomeFilter === 'good' ? null : 'good');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold cursor-pointer whitespace-nowrap border ${outcomeFilter === 'good'
                                ? 'border-emerald-400 bg-[#CEEAD6]/60 text-emerald-900 shadow-2xs'
                                : outcomeFilter
                                  ? 'border-emerald-200/30 bg-[#EBF4F0]/40 text-emerald-700/40 opacity-40'
                                  : 'border-emerald-200/60 bg-[#EBF4F0] text-emerald-700'
                              }`}
                            title={outcomeFilter === 'good' ? "Clear filter" : "Filter by Strengths"}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{strengths.length} Strengths</span>
                          </button>

                          <button
                            onClick={() => {
                              setOutcomeFilter(outcomeFilter === 'bad' ? null : 'bad');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold cursor-pointer whitespace-nowrap border ${outcomeFilter === 'bad'
                                ? 'border-amber-400 bg-amber-100/70 text-amber-950 shadow-2xs'
                                : outcomeFilter
                                  ? 'border-amber-200/30 bg-amber-50/30 text-amber-900/40 opacity-40'
                                  : 'border-amber-200/70 bg-amber-50/80 text-amber-900/80'
                              }`}
                            title={outcomeFilter === 'bad' ? "Clear filter" : "Filter by Growth"}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{critiques.length} Growth</span>
                          </button>
                        </div>

                        {/* Bottom Row: globalSummary text container (Flexible Height) */}
                        <div className="border-t border-slate-150 pt-3 select-text flex-shrink-0">
                          <p className="text-[11.5px] text-slate-650 font-sf-pro leading-loose block break-words text-left">
                            {alignGlobalSummaryWithGrade(summativeFeedbackData.globalSummary, summativeFeedbackData.grade === '?' ? '' : summativeFeedbackData.grade)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Key Observations / Insights List (Formative-style layout) */}
                    <div className="flex flex-col gap-2.5 border-t border-slate-150 pt-4 flex-shrink-0">
                      {(() => {
                        const combinedObservations = [
                          ...strengths.map(s => ({ ...s, type: 'good' as const })),
                          ...critiques.map(c => ({ ...c, type: 'bad' as const }))
                        ].sort((a, b) => a.anchor.start - b.anchor.start);

                        const filteredObservations = combinedObservations.filter(item => {
                          if (outcomeFilter === 'good') return item.type === 'good';
                          if (outcomeFilter === 'bad') return item.type === 'bad';
                          return true;
                        });

                        if (filteredObservations.length === 0) {
                          return (
                            <span className="text-[9.5px] font-heading font-semibold text-slate-455 italic">
                              {outcomeFilter
                                ? `No ${outcomeFilter === 'good' ? 'strengths' : 'growth'} match the active outcome filter.`
                                : "No observations identified in the narrative commentary."}
                            </span>
                          );
                        }

                        return filteredObservations.map((item, obsIdx) => {
                          const isSelected = highlightedTextRange &&
                            'start' in highlightedTextRange &&
                            highlightedTextRange.start === item.anchor.start &&
                            highlightedTextRange.end === item.anchor.end;
                          const isFirstItem = obsIdx === 0;

                          return (
                            <div
                              key={item.id}
                              ref={isFirstItem ? firstKeyPointRef : undefined}
                              onClick={() => handleDimensionHighlight(item.anchor.start, item.anchor.end, item.exactPhrase)}
                              className={`p-3 border rounded-xl flex justify-between items-center gap-4 ${isSelected
                                  ? 'border-brand-summative-primary bg-blue-50/20 shadow-2xs'
                                  : 'border-slate-150 bg-white'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-3.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                                  <span className="text-xs font-sf-pro font-semibold text-slate-800 whitespace-normal leading-relaxed">
                                    {item.title}
                                  </span>
                                </div>

                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-heading font-bold select-none whitespace-nowrap flex-shrink-0 border ${item.type === 'good'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                    : 'bg-amber-50/80 text-amber-800 border-amber-200/70'
                                  }`}>
                                  <span>{item.type === 'good' ? 'Strength' : 'Growth'}</span>
                                </span>
                              </div>

                              <div
                                className="flex items-center flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Read More Tooltip Wrapper */}
                                <div className="relative group/tooltip">
                                  <button
                                    onClick={() => handleDimensionHighlight(item.anchor.start, item.anchor.end, item.exactPhrase)}
                                    className={`p-1.5 border rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 ${
                                      isFirstItem && isFlashingBriefingBtn
                                        ? 'border-[#1A73E8] bg-blue-100 text-blue-700 ring-2 ring-blue-400/80 scale-105 shadow-md animate-flash-once z-20'
                                        : (isSelected
                                            ? 'border-slate-300 bg-brand-summative-light/12 text-brand-summative-primary'
                                            : 'border-slate-200 hover:border-brand-summative-primary/50 text-slate-500 hover:bg-brand-summative-light/20 hover:text-brand-summative-primary')
                                    }`}
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[9px] px-2.5 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap z-50">
                                    Locate Excerpt
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                  </div>
                </div>
                ) : (
                  /* Next Step — Dual-Group Recommendations View (Formative Todo List style architecture) */
                  <div className="flex flex-col justify-between h-full overflow-hidden select-text">
                    {(() => {
                      // 1. Get uploaded handbook material text status
                      const selectedMaterials = (activeProject?.summativeMaterials || []).filter(m => m.selected !== false);
                      const { courseHandbookText } = compileMaterialTexts(selectedMaterials);
                      const hasHandbookUploaded = Boolean(
                        courseHandbookText &&
                        courseHandbookText.trim().length > 30 &&
                        !courseHandbookText.includes('- No raw text content extracted.')
                      );

                      // 2. Obtain or generate dynamic next steps
                      const weaknesses = summativeFeedbackData?.areasForImprovement || [];
                      const computedNextSteps = summativeFeedbackData?.nextSteps || generateMockSummativeParsedResponse(
                        summativeFeedbackData?.originalFeedbackText || '',
                        courseHandbookText
                      ).nextSteps;

                      // Group 1: Academic Recommendations (derived from briefing weaknesses, quantity <= weaknesses.length, max 5)
                      const academicRecs = (computedNextSteps?.academicRecommendations || []).slice(
                        0,
                        Math.min(5, weaknesses.length > 0 ? weaknesses.length : 5)
                      );

                      // Group 2: Advanced Exploration (derived from course handbook/standards document or dynamic fallback)
                      const defaultExplorations: SummativeAdvancedExploration[] = [
                        {
                          id: 'exp-1',
                          topicTitle: 'Establishing Clear Causal Transitions',
                          explorationScope: "Identify 'narrative leaps' by mapping the causal links between separate phases of a project; ensure each transition is supported by explicit theoretical or logical justification.",
                          capabilityTag: 'Structural & Causal Logic'
                        },
                        {
                          id: 'exp-2',
                          topicTitle: 'Incorporating Scalability and Sensitivity Analysis',
                          explorationScope: "Future roadmap sections should evaluate the model's elasticity, specifically identifying the variables that would require modification when transitioning from smaller pilot environments to high-density deployments.",
                          capabilityTag: 'Project & Risk Management'
                        }
                      ];

                      const advancedExplorations = (computedNextSteps?.advancedExplorations && computedNextSteps.advancedExplorations.length > 0)
                        ? computedNextSteps.advancedExplorations
                        : defaultExplorations;

                      return (
                        <>
                          {/* Scrollable Generated Cards List */}
                          <div className="flex-1 overflow-y-auto pr-1.5 scrollbar-thin flex flex-col gap-6 text-left py-1">
                            {/* GROUP 1: Academic Actionable Recommendations */}
                            <div ref={academicInsightsRef} className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-indigo-50 text-brand-summative-primary rounded-lg border border-indigo-100/50">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <h4 className="text-sm font-heading font-bold text-slate-700">
                                    Academic Insights
                                  </h4>
                                </div>
                              </div>

                              {academicRecs.length === 0 ? (
                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                  <p className="text-xs text-slate-400 italic">No critical academic weaknesses identified.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {academicRecs.map((rec: SummativeAcademicRecommendation, idx: number) => {
                                    const cardId = rec.id || `rec-${idx}`;
                                    const defaultTitle =
                                      rec.title ||
                                      (rec as any).recommendationTitle ||
                                      rec.targetWeaknessTitle ||
                                      (rec as any).topicTitle ||
                                      (rec as any).topic ||
                                      (rec as any).name ||
                                      rec.metaCapabilityTag ||
                                      'Academic Recommendation';
                                    const defaultTag = rec.metaCapabilityTag || 'Academic Meta-Capability';
                                    const defaultContent = rec.actionableGuidance || (rec as any).actionableStep || rec.description || '';

                                    const override = cardOverrides[cardId];
                                    const recTitleText = override?.title ?? defaultTitle;
                                    const recTagText = override?.tag ?? defaultTag;
                                    const recContentText = override?.content ?? defaultContent;
                                    const isEditingThisCard = editingCardId === cardId;

                                    const getTagStyle = (tag: string) => {
                                      const t = (tag || '').toLowerCase();
                                      if (t.includes('research') || t.includes('metric')) {
                                        return 'bg-cyan-50/60 text-cyan-900/75 border-cyan-200/50';
                                      }
                                      if (t.includes('system') || t.includes('sustainability') || t.includes('interactive')) {
                                        return 'bg-emerald-50/50 text-emerald-900/75 border-emerald-200/50';
                                      }
                                      if (t.includes('strategy') || t.includes('logic') || t.includes('innovation')) {
                                        return 'bg-amber-50/50 text-amber-900/75 border-amber-200/50';
                                      }
                                      if (t.includes('writing') || t.includes('academic') || t.includes('literature')) {
                                        return 'bg-slate-100/80 text-slate-700 border-slate-200/80';
                                      }
                                      return 'bg-indigo-50/60 text-indigo-900/75 border-indigo-200/50';
                                    };

                                    return (
                                      <div
                                        key={cardId}
                                        className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-brand-summative-primary/40 hover:shadow-md transition-all duration-300 flex flex-col gap-2.5 relative overflow-hidden group"
                                      >
                                        {/* Title row + Edit icon button on the right (above + Note button) */}
                                        <div className="flex items-center justify-between gap-2 w-full">
                                          {isEditingThisCard ? (
                                            <input
                                              type="text"
                                              value={editingTitle}
                                              onChange={(e) => setEditingTitle(e.target.value)}
                                              className="flex-1 max-w-[85%] text-xs font-heading font-extrabold text-slate-800 border-b border-slate-200 focus:border-slate-400 bg-transparent px-1 py-0.5 focus:outline-none transition-colors"
                                              autoFocus
                                            />
                                          ) : (
                                            <h5 className="text-xs font-heading font-extrabold text-slate-800 leading-snug w-full">
                                              {recTitleText}
                                            </h5>
                                          )}

                                          <button
                                            onClick={() => {
                                              if (isEditingThisCard) {
                                                setCardOverrides(prev => ({
                                                  ...prev,
                                                  [cardId]: {
                                                    title: editingTitle.trim() || defaultTitle,
                                                    tag: editingTag.trim() || defaultTag,
                                                    content: editingContent.trim() || defaultContent
                                                  }
                                                }));
                                                setEditingCardId(null);
                                              } else {
                                                setEditingCardId(cardId);
                                                setEditingTitle(recTitleText);
                                                setEditingTag(recTagText);
                                                setEditingContent(recContentText);
                                              }
                                            }}
                                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer flex-shrink-0 ${
                                              isEditingThisCard
                                                ? 'bg-brand-summative-primary text-white shadow-2xs'
                                                : 'text-slate-400 hover:text-brand-summative-primary hover:bg-slate-100'
                                            }`}
                                            title={isEditingThisCard ? "Save card edits" : "Edit card"}
                                          >
                                            {isEditingThisCard ? (
                                              <Check className="w-3 h-3" />
                                            ) : (
                                              <Pencil className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>

                                        {/* Row below Title: Capsule Tag (Left) + Add to Notes Button (Right) */}
                                        <div className="flex items-center justify-between gap-2">
                                          {/* Capsule Tag */}
                                          {isEditingThisCard ? (
                                            <span className="inline-grid items-center text-[9px] font-heading font-extrabold rounded-full border border-slate-200 bg-white text-slate-700 px-2.5 py-0.5 relative transition-all shadow-2xs">
                                              <span className="col-start-1 row-start-1 invisible whitespace-pre px-0.5">
                                                {editingTag || 'Tag'}
                                              </span>
                                              <input
                                                type="text"
                                                value={editingTag}
                                                onChange={(e) => setEditingTag(e.target.value)}
                                                size={1}
                                                className="col-start-1 row-start-1 w-full min-w-0 text-[9px] font-heading font-extrabold text-slate-700 bg-transparent border-0 focus:outline-none p-0 text-left"
                                              />
                                            </span>
                                          ) : (
                                            <span
                                              className={`text-[9px] font-heading font-extrabold px-2.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap ${getTagStyle(
                                                recTagText
                                              )}`}
                                            >
                                              {recTagText}
                                            </span>
                                          )}

                                          {/* Add to Notes Button */}
                                          {(() => {
                                            const isSaved = savedNotes.some(n => n.title === recTitleText);
                                            return (
                                              <button
                                                onClick={() => {
                                                  if (isSaved) {
                                                    const targetNote = savedNotes.find(n => n.title === recTitleText);
                                                    if (targetNote) removeNote(targetNote.id);
                                                  } else {
                                                    addNote({
                                                      id: cardId,
                                                      title: recTitleText,
                                                      tag: recTagText,
                                                      keyTakeaway: recContentText,
                                                      sourceProjectName: activeProject?.projectName || 'Summative Workspace',
                                                      addedAt: new Date().toLocaleDateString()
                                                    });
                                                  }
                                                }}
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 border shadow-2xs ${
                                                  isFlashingAddNoteBtn && idx === 0
                                                    ? 'border-[#1A73E8] bg-blue-100 text-blue-700 ring-2 ring-blue-400/80 scale-105 shadow-md animate-flash-once z-20'
                                                    : (isSaved
                                                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                                        : 'bg-blue-50/90 text-blue-700 border-blue-200/90 hover:bg-blue-100')
                                                }`}
                                              >
                                                {isSaved ? 'Added' : '+ Note'}
                                              </button>
                                            );
                                          })()}
                                        </div>

                                        {/* Key Takeaway Box */}
                                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11.5px] text-slate-600 font-body leading-relaxed">
                                          {isEditingThisCard ? (
                                            <textarea
                                              value={editingContent}
                                              onChange={(e) => {
                                                setEditingContent(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                              }}
                                              ref={(el) => {
                                                if (el) {
                                                  el.style.height = 'auto';
                                                  el.style.height = `${el.scrollHeight}px`;
                                                }
                                              }}
                                              rows={1}
                                              className="w-full font-body text-[11.5px] text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 resize-none leading-relaxed overflow-hidden"
                                            />
                                          ) : (
                                            <span className="leading-relaxed">
                                              {recContentText}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* GROUP 2: Advanced Exploration & In-Depth Learning */}
                            {advancedExplorations && advancedExplorations.length > 0 && (
                              <div ref={futureExplorationsRef} className="flex flex-col gap-3 pt-2 border-t border-slate-150">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 text-brand-summative-primary rounded-lg border border-indigo-100/50">
                                      <Rocket className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-heading font-bold text-slate-700">
                                      Future Explorations
                                    </h4>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                   {(() => {
                                     return advancedExplorations.map((exp: SummativeAdvancedExploration, idx: number) => {
                                        const cardId = exp.id || `exp-${idx}`;
                                        const defaultTitle = exp.topicTitle || (exp as any).topic || 'Future Exploration';
                                        const defaultContent = exp.explorationScope || (exp as any).description || '';

                                        // Dynamic topic-specific tag determination logic
                                        const getExplorationTag = () => {
                                          if (exp.capabilityTag) return exp.capabilityTag;
                                          if ((exp as any).tag) return (exp as any).tag;
                                          const title = (defaultTitle).toLowerCase();
                                          const scope = (defaultContent).toLowerCase();
                                          if (title.includes('system') || title.includes('sustainab') || scope.includes('systemic') || scope.includes('ecosystem')) {
                                            return 'Systems & Sustainability';
                                          }
                                          if (title.includes('metric') || title.includes('impact') || title.includes('measure') || scope.includes('quantify') || scope.includes('analytical')) {
                                            return 'Research & Impact Metrics';
                                          }
                                          if (title.includes('safety') || title.includes('verific') || title.includes('simulat') || scope.includes('failure')) {
                                            return 'System Safety & Verification';
                                          }
                                          if (title.includes('user') || title.includes('human') || title.includes('ergonom')) {
                                            return 'User Experience & Ergonomics';
                                          }
                                          if (title.includes('hardware') || title.includes('sensor') || title.includes('prototyp')) {
                                            return 'Hardware Engineering';
                                          }
                                          return activeProject?.folderTag || 'Long-Term Capability';
                                        };

                                        const defaultTag = getExplorationTag();
                                        const override = cardOverrides[cardId];
                                        const titleText = override?.title ?? defaultTitle;
                                        const cardTagText = override?.tag ?? defaultTag;
                                        const contentText = override?.content ?? defaultContent;
                                        const isEditingThisCard = editingCardId === cardId;

                                        const isSaved = savedPlans.some(p => p.title === titleText);

                                        const getTagStyle = (tag: string) => {
                                          const t = (tag || '').toLowerCase();
                                          if (t.includes('research') || t.includes('metric')) {
                                            return 'bg-cyan-50/60 text-cyan-900/75 border-cyan-200/50';
                                          }
                                          if (t.includes('system') || t.includes('sustainability') || t.includes('interactive')) {
                                            return 'bg-emerald-50/50 text-emerald-900/75 border-emerald-200/50';
                                          }
                                          if (t.includes('strategy') || t.includes('logic') || t.includes('innovation')) {
                                            return 'bg-amber-50/50 text-amber-900/75 border-amber-200/50';
                                          }
                                          if (t.includes('writing') || t.includes('academic') || t.includes('literature')) {
                                            return 'bg-slate-100/80 text-slate-700 border-slate-200/80';
                                          }
                                          return 'bg-indigo-50/60 text-indigo-900/75 border-indigo-200/50';
                                        };

                                        const tagBadgeStyle = getTagStyle(cardTagText);

                                       return (
                                          <div
                                            key={cardId}
                                            className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-brand-summative-primary/40 hover:shadow-md transition-all duration-300 flex flex-col gap-2.5 relative overflow-hidden group"
                                          >
                                            {/* Title row + Edit icon button on the right (above + Plan button) */}
                                            <div className="flex items-center justify-between gap-2 w-full">
                                              {isEditingThisCard ? (
                                                <input
                                                  type="text"
                                                  value={editingTitle}
                                                  onChange={(e) => setEditingTitle(e.target.value)}
                                                  className="flex-1 max-w-[85%] text-xs font-heading font-extrabold text-slate-800 border-b border-slate-200 focus:border-slate-400 bg-transparent px-1 py-0.5 focus:outline-none transition-colors"
                                                  autoFocus
                                                />
                                              ) : (
                                                <h5 className="text-xs font-heading font-extrabold text-slate-800 leading-snug w-full">
                                                  {titleText}
                                                </h5>
                                              )}

                                              <button
                                                onClick={() => {
                                                  if (isEditingThisCard) {
                                                    setCardOverrides(prev => ({
                                                      ...prev,
                                                      [cardId]: {
                                                        title: editingTitle.trim() || defaultTitle,
                                                        tag: editingTag.trim() || defaultTag,
                                                        content: editingContent.trim() || defaultContent
                                                      }
                                                    }));
                                                    setEditingCardId(null);
                                                  } else {
                                                    setEditingCardId(cardId);
                                                    setEditingTitle(titleText);
                                                    setEditingTag(cardTagText);
                                                    setEditingContent(contentText);
                                                  }
                                                }}
                                                className={`w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer flex-shrink-0 ${
                                                  isEditingThisCard
                                                    ? 'bg-slate-900 text-white shadow-2xs'
                                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                                                }`}
                                                title={isEditingThisCard ? "Save card edits" : "Edit card"}
                                              >
                                                {isEditingThisCard ? (
                                                  <Check className="w-3 h-3" />
                                                ) : (
                                                  <Pencil className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                              {isEditingThisCard ? (
                                                <span className="inline-grid items-center text-[9px] font-heading font-extrabold rounded-full border border-slate-200 bg-white text-slate-700 px-2.5 py-0.5 relative transition-all shadow-2xs">
                                                  <span className="col-start-1 row-start-1 invisible whitespace-pre px-0.5">
                                                    {editingTag || 'Tag'}
                                                  </span>
                                                  <input
                                                    type="text"
                                                    value={editingTag}
                                                    onChange={(e) => setEditingTag(e.target.value)}
                                                    size={1}
                                                    className="col-start-1 row-start-1 w-full min-w-0 text-[9px] font-heading font-extrabold text-slate-700 bg-transparent border-0 focus:outline-none p-0 text-left"
                                                  />
                                                </span>
                                              ) : (
                                                <span className={`text-[9px] font-heading font-extrabold px-2.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap capitalize ${tagBadgeStyle}`}>
                                                  {cardTagText}
                                                </span>
                                              )}

                                             <button
                                               onClick={() => {
                                                 if (isSaved) {
                                                   const targetPlan = savedPlans.find(p => p.title === titleText);
                                                   if (targetPlan) removePlan(targetPlan.id);
                                                 } else {
                                                   addPlan({
                                                     id: exp.id || `plan-${Date.now()}-${idx}`,
                                                     title: titleText,
                                                     tag: cardTagText,
                                                     suggestedAction: exp.explorationScope || (exp as any).description || '',
                                                     sourceProjectName: activeProject?.projectName || 'Summative Workspace',
                                                     addedAt: new Date().toLocaleDateString()
                                                   });
                                                 }
                                               }}
                                               className={`px-2.5 py-1 rounded-md text-[9px] font-heading font-extrabold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 border shadow-2xs ${
                                                  isFlashingAddPlanBtn && idx === 0
                                                     ? 'border-[#1A73E8] bg-blue-100 text-blue-700 ring-2 ring-blue-400/80 scale-105 shadow-md animate-pulse z-20'
                                                     : (isSaved
                                                         ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                                         : 'bg-blue-50/90 text-blue-700 border-blue-200/90 hover:bg-blue-100')
                                               }`}
                                             >
                                               {isSaved ? 'Added' : '+ Plan'}
                                             </button>
                                           </div>

                                          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11.5px] text-slate-600 font-body leading-relaxed">
                                            {isEditingThisCard ? (
                                              <textarea
                                                value={editingContent}
                                                onChange={(e) => {
                                                  setEditingContent(e.target.value);
                                                  e.target.style.height = 'auto';
                                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                                }}
                                                ref={(el) => {
                                                  if (el) {
                                                    el.style.height = 'auto';
                                                    el.style.height = `${el.scrollHeight}px`;
                                                  }
                                                }}
                                                rows={1}
                                                className="w-full font-body text-[11.5px] text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 resize-none leading-relaxed overflow-hidden"
                                              />
                                            ) : (
                                              <span className="leading-relaxed">
                                                {contentText}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Pinned Bottom Dock: CUSTOM ENTRY CREATION TOOLBAR */}
                          <div className="pt-2.5 border-t border-slate-150 flex-shrink-0 flex flex-col gap-2">
                            {/* Header row: Dual-Type Selector Pills (Left) + Add Button (Right) */}
                            <div className="flex items-center justify-between gap-2">
                              {/* Dual-Type Selector Icon Buttons */}
                              <div className="flex bg-slate-150/80 p-0.5 rounded-lg border border-slate-200/50 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => setCustomType('note')}
                                  title="Academic Note"
                                  className={`py-1 px-2.5 rounded-md transition-[background-color,shadow,color] duration-200 cursor-pointer flex items-center gap-1.5 ${
                                    customType === 'note'
                                      ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${customType === 'note' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                                  <span className={`text-[11px] font-sf-pro ${customType === 'note' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                                    Note
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCustomType('plan')}
                                  title="Long-Term Plan"
                                  className={`py-1 px-2.5 rounded-md transition-[background-color,shadow,color] duration-200 cursor-pointer flex items-center gap-1.5 ${
                                    customType === 'plan'
                                      ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <Rocket className={`w-3.5 h-3.5 flex-shrink-0 ${customType === 'plan' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                                  <span className={`text-[11px] font-sf-pro ${customType === 'plan' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                                    Plan
                                  </span>
                                </button>
                              </div>

                              {/* Add Button */}
                              <button
                                type="button"
                                onClick={handleAddCustomEntrySubmit}
                                className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-sf-pro font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0 hover:scale-[1.01] active:scale-[0.99]"
                              >
                                <span>{customType === 'note' ? 'Add Note' : 'Add Plan'}</span>
                              </button>
                            </div>

                            {/* Row 1: Title Input (flex-1) + Tag Input (w-36 sm:w-40 flex-shrink-0) */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={customType === 'note' ? "Note Title..." : "Plan Goal Title..."}
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEntrySubmit()}
                                className="flex-1 font-body text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-brand-summative-primary focus:ring-1 focus:ring-brand-summative-primary/20"
                              />
                              <input
                                type="text"
                                placeholder="Set category..."
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomEntrySubmit()}
                                className="w-36 sm:w-40 font-body text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-brand-summative-primary focus:ring-1 focus:ring-brand-summative-primary/20 capitalize flex-shrink-0"
                              />
                            </div>

                            {/* Row 2: Detailed Description Textarea */}
                            <textarea
                              placeholder={customType === 'note' ? "Detailed Context (Key takeaway or guidance note)..." : "Detailed Context (Exploration action scope)..."}
                              value={customContent}
                              onChange={(e) => setCustomContent(e.target.value)}
                              className="w-full font-body text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-none focus:border-brand-summative-primary focus:ring-1 focus:ring-brand-summative-primary/20 h-14 resize-none leading-relaxed"
                            />

                            {addedSuccessToast && (
                              <div className="text-[10.5px] font-heading font-extrabold text-[#1A73E8] animate-in fade-in flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{addedSuccessToast}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Feedback Input Panel OR Hydrated Original Text Viewer & Chatbox Container */}
        <div className={`flex flex-col ${!summativeFeedbackData || isEditing || activeRightTab === 'input' ? 'gap-6 justify-center min-h-[500px]' : 'h-[calc(100vh-120px)] min-h-[500px]'}`}>
          {!summativeFeedbackData || isEditing || activeRightTab === 'input' ? (
            /* Right Input Panel */
            <div className="h-full flex-1 flex flex-col justify-between p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs relative overflow-hidden font-sf-pro">
              <div className="flex-1 flex flex-col gap-4">
                <div className="border-b border-slate-200/50 pb-3">
                  <h3 className="text-base font-sf-pro font-bold text-slate-900 tracking-normal flex items-center gap-2">
                    <FileInput className="w-5 h-5 text-[#1A73E8] flex-shrink-0" />
                    <span>Feedback Input</span>
                  </h3>
                </div>

                {/* Final Grade Input (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                    Final Grade
                  </label>
                  <input
                    type="text"
                    value={finalGrade}
                    onChange={(e) => setFinalGrade(e.target.value)}
                    placeholder="Enter final grade (optional)..."
                    disabled={isLoading}
                    className="w-full font-sf-pro font-normal text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-summative-primary focus:ring-1 focus:ring-brand-summative-primary/20 focus:bg-white transition-all tracking-normal shadow-2xs"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                      Tutor Final Feedback Report
                    </label>
                  </div>

                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setShowSummativeInputValidationError(false);
                      }
                    }}
                    placeholder="Paste the final grading comment or tutor's evaluation text here..."
                    disabled={isLoading}
                    className="w-full flex-1 font-sf-pro font-normal text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl p-4 outline-none focus:border-brand-summative-primary focus:ring-1 focus:ring-brand-summative-primary/20 focus:bg-white transition-all tracking-normal leading-relaxed resize-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 px-1 font-sf-pro mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                {showSummativeInputValidationError && !inputText.trim() && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-sf-pro font-medium text-amber-600 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                    <span>Please enter feedback text</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {(isEditing || (summativeFeedbackData && activeRightTab === 'input')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setActiveRightTab('transcript');
                      }}
                      className="flex-1 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sf-pro font-medium text-sm tracking-normal shadow-2xs transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!inputText.trim()) {
                        setShowSummativeInputValidationError(true);
                        const textareaEl = document.querySelector<HTMLTextAreaElement>('textarea[placeholder^="Paste the final"]');
                        textareaEl?.focus();
                      } else {
                        setShowSummativeInputValidationError(false);
                        handleProcessFeedback();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 rounded-xl text-sm font-sf-pro font-medium flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-all tracking-normal"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white flex-shrink-0" />
                        <span>Analyzing Feedback...</span>
                      </>
                    ) : (
                      <span>Process Feedback</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Right Hydrated Original Feedback Text Viewer & Chatbox Container */
            <div className="h-full flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">

              {/* Twin Segmented Tabs for Right Workspace */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex-shrink-0">
                <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRightTab('chatbox');
                      setHasUnreadChatNotification(false);
                    }}
                    title="AI Assistant"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative ${
                      activeRightTab === 'chatbox'
                        ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'chatbox' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'chatbox' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                      AI Assistant
                    </span>
                    {hasUnreadChatNotification && activeRightTab !== 'chatbox' && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white shadow-sm"></span>
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('transcript')}
                    title="Transcript View"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeRightTab === 'transcript'
                        ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'transcript' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'transcript' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                      Transcript View
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('document')}
                    title="Document View"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeRightTab === 'document'
                        ? 'bg-white text-brand-summative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'document' ? 'text-brand-summative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'document' ? 'font-extrabold text-brand-summative-primary' : 'font-semibold text-slate-600'}`}>
                      Document View
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Contents Viewport */}
              <div className={`flex-1 min-h-0 relative select-none ${activeRightTab === 'document' ? 'p-0' : 'p-4'}`}>
                <div className={`h-full ${activeRightTab === 'transcript' ? 'block' : 'hidden'}`}>
                  <OriginalTextPanel
                    originalText={summativeFeedbackData.originalFeedbackText}
                    highlightRange={highlightedTextRange}
                    routeTheme="summative"
                    onEditClick={() => {
                      setInputText(summativeFeedbackData.originalFeedbackText || '');
                      setFinalGrade(summativeFeedbackData.grade || '');
                      setActiveRightTab('input');
                    }}
                  />
                </div>
                <div className={`h-full ${activeRightTab === 'document' ? 'block' : 'hidden'}`}>
                  <DocumentViewer
                    feedbackType="summative"
                  />
                </div>
                <div className={`h-full ${activeRightTab === 'chatbox' ? 'block' : 'hidden'}`}>
                  <div className="h-full flex-1 flex flex-col">
                    <FreeformCopilotChat
                      moduleType="summative"
                      onGuideActionClick={(actionId) => {
                        if (actionId === 'sum-guide-1') {
                          setActiveLeftTab('briefing');
                          setIsFlashingBriefingBtn(true);
                          setTimeout(() => setIsFlashingBriefingBtn(false), 700);
                        } else if (actionId === 'sum-guide-2') {
                          setActiveLeftTab('longterm');
                          setIsFlashingAddNoteBtn(true);
                          setTimeout(() => setIsFlashingAddNoteBtn(false), 700);
                          setTimeout(() => {
                            academicInsightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        } else if (actionId === 'sum-guide-3') {
                          setActiveLeftTab('longterm');
                          setIsFlashingAddPlanBtn(true);
                          setTimeout(() => setIsFlashingAddPlanBtn(false), 700);
                          setTimeout(() => {
                            futureExplorationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Reminder Modal */}
      {showMaterialReminder && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl border border-slate-200/80 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-base font-sf-pro font-bold text-slate-900 tracking-normal">
                Enhance Analysis Reliability?
              </h3>
            </div>

            <p className="text-xs text-slate-500 font-sf-pro font-normal leading-relaxed text-left tracking-normal">
              You haven't uploaded your Course Handbook or Assignment Draft yet. Providing these materials allows the AI to perform a deeply contextualized, rigorous cross-examination against your actual work. Would you like to upload them now?
            </p>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  setShowMaterialReminder(false);
                  const uploadEl = document.getElementById('sidebar-materials-upload');
                  if (uploadEl) {
                    uploadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    uploadEl.classList.add('bg-[#E8F1FD]', 'border-[#B8D3F8]', 'text-[#1D549F]', 'transition-all', 'duration-300');
                    setTimeout(() => {
                      uploadEl.classList.remove('bg-[#E8F1FD]', 'border-[#B8D3F8]', 'text-[#1D549F]');
                    }, 2500);
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-sf-pro font-medium px-4 rounded-xl flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-xs"
              >
                Upload
              </button>

              <button
                onClick={async () => {
                  setShowMaterialReminder(false);
                  await handleProcessFeedback(true);
                }}
                className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 text-xs font-sf-pro font-medium px-4 rounded-xl flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
