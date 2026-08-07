import React, { useState } from 'react';
import { Layers, ClipboardList, FileText, BookOpen, MessageSquare, FolderArchive, Database, FolderOpen, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ArchiveAssetDetailView: React.FC = () => {
  const { selectedArchiveAssetInfo } = useAppStore();

  const assetName = selectedArchiveAssetInfo?.name;

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

  const isSummative = selectedArchiveAssetInfo?.type === 'summative';

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
        </div>
      </div>
      
      {/* Main 1:1 Split Layout (100% matching real workspace framework) */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 min-h-[650px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: AI Assistant & Feedback Briefing Canvas     */}
        {/* ======================================================== */}
        <div className="h-[calc(100vh-140px)] min-h-[650px] flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl glass-panel overflow-hidden relative">
          
          {/* Twin Segmented Tabs for Left Workspace (Exact match to real workspace) */}
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
          <div className="flex-1 p-5 min-h-0 flex flex-col gap-4 select-none bg-white">
            {/* Header Title Frame */}
            <div className="flex items-center gap-2 border-b border-slate-150 pb-2 flex-shrink-0">
              <h3 className="text-xs font-heading font-black text-slate-800 tracking-wider">
                {activeLeftTab === 'briefing' ? 'Feedback Briefing' : 'Todo List'}
              </h3>
            </div>

            {/* Inner Content Area (Clean Empty Standby Placeholder) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50 border border-slate-200/60 rounded-xl">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                <FolderArchive className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              </div>
              <h4 className="text-xs font-heading font-bold text-slate-700">
                {assetName ? `${assetName}` : 'Briefing View Standby'}
              </h4>
              <p className="text-[11px] font-body text-slate-400 leading-normal max-w-xs mt-1">
                Content is empty on standby.
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Original Feedback Transcript Canvas        */}
        {/* ======================================================== */}
        <div className="h-[calc(100vh-140px)] min-h-[650px] flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl glass-panel overflow-hidden relative">
          
          {/* Twin Segmented Tabs for Right Workspace (Exact match to real workspace) */}
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
          <div className="flex-1 p-5 min-h-0 flex flex-col gap-4 select-none bg-white">
            {/* Header Title Frame */}
            <div className="border-b border-slate-150 pb-2 flex-shrink-0">
              <h3 className="text-sm font-heading font-bold text-slate-800">
                Original Feedback Transcript
              </h3>
            </div>

            {/* Inner Content Area (Clean Empty Standby Placeholder) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50 border border-slate-200/60 rounded-xl">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                <Database className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              </div>
              <h4 className="text-xs font-heading font-bold text-slate-700">
                {assetName ? `${assetName}` : 'Transcript View Standby'}
              </h4>
              <p className="text-[11px] font-body text-slate-400 leading-normal max-w-xs mt-1">
                Content is empty on standby.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default ArchiveAssetDetailView;
