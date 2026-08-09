import React, { useRef, useState, useEffect, useCallback } from 'react';

interface OverlayScrollbarBoxProps {
  children: React.ReactNode;
  className?: string;
  paddingClassName?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const OverlayScrollbarBox: React.FC<OverlayScrollbarBoxProps> = ({
  children,
  className = '',
  paddingClassName = 'p-5',
  containerRef: externalRef,
  onScroll
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;

  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollbar = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const parentEl = el.parentElement;
    const clientHeight = el.clientHeight || (parentEl ? parentEl.clientHeight : 0);
    const scrollHeight = el.scrollHeight;

    if (scrollHeight <= clientHeight + 2) {
      setThumbHeight(0);
      return;
    }

    const calculatedHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 20);
    const maxTop = clientHeight - calculatedHeight;
    const scrollableDistance = scrollHeight - clientHeight;
    const calculatedTop = scrollableDistance > 0 ? (el.scrollTop / scrollableDistance) * maxTop : 0;

    setThumbHeight(calculatedHeight);
    setThumbTop(calculatedTop);
  }, [containerRef]);

  useEffect(() => {
    updateScrollbar();
    const handleResize = () => updateScrollbar();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => {
      updateScrollbar();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateScrollbar, containerRef, children]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    updateScrollbar();
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 700);

    if (onScroll) {
      onScroll(e);
    }
  };

  const isVisible = isScrolling && thumbHeight > 0;

  return (
    <div 
      className={`relative overflow-hidden w-full ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        updateScrollbar();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Scrollable Container with Native Scrollbars Completely Hidden */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full h-full max-h-full overflow-auto no-scrollbar ${paddingClassName}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>

      {/* Floating Overlay Thumb Element (Aligned right against entire outer panel border edge) */}
      <div 
        className="absolute right-0.5 top-1 w-1.5 pointer-events-none transition-opacity duration-300 z-30"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: `translateY(${thumbTop}px)`,
          height: `${thumbHeight}px`
        }}
      >
        <div className="w-full h-full bg-slate-400/60 hover:bg-slate-600/80 rounded-full shadow-2xs backdrop-blur-2xs" />
      </div>
    </div>
  );
};
