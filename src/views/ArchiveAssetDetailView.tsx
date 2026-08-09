import React, { useState } from 'react';
import { Layers, ClipboardList, FileText, BookOpen, MessageSquare, FolderOpen, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ArchiveAssetDetailView: React.FC = () => {
  const { selectedArchiveAssetInfo, pastProjects, activateProjectFromArchive } = useAppStore();

  const assetName = selectedArchiveAssetInfo?.name;

  const matchedProject = pastProjects.find(p =>
    p.projectId === selectedArchiveAssetInfo?.id ||
    p.projectName.toLowerCase() === (selectedArchiveAssetInfo?.name || '').toLowerCase()
  );

  const [activeLeftTab, setActiveLeftTab] = useState<'briefing' | 'todo'>('briefing');
  const [activeRightTab, setActiveRightTab] = useState<'transcript' | 'document' | 'chat'>('transcript');

  const tagColorMap: Record<string, string> = {
    'product design': '#00A3C4',
    'research': '#10B981',
    'interactive design': '#8B5CF6',
    'innovation strategy': '#F59E0B'
  };

  const rawTag = (selectedArchiveAssetInfo?.folderTag || '').toLowerCase();
  const folderTagColor = selectedArchiveAssetInfo?.tagColor || tagColorMap[rawTag] || '#00A3C4';

  const toTitleCase = (str: string) => str.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  const headerLine1 = selectedArchiveAssetInfo?.folderTag && selectedArchiveAssetInfo?.courseName
    ? `${toTitleCase(selectedArchiveAssetInfo.folderTag)} • ${selectedArchiveAssetInfo.courseName}`
    : (selectedArchiveAssetInfo?.courseName ? `My Archive • ${selectedArchiveAssetInfo.courseName}` : 'My Archive • Project Workspace');

  const isSummative = selectedArchiveAssetInfo?.type === 'summative' || matchedProject?.feedbackType === 'summative';

  const handleOpenWorkspace = () => {
    const targetId = matchedProject?.projectId || selectedArchiveAssetInfo?.id;
    if (targetId) {
      activateProjectFromArchive(targetId);
    }
  };

  const summativeData = matchedProject?.summativeFeedbackData;
  const formativeRounds = matchedProject?.formativeRounds || [];
  const firstRound = formativeRounds.length > 0 ? formativeRounds[0] : null;

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6 flex flex-col gap-6 select-none overflow-x-hidden animate-in fade-in duration-300">
      
      {/* Top Header Bar matching real created files framework */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between border-b border-slate-200 pb-3">
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
              {assetName || 'Archive Asset Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-2 py-1 px-3 rounded-full border text-xs font-heading font-bold shadow-sm ${
            isSummative
              ? 'bg-brand-summative-light text-brand-summative-primary border-brand-summative-border/30'
              : 'bg-brand-formative-light text-brand-formative-primary border-brand-formative-border/30'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            {isSummative ? 'Summative Dashboard' : 'Formative Sandbox'}
          </div>

          <button
            onClick={handleOpenWorkspace}
            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-sf-pro font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Open Interactive Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>
      
      {/* Main 1:1 Split Layout (100% matching real workspace framework) */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 min-h-[650px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: AI Assistant & Feedback Briefing Canvas     */}
        {/* ======================================================== */}
        <div className="h-[calc(100vh-140px)] min-h-[650px] flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl glass-panel overflow-hidden relative">
          
          {/* Twin Segmented Tabs for Left Workspace */}
          <div className="flex items-center justify-between p-3 border-b border-slate-150 bg-slate-50 flex-shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-xl shadow-2xs min-w-0">
              <button
                onClick={() => setActiveLeftTab('briefing')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-sf-pro font-semibold whitespace-nowrap min-w-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeLeftTab === 'briefing'
                    ? (isSummative ? 'bg-[#E8F1FD] text-[#1D549F] shadow-2xs' : 'bg-[#E0F2F7] text-[#0A6B83] shadow-2xs')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Layers className={`w-3 h-3 flex-shrink-0 ${activeLeftTab === 'briefing' ? (isSummative ? 'text-[#1D549F]' : 'text-[#0A6B83]') : (isSummative ? 'text-[#1A73E8]' : 'text-[#009DC2]')}`} />
                <span className="truncate min-w-0">Briefing</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('todo')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-sf-pro font-semibold whitespace-nowrap min-w-0 transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeLeftTab === 'todo'
                    ? (isSummative ? 'bg-[#E8F1FD] text-[#1D549F] shadow-2xs' : 'bg-[#E0F2F7] text-[#0A6B83] shadow-2xs')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <ClipboardList className={`w-3 h-3 flex-shrink-0 ${activeLeftTab === 'todo' ? (isSummative ? 'text-[#1D549F]' : 'text-[#0A6B83]') : (isSummative ? 'text-[#1A73E8]' : 'text-[#009DC2]')}`} />
                <span className="truncate min-w-0">Todo List</span>
              </button>
            </div>
          </div>

          {/* Left Panel Inner Frame */}
          <div className="flex-1 p-5 min-h-0 flex flex-col gap-4 select-none bg-white overflow-y-auto">
            {/* Header Title Frame */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-2 flex-shrink-0">
              <h3 className="text-xs font-heading font-black text-slate-800 tracking-wider">
                {activeLeftTab === 'briefing' ? 'Feedback Briefing' : 'Todo List'}
              </h3>
              <button
                onClick={handleOpenWorkspace}
                className="text-[10px] font-sf-pro font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Interactive View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Inner Content Area */}
            {isSummative && summativeData ? (
              <div className="flex flex-col gap-4">
                {/* Global Summary */}
                {summativeData.globalSummary && (
                  <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-sf-pro font-bold text-blue-900 uppercase tracking-wider block mb-1">Global Summary</span>
                    <p className="text-xs font-sf-pro text-slate-700 leading-relaxed">{summativeData.globalSummary}</p>
                  </div>
                )}

                {/* Key Observations */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-sf-pro font-bold text-slate-500 uppercase tracking-wider">Key Observations</span>
                  
                  {/* Strengths */}
                  {(summativeData.keyStrengths || []).map((s, idx) => (
                    <div key={`str-${idx}`} className="p-2.5 border border-emerald-150 bg-emerald-50/30 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-sf-pro font-semibold text-slate-800 truncate">{s.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 flex-shrink-0">Strength</span>
                    </div>
                  ))}

                  {/* Improvements */}
                  {(summativeData.areasForImprovement || []).map((c, idx) => (
                    <div key={`imp-${idx}`} className="p-2.5 border border-amber-200/70 bg-amber-50/40 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-sf-pro font-semibold text-slate-800 truncate">{c.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 flex-shrink-0">Growth</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isSummative && firstRound ? (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-sf-pro font-bold text-slate-500 uppercase tracking-wider">Core Feedback Observations</span>
                {(firstRound.coreKeyPoints || []).map((kp, idx) => (
                  <div key={`kp-${idx}`} className="p-2.5 border border-slate-200 bg-slate-50/60 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs font-sf-pro font-semibold text-slate-800 truncate">{kp.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-100 text-cyan-800 flex-shrink-0">{kp.severity || 'Point'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50 border border-slate-200/60 rounded-xl">
                <h4 className="text-xs font-heading font-bold text-slate-700">{assetName || 'Project Workspace'}</h4>
                <p className="text-[11px] font-body text-slate-400 leading-normal max-w-xs mt-1">
                  Click "Open Interactive Dashboard" above to launch the full interactive workspace.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Original Feedback Transcript Canvas        */}
        {/* ======================================================== */}
        <div className="h-[calc(100vh-140px)] min-h-[650px] flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl glass-panel overflow-hidden relative">
          
          {/* Twin Segmented Tabs for Right Workspace */}
          <div className="flex items-center justify-between p-3 border-b border-slate-150 bg-slate-50 flex-shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-xl shadow-2xs min-w-0">
              <button
                onClick={() => setActiveRightTab('transcript')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-sf-pro font-semibold whitespace-nowrap min-w-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'transcript'
                    ? (isSummative ? 'bg-[#E8F1FD] text-[#1D549F] shadow-2xs' : 'bg-[#E0F2F7] text-[#0A6B83] shadow-2xs')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <FileText className={`w-3 h-3 flex-shrink-0 ${activeRightTab === 'transcript' ? (isSummative ? 'text-[#1D549F]' : 'text-[#0A6B83]') : (isSummative ? 'text-[#1A73E8]' : 'text-[#009DC2]')}`} />
                <span className="truncate min-w-0">Transcript View</span>
              </button>

              <button
                onClick={() => setActiveRightTab('document')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-sf-pro font-semibold whitespace-nowrap min-w-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'document'
                    ? (isSummative ? 'bg-[#E8F1FD] text-[#1D549F] shadow-2xs' : 'bg-[#E0F2F7] text-[#0A6B83] shadow-2xs')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <BookOpen className={`w-3 h-3 flex-shrink-0 ${activeRightTab === 'document' ? (isSummative ? 'text-[#1D549F]' : 'text-[#0A6B83]') : (isSummative ? 'text-[#1A73E8]' : 'text-[#009DC2]')}`} />
                <span className="truncate min-w-0">Document View</span>
              </button>

              <button
                onClick={() => setActiveRightTab('chat')}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-sf-pro font-semibold whitespace-nowrap min-w-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'chat'
                    ? (isSummative ? 'bg-[#E8F1FD] text-[#1D549F] shadow-2xs' : 'bg-[#E0F2F7] text-[#0A6B83] shadow-2xs')
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <MessageSquare className={`w-3 h-3 flex-shrink-0 ${activeRightTab === 'chat' ? (isSummative ? 'text-[#1D549F]' : 'text-[#0A6B83]') : (isSummative ? 'text-[#1A73E8]' : 'text-[#009DC2]')}`} />
                <span className="truncate min-w-0">AI Assistant</span>
              </button>
            </div>
          </div>

          {/* Right Panel Inner Frame */}
          <div className="flex-1 p-5 min-h-0 flex flex-col gap-4 select-none bg-white overflow-y-auto">
            {/* Header Title Frame */}
            <div className="border-b border-slate-150 pb-2 flex-shrink-0">
              <h3 className="text-sm font-heading font-bold text-slate-800">
                Original Feedback Transcript
              </h3>
            </div>

            {/* Inner Content Area */}
            {summativeData?.originalFeedbackText || firstRound?.originalFeedbackText ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-sf-pro text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {summativeData?.originalFeedbackText || firstRound?.originalFeedbackText}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50 border border-slate-200/60 rounded-xl">
                <h4 className="text-xs font-heading font-bold text-slate-700">{assetName || 'Transcript View'}</h4>
                <p className="text-[11px] font-body text-slate-400 leading-normal max-w-xs mt-1">
                  Click "Open Interactive Dashboard" above to launch full interactive view.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
export default ArchiveAssetDetailView;
