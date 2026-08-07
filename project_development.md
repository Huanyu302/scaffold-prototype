# Google Antigravity 2.0 用户反馈深度处理与长效能力沉淀系统 —— 项目开发说明文档

本项目开发说明文档旨在指导开发团队在 Google Antigravity 2.0 智能体开发环境中，高标准还原“用户反馈深度处理与长效能力沉淀系统”的交互原型。本规范的核心设计哲学在于**捍卫学生的认知主动权（Student Agency）**，通过刻意摩擦、精准反向映射与长期资产沉淀，将短期的碎片化评估转化为长期的个人成长能力谱系。

---

## 1. 项目技术栈与环境初始化 (Tech Stack & Environment)

为兼顾高性能的动态渲染、丰富的微交互以及优秀的类型安全性，系统推荐采用基于 React 的现代全栈/单页应用工程框架。

### 1.1 技术栈推荐
*   **基础框架**: React 18 / Next.js 14 (App Router)
*   **开发语言**: TypeScript (严格类型检查)
*   **样式方案**: Tailwind CSS v3 + Vanilla CSS (用于复杂微交互与毛玻璃遮罩动画)
*   **图表库**: Recharts (提供雷达图与趋势折线图的流畅过渡动画)
*   **拖拽引擎**: @dnd-kit/core & @dnd-kit/sortable (保障沙盒 Board 拖拽排序的高响应度与无障碍支持)
*   **图标库**: Lucide React

### 1.2 全局 UI 设计令牌配置 (Design Tokens)

#### 1.2.1 Tailwind CSS 配置文件 (`tailwind.config.js`)
在项目中配置主题色系（Formative 蓝与 Summative 紫）以及现代科技感的字体族：

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // 过程性反馈主色：代表正在演进、需要修改的作业流状态
          formative: {
            primary: "#00A3C4",      // Formative Cyan Blue
            light: "rgba(0, 163, 196, 0.15)",
            border: "rgba(0, 163, 196, 0.3)",
          },
          // 总结性反馈主色：代表最终评定、沉淀归档的资产流状态
          summative: {
            primary: "#4F46E5",      // Summative Indigo Purple
            light: "rgba(79, 70, 229, 0.15)",
            border: "rgba(79, 70, 229, 0.3)",
          },
        },
        glass: {
          bg: "rgba(255, 255, 255, 0.7)",
          bgDark: "rgba(15, 23, 42, 0.6)",
          border: "rgba(255, 255, 255, 0.4)",
          borderDark: "rgba(255, 255, 255, 0.1)",
        }
      },
      fontFamily: {
        // 用于大标题、简报核心要点卡片标题，建立现代的科技感
        heading: ["Outfit", "sans-serif"],
        // 用于正文、导师原始反馈文本，确保高密度密集文本下的长文易读性
        body: ["Inter", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
```

#### 1.2.2 全局 CSS 文件 (`src/styles/globals.css`)
通过 `@import` 引入 Google Fonts，并在此定义全局毛玻璃（Glassmorphism）设计令牌与平滑滚动：

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
    font-family: 'Inter', sans-serif;
    @apply bg-slate-50 text-slate-900 antialiased;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Outfit', sans-serif;
  }
}

/* 全局毛玻璃微质感样式（Glassmorphism） */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
}

.dark .glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
}

/* 精准反向高亮动画与样式 */
.highlight-anchor {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  background-color: transparent;
  border-radius: 4px;
}

/* 过程性反馈激活高亮 */
.highlight-anchor-formative-active {
  background-color: rgba(0, 163, 196, 0.18);
  box-shadow: 0 0 0 2px rgba(0, 163, 196, 0.3);
}

/* 总结性反馈激活高亮 */
.highlight-anchor-summative-active {
  background-color: rgba(79, 70, 229, 0.18);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
}

/* 页面过渡与一键归档的打包动画 */
@keyframes archive-package {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(0.9) translateY(-20px);
    opacity: 0.8;
  }
  100% {
    transform: scale(0) translateY(-200px);
    opacity: 0;
  }
}

.archive-animation {
  animation: archive-package 0.8s cubic-bezier(0.76, 0, 0.24, 1) forwards;
}

/* 跨视角（学术 ⇄ 职场）转场弹性动效与补间动效规格 */
.perspective-transition {
  transition: background-color 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.6s ease-in-out;
}

/* 学术视角与职场视角主题色过渡配置 */
.theme-academic {
  --theme-bg: #F8FAFC;
  --theme-panel-border: rgba(0, 163, 196, 0.3);
  --theme-color-active: #00A3C4;
}

.theme-career {
  --theme-bg: #0F172A;
  --theme-panel-border: rgba(16, 185, 129, 0.3); /* 极光绿 */
  --theme-color-active: #10B981;
}

/* 物理形态无缝补间（Morphing Animation）过渡参数 */
.morph-element {
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. 全局状态管理与数据结构设计 (State Management & Data Schema)

系统涉及复杂的跨路由状态切换、沙盒自主编辑记录追踪及临时数据归档。

### 2.1 全局状态树设计 (Global State Tree)
我们建议采用轻量级的 `Zustand` 或 React Context 进行全局状态管理，以便于在过程性工作台、总结性看板与长效能力映射视图之间传递上下文。

```typescript
export type FeedbackRoute = 'workbench' | 'formative-sandbox' | 'summative-dashboard' | 'global-competency';

export interface ProjectContext {
  projectId: string;
  projectName: string;
  feedbackType: 'formative' | 'summative';
  attachedMaterials: Array<{
    id: string;
    name: string;
    type: 'rubrics' | 'requirement' | 'current-draft' | 'reference';
    fileSize: number;
  }>;
}

export interface SandboxTodoItem {
  id: string;
  text: string;
  isCustom: boolean;               // 用户手动新建的为 true，源自 AI 推荐但已修改的为 false
  linkedFeedbackPointId?: string;  // 关联的 AI 简报要点 ID
  orderIndex: number;
}

export interface VersionHistoryNode {
  id: string;
  name: string;                   // 存档分支或修改版本名称
  timestamp: string;
  todos: SandboxTodoItem[];       // 当前版本对应的沙盒待办清单快照
  parentVersionId: string | null; // 父节点 ID，构成树状演进链条
  author: 'user' | 'ai-branched';
  description: string;            // 推演指令或锁定存档说明
}

export interface AppGlobalState {
  // 页面及流程路由
  currentRoute: FeedbackRoute;
  activeProject: ProjectContext | null;
  
  // 过程性反馈沙盒独占状态
  sandboxTodos: SandboxTodoItem[];
  sandboxInteracted: boolean;      // 关键：是否进行过“新建/修改/排序”的主动交互，用于解锁 AI 逻辑校验
  aiValidationResult: {
    status: 'idle' | 'validating' | 'completed';
    alignmentScore: number;        // 与 Rubrics 吻合度得分 (0-100)
    gapAnalysis: string;           // 逻辑漏洞或缺失点分析
    suggestions: string[];         // 仅限逻辑校验纠偏，不提供代写方案
  } | null;
  
  // 版本控制与 Git-like 历史树
  versionHistoryTree: Record<string, VersionHistoryNode>; // 历史版本演进树
  currentVersionId: string;        // 当前激活的版本节点 ID
  
  // 视角状态
  perspective: 'academic' | 'career'; // 学术（Academic）与职场（Career）视角切换器
  
  // 交互控制
  highlightedTextRange: { start: number; end: number } | null; // 原文高亮选区
  
  // 路由跳转与动作触发
  setRoute: (route: FeedbackRoute) => void;
  setActiveProject: (project: ProjectContext) => void;
  updateSandboxTodos: (todos: SandboxTodoItem[]) => void;
  triggerAIValidation: () => Promise<void>;
  
  // 版本树控制动作
  lockBranchAndMerge: (branchId: string, description: string) => void; // 锁定特定平行分支并合并至主干草稿
  backtrackToVersion: (versionId: string) => void;                      // 在历史树中回溯版本快照
  
  togglePerspective: () => void;
  archiveProjectToLongTermAsset: () => Promise<void>;
}
```

### 2.2 Mock 数据字典 TypeScript 接口与 JSON Schema 定义

#### 2.2.1 `formative_feedback.json`
*包含核心修改要点、过滤掉的客套文本、原始文本字符索引偏移量、以及多条方案推演分支数据。*

```typescript
export interface FormativeFeedbackSchema {
  projectId: string;
  originalFeedbackText: string;    // 导师原始反馈文本全文
  politeFluffRanges: Array<{       // 过滤掉的客套/无实质帮助文本区间（用于对比虚假赞美）
    startOffset: number;
    endOffset: number;
    text: string;
  }>;
  coreKeyPoints: Array<{           // AI 结构化提炼出的核心修改要点
    id: string;
    title: string;                 // 提炼后的干货标题
    summary: string;               // 核心痛点简述
    startOffset: number;           // 原文中对应核心表述的起止字符索引
    endOffset: number;
    severity: 'critical' | 'moderate' | 'minor'; // 严重程度
  }>;
  parallelProposals: Array<{       // 多向方案分支推演
    id: string;
    branchName: string;            // 例如：“分支 A：增强定量实证论证”、“分支 B：转向定性案例深度挖掘”
    promptCommand: string;         // 用户输入的推演指令
    impactOnLogic: string;         // 该分支对底层学术逻辑/结构的改造说明
    recommendationList: string[];  // 具体的待办方案建议步骤
    status: 'draft' | 'locked';    // 是否被用户锁定为官方修改历史存档点
  }>;
}
```

#### 2.2.2 `summative_feedback.json`
*包含文字轨摘要、多维度得分指标（雷达图与得分条数据）及原始文本的区间映射关系。*

```typescript
export interface SummativeFeedbackSchema {
  projectId: string;
  grade: string;                   // 最终评定等级，如 "A-"
  originalFeedbackText: string;
  textTrackSummaries: Array<{      // 文字轨：精简的文字摘要卡片
    id: string;
    dimension: string;             // 对应能力维度
    abstract: string;              // 简短提炼
    startOffset: number;           // 原文映射
    endOffset: number;
  }>;
  competencyScores: Array<{        // 数据轨：量化雷达图及得分条
    dimensionId: string;           // 对应能力 ID，例如 "critical-thinking"
    dimensionName: string;         // 维度名称，例如 "批判性思维"
    score: number;                 // 得分
    maxScore: number;              // 满分 (通常为 100)
    description: string;           // 评语摘要
    startOffset: number;           // 关联的原文段落起止字符索引（点击图表维度直接高亮原文）
    endOffset: number;
  }>;
}
```

#### 2.2.3 `global_competency.json`
*包含跨学期、多课程的宏观能力演进时间序列数据、匹配的职业角色画像以及推荐行动资源链接。*

```typescript
export interface GlobalCompetencySchema {
  studentId: string;
  academicHistory: Array<{         // 跨学期、跨课程的数据集
    semester: string;              // 例如 "2025 Fall"
    courseId: string;
    courseName: string;
    dimensions: Record<string, number>; // 该课程各项核心能力的最终折算分 (0-100)
  }>;
  competencyTimeSeries: Array<{    // 能力演进时间序列（用于大屏折线趋势图）
    date: string;                  // 时间戳或评估周期
    scores: {
      criticalThinking: number;
      academicWriting: number;
      quantitativeAnalysis: number;
      domainKnowledge: number;
      collaboration: number;
    }
  }>;
  careerMatching: {
    matchedProfiles: Array<{
      profileId: string;
      roleName: string;            // 目标职业角色，如 "数据咨询顾问 (Consultant)"、"学术研究员"
      matchPercentage: number;     // 匹配度百分比
      roleStrengths: string[];     // 匹配优势能力项
      gaps: Array<{                // 职长短板 Gap 分析
        competencyName: string;
        academicScore: number;     // 学生现有水平
        requiredScore: number;     // 职业基础门槛线
        gapDistance: number;       // 短板差距值
      }>;
    }>;
    recommendedActions: Array<{    // 闭环推荐卡片
      id: string;
      targetCompetency: string;    // 针对的缺陷能力项
      title: string;               // 推荐行动标题，如 "预约 Academic Writing Center 1v1 精准诊断"
      description: string;
      resourceType: 'writing_center' | 'micro_course' | 'workshop' | 'link';
      actionLink: string;          // 预约链接或资源 URL
    }>;
  };
}
```

---

## 3. 核心组件架构与工程目录 (Component Architecture & Directory)

### 3.1 核心组件清单与交互职责

1.  **多物料拖拽上传组件 (`DragAndDropZone`)**
    *   *交互职责*: 支持文件批量拖拽或点击上传，对 Rubrics、Requirement、Drafts 分类展示。
    *   *视觉效果*: 拖拽移入时触发 Formative 蓝（或当前路由色）的呼吸态边框扩散，并伴随微小位移反弹动画。
2.  **AI 简报卡片 (`AIBriefingCard`)**
    *   *交互职责*: 展现 AI 提取的结构化干货要点。
    *   *附加操作*: 点击右下角 “Read More” 按钮激活全局状态高亮选区，触发右栏导师原文区域自适应滚动及深度高亮。
3.  **可交互沙盒白板 (`TodoSandboxBoard`)**
    *   *交互职责*: 学生认知独立思考区。提供“新建待办卡片”、“编辑卡片文本”、“拖拽修改优先级序列”等操作。
    *   *硬约束*: 监测内部卡片的任何 Mutation 事件，向全局状态提交 `sandboxInteracted = true` 信号。
4.  **双轨解构面板 (`DualTrackDashboard`)**
    *   *交互职责*: 位于总结性反馈阶段。左侧展示文字总结（文字轨），右侧渲染 Recharts 雷达图及维度得分条（数据轨）。
    *   *反向映射*: 点击雷达图节点或得分条维度时，底层捕获其绑定的 `startOffset` 和 `endOffset` 并推送至高亮锚定管道。
5.  **学术⇄职场双视角 Toggle 切换器 (`PerspectiveToggle`)**
    *   *交互职责*: 位于长效能力沉淀阶段。使用无缝滑块切换视图。
    *   *视觉动效*: 切换时，页面容器触发 `.perspective-transition` 切换背景。能力雷达图与职场 Gap 进度条组件容器开启 `.morph-element` 动效类，通过控制 SVG `polygon` 顶点的重新计算与进度条路径 of SVG 形变，实现从雷达网状顶点到水平线性长短板条的无缝形态补间转换（Morphing Animation），以平滑桥接“短效学术资产”与“长效职场技能”的视角切换。
6.  **反馈脱水器开关 (`FluffFilterToggle`)**
    *   *交互职责*: 位于导师原文面板顶部。当用户开启该开关后，控制层读取 `formative_feedback.json` 中配置 of `politeFluffRanges` 偏移值。
    *   *视觉效果*: 原文中的无实质信息客套废话将获得淡化降噪样式（`opacity-20` 搭配微弱毛玻璃模糊 `blur-[0.5px]`），将非客套的真实专业评估要点高光凸显，缓解认知疲劳。

### 3.2 `src/` 工程目录结构推荐

遵循关注点分离原则，建议按照如下结构编排前端工程文件：

```plaintext
src/
├── components/                 # 基础及核心业务原子/分子组件
│   ├── ui/                     # 基础通用 UI（按钮、输入框、微型 Toggle、弹窗等）
│   │   ├── Button.tsx
│   │   ├── Toggle.tsx
│   │   └── ProgressBar.tsx
│   ├── upload/                 # 阶段 A：初始化多物料挂载相关
│   │   └── DragAndDropZone.tsx
│   ├── sandbox/                # 阶段 B 路线 1：过程性反馈深度沙盒相关
│   │   ├── SandboxCard.tsx
│   │   ├── TodoSandboxBoard.tsx
│   │   └── ParallelBranchSelector.tsx
│   ├── deconstruct/            # 阶段 B 路线 2：总结性反馈双轨解构相关
│   │   ├── RadarChartWrapper.tsx
│   │   ├── ScoreBarGroup.tsx
│   │   └── OriginalTextPanel.tsx
│   └── career/                 # 阶段 C：跨模块职业转换与 Gap 分析相关
│       ├── CompetencyLineChart.tsx
│       ├── GapAnalysisList.tsx
│       └── ActionRecommendation.tsx
├── views/                      # 四大核心视图面板层（容器组件，负责拼装和全局状态交互）
│   ├── Workbench.tsx           # Phase A: 空间初始化集中工作台
│   ├── FormativeSandbox.tsx    # Phase B - Route 1: 过程性深度处理沙盒
│   ├── SummativeDashboard.tsx  # Phase B - Route 2: 总结性反馈查看中心
│   └── GlobalCompetency.tsx    # Phase C: 跨模块长效能力映射与职业转换中心
├── styles/                     # 全局及模块样式配置
│   ├── globals.css             # 基础 Tailwind 覆盖与毛玻璃全局 CSS 令牌
│   └── theme.css               # 主题微交互关键帧动画
├── mock/                       # 本地高保真 Mock 数据字典
│   ├── formative_feedback.json
│   ├── summative_feedback.json
│   └── global_competency.json
├── store/                      # Zustand 或 React Context 全局状态管理仓
│   └── useAppStore.ts
└── App.tsx                     # 根入口路由配置
```

---

## 4. 关键交互逻辑与核心算法实现思路 (Key Interaction Logic)

为捍卫“认知主动权”，代码的编写不仅在乎界面的绘制，更注重底层交互逻辑和前置门槛的强制防御。

### 4.1 刻意摩擦（Deliberate Friction）与认知留白实现

#### 4.1.1 交互防线逻辑
1.  进入 **过程性反馈深度处理沙盒** 后，右侧虽然渲染了 AI 过滤提炼的要点，但底部的“AI 逻辑校验”按钮初始状态为置灰（`disabled = true`）。
2.  界面强制引导学生在中间的“To-Do 沙盒区”自主建立反馈待办清单。
3.  系统维护一个 `sandboxActions` 计数器或对原始 AI 初始化清单与当前清单进行内容 Deep Compare。
4.  只有当学生执行了如下两类操作之一时，才将 `sandboxInteracted` 标记为 `true` 并解锁“AI校验”：
    *   添加了自定义的待办卡片。
    *   重构了待办的执行顺序，或对 AI 提炼的待办文本进行了个性化修改（即避免直接无脑赞同 AI 提供的第一版顺序）。
5.  **平行方案历史树合并与 Git-like 回溯机制**：
    *   当用户执行 B1.5 动作（向 AI 请求多向方案推演）时，系统在版本树 `versionHistoryTree` 中以当前 `currentVersionId` 为父节点，Fork 出多条平行分支节点（如 `Branch A`, `Branch B`）。
    *   当用户执行 B1.6 动作（点击“锁定为官方修改历史存档点”）时，控制层调用 `lockBranchAndMerge`。其实现逻辑为：
        1. 将被锁定分支下的 `recommendationList`（AI 建议）以 `isCustom = false` 但标记为已关联到主待办清单的方式，深度合并入当前的 `sandboxTodos`。
        2. 将当前合并后的状态打包成一个新的版本节点追加到 `versionHistoryTree`，并将 `currentVersionId` 指向该节点。
        3. 更新 `activeProject` 的主干草稿数据快照，确保数据闭环。
        4. 界面上渲染出可视化的分支版本线，学生可随时点击任一版本节点，调用 `backtrackToVersion` 一键将沙盒恢复至对应历史快照，防止误操作并方便方案对比。

#### 4.1.2 React 实现伪代码

```tsx
import React, { useState, useEffect } from 'react';

interface SandboxProps {
  initialTodos: Array<{ id: string; text: string; orderIndex: number }>;
  onValidationRequest: (currentTodos: any[]) => void;
}

export const DeliberateFrictionSandbox: React.FC<SandboxProps> = ({
  initialTodos,
  onValidationRequest
}) => {
  const [todos, setTodos] = useState(initialTodos);
  const [isInteracted, setIsInteracted] = useState(false);

  // 严格比对原始状态与当前状态以侦测“实质修改”
  const checkInteraction = (currentTodos: typeof initialTodos) => {
    if (currentTodos.length !== initialTodos.length) {
      return true; // 新增或删除了待办项
    }
    // 检查文本是否发生任何编辑
    const isTextChanged = currentTodos.some((todo, index) => {
      const original = initialTodos.find(t => t.id === todo.id);
      return original ? original.text !== todo.text : true;
    });
    if (isTextChanged) return true;

    // 检查拖拽排序后顺序是否发生实质调整
    const isOrderChanged = currentTodos.some((todo, index) => todo.orderIndex !== index);
    if (isOrderChanged) return true;

    return false;
  };

  const handleUpdateTodos = (newTodos: typeof initialTodos) => {
    setTodos(newTodos);
    if (checkInteraction(newTodos)) {
      setIsInteracted(true); // 解锁交互限制
    } else {
      setIsInteracted(false); // 撤回解锁状态（如果被撤销回原始状态）
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 glass-panel border-brand-formative-border rounded-xl">
      <div>
        <h3 className="text-lg font-heading font-semibold text-slate-800 mb-2">
          待办清单自主梳理沙盒 (Pre-thinking Area)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          提示：请先根据 AI 核心要点及您的理解，在此对修改项进行手动编辑、排序或补充，系统方可解锁“AI 逻辑校验”功能。
        </p>
        
        {/* 此处渲染支持 Drag-and-Drop 的列表组件 */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {todos.map((todo) => (
            <div key={todo.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
              <input 
                type="text" 
                value={todo.text} 
                onChange={(e) => {
                  const updated = todos.map(t => t.id === todo.id ? { ...t, text: e.target.value } : t);
                  handleUpdateTodos(updated);
                }}
                className="w-full font-body text-sm font-medium focus:outline-none focus:border-brand-formative-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <button
          onClick={() => isInteracted && onValidationRequest(todos)}
          disabled={!isInteracted}
          className={`py-3 px-6 rounded-lg font-heading font-bold text-white transition-all duration-300 ${
            isInteracted
              ? 'bg-brand-formative-primary hover:bg-cyan-600 shadow-md hover:shadow-cyan-200/50 cursor-pointer scale-100 active:scale-95'
              : 'bg-slate-300 cursor-not-allowed opacity-50'
          }`}
        >
          {isInteracted ? '⚡ 激活 AI 逻辑校验 (AI Validation Locked)' : '🔒 请先自主整理沙盒以解锁校验'}
        </button>
      </div>
    </div>
  );
};
```

---

## 4.2 上下文反向锚定与平滑滚动高亮算法 (Contextual Positioning)

此算法在用户点击左侧简报卡片（如 “Read More”）或右侧雷达图维度时触发。其底层依托字符偏移索引（Char Index Offset），动态切分段落并注入高亮，再通过 DOM 元素的滚动位置计算，将导师原始反馈文本视窗平滑调整至视线中心。

#### 4.2.1 核心算法描述
1.  **分段式切片算法与渲染性能隔离**: 将原始长文本 `originalFeedbackText` 按段落分割为包含自身起止字符偏移量的段落对象数组，并在组件内部使用 React `useMemo` 对每个段落组件（`ParagraphRow`）的高亮交叉进行检测。当用户点击卡片触发高亮选区时，仅与该高亮范围发生重叠的段落才会重绘，避免长文本频繁字符裁剪导致的 DOM 树全量重绘性能卡顿。
2.  **反馈脱水（客套话过滤）过滤算法**: 在段落内进行子选区划分时，同时扫描 `politeFluffRanges` 偏移值。若开启“反馈脱水器（Fluff Filter Toggle）”且存在重叠，该部分子串的 `span` 容器将被赋予 `opacity-20 blur-[0.5px] line-through` 样式，在前端物理或视觉级降噪，凸显专业干货。
3.  **自适应平滑滚动**: 在包裹高亮样式的 `span` 上挂载 React Ref，触发 `scrollIntoView({ behavior: 'smooth', block: 'center' })` 使其优雅地浮现于视窗中心。

#### 4.2.2 高亮、性能隔离与客套脱水过滤 React 核心实现

```tsx
import React, { useRef, useEffect, useMemo, useState } from 'react';

interface FluffRange {
  startOffset: number;
  endOffset: number;
  text: string;
}

interface OriginalTextPanelProps {
  originalText: string;
  highlightRange: { start: number; end: number } | null;
  politeFluffRanges: FluffRange[];
  routeTheme: 'formative' | 'summative';
}

// 性能隔离组件：将高亮切片与脱水过滤逻辑下放到段落级别，配合 useMemo 避免全文本重绘
interface ParagraphRowProps {
  text: string;
  pStart: number;
  pEnd: number;
  highlightRange: { start: number; end: number } | null;
  politeFluffRanges: FluffRange[];
  fluffFilterActive: boolean;
  routeTheme: 'formative' | 'summative';
  activeSpanRef: React.RefObject<HTMLSpanElement>;
}

export const ParagraphRow: React.FC<ParagraphRowProps> = React.memo(({
  text,
  pStart,
  pEnd,
  highlightRange,
  politeFluffRanges,
  fluffFilterActive,
  routeTheme,
  activeSpanRef
}) => {
  // 检查当前段落是否与高亮范围存在交集
  const hasHighlight = useMemo(() => {
    if (!highlightRange) return false;
    const { start, end } = highlightRange;
    return Math.max(pStart, start) < Math.min(pEnd, end);
  }, [highlightRange, pStart, pEnd]);

  // 检查当前段落包含的客套话区间
  const overlappingFluffs = useMemo(() => {
    return politeFluffRanges.filter(fluff => 
      Math.max(pStart, fluff.startOffset) < Math.min(pEnd, fluff.endOffset)
    );
  }, [politeFluffRanges, pStart, pEnd]);

  // 仅在有交集或客套话过滤状态变化时，才进行字符级区间分切与渲染
  const renderedContent = useMemo(() => {
    // 若段落内无高亮，且不进行客套话脱水处理，直接渲染纯文本以达到最高性能
    if (!hasHighlight && (!fluffFilterActive || overlappingFluffs.length === 0)) {
      return <span>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    const marks = new Set<number>();
    marks.add(pStart);
    marks.add(pEnd);

    if (highlightRange) {
      const hStart = Math.max(pStart, highlightRange.start);
      const hEnd = Math.min(pEnd, highlightRange.end);
      if (hStart < hEnd) {
        marks.add(hStart);
        marks.add(hEnd);
      }
    }

    overlappingFluffs.forEach(f => {
      const fStart = Math.max(pStart, f.startOffset);
      const fEnd = Math.min(pEnd, f.endOffset);
      if (fStart < fEnd) {
        marks.add(fStart);
        marks.add(fEnd);
      }
    });

    const sortedMarks = Array.from(marks).sort((a, b) => a - b);
    
    // 区间扫描（Sweep-Line）渲染
    for (let i = 0; i < sortedMarks.length - 1; i++) {
      const start = sortedMarks[i];
      const end = sortedMarks[i + 1];
      
      const isHighlighted = highlightRange && start >= highlightRange.start && end <= highlightRange.end;
      const isFluff = overlappingFluffs.some(f => start >= f.startOffset && end <= f.endOffset);
      
      const subText = text.substring(start - pStart, end - pStart);
      const key = `${start}-${end}-${i}`;

      let className = '';
      const style: React.CSSProperties = {};
      let ref: React.RefObject<HTMLSpanElement> | undefined = undefined;

      if (isHighlighted) {
        ref = activeSpanRef;
        className += routeTheme === 'formative'
          ? 'highlight-anchor highlight-anchor-formative-active font-semibold text-slate-900 '
          : 'highlight-anchor highlight-anchor-summative-active font-semibold text-slate-900 ';
      }

      if (isFluff && fluffFilterActive) {
        // 客套话淡化降噪
        className += 'opacity-20 blur-[0.5px] transition-all duration-300 line-through decoration-dotted ';
        style.userSelect = 'none';
      }

      elements.push(
        <span key={key} ref={ref} className={className.trim() || undefined} style={style}>
          {subText}
        </span>
      );
    }

    return elements;
  }, [text, pStart, pEnd, hasHighlight, highlightRange, overlappingFluffs, fluffFilterActive, routeTheme, activeSpanRef]);

  return (
    <div className="mb-4 text-justify font-body text-sm text-slate-600 leading-relaxed transition-opacity duration-300">
      {renderedContent}
    </div>
  );
});

export const OriginalTextPanel: React.FC<OriginalTextPanelProps> = ({
  originalText,
  highlightRange,
  politeFluffRanges,
  routeTheme
}) => {
  const activeSpanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fluffFilterActive, setFluffFilterActive] = useState(false);

  // 对长文本按换行符预分割（Paragraph-based slicing），建立段落偏移索引字典
  const paragraphs = useMemo(() => {
    const rawParagraphs = originalText.split('\n');
    let cumulativeLength = 0;
    
    return rawParagraphs.map((text, index) => {
      const pStart = cumulativeLength;
      const pEnd = cumulativeLength + text.length;
      cumulativeLength = pEnd + 1; // +1 补偿换行符
      return {
        id: `p-${index}`,
        text,
        pStart,
        pEnd
      };
    });
  }, [originalText]);

  useEffect(() => {
    if (highlightRange && activeSpanRef.current) {
      activeSpanRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightRange]);

  return (
    <div className="w-full h-full min-h-[500px] max-h-[600px] flex flex-col rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-hidden overflow-hidden">
      {/* 顶部控制栏：集成反馈脱水器切换开关 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
        <h3 className="text-md font-heading font-semibold text-slate-700">
          导师反馈原文 (Instructor's Original Feedback)
        </h3>
        
        {/* 反馈脱水防御模式开关 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading font-medium text-slate-500">
            💧 反馈脱水器 (Fluff Filter)
          </span>
          <button
            onClick={() => setFluffFilterActive(!fluffFilterActive)}
            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
              fluffFilterActive ? 'bg-brand-formative-primary' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                fluffFilterActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 文本渲染主视口，利用段落隔离技术避免大量不必要重绘 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 scroll-smooth"
      >
        {paragraphs.map((p) => (
          <ParagraphRow
            key={p.id}
            text={p.text}
            pStart={p.pStart}
            pEnd={p.pEnd}
            highlightRange={highlightRange}
            politeFluffRanges={politeFluffRanges}
            fluffFilterActive={fluffFilterActive}
            routeTheme={routeTheme}
            activeSpanRef={activeSpanRef}
          />
        ))}
      </div>
    </div>
  );
};
```

---

### 4.3 资产一键归档与全量沉淀流程 (Asset Archiving Animation)

点击总结性路线面板顶部的“归档至长期资产库”按钮后，系统不能执行平凡的数据同步，而必须提供极具仪式感的**“打包动画”**：

1.  **卡片压缩及位移效果**: 整个阶段视图的解构面板（雷达图、卡片）向上缩放，并在中轴线收缩（使用 CSS 动效类或 Framer-motion `layoutId`），向着全局视图右上角的“资产库图标”平滑汇聚。
2.  **底层数据聚合及持久化**:
    *   在动画执行的 800ms 内，本地控制器异步编译本次任务的所有数据：包括本次修改锁定官方历史节点数据、评语文字轨、本次得分以及最终版文档。
    *   接口以事务的形式，将合并后的能力点追加写入 `global_competency.json` 的 `academicHistory` 中。
    *   同时根据更新后的能力均值，全量刷新能力演进时间序列 `competencyTimeSeries`。
3.  **转场与新视角唤醒**: 动画结束后，控制层触发 `currentRoute = 'global-competency'`。此时画面切换为全局大屏，用户将看到新增的该课程雷达折线，并收到提示信息：“学术成果成功沉淀为个人数字资产，点击切换职场视角查看 GAP 变化。”

---

### 4.4 弱项维度点击与闭环推荐拉取逻辑 (Recommendation Trigger Logic)

当用户在全局个人中心（`GlobalCompetency` 视图）点击雷达图上的特定能力维度（或在职场视角点击长短板 Gap 进度条）时，系统执行以下闭环反馈机制：

1.  **事件截获与过滤**: 触发点击回调，提取目标能力维度的 `dimensionId`（例如 `criticalThinking`）。
2.  **动态数据拉取**: 本地控制层从 `global_competency.json` 的 `careerMatching.recommendedActions` 中过滤出包含该能力维度的所有推荐项目。
3.  **交错渐显式动画渲染 (Staggered Fade-in)**:
    - 侧边栏推荐区域接收到选定的推荐数据数组后，设置一个局部的渲染延时序列。
    - 对拉取到的卡片数组按索引 `index` 乘上 `75ms` 的间隔进行 CSS `transition-delay` 偏移注入。
    - 卡片在 300ms 内从小幅度向上位移并淡入显示，创造极佳的视觉吸引力。

#### React 推荐列表渲染组件示例：

```tsx
import React, { useEffect, useState } from 'react';

interface RecommendedAction {
  id: string;
  targetCompetency: string;
  title: string;
  description: string;
  resourceType: 'writing_center' | 'micro_course' | 'workshop' | 'link';
  actionLink: string;
}

interface CareerRecommendationsProps {
  selectedCompetencyId: string | null;
  actionsDatabase: RecommendedAction[];
}

export const CareerRecommendations: React.FC<CareerRecommendationsProps> = ({
  selectedCompetencyId,
  actionsDatabase
}) => {
  const [renderedActions, setRenderedActions] = useState<RecommendedAction[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!selectedCompetencyId) {
      setRenderedActions([]);
      setVisible(false);
      return;
    }

    // 1. 动态过滤匹配的闭环建议数据
    const filtered = actionsDatabase.filter(
      action => action.targetCompetency === selectedCompetencyId
    );
    
    setVisible(false);
    // 短暂延迟后更新状态以触发交错渐显动效
    const timer = setTimeout(() => {
      setRenderedActions(filtered);
      setVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCompetencyId, actionsDatabase]);

  return (
    <div className="w-full p-4 glass-panel border-slate-200 rounded-xl">
      <h4 className="text-sm font-heading font-semibold text-slate-700 mb-4">
        ⚡ 针对性能力闭环行动建议 (Action Recommendations)
      </h4>
      {renderedActions.length === 0 ? (
        <p className="text-xs text-slate-400 italic">点击全局能力图谱的弱项维度，获取闭环补短方案</p>
      ) : (
        <div className="space-y-3">
          {renderedActions.map((action, index) => (
            <div
              key={action.id}
              style={{
                transitionDelay: `${index * 75}ms`,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                opacity: visible ? 1 : 0,
              }}
              className="p-3 bg-white border border-slate-100 hover:border-brand-formative-border rounded-lg shadow-sm transition-all duration-500 ease-out flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-formative-light text-brand-formative-primary">
                  {action.resourceType.toUpperCase()}
                </span>
              </div>
              <h5 className="text-sm font-heading font-semibold text-slate-800">{action.title}</h5>
              <p className="text-xs text-slate-500 leading-normal">{action.description}</p>
              <a
                href={action.actionLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-heading font-bold text-brand-formative-primary hover:underline mt-1 self-start flex items-center gap-1"
              >
                立即点击行动 →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 5. 自动化验证与功能走通清单 (Walkthrough & Verification)

为了检验 Antigravity 代理生成的交互原型是否合格，必须在交付阶段通过以下测试路径并完成对应 Walkthrough 指导说明。

### 5.1 黄金验证路径 CheckList

| 编号 | 测试路径与关键验证点 | 预期用户体验与交互反馈 | 状态 |
| :--- | :--- | :--- | :--- |
| **Path 1** | **沙盒自主梳理与逻辑校验路径 (Formative Sandbox)** | | |
| 1.1 | 进入 `Workbench` 面板，上传课程大纲与作业草稿，勾选“过程性反馈”，点击激活。 | 进入 1:1 双栏分屏，左侧显示 AI 核心卡片，右侧显示导师全文，且下方“AI 校验”按钮由于“认知防御摩擦”锁闭，呈置灰态。 | `[ ]` |
| 1.2 | 在 To-Do 沙盒中点击“新建卡片”写入自我反思，或长按拖动初始待办卡片以重组其逻辑顺序。 | 检测到实质性的沙盒编辑，全局状态 `sandboxInteracted` 转换为 `true`，底部“AI 校验”按钮立刻发出呼吸光效，成功解锁。 | `[ ]` |
| 1.3 | 点击已解锁的“AI 校验”按钮。 | 界面平滑展开逻辑对比视口，展示该学生自主梳理的 To-Do 与课程 Rubrics 指标的实际对齐差，不代劳修改。 | `[ ]` |
| 1.4 | 在沙盒底部的多向方案推演对话框中输入推演指令（如“采用定量实证方法重构论证”）并提交。 | 系统成功分支（Branch out）生成多条平行的修改路径方案卡片（方案 A、方案 B 等），清晰呈现不同推演方向对底层逻辑的影响差异。 | `[ ]` |
| 1.5 | 对比推演出的方案卡片，手动点击其中一条最符合自己认知的方案下方的“锁定为官方修改历史存档点”按钮。 | 选定的方案被冻结并保存入历史修改记录树中，卡片状态更新为“已锁定历史存档点”，保留最终决策权。 | `[ ]` |
| **Path 2** | **双轨解构与原文精准反向锚定路径 (Summative Anchor)** | | |
| 2.1 | 在向导中点击“总结性反馈”，跳转至 `SummativeDashboard`。 | 界面上部为双轨解构面板（左文字，右雷达图），下部为对照原始全文面板。整体带有轻质感毛玻璃（Glassmorphism）质感。 | `[ ]` |
| 2.2 | 手动点击左栏的“学术规范引用要点卡片”，或点击右侧雷达图中的“批判性思维”能力极点。 | 右下侧原始文本面板瞬时开始平滑自适应滚动，并将视口定位到该得分维度的对应导师论证出处上，出处以淡紫背景闪烁两下后保持持续高亮。 | `[ ]` |
| **Path 3** | **一键归档与职场视角 Gap 转换路径 (Asset Transition)** | | |
| 3.1 | 点击 `SummativeDashboard`右上角的“归档至长期资产库”按钮。 | 触发 `archive-animation` 的打包飞入特效，视图自动切换至 `GlobalCompetency`。新成绩被追加记录至个人终身能力数据集中。 | `[ ]` |
| 3.2 | 在全局能力大屏顶部点击“学术 ⇄ 职场”视角切换 Toggle。 | 背景和雷达图执行渐变色平滑换肤（由学术的知识树演进大屏切换为冷灰+极光绿的职场画像面板），“职业生涯转换器”精准渲染出目标职业（如“高级咨询顾问”）对批判性思维等属性的职业基准线，以重叠阴影雷达图展示 Gap，并联动右侧行动建议推荐补充微课。 | `[ ]` |

---

## 6. 开发防线捍卫：认知主动权 (Student Agency Guard)

> [!IMPORTANT]
> **绝对的工程红线提示**：
> 本系统拒绝平庸。严禁在 `FormativeSandbox` （过程性反馈）中使用直接代写、一键应用修改或自动修正拼写语法等功能。
> 智能体必须通过限制代码逻辑实现，阻止 AI 将答案直接投喂给学生。系统存在的唯一意义是通过交互的“慢”和“摩擦”，促成学生大脑深处的思考反省，并最终将其能力转化为可在 `GlobalCompetency` （职业视角）上呈现的宝贵数字资产。

---

## 7. 界面语言规范约束 (UI Language Constraint)

> [!IMPORTANT]
> **纯英文界面要求 (Pure English UI Only)**：
> 所有由前端原型系统渲染的交互用户界面、按钮标签（Buttons）、提示文本（Tooltips & Alerts）、导航菜单（Navigation）、图表维度标识（Chart Labels）、AI 简报内容，以及 Mock 数据流中的内容，**必须严格且完全采用纯英文（English Only）呈现**。
> 本说明文档虽以中文进行开发逻辑阐述，但实际产出的系统原型界面中不得出现任何中文字符，以确保学术与职业场景上下文的纯英文体验一致性。
