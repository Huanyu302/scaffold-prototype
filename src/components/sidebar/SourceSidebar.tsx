import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Plus, FileText, Trash2, CheckSquare, Square, Folder, FolderOpen, GitCommit, Database, Lock, ChevronDown, ChevronRight, ChevronLeft, FileCheck, Archive, Loader2, FolderPlus, Filter, Edit3, MoreVertical, FolderInput, Tag, X, AlertCircle } from 'lucide-react';
import { useAppStore, ProjectMaterial } from '../../store/useAppStore';
import { mockArchiveFolders } from '../../data/mockArchiveAssets';

export const SourceSidebar: React.FC = () => {
  const {
    sidebarMode,
    activeProject,
    isLaunched,
    isReadOnly,
    pastProjects,
    versionHistoryTree,
    currentVersionId,
    setSidebarMode,
    setProjectName,
    setFeedbackType,
    addMaterial,
    removeMaterial,
    toggleMaterialSelection,
    launchWorkspace,
    selectProjectFromTree,
    createNewDraftProject,
    backtrackToVersion,
    formativeRounds,
    activeRoundId,
    selectFormativeRound,
    setActiveRightTab,
    setRawFeedbackInput,
    currentRoute,
    setRoute,
    summativeFeedbackData,
    sidebarExpanded,
    setSidebarExpanded,
    archiveProjectToLongTermAsset,
    setFolderName,
    setProjectFolderInfo,
    setSelectedArchiveAssetInfo,
    selectedArchiveAssetInfo,
    userProfile
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handbookInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveClick = async () => {
    if (!summativeFeedbackData || isArchiving) return;
    setIsArchiving(true);
    try {
      await archiveProjectToLongTermAsset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsArchiving(false);
    }
  };
  
  // Dynamic folder tree node definitions
  interface VirtualProjectItem {
    id: string;
    name: string;
    type: 'formative' | 'summative';
    iterationLabel: string;
  }

  interface FolderItem {
    id: string;
    name: string;
    parentId: string | null;
    tagId?: string | null;
    gradeBadge?: {
      label: string;
      score: number;
    };
    virtualProjects?: VirtualProjectItem[];
  }

  interface TagItem {
    id: string;
    name: string;
    color: string;
  }

  const formatTagText = (str: string): string => {
    if (!str) return '';
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [tags, setTags] = useState<TagItem[]>([
    { id: 'tag-pd', name: 'product design', color: '#3b82f6' },
    { id: 'tag-res', name: 'research', color: '#10b981' },
    { id: 'tag-id', name: 'interactive design', color: '#8b5cf6' },
    { id: 'tag-is', name: 'innovation strategy', color: '#f59e0b' }
  ]);

  const tagMap: Record<string, string> = {
    'product design': 'tag-pd',
    'research': 'tag-res',
    'interactive design': 'tag-id',
    'innovation strategy': 'tag-is'
  };

  const shortCourseNames: Record<string, string> = {
    'DE7-CDE': 'Contextual Design Eng.',
    'DE7-DEP': 'Design Eng. Practice',
    'DE7-FTR': 'Foundational Research',
    'DE7-ATR': 'Advanced Research',
    'DE7-SIOT': 'Sensing & IoT',
    'DE6-AXD': 'Audio Experience Design',
    'DE7-IM': 'Innovation Management'
  };

  // Realistic, context-tailored virtual project items per course (color dots indicate Formative vs Summative)
  const courseVirtualProjectsMap: Record<string, Array<{ id: string; name: string; type: 'formative' | 'summative'; iterationLabel: string }>> = {
    'folder-01': [ // DE7-CDE: Contextual Design Eng. (Multi-round Formative + Summative)
      { id: 'vproj-cde-f1', name: 'R1: Empathy & Framing', type: 'formative', iterationLabel: 'Formative R1' },
      { id: 'vproj-cde-f2', name: 'R2: Physical Prototype', type: 'formative', iterationLabel: 'Formative R2' },
      { id: 'vproj-cde-sum', name: 'Final Design Portfolio', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-02': [ // DE7-DEP: Design Eng. Practice (Single Formative + Summative)
      { id: 'vproj-dep-f1', name: 'Concept Ideation Review', type: 'formative', iterationLabel: 'Formative Review' },
      { id: 'vproj-dep-sum', name: 'CAD & Systems Spec', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-03': [ // DE7-FTR: Foundational Research (Multi-round Formative + Summative)
      { id: 'vproj-ftr-f1', name: 'Methodology Proposal', type: 'formative', iterationLabel: 'Formative R1' },
      { id: 'vproj-ftr-f2', name: 'Lit Review Synthesis', type: 'formative', iterationLabel: 'Formative R2' },
      { id: 'vproj-ftr-sum', name: 'Final Research Thesis', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-04': [ // DE7-ATR: Advanced Research (Single Formative + Summative)
      { id: 'vproj-atr-f1', name: 'AI Simulation Model', type: 'formative', iterationLabel: 'Formative Review' },
      { id: 'vproj-atr-sum', name: 'Bayesian Modeling Report', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-05': [ // DE7-SIOT: Sensing & IoT (Multi-round Formative + Summative)
      { id: 'vproj-siot-f1', name: 'R1: Sensor Pipeline', type: 'formative', iterationLabel: 'Formative R1' },
      { id: 'vproj-siot-f2', name: 'R2: Embedded System Test', type: 'formative', iterationLabel: 'Formative R2' },
      { id: 'vproj-siot-sum', name: 'IoT Architecture Spec', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-06': [ // DE6-AXD: Audio Experience Design (Only Summative)
      { id: 'vproj-axd-sum', name: 'Spatial Audio Portfolio', type: 'summative', iterationLabel: 'Summative Final' }
    ],
    'folder-07': [ // DE7-IM: Innovation Management (Only Summative)
      { id: 'vproj-im-sum', name: 'Business Model Audit', type: 'summative', iterationLabel: 'Summative Final' }
    ]
  };

  const [folders, setFolders] = useState<FolderItem[]>(() =>
    mockArchiveFolders.map(af => ({
      id: af.id,
      name: shortCourseNames[af.courseCode] || af.folderTitle,
      parentId: null,
      tagId: tagMap[af.primaryTag] || null,
      gradeBadge: af.gradeBadge,
      virtualProjects: courseVirtualProjectsMap[af.id] || [
        {
          id: `vproj-${af.courseCode}-sum`,
          name: 'Summative Final Assessment',
          type: 'summative',
          iterationLabel: 'Summative Final'
        }
      ]
    }))
  );

  const [showTagPanel, setShowTagPanel] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedArchiveItemId, setSelectedArchiveItemId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#10b981');
  const [showExtendedColors, setShowExtendedColors] = useState(false);
  const [checkedFolderIds, setCheckedFolderIds] = useState<string[]>([]);

  // Project destination placement states
  const [selectedPlacementFolderId, setSelectedPlacementFolderId] = useState<string>('folder-01');
  const [isCreatingFolderInWizard, setIsCreatingFolderInWizard] = useState(false);
  const [showNameValidationError, setShowNameValidationError] = useState(false);
  const [wizardNewFolderName, setWizardNewFolderName] = useState('');
  const wizardFoldersScrollRef = useRef<HTMLDivElement>(null);

  // Sync folders and tags with userFlowMode (Populate default folder for new-onboarded, full suite for existing)
  useEffect(() => {
    if (userProfile.userFlowMode === 'new-onboarded') {
      const defaultFolder: FolderItem = {
        id: 'folder-default',
        name: 'My Folder',
        parentId: null,
        tagId: null,
        virtualProjects: []
      };
      setFolders([defaultFolder]);
      setSelectedPlacementFolderId('folder-default');
      setTags([]);
    } else {
      setFolders(
        mockArchiveFolders.map(af => ({
          id: af.id,
          name: shortCourseNames[af.courseCode] || af.folderTitle,
          parentId: null,
          tagId: tagMap[af.primaryTag] || null,
          gradeBadge: af.gradeBadge,
          virtualProjects: courseVirtualProjectsMap[af.id] || []
        }))
      );
      setTags([
        { id: 'tag-pd', name: 'product design', color: '#3b82f6' },
        { id: 'tag-res', name: 'research', color: '#10b981' },
        { id: 'tag-id', name: 'interactive design', color: '#8b5cf6' },
        { id: 'tag-is', name: 'innovation strategy', color: '#f59e0b' }
      ]);
    }
  }, [userProfile.userFlowMode]);

  // Clear checkboxes selection and close extended colors when active tag or panel toggles
  useEffect(() => {
    setCheckedFolderIds([]);
    setShowExtendedColors(false);
  }, [selectedTagId, showTagPanel]);

  const handleClearSelection = () => {
    setCheckedFolderIds([]);
  };

  const handleApplyOrAddTag = () => {
    if (newTagName.trim()) {
      // 1. Create and add new tag
      const newTagId = `tag-${Date.now()}`;
      const newTag: TagItem = {
        id: newTagId,
        name: newTagName.trim(),
        color: newTagColor
      };
      setTags(prev => [...prev, newTag]);
      
      // 2. Assign this new tag to all folders checked
      setFolders(prev => prev.map(f => {
        if (checkedFolderIds.includes(f.id)) {
          return { ...f, tagId: newTagId };
        }
        return f;
      }));
      
      // 3. Clear inputs, auto-select new tag, clear selection
      setSelectedTagId(newTagId);
      setNewTagName('');
      setCheckedFolderIds([]);
    } else if (selectedTagId) {
      // Apply selectedTagId strictly to checked folders (additive assignment)
      setFolders(prev => prev.map(f => {
        if (checkedFolderIds.includes(f.id)) {
          return { ...f, tagId: selectedTagId };
        }
        return f;
      }));
      // Clear selection
      setCheckedFolderIds([]);
    }
  };

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [collapsedTagGroups, setCollapsedTagGroups] = useState<Record<string, boolean>>({});

  const toggleTagGroup = (tagId: string) => {
    setCollapsedTagGroups(prev => ({ ...prev, [tagId]: !prev[tagId] }));
  };

  const [expandedFolderOrder, setExpandedFolderOrder] = useState<string[]>([]);
  const [projectFolderMap, setProjectFolderMap] = useState<Record<string, string>>({});

  // Synchronize active project's folderName, folderTag, and tagColor reactively with sidebar folders/tags state
  useEffect(() => {
    if (!activeProject) return;
    const targetFolderId = projectFolderMap[activeProject.projectId] || selectedPlacementFolderId || 'folder-01';
    const folder = folders.find(f => f.id === targetFolderId) || folders[0];
    if (folder) {
      const fName = folder.name;
      const tagObj = folder.tagId ? tags.find(t => t.id === folder.tagId) : null;
      const fTag = tagObj ? tagObj.name : undefined;
      const fColor = tagObj ? tagObj.color : undefined;

      if (activeProject.folderName !== fName || activeProject.folderTag !== fTag || activeProject.tagColor !== fColor) {
        setProjectFolderInfo(fName, fTag, fColor);
      }
    }
  }, [selectedPlacementFolderId, folders, tags, projectFolderMap, activeProject?.projectId, activeProject?.folderName, activeProject?.folderTag, activeProject?.tagColor, setProjectFolderInfo]);

  const toggleFolder = (folderId: string) => {
    const isExpanding = !expandedFolders[folderId];
    setExpandedFolders(prev => ({ ...prev, [folderId]: isExpanding }));
    if (isExpanding) {
      setExpandedFolderOrder(prev => [...prev, folderId]);
    } else {
      setExpandedFolderOrder(prev => prev.filter(id => id !== folderId));
    }
  };

  const getFolderDepth = (folderId: string): number => {
    let depth = 0;
    let current = folders.find(f => f.id === folderId);
    while (current && current.parentId) {
      const pid: string = current.parentId;
      depth++;
      current = folders.find(f => f.id === pid);
    }
    return depth;
  };

  const getFolderColor = (depth: number) => {
    const colors = ['#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    return colors[Math.min(depth, colors.length - 1)];
  };

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'folder' | 'project' | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingType, setRenamingType] = useState<'folder' | 'project' | null>(null);
  const [renamingValue, setRenamingValue] = useState<string>('');

  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutsideClick = () => {
      setActiveMenuId(null);
      setActiveMenuType(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeMenuId]);

  const handleMenuToggle = (e: React.MouseEvent, id: string, type: 'folder' | 'project') => {
    e.stopPropagation();
    if (activeMenuId === id && activeMenuType === type) {
      setActiveMenuId(null);
      setActiveMenuType(null);
    } else {
      setActiveMenuId(id);
      setActiveMenuType(type);
    }
  };

  const handleRenameStart = (e: React.MouseEvent, id: string, type: 'folder' | 'project') => {
    e.stopPropagation();
    setActiveMenuId(null);
    setActiveMenuType(null);
    setRenamingId(id);
    setRenamingType(type);
    
    if (type === 'folder') {
      const folder = folders.find(f => f.id === id);
      setRenamingValue(folder ? folder.name : '');
    } else {
      if (activeProject && activeProject.projectId === id) {
        setRenamingValue(projectName);
      } else {
        let foundName = '';
        folders.forEach(f => {
          const vp = f.virtualProjects?.find(v => v.id === id);
          if (vp) foundName = vp.name;
        });
        setRenamingValue(foundName);
      }
    }
  };

  const handleRenameConfirm = (id: string, type: 'folder' | 'project') => {
    const val = renamingValue.trim();
    if (type === 'folder') {
      const newFolderName = val || 'Unnamed Folder';
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newFolderName } : f));
      setFolderName(newFolderName);
    } else {
      const newName = val || 'Unnamed Project';
      if (activeProject && activeProject.projectId === id) {
        setProjectName(newName);
      } else {
        setFolders(prev => prev.map(f => ({
          ...f,
          virtualProjects: f.virtualProjects?.map(vp => vp.id === id ? { ...vp, name: newName } : vp)
        })));
        if (selectedArchiveAssetInfo?.id === id) {
          useAppStore.setState({
            selectedArchiveAssetInfo: { ...selectedArchiveAssetInfo, name: newName }
          });
        }
      }
    }
    setRenamingId(null);
    setRenamingType(null);
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenamingType(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string, type: 'folder' | 'project') => {
    if (e.key === 'Enter') {
      handleRenameConfirm(id, type);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string, type: 'folder' | 'project') => {
    e.stopPropagation();
    setActiveMenuId(null);
    setActiveMenuType(null);

    if (type === 'folder') {
      const getAllChildFolderIds = (fid: string): string[] => {
        let list = [fid];
        const children = folders.filter(f => f.parentId === fid);
        children.forEach(c => {
          list = [...list, ...getAllChildFolderIds(c.id)];
        });
        return list;
      };
      
      const idsToDelete = getAllChildFolderIds(id);
      setFolders(prev => prev.filter(f => !idsToDelete.includes(f.id)));
      
      setExpandedFolders(prev => {
        const copy = { ...prev };
        idsToDelete.forEach(fid => delete copy[fid]);
        return copy;
      });
      setExpandedFolderOrder(prev => prev.filter(fid => !idsToDelete.includes(fid)));
    } else {
      if (activeProject && activeProject.projectId === id) {
        useAppStore.setState({ activeProject: null, isLaunched: false });
      } else {
        setFolders(prev => prev.map(f => ({
          ...f,
          virtualProjects: f.virtualProjects?.filter(vp => vp.id !== id)
        })));
        if (selectedArchiveItemId === id) {
          setSelectedArchiveItemId(null);
          useAppStore.setState({ selectedArchiveAssetInfo: null, currentRoute: 'workbench' });
        }
      }
    }
  };

  const handleCreateFolder = () => {
    const newFolderId = `folder-${Date.now()}`;
    const newFolder: FolderItem = {
      id: newFolderId,
      name: 'Unnamed Folder',
      parentId: null
    };

    setFolders(prev => [...prev, newFolder]);
    setExpandedFolders(prev => ({ ...prev, [newFolderId]: true }));
    setExpandedFolderOrder(prev => [...prev, newFolderId]);

    setRenamingId(newFolderId);
    setRenamingType('folder');
    setRenamingValue('Unnamed Folder');
  };

  const handleCreateNewProjectClick = () => {
    setShowNameValidationError(false);
    setSelectedArchiveItemId(null);
    const newDraftId = `draft-${Date.now()}`;
    useAppStore.setState({
      activeProject: {
        projectId: newDraftId,
        projectName: '',
        feedbackType: 'formative',
        attachedMaterials: [],
        summativeMaterials: []
      },
      selectedArchiveAssetInfo: null,
      formativeFeedbackData: {
        projectId: newDraftId,
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
      currentRoute: 'formative-sandbox',
      todoList: [],
      initialTodoList: [],
      todoMode: 'edit',
      sandboxInteracted: false,
      aiValidationResult: null,
      chatMessages: []
    });

    if (folders.length > 0) {
      setSelectedPlacementFolderId(folders[0].id);
    } else {
      const defaultFid = 'folder-default';
      const defaultFolder: FolderItem = {
        id: defaultFid,
        name: 'My Folder',
        parentId: null,
        tagId: null,
        virtualProjects: []
      };
      setFolders([defaultFolder]);
      setSelectedPlacementFolderId(defaultFid);
    }
    setIsCreatingFolderInWizard(false);
    setWizardNewFolderName('');
  };

  const handleWizardCreateFolderConfirm = () => {
    const cleanName = wizardNewFolderName.trim();
    if (!cleanName) {
      setIsCreatingFolderInWizard(false);
      return;
    }
    const newFid = `folder-${Date.now()}`;
    const newFolderItem: FolderItem = {
      id: newFid,
      name: cleanName,
      parentId: null,
      tagId: null
    };
    setFolders(prev => [...prev, newFolderItem]);
    setSelectedPlacementFolderId(newFid);
    setIsCreatingFolderInWizard(false);
    setWizardNewFolderName('');
    
    // Auto-scroll to bottom of folder wizard list after rendering the new folder item
    setTimeout(() => {
      if (wizardFoldersScrollRef.current) {
        wizardFoldersScrollRef.current.scrollTop = wizardFoldersScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleConfirmWorkspaceLaunch = () => {
    if (!activeProject) return;
    const projId = activeProject.projectId;
    const pName = activeProject.projectName || 'Untitled Project';
    const fType = activeProject.feedbackType || 'formative';
    
    let targetFolderId = selectedPlacementFolderId;
    let targetFolder = folders.find(f => f.id === targetFolderId);

    if (!targetFolder) {
      targetFolderId = selectedPlacementFolderId || `folder-user-${Date.now()}`;
      targetFolder = {
        id: targetFolderId,
        name: activeProject.folderName || 'My Workspace',
        parentId: null,
        tagId: null,
        virtualProjects: []
      };
      setFolders(prev => [...prev, targetFolder!]);
    }

    setFolders(prev => prev.map(f => {
      if (f.id === targetFolderId) {
        const vps = f.virtualProjects || [];
        if (!vps.some(vp => vp.id === projId)) {
          return {
            ...f,
            virtualProjects: [
              ...vps,
              {
                id: projId,
                name: pName,
                type: fType,
                iterationLabel: fType === 'formative' ? 'Formative R1' : 'Summative Final'
              }
            ]
          };
        }
      }
      return f;
    }));

    const newArchivedProject = {
      projectId: projId,
      projectName: pName,
      courseCode: targetFolder?.name || 'USER-PROJ',
      courseName: targetFolder?.name || 'User Created Course',
      semester: '2026 Summer',
      feedbackType: fType,
      attachedMaterials: activeProject.attachedMaterials || [],
      todoList: [],
      versionHistoryTree: {},
      currentVersionId: 'v0-root',
      formativeRounds: [],
      summativeFeedbackData: fType === 'summative' ? {
        projectId: projId,
        grade: 'A',
        originalFeedbackText: '',
        globalSummary: 'Project initiated by student.',
        subScores: [
          { dimension: 'Contextual Problem Framing', weight: '40%', score: '85%' },
          { dimension: 'Evidence-Based Insight Synthesis', weight: '35%', score: '80%' }
        ],
        keyStrengths: [],
        areasForImprovement: []
      } : null
    };

    const existingPast = useAppStore.getState().pastProjects;
    if (!existingPast.some(p => p.projectId === projId)) {
      useAppStore.setState({ pastProjects: [newArchivedProject, ...existingPast] });
    }

    setProjectFolderMap(prev => ({ ...prev, [projId]: targetFolderId }));
    setSelectedArchiveItemId(null);
    setSelectedArchiveAssetInfo(null);
    launchWorkspace();
    setRoute(activeProject.feedbackType === 'summative' ? 'summative-dashboard' : 'formative-sandbox');
  };

  const activeProjectId = activeProject?.projectId || '';
  const projectName = activeProject?.projectName || '';
  const feedbackType = activeProject?.feedbackType || 'formative';
  const materials = activeProject
    ? (feedbackType === 'summative'
        ? (activeProject.summativeMaterials || [])
        : activeProject.attachedMaterials)
    : [];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (e.target.value.trim().length > 0) {
      setShowNameValidationError(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file, idx) => {
      let detectedType: ProjectMaterial['type'] = 'reference';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('rubric') || lowerName.includes('syllabus') || lowerName.includes('criteria') || lowerName.includes('handbook')) {
        detectedType = 'rubrics';
      } else if (lowerName.includes('require') || lowerName.includes('instruction') || lowerName.includes('prompt')) {
        detectedType = 'requirement';
      } else if (lowerName.includes('draft') || lowerName.includes('version') || lowerName.includes('paper') || lowerName.includes('essay') || lowerName.includes('report') || lowerName.includes('thesis')) {
        detectedType = 'current-draft';
      }

      const materialId = `mat-sidebar-${Date.now()}-${idx}`;
      const fileUrl = URL.createObjectURL(file);

      // Asynchronous client-side file text parsing
      if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
        import('../../utils/fileParser').then(({ extractPdfText }) => {
          extractPdfText(file).then((text) => {
            addMaterial({
              id: materialId,
              name: file.name,
              type: detectedType,
              fileSize: file.size,
              selected: true,
              fileUrl: fileUrl,
              rawText: text
            });
          }).catch((err) => {
            console.error("Failed to extract PDF text, falling back:", err);
            addMaterial({
              id: materialId,
              name: file.name,
              type: detectedType,
              fileSize: file.size,
              selected: true,
              fileUrl: fileUrl
            });
          });
        });
      } else if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
        import('../../utils/fileParser').then(({ readTextFile }) => {
          readTextFile(file).then((text) => {
            addMaterial({
              id: materialId,
              name: file.name,
              type: detectedType,
              fileSize: file.size,
              selected: true,
              fileUrl: fileUrl,
              rawText: text
            });
          }).catch((err) => {
            console.error("Failed to read text file:", err);
            addMaterial({
              id: materialId,
              name: file.name,
              type: detectedType,
              fileSize: file.size,
              selected: true,
              fileUrl: fileUrl
            });
          });
        });
      } else {
        // Fallback for docx or other files
        addMaterial({
          id: materialId,
          name: file.name,
          type: detectedType,
          fileSize: file.size,
          selected: true,
          fileUrl: fileUrl
        });
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const themePrimaryColor = feedbackType === 'formative' ? '#00A3C4' : '#4F46E5';
  const isFormative = feedbackType === 'formative';

  const themeGlowClass = isFormative
    ? 'focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 border-slate-200'
    : 'focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 border-slate-200';

  const themeBtnHoverClass = isFormative
    ? 'hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200 border-slate-200 text-slate-700'
    : 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border-slate-200 text-slate-700';

  const pillActiveBg = 'bg-slate-900 text-white shadow-xs font-semibold';
  const canLaunch = projectName.trim().length > 0;

  // ========================================================
  // RENDER METH 1: Global总览态 (library-tree)
  // ========================================================
  const renderFolderNode = (folderId: string): React.ReactNode => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;

    const isExpanded = expandedFolders[folderId];
    
    const targetAssignedFolderId = projectFolderMap[activeProject?.projectId || ''] || selectedPlacementFolderId || 'folder-01';
    const isProjectHere = activeProject && 
      !activeProject.projectId.startsWith('past-proj') && 
      (projectFolderMap[activeProject.projectId] === folderId || (!projectFolderMap[activeProject.projectId] && folderId === targetAssignedFolderId));

    const folderTag = folder.tagId ? tags.find(t => t.id === folder.tagId) : null;
    const depthColor = folderTag ? folderTag.color : '#94a3b8';
    const isMenuOpen = activeMenuId === folderId && activeMenuType === 'folder';
    const isRenaming = renamingId === folderId && renamingType === 'folder';

    return (
      <div key={folderId} className="flex flex-col w-full min-w-0 font-sf-pro">
        {/* Folder Header Row */}
        <div 
          onClick={() => toggleFolder(folderId)}
          className={`group flex items-center justify-between py-1.5 px-2 hover:bg-slate-100/60 rounded-lg cursor-pointer transition-colors w-full min-w-0 relative ${
            isExpanded ? 'text-slate-750' : 'text-slate-650'
          }`}
          title={isRenaming ? undefined : folder.name}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: depthColor }} />
            ) : (
              <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: depthColor }} />
            )}
            
            {isRenaming ? (
              <input
                type="text"
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={() => handleRenameConfirm(folderId, 'folder')}
                onKeyDown={(e) => handleRenameKeyDown(e, folderId, 'folder')}
                className="w-full font-sf-pro font-medium text-[11.5px] bg-slate-50 border border-slate-200 outline-none rounded px-1 py-0.5 text-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-[11.5px] font-sf-pro font-medium truncate flex-1 min-w-0 text-slate-650 group-hover:text-slate-800 transition-colors tracking-normal">
                {formatTagText(folder.name)}
              </span>
            )}
          </div>

          {/* Three dots menu OR Tag Checkbox (at the end) */}
          {showTagPanel ? (
            <div className="relative flex items-center justify-center flex-shrink-0 w-6 h-6 mr-1" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={checkedFolderIds.includes(folderId)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCheckedFolderIds(prev => 
                    checked 
                      ? [...prev, folderId] 
                      : prev.filter(id => id !== folderId)
                  );
                }}
                className="w-3.5 h-3.5 rounded text-cyan-600 border-slate-350 focus:ring-cyan-500/20 flex-shrink-0 cursor-pointer"
              />
            </div>
          ) : (
            !isRenaming && (
              <div className="relative flex items-center justify-center flex-shrink-0 w-6 h-6">
                <button
                  onClick={(e) => handleMenuToggle(e, folderId, 'folder')}
                  className={`p-0.5 rounded hover:bg-slate-100/80 text-slate-400 hover:text-slate-750 transition-all flex items-center justify-center z-10 w-5 h-5 flex-shrink-0 ${
                    isMenuOpen ? 'opacity-100 bg-slate-100/80 text-slate-750' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Options"
                >
                  <MoreVertical className="w-3.5 h-3.5 flex-shrink-0" />
                </button>

                {/* Gemini Menu Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-100 font-sf-pro" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleRenameStart(e, folderId, 'folder')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-sf-pro font-normal text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); alert("Feature coming soon!"); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-400 font-sf-pro font-normal text-xs cursor-not-allowed"
                    >
                      <FolderInput className="w-3.5 h-3.5 text-slate-300" />
                      <span>Move to</span>
                    </button>
                    <div className="border-t border-slate-100 my-0.5" />
                    <button
                      onClick={(e) => handleDeleteItem(e, folderId, 'folder')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 font-sf-pro font-normal text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Children Block */}
        {isExpanded && (
          <div className="pl-[14px] border-l border-slate-300/80 ml-2 mt-0.5 space-y-0.5 min-w-0">
            {/* Active draft project slot if assigned to this folder */}
            {isProjectHere && (() => {
              const isRealSelected = !selectedArchiveItemId && currentRoute !== 'archive-asset-detail';
              const realBubbleStyle = isRealSelected
                ? 'bg-slate-200/80 text-slate-900 font-sf-pro font-medium text-[11px] rounded-lg relative'
                : 'border border-transparent hover:bg-slate-100/80 text-slate-800 font-sf-pro font-medium text-[11px] rounded-lg';

              return (
                <div
                  className={`group flex items-center justify-between py-1 px-2 ${realBubbleStyle} cursor-pointer w-full min-w-0 transition-all relative select-none`}
                  title={renamingId === activeProject.projectId ? undefined : (projectName || 'Unnamed Draft Project')}
                  onClick={() => {
                    setSelectedArchiveItemId(null);
                    setSelectedArchiveAssetInfo(null);
                    setProjectFolderInfo(folder.name, folderTag ? folderTag.name : undefined, depthColor);
                    if (isLaunched) {
                      setSidebarMode('project-active');
                      setRoute(activeProject.feedbackType === 'summative' ? 'summative-dashboard' : 'formative-sandbox');
                    } else {
                      setSidebarMode('project-setup');
                      setRoute(activeProject.feedbackType === 'summative' ? 'summative-dashboard' : 'formative-sandbox');
                    }
                  }}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {renamingId === activeProject.projectId && renamingType === 'project' ? (
                      <input
                        type="text"
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        onBlur={() => handleRenameConfirm(activeProject.projectId, 'project')}
                        onKeyDown={(e) => handleRenameKeyDown(e, activeProject.projectId, 'project')}
                        className="w-full font-sf-pro font-normal text-[11px] bg-slate-50 border border-slate-200 outline-none rounded px-1 py-0.5 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate flex-1 min-w-0 text-[11px] font-sf-pro tracking-normal">{formatTagText(projectName || 'Unnamed Draft Project')}</span>
                    )}
                  </div>

                  {/* Gemini Dropdown on hover for active project */}
                  {renamingId !== activeProject.projectId && (
                    <div className="relative flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <button
                        onClick={(e) => handleMenuToggle(e, activeProject.projectId, 'project')}
                        className={`p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-750 transition-all flex items-center justify-center z-10 w-5 h-5 flex-shrink-0 ${
                          activeMenuId === activeProject.projectId && activeMenuType === 'project'
                            ? 'opacity-100 bg-slate-200 text-slate-750'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>

                      {/* Gemini Menu Dropdown for project */}
                      {activeMenuId === activeProject.projectId && activeMenuType === 'project' && (
                        <div className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[120px] font-sf-pro" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleRenameStart(e, activeProject.projectId, 'project')}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-sf-pro font-normal text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); alert("Feature coming soon!"); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-400 font-sf-pro font-normal text-xs cursor-not-allowed"
                          >
                            <FolderInput className="w-3.5 h-3.5 text-slate-300" />
                            <span>Move to</span>
                          </button>
                          <div className="border-t border-slate-100 my-0.5" />
                          <button
                            onClick={(e) => handleDeleteItem(e, activeProject.projectId, 'project')}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 font-sf-pro font-normal text-xs transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Virtual projects items (Interactive selection bubble container matching real created project layout) */}
            {folder.virtualProjects && folder.virtualProjects
              .filter(vp => !isProjectHere || vp.id !== activeProject?.projectId)
              .map((vp) => {
              const isSelected = selectedArchiveItemId === vp.id;
              const isRenaming = renamingId === vp.id && renamingType === 'project';
              const isMenuOpen = activeMenuId === vp.id && activeMenuType === 'project';

              const bubbleStyle = isSelected
                ? 'bg-slate-200/80 text-slate-900 font-sf-pro font-medium text-[11px] rounded-lg relative'
                : 'border border-transparent hover:bg-slate-100/80 text-slate-800 font-sf-pro font-medium text-[11px] rounded-lg';

              return (
                <div
                  key={vp.id}
                  onClick={() => {
                    if (!isRenaming) {
                      setSelectedArchiveItemId(vp.id);
                      setSelectedArchiveAssetInfo({
                        id: vp.id,
                        name: vp.name,
                        courseName: folder.name,
                        folderTag: folderTag ? folderTag.name : undefined,
                        tagColor: depthColor,
                        type: vp.type
                      });
                      setRoute('archive-asset-detail');
                    }
                  }}
                  className={`group flex items-center justify-between py-1 px-2 ${bubbleStyle} w-full min-w-0 transition-all cursor-pointer select-none relative`}
                  title={isRenaming ? undefined : vp.name}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        onBlur={() => handleRenameConfirm(vp.id, 'project')}
                        onKeyDown={(e) => handleRenameKeyDown(e, vp.id, 'project')}
                        className="w-full font-sf-pro font-normal text-[11px] bg-slate-50 border border-slate-200 outline-none rounded px-1 py-0.5 text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate flex-1 min-w-0 text-[11px] font-sf-pro tracking-normal">{formatTagText(vp.name)}</span>
                    )}
                  </div>

                  {/* Gemini Dropdown on hover for virtual project */}
                  {!isRenaming && (
                    <div className="relative flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <button
                        onClick={(e) => handleMenuToggle(e, vp.id, 'project')}
                        className={`p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-750 transition-all flex items-center justify-center z-10 w-5 h-5 flex-shrink-0 ${
                          isMenuOpen ? 'opacity-100 bg-slate-200 text-slate-750' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5 flex-shrink-0" />
                      </button>

                      {/* Gemini Menu Dropdown for virtual project */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[120px] font-sf-pro" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleRenameStart(e, vp.id, 'project')}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-sf-pro font-normal text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); alert("Feature coming soon!"); }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-400 font-sf-pro font-normal text-xs cursor-not-allowed"
                          >
                            <FolderInput className="w-3.5 h-3.5 text-slate-300" />
                            <span>Move to</span>
                          </button>
                          <div className="border-t border-slate-100 my-0.5" />
                          <button
                            onClick={(e) => handleDeleteItem(e, vp.id, 'project')}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-slate-700 hover:text-slate-900 font-sf-pro font-normal text-xs transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderLibraryTree = () => {
    // Sort rootFolders by tag color grouping, then by timestamp creation order
    const rootFolders = [...folders].filter(f => f.parentId === null).sort((a, b) => {
      const colorA = a.tagId ? (tags.find(t => t.id === a.tagId)?.color || '#047857') : '#047857';
      const colorB = b.tagId ? (tags.find(t => t.id === b.tagId)?.color || '#047857') : '#047857';
      
      if (colorA !== colorB) {
        return colorA.localeCompare(colorB);
      }
      
      const timeA = a.id === 'THE-600' ? 0 : parseInt(a.id.split('-')[1]) || 0;
      const timeB = b.id === 'THE-600' ? 0 : parseInt(b.id.split('-')[1]) || 0;
      return timeA - timeB;
    });

    // Generate folder elements with divider headers when showTagPanel is false
    const renderFolderElements = () => {
      if (folders.length === 0) {
        return (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center my-auto py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <FolderOpen className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-xs sm:text-sm font-heading font-extrabold text-slate-800">No Archive Folders</span>
            <p className="text-[10.5px] font-body text-slate-400 max-w-[170px] leading-relaxed mt-1.5 text-center">
              Created course folders and custom tags will accumulate here as you process feedback.
            </p>
          </div>
        );
      }
      const grouped: Record<string, FolderItem[]> = {};
      const unlabeledFolders: FolderItem[] = [];

      rootFolders.forEach(rf => {
        if (rf.tagId) {
          const tagExists = tags.some(t => t.id === rf.tagId);
          if (tagExists) {
            if (!grouped[rf.tagId]) {
              grouped[rf.tagId] = [];
            }
            grouped[rf.tagId].push(rf);
          } else {
            unlabeledFolders.push(rf);
          }
        } else {
          unlabeledFolders.push(rf);
        }
      });

      const list: React.ReactNode[] = [];
      let groupIndex = 0;
      let previousWasExpanded = false;

      // Render tag groups sorted by name
      const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
      sortedTags.forEach(tag => {
        const groupFolders = grouped[tag.id];
        if (groupFolders && groupFolders.length > 0) {
          const isTagCollapsed = !!collapsedTagGroups[tag.id];
          const isFirstGroup = groupIndex === 0;

          let marginTopClass = 'mt-2';
          if (isFirstGroup) {
            marginTopClass = 'mt-2';
          } else if (previousWasExpanded) {
            marginTopClass = 'mt-3.5';
          }

          list.push(
            <div
              key={`group-header-${tag.id}`}
              onClick={() => toggleTagGroup(tag.id)}
              className={`w-full flex items-center justify-between py-2.5 px-3 bg-slate-100/60 rounded-xl text-slate-900 font-sf-pro font-medium text-xs tracking-normal select-none cursor-pointer ${marginTopClass}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="truncate tracking-normal">{formatTagText(tag.name)}</span>
              </div>
              {isTagCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              )}
            </div>
          );

          groupIndex++;

          if (!isTagCollapsed) {
            const sortedGroupFolders = [...groupFolders].sort((a, b) => {
              const timeA = a.id === 'THE-600' ? 0 : parseInt(a.id.split('-')[1]) || 0;
              const timeB = b.id === 'THE-600' ? 0 : parseInt(b.id.split('-')[1]) || 0;
              return timeA - timeB;
            });

            list.push(
              <div key={`group-children-${tag.id}`} className="pl-3 border-l border-slate-300/80 ml-1.5 space-y-1 mt-1.5 mb-2">
                {sortedGroupFolders.map(rf => renderFolderNode(rf.id))}
              </div>
            );
            previousWasExpanded = true;
          } else {
            previousWasExpanded = false;
          }
        }
      });

      // Render Unlabeled group ONLY if there are unlabeled folders
      if (unlabeledFolders.length > 0) {
        const isTagCollapsed = !!collapsedTagGroups['unlabeled'];
        const isFirstGroup = groupIndex === 0;

        let marginTopClass = 'mt-2';
        if (isFirstGroup) {
          marginTopClass = 'mt-2';
        } else if (previousWasExpanded) {
          marginTopClass = 'mt-3.5';
        }

        list.push(
          <div
            key="group-header-unlabeled"
            onClick={() => toggleTagGroup('unlabeled')}
            className={`w-full flex items-center justify-between py-2.5 px-3 bg-slate-100/60 rounded-xl text-slate-900 font-sf-pro font-medium text-xs tracking-normal select-none cursor-pointer ${marginTopClass}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
              <span className="truncate tracking-normal">Unlabeled</span>
            </div>
            {isTagCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            )}
          </div>
        );

        groupIndex++;

        if (!isTagCollapsed) {
          const sortedUnlabeledFolders = [...unlabeledFolders].sort((a, b) => {
            const timeA = a.id === 'THE-600' ? 0 : parseInt(a.id.split('-')[1]) || 0;
            const timeB = b.id === 'THE-600' ? 0 : parseInt(b.id.split('-')[1]) || 0;
            return timeA - timeB;
          });

          list.push(
            <div key="group-children-unlabeled" className="pl-3 border-l border-slate-300/80 ml-1.5 space-y-1 mt-1.5 mb-2">
              {sortedUnlabeledFolders.map(rf => renderFolderNode(rf.id))}
            </div>
          );
        }
      }

      return list;
    };

    return (
      <div className="flex-1 flex flex-col gap-3 min-h-0 font-sf-pro">
        
        {/* Header Root Directory Node */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/40">
          <span className="text-xl font-sf-pro font-bold text-slate-900 tracking-normal">
            My Archive
          </span>
        </div>

        {/* Toolbar Row */}
        <div className="w-full pr-2">
          <div className="grid grid-cols-4 place-items-center py-1.5 px-2 bg-slate-50/60 border border-slate-200/40 rounded-xl w-full">
            {/* Create Folder */}
            <button
              onClick={handleCreateFolder}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4 flex-shrink-0" />
            </button>

            {/* Manage Tags Label button */}
            <button
              onClick={() => {
                setShowTagPanel(!showTagPanel);
                if (showTagPanel) {
                  setSelectedTagId(null);
                }
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center ${
                showTagPanel
                  ? 'bg-slate-200/80 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tags / Labels Management"
            >
              <Tag className="w-4 h-4 flex-shrink-0" />
            </button>

            {/* Filter */}
            <button
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"
              title="Filter Folders"
            >
              <Filter className="w-4 h-4 flex-shrink-0" />
            </button>

            {/* Edit */}
            <button
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center"
              title="Edit Structure"
            >
              <Edit3 className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Tag Panel Card */}
        {showTagPanel && (
          <div className="w-full pr-2">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150 font-sf-pro">
            {/* Tag Selection / Assignment */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-sf-pro font-normal text-slate-400">
                Select tag to assign:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                    className={`px-2.5 py-1 rounded-full border transition-all text-xs font-sf-pro font-medium cursor-pointer flex items-center gap-1.5 ${
                      selectedTagId === tag.id
                        ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/40 text-slate-600 hover:bg-slate-100/80 hover:border-slate-300/60'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedTagId === tag.id ? '#ffffff' : tag.color }} />
                    <span className="tracking-normal">{formatTagText(tag.name)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Tag */}
            <div className="flex flex-col gap-1.5 border-t border-slate-200/40 pt-2.5">
              <span className="text-[10px] font-sf-pro font-normal text-slate-400">
                Create new label:
              </span>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name (e.g. 2026 Spring)..."
                className="w-full bg-white border border-slate-200 outline-none rounded-lg px-2.5 py-1.5 text-xs font-sf-pro text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20"
              />
              {/* Color selection row */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Preset Colors */}
                  {['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewTagColor(col)}
                      className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-110 cursor-pointer ${
                        newTagColor === col ? 'border-slate-800 scale-110 ring-1 ring-slate-800/20' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  
                  {/* Dashed circle for extended colors */}
                  <button
                    type="button"
                    onClick={() => setShowExtendedColors(!showExtendedColors)}
                    className={`w-3.5 h-3.5 rounded-full border border-dashed flex items-center justify-center hover:scale-110 transition-all cursor-pointer ${
                      showExtendedColors 
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-600 scale-110 ring-1 ring-cyan-500/10' 
                        : 'border-slate-400 hover:border-slate-600 text-slate-500 hover:text-slate-750'
                    }`}
                    title="Open Color Repository"
                  >
                    <Plus className="w-2.5 h-2.5 flex-shrink-0" />
                  </button>
                </div>

                {/* Extended Color Repository Popover Box */}
                {showExtendedColors && (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 mt-1.5 flex flex-col gap-1.5 shadow-sm animate-in slide-in-from-top-1 duration-150">
                    <span className="text-[9px] font-sf-pro font-normal text-slate-400">
                      Extended Color Palette
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 w-full">
                      {['#ec4899', '#14b8a6', '#6366f1', '#64748b', '#d97706', '#d946ef', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7'].map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            setNewTagColor(col);
                          }}
                          className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-110 cursor-pointer justify-self-center ${
                            newTagColor === col ? 'border-slate-800 scale-110 ring-1 ring-slate-800/20' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions row: Clear and Apply/Add buttons grid */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/40">
                <button
                  onClick={handleClearSelection}
                  disabled={checkedFolderIds.length === 0}
                  className={`py-1.5 rounded-lg border font-sf-pro font-normal text-xs flex items-center justify-center gap-1 transition-all ${
                    checkedFolderIds.length === 0
                      ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed opacity-50'
                      : 'bg-white border-slate-250 text-slate-650 hover:text-slate-800 hover:border-slate-350 cursor-pointer shadow-sm'
                  }`}
                  title="Clear Selected Folders"
                >
                  <X className="w-3 h-3 flex-shrink-0" />
                  <span>Clear</span>
                </button>

                <button
                  onClick={handleApplyOrAddTag}
                  className="py-1.5 rounded-lg text-white font-sf-pro font-normal text-xs flex items-center justify-center gap-1 transition-all bg-slate-800 hover:bg-slate-900 shadow-sm cursor-pointer border border-transparent"
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  <span>
                    {newTagName.trim() 
                      ? 'Add Tag' 
                      : (selectedTagId ? 'Apply Tag' : 'Apply')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Dynamic Tree Directory List */}
        <div className="flex-1 overflow-y-auto space-y-2 pl-0 pr-2 py-1 min-h-0 w-full max-w-full overflow-x-hidden flex flex-col">
          {renderFolderElements()}
        </div>

      </div>
    );
  };

  // ========================================================
  // RENDER METH 2: 全新创建态 (project-setup)
  // ========================================================
  const renderProjectSetup = () => {
    const isNameEmpty = !projectName.trim();

    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200 font-sf-pro">
        
        {/* Back navigation */}
        <button
          onClick={() => setSidebarMode('library-tree')}
          className="flex items-center gap-1.5 text-xs font-sf-pro font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start tracking-normal mb-3"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span>Back to Archive</span>
        </button>

        <div className="pb-2.5 border-b border-slate-200/50 mb-4">
          <h3 className="text-xl font-sf-pro font-bold text-slate-900 tracking-normal">
            New Project Setup
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-1 min-h-0 w-full max-w-full overflow-x-hidden">
          {/* Title name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={handleNameChange}
              placeholder="Enter the name"
              className="w-full font-sf-pro font-normal text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300/30 transition-all tracking-normal shadow-2xs"
            />
          </div>

          {/* Project Folder Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                Project Folder
              </label>
              {/* Plus button to add new folder inside setup wizard */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFolderInWizard(true);
                  // Trigger scroll to bottom after layout mounts
                  setTimeout(() => {
                    if (wizardFoldersScrollRef.current) {
                      wizardFoldersScrollRef.current.scrollTop = wizardFoldersScrollRef.current.scrollHeight;
                    }
                  }, 50);
                }}
                className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Create New Folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertical Scrollable Folders List */}
            <div
              ref={wizardFoldersScrollRef}
              className="max-h-[140px] overflow-y-auto space-y-1 pr-1 p-1.5 scrollbar-thin flex flex-col w-full bg-slate-50/60 border border-slate-200/60 rounded-xl"
            >
              {folders.map(f => {
                const folderTag = f.tagId ? tags.find(t => t.id === f.tagId) : null;
                const fColor = folderTag ? folderTag.color : '#94a3b8';
                const isSelected = selectedPlacementFolderId === f.id;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlacementFolderId(f.id);
                      setIsCreatingFolderInWizard(false);
                    }}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-sf-pro font-medium tracking-normal transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                        : 'bg-transparent text-slate-650 hover:text-slate-800 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                      {isSelected ? (
                        <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: fColor }} />
                      ) : (
                        <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: fColor }} />
                      )}
                      <span className="truncate flex-1 tracking-normal">{formatTagText(f.name)}</span>
                    </div>
                  </button>
                );
              })}

              {/* Inline Input Field for New Folder */}
              {isCreatingFolderInWizard && (
                <div className="py-1 px-2 flex items-center gap-1.5 animate-in slide-in-from-bottom-2 duration-150">
                  <Folder className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={wizardNewFolderName}
                    onChange={(e) => setWizardNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleWizardCreateFolderConfirm();
                      else if (e.key === 'Escape') setIsCreatingFolderInWizard(false);
                    }}
                    onBlur={handleWizardCreateFolderConfirm}
                    placeholder="Press Enter to save..."
                    className="w-full bg-transparent outline-none border-b border-slate-300 text-xs font-sf-pro font-medium text-slate-800 focus:border-slate-800 placeholder:text-slate-400 tracking-normal"
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mode toggle pills */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
              Feedback Pathway
            </label>
            <div className="grid grid-cols-2 bg-slate-100/70 p-1 rounded-xl text-xs font-sf-pro font-medium tracking-normal">
              <button
                onClick={() => setFeedbackType('formative')}
                className={`py-1.5 px-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  feedbackType === 'formative' ? 'bg-[#009DC2] text-white font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                Formative
              </button>
              <button
                onClick={() => setFeedbackType('summative')}
                className={`py-1.5 px-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  feedbackType === 'summative' ? 'bg-[#1A73E8] text-white font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                Summative
              </button>
            </div>
          </div>

          {/* Micro add sources */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
              Attach Materials
            </label>

            {/* Attached file list displayed ABOVE the Add Materials button, without bubbles */}
            {materials.length > 0 && (
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 flex flex-col gap-0.5">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center py-1 px-1 text-xs font-sf-pro font-medium text-slate-700 hover:text-slate-900 group transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate flex-1 tracking-normal text-slate-700">{m.name}</span>
                    </div>
                    <button
                      onClick={() => removeMaterial(m.id)}
                      className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors p-0.5 cursor-pointer ml-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-sf-pro font-medium text-xs tracking-normal transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Add Materials</span>
            </button>
          </div>
        </div>

        {/* Launch active button container (exact match to My Archive Create New Project position & height) */}
        <div className="mt-auto pt-3 pb-2 pr-2">
          {showNameValidationError && isNameEmpty && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-sf-pro font-medium text-amber-600 mb-2 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
              <span>Please add a project name</span>
            </div>
          )}
          <button
            onClick={() => {
              if (isNameEmpty) {
                setShowNameValidationError(true);
                const inputEl = document.querySelector<HTMLInputElement>('input[placeholder="Enter the name"]');
                inputEl?.focus();
              } else {
                setShowNameValidationError(false);
                handleConfirmWorkspaceLaunch();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-sf-pro font-semibold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-xs cursor-pointer transition-all animate-in fade-in duration-200"
            title="Confirm"
          >
            <span>Confirm</span>
          </button>
        </div>

      </div>
    );
  };

  // ========================================================
  // RENDER METH 3: 项目激活态 (project-active)
  // ========================================================
  const renderProjectActive = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200 font-sf-pro">
        
        {/* Back navigation */}
        <button
          onClick={() => setSidebarMode('library-tree')}
          className="flex items-center gap-1.5 text-xs font-sf-pro font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start tracking-normal mb-3"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span>Back to Archive</span>
        </button>

        {/* Active Title */}
        <div className="pb-2.5 border-b border-slate-200/50 mb-4 flex items-center justify-between gap-2">
          <h3 className="text-xl font-sf-pro font-bold text-slate-900 tracking-normal line-clamp-2" title={projectName}>
            {projectName}
          </h3>
          {isReadOnly && (
            <span className="text-[10px] font-sf-pro font-medium bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
              <Lock className="w-3 h-3" />
              <span>Read-Only</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-1 min-h-0 w-full max-w-full overflow-x-hidden">
          
          {/* Dynamic Pathway tab toggles */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
              Feedback Pathway
            </label>
            <div className="grid grid-cols-2 bg-slate-100/70 p-1 rounded-xl text-xs font-sf-pro font-medium tracking-normal">
              <button
                onClick={() => setFeedbackType('formative')}
                className={`py-1.5 px-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  feedbackType === 'formative' ? 'bg-[#009DC2] text-white font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                Formative
              </button>
              <button
                onClick={() => setFeedbackType('summative')}
                className={`py-1.5 px-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  feedbackType === 'summative' ? 'bg-[#1A73E8] text-white font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                Summative
              </button>
            </div>
          </div>

          {/* Continuous sources checklist + Micro uploader */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                Attach Materials
              </label>
            </div>

            {/* Attached file list displayed ABOVE the Add Materials button, without bubbles */}
            {materials.length > 0 && (
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 flex flex-col gap-0.5">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center py-1 px-1 text-xs font-sf-pro font-medium text-slate-700 hover:text-slate-900 group transition-colors cursor-pointer"
                    onClick={() => !isReadOnly && toggleMaterialSelection(m.id)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {m.selected !== false ? (
                        <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-700" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1 tracking-normal text-slate-700">{m.name}</span>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMaterial(m.id);
                        }}
                        className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors p-0.5 cursor-pointer ml-1"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Continuous Asset Uploader */}
            {!isReadOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <button
                  id="sidebar-materials-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-sf-pro font-medium text-xs tracking-normal transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Add Materials</span>
                </button>
              </>
            )}
          </div>

          {/* Feedback Rounds (Visible in both Formative and Summative modes) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sf-pro font-medium text-slate-500 tracking-normal">
                Feedback Rounds
              </label>
              {currentRoute === 'formative-sandbox' && !isReadOnly && (
                <button
                  onClick={() => {
                    setRawFeedbackInput('');
                    setActiveRightTab('input');
                  }}
                  className="p-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-all cursor-pointer flex items-center justify-center"
                  title="Add New Feedback Round"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Vertical timeline stepper track */}
            <div className="relative pl-5 space-y-2 py-1 max-h-[190px] overflow-y-auto pr-1">
              {/* Internal vertical progress line (avoids scrollbar boundary clipping) */}
              <div className="absolute left-[9px] top-0 bottom-0 w-[1px] bg-slate-200 z-0" />

              {formativeRounds.map((round) => {
                const isActive = activeRoundId === round.id && currentRoute === 'formative-sandbox';
                return (
                  <div key={round.id} className="relative flex items-center group">
                    {/* Stepper progress checkpoint dot (vertically centered) */}
                    <div 
                      className={`absolute -left-[15px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all z-10 ${
                        isActive 
                          ? 'border-brand-formative-primary bg-brand-formative-primary scale-110 shadow-2xs' 
                          : 'border-slate-300 bg-white scale-90 group-hover:border-brand-formative-primary/60'
                      }`}
                    />
                    <button
                      onClick={() => {
                        setRoute('formative-sandbox');
                        selectFormativeRound(round.id);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-sf-pro font-medium flex items-center transition-colors truncate cursor-pointer tracking-normal ${
                        isActive
                          ? 'bg-slate-200/80 text-slate-900 font-semibold'
                          : 'text-slate-650 hover:bg-slate-100/60 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">
                        {round.name
                          .replace(/^Round 1\b/i, 'Formative')
                          .replace(/\bFormative Assessment\b/gi, 'Formative')
                          .replace(/\bSummative Assessment\b/gi, 'Summative')
                          .replace(/\bAssessment\b/gi, '')
                          .trim()}
                      </span>
                    </button>
                  </div>
                );
              })}

              {/* Special final summative assessment node */}
              {summativeFeedbackData && (
                <div className="relative flex items-center group">
                  {/* Stepper progress checkpoint dot matching theme color (vertically centered) */}
                  <div 
                    className={`absolute -left-[15px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition-all z-10 ${
                      currentRoute === 'summative-dashboard' 
                        ? 'border-brand-summative-primary bg-brand-summative-primary scale-110 shadow-2xs' 
                        : 'border-slate-300 bg-white scale-90 group-hover:border-brand-summative-primary/60'
                    }`}
                  />
                  <button
                    onClick={() => {
                      setRoute('summative-dashboard');
                      useAppStore.setState({ activeRoundId: 'round-summative-final' });
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-sf-pro font-medium flex items-center transition-colors truncate cursor-pointer tracking-normal ${
                      currentRoute === 'summative-dashboard'
                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                        : 'text-slate-650 hover:bg-slate-100/60 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">Summative</span>
                  </button>
                </div>
              )}

              {formativeRounds.length === 0 && !summativeFeedbackData && (
                <span className="text-xs font-sf-pro font-medium text-slate-400 select-none italic absolute left-[20px] tracking-normal">
                  No feedback rounds parsed yet.
                </span>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  };

  // Render sidebar contents based on active mode
  const renderSidebarContent = () => {
    switch (sidebarMode) {
      case 'library-tree':
        return renderLibraryTree();
      case 'project-setup':
        return renderProjectSetup();
      case 'project-active':
        return renderProjectActive();
      default:
        return renderLibraryTree();
    }
  };

  return (
    <div className={`h-screen flex flex-col relative transition-all duration-350 flex-shrink-0 z-20 ${sidebarExpanded ? 'w-64' : 'w-0'}`}>
      
      {/* Scrollable Explorer Drawer */}
      <div 
        className={`w-64 h-full overflow-x-hidden border-r border-slate-250/60 bg-white/70 backdrop-blur-md shadow-lg glass-panel flex flex-col gap-5 pt-7 px-4 pb-6 select-none transition-all duration-350 ${
          sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 !p-0 !border-r-0'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Dynamic Content */}
        {renderSidebarContent()}



        {sidebarMode === 'library-tree' && (
          <div className="mt-auto pt-3 pb-2 pr-2">
            <button
              onClick={handleCreateNewProjectClick}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-sf-pro font-semibold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-xs cursor-pointer transition-all animate-in fade-in duration-200"
              title="Create New Project"
            >
              <Plus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Create New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Protruding Sidebar Toggle Tab Handle (Blended with the sidebar shape) */}
      <button
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className="absolute -right-[16px] top-1/2 -translate-y-1/2 w-[16px] h-16 bg-white/70 backdrop-blur-md border-y border-r border-slate-250/60 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.05)] rounded-r-xl flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer z-50 transition-all hover:bg-slate-50/50"
        title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {sidebarExpanded ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

    </div>
  );
};
