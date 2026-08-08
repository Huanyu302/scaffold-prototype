import React, { useState } from 'react';
import { Sparkles, MessageSquare, BookOpen, Briefcase, Award, TrendingUp, Filter, ChevronDown, ChevronUp, Clock, CheckCircle2, PieChart, List, Target, Route, X, RotateCcw, Box, Cpu, Search, Layers, Volume2, Info, Folder, ChevronRight, Edit3, Trash2, Check, FileText, Star, AlertCircle, Loader2, Tag } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { ActionRecommendation } from '../components/career/ActionRecommendation';
import { GapAnalysisList } from '../components/career/GapAnalysisList';
import { FreeformCopilotChat } from '../components/chat/FreeformCopilotChat';
import { mockArchiveFolders, ArchiveFolder } from '../data/mockArchiveAssets';
import { generateCareerRoleAnalysis, DynamicCareerRoleAnalysis } from '../utils/geminiService';
import { OverlayScrollbarBox } from '../components/common/OverlayScrollbarBox';
const PRESET_CAREER_PROFILES: Record<string, {
  roleName: string;
  matchPercentage: number;
  overview: string;
  coreOutputs: Array<{ title: string; desc: string }>;
  competencyHighlights: Array<{ title: string; evidence: string }>;
  competencyGaps: Array<{ title: string; gapDesc: string; recommendation: string }>;
}> = {
  'target': {
    roleName: 'Product Manager (Tech & Hardware)',
    matchPercentage: 94,
    overview: 'Directs cross-functional design engineering teams, transforming multi-domain user research into product requirements, strategic roadmaps, and high-impact functional specifications.',
    coreOutputs: [
      { title: 'Product Requirement Documents (PRDs)', desc: 'Translates qualitative user research into prioritized feature backlogs and engineering boundaries.' },
      { title: 'Cross-Functional Roadmapping', desc: 'Aligns hardware CAD, software telemetry, and user testing into phased release milestones.' },
      { title: 'Stakeholder Value Models', desc: 'Establishes cost-to-value trade-off metrics and market viability benchmarks.' }
    ],
    competencyHighlights: [
      { title: 'Contextual Research Alignment', evidence: 'Proven ability in Autonomous Lane Keeping and Ergonomic CAD to synthesize complex user needs into actionable specs.' },
      { title: 'Modular PSS Strategy', evidence: 'Verified capacity in DE7-IM to formulate product-service system revenue loops with refurbishing incentives.' }
    ],
    competencyGaps: [
      { title: 'Quantitative Unit Economics', gapDesc: 'Project records demonstrate qualitative synthesis but lack explicit financial DCF sensitivity models.', recommendation: 'Add financial revenue modeling to your next portfolio case study.' },
      { title: 'Agile Telemetry Tracking', gapDesc: 'Project notes focus on hardware/design synthesis rather than software sprint velocity metrics.', recommendation: 'Document sprint burn-down metrics in team projects.' }
    ]
  },
  'role-01': {
    roleName: 'UX Engineer / Prototyper',
    matchPercentage: 88,
    overview: 'Bridges physical design engineering with software telemetry, constructing functional sensor-integrated prototypes and RTOS firmware drivers for interactive hardware-software experiences.',
    coreOutputs: [
      { title: 'Hardware-in-the-Loop Prototypes', desc: 'Builds physical multi-sensor rigs with microcontrollers and custom firmware drivers.' },
      { title: 'Sensor Telemetry Pipelines', desc: 'Calibrates I2C bus frequencies, IMU filtering, and real-time data streaming logic.' },
      { title: 'Interactive Interface Handoffs', desc: 'Delivers functional physical-digital UI specifications with micro-interaction states.' }
    ],
    competencyHighlights: [
      { title: 'Real-Time Sensor Calibration', evidence: 'Extensive documentation in DE7-SIOT on I2C bus frequencies and Kalman filter window sizes.' },
      { title: 'DFM Injection Molding CAD', evidence: 'Proven mastery of 3D anthropometric scan analysis and CAD clearance in DE7-CDE.' }
    ],
    competencyGaps: [
      { title: '3D WebGL Shader Optimization', gapDesc: 'Archive folders emphasize physical IMU sensors over complex web-based 3D render engines.', recommendation: 'Explore Three.js / WebGL shader optimization.' },
      { title: 'Automated E2E Testing', gapDesc: 'Lack of automated integration testing suites in current portfolio archives.', recommendation: 'Incorporate automated test scripts into telemetry firmware.' }
    ]
  },
  'role-02': {
    roleName: 'Design Technologist',
    matchPercentage: 86,
    overview: 'Explores technological feasibility for advanced design concepts, translating emerging hardware components and algorithmic sensors into working proof-of-concept prototypes.',
    coreOutputs: [
      { title: 'Proof-of-Concept Hardware Rigs', desc: 'Constructs working hardware prototypes to validate physical-digital interaction feasibility.' },
      { title: 'Design System Handoff Specs', desc: 'Establishes technical component guidelines for software and hardware engineering teams.' },
      { title: 'Ergonomic Clearance Models', desc: 'Performs 3D anthropometric CAD analysis and physical ergonomics testing.' }
    ],
    competencyHighlights: [
      { title: 'Anthropometric CAD Analysis', evidence: 'Verified 3D scan clearance and DFM tolerance reviews in Contextual Design Engineering.' },
      { title: 'Physical-Digital Interaction Modeling', evidence: 'Strong evidence of sensor sampling frequency tuning in DE7-SIOT.' }
    ],
    competencyGaps: [
      { title: 'Firmware Bootloader Customization', gapDesc: 'Archive notes focus on sensor data processing rather than low-level bootloader compilation.', recommendation: 'Practice low-level C firmware bootloader setup.' },
      { title: 'Mass Production Mold Validation', gapDesc: 'Current evidence covers initial DFM CAD clearance but lacks multi-cavity mold flow analysis.', recommendation: 'Include mold flow simulation reports in hardware projects.' }
    ]
  },
  'role-03': {
    roleName: 'Innovation Strategy Consultant',
    matchPercentage: 84,
    overview: 'Advises enterprise leaders on disruptive technology integration, circular economy models, and strategic innovation frameworks across transdisciplinary domains.',
    coreOutputs: [
      { title: 'Circular PSS Frameworks', desc: 'Formulates sustainable revenue loops with modular component refurbishing incentives.' },
      { title: 'Technology Horizon Mapping', desc: 'Evaluates emerging AI and sensing technologies for strategic market entry.' },
      { title: 'Transdisciplinary Surveys', desc: 'Deploys probabilistic user testing analytics and synthetic persona simulations.' }
    ],
    competencyHighlights: [
      { title: 'Circular Business Models', evidence: 'Direct takeaway on product-service system loops with refurbishing incentives in DE7-IM.' },
      { title: 'Probabilistic Stakeholder Simulation', evidence: 'Verified deployment of Bayesian modeling for user testing in DE7-ATR.' }
    ],
    competencyGaps: [
      { title: 'Enterprise DCF Risk Valuation', gapDesc: 'Missing financial discounted cash flow (DCF) risk models in current notes.', recommendation: 'Incorporate financial risk sensitivity models into business plans.' },
      { title: 'Regulatory Filings Audit', gapDesc: 'Portfolio emphasizes design innovation over formal regulatory submission filings.', recommendation: 'Include regulatory compliance sections in project reports.' }
    ]
  }
};

const AI_MATCH_ROLES = [
  { id: 'role-01', roleName: 'UX Engineer / Prototyper', matchPercentage: 88 },
  { id: 'role-02', roleName: 'Design Technologist', matchPercentage: 86 },
  { id: 'role-03', roleName: 'Innovation Strategy Consultant', matchPercentage: 84 }
];

const CAREER_RADAR_DATA: Record<string, Array<{ subject: string; studentScore: number; requiredScore: number; fullMark: number }>> = {
  'target': [
    { subject: 'Concept Ideation', studentScore: 85, requiredScore: 88, fullMark: 100 },
    { subject: 'Problem Framing', studentScore: 80, requiredScore: 90, fullMark: 100 },
    { subject: 'Design Engineering', studentScore: 85, requiredScore: 88, fullMark: 100 },
    { subject: 'Physical Prototyping', studentScore: 80, requiredScore: 85, fullMark: 100 },
    { subject: 'Manufacturing & DFM', studentScore: 45, requiredScore: 85, fullMark: 100 },
    { subject: 'Ergonomics & Human', studentScore: 52, requiredScore: 80, fullMark: 100 }
  ],
  'role-01': [
    { subject: 'Design Research', studentScore: 86, requiredScore: 92, fullMark: 100 },
    { subject: 'User Insights', studentScore: 84, requiredScore: 90, fullMark: 100 },
    { subject: 'Problem Framing', studentScore: 82, requiredScore: 85, fullMark: 100 },
    { subject: 'Concept Ideation', studentScore: 85, requiredScore: 80, fullMark: 100 },
    { subject: 'Ergonomics', studentScore: 60, requiredScore: 80, fullMark: 100 },
    { subject: 'User Testing', studentScore: 64, requiredScore: 88, fullMark: 100 }
  ],
  'role-02': [
    { subject: 'Hardware Integration', studentScore: 78, requiredScore: 90, fullMark: 100 },
    { subject: 'System Architecture', studentScore: 85, requiredScore: 88, fullMark: 100 },
    { subject: 'Design Engineering', studentScore: 85, requiredScore: 85, fullMark: 100 },
    { subject: 'Sensing & IoT', studentScore: 78, requiredScore: 86, fullMark: 100 },
    { subject: 'Concept Ideation', studentScore: 85, requiredScore: 80, fullMark: 100 },
    { subject: 'Physical Prototyping', studentScore: 80, requiredScore: 82, fullMark: 100 }
  ],
  'role-03': [
    { subject: 'Concept Ideation', studentScore: 85, requiredScore: 90, fullMark: 100 },
    { subject: 'Problem Framing', studentScore: 80, requiredScore: 92, fullMark: 100 },
    { subject: 'Business Models', studentScore: 70, requiredScore: 88, fullMark: 100 },
    { subject: 'Design Research', studentScore: 86, requiredScore: 80, fullMark: 100 },
    { subject: 'System Arch', studentScore: 75, requiredScore: 85, fullMark: 100 },
    { subject: 'Financial Risk', studentScore: 50, requiredScore: 82, fullMark: 100 }
  ]
};

export const GlobalCompetency: React.FC = () => {
  const {
    perspective,
    globalCompetencyData,
    savedNotes,
    removeNote,
    toggleFavoriteNote,
    clearNotes,
    savedPlans,
    removePlan,
    togglePlanCompleted,
    clearPlans,
    setRoute,
    togglePerspective,
    userProfile,
    updateUserProfile,
    pastProjects,
    summativeFeedbackData
  } = useAppStore();

  const isNewUserFlow = userProfile.userFlowMode === 'new-onboarded';

  const userPastArchiveFolders: ArchiveFolder[] = React.useMemo(() => {
    const allProjects: any[] = [...(pastProjects || [])];
    const activeProject = useAppStore.getState().activeProject;
    const isLaunched = useAppStore.getState().isLaunched;

    if (activeProject && !allProjects.some(p => p.projectId === activeProject.projectId)) {
      if (summativeFeedbackData || isLaunched) {
        allProjects.push({ ...activeProject, summativeFeedbackData });
      }
    }
    if (allProjects.length === 0) return [];

    const groupedMap = new Map<string, typeof allProjects>();
    allProjects.forEach(p => {
      const key = p.courseName || p.courseCode || p.projectName || 'My Project';
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(p);
    });

    const result: ArchiveFolder[] = [];
    groupedMap.forEach((projs, key) => {
      const first = projs[0];
      const currentSummative = summativeFeedbackData || first.summativeFeedbackData;
      const overallGrade = currentSummative?.grade || 'A';
      const caps = currentSummative?.subScores?.map((s: any) => s.dimension) || (
        currentSummative?.keyStrengths?.map((s: any) => s.title) || [
          'Contextual Problem Framing',
          'Evidence-Based Insight Synthesis',
          'Human-Centered Physical Prototyping'
        ]
      );
      result.push({
        id: `folder-user-${key}`,
        courseCode: first.courseCode || 'NEW-PROJ',
        folderTitle: key,
        gradeBadge: { label: `Grade ${overallGrade}`, score: 80 },
        primaryTag: 'product design' as const,
        capabilities: caps,
        isClickable: false as const
      });
    });

    return result;
  }, [pastProjects, summativeFeedbackData]);

  const archiveFolders = isNewUserFlow
    ? userPastArchiveFolders
    : [...mockArchiveFolders, ...userPastArchiveFolders.filter(up => !mockArchiveFolders.some(ma => ma.id === up.id))];

  const isNewUser = isNewUserFlow && savedNotes.length === 0 && savedPlans.length === 0 && !summativeFeedbackData && archiveFolders.length === 0;

  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string | null>(null);
  const [activeTagTab, setActiveTagTab] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [rightCardTab, setRightCardTab] = useState<'longterm' | 'chatbox'>('longterm');
  const [hasUnreadChatNotification, setHasUnreadChatNotification] = useState<boolean>(false);

  const handleGuideActionClick = (actionId: string) => {
    if (actionId === 'action-view-academic-notes') {
      if (perspective !== 'academic') {
        togglePerspective();
      }
      setTimeout(() => {
        const notesSection = document.getElementById('knowledge-notes-section');
        if (notesSection) {
          notesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (actionId === 'action-view-career-match') {
      if (perspective !== 'career') {
        togglePerspective();
      }
    } else if (actionId === 'action-view-my-checklist') {
      setRightCardTab('longterm');
    } else if (actionId === 'action-view-personal-center') {
      setRoute('personal-center');
    }
  };
  const [longTermSubTab, setLongTermSubTab] = useState<'roadmap' | 'milestones'>('roadmap');
  const [selectedNoteTagFilter, setSelectedNoteTagFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [isNotesSummaryCollapsed, setIsNotesSummaryCollapsed] = useState<boolean>(false);
  const [selectedPlanTagFilter, setSelectedPlanTagFilter] = useState<string>('all');
  const [isEditingPlans, setIsEditingPlans] = useState<boolean>(false);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});

  const togglePlanExploration = (planId: string) => {
    setExpandedPlanIds(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const [isEditingTargetRole, setIsEditingTargetRole] = useState<boolean>(false);
  const [tempRoleInput, setTempRoleInput] = useState<string>(userProfile.targetCareerRole || 'Product Manager');
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('target');

  React.useEffect(() => {
    setTempRoleInput(userProfile.targetCareerRole || 'Product Manager');
  }, [userProfile.targetCareerRole]);

  const [selectedCareerRoleId, setSelectedCareerRoleId] = useState<string>('role-02');
  const [customCareerInput, setCustomCareerInput] = useState<string>('');
  const [hoveredCareerSkill, setHoveredCareerSkill] = useState<string | null>(null);
  const [hoveredCapabilityPill, setHoveredCapabilityPill] = useState<string | null>(null);
  const [isAnalyzingRole, setIsAnalyzingRole] = useState<boolean>(false);
  const [isSearchInputOpen, setIsSearchInputOpen] = useState<boolean>(true);
  const [dynamicRolesMap, setDynamicRolesMap] = useState<Record<string, DynamicCareerRoleAnalysis>>({});
  const [customRoleIds, setCustomRoleIds] = useState<string[]>([]);

  const handleMatchRole = async (targetRoleInput: string) => {
    const query = targetRoleInput.trim();
    if (!query) return;

    setIsAnalyzingRole(true);
    try {
      const analysis = await generateCareerRoleAnalysis(query);
      setDynamicRolesMap(prev => ({
        ...prev,
        [analysis.id]: analysis
      }));
      setCustomRoleIds(prev => prev.includes(analysis.id) ? prev : [...prev, analysis.id]);
      setSelectedCareerRoleId(analysis.id);
      setHoveredCareerSkill(null);
      setIsSearchInputOpen(false);
    } catch (err) {
      console.error("Failed to generate career role analysis:", err);
    } finally {
      setIsAnalyzingRole(false);
    }
  };

  const handleRadarClick = (e: any) => {
    if (e && e.value) {
      // Map names to ids
      const nameMap: Record<string, string> = {
        'Critical Thinking': 'criticalThinking',
        'Literature Synthesis': 'literatureSynthesis',
        'Research Rigor': 'researchRigor',
        'Academic Writing': 'academicWriting',
        'Citation Discipline': 'citationDiscipline'
      };
      const id = nameMap[e.value];
      if (id) {
        setSelectedCompetencyId(id);
      }
    }
  };

  // Compile aggregate competency points based on the latest history entry
  const latestSemester = globalCompetencyData.academicHistory[globalCompetencyData.academicHistory.length - 1];
  const radarData = [
    { name: 'Critical Thinking', score: latestSemester.dimensions.criticalThinking, max: 100 },
    { name: 'Literature Synthesis', score: latestSemester.dimensions.literatureSynthesis, max: 100 },
    { name: 'Research Rigor', score: latestSemester.dimensions.researchRigor, max: 100 },
    { name: 'Academic Writing', score: latestSemester.dimensions.academicWriting, max: 100 },
    { name: 'Citation Discipline', score: latestSemester.dimensions.citationDiscipline, max: 100 }
  ];

  // Re-format time series dataset for Recharts line graph
  const lineChartData = globalCompetencyData.competencyTimeSeries.map(item => ({
    date: item.date,
    'Critical Thinking': item.scores.criticalThinking,
    'Literature Synthesis': item.scores.literatureSynthesis,
    'Research Rigor': item.scores.researchRigor,
    'Academic Writing': item.scores.academicWriting,
    'Citation Discipline': item.scores.citationDiscipline
  }));
  const shortCourseNames: Record<string, string> = {
    'DE7-CDE': 'Contextual Design Eng.',
    'DE7-DEP': 'Design Eng. Practice',
    'DE7-FTR': 'Foundational Research',
    'DE7-ATR': 'Advanced Research',
    'DE7-SIOT': 'Sensing & IoT',
    'DE6-AXD': 'Audio Experience Design',
    'DE7-IM': 'Innovation Management'
  };

  const courseCompletionDatesMap: Record<string, string> = {
    'folder-01': 'Jan 2026',
    'folder-02': 'Jun 2025',
    'folder-03': 'Jan 2025',
    'folder-04': 'Jan 2026',
    'folder-05': 'Jan 2026',
    'folder-06': 'Jun 2025',
    'folder-07': 'Jun 2025'
  };

  const skillDescriptionsMap: Record<string, string> = {
    "Human-Centered Physical Prototyping": "Translating user insights into physical models, testing ergonomics, and evaluating spatial interaction forms.",
    "Inclusive Systems Design": "Structuring multi-stakeholder architectures with focus on accessibility, universal design, and ethical boundary conditions.",
    "Contextual Problem Framing": "Synthesizing ambiguous domain challenges into clear research briefs and actionable design constraints.",
    "Hardware Component Integration": "Integrating physical microcontrollers, actuators, and mechanical assemblies into functional interactive prototypes.",
    "Strategic Concept Ideation": "Generating novel product architectures through speculative framing, market gap analysis, and rapid iteration.",
    "High-Fidelity CAD Modeling": "Constructing parametric 3D solid models with parametric tolerances suitable for DFM manufacturing.",
    "Mixed-Methods Research Design": "Combining qualitative ethnography and quantitative survey protocols to triangulate complex user behaviors.",
    "Evidence-Based Insight Synthesis": "Distilling raw interview transcripts and field observations into validated systemic findings.",
    "Qualitative Thematic Analysis": "Coding qualitative data to uncover latent patterns, thematic clusters, and behavioral personas.",
    "Ethical Research Governance": "Enforcing data privacy, consent protocols, and institutional ethics review standards in field research.",
    "AI-Assisted Stakeholder Simulation": "Leveraging generative LLM agents to model diverse user persona responses and stress-test assumptions.",
    "Probabilistic Bayesian Modeling": "Applying statistical inference and Bayesian probability distributions to quantify research uncertainty.",
    "Interactive System Architecture": "Designing hardware-software telemetry pipelines, state machines, and real-time event loops.",
    "Real-Time Signal Processing": "Filtering, sampling, and processing sensor data arrays with minimal latency for interactive feedback.",
    "Physical Sensor Pipeline": "Calibrating analog/digital sensors, I2C/SPI buses, and signal conditioning circuitry for robust data acquisition.",
    "Embedded Protocol Processing": "Implementing low-level communication protocols between microcontrollers and peripheral devices.",
    "Psychoacoustic Perception Evaluation": "Measuring human auditory perception, loudness contours, and spatial sound localization thresholds.",
    "Spatial Binaural Rendering": "Synthesizing 3D binaural audio environments using HRTF filters for immersive acoustic experiences.",
    "Business Model Generation": "Formulating revenue models, cost structures, and channel distribution strategies for technical innovations.",
    "Financial Risk Analysis": "Evaluating capital expenditure, unit economics, sensitivity models, and payback horizons for venture concepts.",
    "Value Proposition Mapping": "Aligning product features directly with target customer pains, gains, and job-to-be-done requirements."
  };

  const tagMetaMap: Record<string, { id: string; name: string; color: string }> = {
    'product design': { id: 'tag-pd', name: 'Product Design', color: '#00A3C4' },
    'research': { id: 'tag-res', name: 'Research', color: '#10B981' },
    'interactive design': { id: 'tag-id', name: 'Interactive Design', color: '#8B5CF6' },
    'innovation strategy': { id: 'tag-is', name: 'Innovation Strategy', color: '#F59E0B' }
  };

  const skillCoreNamesMap: Record<string, string> = {
    "Human-Centered Physical Prototyping": "Physical Prototyping",
    "Inclusive Systems Design": "Systems Design",
    "Contextual Problem Framing": "Problem Framing",
    "Hardware Component Integration": "Hardware Integration",
    "Strategic Concept Ideation": "Concept Ideation",
    "High-Fidelity CAD Modeling": "CAD Modeling",
    "Mixed-Methods Research Design": "Research Design",
    "Evidence-Based Insight Synthesis": "Insight Synthesis",
    "Qualitative Thematic Analysis": "Thematic Analysis",
    "Ethical Research Governance": "Research Governance",
    "AI-Assisted Stakeholder Simulation": "AI Simulation",
    "Probabilistic Bayesian Modeling": "Bayesian Modeling",
    "Interactive System Architecture": "System Architecture",
    "Real-Time Signal Processing": "Signal Processing",
    "Physical Sensor Pipeline": "Sensor Pipeline",
    "Embedded Protocol Processing": "Protocol Processing",
    "Psychoacoustic Perception Evaluation": "Psychoacoustics",
    "Spatial Binaural Rendering": "Spatial Audio",
    "Business Model Generation": "Business Models",
    "Financial Risk Analysis": "Financial Risk",
    "Value Proposition Mapping": "Value Proposition"
  };

  // Map career radar skills to exact relevant Academic View capabilities from mockArchiveFolders
  const academicSkillsByDomainMap: Record<string, string[]> = {
    'Concept Ideation': ['Strategic Concept Ideation', 'Contextual Problem Framing'],
    'Concept Ideation & Speculative Design': ['Strategic Concept Ideation', 'Contextual Problem Framing'],
    'Problem Framing': ['Contextual Problem Framing', 'Evidence-Based Insight Synthesis'],
    'Strategic Problem Solving': ['Contextual Problem Framing', 'Evidence-Based Insight Synthesis'],
    'Strategic Problem Framing': ['Contextual Problem Framing', 'Evidence-Based Insight Synthesis'],
    'Design Engineering': ['High-Fidelity CAD Modeling', 'Inclusive Systems Design'],
    'Parametric DFM CAD Modeling': ['High-Fidelity CAD Modeling', 'Hardware Component Integration'],
    'DFM CAD': ['High-Fidelity CAD Modeling', 'Hardware Component Integration'],
    'Physical Prototyping': ['Human-Centered Physical Prototyping', 'Hardware Component Integration'],
    'Functional Physical Prototyping': ['Human-Centered Physical Prototyping', 'High-Fidelity CAD Modeling'],
    'Prototyping': ['Human-Centered Physical Prototyping', 'Hardware Component Integration'],
    'Technical Execution': ['Human-Centered Physical Prototyping', 'Hardware Component Integration'],
    'System Architecture': ['Interactive System Architecture', 'Inclusive Systems Design'],
    'System Architecture & Integration': ['Interactive System Architecture', 'Inclusive Systems Design'],
    'System Arch': ['Interactive System Architecture', 'Inclusive Systems Design'],
    'Domain Validation & Testing': ['AI-Assisted Stakeholder Simulation', 'Probabilistic Bayesian Modeling'],
    'Quality Verification': ['AI-Assisted Stakeholder Simulation', 'Probabilistic Bayesian Modeling'],
    'Core Domain Knowledge': ['High-Fidelity CAD Modeling', 'Contextual Problem Framing'],
    'Manufacturing & DFM': ['High-Fidelity CAD Modeling', 'Hardware Component Integration'],
    'Ergonomics & Human Factors': ['Human-Centered Physical Prototyping', 'Inclusive Systems Design'],
    'Ergonomics': ['Human-Centered Physical Prototyping', 'Inclusive Systems Design'],
    'Design Research': ['Mixed-Methods Research Design', 'Qualitative Thematic Analysis', 'Ethical Research Governance'],
    'Design Research Methodologies': ['Mixed-Methods Research Design', 'Qualitative Thematic Analysis', 'Ethical Research Governance'],
    'User Insights Synthesis': ['Evidence-Based Insight Synthesis', 'Qualitative Thematic Analysis'],
    'User Insights & Synthesis': ['Evidence-Based Insight Synthesis', 'Qualitative Thematic Analysis'],
    'User Insights': ['Evidence-Based Insight Synthesis', 'Qualitative Thematic Analysis'],
    'User Testing & Evaluation': ['AI-Assisted Stakeholder Simulation', 'Probabilistic Bayesian Modeling'],
    'User Testing & Usability Benchmarking': ['AI-Assisted Stakeholder Simulation', 'Mixed-Methods Research Design'],
    'User Testing': ['AI-Assisted Stakeholder Simulation', 'Mixed-Methods Research Design'],
    'Hardware Integration': ['Hardware Component Integration', 'Physical Sensor Pipeline'],
    'Sensing & IoT': ['Physical Sensor Pipeline', 'Embedded Protocol Processing'],
    'Embedded Programming': ['Embedded Protocol Processing', 'Interactive System Architecture'],
    'Signal Processing': ['Real-Time Signal Processing', 'Interactive System Architecture'],
    'Interactive Systems': ['Interactive System Architecture', 'Physical Sensor Pipeline'],
    'ROS2 Architecture & Middleware': ['Interactive System Architecture', 'Embedded Protocol Processing'],
    'ROS2 Middleware': ['Interactive System Architecture', 'Embedded Protocol Processing'],
    'Kinematics & Motion Control': ['Human-Centered Physical Prototyping', 'Hardware Component Integration'],
    'Kinematics': ['Human-Centered Physical Prototyping', 'Hardware Component Integration'],
    'Sensor Fusion & SLAM': ['Physical Sensor Pipeline', 'Real-Time Signal Processing'],
    'Sensor Fusion': ['Physical Sensor Pipeline', 'Real-Time Signal Processing'],
    'Real-Time C++ Firmware': ['Embedded Protocol Processing', 'Interactive System Architecture'],
    'C++ Firmware': ['Embedded Protocol Processing', 'Interactive System Architecture'],
    'Control Systems Theory': ['Interactive System Architecture', 'Real-Time Signal Processing'],
    'Control Theory': ['Interactive System Architecture', 'Real-Time Signal Processing'],
    'Safety & Fail-Safe Protocols': ['Ethical Research Governance', 'Inclusive Systems Design'],
    'Safety Protocols': ['Ethical Research Governance', 'Inclusive Systems Design'],
    'Spatial Binaural Rendering': ['Spatial Binaural Rendering', 'Psychoacoustic Perception Evaluation'],
    'Spatial Audio': ['Spatial Binaural Rendering', 'Psychoacoustic Perception Evaluation'],
    'DSP Filter Architecture': ['Real-Time Signal Processing', 'Embedded Protocol Processing'],
    'DSP Filters': ['Real-Time Signal Processing', 'Embedded Protocol Processing'],
    'Psychoacoustic Evaluation': ['Psychoacoustic Perception Evaluation', 'Mixed-Methods Research Design'],
    'Psychoacoustics': ['Psychoacoustic Perception Evaluation', 'Mixed-Methods Research Design'],
    'Interactive Audio Engine Integration': ['Interactive System Architecture', 'Physical Sensor Pipeline'],
    'Audio Engine': ['Interactive System Architecture', 'Physical Sensor Pipeline'],
    'Transducer & Acoustic Tuning': ['Hardware Component Integration', 'Human-Centered Physical Prototyping'],
    'Transducers': ['Hardware Component Integration', 'Human-Centered Physical Prototyping'],
    'Real-Time Signal Pipeline': ['Real-Time Signal Processing', 'Physical Sensor Pipeline'],
    'Signal Pipeline': ['Real-Time Signal Processing', 'Physical Sensor Pipeline'],
    'Model Evaluation & Benchmark Evals': ['AI-Assisted Stakeholder Simulation', 'Probabilistic Bayesian Modeling'],
    'Model Evals': ['AI-Assisted Stakeholder Simulation', 'Probabilistic Bayesian Modeling'],
    'RAG & Context Architecture': ['Interactive System Architecture', 'Evidence-Based Insight Synthesis'],
    'RAG Architecture': ['Interactive System Architecture', 'Evidence-Based Insight Synthesis'],
    'Inference Latency & Cost Tradeoffs': ['Probabilistic Bayesian Modeling', 'Interactive System Architecture'],
    'Inference Cost': ['Probabilistic Bayesian Modeling', 'Interactive System Architecture'],
    'AI Governance & Moderation': ['Ethical Research Governance', 'Inclusive Systems Design'],
    'AI Governance': ['Ethical Research Governance', 'Inclusive Systems Design'],
    'Data Pipeline Engineering': ['Real-Time Signal Processing', 'Evidence-Based Insight Synthesis'],
    'Data Pipeline': ['Real-Time Signal Processing', 'Evidence-Based Insight Synthesis'],
    'Prompt Architecture & Specs': ['Strategic Concept Ideation', 'Contextual Problem Framing'],
    'Prompt Specs': ['Strategic Concept Ideation', 'Contextual Problem Framing'],
    'Behavioral Telemetry Analytics': ['Evidence-Based Insight Synthesis', 'Qualitative Thematic Analysis'],
    'Telemetry': ['Evidence-Based Insight Synthesis', 'Qualitative Thematic Analysis'],
    'Quantitative Usability Metrics': ['Mixed-Methods Research Design', 'Probabilistic Bayesian Modeling'],
    'Usability Metrics': ['Mixed-Methods Research Design', 'Probabilistic Bayesian Modeling']
  };

  // Helper function to map discipline tag to corresponding domain icon
  const getTagIcon = (tagId: string, tagName: string = '', className: string = "w-4.5 h-4.5 text-cyan-600") => {
    const normalized = (tagId + ' ' + tagName).toLowerCase();

    if (normalized.includes('pd') || normalized.includes('product design')) {
      return <Box className={className} />;
    }
    if (normalized.includes('res') || normalized.includes('research')) {
      return <Search className={className} />;
    }
    if (normalized.includes('id') || normalized.includes('interactive') || normalized.includes('sensing')) {
      return <Cpu className={className} />;
    }
    if (normalized.includes('is') || normalized.includes('innovation') || normalized.includes('strategy') || normalized.includes('business')) {
      return <TrendingUp className={className} />;
    }
    if (normalized.includes('de') || normalized.includes('engineering') || normalized.includes('contextual')) {
      return <Layers className={className} />;
    }
    if (normalized.includes('audio')) {
      return <Volume2 className={className} />;
    }
    return <Sparkles className={className} />;
  };

  // Standardized Domain Mastery calculation rule for a discipline tag based on courses, distinctions, and skills
  const computeDomainMastery = (courses: { id: string; name: string; grade?: string; skills: string[] }[]) => {
    const courseCount = courses.length;
    const topGradeCount = courses.filter(c => c.grade?.includes('A')).length;
    const uniqueSkillsCount = new Set(courses.flatMap(c => c.skills)).size;
    const compositeScore = courseCount * 30 + topGradeCount * 15 + uniqueSkillsCount * 3;

    if (compositeScore >= 110 || courseCount >= 4) {
      return { level: 'Expert Level', style: 'text-cyan-600' };
    }
    if (compositeScore >= 90 || (courseCount >= 2 && topGradeCount >= 2)) {
      return { level: 'Advanced Level', style: 'text-purple-600' };
    }
    if (compositeScore >= 75 || (courseCount >= 2 && topGradeCount >= 1)) {
      return { level: 'Proficient Level', style: 'text-emerald-600' };
    }
    if (compositeScore >= 45 || courseCount >= 2) {
      return { level: 'Developing Level', style: 'text-blue-600' };
    }
    return { level: 'Foundational Level', style: 'text-slate-600' };
  };

  // Skill comparison datasets (Industry Required vs Student Real Provenance) enriched with tools & proficiency benchmarks
  const roleSkillComparisons: Record<string, {
    skill: string;
    coreName: string;
    required: number;
    current: number;
    provenance: string;
    reasoning: string;
    industryTools: string[];
    proficiencyRequirement: string;
  }[]> = {
    'role-01': [ // Hardware Product Manager (82% Match)
      {
        skill: 'Concept Ideation',
        coreName: 'Concept Ideation',
        required: 88,
        current: 85,
        provenance: 'PDE-101 (Grade A), PDE-103 (Grade B)',
        reasoning: 'Demonstrates strong generative sketching and divergent thinking, with space to deepen market validation and formal product specification.',
        industryTools: ['Market Feasibility', 'Value Proposition', 'PRD Architecture', 'Concept Iteration'],
        proficiencyRequirement: 'Independent translation of unformed market needs into 20+ divergent product concepts.'
      },
      {
        skill: 'Problem Framing',
        coreName: 'Problem Framing',
        required: 90,
        current: 80,
        provenance: 'RES-301 (Grade A-), PDE-103 (Grade B)',
        reasoning: 'Articulates user pain points clearly, with opportunities to expand commercial feasibility analysis and unit economic modeling.',
        industryTools: ['Business Viability', 'Market Sizing', 'Stakeholder Mapping', 'Unit Economics'],
        proficiencyRequirement: 'Defining multi-stakeholder problem boundaries with clear business viability constraints.'
      },
      {
        skill: 'Design Engineering',
        coreName: 'Design Engineering',
        required: 88,
        current: 85,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Proficient in parametric 3D CAD modeling, while complex GD&T assembly tolerancing presents a valuable next stage for growth.',
        industryTools: ['Assembly Tolerancing', 'DFM Principles', 'Parametric Architecture', 'Material Trade-offs'],
        proficiencyRequirement: 'Building parametric assembly models ready for DFM mold tooling review.'
      },
      {
        skill: 'Physical Prototyping',
        coreName: 'Physical Prototyping',
        required: 85,
        current: 80,
        provenance: 'PDE-101 (Grade A), PDE-102 (Grade B+)',
        reasoning: 'Adept at rapid FDM prototyping, with potential to further explore high-precision CNC machining and advanced surface finishing.',
        industryTools: ['High-Fidelity Finishing', 'Prototyping Strategy', 'Functional Validation', 'Material Selection'],
        proficiencyRequirement: 'Constructing works-like and looks-like physical prototypes for user evaluation.'
      },
      {
        skill: 'Manufacturing & DFM',
        coreName: 'Manufacturing & DFM',
        required: 85,
        current: 45,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Foundational manufacturing awareness established; deepening experience in injection molding draft analysis and NPI tooling will enhance readiness.',
        industryTools: ['Tooling Feasibility', 'Injection Molding DFM', 'Assembly Optimization', 'NPI Workflows'],
        proficiencyRequirement: 'Conducting moldflow simulation, specifying mold draft angles, and managing NPI assembly tooling.'
      },
      {
        skill: 'Ergonomics & Human Factors',
        coreName: 'Ergonomics & Human',
        required: 80,
        current: 52,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Solid grasp of physical ergonomic prototyping, with opportunities to incorporate global anthropometric datasets and biomechanical evaluations.',
        industryTools: ['Anthropometric Analysis', 'Cognitive Ergonomics', 'Physical Usability', 'Accessibility Fit'],
        proficiencyRequirement: 'Validating physical grip, reach, and clearance against global anthropometric datasets.'
      }
    ],
    'role-02': [ // UX / Design Researcher (88% Match)
      {
        skill: 'Design Research',
        coreName: 'Design Research',
        required: 92,
        current: 86,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Demonstrates solid foundational research design, with opportunities to deepen longitudinal study modeling, behavioral telemetry, and statistical rigor.',
        industryTools: ['Longitudinal Study Design', 'Behavioral Telemetry', 'Statistical Power Analysis', 'Research Ops Architecture'],
        proficiencyRequirement: 'Designing end-to-end qualitative & quantitative research protocols for complex domains.'
      },
      {
        skill: 'User Insights Synthesis',
        coreName: 'User Insights',
        required: 90,
        current: 84,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Excels at thematic affinity mapping and persona creation, while strategic opportunity mapping and longitudinal insight tracking provide a strong growth trajectory.',
        industryTools: ['Longitudinal Insight Tracking', 'Strategic Opportunity Mapping', 'Behavioral Pattern Abstraction', 'Persona Validation'],
        proficiencyRequirement: 'Synthesizing 30+ raw interview transcripts into actionable product architecture briefs.'
      },
      {
        skill: 'Problem Framing',
        coreName: 'Problem Framing',
        required: 85,
        current: 82,
        provenance: 'RES-301 (Grade A-), PDE-103 (Grade B)',
        reasoning: 'Frames user friction points effectively, with opportunity to elevate strategic opportunity mapping for executive alignment.',
        industryTools: ['Strategic Opportunity Mapping', 'Business Goal Alignment', 'Executive Communication', 'Problem Scoping'],
        proficiencyRequirement: 'Formulating crisp research questions that guide product strategy.'
      },
      {
        skill: 'Concept Ideation',
        coreName: 'Concept Ideation',
        required: 80,
        current: 85,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Displays creative concept generation and speculative design capabilities well-aligned with industry research practices.',
        industryTools: ['Speculative Design', 'Co-Creation Facilitation', 'Concept Benchmarking', 'Value Alignment'],
        proficiencyRequirement: 'Rapidly sketching solution concepts directly responding to user insights.'
      },
      {
        skill: 'Ergonomics & Human Factors',
        coreName: 'Ergonomics',
        required: 80,
        current: 60,
        provenance: 'PDE-102 (Grade B+)',
        reasoning: 'Establishes clear physical interaction usability, with scope to integrate cognitive workload assessment and inclusive accessibility standards.',
        industryTools: ['Cognitive Workload Assessment', 'Accessibility Standards', 'Usability Metrics', 'Biomechanical Clearance'],
        proficiencyRequirement: 'Measuring physical strain, cognitive load, and accessibility fit.'
      },
      {
        skill: 'User Testing & Evaluation',
        coreName: 'User Testing',
        required: 88,
        current: 64,
        provenance: 'RES-301 (Grade A-)',
        reasoning: 'Hands-on experience in qualitative user testing, with opportunities to incorporate formal lab metrics and biometric evaluation protocols.',
        industryTools: ['Lab Testing Protocols', 'Quantitative SUS Analytics', 'Biometric Heatmap Analysis', 'Usability Benchmarking'],
        proficiencyRequirement: 'Conducting lab usability tests with quantitative SUS metrics and eye-tracking heatmaps.'
      }
    ],
    'role-03': [ // Embedded Systems Engineer (74% Match)
      {
        skill: 'Hardware Integration',
        coreName: 'Hardware Integration',
        required: 90,
        current: 75,
        provenance: 'IXD-201 (Grade A)',
        reasoning: 'Confident in breadboard prototyping and circuit testing, with high potential to advance into multi-layer custom PCB architecture.',
        industryTools: ['Multi-Layer PCB Architecture', 'High-Speed Bus Debugging', 'Signal Integrity Analysis', 'Board Integration'],
        proficiencyRequirement: 'Designing multi-layer custom PCBs and debugging high-speed digital buses.'
      },
      {
        skill: 'Sensing & IoT',
        coreName: 'Sensing & IoT',
        required: 92,
        current: 80,
        provenance: 'IXD-201 (Grade A)',
        reasoning: 'Effective sensor protocol integration via I2C/SPI, with opportunities to strengthen cloud security protocols and low-power wireless architectures.',
        industryTools: ['Cloud Security Protocols', 'Low-Power Architecture', 'Sensor Protocol Optimization', 'Wireless Reliability'],
        proficiencyRequirement: 'Architecting low-power wireless sensor nodes with cloud sync.'
      },
      {
        skill: 'Embedded Programming',
        coreName: 'Embedded Coding',
        required: 90,
        current: 45,
        provenance: 'IXD-201 (Grade A), IXD-202 (Grade B+)',
        reasoning: 'Well-versed in micro-controller C++ prototyping, with room to master RTOS multi-threading and bare-metal deterministic memory management.',
        industryTools: ['RTOS Multi-Threading', 'Deterministic Memory Management', 'Bare-Metal Optimization', 'IPC Synchronization'],
        proficiencyRequirement: 'Writing deterministic RTOS firmware tasks with thread-safe IPC queues.'
      },
      {
        skill: 'Signal Processing',
        coreName: 'Signal Processing',
        required: 88,
        current: 38,
        provenance: 'IXD-202 (Grade B+)',
        reasoning: 'Understands basic signal filtering principles, with potential to explore advanced DSP filter math and real-time spectral analysis.',
        industryTools: ['DSP Filter Math', 'Real-Time Spectral Analysis', 'Noise Reduction Algorithms', 'Signal Processing'],
        proficiencyRequirement: 'Designing real-time digital FIR/IIR filters and FFT spectral analysis routines.'
      },
      {
        skill: 'Interactive Systems',
        coreName: 'Interactive Systems',
        required: 85,
        current: 70,
        provenance: 'IXD-202 (Grade B+)',
        reasoning: 'Solid state machine logic for physical inputs, with scope to refine complex event queue handling and latency optimization.',
        industryTools: ['Complex Event Queue Handling', 'State Machine Architecture', 'Latency Optimization', 'Input State Control'],
        proficiencyRequirement: 'Building responsive physical-digital input state machines.'
      },
      {
        skill: 'Physical Prototyping',
        coreName: 'Physical Prototyping',
        required: 75,
        current: 80,
        provenance: 'PDE-101 (Grade A)',
        reasoning: 'Strong CAD enclosure design and fabrication skills that effectively meet professional prototyping standards.',
        industryTools: ['Custom Enclosure Integration', 'DFM Snap-Fit Tolerances', 'Thermal Management', 'Structural Fit'],
        proficiencyRequirement: 'Designing custom PCB mounting enclosures with snap fits.'
      }
    ]
  };

  // Helper to map numeric scores to professional proficiency level adjectives
  const getProficiencyAdjective = (score: number) => {
    if (score >= 90) return 'Expert';
    if (score >= 80) return 'Advanced';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Intermediate';
    return 'Basic';
  };

  const getLevelIndex = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 70) return 3;
    if (score >= 50) return 2;
    return 1;
  };

  // Helper to resolve full human-readable course names without codes/numbers
  const getCourseFullNames = (provenanceStr: string) => {
    const courseCodeMap: Record<string, string> = {
      'PDE-101': 'Contextual Design Engineering',
      'PDE-102': 'Design Engineering Practice',
      'PDE-103': 'Design Engineering Practice',
      'RES-301': 'Foundational Transdisciplinary Research',
      'IXD-201': 'Sensing and Internet of Things',
      'IXD-202': 'Audio Experience Design',
      'DE7-CDE': 'Contextual Design Engineering',
      'DE7-DEP': 'Design Engineering Practice',
      'DE7-FTR': 'Foundational Transdisciplinary Research',
      'DE7-ATR': 'Advanced Transdisciplinary Research',
      'DE7-SIOT': 'Sensing and Internet of Things',
      'DE6-AXD': 'Audio Experience Design',
      'DE7-IM': 'Innovation Management'
    };

    const found: string[] = [];
    Object.keys(courseCodeMap).forEach(code => {
      if (provenanceStr.includes(code) && !found.includes(courseCodeMap[code])) {
        found.push(courseCodeMap[code]);
      }
    });

    if (found.length > 0) return found;
    if (isNewUserFlow) {
      return userPastArchiveFolders.length > 0 ? [userPastArchiveFolders[0].folderTitle] : ['Current Workspace'];
    }
    return ['Contextual Design Engineering'];
  };

  // Helper to map capability name to ALL origin folder titles & colors in My Archive
  const getAllArchiveFoldersForSkill = (capabilityName: string) => {
    const matchingFolders = archiveFolders.filter(f => f.capabilities.includes(capabilityName));
    if (matchingFolders.length === 0) {
      if (isNewUserFlow) {
        return userPastArchiveFolders.length > 0
          ? userPastArchiveFolders.map(f => ({ title: f.folderTitle, color: '#0891b2' }))
          : [{ title: 'Current Workspace', color: '#0891b2' }];
      }
      return [
        {
          title: 'Contextual Design Eng.',
          color: '#00A3C4'
        }
      ];
    }
    return matchingFolders.map(folder => {
      const tagMeta = tagMetaMap[folder.primaryTag];
      return {
        title: shortCourseNames[folder.courseCode] || folder.folderTitle,
        color: tagMeta ? tagMeta.color : '#00A3C4'
      };
    });
  };

  // Helper to format any skill title into a neutral, objective title (<= 5 words, zero evaluative praise words)
  const formatConciseSkill = (skillStr: string): string => {
    if (!skillStr) return '';
    let clean = skillStr.trim();
    
    // Strip evaluative / praise adjectives at the beginning of the skill title
    const evaluativeRegex = /^(high[\s\-]quality|high[\s\-]fidelity|effective|robust|thoughtful|thorough|comprehensive|advanced|basic|strong|rigorous|excellent|good|solid|exceptional|clear|precise|deep|superior|optimal)\s+/i;
    
    while (evaluativeRegex.test(clean)) {
      clean = clean.replace(evaluativeRegex, '');
    }

    clean = clean.replace(/\b(high[\s\-]quality|high[\s\-]fidelity)\b/gi, '').trim();

    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    
    const words = clean.split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(' ');
    }
    return clean;
  };

  // Helper for strict domain context matching (ensures zero unrelated cross-domain fallback)
  const matchDomainContext = (capabilityName: string, domainName: string): boolean => {
    const capLower = capabilityName.toLowerCase();
    const domainLower = domainName.toLowerCase();

    const STOP_WORDS = new Set(['and', 'for', 'the', 'with', 'in', 'of', 'to', '&', 'a', 'an']);
    const domainTokens = domainLower
      .split(/[\s\-_&]+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

    if (domainTokens.length === 0) return false;

    const domainSynonyms: Record<string, string[]> = {
      'research': ['research', 'insight', 'investigation', 'inquiry', 'method', 'data', 'user', 'qualitative', 'quantitative', 'survey', 'interview', 'thematic', 'literature'],
      'strategy': ['strategy', 'strategic', 'business', 'roadmap', 'innovation', 'market', 'vision', 'planning', 'decision', 'logic'],
      'sustainability': ['sustainability', 'sustainable', 'green', 'circular', 'environmental', 'eco', 'lifecycle', 'footprint', 'waste'],
      'prototyping': ['prototyping', 'prototype', 'physical', 'cad', 'milling', '3d', 'fabrication', 'hardware', 'assembly', 'rig', 'model', 'ergonomics'],
      'design': ['design', 'concept', 'framing', 'ideation', 'aesthetic', 'ui', 'ux', 'interaction'],
      'engineering': ['engineering', 'system', 'architecture', 'circuit', 'embedded', 'iot', 'hardware', 'software', 'telemetry', 'code', 'verification', 'test'],
      'writing': ['writing', 'academic', 'citation', 'report', 'paper', 'text', 'glossary', 'definition', 'prose']
    };

    // Direct token match
    if (domainTokens.some(dt => capLower.includes(dt))) return true;

    // Synonym match
    for (const [key, syns] of Object.entries(domainSynonyms)) {
      if (domainLower.includes(key)) {
        if (syns.some(syn => capLower.includes(syn))) return true;
      }
    }

    return false;
  };

  // Helper to generate a brief, professional description of a skill
  const getRoleSkillOverview = (skillName: string): string => {
    const normSkill = skillName.toLowerCase();

    if (normSkill.includes('research') || normSkill.includes('insights')) {
      return 'Evaluates user behaviors and translates empirical feedback into actionable design directives and product strategy.';
    }
    if (normSkill.includes('system') || normSkill.includes('architecture')) {
      return 'Defines core structural components, technical interfaces, and system integration specifications across project modules.';
    }
    if (normSkill.includes('problem') || normSkill.includes('framing')) {
      return 'Identifies root friction points and establishes strategic problem statements to align cross-functional team deliverables.';
    }
    if (normSkill.includes('sustainability') || normSkill.includes('circular')) {
      return 'Applies life-cycle assessment and circular design principles to optimize material, energy, and environmental impact.';
    }
    if (normSkill.includes('prototyping') || normSkill.includes('execution') || normSkill.includes('engineering')) {
      return 'Bridges conceptual design with physical or digital implementation through rigorous prototyping and technical validation.';
    }
    if (normSkill.includes('user') || normSkill.includes('testing')) {
      return 'Designs validation protocols and usability benchmarks to ensure high product adoption, ergonomics, and accessibility.';
    }
    if (normSkill.includes('quality') || normSkill.includes('verification')) {
      return 'Establishes testing metrics and quality assurance standards to systematically verify engineering and performance requirements.';
    }
    if (normSkill.includes('domain') || normSkill.includes('knowledge')) {
      return 'Synthesizes specialized industry principles, domain standards, and analytical frameworks to guide strategic decisions.';
    }

    return 'Encompasses core technical methodology, analytical practices, and domain-specific execution standards.';
  };

  // Authentic user acquired capabilities list extracted strictly from user session feedback/notes/plans
  const allUserCapabilities = React.useMemo(() => {
    const list: string[] = [];
    const addClean = (str: string) => {
      if (!str) return;
      const formatted = formatConciseSkill(str);
      if (formatted && !list.includes(formatted)) list.push(formatted);
    };

    if (summativeFeedbackData) {
      summativeFeedbackData.subScores?.forEach((s: any) => addClean(s.dimension));
      summativeFeedbackData.keyStrengths?.forEach((k: any) => addClean(k.title));
    }
    savedNotes.forEach(n => addClean(n.title));
    archiveFolders.forEach(f => {
      f.capabilities?.forEach(c => addClean(c));
    });
    return list;
  }, [summativeFeedbackData, savedNotes, archiveFolders]);

  // Helper to dynamically calculate exact match score percentage from radar polygon overlap using 5-level discrete scale
  const getRoleMatchScore = (roleId: string, fallbackScore: number) => {
    const comparison = roleSkillComparisons[roleId];
    if (!comparison || comparison.length === 0) return fallbackScore;
    const sumRatio = comparison.reduce((acc, item) => {
      const targetLvl = getLevelIndex(item.required);
      const currentLvl = getLevelIndex(item.current);
      const ratio = Math.min(1, currentLvl / targetLvl);
      return acc + ratio;
    }, 0);
    return Math.round((sumRatio / comparison.length) * 100);
  };

  // Recommended Top Real-World Standard Industry Roles (Ordered strictly descending by match percentage)
  const recommendedCareerRoles = [
    {
      id: 'role-02',
      title: 'UX / Design Researcher',
      category: 'Research & Strategy',
      matchScore: 88,
      tag: 'Design Research',
      tagColor: '#10B981',
      icon: Search,
      industryOverview: 'Conducts qualitative and quantitative human factors research, synthesizing user insights to shape product architecture and ergonomic design.',
      coreDeliverables: ['Ethnographic Study Briefs', 'User Journey & JTBD Maps', 'SUS Usability Evaluation Reports', 'Strategic Architecture Briefs'],
      toolsStack: ['Dovetail', 'Figma', 'Qualtrics', 'Lookback.io', 'Tobii Eye Tracking'],
      careerPathway: 'UX Researcher → Senior Human Factors Lead → Head of User Experience',
      salaryRange: '$110,000 - $160,000 / yr',
      topEmployers: ['IDEO', 'Frog Design', 'Microsoft', 'Meta', 'Philips Design']
    },
    {
      id: 'role-01',
      title: 'Hardware Product Manager',
      category: 'Product & Strategy',
      matchScore: 82,
      tag: 'Product Strategy',
      tagColor: '#00A3C4',
      icon: Box,
      industryOverview: 'Drives end-to-end physical product lifecycles from concept ideation and CAD engineering through to DFM manufacturing and commercial release.',
      coreDeliverables: ['Product Requirement Docs (PRD)', 'NPI Lifecycle Roadmaps', 'DFM CAD Engineering Reviews', 'BOM & Unit Economics Models'],
      toolsStack: ['SolidWorks CAD', 'Jira/Confluence', 'Miro', 'Productboard', 'DFMA Tooling'],
      careerPathway: 'Hardware PM → Senior Technical PM → Director of Product Engineering',
      salaryRange: '$125,000 - $175,000 / yr',
      topEmployers: ['Apple', 'Tesla', 'Dyson', 'Google Hardware', 'Meta Reality Labs']
    },
    {
      id: 'role-03',
      title: 'Embedded Systems Engineer',
      category: 'Systems & Hardware',
      matchScore: 74,
      tag: 'IoT Systems',
      tagColor: '#8B5CF6',
      icon: Cpu,
      industryOverview: 'Architects hardware circuits, sensor integration, and firmware routines for next-generation smart physical hardware and IoT systems.',
      coreDeliverables: ['Custom Multi-Layer PCB Layouts', 'RTOS Deterministic Firmware', 'Sensor SPI/I2C Driver Stack', 'Low-Power Wireless Architectures'],
      toolsStack: ['KiCAD PCB', 'FreeRTOS', 'ARM Cortex-M', 'MATLAB DSP', 'Oscilloscopes'],
      careerPathway: 'Embedded Engineer → Senior Firmware Architect → VP of Hardware Engineering',
      salaryRange: '$115,000 - $165,000 / yr',
      topEmployers: ['Bosch', 'Siemens', 'Qualcomm', 'NVIDIA', 'Logitech']
    }
  ];

  // Build tagDisciplineData strictly from authentic established archive data
  const tagDisciplineData = isNewUser ? [] : Object.keys(tagMetaMap).map(tagKey => {
    const meta = tagMetaMap[tagKey];
    const matchingFolders = archiveFolders.filter(f => f.primaryTag === tagKey);

    return {
      tagId: meta.id,
      tagName: meta.name,
      tagColor: meta.color,
      courses: matchingFolders.map(f => ({
        id: f.id,
        name: shortCourseNames[f.courseCode] || f.folderTitle,
        grade: f.gradeBadge.label,
        completionDate: courseCompletionDatesMap[f.id] || 'Jan 2026',
        skills: f.capabilities
      }))
    };
  });

  // All unique courses across all tags for initial comprehensive Overall state
  const allCourses = React.useMemo(() => {
    const courseMap = new Map<string, typeof tagDisciplineData[0]['courses'][0]>();
    tagDisciplineData.forEach(tagGroup => {
      tagGroup.courses.forEach(c => {
        if (!courseMap.has(c.id)) {
          courseMap.set(c.id, c);
        }
      });
    });
    return Array.from(courseMap.values());
  }, [tagDisciplineData]);

  const allTagGroup = React.useMemo(() => ({
    tagId: 'all',
    tagName: 'Overall Competency',
    tagColor: '#0EA5E9',
    courses: allCourses
  }), [allCourses]);

  // Active Tag Group (defaults to 'all' Overall state if not specific tag)
  const currentTagGroup = React.useMemo(() => {
    if (activeTagTab === 'all') return allTagGroup;
    return tagDisciplineData.find(t => t.tagId === activeTagTab) || allTagGroup;
  }, [activeTagTab, tagDisciplineData, allTagGroup]);

  // Dynamically calculate total unique capabilities across authentic archiveFolders
  const totalUniqueCompetencies = React.useMemo(() => {
    return new Set(archiveFolders.flatMap(f => f.capabilities)).size;
  }, [archiveFolders]);

  // Dynamically compute Top Core Competency Highlights (Top 5: 2 Advanced, 3 Developing)
  const allCompetencyHighlights = React.useMemo(() => {
    const skillToCoursesMap: Record<string, { id: string; name: string; grade: string; tag: string }[]> = {};

    archiveFolders.forEach(folder => {
      const courseName = shortCourseNames[folder.courseCode] || folder.folderTitle;
      const tagMeta = tagMetaMap[folder.primaryTag];
      const tagName = tagMeta ? tagMeta.name : folder.primaryTag;
      const grade = folder.gradeBadge.label;

      folder.capabilities.forEach(skill => {
        if (!skillToCoursesMap[skill]) {
          skillToCoursesMap[skill] = [];
        }
        skillToCoursesMap[skill].push({
          id: folder.id,
          name: courseName,
          grade,
          tag: tagName
        });
      });
    });

    const sortedList = Object.keys(skillToCoursesMap)
      .map(skill => {
        const courses = skillToCoursesMap[skill];
        const frequency = courses.length;
        const primaryTag = courses[0]?.tag || 'General';

        let score = 55 + frequency * 10;
        const topGradeCount = courses.filter(c => c.grade?.includes('A')).length;
        score += topGradeCount * 8;

        let charHash = 0;
        for (let i = 0; i < skill.length; i++) {
          charHash += skill.charCodeAt(i);
        }
        score += (charHash % 6);

        return {
          skill,
          score,
          frequency,
          tag: primaryTag
        };
      })
      .sort((a, b) => b.score - a.score);

    // Map top 5 items: First 2 as Advanced, next 3 as Developing
    return sortedList.slice(0, 5).map((item, idx) => {
      const isAdvanced = idx < 2;
      return {
        ...item,
        level: isAdvanced ? 'Advanced' : 'Developing',
        levelStyle: isAdvanced
          ? 'text-purple-750 bg-purple-50 border-purple-300'
          : 'text-blue-750 bg-blue-50 border-blue-300'
      };
    });
  }, []);

  const highMasteryCount = React.useMemo(() => {
    return allCompetencyHighlights.filter(h => h.frequency >= 2).length;
  }, [allCompetencyHighlights]);

  // Calculate skill frequency map across courses under active Tag
  const skillFrequencyMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    currentTagGroup.courses.forEach(course => {
      course.skills.forEach(skill => {
        map[skill] = (map[skill] || 0) + 1;
      });
    });
    return map;
  }, [currentTagGroup]);

  // Skill list sorted by frequency (descending)
  const sortedSkills = React.useMemo(() => {
    return Object.keys(skillFrequencyMap).sort((a, b) => skillFrequencyMap[b] - skillFrequencyMap[a]);
  }, [skillFrequencyMap]);

  // Prepare Radar Chart Dataset with nuanced multi-factor proficiency scores for visually rich polygon shapes
  const currentRadarData = React.useMemo(() => {
    return sortedSkills.map(skill => {
      const matchingCourses = currentTagGroup.courses.filter(c => c.skills.includes(skill));
      const frequency = matchingCourses.length;

      // Base score from course count
      let score = 55 + frequency * 10;
      // Distinction grade bonus (+8)
      const distinctionCount = matchingCourses.filter(c => c.grade === 'Distinction').length;
      score += distinctionCount * 8;
      // Advanced course level bonus (+6)
      const advancedCount = matchingCourses.filter(c => c.id.includes('ide-03') || c.id.includes('des-02')).length;
      score += advancedCount * 6;

      // Signature hash variance (0-5) for organic polygon radar shape
      let charHash = 0;
      for (let i = 0; i < skill.length; i++) {
        charHash += skill.charCodeAt(i);
      }
      score += (charHash % 6);

      // Cap score strictly at 88 so radar chart polygon stays below max boundary
      const finalScore = Math.min(Math.max(score, 65), 88);

      return {
        skillName: skill,
        coreName: skillCoreNamesMap[skill] || skill,
        score: finalScore,
        frequency
      };
    });
  }, [sortedSkills, currentTagGroup]);

  // Active skill currently inspected (hovered or default first)
  const activeInspectedSkill = hoveredSkill && sortedSkills.includes(hoveredSkill)
    ? hoveredSkill
    : sortedSkills[0] || '';

  // Courses that verified/earned activeInspectedSkill
  const coursesForActiveSkill = React.useMemo(() => {
    if (!activeInspectedSkill) return [];
    return currentTagGroup.courses.filter(c => c.skills.includes(activeInspectedSkill));
  }, [currentTagGroup, activeInspectedSkill]);

  // Selected course object (if any)
  const selectedCourse = currentTagGroup.courses.find(c => c.id === selectedCourseId);

  const activeThemeClass = 'bg-slate-50 text-slate-800';
  const panelBgClass = 'bg-white border-slate-200 text-slate-800';

  return (
    <div className={`w-full p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 perspective-transition ${activeThemeClass}`}>
      
      {/* Master Layout Wrapper */}
      <div className="w-full max-w-[1530px] mx-auto flex flex-col gap-4 sm:gap-5 flex-1">
        
        {/* 1. Top Page Header Bar */}
        <div className="w-full flex items-center justify-between pb-2.5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200/60 flex items-center justify-center flex-shrink-0">
              <Route className="w-5 h-5 text-[#1A56DB]" />
            </div>
            <h1 className="text-xl font-sf-pro font-bold text-slate-900 tracking-normal leading-tight">
              Long-term Repository
            </h1>
          </div>
        </div>

        {/* 2. Main 2-Column Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch flex-1 min-h-[500px]">
          
          {/* ======================================================== */}
          {/* LEFT MASTER CARD: Long-Term Dashboard (8/12) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 h-[calc(100vh-112px)] min-h-[500px] flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">
            
            {/* Top Switcher Tab Bar with Divider Line (Formative Tab UI Style) */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex-shrink-0">
              <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => { if (perspective !== 'academic') togglePerspective(); }}
                  className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    perspective === 'academic'
                      ? 'bg-white text-[#1A56DB] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${perspective === 'academic' ? 'text-[#1A56DB]' : 'text-slate-700'}`} />
                  <span className={`text-[11px] font-sf-pro ${perspective === 'academic' ? 'font-extrabold text-[#1A56DB]' : 'font-semibold text-slate-600'}`}>
                    Academic View
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { if (perspective !== 'career') togglePerspective(); }}
                  className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    perspective === 'career'
                      ? 'bg-white text-[#1A56DB] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <Briefcase className={`w-3.5 h-3.5 flex-shrink-0 ${perspective === 'career' ? 'text-[#1A56DB]' : 'text-slate-700'}`} />
                  <span className={`text-[11px] font-sf-pro ${perspective === 'career' ? 'font-extrabold text-[#1A56DB]' : 'font-semibold text-slate-600'}`}>
                    Career View
                  </span>
                </button>
              </div>
            </div>

            {/* Interior Canvas Directly BELOW the Divider (NO Nested Card Shell!) */}
            <OverlayScrollbarBox className="flex-1 min-h-0 bg-white" paddingClassName="p-5">
              {perspective === 'academic' ? (
                /* ACADEMIC VIEW: KNOWLEDGE NOTES REPOSITORY (Notes) */
                <div className="flex flex-col gap-4 flex-1 h-full">
                  {/* Module Counter & Action Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-sf-pro font-bold text-slate-900 tracking-normal leading-none">
                        Knowledge Note Repository
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {savedNotes.length > 0 && (
                        <button
                          onClick={() => setIsEditingNotes(!isEditingNotes)}
                          className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center border ${
                            isEditingNotes
                              ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-2xs'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-200'
                          }`}
                          title={isEditingNotes ? 'Exit edit mode' : 'Edit notes'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Top Overview Metrics Strip (4 Stat Cards Grid) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Metric 1: Saved Notes */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col gap-1 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-sf-pro font-bold text-slate-400 tracking-normal">Saved Notes</span>
                        <FileText className="w-3.5 h-3.5 text-cyan-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-heading font-black text-slate-800">{savedNotes.length}</span>
                        <span className="text-[10.5px] font-heading font-bold text-cyan-600">Items</span>
                      </div>
                    </div>

                    {/* Metric 2: Tag Domains (Based on My Archive real tags) */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col gap-1 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-sf-pro font-bold text-slate-400 tracking-normal">Tag Domains</span>
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-heading font-black text-slate-800">
                          {new Set(archiveFolders.map(f => f.primaryTag)).size}
                        </span>
                        <span className="text-[10.5px] font-heading font-bold text-indigo-600">Tags</span>
                      </div>
                    </div>

                    {/* Metric 3: Linked Courses */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col gap-1 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-sf-pro font-bold text-slate-400 tracking-normal">Linked Courses</span>
                        <Folder className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-heading font-black text-slate-800">{archiveFolders.length}</span>
                        <span className="text-[10.5px] font-heading font-bold text-emerald-600">Folders</span>
                      </div>
                    </div>

                    {/* Metric 4: Evaluated Artifacts (通用成果/作品集/报告/论文数量总和) */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col gap-1 shadow-2xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-sf-pro font-bold text-slate-400 tracking-normal">Evaluated Artifacts</span>
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-heading font-black text-slate-800">
                          {isNewUser
                            ? pastProjects.reduce((sum, p) => sum + Math.max(1, p.formativeRounds?.length || 0), 0)
                            : archiveFolders.reduce((sum, f) => sum + (f.capabilities?.length || 2), 0)}
                        </span>
                        <span className="text-[10.5px] font-heading font-bold text-amber-600">Artifacts</span>
                      </div>
                    </div>
                  </div>

                  {savedNotes.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 gap-3.5 min-h-[380px] bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-2xs">
                        <BookOpen className="w-6 h-6 text-slate-300 stroke-1" />
                      </div>

                      <div className="flex flex-col gap-1.5 max-w-xs">
                        <h4 className="text-xs font-heading font-extrabold text-slate-700 uppercase tracking-wider">
                          No Knowledge Notes Saved
                        </h4>
                        <p className="text-[10.5px] font-body text-slate-400 leading-relaxed">
                          Add actionable recommendations from your Summative Dashboard evaluation cards to store them here as your long-term knowledge repository.
                        </p>
                      </div>

                      <button
                        onClick={() => setRoute('summative-dashboard')}
                        className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-cyan-400 text-cyan-700 rounded-xl text-[10px] font-heading font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs"
                      >
                        <span>Go to Summative Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-600" />
                      </button>
                    </div>
                  ) : (
                    /* TAG SELECTOR STRIP & ORDERED NOTES LIST */
                    (() => {
                      const availableTags = Array.from(new Set(savedNotes.map(n => n.tag || 'Academic Meta-Capability')));

                      const getTagBadgeStyle = (tag: string) => {
                        const t = (tag || '').toLowerCase();
                        if (t.includes('research') || t.includes('metric')) {
                          return 'bg-emerald-50/60 text-emerald-900/85 border-emerald-200/80';
                        }
                        if (t.includes('interactive') || t.includes('system') || t.includes('sustainability')) {
                          return 'bg-indigo-50/60 text-indigo-900/85 border-indigo-200/80';
                        }
                        if (t.includes('product') || t.includes('design') || t.includes('cmf')) {
                          return 'bg-blue-50/70 text-blue-900/85 border-blue-200/80';
                        }
                        if (t.includes('strategy') || t.includes('logic') || t.includes('innovation')) {
                          return 'bg-amber-50/60 text-amber-900/85 border-amber-200/80';
                        }
                        if (t.includes('writing') || t.includes('academic') || t.includes('literature')) {
                          return 'bg-slate-100/80 text-slate-700 border-slate-200/80';
                        }
                        return 'bg-blue-50/70 text-blue-900/85 border-blue-200/80';
                      };

                      let filteredNotes = selectedNoteTagFilter === 'all'
                        ? (() => {
                            const groups: Record<string, typeof savedNotes> = {};
                            savedNotes.forEach(n => {
                              const t = n.tag || 'other';
                              if (!groups[t]) groups[t] = [];
                              groups[t].push(n);
                            });
                            const tagKeys = Object.keys(groups);
                            const result: typeof savedNotes = [];
                            let maxLen = 0;
                            tagKeys.forEach(k => {
                              if (groups[k].length > maxLen) maxLen = groups[k].length;
                            });
                            for (let i = 0; i < maxLen; i++) {
                              for (const key of tagKeys) {
                                if (i < groups[key].length) {
                                  result.push(groups[key][i]);
                                }
                              }
                            }
                            return result;
                          })()
                        : [...savedNotes].filter(n => (n.tag || 'Academic Meta-Capability') === selectedNoteTagFilter).reverse();

                      if (showFavoritesOnly) {
                        filteredNotes = filteredNotes.filter(n => n.isFavorite);
                      }

                      return (
                        <div className="flex flex-col gap-4">
                          {/* Tag Filter Strip at Top */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Starred Favorites Toggle Button (纯Icon气泡) */}
                            <button
                              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                              className={`p-1.5 px-2 rounded-full text-[11px] font-heading font-extrabold transition-all cursor-pointer border flex items-center justify-center ${
                                showFavoritesOnly
                                  ? 'bg-amber-100/80 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                              title="Filter starred favorites"
                            >
                              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                            </button>

                            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

                            {availableTags.map(tag => {
                              const isActive = selectedNoteTagFilter === tag;
                              return (
                                <button
                                  key={tag}
                                  onClick={() => setSelectedNoteTagFilter(isActive ? 'all' : tag)}
                                  className={`px-3 py-1.5 rounded-full text-[11px] font-sf-pro font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                    isActive
                                      ? `${getTagBadgeStyle(tag)} shadow-2xs`
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="capitalize">{tag}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Notes Cards List Below */}
                          {filteredNotes.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <p className="text-xs text-slate-400 italic">
                                No saved notes match the selected filters.
                              </p>
                            </div>
                          ) : (
                            (() => {
                              const leftColNotes = filteredNotes.filter((_, idx) => idx % 2 === 0);
                              const rightColNotes = filteredNotes.filter((_, idx) => idx % 2 === 1);

                              const renderNoteCard = (note: typeof savedNotes[0]) => (
                                <div
                                  key={note.id}
                                  className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col gap-2.5 relative overflow-hidden group"
                                >
                                  {/* 1. Title Row */}
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="text-[13.5px] font-sf-pro font-semibold text-slate-800 leading-snug flex-1">
                                      {note.title}
                                    </h5>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => toggleFavoriteNote(note.id)}
                                        className="p-1 text-slate-300 hover:text-amber-400 rounded-md transition-colors cursor-pointer"
                                        title={note.isFavorite ? 'Remove bookmark' : 'Bookmark note'}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-amber-400 text-amber-400 shadow-2xs' : 'text-slate-300 hover:text-amber-400'}`} />
                                      </button>
                                      {isEditingNotes && (
                                        <button
                                          onClick={() => removeNote(note.id)}
                                          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex-shrink-0 animate-in fade-in duration-200"
                                          title="Delete note"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* 2. Tag Badge Capsule */}
                                  <div className="flex items-center justify-start">
                                    <span className={`text-[10.5px] font-sf-pro font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap capitalize ${getTagBadgeStyle(note.tag)}`}>
                                      {note.tag}
                                    </span>
                                  </div>

                                  {/* 3. Note Content Box */}
                                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11.5px] font-sf-pro text-slate-600 font-normal leading-relaxed">
                                    {note.keyTakeaway}
                                  </div>
                                </div>
                              );

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
                                  <div className="flex flex-col gap-3.5">
                                    {leftColNotes.map(renderNoteCard)}
                                  </div>
                                  <div className="flex flex-col gap-3.5">
                                    {rightColNotes.map(renderNoteCard)}
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : (
                /* CAREER RECOMMENDATIONS INTERIOR MODULE (FULL ORIGINAL RESTORED) */
                <div className="flex flex-col gap-4 flex-1 h-full">
                  {/* Module Header Bar & Divider Line */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-sf-pro font-bold text-slate-900 tracking-normal leading-none">
                        Career Advisor
                      </span>
                    </div>
                  </div>

                  {/* TOP SECTION: Snug, Refined Grid Filter Selector */}
                  <div className="grid grid-cols-[auto_1fr] items-center gap-y-2 gap-x-3 py-0.5">
                    {/* Row 1 Label */}
                    <span className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal select-none">
                      Target
                    </span>

                    {/* Row 1 Content (Target Pill + Edit Icon) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEditingTargetRole ? (
                        <div key="target-role-editing-wrapper" className="flex items-center gap-1.5">
                          <input
                            key="target-role-input"
                            type="text"
                            value={tempRoleInput}
                            onChange={(e) => setTempRoleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateUserProfile({ targetCareerRole: tempRoleInput });
                                setIsEditingTargetRole(false);
                              }
                            }}
                            placeholder="Enter target career..."
                            className="px-3 py-1.5 bg-white border border-blue-600 rounded-full text-[11px] font-sf-pro font-bold text-slate-800 focus:outline-none shadow-2xs"
                            autoFocus
                          />
                          <button
                            key="target-role-save-btn"
                            onClick={() => {
                              updateUserProfile({ targetCareerRole: tempRoleInput });
                              setIsEditingTargetRole(false);
                            }}
                            className="w-6 h-6 rounded-full bg-slate-900 text-white shadow-2xs flex items-center justify-center transition-all cursor-pointer flex-shrink-0 hover:bg-slate-800"
                            title="Save target career"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div key="target-role-viewing-wrapper" className="flex items-center gap-1">
                          <button
                            key="target-role-display-btn"
                            onClick={() => {
                              setSelectedCareerRoleId('role-01');
                              setHoveredCareerSkill(null);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-sf-pro font-bold transition-all cursor-pointer border inline-flex items-center gap-1.5 select-none ${
                              selectedCareerRoleId === 'role-01'
                                ? 'bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                            }`}
                          >
                            <span>{userProfile.targetCareerRole || 'Product Manager'}</span>
                          </button>

                          <button
                            key="target-role-edit-pencil-btn"
                            onClick={() => {
                              setTempRoleInput(userProfile.targetCareerRole || '');
                              setIsEditingTargetRole(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 bg-transparent hover:bg-transparent focus:bg-transparent transition-colors cursor-pointer flex-shrink-0 outline-none border-0"
                            title="Edit target career"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Row 2 Label */}
                    <span className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal select-none">
                      AI Match
                    </span>

                    {/* Row 2 Content (AI Match Pills) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recommendedCareerRoles.map((role) => {
                        const isSelected = selectedCareerRoleId === role.id;
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              setSelectedCareerRoleId(role.id);
                              setHoveredCareerSkill(null);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-sf-pro font-bold transition-all cursor-pointer border inline-flex items-center gap-2 select-none ${
                              isSelected
                                ? 'bg-blue-50/70 text-blue-900/85 border-blue-200/80 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span>{role.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTTOM SECTION: Dual Column Grid (7/12 Radar vs 5/12 Skill Inspector) */}
                  {(() => {
                    const dynamicAnalysis = dynamicRolesMap[selectedCareerRoleId];
                    const activeRoleObj = dynamicAnalysis
                      ? {
                          id: dynamicAnalysis.id,
                          title: dynamicAnalysis.title,
                          category: dynamicAnalysis.category,
                          matchScore: dynamicAnalysis.matchScore,
                          tag: dynamicAnalysis.category,
                          tagColor: '#1A56DB', // Ultramarine Blue Theme
                          icon: Sparkles,
                          industryOverview: dynamicAnalysis.industryOverview,
                          coreDeliverables: dynamicAnalysis.coreDeliverables,
                          toolsStack: dynamicAnalysis.toolsStack,
                          careerPathway: `${dynamicAnalysis.title} → Senior Specialist → Industry Lead`,
                          salaryRange: '$120,000 - $170,000 / yr',
                          topEmployers: ['Tech Leaders', 'Design Studios', 'Innovators']
                        }
                      : (recommendedCareerRoles.find(r => r.id === selectedCareerRoleId) || {
                          id: 'custom',
                          title: customCareerInput.trim() ? customCareerInput : 'Custom Target Role',
                          category: 'Custom Target Position',
                          matchScore: 80,
                          tag: 'Custom',
                          tagColor: '#1A56DB', // Ultramarine Blue Theme
                          icon: Box,
                          industryOverview: 'Custom target industry position entered by user. Skills and requirements are dynamically evaluated.',
                          coreDeliverables: ['Technical Specification Docs', 'System Architecture Schematics', 'Verification & Test Protocols', 'Project Milestones'],
                          toolsStack: ['Domain Tools', 'Figma', 'Analytics', 'Prototyping Rigs'],
                          careerPathway: 'Custom Role → Senior Specialist → Industry Lead',
                          salaryRange: '$110,000 - $160,000 / yr',
                          topEmployers: ['Tech Companies', 'Design Studios', 'Innovators']
                        });

                    const rawCareerRadarData = dynamicAnalysis?.skillComparisons
                      || roleSkillComparisons[selectedCareerRoleId]
                      || [
                          { skill: 'Core Domain Knowledge', coreName: 'Domain Knowledge', required: 85, current: 78, provenance: 'PDE-101 (Grade A)', reasoning: 'Solid domain foundation.', industryTools: ['CAD', 'Briefs'], proficiencyRequirement: 'Level 4: Advanced — Core domain mastery.' },
                          { skill: 'System Architecture', coreName: 'System Architecture', required: 90, current: 70, provenance: 'PDE-102 (Grade B+)', reasoning: 'Good architecture understanding.', industryTools: ['SysML', 'Diagrams'], proficiencyRequirement: 'Level 5: Expert — Complex system modeling.' },
                          { skill: 'Technical Execution', coreName: 'Technical Execution', required: 85, current: 82, provenance: 'PDE-101 (Grade A)', reasoning: 'Strong execution skills.', industryTools: ['Milling', 'Prototyping'], proficiencyRequirement: 'Level 4: Advanced — Precision execution.' },
                          { skill: 'Strategic Problem Solving', coreName: 'Problem Solving', required: 80, current: 88, provenance: 'RES-301 (Grade A-)', reasoning: 'Effective problem solving.', industryTools: ['HMW', 'Empathy Maps'], proficiencyRequirement: 'Level 4: Advanced — Strategic problem framing.' },
                          { skill: 'User-Centered Design', coreName: 'User Design', required: 75, current: 85, provenance: 'RES-301 (Grade A-)', reasoning: 'User centered methodology.', industryTools: ['Persona', 'Journey Maps'], proficiencyRequirement: 'Level 3: Proficient — User research protocols.' },
                          { skill: 'Quality Verification', coreName: 'Verification', required: 80, current: 65, provenance: 'PDE-102 (Grade B+)', reasoning: 'Needs lab verification practice.', industryTools: ['Testing Rigs', 'Metrics'], proficiencyRequirement: 'Level 4: Advanced — Quality evaluation.' }
                        ];

                    // 5-Level Discrete Mapping: Snapped to 5 level rings (20%, 40%, 60%, 80%, 100%)
                    const activeCareerRadarData = rawCareerRadarData.map(item => {
                      let currentScore = 0;

                      if (isNewUserFlow) {
                        if (isNewUser) {
                          currentScore = 0;
                        } else {
                          const domainName = item.skill + ' ' + (item.coreName || '');
                          const matchingCapabilities = allUserCapabilities.filter(c => matchDomainContext(c, domainName));

                          if (matchingCapabilities.length > 0) {
                            let evaluatedScore = 80;
                            if (summativeFeedbackData?.subScores) {
                              const matchedSub = summativeFeedbackData.subScores.find((s: any) => matchDomainContext(s.dimension, domainName));
                              if (matchedSub && typeof (matchedSub as any).score === 'number') {
                                evaluatedScore = (matchedSub as any).score;
                              }
                            }
                            currentScore = getLevelIndex(evaluatedScore) * 20;
                          } else {
                            currentScore = 0;
                          }
                        }
                      } else {
                        currentScore = getLevelIndex(item.current) * 20;
                      }

                      return {
                        ...item,
                        required: getLevelIndex(item.required) * 20,
                        current: currentScore,
                        rawRequired: item.required,
                        rawCurrent: currentScore
                      };
                    });

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1 h-full">
                        
                        {/* Left Column (7/12): Dual-Layer Overlapping Radar Chart */}
                        <div
                          className="lg:col-span-7 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-3 h-[410px] cursor-pointer"
                          onClick={() => setHoveredCareerSkill(null)}
                        >
                          
                          {/* Section Header Bar with Dual Overlay Legend */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-sf-pro font-bold text-slate-700 tracking-normal">
                              Competency Alignment Radar
                            </span>

                            {/* Dual Overlay Legend */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-sf-pro font-bold text-slate-500">
                                <span className="w-2.5 h-0.5 bg-slate-400 rounded-full border border-dashed border-slate-400" />
                                Target Required
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-sf-pro font-bold text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                Student Current {isNewUser ? '(No Data)' : ''}
                              </div>
                            </div>
                          </div>

                          {/* Dual Radar Chart Graphic Container */}
                          <div className="w-full h-[350px] relative px-3 py-1 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="47%" data={activeCareerRadarData}>
                                <PolarGrid stroke="#E2E8F0" />
                                <PolarAngleAxis
                                  dataKey="coreName"
                                  tick={(props: any) => {
                                    const { x, y, cx, cy, payload } = props;
                                    const tickValue = payload?.value;

                                    const centerX = cx ?? 160;
                                    const centerY = cy ?? 125;
                                    const dx = x - centerX;
                                    const dy = y - centerY;
                                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                                    const ux = dx / dist;
                                    const uy = dy / dist;

                                    const offset = 18;
                                    const labelX = x + ux * offset;
                                    const labelY = y + uy * offset;

                                    let anchor: 'start' | 'end' | 'middle' = 'middle';
                                    let baseline: 'auto' | 'hanging' | 'central' = 'central';

                                    if (ux < -0.3) anchor = 'end';
                                    else if (ux > 0.3) anchor = 'start';
                                    else anchor = 'middle';

                                    if (uy < -0.4) baseline = 'auto';
                                    else if (uy > 0.4) baseline = 'hanging';
                                    else baseline = 'central';

                                    const matchedItem = activeCareerRadarData.find(d => d.coreName === tickValue || d.skill === tickValue);
                                    const fullSkillName = matchedItem?.skill || tickValue;
                                    const isHovered = hoveredCareerSkill === fullSkillName || hoveredCareerSkill === tickValue;

                                    return (
                                      <text
                                        x={labelX}
                                        y={labelY}
                                        textAnchor={anchor}
                                        dominantBaseline={baseline}
                                        fill={isHovered ? '#1A56DB' : '#475569'}
                                        fontSize={10.5}
                                        fontWeight={isHovered ? 800 : 700}
                                        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'SF Pro', sans-serif"
                                        className="cursor-pointer transition-all duration-200"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setHoveredCareerSkill(fullSkillName);
                                        }}
                                        onMouseEnter={(e) => {
                                          e.stopPropagation();
                                          setHoveredCareerSkill(fullSkillName);
                                        }}
                                      >
                                        {tickValue}
                                      </text>
                                    );
                                  }}
                                />

                                {/* Layer 1: Industry Target Required (Dashed Outline + Translucent Tint) */}
                                <Radar
                                  name="Target Required"
                                  dataKey="required"
                                  stroke="#94A3B8"
                                  strokeWidth={1.25}
                                  strokeDasharray="3 3"
                                  fill="#94A3B8"
                                  fillOpacity={0.1}
                                  isAnimationActive={false}
                                />

                                {/* Layer 2: Student Current Mastery (Vibrant Ultramarine Blue Border & Solid Tint) */}
                                <Radar
                                  name="Student Current"
                                  dataKey="current"
                                  stroke="#1A56DB"
                                  strokeWidth={1.5}
                                  fill="#1A56DB"
                                  fillOpacity={0.22}
                                  isAnimationActive={false}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Right Column (5/12): Dynamic Dual-State Card (Unhovered JD vs Hovered Detailed Skill Comparison) */}
                        <div className="lg:col-span-5 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-3 h-[410px] overflow-y-auto">
                          
                          {/* Card Mode Header Bar */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[9.5px] font-heading font-extrabold text-slate-500 uppercase tracking-wider">
                              {hoveredCareerSkill ? 'SKILL ANALYSIS' : 'ROLE OVERVIEW'}
                            </span>
                          </div>

                          {/* Dynamic Content Body */}
                          {(() => {
                            const hoveredItem = hoveredCareerSkill
                              ? activeCareerRadarData.find(item => item.skill === hoveredCareerSkill || item.coreName === hoveredCareerSkill)
                              : null;

                            if (hoveredItem) {
                              /* HOVER STATE: Detailed Skill Comparison & Provenance Card */
                              let acSkills: string[] = [];

                              if (isNewUserFlow) {
                                // Strictly filter authentic user capabilities matching the hovered domain context
                                const domainName = hoveredItem.skill + ' ' + (hoveredItem.coreName || '');
                                acSkills = allUserCapabilities.filter(s => matchDomainContext(s, domainName));
                              } else {
                                const allAcademicKeys = Object.keys(skillDescriptionsMap);
                                const mapped = academicSkillsByDomainMap[hoveredItem.skill] || academicSkillsByDomainMap[hoveredItem.coreName];
                                acSkills = (mapped && mapped.length > 0)
                                  ? mapped.filter(s => allAcademicKeys.includes(s))
                                  : [];

                                if (acSkills.length === 0) {
                                  const STOP_WORDS = new Set(['model', 'modeling', 'design', 'system', 'systems', 'analysis', 'engineering', 'processing', 'testing', 'evaluation', 'synthesis', 'generation', 'management', 'business', 'probabilistic']);
                                  
                                  const skillQueryWords = (hoveredItem.skill + ' ' + (hoveredItem.coreName || ''))
                                    .toLowerCase()
                                    .split(/[\s\-_&]+/)
                                    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

                                  if (skillQueryWords.length > 0) {
                                    acSkills = allAcademicKeys.filter(s => {
                                      const sWords = s.toLowerCase().split(/[\s\-_&]+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
                                      return sWords.some(sw => skillQueryWords.some(qw => sw.includes(qw) || qw.includes(sw)));
                                    }).slice(0, 3);
                                  }
                                }
                              }

                              const hasAcquiredSkills = acSkills.length > 0;
                              const req = hoveredItem.required;
                              const cur = isNewUserFlow
                                ? (hasAcquiredSkills ? Math.max(60, Math.min(88, hoveredItem.current || 80)) : 0)
                                : (hasAcquiredSkills ? hoveredItem.current : Math.min(hoveredItem.current, Math.max(40, req - 15)));

                              const isTargetMet = hasAcquiredSkills && (cur >= req);

                              const filteredIndustryTools = (hoveredItem.industryTools || []).filter(tool => {
                                const normTool = tool.toLowerCase();
                                return !acSkills.some(acSkill => {
                                  const normAc = acSkill.toLowerCase();
                                  if (normAc.includes(normTool) || normTool.includes(normAc)) return true;
                                  
                                  const toolWords = normTool.split(/[\s\-_]+/).filter(w => w.length >= 4);
                                  const acWords = normAc.split(/[\s\-_]+/).filter(w => w.length >= 4);
                                  const commonWords = toolWords.filter(w => acWords.includes(w));
                                  
                                  if (commonWords.length >= 2) return true;
                                  if (commonWords.length === 1) {
                                    const w = commonWords[0];
                                    if (['mixed', 'ethical', 'governance', 'thematic', 'qualitative', 'quantitative', 'anthropometric', 'prototyping', 'ergonomics', 'cad', 'insights', 'simulation', 'testing'].includes(w)) {
                                      return true;
                                    }
                                  }
                                  return false;
                                });
                              });

                              return (
                                <div className="flex-1 flex flex-col justify-start gap-3.5 pt-1">
                                  
                                  {/* 1. Skill Title & Brief Role Context Overview */}
                                  <div className="flex flex-col gap-1 pb-2 border-b border-slate-100">
                                    <h4 className="text-sm font-heading font-black text-slate-900 leading-tight">
                                      {hoveredItem.skill}
                                    </h4>
                                    <p className="text-[10px] font-body text-slate-500 font-medium leading-relaxed">
                                      {getRoleSkillOverview(hoveredItem.skill)}
                                    </p>
                                  </div>

                                  {/* 3. Acquired Capabilities */}
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">
                                        ACQUIRED SKILLS
                                      </span>
                                    </div>

                                    {hasAcquiredSkills && !isNewUser ? (
                                      <div className="flex flex-col gap-1.5 w-full">
                                        {acSkills.map((acSkill, idx) => {
                                          const isPillHovered = hoveredCapabilityPill === acSkill;
                                          const originFolders = getAllArchiveFoldersForSkill(acSkill);
                                          const titlesTooltip = originFolders.map(f => f.title).join(' & ');

                                          return (
                                            <div
                                              key={idx}
                                              onMouseEnter={() => setHoveredCapabilityPill(acSkill)}
                                              onMouseLeave={() => setHoveredCapabilityPill(null)}
                                              className={`w-full text-[9.5px] font-heading font-bold px-3 py-1.5 rounded-lg border shadow-2xs flex items-center justify-between transition-all duration-200 cursor-pointer ${
                                                isPillHovered
                                                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs font-extrabold'
                                                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
                                              }`}
                                              title={`My Archive Provenance: ${titlesTooltip}`}
                                            >
                                              {isPillHovered ? (
                                                <div className="flex items-center gap-2 w-full animate-in fade-in duration-200 min-w-0">
                                                  <Folder className="w-3 h-3 flex-shrink-0 text-blue-600" />
                                                  <div className="flex items-center gap-1.5 flex-wrap truncate min-w-0">
                                                    {originFolders.map((f, fIdx) => (
                                                      <React.Fragment key={fIdx}>
                                                        {fIdx > 0 && <span className="text-slate-400 font-bold text-[8.5px] px-0.5">&</span>}
                                                        <span className="text-slate-900 font-extrabold truncate">{f.title}</span>
                                                      </React.Fragment>
                                                    ))}
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  <div className="flex items-center gap-2 truncate min-w-0">
                                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-600" />
                                                    <span className="truncate">{formatConciseSkill(acSkill)}</span>
                                                  </div>
                                                  <span className="text-[8.5px] font-mono text-slate-400 font-bold flex-shrink-0 pl-2">
                                                    {originFolders.length} {originFolders.length > 1 ? 'Courses' : 'Course'}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-white/80 border border-dashed border-slate-200/90 rounded-lg text-center">
                                        <p className="text-[10px] font-heading font-extrabold text-slate-400">
                                          No course evidence uploaded yet
                                        </p>
                                        <p className="text-[9px] font-body text-slate-400 mt-0.5">
                                          Process your first assignment feedback to calculate verified skill evidence.
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* 4. Lower Section: Dedicated Gap Analysis */}
                                  <div className="flex flex-col gap-2 pt-0.5">
                                    <span className="text-[9px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">
                                      CAREER TARGET
                                    </span>

                                    <p className="text-[10.5px] font-body text-slate-600 leading-relaxed font-medium">
                                      {hoveredItem.reasoning?.replace(/^(Major Gap|Significant Gap|Gap|Target Met):\s*/i, '').replace(/\s*(to reach Target|to meet Target|fully satisfy role requirements)\s*\([^\)]+\)\.?$/i, '.').trim()}
                                    </p>

                                    {filteredIndustryTools.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {filteredIndustryTools.map((tool, idx) => (
                                          <span
                                            key={idx}
                                            className="text-[9px] font-heading font-bold px-2.5 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/80 shadow-2xs transition-colors hover:bg-slate-200/60"
                                          >
                                            {tool}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              );
                            }

                            /* DEFAULT UNHOVERED STATE */
                            return (
                              <div className="flex-1 flex flex-col justify-between pt-1">
                                
                                <div className="flex flex-col gap-2.5">
                                  <h3 className="text-sm font-sf-pro font-bold text-slate-900 leading-tight">
                                    {activeRoleObj.title}
                                  </h3>

                                  <div className="flex items-center">
                                    <span className="text-[10px] font-sf-pro font-bold px-2.5 py-0.5 rounded-full bg-blue-50/70 text-blue-900/80 border border-blue-200/80 tracking-normal select-none">
                                      {activeRoleObj.category || 'Target Industry Role'}
                                    </span>
                                  </div>

                                  <p className="text-[10.5px] font-sf-pro text-slate-600 leading-relaxed">
                                    {activeRoleObj.industryOverview || 'Strategic industry role driving next-generation physical-digital design and technical execution.'}
                                  </p>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/70">
                                  <span className="text-[9px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">
                                    Typical Industry Deliverables & Scope
                                  </span>

                                  <div className="flex flex-col gap-1.5">
                                    {activeRoleObj.coreDeliverables?.slice(0, 3).map((del, idx) => (
                                      <div
                                        key={idx}
                                        className="text-[9.5px] font-heading font-bold px-3 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-200/80 shadow-2xs flex items-center gap-2"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-600" />
                                        <span className="truncate">{del}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {activeRoleObj.toolsStack && (
                                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/70">
                                    <span className="text-[9px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">
                                      Core Tools & Software Ecosystem
                                    </span>

                                    <div className="flex flex-wrap gap-1.5">
                                      {activeRoleObj.toolsStack.map((tool, idx) => (
                                        <span
                                          key={idx}
                                          className="text-[9px] font-heading font-bold px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200/80 shadow-2xs"
                                        >
                                          {tool}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            );
                          })()}

                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}
            </OverlayScrollbarBox>

          </div>

          {/* ======================================================== */}
          {/* RIGHT MASTER CARD: 3-Segmented Module (4/12) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 h-[calc(100vh-112px)] min-h-[500px] flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">
            
            {/* Top Switcher Tab Bar with Divider Line (Formative Tab UI Style) */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex-shrink-0">
              <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                {/* Tab 1: Long-Term Plan */}
                <button
                  type="button"
                  onClick={() => setRightCardTab('longterm')}
                  className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    rightCardTab === 'longterm'
                      ? 'bg-white text-[#1A56DB] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <Target className={`w-3.5 h-3.5 flex-shrink-0 ${rightCardTab === 'longterm' ? 'text-[#1A56DB]' : 'text-slate-700'}`} />
                  <span className={`text-[11px] font-sf-pro ${rightCardTab === 'longterm' ? 'font-extrabold text-[#1A56DB]' : 'font-semibold text-slate-600'}`}>
                    My Checklist
                  </span>
                </button>

                {/* Tab 2: AI Chatbox */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setRightCardTab('chatbox');
                      setHasUnreadChatNotification(false);
                    }}
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative whitespace-nowrap ${
                      rightCardTab === 'chatbox'
                        ? 'bg-white text-[#1A56DB] shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${rightCardTab === 'chatbox' ? 'text-[#1A56DB]' : 'text-slate-700'}`} />
                    <span className={`text-[11px] font-sf-pro ${rightCardTab === 'chatbox' ? 'font-extrabold text-[#1A56DB]' : 'font-semibold text-slate-600'}`}>
                      AI Assistant
                    </span>
                    {hasUnreadChatNotification && rightCardTab !== 'chatbox' && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white shadow-sm"></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Interior Canvas Directly BELOW the Divider */}
            <div className="flex-1 flex flex-col bg-white p-0 min-h-0 relative">
              <OverlayScrollbarBox className="h-full w-full flex-1" paddingClassName="p-5">
              


              {rightCardTab === 'longterm' && (
                /* TAB 2: LONG-TERM PLAN CHECKLIST (Long-Term Plan) */
                <div className="flex flex-col gap-4">
                  {/* Module Counter & Action Bar */}
                  {(() => {
                    const completedCount = savedPlans.filter(p => p.completed).length;

                    return (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-sf-pro font-bold text-slate-900 tracking-normal leading-none">
                            My Checklist
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-400 font-bold">
                            {savedPlans.length} {savedPlans.length === 1 ? 'Goal' : 'Goals'}
                            {savedPlans.length > 0 && ` • ${completedCount} Done`}
                          </span>
                          {savedPlans.length > 0 && (
                            <button
                              onClick={() => setIsEditingPlans(!isEditingPlans)}
                              className={`p-0.5 rounded transition-all cursor-pointer flex items-center justify-center border ${
                                isEditingPlans
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-2xs'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-200'
                              }`}
                              title={isEditingPlans ? 'Exit edit mode' : 'Edit goals'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {savedPlans.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 gap-3.5 min-h-[380px] bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-2xs">
                        <Target className="w-6 h-6 text-slate-300 stroke-1" />
                      </div>

                      <div className="flex flex-col gap-1.5 max-w-xs">
                        <h4 className="text-xs font-heading font-extrabold text-slate-700 uppercase tracking-wider">
                          No Long-Term Goals Configured
                        </h4>
                        <p className="text-[10.5px] font-body text-slate-400 leading-relaxed">
                          Add advanced exploration recommendations from your Summative Dashboard evaluation cards to store them here as long-term checklist goals.
                        </p>
                      </div>

                      <button
                        onClick={() => setRoute('summative-dashboard')}
                        className="mt-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-[#1A56DB] rounded-xl text-[10px] font-heading font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs"
                      >
                        <span>Go to Summative Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#1A56DB]" />
                      </button>
                    </div>
                  ) : (
                    /* TAG SELECTOR STRIP & CHECKLIST ITEMS BELOW */
                    (() => {
                      const availableTags = Array.from(new Set(savedPlans.map(p => p.tag || 'Advanced Exploration')));

                      const getPlanTagStyle = (tag: string) => {
                        const t = (tag || '').toLowerCase();
                        if (t.includes('research') || t.includes('metric')) {
                          return 'bg-emerald-50/60 text-emerald-900/85 border-emerald-200/80';
                        }
                        if (t.includes('interactive') || t.includes('system') || t.includes('sustainability')) {
                          return 'bg-indigo-50/60 text-indigo-900/85 border-indigo-200/80';
                        }
                        if (t.includes('product') || t.includes('design') || t.includes('cmf')) {
                          return 'bg-blue-50/70 text-blue-900/85 border-blue-200/80';
                        }
                        if (t.includes('strategy') || t.includes('logic') || t.includes('innovation')) {
                          return 'bg-amber-50/60 text-amber-900/85 border-amber-200/80';
                        }
                        if (t.includes('writing') || t.includes('academic') || t.includes('literature')) {
                          return 'bg-slate-100/80 text-slate-700 border-slate-200/80';
                        }
                        return 'bg-blue-50/70 text-blue-900/85 border-blue-200/80';
                      };

                      const filteredPlans = selectedPlanTagFilter === 'all'
                        ? [...savedPlans].reverse()
                        : [...savedPlans].filter(p => (p.tag || 'Advanced Exploration') === selectedPlanTagFilter).reverse();

                      return (
                        <div className="flex flex-col gap-4">
                          {/* Tag Filter Strip at Top */}
                          <div className="flex flex-wrap items-center gap-2">
                            {availableTags.map(tag => {
                              const isActive = selectedPlanTagFilter === tag;
                              return (
                                <button
                                  key={tag}
                                  onClick={() => setSelectedPlanTagFilter(isActive ? 'all' : tag)}
                                  className={`px-3 py-1.5 rounded-full text-[11px] font-sf-pro font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                    isActive
                                      ? `${getPlanTagStyle(tag)} shadow-2xs`
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="capitalize">{tag}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Checklist Items Below (Pending items first, Completed items second) */}
                          {filteredPlans.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <p className="text-xs text-slate-400 italic">
                                No long-term goals match the selected tag filter.
                              </p>
                            </div>
                          ) : (
                            (() => {
                              const sortedPlans = [...filteredPlans].sort((a, b) => Number(a.completed || false) - Number(b.completed || false));

                              return (
                                <div className="flex flex-col gap-3">
                                  {sortedPlans.map((plan) => {
                                    const isExpanded = !!expandedPlanIds[plan.id];
                                    return (
                                      <div
                                        key={plan.id}
                                        onClick={() => togglePlanExploration(plan.id)}
                                        className={`p-3.5 bg-white border rounded-xl shadow-2xs transition-all flex flex-col justify-between gap-3 relative overflow-hidden group cursor-pointer ${
                                          plan.completed
                                            ? 'border-slate-200/60 bg-slate-50/60 opacity-80'
                                            : 'border-slate-200/90 hover:border-[#1A56DB]/40'
                                        }`}
                                      >
                                        {/* Row 1: Title (Left) + Fold Button & Checkbox & Trash Icon (Top Right Corner) */}
                                        <div className="flex items-start justify-between gap-2.5">
                                          <h5
                                            className={`text-[13.5px] font-sf-pro font-semibold leading-snug flex-1 transition-all select-none ${
                                              plan.completed
                                                ? 'line-through text-slate-400'
                                                : 'text-slate-800 hover:text-[#1A56DB]'
                                            }`}
                                          >
                                            {plan.title}
                                          </h5>

                                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            {/* Top Right Corner Fold Icon Button (No Text Label) */}
                                            <button
                                              onClick={() => togglePlanExploration(plan.id)}
                                              className="p-1 text-slate-400 hover:text-[#1A56DB] hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex-shrink-0"
                                              title={isExpanded ? 'Collapse exploration' : 'Expand exploration'}
                                            >
                                              {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-[#1A56DB] stroke-[2.5]" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400 stroke-[2]" />
                                              )}
                                            </button>

                                            {/* Top Right Corner Checkbox Component (ONLY area for complete/pending toggle) */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                togglePlanCompleted(plan.id);
                                              }}
                                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none ${
                                                plan.completed
                                                  ? 'bg-[#1A56DB] border-[#1A56DB] text-white shadow-2xs'
                                                  : 'border-slate-300 bg-white hover:border-[#1A56DB]'
                                              }`}
                                              title={plan.completed ? 'Mark as pending' : 'Mark as completed'}
                                            >
                                              {plan.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                            </button>

                                            {isEditingPlans && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removePlan(plan.id);
                                                }}
                                                className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex-shrink-0 animate-in fade-in duration-200 ml-0.5"
                                                title="Delete goal"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Row 2: Tag Badge */}
                                        <div className="flex items-center justify-start">
                                          <span
                                            className={`text-[10.5px] font-sf-pro font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap capitalize ${
                                              plan.completed
                                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                                : getPlanTagStyle(plan.tag)
                                            }`}
                                          >
                                            {plan.tag}
                                          </span>
                                        </div>

                                        {/* Row 3: Collapsible Content Bubble */}
                                        {isExpanded && (
                                          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11.5px] font-sf-pro text-slate-600 font-normal leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                            <span className={plan.completed ? 'text-slate-400' : ''}>
                                              {plan.suggestedAction}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {rightCardTab === 'chatbox' && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <FreeformCopilotChat moduleType="longterm" onGuideActionClick={handleGuideActionClick} />
                </div>
              )}
              </OverlayScrollbarBox>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
