import { create } from 'zustand';

// Import high-fidelity English mock databases initialized in Task 1
import formativeDataRaw from '../mock/formative_feedback.json';
import summativeDataRaw from '../mock/summative_feedback.json';
import globalCompetencyDataRaw from '../mock/global_competency.json';

// Import real Gemini API service layer
import { generateTodoValidation, processRawFeedback, generateChatResponse, generateTodoOmissions, generateSequenceOptimization, sanitizeKeyPointSeverities } from '../utils/geminiService';

export interface WeightedGradeItem {
  dimensionName: string;
  weight: number;            // 权重占比，如 40, 25, 15, 10
  scoreRange: string;        // 原始区间字串，如 "60-70"
  scorePercentage: number;   // 分数百分比中位数，如 65, 55
  scoreTier: 'excellent' | 'very-good' | 'satisfactory' | 'fail';
  absoluteContribution: number; 
}

export type FeedbackRoute = 'workbench' | 'formative-sandbox' | 'summative-dashboard' | 'global-competency' | 'personal-center' | 'archive-asset-detail' | 'auth-onboarding';
export type SidebarMode = 'library-tree' | 'project-setup' | 'project-active';
export type TodoMode = 'edit' | 'locked';

export interface SelectedArchiveAssetInfo {
  id: string;
  name: string;
  courseName?: string;
  folderTag?: string;
  tagColor?: string;
  type?: 'formative' | 'summative';
}

export interface ProjectMaterial {
  id: string;
  name: string;
  type: 'rubrics' | 'requirement' | 'current-draft' | 'reference';
  fileSize: number;
  selected?: boolean;
  fileUrl?: string;
  rawText?: string;
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  feedbackType: 'formative' | 'summative';
  attachedMaterials: ProjectMaterial[];
  summativeMaterials: ProjectMaterial[];
  folderTag?: string;
  tagColor?: string;
  folderName?: string;
}

export interface SandboxTodoItem {
  id: string;
  title: string;       // Task title
  description?: string; // Task details
  isCustom: boolean;
  linkedFeedbackPointId?: string;
  orderIndex: number;
  isCompleted?: boolean;
  phase?: 'early' | 'mid' | 'late';
}

export interface VersionHistoryNode {
  id: string;
  name: string;
  timestamp: string;
  todos: SandboxTodoItem[];
  parentVersionId: string | null;
  author: 'user' | 'ai-branched';
  description: string;
}

export interface AIValidationResult {
  status: 'idle' | 'validating' | 'completed';
  alignmentScore: number;
  gapAnalysis: string;
  suggestions: string[];
}

export interface GuideActionItem {
  id: string;
  title: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  hasSuggestions?: boolean;
  suggestions?: Array<{ title: string; description: string }>;
  hasGuideActions?: boolean;
  guideActions?: GuideActionItem[];
  hasOmissions?: boolean;
  hasSequence?: boolean;
  sequence?: Array<{ title: string; rationale: string; phase: 'early' | 'mid' | 'late' }>;
  isLoading?: boolean;
  isStopped?: boolean;
}

export interface RubricStatusItem {
  criterion: string;                   // 胶囊标签名
  status: 'green' | 'yellow' | 'red'; // 状态灯
  isOfficialRubric: boolean;          // true 表示强符合官方 Rubric；false 表示 AI 质性归纳的标签
}

export interface BriefingOverview {
  overallGrade: string;                // "A", "Green", 若无则为 "?"
  isAutoCalculated?: boolean;          // 是否由 AI 加权计算得出
  metrics: { redCount: number; yellowCount: number; greenCount: number; }; // 由前端动态计算，不从 API 接收
  rubricStatuses: RubricStatusItem[];  // 胶囊集合
  globalSummary: string;               // 严格受控的宏观概述文本
  subScores?: Array<{ dimension: string; weight?: string; score: string }>; // 小分模块数据
}

export interface FileLocationAnchor {
  fileId: string;
  pageNumber: number;          // 目标物理页码
  boundingBox?: {              // 针对 PDF 的 Canvas 物理网格绝对百分比坐标
    x: number; y: number; width: number; height: number;
  };
  paragraphId?: string;        // 针对 Word 的流式 HTML 段落锚点 ID
}

export interface FormativeSchema {
  projectId: string;
  originalFeedbackText: string;
  politeFluffRanges: Array<{ startOffset: number; endOffset: number; text: string }>;
  coreKeyPoints: Array<{ 
    id: string; 
    title: string; 
    summary: string; 
    startOffset: number; 
    endOffset: number; 
    severity: 'critical' | 'moderate' | 'minor'; 
    sourceExcerpt?: string;
    associatedCriterion: string;       // 关联的胶囊标签名
    isOfficialRubric: boolean;        // 标识该要点属于官方轨道还是自主归纳轨道
    fileLocationAnchor?: FileLocationAnchor; // 实体文件的坐标网格锚定
  }>;
  parallelProposals: Array<{ id: string; branchName: string; promptCommand: string; impactOnLogic: string; recommendationList: string[]; status: 'draft' | 'locked' }>;
  briefingOverview?: BriefingOverview;
}

export type MetaCapabilityTag = 
  | 'Academic Writing' 
  | 'Structural & Causal Logic' 
  | 'Visual & Presentation Design' 
  | 'Research Methodology & Evidence' 
  | 'Project & Risk Management';

export interface SavedNoteItem {
  id: string;
  title: string;
  tag: string;
  keyTakeaway: string;
  sourceProjectName?: string;
  addedAt: string;
  isFavorite?: boolean;
}

export interface SavedPlanItem {
  id: string;
  title: string;
  tag: string;
  suggestedAction: string;
  sourceProjectName?: string;
  addedAt: string;
  completed?: boolean;
}

export interface SummativeAcademicRecommendation {
  id: string;
  metaCapabilityTag: MetaCapabilityTag;
  targetWeaknessTitle: string;
  title: string;
  description: string;
  actionableGuidance: string;
}

export interface SummativeAdvancedExploration {
  id: string;
  topicTitle: string;
  explorationScope: string;
  capabilityTag?: string;
}

export interface SummativeNextSteps {
  academicRecommendations: SummativeAcademicRecommendation[];
  advancedExplorations?: SummativeAdvancedExploration[] | null;
}

export interface SummativeSchema {
  projectId: string;
  date?: string;
  grade: string;
  isAutoCalculated?: boolean;
  originalFeedbackText: string;
  globalSummary: string;
  subScores: Array<{
    dimension: string;
    weight: string | null;
    score: string;
    absoluteContribution?: number;
    scorePercentage?: number;
  }> | null;
  keyStrengths: Array<{
    id: string;
    title: string;
    praiseHighlight: string;
    exactPhrase?: string;
    anchor: { start: number; end: number };
  }>;
  areasForImprovement: Array<{
    id: string;
    title: string;
    issueHighlight: string;
    exactPhrase?: string;
    anchor: { start: number; end: number };
  }>;
  nextSteps?: SummativeNextSteps;
}

export interface GlobalCompetencySchema {
  studentId: string;
  academicHistory: Array<{ semester: string; courseId: string; courseName: string; dimensions: Record<string, number> }>;
  competencyTimeSeries: Array<{ date: string; scores: Record<string, number> }>;
  careerMatching: {
    matchedProfiles: Array<{
      profileId: string;
      roleName: string;
      matchPercentage: number;
      roleStrengths: string[];
      gaps: Array<{ competencyName: string; academicScore: number; requiredScore: number; gapDistance: number }>;
    }>;
    recommendedActions: Array<{ id: string; targetCompetency: string; title: string; description: string; resourceType: 'writing_center' | 'micro_course' | 'workshop' | 'link'; actionLink: string }>;
  };
}

export interface FeedbackRoundNode {
  id: string;
  name: string;
  timestamp: string;
  originalFeedbackText: string;
  coreKeyPoints: Array<{ 
    id: string; 
    title: string; 
    summary: string; 
    startOffset: number; 
    endOffset: number; 
    severity: 'critical' | 'moderate' | 'minor'; 
    sourceExcerpt?: string;
    associatedCriterion: string;
    isOfficialRubric: boolean;
  }>;
  briefingOverview?: BriefingOverview;
  attachedMaterials: ProjectMaterial[];
  todoList: SandboxTodoItem[];
}

export interface ArchivedProject {
  projectId: string;
  projectName: string;
  courseCode: string;
  courseName: string;
  semester: string;
  feedbackType: 'formative' | 'summative';
  attachedMaterials: ProjectMaterial[];
  todoList?: SandboxTodoItem[];
  versionHistoryTree?: Record<string, VersionHistoryNode>;
  currentVersionId?: string;
  aiValidationResult?: AIValidationResult;
  formativeRounds?: FeedbackRoundNode[];
  activeRoundId?: string;
  summativeFeedbackData?: SummativeSchema | null;
  summativeMaterials?: ProjectMaterial[];
}

export interface UserOnboardingProfile {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  userFlowMode: 'existing' | 'new-onboarded';
  email?: string;
  academicLevel?: string;
  fieldOfStudy?: string;
  deliverableDomains?: string[];
  feedbackStages?: string[];
  targetCareerRole?: string;
  copilotPersona?: string;
}

// Store API State Schema
export interface AppGlobalState {
  // Onboarding & User Profile State
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
  userProfile: UserOnboardingProfile;
  updateUserProfile: (profile: Partial<UserOnboardingProfile>) => void;
  completeOnboarding: (data: Partial<UserOnboardingProfile>) => void;
  loginAsExistingUser: () => void;
  loginAsNewOnboardedUser: (data: Partial<UserOnboardingProfile>) => void;
  switchUserFlowMode: (mode: 'existing' | 'new-onboarded') => void;
  resetOnboarding: () => void;

  // Navigation Routing & Activation States
  currentRoute: FeedbackRoute;
  sidebarMode: SidebarMode;
  sidebarExpanded: boolean;
  activeProject: ProjectContext | null;
  selectedArchiveAssetInfo: SelectedArchiveAssetInfo | null;
  isLaunched: boolean;
  isReadOnly: boolean;
  
  // Formative Sandbox Dynamic Layout
  isAIWorking: boolean;
  globalAbortController: AbortController | null;
  todoAuditStage: 'idle' | 'awaiting_initial_confirmation' | 'omission-checking' | 'omission-decision' | 'awaiting-sequence' | 'sequence-checking';
  detectedOmissions: Array<{
    id: string;
    title: string;
    description: string;
    sourceExcerpt: string;
    status: 'pending' | 'added' | 'ignored';
  }>;
  courseHandbookText: string;
  currentAssignmentText: string;
  isMaterialReminderOpen: boolean;
  activeLeftTab: 'briefing' | 'todo' | 'proposals';
  activatedLeftTools: { briefing: boolean; todo: boolean; proposals: boolean };
  selectedBriefingIds: string[];
  activeRightTab: 'input' | 'transcript' | 'document' | 'chatbox';
  hasUnreadChatNotification: boolean;
  setHasUnreadChatNotification: (unread: boolean) => void;
  hasNotifiedFirstNote?: boolean;
  hasNotifiedFirstPlan?: boolean;
  chatMessages: ChatMessage[];
  summativeChatMessages: ChatMessage[];
  longtermChatMessages: ChatMessage[];
  rawFeedbackInput: string;
  
  // Archived Database
  pastProjects: ArchivedProject[];
  
  // Database References
  formativeFeedbackData: FormativeSchema;
  summativeFeedbackData: SummativeSchema | null;
  globalCompetencyData: GlobalCompetencySchema;

  // Formative Sandbox State
  todoList: SandboxTodoItem[];
  initialTodoList: SandboxTodoItem[];
  todoMode: TodoMode;
  sandboxInteracted: boolean;
  aiValidationResult: AIValidationResult | null;
  // Versioning History Tree (Git-like revisions)
  versionHistoryTree: Record<string, VersionHistoryNode>;
  currentVersionId: string;

  // Formative rounds actions
  formativeRounds: FeedbackRoundNode[];
  activeRoundId: string | null;
  isEditingCurrentRound: boolean;
  setIsEditingCurrentRound: (isEditing: boolean) => void;
  isPreparingNewRound: boolean;
  setIsPreparingNewRound: (preparing: boolean) => void;
  selectFormativeRound: (roundId: string) => void;
  addNewFeedbackRound: (text: string, syncMaterialIds: string[]) => Promise<void>;
  updateCurrentFeedbackRound: (text: string) => Promise<void>;
  perspective: 'academic' | 'career';
  highlightedTextRange: { start: number; end: number; exactPhrase?: string; timestamp?: number } | FileLocationAnchor | null;
  activeAnchorContext: { issueId: string; timestamp: number } | null;

  // Notes Repository State
  savedNotes: SavedNoteItem[];
  addNote: (note: SavedNoteItem) => void;
  removeNote: (noteId: string) => void;
  toggleFavoriteNote: (noteId: string) => void;
  clearNotes: () => void;

  // Long-Term Plans Repository State
  savedPlans: SavedPlanItem[];
  addPlan: (plan: SavedPlanItem) => void;
  removePlan: (planId: string) => void;
  togglePlanCompleted: (planId: string) => void;
  clearPlans: () => void;

  // Actions / Reducers
  setSelectedArchiveAssetInfo: (info: SelectedArchiveAssetInfo | null) => void;
  setRoute: (route: FeedbackRoute) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setActiveProject: (project: ProjectContext) => void;
  setFolderName: (name: string) => void;
  setProjectFolderInfo: (folderName?: string, folderTag?: string, tagColor?: string) => void;
  setSummativeFeedbackData: (data: SummativeSchema | null) => void;
  
  // Project Activation Lock Actions
  launchWorkspace: () => void;
  selectProjectFromTree: (projectId: string, isReadOnly: boolean) => void;
  createNewDraftProject: () => void;
  
  // Formative Sandbox Canvas Actions
  setLeftTab: (tab: 'briefing' | 'todo' | 'proposals') => void;
  setActiveRightTab: (tab: 'input' | 'transcript' | 'document' | 'chatbox') => void;
  setRawFeedbackInput: (input: string) => void;
  setIsMaterialReminderOpen: (open: boolean) => void;
  triggerFeedbackAnalysis: (text: string, force?: boolean) => Promise<void>;
  processFormativeFeedback: (text: string) => Promise<void>;
  sendChatMessage: (text: string, moduleType?: 'formative' | 'summative' | 'longterm') => Promise<void>;
  cancelGlobalAIGeneration: () => void;
  
  // Todo List Actions
  setTodoMode: (mode: TodoMode) => void;
  updateTodoList: (todos: SandboxTodoItem[]) => void;
  validateTodoWithAI: () => Promise<void>;
  runTodoAuditProcess: (userConsentText?: string) => Promise<void>;
  toggleSelectBriefing: (id: string) => void;
  toggleSelectAllBriefings: (allIds: string[]) => void;
  toggleOmissionStatus: (id: string, action: 'added' | 'ignored') => void;
  triggerSequenceAudit: (consentText: string) => Promise<void>;
  applyRecommendedSequence: (orderedMapping: Array<{ id: string; phase: 'early' | 'mid' | 'late' }>) => void;
  addSelectedBriefingsToTodo: () => void;
  applyAISuggestions: (suggestions: Array<{ title: string; description: string }>) => void;
  
  // Reactive Sidebar Reducers
  setProjectName: (name: string) => void;
  setFeedbackType: (type: 'formative' | 'summative') => void;
  addMaterial: (material: ProjectMaterial) => void;
  removeMaterial: (id: string) => void;
  toggleMaterialSelection: (id: string) => void;
  initializeEmptyProject: () => void;
  
  // Version Tree Actions
  lockBranchAndMerge: (branchId: string, description: string) => void;
  backtrackToVersion: (versionId: string) => void;
  
  // Common Interactions
  togglePerspective: () => void;
  setHighlightedTextRange: (range: { start: number; end: number; exactPhrase?: string; timestamp?: number } | FileLocationAnchor | null) => void;
  setActiveAnchorContext: (context: { issueId: string; timestamp: number } | null) => void;
  archiveProjectToLongTermAsset: () => Promise<void>;
  activateProjectFromArchive: (projectId: string) => void;
}

// ==========================================
// 2. HELPER FUNCTIONS FOR COMPARISON
// ==========================================

const hasTodoListChanges = (current: SandboxTodoItem[], initial: SandboxTodoItem[]): boolean => {
  if (current.length !== initial.length) return true;

  const currentSorted = [...current].sort((a, b) => a.id.localeCompare(b.id));
  const initialSorted = [...initial].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < currentSorted.length; i++) {
    if (currentSorted[i].title !== initialSorted[i].title) {
      return true;
    }
  }

  const currentIndexSeq = [...current].sort((a, b) => a.orderIndex - b.orderIndex).map(t => t.id);
  const initialIndexSeq = [...initial].sort((a, b) => a.orderIndex - b.orderIndex).map(t => t.id);

  for (let i = 0; i < currentIndexSeq.length; i++) {
    if (currentIndexSeq[i] !== initialIndexSeq[i]) {
      return true;
    }
  }

  return false;
};

// ==========================================
// 3. STORE CREATION (ZUSTAND)
// ==========================================

const mockPastProjects: ArchivedProject[] = [
  {
    projectId: 'past-proj-1',
    projectName: 'Autonomous Lane Keeping Safety Verification',
    courseCode: 'AUT-401',
    courseName: 'Automotive Ethics',
    semester: '2025 Fall',
    feedbackType: 'formative',
    attachedMaterials: [
      { id: 'm-past-1', name: 'Lane_Keeping_Rubric.pdf', type: 'rubrics', fileSize: 102400, selected: true },
      { id: 'm-past-2', name: 'Draft_v1_Verification.docx', type: 'current-draft', fileSize: 512000, selected: true }
    ],
    todoList: [
      { id: 'todo-past-1', title: 'Define safety boundaries', description: 'Resolve core issue: Define safety boundaries for highway maneuvers', isCustom: false, orderIndex: 0, isCompleted: true },
      { id: 'todo-past-2', title: 'Lane edge thresholds', description: 'Establish mathematical lane edge threshold offsets', isCustom: true, orderIndex: 1, isCompleted: false }
    ],
    versionHistoryTree: {
      'v0-root': {
        id: 'v0-root',
        name: 'Initial Layout',
        timestamp: '2025-10-12T14:00:00Z',
        todos: [
          { id: 'todo-past-1', title: 'Resolve core issue: Define safety boundaries for highway maneuvers', isCustom: false, orderIndex: 0 }
        ],
        parentVersionId: null,
        author: 'user',
        description: 'System-generated baseline checklist.'
      },
      'ver-locked-past-1': {
        id: 'ver-locked-past-1',
        name: 'Quantitative Lane Edge Locked',
        timestamp: '2025-10-15T09:30:00Z',
        todos: [
          { id: 'todo-past-1', title: 'Resolve core issue: Define safety boundaries for highway maneuvers', isCustom: false, orderIndex: 0 },
          { id: 'todo-past-2', title: 'Establish mathematical lane edge threshold offsets', isCustom: true, orderIndex: 1 }
        ],
        parentVersionId: 'v0-root',
        author: 'ai-branched',
        description: 'Merged quantitative model proposals.'
      }
    },
    currentVersionId: 'ver-locked-past-1',
    aiValidationResult: {
      status: 'completed',
      alignmentScore: 88,
      gapAnalysis: 'Archived historical check: The methodology aligned with 88% accuracy against course rubrics.',
      suggestions: []
    },
    formativeRounds: [
      {
        id: 'round-past-1-r1',
        name: 'Round 1 (2025-10-12)',
        timestamp: '2025-10-12T14:00:00Z',
        originalFeedbackText: 'This is the initial feedback for safety boundaries verification. You need to define safety boundaries for highway maneuvers and establish mathematical lane edge thresholds.',
        coreKeyPoints: [
          {
            id: 'kp-past-1',
            title: 'Define safety boundaries',
            summary: 'Identify highway safety metrics.',
            startOffset: 0,
            endOffset: 50,
            severity: 'critical',
            sourceExcerpt: 'define safety boundaries for highway maneuvers',
            associatedCriterion: 'Methodological Rigor',
            isOfficialRubric: true
          },
          {
            id: 'kp-past-2',
            title: 'Lane edge thresholds',
            summary: 'Determine offset thresholds.',
            startOffset: 60,
            endOffset: 120,
            severity: 'moderate',
            sourceExcerpt: 'establish mathematical lane edge thresholds',
            associatedCriterion: 'Methodological Rigor',
            isOfficialRubric: true
          }
        ],
        briefingOverview: {
          overallGrade: 'B+',
          metrics: { redCount: 1, yellowCount: 1, greenCount: 0 },
          rubricStatuses: [
            { criterion: 'Methodological Rigor', status: 'red', isOfficialRubric: true }
          ],
          subScores: [
            { dimension: 'Methodological Rigor', weight: '40%', score: 'Fail (<50)' }
          ],
          globalSummary: 'Safety verification logic is solid but boundary definitions require math offsets.'
        },
        attachedMaterials: [
          { id: 'm-past-1', name: 'Lane_Keeping_Rubric.pdf', type: 'rubrics', fileSize: 102400, selected: true },
          { id: 'm-past-2', name: 'Draft_v1_Verification.docx', type: 'current-draft', fileSize: 512000, selected: true }
        ],
        todoList: [
          { id: 'todo-past-1', title: 'Define safety boundaries', description: 'Resolve core issue: Define safety boundaries for highway maneuvers', isCustom: false, orderIndex: 0, isCompleted: true },
          { id: 'todo-past-2', title: 'Lane edge thresholds', description: 'Establish mathematical lane edge threshold offsets', isCustom: true, orderIndex: 1, isCompleted: false }
        ]
      }
    ],
    activeRoundId: 'round-past-1-r1'
  },
  {
    projectId: 'past-proj-2',
    projectName: 'Explainable AI in Medical Diagnostics Case Study',
    courseCode: 'THE-502',
    courseName: 'Autonomous Systems & Ethics',
    semester: '2026 Spring',
    feedbackType: 'summative',
    attachedMaterials: [
      { id: 'm-past-3', name: 'Medical_Ethics_Syllabus.pdf', type: 'rubrics', fileSize: 245000, selected: true },
      { id: 'm-past-4', name: 'Final_Case_Study_XAI.pdf', type: 'current-draft', fileSize: 2150000, selected: true }
    ],
    formativeRounds: [
      {
        id: 'round-past-2-r1',
        name: 'Round 1 (Formative)',
        timestamp: '2026-03-10T10:00:00Z',
        originalFeedbackText: 'This is the early draft feedback for Explainable AI in diagnostics. Address transparency and explainability models in detail.',
        coreKeyPoints: [
          {
            id: 'kp-past-2-1',
            title: 'Address diagnostic transparency parameters in methodology',
            summary: 'Detail transparency indicators.',
            startOffset: 0,
            endOffset: 60,
            severity: 'critical',
            sourceExcerpt: 'transparency and explainability models',
            associatedCriterion: 'Methodological Rigor',
            isOfficialRubric: true
          }
        ],
        briefingOverview: {
          overallGrade: 'B',
          metrics: { redCount: 1, yellowCount: 0, greenCount: 0 },
          rubricStatuses: [
            { criterion: 'Methodological Rigor', status: 'red', isOfficialRubric: true }
          ],
          subScores: [
            { dimension: 'Methodological Rigor', weight: '40%', score: 'Fail (<50)' }
          ],
          globalSummary: 'Excellent draft but lacking transparency detail.'
        },
        attachedMaterials: [
          { id: 'm-past-3', name: 'Medical_Ethics_Syllabus.pdf', type: 'rubrics', fileSize: 245000, selected: true },
          { id: 'm-past-4', name: 'Final_Case_Study_XAI.pdf', type: 'current-draft', fileSize: 2150000, selected: true }
        ],
        todoList: [
          { id: 'todo-past-2-1', title: 'Address diagnostic transparency parameters', description: 'Explain transparency and explainability models in detail', isCustom: false, orderIndex: 0, isCompleted: true }
        ]
      }
    ],
    activeRoundId: 'round-past-2-r1'
  }
];

export const compileMaterialTexts = (materials: ProjectMaterial[]) => {
  const selected = materials.filter(m => m.selected !== false);
  const handbookMaterials = selected.filter(m => m.type === 'rubrics' || m.type === 'requirement' || m.type === 'reference');
  const draftMaterials = selected.filter(m => m.type === 'current-draft');

  const courseHandbookText = handbookMaterials.map(m => 
    `COURSE HANDBOOK GUIDELINES from ${m.name}:\n${m.rawText || '- No raw text content extracted.'}`
  ).join('\n\n');

  const currentAssignmentText = draftMaterials.map(m => 
    `STUDENT ASSIGNMENT DRAFT from ${m.name}:\n${m.rawText || '- No raw text content extracted.'}`
  ).join('\n\n');
  return { courseHandbookText, currentAssignmentText };
};

export const presetNotesList: SavedNoteItem[] = [
  {
    id: 'preset-note-pd-01',
    title: 'CMF Surface Specification',
    tag: 'product design',
    keyTakeaway: 'Establish a rigorous CMF matrix defining surface grain depth (VDI 24-27), tactile friction coefficients, and bio-polymer recyclability prior to rapid injection molding.',
    sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
    addedAt: '2026-07-20',
    isFavorite: true
  },
  {
    id: 'preset-note-pd-02',
    title: 'Physical Ergonomic Clearance',
    tag: 'product design',
    keyTakeaway: 'Conduct 95th percentile hand clearance testing and iterative FDM mockups to validate mechanical joint stiffness before final tooling lock-in.',
    sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
    addedAt: '2026-07-21'
  },
  {
    id: 'preset-note-pd-03',
    title: 'DFM Snap-Fit Tolerance Analysis',
    tag: 'product design',
    keyTakeaway: 'Perform stack-up tolerance modeling and draft angle verification (1.5° minimum) on internal ribbing to prevent sink marks and structural fatigue.',
    sourceProjectName: 'DE7-DEP: Design Engineering Practice',
    addedAt: '2026-07-22'
  },
  {
    id: 'preset-note-pd-04',
    title: 'Haptic Controls for Accessibility',
    tag: 'product design',
    keyTakeaway: 'Integrate tactile detent feedback and high-contrast physical affordances to ensure intuitive single-handed operation for motor-impaired users.',
    sourceProjectName: 'DE7-DEP: Design Engineering Practice',
    addedAt: '2026-07-23'
  },
  {
    id: 'preset-note-res-01',
    title: 'Mixed-Methods Triangulation Protocol',
    tag: 'research',
    keyTakeaway: 'Combine qualitative thematic coding with quantitative SUS usability analytics to triangulate user cognitive friction points.',
    sourceProjectName: 'DE7-FTR: Foundational Research',
    addedAt: '2026-07-21',
    isFavorite: true
  },
  {
    id: 'preset-note-res-02',
    title: 'Ethical Data Privacy Governance',
    tag: 'research',
    keyTakeaway: 'Enforce GDPR anonymization protocols and cryptographic hashing for longitudinal field interview recordings.',
    sourceProjectName: 'DE7-ATR: Advanced Research',
    addedAt: '2026-07-22'
  },
  {
    id: 'preset-note-ixd-01',
    title: 'Sensor Sampling Telemetry Pipeline',
    tag: 'interactive design',
    keyTakeaway: 'Calibrate I2C bus frequencies and Kalman filter window sizes to minimize noise in real-time IMU motion capture routines.',
    sourceProjectName: 'DE7-SIOT: Sensing & IoT',
    addedAt: '2026-07-24',
    isFavorite: true
  },
  {
    id: 'preset-note-inn-01',
    title: 'Circular Business Revenue Models',
    tag: 'innovation strategy',
    keyTakeaway: 'Formulate product-service system (PSS) revenue loops with modular component refurbishing incentives to lower total cost of ownership.',
    sourceProjectName: 'DE7-IM: Innovation Management',
    addedAt: '2026-07-23'
  }
];

export const presetPlansList: SavedPlanItem[] = [
  {
    id: 'preset-plan-01',
    title: 'Interactive Real-Time Hardware Sensor Calibration',
    tag: 'interactive design',
    suggestedAction: 'Integrate RTOS firmware drivers and real-time protocol processing into multi-node physical prototyping rigs for stress testing.',
    sourceProjectName: 'DE7-SIOT: Sensing and Internet of Things',
    addedAt: '2026-07-25',
    completed: false
  },
  {
    id: 'preset-plan-02',
    title: 'Probabilistic Bayesian Modeling for Stakeholder Simulation',
    tag: 'research',
    suggestedAction: 'Deploy AI-assisted quantitative user testing analytics and synthetic persona simulations for transdisciplinary field research.',
    sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
    addedAt: '2026-07-26',
    completed: true
  },
  {
    id: 'preset-plan-03',
    title: 'Human-Centered Ergonomics & Anthropometric CAD Clearance',
    tag: 'product design',
    suggestedAction: 'Conduct 3D anthropometric scan analysis and DFM injection molding tolerance reviews for inclusive physical hardware products.',
    sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
    addedAt: '2026-07-27',
    completed: false
  }
];

export const useAppStore = create<AppGlobalState>((set, get) => ({
  // Onboarding & User Profile Initial State & Handlers
  isOnboardingModalOpen: false,
  setIsOnboardingModalOpen: (open: boolean) => set({ isOnboardingModalOpen: open }),
  userProfile: {
    isAuthenticated: true,
    isOnboarded: true,
    userFlowMode: 'existing',
    email: 'alex.chen@university.edu',
    academicLevel: 'Postgraduate',
    fieldOfStudy: 'Design Engineering',
    deliverableDomains: ['creative-design'],
    feedbackStages: ['formative-feedback', 'summative-evaluation', 'career-alignment'],
    targetCareerRole: 'Product Manager',
    copilotPersona: 'action-coach'
  },
  updateUserProfile: (profile) =>
    set(state => ({
      userProfile: { ...state.userProfile, ...profile }
    })),
  completeOnboarding: (data) =>
    set(state => ({
      userProfile: {
        ...state.userProfile,
        ...data,
        isAuthenticated: true,
        isOnboarded: true
      },
      isLaunched: false,
      activeProject: null,
      currentRoute: 'workbench',
      sidebarMode: 'library-tree',
      sidebarExpanded: true,
      isOnboardingModalOpen: false
    })),
  loginAsExistingUser: () =>
    set(state => ({
      userProfile: {
        ...state.userProfile,
        userFlowMode: 'existing',
        academicLevel: 'Postgraduate',
        fieldOfStudy: 'Design Engineering',
        deliverableDomains: ['creative-design'],
        feedbackStages: ['formative-feedback', 'summative-evaluation', 'career-alignment'],
        targetCareerRole: 'Product Manager',
        copilotPersona: 'action-coach',
        isAuthenticated: true,
        isOnboarded: true
      },
      isLaunched: false,
      activeProject: null,
      currentRoute: 'workbench',
      sidebarMode: 'library-tree',
      sidebarExpanded: true,
      savedNotes: presetNotesList,
      savedPlans: presetPlansList,
      isOnboardingModalOpen: false
    })),
  loginAsNewOnboardedUser: (data) =>
    set(state => ({
      userProfile: {
        ...state.userProfile,
        academicLevel: 'Postgraduate',
        fieldOfStudy: 'Product Design',
        deliverableDomains: ['creative-design', 'papers-reports'],
        feedbackStages: ['formative-feedback', 'career-alignment'],
        targetCareerRole: 'Product Designer',
        copilotPersona: 'action-coach',
        ...data,
        userFlowMode: 'new-onboarded',
        isAuthenticated: true,
        isOnboarded: true
      },
      isLaunched: false,
      activeProject: null,
      currentRoute: 'workbench',
      sidebarMode: 'library-tree',
      sidebarExpanded: true,
      pastProjects: [],
      savedNotes: [],
      savedPlans: [],
      isOnboardingModalOpen: false
    })),
  switchUserFlowMode: (mode) =>
    set(state => ({
      userProfile: {
        ...state.userProfile,
        userFlowMode: mode
      },
      pastProjects: mode === 'new-onboarded' ? [] : mockPastProjects
    })),
  resetOnboarding: () =>
    set(state => ({
      userProfile: {
        ...state.userProfile,
        isOnboarded: false
      },
      isOnboardingModalOpen: true
    })),

  // Navigation Routing & Activation States
  currentRoute: 'workbench',
  sidebarMode: 'library-tree',
  sidebarExpanded: true,
  activeProject: null,
  selectedArchiveAssetInfo: null,
  isLaunched: false,
  isReadOnly: false,
  
  // Formative Sandbox Dynamic Canvas Layout
  activeLeftTab: 'briefing',
  activatedLeftTools: { briefing: true, todo: false, proposals: false },
  selectedBriefingIds: [],
  activeRightTab: 'input',
  hasUnreadChatNotification: false,
  hasNotifiedFirstNote: false,
  hasNotifiedFirstPlan: false,
  chatMessages: [
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: `Hello! Ask me questions about your tutor's feedback, or click "Validate with AI" to evaluate your Todo List.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  summativeChatMessages: [
    {
      id: 'msg-sum-init-1',
      sender: 'ai',
      text: `Hello! Your summative feedback transcript has been successfully processed. You can now explore the following actions to guide your evaluation review:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasGuideActions: true,
      guideActions: [
        {
          id: 'sum-guide-1',
          title: 'Explore Briefing & Outcomes',
          description: 'Review executive summary, grade breakdown, and filtered strengths & weaknesses.'
        },
        {
          id: 'sum-guide-2',
          title: 'Transferable Academic Insights',
          description: 'Examine transferable academic experience and save key takeaways to build your personal knowledge base.'
        },
        {
          id: 'sum-guide-3',
          title: 'Future Explorations & Learning Plan',
          description: 'Discover long-term exploration topics mapped from course standards to chart your personal learning trajectory.'
        }
      ]
    }
  ],
  longtermChatMessages: [
    {
      id: 'msg-lt-init-1',
      sender: 'ai',
      text: `Hello! Welcome to your Long-term Repository. Here are recommended actions to help you navigate and explore your repository:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasGuideActions: true,
      guideActions: [
        {
          id: 'action-view-academic-notes',
          title: 'Review Knowledge Notes in Academic View',
          description: 'Switch to Academic View to manage extracted knowledge cards and domain notes.'
        },
        {
          id: 'action-view-career-match',
          title: 'Explore Career Match & Competency Radar',
          description: 'Switch to Career View to analyze competency alignment radar and target role requirements.'
        },
        {
          id: 'action-view-my-checklist',
          title: 'Check Self-Exploration Action Checklist',
          description: 'Manage your long-term exploration goals and action items in the right sidebar.'
        },
        {
          id: 'action-view-personal-center',
          title: 'Customize Profile & AI Advisor Persona',
          description: 'Go to User Center to update your target career role, student profile, or AI advisor settings.'
        }
      ]
    }
  ],
  rawFeedbackInput: '',
  isAIWorking: false,
  globalAbortController: null,
  todoAuditStage: 'idle',
  detectedOmissions: [],
  isMaterialReminderOpen: false,
  courseHandbookText: `COURSE HANDBOOK GUIDELINES:
- CRITERIA 1: Methodological Rigor (Weight: 40%). Database queries, search strings, index engines, and selection flows must be detailed transparently.
- CRITERIA 2: Critical Synthesis (Weight: 35%). Literature reviews must synthesize thematic arguments instead of summarizing papers chronologically.
- CRITERIA 3: Logical Structure & Bridging (Weight: 15%). Transitions between theoretical sections and empirical case studies must be coherent.
- CRITERIA 4: Formatting & APA 7th Reference Standard (Weight: 10%). Bib listings must use exact journal volume and issue annotations.`,

  currentAssignmentText: `STUDENT ASSIGNMENT DRAFT (EXCERPTS):
Section 1: Introduction. Autonomous vehicle ethics is a key topic.
Section 2: Theoretical Framework. We outline Kantian deontological rules for lane maneuvers.
Section 3: Case Studies. Tesla's autopilot feature has had several crashes. We summarize paper 1 (Smith 2019), then paper 2 (Jones 2021).
Section 4: Methodology. We search databases for papers.
Bibliography:
Smith, J. (2019). Autonomous Lane Keeping. Journal of Driving Science. [Inconsistent APA format]`,
  
  pastProjects: mockPastProjects,
  formativeFeedbackData: {
    projectId: '',
    originalFeedbackText: '',
    politeFluffRanges: [],
    coreKeyPoints: [],
    parallelProposals: (formativeDataRaw as any).parallelProposals || [],
    briefingOverview: undefined
  },
  summativeFeedbackData: null,
  globalCompetencyData: globalCompetencyDataRaw as unknown as GlobalCompetencySchema,

  // Sandbox workspace state
  todoList: [],
  initialTodoList: [],
  todoMode: 'edit',
  sandboxInteracted: false,
  aiValidationResult: null,

  // Version history tree tracking
  versionHistoryTree: {},
  currentVersionId: '',

  // Formative rounds storage
  formativeRounds: [],
  activeRoundId: null,
  isEditingCurrentRound: false,
  setIsEditingCurrentRound: (isEditing) => set({ isEditingCurrentRound: isEditing }),
  isPreparingNewRound: false,
  setIsPreparingNewRound: (preparing) => set({ isPreparingNewRound: preparing }),

  // Perspective state
  perspective: 'academic',
  highlightedTextRange: null,
  activeAnchorContext: null,

  // Notes Repository State
  savedNotes: [
    // --- Tag 1: product design (4 notes) ---
    {
      id: 'preset-note-pd-01',
      title: 'CMF Surface Specification',
      tag: 'product design',
      keyTakeaway: 'Establish a rigorous CMF matrix defining surface grain depth (VDI 24-27), tactile friction coefficients, and bio-polymer recyclability prior to rapid injection molding.',
      sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
      addedAt: '2026-07-20',
      isFavorite: true
    },
    {
      id: 'preset-note-pd-02',
      title: 'Physical Ergonomic Clearance',
      tag: 'product design',
      keyTakeaway: 'Conduct 95th percentile hand clearance testing and iterative FDM mockups to validate mechanical joint stiffness before final tooling lock-in.',
      sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
      addedAt: '2026-07-21'
    },
    {
      id: 'preset-note-pd-03',
      title: 'DFM Snap-Fit Tolerance Analysis',
      tag: 'product design',
      keyTakeaway: 'Perform stack-up tolerance modeling and draft angle verification (1.5° minimum) on internal ribbing to prevent sink marks and structural fatigue.',
      sourceProjectName: 'DE7-DEP: Design Engineering Practice',
      addedAt: '2026-07-22'
    },
    {
      id: 'preset-note-pd-04',
      title: 'Haptic Controls for Accessibility',
      tag: 'product design',
      keyTakeaway: 'Integrate tactile detent feedback and high-contrast physical affordances to ensure intuitive single-handed operation for motor-impaired users.',
      sourceProjectName: 'DE7-DEP: Design Engineering Practice',
      addedAt: '2026-07-23'
    },

    // --- Tag 2: research (4 notes) ---
    {
      id: 'preset-note-res-01',
      title: 'Mixed-Methods Ethnographic Protocol',
      tag: 'research',
      keyTakeaway: 'Cross-validate qualitative participant interview transcripts with quantitative sensor telemetry loggers to eliminate self-reporting bias.',
      sourceProjectName: 'DE7-FTR: Foundational Transdisciplinary Research',
      addedAt: '2026-07-21',
      isFavorite: true
    },
    {
      id: 'preset-note-res-02',
      title: 'Qualitative Thematic Coding Framework',
      tag: 'research',
      keyTakeaway: 'Develop a two-pass qualitative coding framework with inter-rater reliability checks (>0.85 Cohen\'s kappa) for user study transcription analysis.',
      sourceProjectName: 'DE7-FTR: Foundational Transdisciplinary Research',
      addedAt: '2026-07-22'
    },
    {
      id: 'preset-note-res-03',
      title: 'Bayesian User Intent Simulation',
      tag: 'research',
      keyTakeaway: 'Apply Bayesian prior probability updates to model multi-stage user decision latency under cognitive overload conditions.',
      sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
      addedAt: '2026-07-24'
    },
    {
      id: 'preset-note-res-04',
      title: 'Synthetic Persona Auditing',
      tag: 'research',
      keyTakeaway: 'Synthesize multi-agent synthetic persona simulations to stress-test extreme edge-case interaction scenarios during pre-deployment studies.',
      sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
      addedAt: '2026-07-25'
    },

    // --- Tag 3: interactive design (4 notes) ---
    {
      id: 'preset-note-ixd-01',
      title: 'UX User Flow Mapping',
      tag: 'interactive design',
      keyTakeaway: 'Map non-linear user decision paths with explicit error-recovery loops and state transitions before committing to high-fidelity wireframes.',
      sourceProjectName: 'DE7-DEP: Design Engineering Practice',
      addedAt: '2026-07-22'
    },
    {
      id: 'preset-note-ixd-02',
      title: 'Real-Time Sensor Filtering Pipeline',
      tag: 'interactive design',
      keyTakeaway: 'Implement a low-pass Kalman filter on raw accelerometer data to reduce jitter and ensure smooth spatial gesture tracking (<15ms latency).',
      sourceProjectName: 'DE7-SIOT: Sensing & Internet of Things',
      addedAt: '2026-07-23'
    },
    {
      id: 'preset-note-ixd-03',
      title: 'Embedded Edge Interfacing Protocol',
      tag: 'interactive design',
      keyTakeaway: 'Configure DMA buffer transfers for multi-channel ADC sampling to prevent main thread blocking on resource-constrained microcontrollers.',
      sourceProjectName: 'DE7-SIOT: Sensing & Internet of Things',
      addedAt: '2026-07-25'
    },
    {
      id: 'preset-note-ixd-04',
      title: 'Spatial Binaural Soundscapes',
      tag: 'interactive design',
      keyTakeaway: 'Design HRTF-convoluted spatial audio feedback to provide ambient spatial directionality without causing auditory fatigue.',
      sourceProjectName: 'DE6-AXD: Audio Experience Design',
      addedAt: '2026-07-26'
    },

    // --- Tag 4: innovation strategy (4 notes) ---
    {
      id: 'preset-note-inn-01',
      title: 'Circular Business Revenue Models',
      tag: 'innovation strategy',
      keyTakeaway: 'Formulate product-service system (PSS) revenue loops with modular component refurbishing incentives to lower total cost of ownership.',
      sourceProjectName: 'DE7-IM: Innovation Management',
      addedAt: '2026-07-23'
    },
    {
      id: 'preset-note-inn-02',
      title: 'CapEx Risk Sensitivity Analysis',
      tag: 'innovation strategy',
      keyTakeaway: 'Build Monte Carlo ROI forecast models to evaluate tooling payback periods under fluctuating supply chain raw material costs.',
      sourceProjectName: 'DE7-IM: Innovation Management',
      addedAt: '2026-07-24'
    },
    {
      id: 'preset-note-inn-03',
      title: 'Value Proposition TRL Benchmarking',
      tag: 'innovation strategy',
      keyTakeaway: 'Benchmark prototype features against TRL 6 milestone criteria to ensure defensible IP protection before venture pitches.',
      sourceProjectName: 'DE7-IM: Innovation Management',
      addedAt: '2026-07-25'
    },
    {
      id: 'preset-note-inn-04',
      title: 'Sustainable Supply Chain Provenance',
      tag: 'innovation strategy',
      keyTakeaway: 'Audit Tier-1 supplier material provenance certifications to align product design roadmaps with Scope-3 emissions targets.',
      sourceProjectName: 'DE7-IM: Innovation Management',
      addedAt: '2026-07-26'
    },

    // --- Tag 5: academic writing (4 notes) ---
    {
      id: 'preset-note-aw-01',
      title: 'Literature Synthesis Structuring',
      tag: 'academic writing',
      keyTakeaway: 'Organize related works chronologically and thematic-wise to highlight methodology gaps before asserting novelty in thesis introduction.',
      sourceProjectName: 'DE7-FTR: Foundational Transdisciplinary Research',
      addedAt: '2026-07-22'
    },
    {
      id: 'preset-note-aw-02',
      title: 'Argumentative Causal Logic',
      tag: 'academic writing',
      keyTakeaway: 'Ensure all empirical claims are directly supported by quantitative telemetry datasets or peer-reviewed citations.',
      sourceProjectName: 'DE7-FTR: Foundational Transdisciplinary Research',
      addedAt: '2026-07-23'
    },
    {
      id: 'preset-note-aw-03',
      title: 'Abstract Formulation Precision',
      tag: 'academic writing',
      keyTakeaway: 'Draft concise 250-word structured abstracts following the Problem-Method-Result-Impact academic format.',
      sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
      addedAt: '2026-07-25'
    },
    {
      id: 'preset-note-aw-04',
      title: 'Citation & Data Provenance Standards',
      tag: 'academic writing',
      keyTakeaway: 'Maintain strict IEEE/APA bibliography formatting with accessible open-data DOI repository links.',
      sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
      addedAt: '2026-07-26'
    }
  ],
  addNote: (note) => {
    const state = get();
    if (state.savedNotes.some(n => n.id === note.id || (n.title === note.title && n.keyTakeaway === note.keyTakeaway))) {
      return;
    }
    const isFirstTime = !state.hasNotifiedFirstNote;
    if (isFirstTime) {
      const loadingId = `msg-note-loading-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id: loadingId,
        sender: 'ai',
        text: 'Syncing note to repository...',
        isLoading: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      set((s) => ({
        savedNotes: [...s.savedNotes, note],
        summativeChatMessages: [...s.summativeChatMessages, loadingMsg],
        hasUnreadChatNotification: s.activeRightTab !== 'chatbox',
        hasNotifiedFirstNote: true
      }));

      setTimeout(() => {
        set((s) => ({
          summativeChatMessages: s.summativeChatMessages.map(m =>
            m.id === loadingId
              ? {
                  ...m,
                  text: 'Note Added! You can view and manage it in the Long-Term Repository located in the left sidebar navigation.',
                  isLoading: false
                }
              : m
          )
        }));
      }, 1800);
    } else {
      set((s) => ({
        savedNotes: [...s.savedNotes, note]
      }));
    }
  },
  removeNote: (noteId) => set((state) => ({
    savedNotes: state.savedNotes.filter(n => n.id !== noteId)
  })),
  toggleFavoriteNote: (noteId) => set((state) => ({
    savedNotes: state.savedNotes.map(n =>
      n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
    )
  })),
  clearNotes: () => set({ savedNotes: [] }),

  // Long-Term Plans Repository State
  savedPlans: [
    {
      id: 'preset-plan-01',
      title: 'Parametric Hardware Prototyping & Sensor Calibration',
      tag: 'interactive design',
      suggestedAction: 'Integrate RTOS firmware drivers and real-time protocol processing into multi-node physical prototyping rigs for stress testing.',
      sourceProjectName: 'DE7-SIOT: Sensing and Internet of Things',
      addedAt: '2026-07-25',
      completed: false
    },
    {
      id: 'preset-plan-02',
      title: 'Probabilistic Bayesian Modeling for Stakeholder Simulation',
      tag: 'research',
      suggestedAction: 'Deploy AI-assisted quantitative user testing analytics and synthetic persona simulations for transdisciplinary field research.',
      sourceProjectName: 'DE7-ATR: Advanced Transdisciplinary Research',
      addedAt: '2026-07-26',
      completed: true
    },
    {
      id: 'preset-plan-03',
      title: 'Human-Centered Ergonomics & Anthropometric CAD Clearance',
      tag: 'product design',
      suggestedAction: 'Conduct 3D anthropometric scan analysis and DFM injection molding tolerance reviews for inclusive physical hardware products.',
      sourceProjectName: 'DE7-CDE: Contextual Design Engineering',
      addedAt: '2026-07-27',
      completed: false
    }
  ],
  addPlan: (plan) => {
    const state = get();
    if (state.savedPlans.some(p => p.id === plan.id || (p.title === plan.title && p.suggestedAction === plan.suggestedAction))) {
      return;
    }
    const isFirstTime = !state.hasNotifiedFirstPlan;
    if (isFirstTime) {
      const loadingId = `msg-plan-loading-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id: loadingId,
        sender: 'ai',
        text: 'Adding plan to roadmap...',
        isLoading: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      set((s) => ({
        savedPlans: [...s.savedPlans, { ...plan, completed: false }],
        summativeChatMessages: [...s.summativeChatMessages, loadingMsg],
        hasUnreadChatNotification: s.activeRightTab !== 'chatbox',
        hasNotifiedFirstPlan: true
      }));

      setTimeout(() => {
        set((s) => ({
          summativeChatMessages: s.summativeChatMessages.map(m =>
            m.id === loadingId
              ? {
                  ...m,
                  text: 'Plan Added! You can view and track it in the Long-Term Repository located in the left sidebar navigation.',
                  isLoading: false
                }
              : m
          )
        }));
      }, 1800);
    } else {
      set((s) => ({
        savedPlans: [...s.savedPlans, { ...plan, completed: false }]
      }));
    }
  },
  removePlan: (planId) => set((state) => ({
    savedPlans: state.savedPlans.filter(p => p.id !== planId)
  })),
  togglePlanCompleted: (planId) => set((state) => ({
    savedPlans: state.savedPlans.map(p =>
      p.id === planId ? { ...p, completed: !p.completed } : p
    )
  })),
  clearPlans: () => set({ savedPlans: [] }),

  // Actions
  setSelectedArchiveAssetInfo: (info) => set({ selectedArchiveAssetInfo: info }),
  setRoute: (route) => set({ currentRoute: route }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setSummativeFeedbackData: (data) => set({ summativeFeedbackData: data, hasUnreadChatNotification: false }),

  setActiveProject: (project) => {
    // Initial todo list state is empty [] to support deliberate user drafting
    const baselineTodos: SandboxTodoItem[] = [];

    const rootVersionId = 'v0-root';
    const rootNode: VersionHistoryNode = {
      id: rootVersionId,
      name: 'Initial Layout',
      timestamp: new Date().toISOString(),
      todos: baselineTodos,
      parentVersionId: null,
      author: 'user',
      description: 'System-generated baseline checklist.'
    };

    const materials = project.attachedMaterials || [];
    const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);
    const matchedPast = get().pastProjects.find(p => p.projectId === project.projectId);

    set({
      activeProject: project,
      formativeFeedbackData: {
        projectId: project.projectId,
        originalFeedbackText: '',
        politeFluffRanges: [],
        coreKeyPoints: [],
        parallelProposals: (formativeDataRaw as any).parallelProposals || [],
        briefingOverview: undefined
      },
      summativeFeedbackData: matchedPast?.summativeFeedbackData || null,
      isLaunched: true,
      isReadOnly: false,
      sidebarMode: 'project-active',
      activeLeftTab: 'briefing',
      activatedLeftTools: { briefing: true, todo: false, proposals: false },
      selectedBriefingIds: [],
      activeRightTab: 'input', // Always start on input text tab for pasting feedback
      todoList: baselineTodos,
      initialTodoList: baselineTodos,
      todoMode: 'edit',
      sandboxInteracted: false,
      versionHistoryTree: { [rootVersionId]: rootNode },
      currentVersionId: rootVersionId,
      aiValidationResult: null,
      highlightedTextRange: null,
      perspective: 'academic',
      courseHandbookText,
      currentAssignmentText,
      isMaterialReminderOpen: false,
      chatMessages: [
        {
          id: `msg-launch-${Date.now()}`,
          sender: 'ai',
          text: `Welcome to your SCAFFOLD workspace! Paste or enter your tutor's feedback on the right to start generating analysis insights.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  // Friction Lock Trigger: Explicit Launch workspace action
  launchWorkspace: () => {
    const active = get().activeProject;
    if (!active || !active.projectName.trim()) return;

    const type = active.feedbackType;
    const targetRoute = type === 'formative' ? 'formative-sandbox' : 'summative-dashboard';

    // Start with empty todoList
    const baselineTodos: SandboxTodoItem[] = [];
    const rootVersionId = 'v0-root';
    const rootNode = {
      id: rootVersionId,
      name: 'Initial Layout',
      timestamp: new Date().toISOString(),
      todos: baselineTodos,
      parentVersionId: null,
      author: 'user' as const,
      description: 'System-generated baseline checklist.'
    };

    const materials = active.attachedMaterials || [];
    const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);

    set({
      isLaunched: true,
      isReadOnly: false,
      sidebarMode: 'project-active',
      activeLeftTab: 'briefing',
      activatedLeftTools: { briefing: true, todo: false, proposals: false },
      selectedBriefingIds: [],
      activeRightTab: type === 'formative' ? 'input' : 'transcript',
      currentRoute: targetRoute,
      todoList: baselineTodos,
      initialTodoList: baselineTodos,
      todoMode: 'edit',
      sandboxInteracted: false,
      versionHistoryTree: { [rootVersionId]: rootNode },
      currentVersionId: rootVersionId,
      highlightedTextRange: null,
      aiValidationResult: null,
      courseHandbookText,
      currentAssignmentText,
      isMaterialReminderOpen: false,
      formativeRounds: [],
      activeRoundId: null,
      formativeFeedbackData: {
        projectId: active.projectId,
        originalFeedbackText: '',
        politeFluffRanges: [],
        coreKeyPoints: [],
        parallelProposals: [],
        briefingOverview: undefined
      },
      chatMessages: [
        {
          id: `msg-launch-${Date.now()}`,
          sender: 'ai',
          text: `Welcome to your SCAFFOLD workspace! Paste or enter your tutor's feedback on the right to start generating analysis insights.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  selectProjectFromTree: (projectId, isReadOnly) => {
    const matchedPast = get().pastProjects.find(p => p.projectId === projectId);
    
    if (matchedPast) {
      const project: ProjectContext = {
        projectId: matchedPast.projectId,
        projectName: matchedPast.projectName,
        feedbackType: matchedPast.feedbackType,
        attachedMaterials: matchedPast.attachedMaterials,
        summativeMaterials: matchedPast.summativeMaterials || []
      };

      const materials = matchedPast.attachedMaterials || [];
      const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);

      set({
        activeProject: project,
        isLaunched: true,
        isReadOnly: isReadOnly,
        sidebarMode: 'project-active',
        activeLeftTab: matchedPast.feedbackType === 'formative' ? 'briefing' : 'briefing',
        activatedLeftTools: { briefing: true, todo: true, proposals: true },
        selectedBriefingIds: [],
        activeRightTab: 'transcript',
        currentRoute: matchedPast.feedbackType === 'formative' ? 'formative-sandbox' : 'summative-dashboard',
        todoList: matchedPast.todoList || [],
        initialTodoList: matchedPast.todoList || [],
        todoMode: 'locked', // Locked by default for archived projects
        versionHistoryTree: matchedPast.versionHistoryTree || {},
        currentVersionId: matchedPast.currentVersionId || '',
        aiValidationResult: matchedPast.aiValidationResult || null,
        highlightedTextRange: null,
        perspective: 'academic',
        courseHandbookText,
        currentAssignmentText,
        isMaterialReminderOpen: false,
        formativeRounds: matchedPast.feedbackType === 'formative'
          ? (matchedPast.formativeRounds || [
              {
                id: 'round-archived-1',
                name: 'Round 1 (Archived)',
                timestamp: new Date().toISOString(),
                originalFeedbackText: (formativeDataRaw as any).originalFeedbackText || '',
                coreKeyPoints: (formativeDataRaw as any).coreKeyPoints || [],
                briefingOverview: (formativeDataRaw as any).briefingOverview,
                attachedMaterials: matchedPast.attachedMaterials || [],
                todoList: matchedPast.todoList || []
              }
            ])
          : [],
        activeRoundId: matchedPast.feedbackType === 'formative'
          ? (matchedPast.activeRoundId || 'round-archived-1')
          : null,
        summativeFeedbackData: matchedPast.summativeFeedbackData || null,
        chatMessages: [
          {
            id: `msg-past-${Date.now()}`,
            sender: 'ai',
            text: `Viewing archived project "${matchedPast.projectName}". Historical items and version nodes are in read-only review mode.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      });
    } else {
      const active = get().activeProject;
      if (active && active.projectId === projectId) {
        set({
          isReadOnly: false,
          isLaunched: true,
          sidebarMode: 'project-active',
          currentRoute: active.feedbackType === 'formative' ? 'formative-sandbox' : 'summative-dashboard'
        });
      }
    }
  },

  createNewDraftProject: () => {
    const draftId = `draft-${Date.now()}`;
    set({
      activeProject: {
        projectId: draftId,
        projectName: '',
        feedbackType: 'formative',
        attachedMaterials: [],
        summativeMaterials: []
      },
      formativeFeedbackData: {
        projectId: draftId,
        originalFeedbackText: '',
        politeFluffRanges: [],
        coreKeyPoints: [],
        parallelProposals: [],
        briefingOverview: undefined
      },
      summativeFeedbackData: null,
      isLaunched: false,
      isReadOnly: false,
      sidebarMode: 'project-setup',
      activeLeftTab: 'briefing',
      activatedLeftTools: { briefing: true, todo: false, proposals: false },
      selectedBriefingIds: [],
      activeRightTab: 'input',
      formativeRounds: [],
      activeRoundId: null,
      currentRoute: 'workbench',
      todoList: [],
      initialTodoList: [],
      todoMode: 'edit',
      sandboxInteracted: false,
      versionHistoryTree: {},
      currentVersionId: '',
      highlightedTextRange: null,
      perspective: 'academic',
      courseHandbookText: '',
      currentAssignmentText: '',
      isMaterialReminderOpen: false,
      chatMessages: [
        {
          id: `msg-setup-${Date.now()}`,
          sender: 'ai',
          text: `Hello! I am your formative academic advisor. Ask me questions about your tutor's feedback, or click "Validate with AI" to evaluate your Todo List.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  setLeftTab: (tab) => {
    set({
      activeLeftTab: tab,
      activatedLeftTools: {
        ...get().activatedLeftTools,
        [tab]: true
      }
    });
  },

  setActiveRightTab: (tab) => {
    if (tab === 'chatbox') {
      set({ activeRightTab: tab, hasUnreadChatNotification: false });
    } else {
      set({ activeRightTab: tab });
    }
  },

  setHasUnreadChatNotification: (unread) => {
    set({ hasUnreadChatNotification: unread });
  },

  setRawFeedbackInput: (input) => {
    set({ rawFeedbackInput: input });
  },

  setIsMaterialReminderOpen: (open) => set({ isMaterialReminderOpen: open }),

  triggerFeedbackAnalysis: async (text, force = false) => {
    const active = get().activeProject;
    const materials = active?.attachedMaterials || [];
    const selectedMaterials = materials.filter(m => m.selected !== false);

    if (!force && selectedMaterials.length === 0) {
      set({ isMaterialReminderOpen: true });
      return;
    }

    set({ isMaterialReminderOpen: false });
    
    const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);
    set({ courseHandbookText, currentAssignmentText });
    
    await get().processFormativeFeedback(text);
  },

  // Auto-mount and parse formative input feedback
  processFormativeFeedback: async (text) => {
    const active = get().activeProject;
    const currentName = active?.projectName || 'Processed Academic Synthesis';
    
    const draftProject: ProjectContext = {
      projectId: active?.projectId || `proj-${Date.now()}`,
      projectName: currentName,
      feedbackType: 'formative',
      attachedMaterials: active?.attachedMaterials || [],
      summativeMaterials: active?.summativeMaterials || []
    };

    const controller = new AbortController();
    set({
      isAIWorking: true,
      globalAbortController: controller
    });

    try {
      const parsedResult = await processRawFeedback(
        text,
        controller.signal,
        get().courseHandbookText || undefined,
        get().currentAssignmentText || undefined
      );

      let searchCursor = 0;
      const lowerRawText = (text || '').toLowerCase();
      const mappedKeyPoints = parsedResult.coreKeyPoints.map((kp) => {
        let start = -1;
        let end = -1;
        if (kp.sourceExcerpt) {
          const excerpt = kp.sourceExcerpt.trim();
          const lowerExcerpt = excerpt.toLowerCase();
          let foundIdx = lowerRawText.indexOf(lowerExcerpt, searchCursor);
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText.indexOf(prefix, searchCursor);
          }
          if (foundIdx === -1) {
            foundIdx = lowerRawText.indexOf(lowerExcerpt, 0);
          }
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText.indexOf(prefix, 0);
          }
          if (foundIdx !== -1) {
            start = foundIdx;
            end = foundIdx + excerpt.length;
            if (foundIdx >= searchCursor) {
              searchCursor = end;
            }
          }
        }
        return {
          id: kp.id,
          title: kp.title,
          summary: "",
          startOffset: start,
          endOffset: end,
          severity: kp.severity,
          sourceExcerpt: kp.sourceExcerpt,
          associatedCriterion: kp.associatedCriterion,
          isOfficialRubric: kp.isOfficialRubric
        };
      });
      sanitizeKeyPointSeverities(mappedKeyPoints as any);
      mappedKeyPoints.sort((a, b) => {
        const startA = a.startOffset >= 0 ? a.startOffset : Infinity;
        const startB = b.startOffset >= 0 ? b.startOffset : Infinity;
        return startA - startB;
      });

      const formativeSchemaData = {
        projectId: draftProject.projectId,
        originalFeedbackText: text,
        politeFluffRanges: [],
        coreKeyPoints: mappedKeyPoints,
        parallelProposals: [],
        briefingOverview: parsedResult.briefingOverview
      };

      const firstRoundId = `round-${Date.now()}`;
      const firstRoundNode: FeedbackRoundNode = {
        id: firstRoundId,
        name: `Formative (${new Date().toLocaleDateString()})`,
        timestamp: new Date().toISOString(),
        originalFeedbackText: text,
        coreKeyPoints: formativeSchemaData.coreKeyPoints,
        briefingOverview: formativeSchemaData.briefingOverview,
        attachedMaterials: draftProject.attachedMaterials,
        todoList: []
      };

      set({
        activeProject: draftProject,
        formativeFeedbackData: formativeSchemaData,
        formativeRounds: [firstRoundNode],
        activeRoundId: firstRoundId,
        isLaunched: true,
        isReadOnly: false,
        sidebarMode: 'project-active',
        activeLeftTab: 'briefing',
        activatedLeftTools: { briefing: true, todo: false, proposals: false },
        selectedBriefingIds: [],
        activeRightTab: 'chatbox',
        hasUnreadChatNotification: false,
        currentRoute: 'formative-sandbox',
        todoList: [], // Initial state is empty checklist
        initialTodoList: [],
        todoMode: 'edit',
        sandboxInteracted: false,
        versionHistoryTree: {
          'v0-root': {
            id: 'v0-root',
            name: 'Initial Layout',
            timestamp: new Date().toISOString(),
            todos: [],
            parentVersionId: null,
            author: 'user',
            description: 'System-generated baseline checklist.'
          }
        },
        currentVersionId: 'v0-root',
        aiValidationResult: null,
        pastProjects: get().pastProjects.some(p => p.projectId === draftProject.projectId)
          ? get().pastProjects.map(p => p.projectId === draftProject.projectId ? { ...p, formativeRounds: [firstRoundNode] } : p)
          : [{
              projectId: draftProject.projectId,
              projectName: draftProject.projectName || 'Processed Academic Synthesis',
              courseCode: 'THE-600',
              courseName: 'Research Synthesis',
              semester: '2026 Summer',
              feedbackType: 'formative',
              attachedMaterials: draftProject.attachedMaterials,
              todoList: [],
              versionHistoryTree: {},
              currentVersionId: 'v0-root',
              formativeRounds: [firstRoundNode]
            }, ...get().pastProjects],
        chatMessages: [
          {
            id: `msg-proc-${Date.now()}`,
            sender: 'ai',
            text: `Hello! Your formative feedback transcript has been successfully processed. You can now explore the following actions to guide your revision process:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasGuideActions: true,
            guideActions: [
              {
                id: 'guide-1',
                title: 'Filter Feedback by Category',
                description: 'Click category tags in Briefing to review feedback requirements by specific criteria.'
              },
              {
                id: 'guide-2',
                title: 'Examine Key Points & Anchors',
                description: 'Review key points and click location anchors to verify against original transcript and uploaded materials.'
              },
              {
                id: 'guide-3',
                title: 'Add Items to Todo List',
                description: 'Select and add key revision items to your Todo List for systematic revision.'
              }
            ]
          }
        ]
      });
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.toLowerCase().includes('abort') || error.message?.toLowerCase().includes('cancel'))) {
        console.warn("processFormativeFeedback aborted by student.");
        set({ isAIWorking: false, globalAbortController: null });
        return;
      }
      console.error("processFormativeFeedback failed or aborted:", error);
      throw error;
    } finally {
      set({
        isAIWorking: false,
        globalAbortController: null
      });
    }
  },

  sendChatMessage: async (text, moduleType = 'formative') => {
    if (get().isAIWorking) return;

    if (moduleType === 'formative') {
      if (get().todoAuditStage === 'awaiting_initial_confirmation') {
        const lowerText = text.trim().toLowerCase();
        const isDecline = /^(no|nope|n|nah|cancel|pass|stop|don't|not now|不|不需要|算了|不用|取消|不干)$/i.test(lowerText);
        
        if (!isDecline) {
          get().runTodoAuditProcess(text);
          return;
        } else {
          set({ todoAuditStage: 'idle', isAIWorking: true });
          const userMsg: ChatMessage = {
            id: `msg-user-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const loadingId = `msg-ai-ack-loading-${Date.now()}`;
          const loadingMsg: ChatMessage = {
            id: loadingId,
            sender: 'ai',
            text: 'Thinking...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLoading: true
          };
          set({ chatMessages: [...get().chatMessages, userMsg, loadingMsg] });

          setTimeout(() => {
            const declineAck: ChatMessage = {
              id: `msg-ai-ack-${Date.now()}`,
              sender: 'ai',
              text: `Understood! Feel free to ask whenever you would like me to review your checklist or if you need any other assistance.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isLoading: false
            };
            const updated = get().chatMessages.map(m => m.id === loadingId ? declineAck : m);
            set({ chatMessages: updated, isAIWorking: false });
          }, 1800);
          return;
        }
      }

      if (get().todoAuditStage === 'awaiting-sequence') {
        const isConsent = /yes|sure|go\s*ahead|agree|ok|同意|开始|好|要|需/i.test(text);
        if (isConsent) {
          get().triggerSequenceAudit(text);
          return;
        } else {
          set({ todoAuditStage: 'idle' });
        }
      }
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const loadingMsgId = `msg-ai-loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingMsgId,
      sender: 'ai',
      text: 'Analyzing...',
      isLoading: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const controller = new AbortController();

    const targetKey = moduleType === 'summative' ? 'summativeChatMessages' : moduleType === 'longterm' ? 'longtermChatMessages' : 'chatMessages';
    const currentMessages = get()[targetKey] || [];

    set({
      [targetKey]: [...currentMessages, userMsg, loadingMsg],
      isAIWorking: true,
      globalAbortController: controller
    } as any);

    try {
      const chatHistory = (get()[targetKey] || [])
        .filter(m => m.id !== loadingMsgId && !m.isLoading)
        .map(m => ({ sender: m.sender, text: m.text }));

      const persona = (get().userProfile.copilotPersona as any) || 'action-coach';
      const responseText = await generateChatResponse(chatHistory, text, controller.signal, persona);

      set({
        [targetKey]: (get()[targetKey] || []).map(m =>
          m.id === loadingMsgId
            ? { ...m, text: responseText.replace(/\*/g, ''), isLoading: false }
            : m
        )
      } as any);
    } catch (error: any) {
      const isAbort = error && (
        error.name === 'AbortError' ||
        (error.message && (error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel') || error.message.toLowerCase().includes('canceled'))) ||
        (String(error).toLowerCase().includes('abort') || String(error).toLowerCase().includes('cancel') || String(error).toLowerCase().includes('canceled'))
      );

      if (isAbort) {
        set({
          [targetKey]: (get()[targetKey] || []).map(m =>
            m.id === loadingMsgId
              ? { ...m, text: '✕ Generation stopped by user.', isLoading: false, isStopped: true }
              : m
          )
        } as any);
      } else {
        const errorText = `Chat request failed: ${(error as Error).message || error}`;
        set({
          [targetKey]: (get()[targetKey] || []).map(m =>
            m.id === loadingMsgId
              ? { ...m, text: errorText, isLoading: false }
              : m
          )
        } as any);
      }
    } finally {
      set({
        isAIWorking: false,
        globalAbortController: null
      });
    }
  },

  cancelGlobalAIGeneration: () => {
    const controller = get().globalAbortController;
    if (controller) {
      controller.abort();
    }
    set({
      isAIWorking: false,
      globalAbortController: null,
      todoAuditStage: 'idle'
    });
  },

  toggleOmissionStatus: (id, action) => {
    const omissions = get().detectedOmissions;
    const updated = omissions.map(o => o.id === id ? { ...o, status: action } : o);

    if (action === 'added') {
      const target = omissions.find(o => o.id === id);
      if (target) {
        const currentTodos = get().todoList;
        const newTodo: SandboxTodoItem = {
          id: `todo-omission-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: target.title,
          description: '',
          isCustom: false,
          orderIndex: currentTodos.length,
          isCompleted: false
        };
        set({ todoList: [...currentTodos, newTodo] });
      }
    }

    set({ detectedOmissions: updated });

    const allDecided = updated.every(o => o.status !== 'pending');
    if (allDecided) {
      set({ todoAuditStage: 'awaiting-sequence' });

      const loadingId = `msg-ai-consent-loading-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id: loadingId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true
      };
      set({ chatMessages: [...get().chatMessages, loadingMsg] });

      setTimeout(() => {
        const consentMsg: ChatMessage = {
          id: `msg-ai-consent-${Date.now()}`,
          sender: 'ai',
          text: "Decisions updated! Would you like me to optimize your Todo List sequence based on your provided materials?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: false
        };
        const updated = get().chatMessages.map(m => m.id === loadingId ? consentMsg : m);
        set({ chatMessages: updated });
      }, 1800);
    }
  },

  triggerSequenceAudit: async (consentText) => {
    if (get().isAIWorking) return;

    set({ activeRightTab: 'chatbox' });

    const userMsg: ChatMessage = {
      id: `msg-user-seq-${Date.now()}`,
      sender: 'user',
      text: consentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const loadingMsgId = `msg-loading-seq-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingMsgId,
      sender: 'ai',
      text: 'Analyzing assignment draft and rubrics guidelines to optimize sequence...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };

    const controller = new AbortController();
    set({
      chatMessages: [...get().chatMessages, userMsg, loadingMsg],
      isAIWorking: true,
      globalAbortController: controller,
      todoAuditStage: 'sequence-checking'
    });

    const feedbackText = get().formativeFeedbackData.originalFeedbackText;
    const todoList = get().todoList;
    const handbookText = get().courseHandbookText;
    const assignmentText = get().currentAssignmentText;

    try {
      const persona = (get().userProfile.copilotPersona as any) || 'action-coach';
      const response = await generateSequenceOptimization({
        feedbackText,
        todoList,
        handbookText,
        assignmentText
      }, controller.signal, persona);

      const updatedMessages = get().chatMessages.map(m => {
        if (m.id === loadingMsgId) {
          let cleanAdviceText = response.adviceText.replace(/###\s*.*$/gm, '').replace(/\*/g, '').trim();

          if (response.sequence.length > 0) {
            const lines = cleanAdviceText.split('\n');
            const introLines: string[] = [];
            for (const line of lines) {
              const trimmed = line.trim();
              if (/^\d+[\.\)]/.test(trimmed) || trimmed.toLowerCase().includes('recommended modification sequence') || trimmed.toLowerCase().includes('recommended sequence')) {
                break;
              }
              if (trimmed) introLines.push(trimmed);
            }
            let intro = introLines.join(' ').trim();
            if (!intro || intro.length > 250 || /^\d+[\.\)]/.test(intro)) {
              intro = "Based on your handbook rubrics and draft priorities, here is the recommended editing sequence to optimize your revisions:";
            }
            cleanAdviceText = intro;
          }

          return {
            id: m.id,
            sender: 'ai' as const,
            text: cleanAdviceText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasSequence: response.sequence.length > 0,
            sequence: response.sequence.map(s => ({
              title: s.title.replace(/\*/g, ''),
              rationale: s.rationale.replace(/\*/g, ''),
              phase: s.phase
            })),
            isLoading: false
          };
        }
        return m;
      });

      set({
        chatMessages: updatedMessages,
        todoAuditStage: 'idle'
      });
    } catch (error: any) {
      const isAbort = error && (
        error.name === 'AbortError' ||
        (error.message && (error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel') || error.message.toLowerCase().includes('canceled'))) ||
        (String(error).toLowerCase().includes('abort') || String(error).toLowerCase().includes('cancel') || String(error).toLowerCase().includes('canceled'))
      );

      if (isAbort) {
        set({
          chatMessages: get().chatMessages.filter(m => m.id !== loadingMsgId && m.id !== userMsg.id),
          todoAuditStage: 'idle'
        });
      } else {
        const errorText = `Sequence optimization failed: ${error.message || error}`;
        const updatedMessages = get().chatMessages.map(m => {
          if (m.id === loadingMsgId) {
            return {
              id: m.id,
              sender: 'ai' as const,
              text: errorText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isLoading: false
            };
          }
          return m;
        });
        set({
          chatMessages: updatedMessages,
          todoAuditStage: 'idle'
        });
      }
    } finally {
      set({
        isAIWorking: false,
        globalAbortController: null
      });
    }
  },

  applyRecommendedSequence: (orderedMapping) => {
    const currentTodos = [...get().todoList];
    if (currentTodos.length === 0) return;

    const orderMap = new Map<string, { index: number; phase: 'early' | 'mid' | 'late' }>();
    orderedMapping.forEach((item, index) => {
      orderMap.set(item.id, { index, phase: item.phase });
    });

    const mappedTodos = currentTodos.map((todo, idx) => {
      const match = orderMap.get(todo.id);
      if (match) {
        return {
          ...todo,
          orderIndex: match.index,
          phase: match.phase
        };
      } else {
        // Smart fallback phase for newly added or unmatched items based on position
        let fallbackPhase: 'early' | 'mid' | 'late' = 'mid';
        if (idx < currentTodos.length * 0.3) fallbackPhase = 'early';
        else if (idx > currentTodos.length * 0.7) fallbackPhase = 'late';

        return {
          ...todo,
          orderIndex: 9999 + idx,
          phase: fallbackPhase
        };
      }
    });

    const earlyPhase = mappedTodos.filter(t => t.phase === 'early').sort((a, b) => a.orderIndex - b.orderIndex);
    const midPhase = mappedTodos.filter(t => t.phase === 'mid').sort((a, b) => a.orderIndex - b.orderIndex);
    const latePhase = mappedTodos.filter(t => t.phase === 'late').sort((a, b) => a.orderIndex - b.orderIndex);

    const fullSortedList = [...earlyPhase, ...midPhase, ...latePhase];

    const finalTodos = fullSortedList.map((todo, idx) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      isCustom: todo.isCustom,
      orderIndex: idx,
      isCompleted: todo.isCompleted,
      phase: todo.phase
    }));

    set({
      todoList: finalTodos,
      sandboxInteracted: true
    });
  },

  // Todo List Reducers
  setTodoMode: (mode) => {
    set({ todoMode: mode });
  },

  updateTodoList: (todos) => {
    if (get().isReadOnly) return;
    const orderedTodos = todos.map((t, idx) => ({ ...t, orderIndex: idx }));
    const initial = get().initialTodoList;
    const isChanged = hasTodoListChanges(orderedTodos, initial);

    const activeRoundId = get().activeRoundId;
    const rounds = get().formativeRounds;
    let extraRoundsState = {};
    if (activeRoundId && rounds.length > 0) {
      extraRoundsState = {
        formativeRounds: rounds.map(r => r.id === activeRoundId ? { ...r, todoList: orderedTodos } : r)
      };
    }

    set({
      todoList: orderedTodos,
      sandboxInteracted: isChanged,
      ...extraRoundsState
    });
  },

  // AI Validation Trigger: Click Robot Icon -> AI offers help in Chatbox
  validateTodoWithAI: async () => {
    if (get().isReadOnly || get().isAIWorking) return;

    // 1. Instantly switch right panel tab to chatbox
    set({ activeRightTab: 'chatbox', hasUnreadChatNotification: false });

    // Prevent duplicate offer if already awaiting confirmation
    if (get().todoAuditStage === 'awaiting_initial_confirmation') return;

    // 2. Append loading message to chat history
    const loadingId = `msg-ai-offer-loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };

    set({
      chatMessages: [...get().chatMessages, loadingMsg],
      isAIWorking: true,
      todoAuditStage: 'awaiting_initial_confirmation'
    });

    setTimeout(() => {
      const offerMsg: ChatMessage = {
        id: `msg-ai-offer-${Date.now()}`,
        sender: 'ai',
        text: `Would you like me to evaluate your current Todo List for missing items and sequence optimization now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };
      const updated = get().chatMessages.map(m => m.id === loadingId ? offerMsg : m);
      set({ chatMessages: updated, isAIWorking: false });
    }, 2000);
  },

  // Executed after student responds with confirmation in Chatbox
  runTodoAuditProcess: async (userConsentText?: string) => {
    if (get().isReadOnly || get().isAIWorking) return;

    set({ activeRightTab: 'chatbox' });

    const valTimestamp = Date.now();
    const userMsgId = `msg-user-val-${valTimestamp}`;
    const loadingMsgId = `msg-loading-val-${valTimestamp}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: userConsentText || 'Yes, please evaluate my checklist.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append Loading card
    const loadingMsg: ChatMessage = {
      id: loadingMsgId,
      sender: 'ai',
      text: 'Performing double-source omission audit on your checklist against Briefing and raw feedback...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };

    const controller = new AbortController();

    set({
      chatMessages: [...get().chatMessages, userMsg, loadingMsg],
      isAIWorking: true,
      globalAbortController: controller,
      todoAuditStage: 'omission-checking',
      detectedOmissions: []
    });

    // Call real async API service
    const feedbackText = get().formativeFeedbackData.originalFeedbackText;
    const todoList = get().todoList;
    const briefingKeyPoints = get().formativeFeedbackData.coreKeyPoints.map(kp => ({
      id: kp.id,
      title: kp.title,
      severity: kp.severity,
      sourceExcerpt: kp.sourceExcerpt || ''
    }));

    try {
      const persona = (get().userProfile.copilotPersona as any) || 'action-coach';
      const response = await generateTodoOmissions({
        feedbackText,
        todoList,
        briefingKeyPoints
      }, controller.signal, persona);

      const omissionsWithStatus = response.omissions.map((o, idx) => ({
        id: `omission-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        title: o.title.replace(/\*/g, ''),
        description: o.description.replace(/\*/g, ''),
        sourceExcerpt: o.sourceExcerpt.replace(/\*/g, ''),
        status: 'pending' as const
      }));

      const updatedMessages = get().chatMessages.map(m => {
        if (m.id === loadingMsgId) {
          let cleanAdviceText = response.adviceText.replace(/###\s*.*$/gm, '').replace(/\*/g, '').trim();

          if (omissionsWithStatus.length > 0) {
            const lines = cleanAdviceText.split('\n');
            const introLines: string[] = [];
            for (const line of lines) {
              const trimmed = line.trim();
              if (
                /^\d+[\.\)]/.test(trimmed) ||
                trimmed.toLowerCase().includes('action required') ||
                trimmed.toLowerCase().includes('recommended checklist') ||
                trimmed.toLowerCase().includes('recommended items')
              ) {
                break;
              }
              if (trimmed) introLines.push(trimmed);
            }
            let intro = introLines.join(' ').trim();
            if (!intro || intro.length > 250 || /^\d+[\.\)]/.test(intro)) {
              intro = "I have scanned your Todo list and Briefing against the raw feedback. Here are the key omitted items identified for your review:";
            }
            cleanAdviceText = intro;
          }

          return {
            id: m.id,
            sender: 'ai' as const,
            text: cleanAdviceText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLoading: false,
            hasOmissions: true
          };
        }
        return m;
      });

      set({
        chatMessages: updatedMessages,
        detectedOmissions: omissionsWithStatus,
        todoAuditStage: omissionsWithStatus.length > 0 ? 'omission-decision' : 'awaiting-sequence',
        sandboxInteracted: true
      });

      if (omissionsWithStatus.length === 0) {
        const loadingId = `msg-ai-consent-loading-${Date.now()}`;
        const loadingMsg: ChatMessage = {
          id: loadingId,
          sender: 'ai',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: true
        };
        set({
          chatMessages: [...get().chatMessages, loadingMsg],
          todoAuditStage: 'awaiting-sequence'
        });

        setTimeout(() => {
          const consentMsg: ChatMessage = {
            id: `msg-ai-consent-${Date.now()}`,
            sender: 'ai',
            text: "Decisions updated! Would you like me to optimize your Todo List sequence based on your provided materials?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isLoading: false
          };
          const updated = get().chatMessages.map(m => m.id === loadingId ? consentMsg : m);
          set({ chatMessages: updated });
        }, 1800);
      }
    } catch (error: any) {
      const isAbort = error && (
        error.name === 'AbortError' ||
        (error.message && (error.message.toLowerCase().includes('abort') || error.message.toLowerCase().includes('cancel') || error.message.toLowerCase().includes('canceled'))) ||
        (String(error).toLowerCase().includes('abort') || String(error).toLowerCase().includes('cancel') || String(error).toLowerCase().includes('canceled'))
      );

      if (isAbort) {
        set({
          chatMessages: get().chatMessages.filter(m => m.id !== loadingMsgId && m.id !== userMsgId),
          todoAuditStage: 'idle'
        });
      } else {
        const errorText = `Omission check failed: ${error.message || error}`;
        const updatedMessages = get().chatMessages.map(m => {
          if (m.id === loadingMsgId) {
            return {
              id: m.id,
              sender: 'ai' as const,
              text: errorText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isLoading: false
            };
          }
          return m;
        });
        set({
          chatMessages: updatedMessages,
          todoAuditStage: 'idle'
        });
      }
    } finally {
      set({
        isAIWorking: false,
        globalAbortController: null
      });
    }
  },

  // Apply AI suggestions and overwrite todoList
  applyAISuggestions: (suggestions: Array<{ title: string; description: string }>) => {
    if (get().isReadOnly) return;

    const backfilled: SandboxTodoItem[] = suggestions.map((item, idx) => ({
      id: `todo-ai-sug-${idx}-${Date.now()}`,
      title: item.title,
      description: item.description,
      isCustom: false,
      orderIndex: idx,
      isCompleted: false
    }));

    // Generate new version node
    const newVersionId = `ver-sug-applied-${Date.now()}`;
    const parentId = get().currentVersionId;
    const newHistoryNode: VersionHistoryNode = {
      id: newVersionId,
      name: 'AI Recommendations Applied',
      timestamp: new Date().toISOString(),
      todos: backfilled,
      parentVersionId: parentId,
      author: 'ai-branched',
      description: 'Applied AI suggestion checklist'
    };

    set({
      todoList: backfilled,
      initialTodoList: backfilled, // reset baseline
      todoMode: 'edit',
      sandboxInteracted: false,
      currentVersionId: newVersionId,
      versionHistoryTree: {
        ...get().versionHistoryTree,
        [newVersionId]: newHistoryNode
      },
      chatMessages: [
        ...get().chatMessages,
        {
          id: `msg-applied-${Date.now()}`,
          sender: 'ai',
          text: 'Suggestions applied successfully! Left Todo List has been overwritten. You can continue to manually edit, append, or re-order these cards before locking the list.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  },

  // Toggle selection of a single briefing key point
  toggleSelectBriefing: (id) => {
    const current = get().selectedBriefingIds;
    if (current.includes(id)) {
      set({ selectedBriefingIds: current.filter(x => x !== id) });
    } else {
      set({ selectedBriefingIds: [...current, id] });
    }
  },

  // Toggle selection of all briefing key points
  toggleSelectAllBriefings: (allIds) => {
    const current = get().selectedBriefingIds;
    if (current.length === allIds.length) {
      set({ selectedBriefingIds: [] });
    } else {
      set({ selectedBriefingIds: allIds });
    }
  },

  // Batch add selected briefing cards to Todo list
  addSelectedBriefingsToTodo: () => {
    if (get().isReadOnly) return;

    const selectedIds = get().selectedBriefingIds;
    if (selectedIds.length === 0) return;

    const keyPoints = get().formativeFeedbackData.coreKeyPoints;
    const selectedPoints = keyPoints.filter(kp => selectedIds.includes(kp.id));
    if (selectedPoints.length === 0) return;

    const currentTodos = get().todoList;
    const newTasks: SandboxTodoItem[] = selectedPoints.map((kp, idx) => ({
      id: `todo-briefing-batch-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      title: kp.title,
      description: '',
      isCustom: false,
      orderIndex: currentTodos.length + idx,
      isCompleted: false
    }));

    const updatedTodos = [...currentTodos, ...newTasks];

    const loadingId = `msg-ai-notice-loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };

    set({
      todoList: updatedTodos,
      activeLeftTab: 'todo',
      activatedLeftTools: {
        ...get().activatedLeftTools,
        todo: true
      },
      selectedBriefingIds: [],
      sandboxInteracted: true,
      chatMessages: [...get().chatMessages, loadingMsg],
      hasUnreadChatNotification: get().activeRightTab !== 'chatbox'
    });

    setTimeout(() => {
      const noticeMsg: ChatMessage = {
        id: `msg-ai-notice-${Date.now()}`,
        sender: 'ai',
        text: `I noticed you're assembling your Todo List! Whenever you'd like a quick evaluation, click the robot icon button (🤖) in the Todo List toolbar to check for missing items or optimize your revision sequence.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };
      const updated = get().chatMessages.map(m => m.id === loadingId ? noticeMsg : m);
      set({ chatMessages: updated });
    }, 2000);
  },

  // Reactive Sidebar Reducers
  setProjectName: (name) => {
    const active = get().activeProject;
    if (active) {
      set({
        activeProject: { ...active, projectName: name }
      });
    } else {
      set({
        activeProject: {
          projectId: `proj-${Date.now()}`,
          projectName: name,
          feedbackType: 'formative',
          attachedMaterials: [],
          summativeMaterials: []
        }
      });
    }
  },

  setFolderName: (name) => {
    const active = get().activeProject;
    if (active) {
      set({
        activeProject: { ...active, folderName: name }
      });
    }
  },

  setProjectFolderInfo: (folderName, folderTag, tagColor) => {
    const active = get().activeProject;
    if (active) {
      set({
        activeProject: {
          ...active,
          ...(folderName !== undefined ? { folderName } : {}),
          folderTag: folderTag,
          tagColor: tagColor
        }
      });
    }
  },

  setFeedbackType: (type) => {
    const active = get().activeProject;
    
    if (active) {
      set({
        activeProject: { ...active, feedbackType: type }
      });

      if (get().isLaunched) {
        const targetRoute = type === 'formative' ? 'formative-sandbox' : 'summative-dashboard';
        
        let extraState: Partial<AppGlobalState> = {};
        if (type === 'formative' && get().todoList.length === 0) {
          extraState = {
            activeLeftTab: 'briefing',
            activatedLeftTools: { briefing: true, todo: false, proposals: false },
            selectedBriefingIds: [],
            todoList: [],
            initialTodoList: []
          };
        }

        set({
          currentRoute: targetRoute,
          highlightedTextRange: null,
          aiValidationResult: null,
          ...extraState
        });
      }
    } else {
      set({
        activeProject: {
          projectId: `proj-${Date.now()}`,
          projectName: '',
          feedbackType: type,
          attachedMaterials: [],
          summativeMaterials: []
        }
      });
    }
  },

  addMaterial: (material) => {
    const active = get().activeProject;
    const isSummative = active ? active.feedbackType === 'summative' : false;
    const newMaterial = { ...material, selected: true };

    let extraState: Partial<AppGlobalState> = {};
    if (newMaterial.type === 'rubrics' || newMaterial.type === 'requirement' || newMaterial.type === 'reference') {
      extraState.courseHandbookText = `COURSE HANDBOOK GUIDELINES from ${newMaterial.name}:\n${newMaterial.rawText || '- No raw text content extracted.'}`;
    } else if (newMaterial.type === 'current-draft') {
      extraState.currentAssignmentText = `STUDENT ASSIGNMENT DRAFT from ${newMaterial.name}:\n${newMaterial.rawText || '- No raw text content extracted.'}`;
    }

    if (active) {
      if (isSummative) {
        const updatedSummative = [...(active.summativeMaterials || []), newMaterial];
        set({
          activeProject: {
            ...active,
            summativeMaterials: updatedSummative
          }
        });
      } else {
        const updatedMaterials = [...active.attachedMaterials, newMaterial];
        const activeRoundId = get().activeRoundId;
        const rounds = get().formativeRounds;
        let extraRoundsState = {};
        if (activeRoundId && rounds.length > 0) {
          extraRoundsState = {
            formativeRounds: rounds.map(r => r.id === activeRoundId ? { ...r, attachedMaterials: updatedMaterials } : r)
          };
        }
        set({
          activeProject: {
            ...active,
            attachedMaterials: updatedMaterials
          },
          ...extraState,
          ...extraRoundsState
        });
      }
    } else {
      set({
        activeProject: {
          projectId: `proj-${Date.now()}`,
          projectName: '',
          feedbackType: 'formative',
          attachedMaterials: [newMaterial],
          summativeMaterials: []
        },
        ...extraState
      });
    }
  },

  removeMaterial: (id) => {
    const active = get().activeProject;
    if (active) {
      const isSummative = active.feedbackType === 'summative';
      if (isSummative) {
        const remainingMaterials = (active.summativeMaterials || []).filter(m => m.id !== id);
        set({
          activeProject: {
            ...active,
            summativeMaterials: remainingMaterials
          }
        });
      } else {
        const remainingMaterials = active.attachedMaterials.filter(m => m.id !== id);
        const removedMaterial = active.attachedMaterials.find(m => m.id === id);

        let extraState: Partial<AppGlobalState> = {};
        if (removedMaterial) {
          if (removedMaterial.type === 'rubrics' || removedMaterial.type === 'requirement' || removedMaterial.type === 'reference') {
            const hasRemainingHandbook = remainingMaterials.some(m => m.selected !== false && (m.type === 'rubrics' || m.type === 'requirement' || m.type === 'reference'));
            if (!hasRemainingHandbook) {
              extraState.courseHandbookText = '';
            } else {
              const remainingHandbooks = remainingMaterials.filter(m => m.selected !== false && (m.type === 'rubrics' || m.type === 'requirement' || m.type === 'reference'));
              extraState.courseHandbookText = remainingHandbooks.map(m => 
                `COURSE HANDBOOK GUIDELINES from ${m.name}:\n${m.rawText || '- No raw text content extracted.'}`
              ).join('\n\n');
            }
          } else if (removedMaterial.type === 'current-draft') {
            const hasRemainingDraft = remainingMaterials.some(m => m.selected !== false && m.type === 'current-draft');
            if (!hasRemainingDraft) {
              extraState.currentAssignmentText = '';
            }
          }
        }

        const activeRoundId = get().activeRoundId;
        const rounds = get().formativeRounds;
        let extraRoundsState = {};
        if (activeRoundId && rounds.length > 0) {
          extraRoundsState = {
            formativeRounds: rounds.map(r => r.id === activeRoundId ? { ...r, attachedMaterials: remainingMaterials } : r)
          };
        }
        set({
          activeProject: {
            ...active,
            attachedMaterials: remainingMaterials
          },
          ...extraState,
          ...extraRoundsState
        });
      }
    }
  },

  toggleMaterialSelection: (id) => {
    const active = get().activeProject;
    if (active) {
      const isSummative = active.feedbackType === 'summative';
      if (isSummative) {
        const updatedMaterials = (active.summativeMaterials || []).map(m =>
          m.id === id ? { ...m, selected: m.selected === undefined ? false : !m.selected } : m
        );
        set({
          activeProject: {
            ...active,
            summativeMaterials: updatedMaterials
          }
        });
      } else {
        const updatedMaterials = active.attachedMaterials.map(m => 
          m.id === id ? { ...m, selected: m.selected === undefined ? false : !m.selected } : m
        );

        const toggledMaterial = active.attachedMaterials.find(m => m.id === id);
        let extraState: Partial<AppGlobalState> = {};

        if (toggledMaterial) {
          const hasActiveHandbook = updatedMaterials.some(m => m.selected !== false && (m.type === 'rubrics' || m.type === 'requirement' || m.type === 'reference'));
          const hasActiveDraft = updatedMaterials.some(m => m.selected !== false && m.type === 'current-draft');

          if (hasActiveHandbook) {
            const activeHandbooks = updatedMaterials.filter(m => m.selected !== false && (m.type === 'rubrics' || m.type === 'requirement' || m.type === 'reference'));
            extraState.courseHandbookText = activeHandbooks.map(m => 
              `COURSE HANDBOOK GUIDELINES from ${m.name}:\n${m.rawText || '- No raw text content extracted.'}`
            ).join('\n\n');
          } else {
            extraState.courseHandbookText = '';
          }

          if (hasActiveDraft) {
            const firstDraft = updatedMaterials.find(m => m.selected !== false && m.type === 'current-draft');
            extraState.currentAssignmentText = `STUDENT ASSIGNMENT DRAFT from ${firstDraft?.name}:\n- Verbatim draft structure loaded for cross-examination.`;
          } else {
            extraState.currentAssignmentText = '';
          }
        }

        const activeRoundId = get().activeRoundId;
        const rounds = get().formativeRounds;
        let extraRoundsState = {};
        if (activeRoundId && rounds.length > 0) {
          extraRoundsState = {
            formativeRounds: rounds.map(r => r.id === activeRoundId ? { ...r, attachedMaterials: updatedMaterials } : r)
          };
        }
        set({
          activeProject: {
            ...active,
            attachedMaterials: updatedMaterials
          },
          ...extraState,
          ...extraRoundsState
        });
      }
    }
  },

  initializeEmptyProject: () => {
    set({
      activeProject: null,
      isLaunched: false,
      isReadOnly: false,
      activeLeftTab: 'briefing',
      activatedLeftTools: { briefing: true, todo: false, proposals: false },
      selectedBriefingIds: [],
      activeRightTab: 'input',
      currentRoute: 'workbench',
      todoList: [],
      initialTodoList: [],
      sandboxInteracted: false,
      aiValidationResult: null,
      versionHistoryTree: {},
      currentVersionId: '',
      highlightedTextRange: null,
      perspective: 'academic',
      courseHandbookText: '',
      currentAssignmentText: '',
      isMaterialReminderOpen: false,
      formativeFeedbackData: {
        projectId: '',
        originalFeedbackText: '',
        politeFluffRanges: [],
        coreKeyPoints: [],
        parallelProposals: [],
        briefingOverview: undefined
      },
      summativeFeedbackData: null
    });
  },

  lockBranchAndMerge: (branchId, description) => {
    if (get().isReadOnly) return;

    const formative = get().formativeFeedbackData;
    const selectedBranch = formative.parallelProposals.find(p => p.id === branchId);
    if (!selectedBranch) return;

    const currentTodos = get().todoList;
    const startIdx = currentTodos.length;

    const branchTodos: SandboxTodoItem[] = selectedBranch.recommendationList.map((rec, index) => ({
      id: `todo-branch-${branchId}-${index}`,
      title: rec,
      description: "Simulation branch recommendations",
      isCustom: false,
      orderIndex: startIdx + index,
      isCompleted: false
    }));

    const mergedTodos = [...currentTodos, ...branchTodos].map((t, idx) => ({
      ...t,
      orderIndex: idx
    }));

    const newVersionId = `ver-locked-${branchId}-${Date.now()}`;
    const parentId = get().currentVersionId;
    const newHistoryNode: VersionHistoryNode = {
      id: newVersionId,
      name: selectedBranch.branchName,
      timestamp: new Date().toISOString(),
      todos: mergedTodos,
      parentVersionId: parentId,
      author: 'ai-branched',
      description
    };

    const updatedProposals = formative.parallelProposals.map(p => 
      p.id === branchId ? { ...p, status: 'locked' as const } : p
    );

    set({
      formativeFeedbackData: {
        ...formative,
        parallelProposals: updatedProposals
      },
      todoList: mergedTodos,
      initialTodoList: mergedTodos,
      currentVersionId: newVersionId,
      versionHistoryTree: {
        ...get().versionHistoryTree,
        [newVersionId]: newHistoryNode
      },
      sandboxInteracted: false,
      aiValidationResult: null
    });
  },

  backtrackToVersion: (versionId) => {
    if (get().isReadOnly) return;

    const node = get().versionHistoryTree[versionId];
    if (!node) return;

    set({
      todoList: node.todos,
      initialTodoList: node.todos,
      currentVersionId: versionId,
      sandboxInteracted: false,
      aiValidationResult: null
    });
  },

  togglePerspective: () => {
    set({
      perspective: get().perspective === 'academic' ? 'career' : 'academic'
    });
  },

  setHighlightedTextRange: (range) => set({ highlightedTextRange: range }),

  setActiveAnchorContext: (context) => set({ activeAnchorContext: context }),

  archiveProjectToLongTermAsset: async () => {
    const active = get().activeProject;
    if (!active) return;

    await new Promise((resolve) => setTimeout(resolve, 800));

    const parseScoreStringToNumber = (scoreStr: string): number => {
      const clean = scoreStr.toLowerCase();
      const slashMatch = /(\d+)\s*\/\s*(\d+)/.exec(clean);
      if (slashMatch) {
        return Math.round((parseInt(slashMatch[1]) / parseInt(slashMatch[2])) * 100);
      }
      const rangeMatch = /(\d+)\s*-\s*(\d+)/.exec(clean);
      if (rangeMatch) {
        return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
      }
      const ltMatch = /<\s*(\d+)/.exec(clean);
      if (ltMatch) {
        return Math.max(0, parseInt(ltMatch[1]) - 5);
      }
      const gtMatch = />\s*(\d+)/.exec(clean);
      if (gtMatch) {
        return Math.min(100, parseInt(gtMatch[1]) + 5);
      }
      const digitMatch = /(\d+)/.exec(clean);
      if (digitMatch) {
        return parseInt(digitMatch[1]);
      }
      if (clean.includes('fail') || clean.includes('poor')) return 40;
      if (clean.includes('satisfactory') || clean.includes('pass')) return 55;
      if (clean.includes('good') || clean.includes('merit')) return 68;
      if (clean.includes('excellent') || clean.includes('distinction')) return 85;
      if (clean.includes('outstanding')) return 95;
      return 70;
    };

    const competency = get().globalCompetencyData;
    const summativeFeedback = get().summativeFeedbackData;
    const scores = summativeFeedback?.subScores || [];

    const newAcademicDimensions: Record<string, number> = {};
    scores.forEach(s => {
      const dimensionId = s.dimension.toLowerCase().replace(/[^a-z0-9]/g, '');
      newAcademicDimensions[dimensionId] = parseScoreStringToNumber(s.score);
    });

    const updatedHistory = [
      ...competency.academicHistory,
      {
        semester: "2026 Summer",
        courseId: "THE-600-ARCHIVE",
        courseName: active.projectName,
        dimensions: newAcademicDimensions
      }
    ];

    const updatedTimeSeries = [
      ...competency.competencyTimeSeries,
      {
        date: new Date().toISOString().split('T')[0],
        scores: newAcademicDimensions
      }
    ];

    const archivedProj: ArchivedProject = {
      projectId: active.projectId,
      projectName: active.projectName,
      courseCode: "THE-600",
      courseName: "Research Synthesis",
      semester: "2026 Summer",
      feedbackType: active.feedbackType,
      attachedMaterials: active.attachedMaterials,
      todoList: get().todoList,
      versionHistoryTree: get().versionHistoryTree,
      currentVersionId: get().currentVersionId,
      aiValidationResult: get().aiValidationResult || undefined,
      formativeRounds: get().formativeRounds,
      activeRoundId: get().activeRoundId || undefined,
      summativeFeedbackData: summativeFeedback
    };

    set({
      globalCompetencyData: {
        ...competency,
        academicHistory: updatedHistory,
        competencyTimeSeries: updatedTimeSeries
      },
      pastProjects: [...get().pastProjects, archivedProj],
      currentRoute: 'global-competency'
    });
  },

  activateProjectFromArchive: (projectId: string) => {
    const pastProjects = get().pastProjects;
    let targetProject = pastProjects.find(p => p.projectId === projectId || p.projectName.toLowerCase() === projectId.toLowerCase() || (p as any).id === projectId);
    
    if (!targetProject && pastProjects.length > 0) {
      targetProject = pastProjects.find(p => projectId.includes(p.courseCode) || p.projectId.includes(projectId)) || pastProjects[0];
    }

    if (!targetProject) return;

    const materials = targetProject.attachedMaterials || targetProject.summativeMaterials || [];
    const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);

    const proj = {
      projectId: targetProject.projectId,
      projectName: targetProject.projectName,
      courseCode: targetProject.courseCode,
      courseName: targetProject.courseName,
      semester: targetProject.semester,
      feedbackType: targetProject.feedbackType,
      attachedMaterials: materials,
      summativeMaterials: targetProject.summativeMaterials || materials
    };

    const isSummative = targetProject.feedbackType === 'summative';
    const firstRound = targetProject.formativeRounds && targetProject.formativeRounds.length > 0 ? targetProject.formativeRounds[0] : null;

    set({
      activeProject: proj,
      summativeFeedbackData: targetProject.summativeFeedbackData || null,
      formativeRounds: targetProject.formativeRounds || (firstRound ? [firstRound] : []),
      activeRoundId: isSummative ? 'round-summative-final' : (firstRound ? firstRound.id : undefined),
      todoList: targetProject.todoList || [],
      versionHistoryTree: targetProject.versionHistoryTree || {},
      currentVersionId: targetProject.currentVersionId || undefined,
      aiValidationResult: targetProject.aiValidationResult || null,
      isLaunched: true,
      sidebarMode: 'project-active',
      activeLeftTab: 'briefing',
      activeRightTab: 'chatbox',
      courseHandbookText,
      currentAssignmentText,
      currentRoute: isSummative ? 'summative-dashboard' : 'formative-sandbox'
    });
  },

  selectFormativeRound: (roundId) => {
    const rounds = get().formativeRounds;
    const targetRound = rounds.find(r => r.id === roundId);
    if (!targetRound) return;
    
    // Save current active round state before switching
    const currentActiveRoundId = get().activeRoundId;
    let updatedRounds = [...rounds];
    if (currentActiveRoundId) {
      const idx = updatedRounds.findIndex(r => r.id === currentActiveRoundId);
      if (idx !== -1) {
        updatedRounds[idx] = {
          ...updatedRounds[idx],
          attachedMaterials: get().activeProject?.attachedMaterials || [],
          todoList: get().todoList || [],
          coreKeyPoints: get().formativeFeedbackData.coreKeyPoints || [],
          briefingOverview: get().formativeFeedbackData.briefingOverview
        };
      }
    }
    
    // Set target round active state
    const formativeData: FormativeSchema = {
      projectId: get().activeProject?.projectId || '',
      originalFeedbackText: targetRound.originalFeedbackText,
      politeFluffRanges: [],
      coreKeyPoints: targetRound.coreKeyPoints,
      parallelProposals: [],
      briefingOverview: targetRound.briefingOverview
    };
    
    const activeProject = get().activeProject;
    set({
      activeRoundId: roundId,
      formativeRounds: updatedRounds,
      formativeFeedbackData: formativeData,
      rawFeedbackInput: targetRound.originalFeedbackText,
      todoList: targetRound.todoList,
      initialTodoList: targetRound.todoList,
      activeProject: activeProject ? {
        ...activeProject,
        attachedMaterials: targetRound.attachedMaterials
      } : null,
      activeRightTab: 'chatbox',
      isPreparingNewRound: false,
      isEditingCurrentRound: false
    });
  },

  addNewFeedbackRound: async (text, syncMaterialIds) => {
    // Save current active round state before proceeding
    const currentActiveRoundId = get().activeRoundId;
    const rounds = get().formativeRounds;
    let updatedRounds = [...rounds];
    if (currentActiveRoundId) {
      const idx = updatedRounds.findIndex(r => r.id === currentActiveRoundId);
      if (idx !== -1) {
        updatedRounds[idx] = {
          ...updatedRounds[idx],
          attachedMaterials: get().activeProject?.attachedMaterials || [],
          todoList: get().todoList || [],
          coreKeyPoints: get().formativeFeedbackData.coreKeyPoints || [],
          briefingOverview: get().formativeFeedbackData.briefingOverview
        };
      }
    }

    const active = get().activeProject;
    const currentName = active?.projectName || 'Processed Academic Synthesis';
    
    // Determine materials
    const prevRoundMaterials = get().activeProject?.attachedMaterials || [];
    const newRoundMaterials = prevRoundMaterials
      .filter(m => syncMaterialIds.includes(m.id))
      .map(m => ({ ...m, id: `mat-${Date.now()}-${Math.random()}` }));

    const draftProject: ProjectContext = {
      projectId: active?.projectId || `proj-${Date.now()}`,
      projectName: currentName,
      feedbackType: 'formative',
      attachedMaterials: newRoundMaterials,
      summativeMaterials: active?.summativeMaterials || []
    };

    const controller = new AbortController();
    set({
      isAIWorking: true,
      globalAbortController: controller
    });

    try {
      const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(newRoundMaterials);
      set({ courseHandbookText, currentAssignmentText });

      const parsedResult = await processRawFeedback(
        text,
        controller.signal,
        courseHandbookText || undefined,
        currentAssignmentText || undefined
      );

      let searchCursor2 = 0;
      const lowerRawText2 = (text || '').toLowerCase();
      const mappedKeyPoints2 = parsedResult.coreKeyPoints.map((kp) => {
        let start = -1;
        let end = -1;
        if (kp.sourceExcerpt) {
          const excerpt = kp.sourceExcerpt.trim();
          const lowerExcerpt = excerpt.toLowerCase();
          let foundIdx = lowerRawText2.indexOf(lowerExcerpt, searchCursor2);
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText2.indexOf(prefix, searchCursor2);
          }
          if (foundIdx === -1) {
            foundIdx = lowerRawText2.indexOf(lowerExcerpt, 0);
          }
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText2.indexOf(prefix, 0);
          }
          if (foundIdx !== -1) {
            start = foundIdx;
            end = foundIdx + excerpt.length;
            if (foundIdx >= searchCursor2) {
              searchCursor2 = end;
            }
          }
        }
        return {
          id: kp.id,
          title: kp.title,
          summary: "",
          startOffset: start,
          endOffset: end,
          severity: kp.severity,
          sourceExcerpt: kp.sourceExcerpt,
          associatedCriterion: kp.associatedCriterion,
          isOfficialRubric: kp.isOfficialRubric
        };
      });
      sanitizeKeyPointSeverities(mappedKeyPoints2 as any);
      mappedKeyPoints2.sort((a, b) => {
        const startA = a.startOffset >= 0 ? a.startOffset : Infinity;
        const startB = b.startOffset >= 0 ? b.startOffset : Infinity;
        return startA - startB;
      });

      const formativeSchemaData = {
        projectId: draftProject.projectId,
        originalFeedbackText: text,
        politeFluffRanges: [],
        coreKeyPoints: mappedKeyPoints2,
        parallelProposals: [],
        briefingOverview: parsedResult.briefingOverview
      };

      const newRoundId = `round-${Date.now()}`;
      const newRoundNode: FeedbackRoundNode = {
        id: newRoundId,
        name: `Round ${updatedRounds.length + 1} (${new Date().toLocaleDateString()})`,
        timestamp: new Date().toISOString(),
        originalFeedbackText: text,
        coreKeyPoints: formativeSchemaData.coreKeyPoints,
        briefingOverview: formativeSchemaData.briefingOverview,
        attachedMaterials: newRoundMaterials,
        todoList: []
      };

      set({
        activeProject: draftProject,
        formativeFeedbackData: formativeSchemaData,
        formativeRounds: [...updatedRounds, newRoundNode],
        activeRoundId: newRoundId,
        isLaunched: true,
        isReadOnly: false,
        sidebarMode: 'project-active',
        activeLeftTab: 'briefing',
        activatedLeftTools: { briefing: true, todo: false, proposals: false },
        selectedBriefingIds: [],
        activeRightTab: 'chatbox',
        currentRoute: 'formative-sandbox',
        todoList: [], // Start with fresh checklist for new round
        initialTodoList: [],
        todoMode: 'edit',
        sandboxInteracted: false,
        aiValidationResult: null,
        chatMessages: [
          {
            id: `msg-proc-${Date.now()}`,
            sender: 'ai',
            text: `I have processed Round ${updatedRounds.length + 1} feedback! Click "Todo List" to draft your revision checklist for this round.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      });

    } catch (error) {
      console.error("Failed to add new feedback round:", error);
    } finally {
      set({ isAIWorking: false, globalAbortController: null });
    }
  },

  updateCurrentFeedbackRound: async (text) => {
    const activeRoundId = get().activeRoundId;
    const rounds = get().formativeRounds;
    const active = get().activeProject;
    const materials = active?.attachedMaterials || [];

    const controller = new AbortController();
    set({
      isAIWorking: true,
      globalAbortController: controller
    });

    try {
      const { courseHandbookText, currentAssignmentText } = compileMaterialTexts(materials);
      set({ courseHandbookText, currentAssignmentText });

      const parsedResult = await processRawFeedback(
        text,
        controller.signal,
        courseHandbookText || undefined,
        currentAssignmentText || undefined
      );

      let searchCursor = 0;
      const lowerRawText = (text || '').toLowerCase();
      const mappedKeyPoints = parsedResult.coreKeyPoints.map((kp) => {
        let start = -1;
        let end = -1;
        if (kp.sourceExcerpt) {
          const excerpt = kp.sourceExcerpt.trim();
          const lowerExcerpt = excerpt.toLowerCase();
          let foundIdx = lowerRawText.indexOf(lowerExcerpt, searchCursor);
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText.indexOf(prefix, searchCursor);
          }
          if (foundIdx === -1) {
            foundIdx = lowerRawText.indexOf(lowerExcerpt, 0);
          }
          if (foundIdx === -1 && lowerExcerpt.length > 20) {
            const prefix = lowerExcerpt.slice(0, 20);
            foundIdx = lowerRawText.indexOf(prefix, 0);
          }
          if (foundIdx !== -1) {
            start = foundIdx;
            end = foundIdx + excerpt.length;
            if (foundIdx >= searchCursor) {
              searchCursor = end;
            }
          }
        }
        return {
          id: kp.id,
          title: kp.title,
          summary: "",
          startOffset: start,
          endOffset: end,
          severity: kp.severity,
          sourceExcerpt: kp.sourceExcerpt,
          associatedCriterion: kp.associatedCriterion,
          isOfficialRubric: kp.isOfficialRubric
        };
      });
      sanitizeKeyPointSeverities(mappedKeyPoints as any);
      mappedKeyPoints.sort((a, b) => {
        const startA = a.startOffset >= 0 ? a.startOffset : Infinity;
        const startB = b.startOffset >= 0 ? b.startOffset : Infinity;
        return startA - startB;
      });

      const formativeSchemaData = {
        projectId: active?.projectId || 'proj-default',
        originalFeedbackText: text,
        politeFluffRanges: [],
        coreKeyPoints: mappedKeyPoints,
        parallelProposals: [],
        briefingOverview: parsedResult.briefingOverview
      };

      // Overwrite current active round node in place
      const updatedRounds = rounds.map(r => {
        if (r.id === activeRoundId) {
          return {
            ...r,
            originalFeedbackText: text,
            coreKeyPoints: mappedKeyPoints,
            briefingOverview: parsedResult.briefingOverview
          };
        }
        return r;
      });

      set({
        formativeFeedbackData: formativeSchemaData,
        formativeRounds: updatedRounds,
        activeLeftTab: 'briefing',
        selectedBriefingIds: [],
        activeRightTab: 'chatbox',
        isEditingCurrentRound: false
      });
    } catch (error: any) {
      if (error && (error.name === 'AbortError' || error.message?.toLowerCase().includes('abort') || error.message?.toLowerCase().includes('cancel'))) {
        console.warn("updateCurrentFeedbackRound aborted by student.");
        set({ isAIWorking: false, globalAbortController: null });
        return;
      }
      console.error("Failed to update current feedback round:", error);
      throw error;
    } finally {
      set({ isAIWorking: false, globalAbortController: null });
    }
  }
}));
