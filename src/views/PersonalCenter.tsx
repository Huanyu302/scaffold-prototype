import React, { useState, useEffect } from 'react';
import {
  User,
  UserCheck,
  ShieldCheck,
  Mail,
  BookOpen,
  Clock,
  GraduationCap,
  Briefcase,
  Target,
  Sparkles,
  Edit3,
  Check,
  Search,
  Palette,
  FileText,
  Cpu,
  BarChart3,
  TrendingUp,
  CheckSquare,
  RotateCcw,
  Save,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const PersonalCenter: React.FC = () => {
  const { userProfile, updateUserProfile, resetOnboarding, setRoute } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);

  // Local draft state for editing profile
  const [draftAcademicLevel, setDraftAcademicLevel] = useState(userProfile.academicLevel || 'Postgraduate');
  const [draftFieldOfStudy, setDraftFieldOfStudy] = useState(userProfile.fieldOfStudy || 'Design Engineering');
  const [draftDeliverableDomains, setDraftDeliverableDomains] = useState<string[]>(
    userProfile.deliverableDomains || ['creative-design']
  );
  const [draftFeedbackStages, setDraftFeedbackStages] = useState<string[]>(
    userProfile.feedbackStages || ['formative-feedback', 'summative-assessment', 'knowledge-notes', 'career-alignment']
  );
  const [draftTargetRole, setDraftTargetRole] = useState(userProfile.targetCareerRole || 'Product Manager');
  const [draftPersona, setDraftPersona] = useState(userProfile.copilotPersona || 'action-coach');

  // Reactively sync draft state whenever user completes onboarding or updates profile
  useEffect(() => {
    setDraftAcademicLevel(userProfile.academicLevel || 'Postgraduate');
    setDraftFieldOfStudy(userProfile.fieldOfStudy || 'Design Engineering');
    setDraftDeliverableDomains(userProfile.deliverableDomains || ['creative-design']);
    setDraftFeedbackStages(userProfile.feedbackStages || ['formative-feedback', 'summative-assessment', 'knowledge-notes', 'career-alignment']);
    setDraftTargetRole(userProfile.targetCareerRole || 'Product Manager');
    setDraftPersona(userProfile.copilotPersona || 'action-coach');
  }, [userProfile]);

  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);

  const academicOptions = [
    { id: 'Undergraduate', label: 'Undergraduate' },
    { id: 'Postgraduate', label: 'Postgraduate' },
    { id: 'Other', label: 'Other Learners' }
  ];

  const popularMajors = [
    'Product Design',
    'HCI / UX',
    'Computer Science',
    'Mechanical Eng.',
    'Business & Strategy',
    'Data Science',
    'Architecture',
    'Bioengineering'
  ];

  const deliverableDomainOptions = [
    { id: 'creative-design', icon: Palette, title: 'Creative Design & Prototypes' },
    { id: 'papers-reports', icon: FileText, title: 'Papers, Reports & Essays' },
    { id: 'software-code', icon: Cpu, title: 'Software Code & Technical Systems' },
    { id: 'data-analytical', icon: BarChart3, title: 'Data & Analytical Dashboards' },
    { id: 'pitch-decks', icon: TrendingUp, title: 'Pitch Decks & Strategy Frameworks' }
  ];

  const feedbackStageOptions = [
    { id: 'formative-feedback', title: 'Formative Feedback in Progress', desc: 'Focus on active draft debugging, omission detection, and parallel path proposals.' },
    { id: 'summative-assessment', title: 'Summative Assessment at Completion', desc: 'Focus on official criterion scoring breakdowns, evaluator comments, and grade mapping.' },
    { id: 'knowledge-notes', title: 'Knowledge Repository & Long-term Plans', desc: 'Focus on extracting reusable knowledge notes and actionable learning plans.' },
    { id: 'career-alignment', title: 'Target Career Competency Alignment', desc: 'Focus on mapping coursework outputs to real-world industry role benchmarks.' }
  ];

  const personaOptions = [
    {
      id: 'action-coach',
      title: 'Direct Action Coach',
      icon: Target,
      desc: 'Solution-driven, concise, prioritized next steps to hit target benchmarks efficiently.'
    },
    {
      id: 'empathetic-mentor',
      title: 'Empathetic Mentor',
      icon: Sparkles,
      desc: 'Encouraging, highlights creative strengths, and guides growth with constructive advice.'
    },
    {
      id: 'thinking-challenger',
      title: 'Thinking Challenger',
      icon: LightbulbIcon,
      desc: 'Probing questions, alternative angles, and prompts to deepen critical reasoning.'
    }
  ];

  const handleSaveProfile = () => {
    updateUserProfile({
      academicLevel: draftAcademicLevel,
      fieldOfStudy: draftFieldOfStudy,
      deliverableDomains: draftDeliverableDomains,
      feedbackStages: draftFeedbackStages,
      targetCareerRole: draftTargetRole,
      copilotPersona: draftPersona as any
    });
    setIsEditing(false);
  };

  const handleToggleDomain = (id: string) => {
    setDraftDeliverableDomains(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleStage = (id: string) => {
    setDraftFeedbackStages(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 select-none overflow-x-hidden relative">

      {/* Top Page Header Bar (Matching Long-term Repository UI) */}
      <div className="w-full max-w-[1530px] mx-auto flex items-center justify-between border-b border-slate-200 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200/60 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#1A56DB]" />
          </div>
          <h1 className="text-xl font-sf-pro font-bold text-slate-900 tracking-normal leading-tight">
            User Center
          </h1>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="w-full max-w-[1530px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start flex-grow">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Student Card & Quick Overview (4/12) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-5 sticky top-6">
          
          {/* Main Identity Card */}
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-200/80 flex items-center justify-center text-[#1A56DB] font-sf-pro font-bold text-2xl shadow-inner relative">
              AC
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#1A56DB] border-2 border-white rounded-full flex items-center justify-center text-white shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 items-center">
              <h3 className="text-base font-sf-pro font-bold text-slate-900">Alex Chen</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-semibold text-slate-600">
                <UserCheck className="w-3 h-3 text-[#1A56DB]" />
                <span>ID: AC-902-SCAFFOLD</span>
              </div>
            </div>



            <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-3 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sf-pro">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{userProfile.email || 'alex.chen@university.edu'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sf-pro">
                <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{userProfile.fieldOfStudy || 'Design Engineering'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-sf-pro">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Joined: Spring Semester 2026</span>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Interactive Onboarding Profile Vault (8/12) */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 p-6 sm:p-7 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-6">
          
          {/* Section Header & Edit / Save Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-sf-pro font-bold text-slate-900 tracking-tight">
                User Profile
              </h3>
              <p className="text-xs text-slate-500 font-sf-pro">
                Recorded preferences from your onboarding survey.
              </p>
            </div>

            {/* Edit or Save Action Button */}
            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-sf-pro font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setDraftAcademicLevel(userProfile.academicLevel || 'Postgraduate');
                  setDraftFieldOfStudy(userProfile.fieldOfStudy || 'Design Engineering');
                  setDraftDeliverableDomains(userProfile.deliverableDomains || ['creative-design']);
                  setDraftFeedbackStages(userProfile.feedbackStages || ['formative-feedback', 'summative-evaluation', 'career-alignment']);
                  setDraftTargetRole(userProfile.targetCareerRole || 'Product Manager');
                  setDraftPersona(userProfile.copilotPersona || 'action-coach');
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-white border border-slate-250 hover:border-blue-500 text-slate-700 hover:text-[#1A56DB] rounded-xl text-xs font-sf-pro font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:bg-blue-50/50"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#1A56DB]" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* QUESTIONNAIRE DATA FIELDS GRID (Theme Unified: Ultramarine Blue + Slate) */}
          <div className="flex flex-col gap-6">
            
            {/* ---------------------------------------------------- */}
            {/* FIELD 1: ACADEMIC STANDING (Q1) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  1. Academic Standing
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Current degree level</span>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {academicOptions.map(opt => {
                    const isSelected =
                      draftAcademicLevel === opt.id ||
                      draftAcademicLevel === opt.label ||
                      (draftAcademicLevel || '').toLowerCase().includes(opt.id.toLowerCase());
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDraftAcademicLevel(opt.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-sf-pro font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                (() => {
                  const currentOpt = academicOptions.find(
                    opt =>
                      userProfile.academicLevel === opt.id ||
                      userProfile.academicLevel === opt.label ||
                      (userProfile.academicLevel || '').toLowerCase().includes(opt.id.toLowerCase())
                  );
                  const displayLabel = currentOpt ? currentOpt.label : (userProfile.academicLevel || 'Postgraduate');
                  return (
                    <div className="inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-sf-pro font-semibold text-slate-800 shadow-2xs">
                      <GraduationCap className="w-3.5 h-3.5 text-[#1A56DB]" />
                      <span>{displayLabel}</span>
                    </div>
                  );
                })()
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FIELD 2: PRIMARY FIELD OF STUDY / MAJOR (Q2) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  2. Primary Field of Study / Major
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Academic discipline & domain</span>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-2.5 relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={draftFieldOfStudy}
                      onChange={(e) => setDraftFieldOfStudy(e.target.value)}
                      placeholder="Type or select major..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sf-pro font-semibold text-slate-800 focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMajorDropdownOpen(!isMajorDropdownOpen)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isMajorDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Popular Discipline Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {popularMajors.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDraftFieldOfStudy(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-sf-pro font-semibold transition-all cursor-pointer border ${
                          draftFieldOfStudy === m
                            ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-sf-pro font-semibold text-slate-800 shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span>{userProfile.fieldOfStudy || 'Design Engineering'}</span>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FIELD 3: DELIVERABLE ARTIFACT DOMAINS (Q3) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  3. Deliverable Artifact Domains
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Outputs & project artifact types</span>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {deliverableDomainOptions.map(opt => {
                    const isSelected = draftDeliverableDomains.includes(opt.id);
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleDomain(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50/60 border-[#1A56DB] text-slate-900 shadow-2xs font-sf-pro font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-sf-pro font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1A56DB]' : 'text-slate-400'}`} />
                          <span className="text-xs">{opt.title}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-[#1A56DB] border-[#1A56DB] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {deliverableDomainOptions
                    .filter(opt => (userProfile.deliverableDomains || ['creative-design']).includes(opt.id))
                    .map(opt => {
                      const IconComp = opt.icon;
                      return (
                        <div key={opt.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-sf-pro font-semibold text-slate-800 shadow-2xs">
                          <IconComp className="w-3.5 h-3.5 text-[#1A56DB]" />
                          <span>{opt.title}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FIELD 4: FEEDBACK FOCUS & OUTCOMES (Q4) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  4. Feedback Focus & Outcome Synthesis (Selected All)
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Valued evaluation stages</span>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-2">
                  {feedbackStageOptions.map(opt => {
                    const isSelected = draftFeedbackStages.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleStage(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/60 border-[#1A56DB] text-slate-900 shadow-2xs font-sf-pro font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-sf-pro font-medium'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-sf-pro font-bold text-slate-900">{opt.title}</span>
                          <span className="text-[10.5px] font-sf-pro text-slate-400">{opt.desc}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#1A56DB] border-[#1A56DB] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {feedbackStageOptions
                    .filter(opt => (userProfile.feedbackStages || ['formative-feedback', 'summative-assessment', 'knowledge-notes', 'career-alignment']).includes(opt.id))
                    .map(opt => (
                      <div key={opt.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs font-sf-pro font-semibold text-slate-800 shadow-2xs">
                        <Check className="w-4 h-4 text-[#1A56DB] flex-shrink-0 stroke-[2.5]" />
                        <span>{opt.title}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FIELD 5: TARGET CAREER ROLE (Q5) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  5. Target Career Role
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Industry benchmark target</span>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={draftTargetRole}
                    onChange={(e) => setDraftTargetRole(e.target.value)}
                    placeholder="Enter target career role..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-sf-pro font-semibold text-slate-800 focus:outline-none focus:border-[#1A56DB] focus:ring-2 focus:ring-[#1A56DB]/20"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Product Manager', 'Hardware PM', 'UX Researcher', 'Data Analyst', 'Strategy Consultant', 'Software Architect', 'Still Exploring'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setDraftTargetRole(role)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-sf-pro font-semibold transition-all cursor-pointer border ${
                          draftTargetRole === role
                            ? 'bg-[#1A56DB] text-white border-[#1A56DB] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-sf-pro font-semibold text-slate-800 shadow-2xs">
                  <Briefcase className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span>{userProfile.targetCareerRole || 'Product Manager'}</span>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* FIELD 6: SELECTED AI COPILOT PERSONA (Q6) */}
            {/* ---------------------------------------------------- */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sf-pro font-bold text-slate-800 tracking-normal">
                  6. Preferred AI Assistance Style & Persona
                </span>
                <span className="text-[10.5px] font-sf-pro text-slate-400">Communication & dialogue tone</span>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                  {personaOptions.map(opt => {
                    const isSelected = draftPersona === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDraftPersona(opt.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/40 border-[#1A56DB] shadow-2xs ring-1 ring-[#1A56DB]/20'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          {/* Card Top Row: Icon + Title + Radio Checkmark */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-xl border transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-[#1A56DB] border-blue-200 shadow-2xs'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                <IconComp className="w-3.5 h-3.5 stroke-[2.2]" />
                              </div>
                              <h4 className={`text-xs font-sf-pro font-bold tracking-tight ${
                                isSelected ? 'text-slate-900' : 'text-slate-700'
                              }`}>
                                {opt.title}
                              </h4>
                            </div>

                            {/* Radio Selection Checkmark */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected ? 'bg-[#1A56DB] border-[#1A56DB] text-white shadow-2xs' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Description Text */}
                          <p className="text-[10.5px] font-sf-pro text-slate-500 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>

                        {/* Bottom Tagline Badge */}
                        <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                          <span className={`text-[9px] font-sf-pro font-semibold tracking-normal ${
                            isSelected ? 'text-[#1A56DB]' : 'text-slate-400'
                          }`}>
                            {opt.id === 'action-coach' ? 'Goal & Action Focused' : opt.id === 'empathetic-mentor' ? 'Supportive & Growth Guided' : 'Critical & Inquiry Driven'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                (() => {
                  const currentP = personaOptions.find(p => p.id === (userProfile.copilotPersona || 'action-coach')) || personaOptions[0];
                  const IconComp = currentP.icon;
                  return (
                    <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-[#1A56DB] border border-blue-200/60 shadow-2xs">
                          <IconComp className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sf-pro font-bold text-slate-900">{currentP.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[9.5px] font-sf-pro font-semibold text-[#1A56DB] tracking-normal">
                              Active Persona
                            </span>
                          </div>
                          <span className="text-[11px] font-sf-pro text-slate-500 leading-relaxed">{currentP.desc}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Helper icon component wrapper
function BoxIcon(props: any) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

export default PersonalCenter;
