import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FreeformCopilotChatProps {
  moduleType?: 'formative' | 'summative' | 'longterm';
  onGuideActionClick?: (actionId: string) => void;
}

export const FreeformCopilotChat: React.FC<FreeformCopilotChatProps> = ({ moduleType = 'formative', onGuideActionClick }) => {
  const { chatMessages, summativeChatMessages, longtermChatMessages, isAIWorking, sendChatMessage, cancelGlobalAIGeneration } = useAppStore();
  const [chatInput, setChatInput] = useState('');
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const activeMessages = moduleType === 'summative'
    ? (summativeChatMessages || [])
    : moduleType === 'longterm'
    ? (longtermChatMessages || [])
    : (chatMessages || []);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [activeMessages, isAIWorking]);

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || isAIWorking) return;
    const text = chatInput;
    setChatInput('');
    sendChatMessage(text, moduleType);
  };

  const theme = moduleType === 'summative'
    ? {
        primary: '#1A73E8',
        userBubble: 'bg-blue-50/70 border border-blue-200/60 text-slate-900 ml-auto',
        hoverBorder: 'hover:border-[#1A73E8] hover:bg-blue-50/30',
        stepBadge: 'bg-blue-100 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white',
        textHover: 'group-hover:text-[#1A73E8]',
        focusBorder: 'focus:border-[#1A73E8]',
        btnBg: 'bg-[#1A73E8] hover:bg-[#1557B0] text-white',
        dotBg: 'bg-[#1A73E8]'
      }
    : moduleType === 'longterm'
    ? {
        primary: '#1A56DB',
        userBubble: 'bg-blue-50/70 border border-blue-200/60 text-slate-900 ml-auto',
        hoverBorder: 'hover:border-[#1A56DB] hover:bg-blue-50/30',
        stepBadge: 'bg-blue-100 text-[#1A56DB] group-hover:bg-[#1A56DB] group-hover:text-white',
        textHover: 'group-hover:text-[#1A56DB]',
        focusBorder: 'focus:border-[#1A56DB]',
        btnBg: 'bg-[#1A56DB] hover:bg-blue-700 text-white',
        dotBg: 'bg-[#1A56DB]'
      }
    : {
        primary: '#00A3C4',
        userBubble: 'bg-cyan-50/70 border border-cyan-200/60 text-slate-900 ml-auto',
        hoverBorder: 'hover:border-[#00A3C4] hover:bg-cyan-50/30',
        stepBadge: 'bg-cyan-100 text-[#00A3C4] group-hover:bg-[#00A3C4] group-hover:text-white',
        textHover: 'group-hover:text-[#00A3C4]',
        focusBorder: 'focus:border-[#00A3C4]',
        btnBg: 'bg-[#00A3C4] hover:bg-cyan-600 text-white',
        dotBg: 'bg-[#00A3C4]'
      };

  return (
    <div className={`h-full flex flex-col justify-between ${moduleType === 'longterm' ? 'p-2' : 'p-0'}`}>
      {/* Message queues list */}
      <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto space-y-3.5 mb-3 pr-1 custom-scrollbar">
        {activeMessages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col rounded-xl p-3 shadow-2xs text-xs font-sf-pro leading-relaxed transition-all ${
              m.hasGuideActions || m.sender === 'ai'
                ? 'w-full max-w-full bg-slate-50 border border-slate-200/80 text-slate-700 mr-auto'
                : theme.userBubble
            }`}
          >
            {m.isLoading ? (
              <div className="flex items-center gap-1.5 py-1">
                <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '0ms' }} />
                <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '150ms' }} />
                <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '300ms' }} />
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
              <div className="mt-3 space-y-2 text-left w-full">
                {m.guideActions.map((act, aIdx) => (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (onGuideActionClick) {
                        onGuideActionClick(act.id);
                      }
                    }}
                    className={`p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex items-start gap-2.5 ${theme.hoverBorder}`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] font-sf-pro font-bold flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${theme.stepBadge}`}>
                      {aIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-1.5 text-[11.5px] font-sf-pro font-bold text-slate-800">
                        <span className={`transition-colors leading-snug break-words flex-1 ${theme.textHover}`}>
                          {act.title}
                        </span>
                        <ArrowRight className={`w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5 ${theme.textHover}`} />
                      </div>
                      <p className="text-[10px] font-sf-pro text-slate-500 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Active AI working loading indicator fallback */}
        {isAIWorking && !activeMessages.some(m => m.isLoading) && (
          <div className="flex flex-col max-w-[85%] w-fit min-w-[110px] rounded-xl p-3 shadow-sm text-xs font-body transition-all bg-slate-50 border border-slate-150 text-slate-700 mr-auto animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 py-1">
              <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '0ms' }} />
              <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '150ms' }} />
              <div className={`w-2 h-2 rounded-full ${theme.dotBg} animate-bounce`} style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
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
          className={`flex-1 font-sf-pro text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-none transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed ${theme.focusBorder}`}
        />
        <button
          type="button"
          onClick={isAIWorking ? cancelGlobalAIGeneration : handleSendChatMessage}
          className="h-[36px] w-[36px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-2xs flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          title={isAIWorking ? "Stop current AI task" : "Send message"}
        >
          {isAIWorking ? (
            <Square className="w-3.5 h-3.5 fill-white text-white" />
          ) : (
            <Send className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};
