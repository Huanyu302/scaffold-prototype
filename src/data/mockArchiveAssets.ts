// src/data/mockArchiveAssets.ts

export interface ArchiveFolder {
  id: string;
  courseCode: string;
  folderTitle: string;
  gradeBadge: {
    label: string;
    score: number;
  };
  primaryTag: 'research' | 'product design' | 'interactive design' | 'innovation strategy';
  capabilities: string[]; // 包含共有拓扑枢纽节点
  isClickable: false; // 声明为静态资产，禁止次级跳转
}

export const mockArchiveFolders: ArchiveFolder[] = [
  {
    id: "folder-01",
    courseCode: "DE7-CDE",
    folderTitle: "Contextual Design Engineering",
    gradeBadge: { label: "Grade A", score: 72 },
    primaryTag: "product design",
    capabilities: [
      "Human-Centered Physical Prototyping",
      "Inclusive Systems Design",
      "Contextual Problem Framing",
      "Hardware Component Integration"
    ],
    isClickable: false
  },
  {
    id: "folder-02",
    courseCode: "DE7-DEP",
    folderTitle: "Design Engineering Practice",
    gradeBadge: { label: "Grade A-", score: 74 },
    primaryTag: "product design",
    capabilities: [
      "Human-Centered Physical Prototyping",
      "Inclusive Systems Design",
      "Strategic Concept Ideation",
      "High-Fidelity CAD Modeling"
    ],
    isClickable: false
  },
  {
    id: "folder-03",
    courseCode: "DE7-FTR",
    folderTitle: "Foundational Transdisciplinary Research",
    gradeBadge: { label: "Grade B+", score: 66 },
    primaryTag: "research",
    capabilities: [
      "Mixed-Methods Research Design",
      "Evidence-Based Insight Synthesis",
      "Qualitative Thematic Analysis",
      "Ethical Research Governance"
    ],
    isClickable: false
  },
  {
    id: "folder-04",
    courseCode: "DE7-ATR",
    folderTitle: "Advanced Transdisciplinary Research",
    gradeBadge: { label: "Grade A", score: 76 },
    primaryTag: "research",
    capabilities: [
      "Mixed-Methods Research Design",
      "Evidence-Based Insight Synthesis",
      "AI-Assisted Stakeholder Simulation",
      "Probabilistic Bayesian Modeling"
    ],
    isClickable: false
  },
  {
    id: "folder-05",
    courseCode: "DE7-SIOT",
    folderTitle: "Sensing and Internet of Things",
    gradeBadge: { label: "Grade A", score: 78 },
    primaryTag: "interactive design",
    capabilities: [
      "Interactive System Architecture",
      "Real-Time Signal Processing",
      "Physical Sensor Pipeline",
      "Embedded Protocol Processing"
    ],
    isClickable: false
  },
  {
    id: "folder-06",
    courseCode: "DE6-AXD",
    folderTitle: "Audio Experience Design",
    gradeBadge: { label: "Grade A-", score: 82 },
    primaryTag: "interactive design",
    capabilities: [
      "Interactive System Architecture",
      "Real-Time Signal Processing",
      "Psychoacoustic Perception Evaluation",
      "Spatial Binaural Rendering"
    ],
    isClickable: false
  },
  {
    id: "folder-07",
    courseCode: "DE7-IM",
    folderTitle: "Innovation Management",
    gradeBadge: { label: "Grade B", score: 64 },
    primaryTag: "innovation strategy",
    capabilities: [
      "Business Model Generation",
      "Financial Risk Analysis",
      "Value Proposition Mapping"
    ],
    isClickable: false
  }
];
