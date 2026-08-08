import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Check, Play, AlertCircle, GitBranch, ArrowUp, ArrowDown, Trash2, Plus, GitCommit, FileText, FileInput, MessageSquare, ClipboardList, Layers, Send, Lock, Edit, Bot, Square, ArrowUpDown, ChevronUp, ChevronDown, BookOpen, FolderOpen, Loader2, X, Info } from 'lucide-react';
import { useAppStore, SandboxTodoItem, ChatMessage } from '../store/useAppStore';
import { OriginalTextPanel } from '../components/deconstruct/OriginalTextPanel';
import { DocumentViewer } from '../components/deconstruct/DocumentViewer';
import { calculateWeightedGrade, formatDimensionTitle } from '../utils/geminiService';
import { OverlayScrollbarBox } from '../components/common/OverlayScrollbarBox';

export const FormativeSandbox: React.FC = () => {
  const {
    activeProject,
    formativeFeedbackData,
    todoList,
    todoMode,
    sandboxInteracted,
    aiValidationResult,
    versionHistoryTree,
    currentVersionId,
    highlightedTextRange,
    activeAnchorContext,
    activeLeftTab,
    activatedLeftTools,
    selectedBriefingIds,
    activeRightTab,
    hasUnreadChatNotification,
    setHasUnreadChatNotification,
    chatMessages,
    setRoute,
    setLeftTab,
    setActiveRightTab,
    setActiveAnchorContext,
    processFormativeFeedback,
    sendChatMessage,
    setTodoMode,
    updateTodoList,
    validateTodoWithAI,
    applyAISuggestions,
    toggleSelectBriefing,
    toggleSelectAllBriefings,
    addSelectedBriefingsToTodo,
    lockBranchAndMerge,
    backtrackToVersion,
    setHighlightedTextRange,
    isAIWorking,
    cancelGlobalAIGeneration,
    todoAuditStage,
    detectedOmissions,
    toggleOmissionStatus,
    applyRecommendedSequence,
    isMaterialReminderOpen,
    setIsMaterialReminderOpen,
    triggerFeedbackAnalysis,
    rawFeedbackInput,
    setRawFeedbackInput,
    formativeRounds,
    addNewFeedbackRound,
    isEditingCurrentRound,
    updateCurrentFeedbackRound,
    isPreparingNewRound
  } = useAppStore();

  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  
  // Inline editing states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [editingVal, setEditingVal] = useState('');

  // Expandable tasks in locked mode
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  // Sync past materials modal state
  const [showSyncMaterialsModal, setShowSyncMaterialsModal] = useState(false);
  const [pendingFeedbackText, setPendingFeedbackText] = useState('');
  const [selectedSyncMaterialIds, setSelectedSyncMaterialIds] = useState<string[]>([]);
  
  // Feedback Input State
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInputValidationError, setShowInputValidationError] = useState(false);
  
  // Dashboard card filters
  const [severityFilter, setSeverityFilter] = useState<'critical' | 'moderate' | 'minor' | null>(null);
  const [rubricFilter, setRubricFilter] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  const [flashingAnchorIndex, setFlashingAnchorIndex] = useState<number | null>(null);
  const [isFlashingAddTodoBtn, setIsFlashingAddTodoBtn] = useState<boolean>(false);

  const briefingScrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryPillsRef = useRef<HTMLDivElement>(null);
  const batchActionBarRef = useRef<HTMLDivElement>(null);
  const firstKeyPointRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatScrollTopRef = useRef<number>(0);
  const hasNotifiedLockRef = useRef<boolean>(false);
  const hasNotifiedCompleteRef = useRef<boolean>(false);

  const scrollToLatestMessage = () => {
    if (!chatScrollRef.current) return;
    const container = chatScrollRef.current;

    const messageElements = container.querySelectorAll<HTMLElement>('[data-message-id]');
    if (messageElements.length === 0) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      return;
    }

    const lastElement = messageElements[messageElements.length - 1];
    const containerHeight = container.clientHeight;
    const elementHeight = lastElement.offsetHeight;
    const elementTop = lastElement.offsetTop;

    // For long content (cards / multi-line responses taller than 40% viewport height),
    // scroll to the TOP of the new message so user reads from the beginning!
    if (elementHeight > containerHeight * 0.4) {
      const targetScrollTop = Math.max(0, elementTop - 12);
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    } else {
      // Short content: scroll to bottom as usual
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Real-time intelligent auto scroll when AI generates new messages or content updates
  useEffect(() => {
    if (activeRightTab === 'chatbox') {
      const timer = setTimeout(() => {
        scrollToLatestMessage();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, isAIWorking, activeRightTab, detectedOmissions]);

  useEffect(() => {
    if (activeRightTab === 'chatbox' && chatScrollRef.current && chatScrollTopRef.current > 0) {
      chatScrollRef.current.scrollTop = chatScrollTopRef.current;
    }
  }, [activeRightTab]);

  // Reactive AI encouragement on locking Todo List (Triggers ONCE ONLY per session)
  useEffect(() => {
    if (todoMode === 'locked' && todoList.length > 0 && !hasNotifiedLockRef.current) {
      hasNotifiedLockRef.current = true;
      const loadingId = `msg-ai-lock-loading-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id: loadingId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true
      };

      useAppStore.setState(state => ({
        chatMessages: [...state.chatMessages, loadingMsg],
        hasUnreadChatNotification: state.activeRightTab !== 'chatbox'
      }));

      setTimeout(() => {
        const lockMsg: ChatMessage = {
          id: `msg-ai-lock-${Date.now()}`,
          sender: 'ai',
          text: `Great job setting up your Todo List! Your checklist is now locked and ready for step-by-step execution. You've got this!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: false
        };
        useAppStore.setState(state => ({
          chatMessages: state.chatMessages.map(m => m.id === loadingId ? lockMsg : m)
        }));
      }, 850);
    }
  }, [todoMode, todoList.length]);

  // Reactive AI celebration on completing all Todo items (Triggers ONCE ONLY per session)
  useEffect(() => {
    const allCompleted = todoList.length > 0 && todoList.every(t => t.isCompleted);
    if (allCompleted && !hasNotifiedCompleteRef.current) {
      hasNotifiedCompleteRef.current = true;
      const loadingId = `msg-ai-complete-loading-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id: loadingId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true
      };

      useAppStore.setState(state => ({
        chatMessages: [...state.chatMessages, loadingMsg],
        hasUnreadChatNotification: state.activeRightTab !== 'chatbox'
      }));

      setTimeout(() => {
        const completeMsg: ChatMessage = {
          id: `msg-ai-complete-all-${Date.now()}`,
          sender: 'ai',
          text: `Fantastic work! You've completed all items on your Todo List. Your revisions are fully aligned and ready for submission! 🎉`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: false
        };
        useAppStore.setState(state => ({
          chatMessages: state.chatMessages.map(m => m.id === loadingId ? completeMsg : m)
        }));
      }, 950);
    }
  }, [todoList]);

  const scrollToBriefingElement = (targetRef: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const redCount = formativeFeedbackData.coreKeyPoints.filter(kp => kp.severity === 'critical').length;
  const yellowCount = formativeFeedbackData.coreKeyPoints.filter(kp => kp.severity === 'moderate').length;
  const greenCount = formativeFeedbackData.coreKeyPoints.filter(kp => kp.severity !== 'critical' && kp.severity !== 'moderate').length;

  const filteredKeyPoints = formativeFeedbackData.coreKeyPoints.filter(kp => {
    const matchesSeverity = !severityFilter || 
      (severityFilter === 'critical' && kp.severity === 'critical') ||
      (severityFilter === 'moderate' && kp.severity === 'moderate') ||
      (severityFilter === 'minor' && kp.severity !== 'critical' && kp.severity !== 'moderate');
    const matchesRubric = !rubricFilter || (kp.associatedCriterion && kp.associatedCriterion.toLowerCase() === rubricFilter.toLowerCase());
    return matchesSeverity && matchesRubric;
  });

  // Dynamically compile the deduplicated rubric statuses with frontend fallback assertion (no status colors dynamically needed for tags)
  const renderedRubrics = (() => {
    const list = [...(formativeFeedbackData.briefingOverview?.rubricStatuses || [])];
    const keypointCriteria = Array.from(new Set(formativeFeedbackData.coreKeyPoints.map(kp => kp.associatedCriterion).filter(Boolean)));
    
    // Ensure all criteria from keypoints are present in the list
    keypointCriteria.forEach(crit => {
      const exists = list.some(r => r.criterion.toLowerCase() === crit.toLowerCase());
      if (!exists) {
        const kpSample = formativeFeedbackData.coreKeyPoints.find(kp => kp.associatedCriterion === crit);
        list.push({
          criterion: crit,
          status: 'yellow',
          isOfficialRubric: kpSample ? kpSample.isOfficialRubric : false
        });
      }
    });
    return list;
  })();
  
  // Local Chat Input State
  const [chatInput, setChatInput] = useState('');

  const handleBackToWorkbench = () => {
    setRoute('workbench');
  };

  const handleApplySequence = (recommendedSeq: Array<{ title: string; phase: 'early' | 'mid' | 'late' }>) => {
    const mapping: Array<{ id: string; phase: 'early' | 'mid' | 'late' }> = [];
    const usedTodoIds = new Set<string>();

    const normalizeTitle = (str: string) => {
      return str
        .replace(/^\d+[\.\)]\s+/, '') // Strip leading list numbers
        .replace(/['"`‘’“”]/g, '')     // Strip all types of quotation marks
        .replace(/[^a-zA-Z0-9\s]/g, '') // Strip remaining punctuation
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');        // Collapse whitespace
    };

    const getSignificantWords = (cleanTitle: string) => {
      return cleanTitle.split(' ').filter(w => w.length > 2);
    };

    recommendedSeq.forEach((rec) => {
      const recTitleClean = normalizeTitle(rec.title);
      const recWords = getSignificantWords(recTitleClean);

      // Tier 1: Exact clean title match
      let matchedTodo = todoList.find(t => !usedTodoIds.has(t.id) && normalizeTitle(t.title) === recTitleClean);

      // Tier 2: Substring inclusion match
      if (!matchedTodo) {
        matchedTodo = todoList.find(t => {
          if (usedTodoIds.has(t.id)) return false;
          const tTitle = normalizeTitle(t.title);
          return tTitle.includes(recTitleClean) || recTitleClean.includes(tTitle);
        });
      }

      // Tier 3: Key word overlap match (>= 40% overlap)
      if (!matchedTodo && recWords.length > 0) {
        matchedTodo = todoList.find(t => {
          if (usedTodoIds.has(t.id)) return false;
          const tWords = getSignificantWords(normalizeTitle(t.title));
          if (tWords.length === 0) return false;
          const overlap = recWords.filter(w => tWords.includes(w));
          return (overlap.length / Math.min(recWords.length, tWords.length)) >= 0.4;
        });
      }

      if (matchedTodo) {
        usedTodoIds.add(matchedTodo.id);
        mapping.push({ id: matchedTodo.id, phase: rec.phase });
      }
    });

    applyRecommendedSequence(mapping);
    setLeftTab('todo');
  };

  const handleIgnoreSequence = (msgId: string) => {
    const updatedMessages = chatMessages.map(m => {
      if (m.id === msgId) {
        return { ...m, hasSequence: false, sequence: undefined };
      }
      return m;
    });

    const loadingId = `msg-ai-ignore-seq-loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true
    };

    useAppStore.setState({
      chatMessages: [...updatedMessages, loadingMsg],
      todoAuditStage: 'idle'
    });

    setTimeout(() => {
      const ackMsg: ChatMessage = {
        id: `msg-ai-ignore-seq-${Date.now()}`,
        sender: 'ai',
        text: `Understood. We'll keep your current Todo List sequence unchanged. Feel free to ask whenever you'd like another review!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };
      const current = useAppStore.getState().chatMessages;
      useAppStore.setState({
        chatMessages: current.map(m => m.id === loadingId ? ackMsg : m)
      });
    }, 750);
  };

  // Add Task to checklist manually
  const handleAddTask = () => {
    if (!newTodoText.trim()) return;
    const newTask: SandboxTodoItem = {
      id: `todo-manual-${Date.now()}`,
      title: newTodoText.trim(),
      description: newTodoDesc.trim(),
      isCustom: true,
      orderIndex: todoList.length,
      isCompleted: false
    };
    updateTodoList([...todoList, newTask]);
    setNewTodoText('');
    setNewTodoDesc('');
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updated = todoList.filter(t => t.id !== id);
    updateTodoList(updated);
  };

  // Modify Task Fields
  const handleEditTask = (id: string, value: string, field: 'title' | 'description') => {
    const updated = todoList.map(t => t.id === id ? { ...t, [field]: value } : t);
    updateTodoList(updated);
  };

  // Toggle Task Completion in locked mode
  const handleToggleTaskCompleted = (id: string) => {
    const updated = todoList.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    updateTodoList(updated);
  };

  // Move Mover controls
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...todoList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateTodoList(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === todoList.length - 1) return;
    const updated = [...todoList];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateTodoList(updated);
  };

  const handleProcessInput = async () => {
    if (!rawFeedbackInput.trim()) return;

    if (isEditingCurrentRound && formativeRounds.length > 0) {
      setIsProcessing(true);
      try {
        await updateCurrentFeedbackRound(rawFeedbackInput);
      } catch (err) {
        console.error("Failed to update current feedback round:", err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const existingRoundsCount = formativeRounds.length;
    const prevRoundMaterials = activeProject?.attachedMaterials || [];

    if (existingRoundsCount > 0 && prevRoundMaterials.length > 0) {
      setPendingFeedbackText(rawFeedbackInput);
      setSelectedSyncMaterialIds(prevRoundMaterials.map(m => m.id));
      setShowSyncMaterialsModal(true);
    } else {
      setIsProcessing(true);
      try {
        if (existingRoundsCount > 0) {
          const currentMaterials = activeProject?.attachedMaterials || [];
          if (currentMaterials.length === 0) {
            setIsMaterialReminderOpen(true);
          } else {
            await addNewFeedbackRound(rawFeedbackInput, []);
          }
        } else {
          await triggerFeedbackAnalysis(rawFeedbackInput);
        }
      } catch (err) {
        console.error("Failed to parse and process raw feedback text:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  // Cross-panel Linkage: Set activeAnchorContext status bus on left card item click & switch to transcript view
  const handleReadMoreClick = (id: string) => {
    setActiveRightTab('transcript');
    setActiveAnchorContext({ issueId: id, timestamp: Date.now() });
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  const getScoreBadgeClass = (scoreStr: string): string => {
    const clean = scoreStr.toLowerCase();

    const distinctionPill = 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
    const meritPill = 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold shadow-2xs';
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

    // Check numeric grade value (e.g., "68", "68%", "85")
    const numMatch = /(\d+)/.exec(clean);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num >= 70) {
        return {
          container: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
          pulse: 'bg-blue-400/10'
        };
      }
      if (num >= 60) {
        return {
          container: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
          pulse: 'bg-emerald-400/10'
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
          container: 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]',
          pulse: 'bg-blue-400/10'
        };
      }
    }

    if (clean.includes('merit') || clean.includes('good') || clean.includes('b')) {
      if (!clean.includes('fail') && !clean.includes('poor')) {
        return {
          container: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
          pulse: 'bg-emerald-400/10'
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
    <div className="min-h-screen w-full bg-slate-50 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 select-none overflow-x-hidden">
      
      {/* Top Header Bar */}
      {(() => {
        const tagColorMap: Record<string, string> = {
          'product design': '#00A3C4',
          'research': '#10B981',
          'interactive design': '#8B5CF6',
          'innovation strategy': '#F59E0B'
        };

        const rawTag = (activeProject?.folderTag || '').toLowerCase();
        const folderTagColor = activeProject?.tagColor || tagColorMap[rawTag] || '#00A3C4';
        
        const toTitleCase = (str: string) => str.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

        const headerLine1 = activeProject?.folderTag && activeProject?.folderName
          ? `${toTitleCase(activeProject.folderTag)} • ${activeProject.folderName}`
          : (activeProject?.folderName ? `My Archive • ${activeProject.folderName}` : 'My Archive • Project Workspace');

        return (
          <div className="w-full max-w-[1530px] mx-auto flex items-center justify-between border-b border-slate-200/60 pb-2.5">
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

      {/* Main 1:1 Split Layout */}
      <div className="w-full max-w-[1530px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch flex-1 min-h-[600px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: AI Assistant & Dynamic Tool Workspace Canvas */}
        {/* ======================================================== */}
        <div className={`flex flex-col min-w-0 ${!formativeFeedbackData.originalFeedbackText || isPreparingNewRound ? 'gap-6 justify-center min-h-[500px]' : 'h-[calc(100vh-112px)] min-h-[500px]'}`}>
          
          {!formativeFeedbackData.originalFeedbackText || isPreparingNewRound ? (
            /* Idle complete blank state placeholder */
            <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col items-center justify-center text-center gap-4 h-full min-h-[500px] font-sf-pro">
              <div className="p-4 bg-cyan-50/50 text-cyan-450 rounded-2xl">
                <ClipboardList className="w-8 h-8 text-brand-formative-primary" />
              </div>
              <h3 className="text-base font-sf-pro font-bold text-slate-800">Feedback Analysis Pending</h3>
              <p className="text-xs text-slate-400 font-sf-pro leading-relaxed max-w-xs">
                Please enter or paste your tutor's feedback on the right to start generating analysis insights.
              </p>
            </div>
          ) : (
            /* Active segmented workspace */
            <div className="h-full flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">
              
              {/* Twin Segmented Tabs for Left Workspace (symmetric to Right Panel Tabs) */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 bg-slate-50/50 flex-shrink-0">
                <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setLeftTab('briefing')}
                    title="Feedback Briefing"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeLeftTab === 'briefing'
                        ? 'bg-white text-brand-formative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${activeLeftTab === 'briefing' ? 'text-brand-formative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeLeftTab === 'briefing' ? 'font-extrabold text-brand-formative-primary' : 'font-semibold text-slate-600'}`}>
                      Briefing
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab('todo')}
                    title="Interactive Checklist"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeLeftTab === 'todo'
                        ? 'bg-white text-brand-formative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <ClipboardList className={`w-3.5 h-3.5 flex-shrink-0 ${activeLeftTab === 'todo' ? 'text-brand-formative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeLeftTab === 'todo' ? 'font-extrabold text-brand-formative-primary' : 'font-semibold text-slate-600'}`}>
                      Todo List
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Contents Viewport */}
              <div className="flex-1 p-0 min-h-0 relative select-none">
                {activeLeftTab === 'briefing' && (
                  <OverlayScrollbarBox containerRef={briefingScrollContainerRef} className="h-full" paddingClassName="p-5">
                    <div className="flex flex-col gap-3 min-h-full">
                      {/* Executive Dashboard Overview */}
                    {isAIWorking ? (
                      /* Skeleton Loading Card to prevent layout shift */
                      <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl p-4 shadow-2xs h-[220px] box-border flex flex-col justify-between gap-3.5 flex-shrink-0 animate-pulse select-none">
                        {/* Row 1 skeleton: Grade and Action */}
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-3 bg-slate-200 rounded" />
                            <div className="w-14 h-6 bg-slate-200 rounded-lg" />
                          </div>
                          <div className="w-20 h-4 bg-slate-200 rounded" />
                        </div>
                        {/* Row 2 skeleton: Severity buttons */}
                        <div className="flex gap-2.5 pt-1 border-t border-slate-50">
                          <div className="w-20 h-5 rounded bg-slate-200" />
                          <div className="w-20 h-5 rounded bg-slate-200" />
                          <div className="w-20 h-5 rounded bg-slate-200" />
                        </div>
                        {/* Row 3 skeleton: Rubric group 1 */}
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-50">
                          <div className="w-24 h-2.5 bg-slate-200 rounded" />
                          <div className="flex gap-2">
                            <div className="w-20 h-5 rounded-full bg-slate-200" />
                            <div className="w-24 h-5 rounded-full bg-slate-200" />
                          </div>
                        </div>
                        {/* Row 4 skeleton: Rubric group 2 */}
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-50">
                          <div className="w-24 h-2.5 bg-slate-200 rounded" />
                          <div className="flex gap-2">
                            <div className="w-24 h-5 rounded-full bg-slate-200" />
                            <div className="w-20 h-5 rounded-full bg-slate-200" />
                          </div>
                        </div>
                        {/* Row 5 skeleton: Summary paragraph */}
                        <div className="h-6 bg-slate-100 rounded w-full border-t border-slate-50 pt-2" />
                      </div>
                    ) : (formativeFeedbackData.briefingOverview ? (
                      !isOverviewExpanded ? (
                        /* Collapsed Dashboard Bar */
                        <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl p-2.5 shadow-2xs min-h-11 box-border flex items-center justify-between gap-2.5 flex-shrink-0 hover:bg-white transition-colors duration-200 select-none overflow-hidden w-full max-w-full">
                          {/* Left: Grade badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Grade</span>
                            {(() => {
                              const overview = formativeFeedbackData.briefingOverview;
                              const rawGrade = overview?.overallGrade;
                              const isExplicitGrade = Boolean(rawGrade && rawGrade !== "?" && !overview?.isAutoCalculated);
                              const computedGrade = calculateWeightedGrade(overview?.subScores);
                              const effectiveGrade = rawGrade && rawGrade !== "?" ? rawGrade : (computedGrade || "?");
                              const isAICalculated = Boolean(overview?.isAutoCalculated || (!isExplicitGrade && computedGrade));

                              if (effectiveGrade !== "?") {
                                const style = getOverallGradeStyle(effectiveGrade);
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <div className={`inline-flex items-center justify-center font-heading font-extrabold text-[10px] px-2.5 py-0.5 rounded-full select-none whitespace-nowrap ${style.container}`}>
                                      {effectiveGrade}
                                    </div>
                                    {isAICalculated && (
                                      <span className="text-[9px] font-sf-pro font-medium text-slate-400 select-none whitespace-nowrap">
                                        (Auto-calculated)
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div className="w-5 h-5 rounded-full bg-transparent border border-slate-200 flex items-center justify-center text-[9px] font-heading font-extrabold text-slate-400 select-none">
                                  ?
                                </div>
                              );
                            })()}
                          </div>

                          {/* Middle: Tiny Severity stats (Interactive Filters) */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setRubricFilter(null);
                                setSeverityFilter(severityFilter === 'critical' ? null : 'critical');
                              }}
                              className={`flex items-center gap-1.5 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full cursor-pointer border ${
                                severityFilter === 'critical'
                                  ? 'border-rose-400 bg-[#FAD2CF]/30 text-rose-900 shadow-2xs'
                                  : severityFilter
                                  ? 'border-rose-200/30 bg-[#FBF0EF]/40 text-rose-900/40 opacity-40'
                                  : 'border-rose-200/50 bg-[#FBF0EF] text-rose-900/80'
                              }`}
                              title={severityFilter === 'critical' ? "Clear Warnings filter" : "Filter by Warnings"}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{redCount}</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setRubricFilter(null);
                                setSeverityFilter(severityFilter === 'moderate' ? null : 'moderate');
                              }}
                              className={`flex items-center gap-1.5 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full cursor-pointer border ${
                                severityFilter === 'moderate'
                                  ? 'border-amber-400/80 bg-[#FEF7E0] text-amber-900 shadow-2xs'
                                  : severityFilter
                                  ? 'border-amber-200/30 bg-[#FEF7E0]/40 text-amber-700/40 opacity-40'
                                  : 'border-amber-200/60 bg-[#FEF7E0] text-amber-700'
                              }`}
                              title={severityFilter === 'moderate' ? "Clear Issues filter" : "Filter by Issues"}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>{yellowCount}</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setRubricFilter(null);
                                setSeverityFilter(severityFilter === 'minor' ? null : 'minor');
                              }}
                              className={`flex items-center gap-1.5 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full cursor-pointer border ${
                                severityFilter === 'minor'
                                  ? 'border-emerald-400 bg-[#CEEAD6]/30 text-emerald-900 shadow-2xs'
                                  : severityFilter
                                  ? 'border-emerald-200/30 bg-[#EBF4F0]/40 text-emerald-700/40 opacity-40'
                                  : 'border-emerald-200/60 bg-[#EBF4F0] text-emerald-700'
                              }`}
                              title={severityFilter === 'minor' ? "Clear On Track filter" : "Filter by On Track"}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{greenCount}</span>
                            </button>
                          </div>

                          {/* Right: Actions (Clear Filters + Toggle Expand) */}
                          <div className="flex items-center gap-2">
                            {(severityFilter || rubricFilter) && (
                              <button
                                onClick={() => {
                                  setSeverityFilter(null);
                                  setRubricFilter(null);
                                }}
                                className="group text-[11px] font-sf-pro font-normal text-slate-400 hover:text-slate-650 cursor-pointer whitespace-nowrap bg-transparent p-0 border-0 shadow-none outline-none flex items-center gap-1"
                              >
                                <X className="w-3 h-3 text-slate-400 group-hover:text-slate-650" />
                                <span>Clear filters</span>
                              </button>
                            )}
                            <button
                              onClick={() => setIsOverviewExpanded(true)}
                              className="p-1 text-slate-455 hover:text-slate-700 hover:bg-slate-50 border border-slate-150 rounded-lg cursor-pointer flex items-center justify-center"
                              title="Expand Overview"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Expanded Overview State: Full Dashboard Card */
                        <div
                          className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl p-4 shadow-2xs min-h-[220px] box-border flex flex-col justify-between gap-3.5 flex-shrink-0 select-none overflow-hidden w-full max-w-full"
                        >
                          {/* Row 1: Grade and Actions */}
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-1.5 select-none">
                              <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none whitespace-nowrap">Grade</span>
                              {(() => {
                                const overview = formativeFeedbackData.briefingOverview;
                                const rawGrade = overview?.overallGrade;
                                const isExplicitGrade = Boolean(rawGrade && rawGrade !== "?" && !overview?.isAutoCalculated);
                                const computedGrade = calculateWeightedGrade(overview?.subScores);
                                const effectiveGrade = rawGrade && rawGrade !== "?" ? rawGrade : (computedGrade || "?");
                                const isAICalculated = Boolean(overview?.isAutoCalculated || (!isExplicitGrade && computedGrade));

                                if (effectiveGrade !== "?") {
                                  const style = getOverallGradeStyle(effectiveGrade);
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      <div className={`inline-flex items-center justify-center font-heading font-extrabold text-xs px-2.5 py-0.5 rounded-full relative overflow-hidden whitespace-nowrap ${style.container}`}>
                                        <span className="relative z-10">{effectiveGrade}</span>
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
                            
                            {/* Right Actions */}
                            <div className="flex items-center gap-2">
                              {(severityFilter || rubricFilter) && (
                                <button
                                  onClick={() => {
                                    setSeverityFilter(null);
                                    setRubricFilter(null);
                                  }}
                                  className="group text-[11px] font-sf-pro font-normal text-slate-400 hover:text-slate-650 cursor-pointer whitespace-nowrap bg-transparent p-0 border-0 shadow-none outline-none flex items-center gap-1"
                                >
                                  <X className="w-3 h-3 text-slate-400 group-hover:text-slate-650" />
                                  <span>Clear filters</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => setIsOverviewExpanded(false)}
                                className="p-1 text-slate-455 hover:text-slate-700 hover:bg-slate-50 border border-slate-150 rounded-lg cursor-pointer flex items-center justify-center"
                                title="Collapse Overview"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Sub-Scores Breakdown Module */}
                          <div className="border-t border-slate-100/60 pt-2 flex flex-col gap-1.5 select-text flex-shrink-0">
                            <div className="flex justify-between items-center w-full select-none">
                              <div className="flex items-center gap-1.5 select-none">
                                <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Grade Breakdown</span>
                                {(!formativeFeedbackData.briefingOverview?.subScores || formativeFeedbackData.briefingOverview.subScores.length === 0) && (
                                  <span className="text-[11px] font-sf-pro font-normal text-slate-400 select-none">(not mentioned)</span>
                                )}
                              </div>
                            </div>

                            {formativeFeedbackData.briefingOverview?.subScores && formativeFeedbackData.briefingOverview.subScores.length > 0 ? (
                              <div className="flex flex-col gap-1 bg-slate-50/50 border border-slate-100 rounded-lg p-2 animate-in fade-in duration-300">
                                {formativeFeedbackData.briefingOverview.subScores.map((scoreItem, sIdx) => (
                                  <div key={sIdx} className="flex justify-between items-center gap-3.5 text-[11px] py-1 border-b border-dashed border-slate-100 last:border-b-0">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                      <span className="font-semibold text-slate-700 whitespace-normal break-words leading-relaxed text-left">
                                        {formatDimensionTitle(scoreItem.dimension)}
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

                            {/* Row 2: Metrics Badges (Interactive Buttons) */}
                            <div className="flex flex-wrap items-center justify-start gap-2.5 w-full max-w-full border-t border-slate-100/60 pt-2 flex-shrink-0">
                              <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal mr-1 select-none whitespace-nowrap">Status</span>
                              
                              <button
                                onClick={() => {
                                  setRubricFilter(null);
                                  setSeverityFilter(severityFilter === 'critical' ? null : 'critical');
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold cursor-pointer whitespace-nowrap border ${
                                  severityFilter === 'critical'
                                    ? 'border-rose-400 bg-[#FAD2CF]/30 text-rose-900 shadow-2xs'
                                    : severityFilter
                                    ? 'border-rose-200/30 bg-[#FBF0EF]/40 text-rose-900/40 opacity-40'
                                    : 'border-rose-200/50 bg-[#FBF0EF] text-rose-900/80'
                                }`}
                                title={severityFilter === 'critical' ? "Clear filter" : "Filter by Focus"}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>{redCount} Focus</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRubricFilter(null);
                                  setSeverityFilter(severityFilter === 'moderate' ? null : 'moderate');
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold cursor-pointer whitespace-nowrap border ${
                                  severityFilter === 'moderate'
                                    ? 'border-amber-400 bg-[#FDE293]/30 text-amber-900 shadow-2xs'
                                    : severityFilter
                                    ? 'border-amber-200/30 bg-[#FEF7E0]/40 text-amber-700/40 opacity-40'
                                    : 'border-amber-200/60 bg-[#FEF7E0] text-amber-700'
                                }`}
                                title={severityFilter === 'moderate' ? "Clear filter" : "Filter by Suggestions"}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>{yellowCount} Suggestions</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRubricFilter(null);
                                  setSeverityFilter(severityFilter === 'minor' ? null : 'minor');
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-heading font-bold cursor-pointer whitespace-nowrap border ${
                                  severityFilter === 'minor'
                                    ? 'border-emerald-400 bg-[#CEEAD6]/30 text-emerald-900 shadow-2xs'
                                    : severityFilter
                                    ? 'border-emerald-200/30 bg-[#EBF4F0]/40 text-emerald-700/40 opacity-40'
                                    : 'border-emerald-200/60 bg-[#EBF4F0] text-emerald-700'
                                }`}
                                title={severityFilter === 'minor' ? "Clear filter" : "Filter by On Track"}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{greenCount} On Track</span>
                              </button>
                            </div>

                          {/* Middle Area: Divided Category Pill Groups (Flat wrap, no sliding) */}
                          <div
                            ref={categoryPillsRef}
                            className="flex flex-col gap-4 border-t border-slate-100/60 pt-3.5 flex-shrink-0"
                          >
                            {/* Group 1: Core Criteria */}
                            {renderedRubrics && renderedRubrics.some(r => r.isOfficialRubric) && (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 select-none">
                                  <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Core Criteria</span>
                                  <div className="relative group/info flex items-center">
                                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
                                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/info:block w-64 p-2.5 bg-slate-900 text-white text-[10.5px] font-sf-pro leading-relaxed rounded-xl shadow-xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                      Core Criteria are linked directly to official handbook guidelines. Other Observations are generalized by AI; students should evaluate AI-generated insights critically and cautiously.
                                      <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {renderedRubrics.filter(r => r.isOfficialRubric).map((rub, rIdx) => {
                                    const isActive = rubricFilter?.toLowerCase() === rub.criterion.toLowerCase();
                                    return (
                                      <button
                                        key={`off-${rIdx}`}
                                        onClick={() => {
                                          setSeverityFilter(null);
                                          setRubricFilter(isActive ? null : rub.criterion);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[9.5px] font-sf-pro font-medium cursor-pointer whitespace-nowrap ${
                                          isActive
                                            ? 'bg-[#E0F2F7] text-[#0A6B83] border-[#0A6B83]/45 shadow-2xs'
                                            : rubricFilter
                                            ? 'bg-slate-100/60 border-slate-200/40 text-slate-400 opacity-50'
                                            : 'bg-slate-100/80 border-slate-200/60 text-slate-650 hover:bg-slate-200/70 hover:text-slate-900'
                                        }`}
                                        title={isActive ? `Clear "${rub.criterion}" filter` : `Filter by "${rub.criterion}"`}
                                      >
                                        <span>{rub.criterion}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Group 2: Additional Topics */}
                            {renderedRubrics && renderedRubrics.some(r => !r.isOfficialRubric) && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-sf-pro font-medium text-slate-500 tracking-normal select-none">Additional Topics</span>
                                <div className="flex flex-wrap gap-2">
                                  {renderedRubrics.filter(r => !r.isOfficialRubric).map((rub, rIdx) => {
                                    const isActive = rubricFilter?.toLowerCase() === rub.criterion.toLowerCase();
                                    return (
                                      <button
                                        key={`cust-${rIdx}`}
                                        onClick={() => {
                                          setSeverityFilter(null);
                                          setRubricFilter(isActive ? null : rub.criterion);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[9.5px] font-sf-pro font-medium cursor-pointer whitespace-nowrap ${
                                          isActive
                                            ? 'bg-[#E0F2F7] text-[#0A6B83] border-[#0A6B83]/45 shadow-2xs'
                                            : rubricFilter
                                            ? 'bg-slate-100/60 border-slate-200/40 text-slate-400 opacity-50'
                                            : 'bg-slate-100/80 border-slate-200/60 text-slate-650 hover:bg-slate-200/70 hover:text-slate-900'
                                        }`}
                                        title={isActive ? `Clear "${rub.criterion}" filter` : `Filter by "${rub.criterion}"`}
                                      >
                                        <span>{rub.criterion}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {(!renderedRubrics || renderedRubrics.length === 0) && (
                              <span className="text-[11px] font-sf-pro font-medium text-slate-400 italic tracking-normal whitespace-nowrap select-none">
                                No rubric context extracted
                              </span>
                            )}
                          </div>

                          {/* Bottom Row: globalSummary text container (Flexible Height) */}
                          <div className="border-t border-slate-100 pt-3 select-text flex-shrink-0">
                            <p className="text-[11.5px] text-slate-650 font-sf-pro leading-loose block break-words">
                              {formativeFeedbackData.briefingOverview.globalSummary || "Feedback parsed. Ready for detailed exploration below."}
                            </p>
                          </div>
                        </div>
                      )
                    ) : null)}

                    {/* Lower Section: Batch Action Bar & Key Points List */}
                    {isAIWorking ? (
                      /* Skeleton Loading Shimmer for Lower Briefing List */
                      <div className="flex flex-col gap-3 flex-shrink-0 animate-pulse select-none pt-1">
                        {/* Skeleton Batch Action Bar */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 flex-shrink-0 px-1 pt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md bg-slate-200" />
                            <div className="w-16 h-3.5 bg-slate-200 rounded" />
                          </div>
                          <div className="w-20 h-7 rounded-lg bg-slate-200" />
                        </div>

                        {/* Skeleton Item Cards (3 items) */}
                        <div className="flex flex-col gap-2">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 flex-1">
                                  <div className="w-4 h-4 rounded-md bg-slate-200 flex-shrink-0" />
                                  <div className="h-4 bg-slate-200 rounded flex-1 max-w-[65%]" />
                                </div>
                                <div className="w-16 h-5 rounded-full bg-slate-200 flex-shrink-0" />
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                                <div className="w-32 h-3 bg-slate-150 rounded" />
                                <div className="w-6 h-6 rounded-lg bg-slate-200 flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Batch Action Bar */}
                        <div ref={batchActionBarRef} className="flex items-center justify-between pb-2 border-b border-slate-200/70 flex-shrink-0 transition-all duration-300 px-1 pt-1">
                          <label className="flex items-center gap-2 text-xs font-sf-pro font-semibold text-slate-700 cursor-pointer select-none">
                            {(() => {
                              const isAllSelected = filteredKeyPoints.length > 0 && selectedBriefingIds.length === filteredKeyPoints.length;
                              return (
                                <button
                                  type="button"
                                  onClick={() => toggleSelectAllBriefings(filteredKeyPoints.map(kp => kp.id))}
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 ${
                                    isAllSelected
                                      ? 'bg-brand-formative-primary border-brand-formative-primary text-white shadow-2xs'
                                      : 'border-slate-300 bg-white hover:border-brand-formative-primary'
                                  }`}
                                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                                >
                                  {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              );
                            })()}
                            Select All
                          </label>
                          
                          <button
                            onClick={addSelectedBriefingsToTodo}
                            disabled={!isFlashingAddTodoBtn && selectedBriefingIds.length === 0}
                            className={`py-1 px-3 rounded-lg text-[11px] font-sf-pro font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                              isFlashingAddTodoBtn
                                ? 'bg-brand-formative-primary text-white ring-2 ring-cyan-400/80 scale-105 shadow-md animate-flash-once z-20 cursor-pointer'
                                : (selectedBriefingIds.length > 0
                                    ? 'bg-slate-900 text-white shadow-2xs hover:bg-slate-800 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{selectedBriefingIds.length > 0 ? `TODO (${selectedBriefingIds.length})` : 'TODO'}</span>
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {filteredKeyPoints.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-1 select-none animate-in fade-in duration-200">
                              <Layers className="w-8 h-8 text-slate-350 mb-1" />
                              <p className="text-[10px] font-heading font-bold text-slate-450 uppercase tracking-widest">No matching briefing items</p>
                              <p className="text-[9px] text-slate-400 font-body">Click the active dashboard tag or filter again to clear filter.</p>
                            </div>
                          ) : (
                            filteredKeyPoints.map((kp, kpIdx) => {
                              const isChecked = selectedBriefingIds.includes(kp.id);
                              const isFlashingAnchor = flashingAnchorIndex === kpIdx;
                              return (
                                <div
                                  key={kp.id}
                                  ref={kpIdx === 0 ? firstKeyPointRef : undefined}
                                  className={`p-3 border rounded-xl flex justify-between items-center gap-4 group ${
                                  isChecked
                                      ? 'border-brand-formative-primary/60 bg-cyan-50/10'
                                      : 'border-slate-150 bg-white'
                                  }`}
                                  onClick={() => toggleSelectBriefing(kp.id)}
                                >
                                  <div className="flex items-center justify-between gap-3.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSelectBriefing(kp.id);
                                        }}
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 ${
                                          isChecked
                                            ? 'bg-brand-formative-primary border-brand-formative-primary text-white shadow-2xs'
                                            : 'border-slate-300 bg-white hover:border-brand-formative-primary'
                                        }`}
                                        title={isChecked ? 'Deselect item' : 'Select item'}
                                      >
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>
                                      <span className="text-xs font-sf-pro font-semibold text-slate-800 whitespace-normal leading-relaxed">
                                        {kp.title}
                                      </span>
                                    </div>

                                    {/* Status Badge (Title Case font-bold, no dot circle) */}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-heading font-bold select-none whitespace-nowrap flex-shrink-0 border ${
                                      kp.severity === 'critical'
                                        ? 'bg-rose-50/60 text-rose-900/80 border-rose-200/50'
                                        : kp.severity === 'moderate'
                                        ? 'bg-amber-50 text-amber-700 border-amber-150'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                    }`}>
                                      <span>{kp.severity === 'critical' ? 'Focus' : kp.severity === 'moderate' ? 'Suggestion' : 'On Track'}</span>
                                    </span>
                                  </div>
                                
                                <div 
                                  className="flex items-center space-x-3 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Read More Tooltip Wrapper */}
                                  <div className="relative group/tooltip">
                                    <button
                                      onClick={() => handleReadMoreClick(kp.id)}
                                      className={`p-1.5 border rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                        isFlashingAnchor
                                          ? 'border-cyan-500 bg-cyan-100 text-cyan-700 ring-2 ring-cyan-400/80 scale-105 shadow-md animate-flash-once z-20'
                                          : 'border-slate-200 hover:border-brand-formative-primary/60 hover:text-brand-formative-primary text-slate-500 hover:bg-cyan-50/40 hover:scale-105 active:scale-95'
                                      }`}
                                    >
                                      <ArrowRight className={`w-3.5 h-3.5 ${isFlashingAnchor ? 'text-cyan-700 stroke-[2.5]' : ''}`} />
                                    </button>
                                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[9px] px-2.5 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap z-50">
                                      Read More & Locate Excerpt
                                    </div>
                                  </div>
                                </div>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </OverlayScrollbarBox>
              )}

                {activeLeftTab === 'todo' && (
                  <div className="flex flex-col justify-between h-full gap-2 min-h-0">
                    {/* Scrollable Todo List Items Container */}
                    <OverlayScrollbarBox className="flex-1 min-h-0" paddingClassName="px-5 pt-5 pb-1">
                      <div className="flex flex-col gap-3 min-h-full">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-shrink-0">
                          <h4 className="text-sm font-heading font-bold text-slate-700 flex items-center gap-1">
                            Todo List
                          </h4>
                          
                          {/* Individual Bubble Action Buttons */}
                          <div className="flex items-center gap-3">
                            {/* AI Assistant validation trigger icon with tooltip */}
                            <div className="relative group/tooltip flex items-center">
                              <button
                                onClick={validateTodoWithAI}
                                disabled={todoList.length === 0 || isAIWorking}
                                className={`w-7 h-7 rounded-lg border transition-all duration-150 flex items-center justify-center ${
                                  todoList.length > 0 && !isAIWorking
                                    ? 'bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'
                                    : 'bg-slate-50/50 border-slate-200/40 text-slate-350 cursor-not-allowed opacity-50'
                                }`}
                                title="Check my todo"
                              >
                                <Bot className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap z-50">
                                Check my todo
                              </div>
                            </div>

                            {/* Toggle Edit/Lock status */}
                            <button
                              onClick={() => setTodoMode(todoMode === 'edit' ? 'locked' : 'edit')}
                              disabled={todoList.length === 0}
                              className={`w-7 h-7 rounded-lg border transition-all duration-150 flex items-center justify-center ${
                                todoList.length > 0
                                  ? 'bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'
                                  : 'bg-slate-50/50 border-slate-200/40 text-slate-350 cursor-not-allowed opacity-50'
                              }`}
                              title={todoMode === 'edit' ? 'Lock list' : 'Edit list'}
                            >
                              {todoMode === 'edit' ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Edit className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* List items scrollable container */}
                        <div className="space-y-2 flex-1">
                          {todoList.length === 0 ? (
                            <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <p className="text-xs text-slate-450 font-body italic leading-relaxed">
                                Your Todo List is empty. Click "+ Add Task" below to construct your checklist manually.
                              </p>
                            </div>
                          ) : (
                            todoList.map((todo, idx) => (
                               <div
                                 key={todo.id}
                                 className={`flex items-start justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors duration-200 hover:border-brand-formative-primary/60 relative overflow-hidden ${todo.phase ? 'pl-3.5' : ''}`}
                               >
                                 {todo.phase && (
                                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                     todo.phase === 'early' ? 'bg-indigo-500' :
                                     todo.phase === 'mid' ? 'bg-emerald-500' : 'bg-amber-500'
                                   }`} />
                                 )}
                                {/* Left Side input vs checkbox indicator */}
                                {todoMode === 'edit' && (
                                  <span className="text-[9.5px] font-sf-pro font-medium text-slate-400 w-3.5 flex-shrink-0 mt-0.5 select-none">
                                    {idx + 1}
                                  </span>
                                )}

                                {/* Main contents display & inline edit logic */}
                                <div className="flex-1 mr-2 min-w-0">
                                  {todoMode === 'edit' ? (
                                    <div className="flex flex-col gap-0.5">
                                      {/* Inline Title Edit */}
                                      {editingTaskId === todo.id && editingField === 'title' ? (
                                        <input
                                          type="text"
                                          value={editingVal}
                                          onChange={(e) => setEditingVal(e.target.value)}
                                          onBlur={() => {
                                            if (editingVal.trim()) {
                                              handleEditTask(todo.id, editingVal.trim(), 'title');
                                            }
                                            setEditingTaskId(null);
                                            setEditingField(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              if (editingVal.trim()) {
                                                handleEditTask(todo.id, editingVal.trim(), 'title');
                                              }
                                              setEditingTaskId(null);
                                              setEditingField(null);
                                            }
                                          }}
                                          className="w-full font-body text-[11px] font-bold text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-formative-primary rounded px-1.5 py-0.5"
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          onClick={() => {
                                            setEditingTaskId(todo.id);
                                            setEditingField('title');
                                            setEditingVal(todo.title);
                                          }}
                                          className="font-body text-[11px] font-bold text-slate-800 cursor-pointer border border-transparent hover:border-slate-200/50 hover:bg-slate-50 px-1 rounded block truncate transition-all"
                                          title="Click to edit title"
                                        >
                                          {todo.title}
                                        </span>
                                      )}

                                      {/* Inline Description Edit */}
                                      {editingTaskId === todo.id && editingField === 'description' ? (
                                        <textarea
                                          value={editingVal}
                                          onChange={(e) => setEditingVal(e.target.value)}
                                          onBlur={() => {
                                            handleEditTask(todo.id, editingVal.trim(), 'description');
                                            setEditingTaskId(null);
                                            setEditingField(null);
                                          }}
                                          className="w-full font-body text-[10px] text-slate-500 bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-formative-primary rounded px-1.5 py-0.5 mt-1 resize-none h-12 leading-relaxed"
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          onClick={() => {
                                            setEditingTaskId(todo.id);
                                            setEditingField('description');
                                            setEditingVal(todo.description || '');
                                          }}
                                          className="font-body text-[10px] text-slate-500 cursor-pointer border border-transparent hover:border-slate-200/50 hover:bg-slate-50 px-1 rounded block mt-0.5 leading-relaxed transition-all break-words"
                                          title="Click to edit description"
                                        >
                                          {todo.description ? (
                                            todo.description
                                          ) : (
                                            <span className="text-slate-400 block text-[9px]">
                                              Click to specify execution details
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    /* Locked checklist mode */
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <button
                                             type="button"
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               handleToggleTaskCompleted(todo.id);
                                             }}
                                             className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer select-none flex-shrink-0 ${
                                               todo.isCompleted
                                                 ? 'bg-brand-formative-primary border-brand-formative-primary text-white shadow-2xs'
                                                 : 'border-slate-300 bg-white hover:border-brand-formative-primary'
                                             }`}
                                             title={todo.isCompleted ? 'Mark as pending' : 'Mark as completed'}
                                           >
                                             {todo.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                           </button>
                                          <span className={`text-[11px] font-body font-bold transition-all truncate ${
                                            todo.isCompleted ? 'line-through text-slate-400 italic' : 'text-slate-800'
                                          }`}>
                                            {todo.title}
                                          </span>
                                        </div>
                                        {todo.description && (
                                          <button
                                            onClick={() => {
                                              if (expandedTaskIds.includes(todo.id)) {
                                                setExpandedTaskIds(expandedTaskIds.filter(id => id !== todo.id));
                                              } else {
                                                setExpandedTaskIds([...expandedTaskIds, todo.id]);
                                              }
                                            }}
                                            className="text-[8px] font-heading font-extrabold text-brand-formative-primary hover:underline uppercase flex items-center gap-0.5 ml-2 cursor-pointer flex-shrink-0"
                                          >
                                            {expandedTaskIds.includes(todo.id) ? 'Hide Details' : 'Show Details'}
                                          </button>
                                        )}
                                      </div>

                                      {todo.description && expandedTaskIds.includes(todo.id) && (
                                        <div className="mt-1 pl-5.5 text-[10px] text-slate-500 leading-relaxed font-body border-l border-slate-200 animate-in slide-in-from-top-1 duration-150 break-words">
                                          {todo.description}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right Side actions (Only in Edit mode) */}
                                {todoMode === 'edit' && (
                                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                    <button
                                      onClick={() => handleMoveUp(idx)}
                                      disabled={idx === 0}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-25 transition-colors cursor-pointer"
                                      title="Move Task Up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveDown(idx)}
                                      disabled={idx === todoList.length - 1}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-25 transition-colors cursor-pointer"
                                      title="Move Task Down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(todo.id)}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Delete Task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </OverlayScrollbarBox>

                    {/* Edit mode modifiers bottom dock */}
                    {todoMode === 'edit' && (
                      <div className="flex-shrink-0 px-5 pb-5 pt-1 select-text bg-white">
                        <div className="border-t border-slate-100 pt-2.5 flex flex-col gap-2">
                          {/* Add Task item box */}
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Task Title (e.g., Define safety boundaries)..."
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                className="flex-1 font-body text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-brand-formative-primary focus:ring-1 focus:ring-brand-formative-primary/20 shadow-2xs"
                              />
                              <button
                                onClick={handleAddTask}
                                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-sf-pro font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center flex-shrink-0 hover:scale-[1.01] active:scale-[0.99]"
                              >
                                Add Task
                              </button>
                            </div>
                            <textarea
                              placeholder="Detailed Description (Detailed context, sub-tasks)..."
                              value={newTodoDesc}
                              onChange={(e) => setNewTodoDesc(e.target.value)}
                              className="w-full font-body text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-none focus:border-brand-formative-primary focus:ring-1 focus:ring-brand-formative-primary/20 h-14 resize-none leading-relaxed shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Proposals tab content deleted */}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Multi-mode Shared Capsule view            */}
        {/* ======================================================== */}
        <div className={`flex flex-col min-w-0 ${!formativeFeedbackData.originalFeedbackText ? 'gap-6 justify-center min-h-[500px]' : 'h-[calc(100vh-112px)] min-h-[500px]'}`}>
          {activeRightTab === 'input' ? (
            /* raw input configuration view */
            <div className="h-full flex-1 flex flex-col justify-between p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs relative overflow-hidden font-sf-pro">
              <div className="flex-1 flex flex-col gap-4">
                <div className="border-b border-slate-200/50 pb-3">
                  <h3 className="text-base font-sf-pro font-bold text-slate-900 tracking-normal flex items-center gap-2">
                    <FileInput className="w-5 h-5 text-[#009DC2] flex-shrink-0" />
                    <span>Feedback Input</span>
                  </h3>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                      Tutor Feedback Text
                    </label>
                  </div>

                  <textarea
                    value={rawFeedbackInput}
                    onChange={(e) => {
                      setRawFeedbackInput(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setShowInputValidationError(false);
                      }
                    }}
                    placeholder="Paste your essay comments, dissertation criteria guidelines, or syllabus rubrics here..."
                    className="w-full flex-1 font-sf-pro font-normal text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl p-4 outline-none focus:border-brand-formative-primary focus:ring-1 focus:ring-brand-formative-primary/20 focus:bg-white transition-all tracking-normal leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {showInputValidationError && !rawFeedbackInput.trim() && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-sf-pro font-medium text-amber-600 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                    <span>Please enter feedback text</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {formativeFeedbackData.originalFeedbackText && !isPreparingNewRound && (
                    <button
                      onClick={() => {
                        useAppStore.setState({ isPreparingNewRound: false });
                        setActiveRightTab('transcript');
                      }}
                      className="flex-1 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-sf-pro font-medium text-sm tracking-normal transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!rawFeedbackInput.trim()) {
                        setShowInputValidationError(true);
                        const textareaEl = document.querySelector<HTMLTextAreaElement>('textarea[placeholder^="Paste your essay"]');
                        textareaEl?.focus();
                      } else {
                        setShowInputValidationError(false);
                        handleProcessInput();
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-4 rounded-xl text-sm font-sf-pro font-medium flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-all tracking-normal"
                  >
                    {isProcessing ? (
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
            /* viewer/chat space shared mode view */
            <div className="h-full flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative">
              
              {/* Tabs switch indicators */}
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
                        ? 'bg-white text-brand-formative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'chatbox' ? 'text-brand-formative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'chatbox' ? 'font-extrabold text-brand-formative-primary' : 'font-semibold text-slate-600'}`}>
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
                        ? 'bg-white text-brand-formative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'transcript' ? 'text-brand-formative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'transcript' ? 'font-extrabold text-brand-formative-primary' : 'font-semibold text-slate-600'}`}>
                      Transcript View
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('document')}
                    title="Document View"
                    className={`py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      activeRightTab === 'document'
                        ? 'bg-white text-brand-formative-primary shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 flex-shrink-0 ${activeRightTab === 'document' ? 'text-brand-formative-primary' : 'text-slate-500'}`} />
                    <span className={`text-[11px] font-sf-pro ${activeRightTab === 'document' ? 'font-extrabold text-brand-formative-primary' : 'font-semibold text-slate-600'}`}>
                      Document View
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className={`flex-1 min-h-0 relative select-none ${activeRightTab === 'transcript' || activeRightTab === 'document' ? 'p-0' : 'p-5'}`}>
                <div className={`h-full ${activeRightTab === 'transcript' ? 'block' : 'hidden'}`}>
                  {/* OriginalTextPanel View */}
                  <OriginalTextPanel
                    originalText={formativeFeedbackData.originalFeedbackText}
                    highlightRange={highlightedTextRange}
                    routeTheme="formative"
                  />
                </div>
                <div className={`h-full ${activeRightTab === 'document' ? 'block' : 'hidden'}`}>
                  <DocumentViewer
                    feedbackType="formative"
                  />
                </div>
                <div className={`h-full ${activeRightTab === 'chatbox' ? 'flex flex-col justify-between' : 'hidden'}`}>
                  {/* Message queues list */}
                  <div
                    ref={chatScrollRef}
                    onScroll={(e) => {
                      chatScrollTopRef.current = e.currentTarget.scrollTop;
                    }}
                    className="flex-1 overflow-y-auto space-y-3.5 mb-3 pr-1"
                  >
                      {chatMessages.map((m) => (
                        <div
                          key={m.id}
                          data-message-id={m.id}
                          className={`flex flex-col rounded-xl p-3 shadow-2xs text-xs font-sf-pro leading-relaxed transition-all ${
                            m.hasGuideActions || m.sender === 'ai'
                              ? 'w-full max-w-full bg-slate-50 border border-slate-200/80 text-slate-700 mr-auto'
                              : 'max-w-[85%] w-fit bg-brand-formative-light/10 border border-brand-formative-border/20 text-slate-800 ml-auto'
                          }`}
                        >
                          {m.isLoading ? (
                            <div className="flex items-center gap-1.5 py-1.5 px-1">
                              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          ) : m.isStopped ? (
                            <span className="text-slate-400 text-xs mt-1 italic block leading-relaxed break-words">
                              {m.text}
                            </span>
                          ) : (
                            <div className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed space-y-1.5 break-words">
                              {m.text.replace(/###\s*.*$/gm, '').trim()}
                            </div>
                          )}

                          {/* Render Guide Action Recommendations inside Chat bubble */}
                          {m.hasGuideActions && m.guideActions && (
                            <div className="mt-3 space-y-2 text-left">
                              {m.guideActions.map((act, aIdx) => (
                                <div
                                  key={act.id}
                                  onClick={() => {
                                    if (act.id === 'guide-1') {
                                      setLeftTab('briefing');
                                      scrollToBriefingElement(categoryPillsRef);
                                    } else if (act.id === 'guide-2') {
                                      setLeftTab('briefing');
                                      scrollToBriefingElement(firstKeyPointRef);
                                      setFlashingAnchorIndex(0);
                                      setTimeout(() => setFlashingAnchorIndex(null), 700);
                                    } else if (act.id === 'guide-3') {
                                      setLeftTab('briefing');
                                      scrollToBriefingElement(batchActionBarRef);
                                      setIsFlashingAddTodoBtn(true);
                                      setTimeout(() => setIsFlashingAddTodoBtn(false), 700);
                                    }
                                  }}
                                  className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-brand-formative-primary/60 hover:bg-slate-50/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex items-start gap-2.5"
                                >
                                  <span className="w-5 h-5 rounded-full bg-cyan-100 group-hover:bg-cyan-600 group-hover:text-white text-cyan-700 text-[10px] font-heading font-extrabold flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                                    {aIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between gap-1 text-[11px] font-heading font-bold text-slate-800">
                                      <span className="group-hover:text-cyan-700 transition-colors truncate">{act.title}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                    </div>
                                    <p className="text-[10px] font-body text-slate-500 leading-relaxed">
                                      {act.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Render Suggestions Previews inside Chat bubble */}
                          {m.hasSuggestions && m.suggestions && (
                            <div className="mt-3 space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-left">
                              <p className="text-xs font-heading font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                                Recommended Tasks:
                              </p>
                              {m.suggestions.map((sug, sIdx) => (
                                <div key={sIdx} className="text-xs leading-relaxed font-body">
                                  <strong className="text-slate-800 font-bold block text-xs">{sIdx + 1}. {sug.title}</strong>
                                  <span className="text-slate-600 block text-[11.5px] leading-relaxed pl-3 mt-0.5">{sug.description}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Apply Suggestions Button in Chat message */}
                          {m.hasSuggestions && m.suggestions && (
                            <button
                              onClick={() => applyAISuggestions(m.suggestions!)}
                              className="mt-3 py-2 px-4 bg-brand-formative-primary hover:bg-cyan-600 text-white font-heading font-extrabold text-xs uppercase rounded-xl shadow-sm transition-all duration-300 self-start cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Apply AI Suggestions
                            </button>
                          )}

                          {/* Render Dynamic Omissions inside Chat bubble */}
                          {m.hasOmissions && detectedOmissions.some(o => o.status === 'pending') && (
                            <div className="mt-3.5 space-y-2.5 text-left">
                              <div className="flex flex-col gap-0.5">
                                <p className="text-xs font-sf-pro font-bold text-slate-800">
                                  Recommended Checklist Items:
                                </p>
                                <p className="text-[11px] font-sf-pro text-slate-500 leading-relaxed">
                                  Review the recommended revision items below. Click <span className="font-semibold text-slate-700">"Skip"</span> to dismiss a card, or <span className="font-semibold text-slate-900">"Add"</span> to incorporate it into your Todo List.
                                </p>
                              </div>
                              <div className="space-y-2.5 pt-1">
                                {detectedOmissions
                                  .filter(o => o.status === 'pending')
                                  .map((o) => (
                                    <div
                                      key={o.id}
                                      className="p-3.5 border border-slate-200 bg-white rounded-xl hover:border-brand-formative-primary/60 hover:shadow-2xs transition-all duration-200 flex flex-col gap-2"
                                    >
                                      <div className="flex justify-between items-start gap-2 min-w-0">
                                        <span className="text-[12.5px] font-sf-pro font-bold text-slate-800 break-words leading-snug pr-1">
                                          {o.title}
                                        </span>
                                        <button
                                          onClick={() => handleReadMoreClick(o.id)}
                                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50/60 rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center flex-shrink-0"
                                          title="Locate in raw feedback"
                                        >
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <p className="text-[11.5px] text-slate-600 font-sf-pro leading-relaxed break-words">
                                        {o.description}
                                      </p>
                                      <div className="flex justify-end gap-2 mt-1 border-t border-slate-100 pt-2.5 flex-shrink-0">
                                        <button
                                          onClick={() => toggleOmissionStatus(o.id, 'ignored')}
                                          className="px-3.5 py-1.5 text-[10px] font-sf-pro font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs"
                                        >
                                          Skip
                                        </button>
                                        <button
                                          onClick={() => toggleOmissionStatus(o.id, 'added')}
                                          className="px-3.5 py-1.5 text-[10px] font-sf-pro font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Render Optimized Sequence inside Chat bubble */}
                          {m.hasSequence && m.sequence && (
                            <div className="mt-3.5 space-y-2.5 text-left">
                              <p className="text-xs font-sf-pro font-bold text-slate-800">
                                Recommended Modification Sequence:
                              </p>
                              <div className="space-y-2.5 pt-0.5">
                                {m.sequence.map((step, idx) => {
                                  const isEarly = step.phase === 'early';
                                  const isMid = step.phase === 'mid';
                                  const stageLabel = isEarly ? 'Early' : isMid ? 'Mid' : 'Late';
                                  
                                  const borderLeftColor = isEarly
                                    ? 'border-l-indigo-500 shadow-[inset_3px_0_8px_-3px_rgba(99,102,241,0.18)]'
                                    : isMid
                                    ? 'border-l-emerald-500 shadow-[inset_3px_0_8px_-3px_rgba(16,185,129,0.18)]'
                                    : 'border-l-amber-500 shadow-[inset_3px_0_8px_-3px_rgba(245,158,11,0.18)]';

                                  const badgeClass = isEarly
                                    ? 'text-indigo-600 bg-indigo-50 border border-indigo-150/80'
                                    : isMid
                                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-150/80'
                                    : 'text-amber-600 bg-amber-50 border border-amber-150/80';

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 border border-slate-200 bg-white rounded-xl shadow-2xs border-l-4 ${borderLeftColor} flex flex-col gap-1`}
                                    >
                                      <div className="flex items-center justify-between gap-2 min-w-0">
                                        <strong className="text-slate-800 font-sf-pro font-bold truncate text-xs">
                                          {idx + 1}. {step.title}
                                        </strong>
                                        <span className={`text-[8.5px] font-sf-pro font-semibold px-1.5 py-0.5 rounded-md leading-none select-none flex-shrink-0 ${badgeClass}`}>
                                          {stageLabel}
                                        </span>
                                      </div>
                                      <span className="text-slate-500 block text-[10.5px] font-sf-pro leading-relaxed break-words">
                                        {step.rationale}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex justify-end gap-2 mt-2 pt-1">
                                <button
                                  onClick={() => handleIgnoreSequence(m.id)}
                                  className="px-3.5 py-1.5 text-[10px] font-sf-pro font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs"
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() => handleApplySequence(m.sequence!)}
                                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-sf-pro font-semibold text-[10px] rounded-lg shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Input message triggers */}
                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                      <input
                        type="text"
                        placeholder={isAIWorking ? "AI is working... click stop to cancel" : "Ask AI advisor questions or enter requests..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isAIWorking && handleSendChatMessage()}
                        disabled={isAIWorking}
                        className="flex-1 font-body text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-brand-formative-primary focus:ring-1 focus:ring-brand-formative-primary/20 transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={isAIWorking ? cancelGlobalAIGeneration : handleSendChatMessage}
                        className={`h-[36px] w-[36px] flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-2xs flex-shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
                          isAIWorking
                            ? 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-900'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                        title={isAIWorking ? "Stop current AI task" : "Send message"}
                      >
                        {isAIWorking ? (
                          <Square className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

            </div>
          )}

        </div>

      </div>

      {/* Reminder Modal */}
      {isMaterialReminderOpen && (
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
            
            <p className="text-xs text-slate-500 font-sf-pro font-normal leading-relaxed tracking-normal">
              You haven't uploaded your Course Handbook or Assignment Draft yet. Providing these materials allows the AI to perform a deeply contextualized, rigorous cross-examination against your actual work. Would you like to upload them now?
            </p>
            
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => {
                  setIsMaterialReminderOpen(false);
                  const uploadEl = document.getElementById('sidebar-materials-upload');
                  if (uploadEl) {
                    uploadEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    uploadEl.classList.add('bg-[#E0F2F7]', 'border-[#A8DCE7]', 'text-[#0A6B83]', 'transition-all', 'duration-300');
                    setTimeout(() => {
                      uploadEl.classList.remove('bg-[#E0F2F7]', 'border-[#A8DCE7]', 'text-[#0A6B83]');
                    }, 2500);
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-sf-pro font-medium px-4 rounded-xl flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-xs"
              >
                Upload
              </button>
              
              <button
                onClick={async () => {
                  setIsMaterialReminderOpen(false);
                  setIsProcessing(true);
                  try {
                    const existingRoundsCount = formativeRounds.length;
                    if (existingRoundsCount > 0) {
                      await addNewFeedbackRound(pendingFeedbackText || rawFeedbackInput, []);
                    } else {
                      await triggerFeedbackAnalysis(rawFeedbackInput, true);
                    }
                  } catch (err) {
                    console.error("Failed to parse and process raw feedback text:", err);
                  } finally {
                    setIsProcessing(false);
                    setPendingFeedbackText('');
                    setSelectedSyncMaterialIds([]);
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 text-xs font-sf-pro font-medium px-4 rounded-xl flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Materials Modal */}
      {showSyncMaterialsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-250 select-none">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden flex flex-col gap-4 scale-in duration-250 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-formative-light text-brand-formative-primary rounded-xl border border-brand-formative-border/30">
                <ArrowUpDown className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-heading font-extrabold text-slate-800">
                Carry Over Materials?
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 font-body leading-relaxed">
              Select materials you want to sync to the next round:
            </p>

            {/* Materials Checklist */}
            <div className="flex flex-col gap-2 bg-slate-50 border border-slate-150 rounded-xl p-3 max-h-[140px] overflow-y-auto scrollbar-none">
              <span className="text-[8px] font-heading font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-150 pb-1 select-none">
                Select Materials to Sync:
              </span>
              <div className="space-y-1.5 pt-1">
                {(activeProject?.attachedMaterials || []).map((m) => {
                  const isChecked = selectedSyncMaterialIds.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-[10px] text-slate-655 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedSyncMaterialIds(prev => 
                            isChecked ? prev.filter(id => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                      />
                      <span className="truncate" title={m.name}>{m.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={async () => {
                  setShowSyncMaterialsModal(false);
                  setIsProcessing(true);
                  try {
                    await addNewFeedbackRound(pendingFeedbackText, selectedSyncMaterialIds);
                  } catch (err) {
                    console.error("Failed to parse and process raw feedback text:", err);
                  } finally {
                    setIsProcessing(false);
                    setPendingFeedbackText('');
                    setSelectedSyncMaterialIds([]);
                  }
                }}
                className="bg-brand-formative-primary hover:bg-cyan-600 text-white text-xs font-heading font-bold px-4 rounded-lg flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center shadow-md active:scale-98"
              >
                Confirm
              </button>
              
              <button
                onClick={() => {
                  setShowSyncMaterialsModal(false);
                  setPendingFeedbackText('');
                  setSelectedSyncMaterialIds([]);
                }}
                className="border border-slate-200 text-slate-550 hover:bg-slate-50 text-xs font-heading font-bold px-4 rounded-lg flex-1 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center active:scale-98"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
