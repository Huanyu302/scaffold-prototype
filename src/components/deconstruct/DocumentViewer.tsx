import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore, FileLocationAnchor } from '../../store/useAppStore';
import { FileText, AlertCircle, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DocumentViewerProps {
  feedbackType: 'formative' | 'summative';
  selectedSector?: any | null;
  hoveredSector?: any | null;
}

// Low-saturation soft cyan/indigo highlight box overlay with 300ms transition
const HighlightBoxOverlay: React.FC<{ boundingBox?: FileLocationAnchor['boundingBox'] }> = ({ boundingBox }) => {
  const box = boundingBox || { x: 10, y: 20, width: 80, height: 15 };
  return (
    <div
      className="absolute bg-[#1A73E8]/15 rounded pointer-events-none z-30 transition-all duration-300 animate-in fade-in duration-300"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
    />
  );
};

interface CachedPdf {
  doc: any;
  numPages: number;
  renderedPages: Map<number, HTMLCanvasElement>;
}

const pdfCacheMap = new Map<string, CachedPdf>();

// Dynamic client-side high-DPI PDF page canvas renderer using PDF.js with offscreen double-buffering and canvas bitmap caching
const PdfPageRenderer: React.FC<{ cacheKey: string; pdfDoc: any; pageNum: number; renderedZoom?: number }> = ({ cacheKey, pdfDoc, pageNum, renderedZoom = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCacheKey = `${cacheKey}-z${renderedZoom.toFixed(2)}`;

  // Synchronously check if this page canvas is already rendered & cached in memory
  const cachedPageCanvas = pdfCacheMap.get(zoomCacheKey)?.renderedPages?.get(pageNum);
  const [isRendered, setIsRendered] = useState<boolean>(() => !!cachedPageCanvas);

  // Synchronously draw cached canvas before screen repaint
  useLayoutEffect(() => {
    const cachedCanvas = pdfCacheMap.get(zoomCacheKey)?.renderedPages?.get(pageNum);
    if (cachedCanvas && canvasRef.current) {
      const visibleCanvas = canvasRef.current;
      visibleCanvas.height = cachedCanvas.height;
      visibleCanvas.width = cachedCanvas.width;
      const visibleContext = visibleCanvas.getContext('2d');
      if (visibleContext) {
        visibleContext.drawImage(cachedCanvas, 0, 0);
        setIsRendered(true);
      }
    }
  }, [zoomCacheKey, pageNum]);

  useEffect(() => {
    // If already rendered from cache, skip PDF.js render!
    const existingCache = pdfCacheMap.get(zoomCacheKey)?.renderedPages?.get(pageNum);
    if (existingCache) return;

    let active = true;
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.3 * renderedZoom }); // High-DPI scaled viewport

        // Render offscreen first to avoid visible canvas clearing/flickering
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.height = viewport.height;
        offscreenCanvas.width = viewport.width;
        const offscreenContext = offscreenCanvas.getContext('2d');
        if (!offscreenContext) return;

        const renderContext = {
          canvasContext: offscreenContext,
          viewport: viewport
        };
        await page.render(renderContext).promise;

        if (active) {
          // Store offscreen canvas in cache map
          if (!pdfCacheMap.has(zoomCacheKey)) {
            pdfCacheMap.set(zoomCacheKey, { doc: pdfDoc, numPages: pdfDoc.numPages, renderedPages: new Map() });
          }
          const entry = pdfCacheMap.get(zoomCacheKey);
          if (entry) {
            entry.renderedPages.set(pageNum, offscreenCanvas);
          }

          if (canvasRef.current) {
            const visibleCanvas = canvasRef.current;
            visibleCanvas.height = viewport.height;
            visibleCanvas.width = viewport.width;
            const visibleContext = visibleCanvas.getContext('2d');
            if (visibleContext) {
              visibleContext.drawImage(offscreenCanvas, 0, 0);
              setIsRendered(true);
            }
          }
        }
      } catch (e) {
        console.error('Error rendering page:', e);
      }
    };

    renderPage();
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNum, zoomCacheKey, renderedZoom]);

  return (
    <div className="relative w-full flex justify-center items-center bg-white min-h-[350px]">
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50">
          <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-auto transition-opacity duration-150 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const getFallbackAnchor = (item: any, materials: any[], activeFile: any): FileLocationAnchor => {
  const firstDoc = materials.find(m => m.type !== 'rubrics' && m.type !== 'requirement') || materials[0];
  const fileId = activeFile ? activeFile.id : (firstDoc ? firstDoc.id : 'default-file');

  let pageNumber = 1;

  // 1. Try to search for keywords in active file's rawText (if available)
  if (activeFile && activeFile.rawText) {
    const textToSearch = (item.title + ' ' + (item.sourceExcerpt || '') + ' ' + (item.summary || '')).toLowerCase();

    const keywords = Array.from(new Set(
      textToSearch
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
    ));

    if (keywords.length > 0) {
      const pages = activeFile.rawText.split('\n');
      let maxMatches = 0;
      let bestPage = 1;

      pages.forEach((pageText: string, index: number) => {
        let matches = 0;
        const lowerPageText = pageText.toLowerCase();
        keywords.forEach(word => {
          if (lowerPageText.includes(word)) {
            matches++;
          }
        });

        // Extra weight for exact title match
        if (item.title && lowerPageText.includes(item.title.toLowerCase())) {
          matches += 3;
        }

        if (matches > maxMatches) {
          maxMatches = matches;
          bestPage = index + 1;
        }
      });

      if (maxMatches > 0) {
        pageNumber = bestPage;
      }
    }
  }

  // 2. Fallback to criterion mapping if keyword search yields no results
  if (pageNumber === 1) {
    const criterion = (item.associatedCriterion || '').toLowerCase();
    if (criterion.includes('problem') || criterion.includes('contextual')) pageNumber = 1;
    else if (criterion.includes('aims') || criterion.includes('objectives') || criterion.includes('direction')) pageNumber = 2;
    else if (criterion.includes('planning') || criterion.includes('timeline')) pageNumber = 3;
    else if (criterion.includes('progress')) pageNumber = 4;
    else if (criterion.includes('presentation') || criterion.includes('communication')) pageNumber = 5;
  }

  return {
    fileId,
    pageNumber,
    boundingBox: { x: 10, y: 15 + (pageNumber * 5), width: 80, height: 10 + (pageNumber * 2) }
  };
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  feedbackType,
  selectedSector = null,
  hoveredSector = null
}) => {
  const activeProject = useAppStore(state => state.activeProject);
  const activeRightTab = useAppStore(state => state.activeRightTab);
  const activeAnchorContext = useAppStore(state => state.activeAnchorContext);
  const formativeFeedbackData = useAppStore(state => state.formativeFeedbackData);

  const materialsList = feedbackType === 'summative'
    ? (activeProject?.summativeMaterials || [])
    : (activeProject?.attachedMaterials || []);

  const defaultFileId = (() => {
    const defaultFile = materialsList.find(
      m => m.type !== 'rubrics' && m.type !== 'requirement'
    ) || materialsList[0];
    return defaultFile?.id || '';
  })();

  const [activeFileId, setActiveFileId] = useState<string>(defaultFileId);
  const [loadedPdfState, setLoadedPdfState] = useState<{ cacheKey: string; doc: any; numPages: number } | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  // Hybrid Progressive Zoom State: instant CSS visual scale + debounced crisp PDF.js re-render
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [renderedZoom, setRenderedZoom] = useState<number>(1.0);

  const lastScrolledContextRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms to trigger crisp PDF.js re-render after zoom stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderedZoom(zoomLevel);
    }, 300);
    return () => clearTimeout(timer);
  }, [zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(2.5, parseFloat((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, parseFloat((prev - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setRenderedZoom(1.0);
  };

  // Support Ctrl / Cmd + Wheel zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoomLevel(prev => Math.min(2.5, Math.max(0.5, parseFloat((prev + delta).toFixed(2)))));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [loadedPdfState]);

  // Reset zoom when switching active file
  useEffect(() => {
    setZoomLevel(1.0);
    setRenderedZoom(1.0);
  }, [activeFileId]);

  // Default tab selection fallback
  useEffect(() => {
    if (materialsList.length > 0 && (!activeFileId || !materialsList.some(m => m.id === activeFileId))) {
      const fallbackFile = materialsList.find(
        m => m.type !== 'rubrics' && m.type !== 'requirement'
      ) || materialsList[0];
      if (fallbackFile) {
        setActiveFileId(fallbackFile.id);
      }
    }
  }, [materialsList, activeFileId]);

  const activeFile = materialsList.find(m => m.id === activeFileId) || materialsList[0];
  const activeSector = hoveredSector || selectedSector;

  const cacheKey = activeFile ? `${activeFile.id}-${activeFile.fileUrl || activeFile.name}` : '';
  const cachedPdf = pdfCacheMap.get(cacheKey);

  // Strictly verify loadedPdfState belongs to current cacheKey to prevent stale file rendering & flickering
  const currentPdfDoc = cachedPdf?.doc || (loadedPdfState?.cacheKey === cacheKey ? loadedPdfState.doc : null);
  const currentNumPages = cachedPdf?.numPages || (loadedPdfState?.cacheKey === cacheKey ? loadedPdfState.numPages : 0);

  // Load PDF with PDF.js dynamically inside client side React
  useEffect(() => {
    if (!activeFile?.fileUrl || !activeFile.name.toLowerCase().endsWith('.pdf')) {
      setLoadedPdfState(null);
      setIsPdfLoading(false);
      return;
    }

    if (pdfCacheMap.has(cacheKey)) {
      const cached = pdfCacheMap.get(cacheKey)!;
      setLoadedPdfState({ cacheKey, doc: cached.doc, numPages: cached.numPages });
      setIsPdfLoading(false);
      return;
    }

    let active = true;
    const loadPdf = async () => {
      setIsPdfLoading(true);
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          // Load PDF.js library scripts dynamically from public CDN
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const loadingTask = pdfjs.getDocument(activeFile.fileUrl);
        const doc = await loadingTask.promise;
        if (active) {
          pdfCacheMap.set(cacheKey, { doc, numPages: doc.numPages, renderedPages: new Map() });
          setLoadedPdfState({ cacheKey, doc, numPages: doc.numPages });
        }
      } catch (err) {
        console.error('Error loading PDF with pdf.js:', err);
      } finally {
        if (active) setIsPdfLoading(false);
      }
    };

    loadPdf();
    return () => {
      active = false;
    };
  }, [activeFile, cacheKey]);

  // Background Preloader: Pre-fetch & pre-render page 1 bitmap of all other PDF materials in background for 0ms instant silky switching
  useEffect(() => {
    if (!materialsList || materialsList.length === 0) return;

    let active = true;

    const preloadOtherFiles = async () => {
      const otherPdfMaterials = materialsList.filter(
        m => m.fileUrl && m.name.toLowerCase().endsWith('.pdf')
      );

      if (otherPdfMaterials.length === 0) return;

      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) return; // Wait until pdfjsLib script finishes loading in main effect

        for (const mat of otherPdfMaterials) {
          if (!active) break;
          const key = `${mat.id}-${mat.fileUrl || mat.name}`;
          if (pdfCacheMap.has(key)) continue; // Already preloaded in cache

          try {
            const loadingTask = pdfjsLib.getDocument(mat.fileUrl);
            const doc = await loadingTask.promise;
            if (!active) break;

            const renderedPagesMap = new Map<number, HTMLCanvasElement>();

            // Pre-render Page 1 into offscreen canvas bitmap for 0ms instant display
            try {
              const page1 = await doc.getPage(1);
              const viewport = page1.getViewport({ scale: 1.3 });
              const offscreenCanvas = document.createElement('canvas');
              offscreenCanvas.height = viewport.height;
              offscreenCanvas.width = viewport.width;
              const offscreenContext = offscreenCanvas.getContext('2d');
              if (offscreenContext) {
                await page1.render({ canvasContext: offscreenContext, viewport }).promise;
                renderedPagesMap.set(1, offscreenCanvas);
              }
            } catch (pErr) {
              console.warn('Pre-render page 1 failed for', mat.name, pErr);
            }

            pdfCacheMap.set(key, { doc, numPages: doc.numPages, renderedPages: renderedPagesMap });
          } catch (e) {
            console.error('Background PDF preload failed for:', mat.name, e);
          }
        }
      } catch (err) {
        console.error('Preloader error:', err);
      }
    };

    // Preload after a brief 100ms idle delay so active file rendering takes immediate priority
    const timer = setTimeout(preloadOtherFiles, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [materialsList, loadedPdfState]);

  // Map dim name to container section ID for fallback rendering
  const getSectionIdByDimension = (dimensionName: string): string => {
    if (!dimensionName) return '';
    const name = dimensionName.toLowerCase();
    if (name.includes('problem') || name.includes('contextual')) return 'problem-framing';
    if (name.includes('aims') || name.includes('objectives') || name.includes('direction')) return 'aims-objectives';
    if (name.includes('planning') || name.includes('timeline')) return 'project-planning';
    if (name.includes('progress')) return 'progress-date';
    if (name.includes('presentation') || name.includes('communication')) return 'presentation-communication';
    return '';
  };

  // Determine active section (for Summative layout)
  let activeSectionId = '';
  if (feedbackType === 'summative' && activeSector) {
    activeSectionId = getSectionIdByDimension(activeSector.dimensionName);
  }

  // Smooth scroll helper for active section (Summative)
  useEffect(() => {
    if (feedbackType === 'summative' && activeSectionId) {
      const page = getPageNumberBySection(activeSectionId);
      const element = document.getElementById(`doc-page-${page}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSectionId, feedbackType]);

  const performPositioning = (anchor: FileLocationAnchor, timestamp: number) => {
    // 1. Auto-switch file tabs if target is different
    if (anchor.fileId && anchor.fileId !== activeFileId && materialsList.some(m => m.id === anchor.fileId)) {
      setActiveFileId(anchor.fileId);
    }

    // 2. Perform smooth scroll alignment inside unified container
    setTimeout(() => {
      const element = document.getElementById(`doc-page-${anchor.pageNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      lastScrolledContextRef.current = timestamp;
    }, 150);
  };

  // Foreground click positioning
  useEffect(() => {
    if (feedbackType !== 'formative' || !activeAnchorContext) return;
    const { issueId, timestamp } = activeAnchorContext;
    if (timestamp === lastScrolledContextRef.current) return;

    const kp = formativeFeedbackData?.coreKeyPoints?.find(k => k.id === issueId);
    const omission = useAppStore.getState().detectedOmissions?.find(o => o.id === issueId);

    if (kp || omission) {
      const anchor = kp?.fileLocationAnchor || getFallbackAnchor(kp || omission, materialsList, activeFile);
      if (activeRightTab === 'document') {
        performPositioning(anchor, timestamp);
      }
    }
  }, [activeAnchorContext, activeRightTab, feedbackType, materialsList, formativeFeedbackData, activeFile]);

  // Tab wake-up focus transition
  useEffect(() => {
    if (feedbackType === 'formative' && activeRightTab === 'document' && activeAnchorContext) {
      const { issueId, timestamp } = activeAnchorContext;
      if (timestamp !== lastScrolledContextRef.current) {
        const kp = formativeFeedbackData?.coreKeyPoints?.find(k => k.id === issueId);
        const omission = useAppStore.getState().detectedOmissions?.find(o => o.id === issueId);
        if (kp || omission) {
          const anchor = kp?.fileLocationAnchor || getFallbackAnchor(kp || omission, materialsList, activeFile);
          performPositioning(anchor, timestamp);
        }
      }
    }
  }, [activeRightTab, activeAnchorContext, feedbackType, formativeFeedbackData, materialsList, activeFile]);

  if (materialsList.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-8 text-center gap-4 animate-in fade-in duration-300">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-200/50">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h4 className="text-xs font-heading font-black text-slate-700 uppercase tracking-widest">
          Original Document Unavailable
        </h4>
        <p className="text-xs text-slate-400 font-body leading-relaxed max-w-sm">
          No draft document attached to this workspace. Please upload in Workbench to activate full-context tracking.
        </p>
      </div>
    );
  }

  // Calculate page highlighting for current file (disabled)
  const getHighlightOverlayForPage = (pageNum: number) => {
    return null;
  };

  const getPageNumberBySection = (sectionId: string): number => {
    switch (sectionId) {
      case 'problem-framing': return 1;
      case 'aims-objectives': return 2;
      case 'project-planning': return 3;
      case 'progress-date': return 4;
      case 'presentation-communication': return 5;
      default: return 1;
    }
  };

  const isSummative = feedbackType === 'summative';
  const activeTabColor = isSummative ? 'border-t-brand-summative-primary' : 'border-t-cyan-500';

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden select-text">

      {/* Browser-like Tab Switching Bar */}
      {materialsList.length > 0 && (
        <div className="flex bg-slate-100/60 border-b border-slate-200/85 px-2 pt-1.5 select-none overflow-x-auto no-scrollbar flex-shrink-0">
          {materialsList.map((m) => {
            const isActive = m.id === activeFileId;

            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveFileId(m.id);
                }}
                className={`px-3 py-1.5 text-[9.5px] font-heading font-black rounded-t-lg border-t-2 transition-all duration-200 cursor-pointer max-w-[180px] truncate ${isActive
                    ? `bg-white text-slate-800 ${activeTabColor} shadow-sm border-l border-r border-slate-200/80`
                    : 'bg-slate-200/50 text-slate-400 border-t-transparent hover:bg-slate-200/80 hover:text-slate-600 border-l border-r border-transparent'
                  }`}
              >
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </div>
      )}


      {/* Sleek Floating Zoom Toolbar Controls (Bottom-Right Corner with Soft Slate Background) */}
      {currentPdfDoc && (
        <div className="absolute bottom-4 right-5 z-30 flex items-center gap-1.5 bg-slate-100/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-300/90 shadow-lg shadow-slate-900/10 transition-all duration-200 select-none">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.55}
            className="p-1 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 rounded-md transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom Out (-15%) [Cmd/Ctrl + Scroll]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-800 bg-white border border-slate-250/90 rounded-md shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer min-w-[46px] text-center select-none"
            title="Click to Reset to 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.45}
            className="p-1 text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 rounded-md transition-colors disabled:opacity-30 cursor-pointer"
            title="Zoom In (+15%) [Cmd/Ctrl + Scroll]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-slate-300/90 mx-0.5" />

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 rounded-md transition-colors cursor-pointer"
            title="Reset Zoom / Fit Width"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sleek Top Loading Indicator (non-disruptive, prevents white flicker) */}
      {isPdfLoading && (
        <div className={`h-0.5 bg-gradient-to-r ${isSummative ? 'from-[#1A73E8] via-blue-400 to-[#1A73E8]' : 'from-cyan-500 via-teal-400 to-cyan-500'} animate-pulse w-full flex-shrink-0`} />
      )}

      {/* Pages Container Box (Client-side rendered Canvas pages or Stylized fallbacks) */}
      {currentPdfDoc ? (
        <div
          key={activeFile?.id || 'pdf-container'}
          ref={scrollContainerRef}
          className="flex-1 overflow-auto p-1.5 space-y-3 scroll-smooth bg-slate-100 flex flex-col items-center transition-opacity duration-200 animate-in fade-in duration-200"
        >
          {Array.from({ length: currentNumPages }).map((_, i) => {
            const pageNum = i + 1;
            const visualScale = zoomLevel / renderedZoom;

            return (
              <div
                key={`${activeFile.id}-p-${pageNum}`}
                id={`doc-page-${pageNum}`}
                className="relative bg-white shadow-sm rounded-lg p-0.5 border border-slate-200 transition-transform duration-75"
                style={{
                  width: `${renderedZoom * 100}%`,
                  maxWidth: 'none',
                  transform: visualScale !== 1.0 ? `scale(${visualScale})` : undefined,
                  transformOrigin: 'top center'
                }}
              >
                {getHighlightOverlayForPage(pageNum)}
                <PdfPageRenderer cacheKey={cacheKey} pdfDoc={currentPdfDoc} pageNum={pageNum} renderedZoom={renderedZoom} />
                <div className="absolute bottom-3 right-4 text-[9px] bg-slate-900/60 text-white px-2 py-0.5 rounded font-mono select-none pointer-events-none z-10">
                  Page {pageNum}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          key={activeFile?.id || 'non-pdf-container'}
          ref={scrollContainerRef}
          className="flex-1 flex flex-col justify-center items-center p-8 text-center gap-3 bg-slate-50/70 select-none animate-in fade-in duration-300"
        >
          <div className="p-4 bg-amber-50 text-amber-500 rounded-full border border-amber-200/60 shadow-xs mb-1">
            <FileText className="w-7 h-7 text-amber-500" />
          </div>
          <h4 className="text-xs font-heading font-black text-slate-700 uppercase tracking-wider">
            PDF Preview Only
          </h4>
          <p className="text-xs text-slate-500 font-body leading-relaxed max-w-sm">
            Currently, document preview is only supported for <span className="font-semibold text-slate-700">PDF</span> files. Please upload a PDF file to view the original document layout.
          </p>
        </div>
      )}
    </div>
  );
};
