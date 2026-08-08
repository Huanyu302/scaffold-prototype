import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Edit } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

interface OriginalTextPanelProps {
  originalText: string;
  highlightRange: { start: number; end: number } | any | null;
  routeTheme: 'formative' | 'summative';
  onEditClick?: () => void;
}

interface ParagraphRowProps {
  text: string;
  pStart: number;
  pEnd: number;
  highlightRange: { start: number; end: number } | any | null;
  routeTheme: 'formative' | 'summative';
  activeSpanRef: React.RefObject<HTMLSpanElement>;
}

export const ParagraphRow: React.FC<ParagraphRowProps> = React.memo(({
  text,
  pStart,
  pEnd,
  highlightRange,
  routeTheme,
  activeSpanRef
}) => {
  // Check if this paragraph contains the active highlighted slice
  const hasHighlight = useMemo(() => {
    if (!highlightRange || !('start' in highlightRange)) return false;
    const { start, end } = highlightRange;
    return Math.max(pStart, start) < Math.min(pEnd, end);
  }, [highlightRange, pStart, pEnd]);

  // Perform character-level interval segmentation only when highlighted
  const renderedContent = useMemo(() => {
    if (!hasHighlight) {
      return <span>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    const marks = new Set<number>();
    marks.add(pStart);
    marks.add(pEnd);

    if (highlightRange && 'start' in highlightRange) {
      const hStart = Math.max(pStart, highlightRange.start);
      const hEnd = Math.min(pEnd, highlightRange.end);
      if (hStart < hEnd) {
        marks.add(hStart);
        marks.add(hEnd);
      }
    }

    const sortedMarks = Array.from(marks).sort((a, b) => a - b);
    
    // Slice and render distinct spans for the sweep interval
    for (let i = 0; i < sortedMarks.length - 1; i++) {
      const start = sortedMarks[i];
      const end = sortedMarks[i + 1];
      
      const isHighlighted = highlightRange && 'start' in highlightRange && start >= highlightRange.start && end <= highlightRange.end;
      const subText = text.substring(start - pStart, end - pStart);
      const key = `${start}-${end}-${i}`;

      let className = '';
      let ref: React.RefObject<HTMLSpanElement> | undefined = undefined;

      if (isHighlighted) {
        ref = activeSpanRef;
        className += routeTheme === 'formative'
          ? 'highlight-anchor highlight-anchor-formative-active font-semibold text-slate-900 '
          : 'highlight-anchor highlight-anchor-summative-active font-semibold text-slate-900 ';
      }

      elements.push(
        <span key={key} ref={ref} className={className.trim() || undefined}>
          {subText}
        </span>
      );
    }

    return elements;
  }, [text, pStart, pEnd, hasHighlight, highlightRange, routeTheme, activeSpanRef]);

  return (
    <div className="mb-4 text-justify font-body text-sm text-slate-650 leading-relaxed transition-opacity duration-300 px-1.5">
      {renderedContent}
    </div>
  );
});

export const OriginalTextPanel: React.FC<OriginalTextPanelProps> = ({
  originalText,
  highlightRange,
  routeTheme,
  onEditClick
}) => {
  const activeSpanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeRightTab = useAppStore(state => state.activeRightTab);
  const setActiveRightTab = useAppStore(state => state.setActiveRightTab);
  const setRawFeedbackInput = useAppStore(state => state.setRawFeedbackInput);
  const activeAnchorContext = useAppStore(state => state.activeAnchorContext);
  const formativeFeedbackData = useAppStore(state => state.formativeFeedbackData);

  const [resolvedHighlightRange, setResolvedHighlightRange] = useState<{ start: number; end: number } | null>(null);
  const lastScrolledRef = useRef<number>(0);

  const normalizedText = useMemo(() => {
    return (originalText || '').replace(/\r\n/g, '\n');
  }, [originalText]);

  // Divide long text into structured paragraph indexes
  const paragraphs = useMemo(() => {
    const rawParagraphs = normalizedText.split('\n');
    let cumulativeLength = 0;
    
    return rawParagraphs.map((text, index) => {
      const pStart = cumulativeLength;
      const pEnd = cumulativeLength + text.length;
      cumulativeLength = pEnd + 1; // compensation for newline
      return {
        id: `p-${index}`,
        text,
        pStart,
        pEnd
      };
    });
  }, [normalizedText]);

  // Sync and anchor mapping for Formative mode
  useEffect(() => {
    if (routeTheme !== 'formative') return;

    if (!activeAnchorContext) {
      setResolvedHighlightRange(null);
      return;
    }

    const { issueId, timestamp } = activeAnchorContext;
    
    // Search in keypoints
    const kp = formativeFeedbackData?.coreKeyPoints?.find(k => k.id === issueId);
    // Search in omissions
    const omission = useAppStore.getState().detectedOmissions?.find(o => o.id === issueId);

    let start = -1;
    let end = -1;

    if (kp) {
      if (kp.startOffset !== -1 && kp.startOffset !== undefined) {
        start = kp.startOffset;
        end = kp.endOffset;
      } else if (kp.sourceExcerpt) {
        const cleanExcerpt = kp.sourceExcerpt.trim().split(' ').slice(0, 4).join(' ');
        const index = normalizedText.toLowerCase().indexOf(cleanExcerpt.toLowerCase());
        if (index !== -1) {
          start = index;
          end = index + kp.sourceExcerpt.length;
        } else {
          const index2 = normalizedText.toLowerCase().indexOf(kp.sourceExcerpt.toLowerCase());
          if (index2 !== -1) {
            start = index2;
            end = index2 + kp.sourceExcerpt.length;
          }
        }
      }
    } else if (omission) {
      const cleanExcerpt = omission.sourceExcerpt.trim().split(' ').slice(0, 3).join(' ');
      const index = normalizedText.toLowerCase().indexOf(cleanExcerpt.toLowerCase());
      if (index !== -1) {
        start = index;
        end = index + omission.sourceExcerpt.length;
      }
    }

    if (start !== -1 && end !== -1) {
      setResolvedHighlightRange({ start, end });

      // Positioning Guard: Only trigger scrolling if currently focused in activeRightTab
      if (activeRightTab === 'transcript') {
        if (lastScrolledRef.current !== timestamp) {
          lastScrolledRef.current = timestamp;
          setTimeout(() => {
            if (activeSpanRef.current) {
              activeSpanRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 50);
        }
      }
    }
  }, [activeAnchorContext, formativeFeedbackData, routeTheme, normalizedText, activeRightTab]);

  // Wake-up activation focus transition
  useEffect(() => {
    if (routeTheme === 'formative' && activeRightTab === 'transcript' && activeAnchorContext) {
      const { timestamp } = activeAnchorContext;
      if (lastScrolledRef.current !== timestamp) {
        lastScrolledRef.current = timestamp;
        setTimeout(() => {
          if (activeSpanRef.current) {
            activeSpanRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 50);
      }
    }
  }, [activeRightTab, activeAnchorContext, routeTheme]);

  // Sync and anchor mapping for Summative mode (automatic scroll and exactPhrase boundary alignment)
  const resolvedSummativeRange = useMemo(() => {
    if (routeTheme !== 'summative' || !highlightRange) return null;
    
    // Check if the current highlightRange has exactPhrase
    if ('exactPhrase' in highlightRange && highlightRange.exactPhrase) {
      const phrase = (highlightRange.exactPhrase || '').trim();
      if (phrase) {
        // 1. Exact match
        let index = normalizedText.indexOf(phrase);
        if (index !== -1) {
          return { start: index, end: index + phrase.length };
        }
        // 2. Case-insensitive match
        const lowerNorm = normalizedText.toLowerCase();
        const lowerPhrase = phrase.toLowerCase();
        index = lowerNorm.indexOf(lowerPhrase);
        if (index !== -1) {
          return { start: index, end: index + phrase.length };
        }
        // 3. Substring / 4-word prefix match
        const cleanExcerpt = phrase.split(' ').slice(0, 4).join(' ');
        if (cleanExcerpt) {
          index = lowerNorm.indexOf(cleanExcerpt.toLowerCase());
          if (index !== -1) {
            return { start: index, end: index + phrase.length };
          }
        }
      }
    }
    
    return highlightRange;
  }, [highlightRange, routeTheme, normalizedText]);

  useEffect(() => {
    if (routeTheme !== 'summative') return;
    if (!resolvedSummativeRange || resolvedSummativeRange.start === undefined) return;

    if (activeRightTab === 'transcript') {
      setTimeout(() => {
        if (activeSpanRef.current) {
          activeSpanRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 60);
    }
  }, [resolvedSummativeRange, routeTheme, activeRightTab, highlightRange]);

  const effectiveHighlightRange = routeTheme === 'formative' ? resolvedHighlightRange : resolvedSummativeRange;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Top Header Controls aligned with Left Panel headers */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-shrink-0">
        <h4 className="text-sm font-heading font-bold text-slate-700">
          Original Feedback Transcript
        </h4>
        <button
          onClick={() => {
            if (onEditClick) {
              onEditClick();
            } else if (routeTheme === 'formative') {
              setRawFeedbackInput(originalText);
              setActiveRightTab('input');
            }
          }}
          className="w-7 h-7 rounded-lg border bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150 flex items-center justify-center cursor-pointer"
          title="Edit original feedback input"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Text Container Box */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-3 scroll-smooth scrollbar-hover-only pr-1"
      >
        {paragraphs.map((p) => (
          <ParagraphRow
            key={p.id}
            text={p.text}
            pStart={p.pStart}
            pEnd={p.pEnd}
            highlightRange={effectiveHighlightRange}
            routeTheme={routeTheme}
            activeSpanRef={activeSpanRef}
          />
        ))}
      </div>
    </div>
  );
};
