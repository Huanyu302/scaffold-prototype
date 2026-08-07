import React from 'react';

interface CompetencyDataPoint {
  dimensionId: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  description: string;
  startOffset: number;
  endOffset: number;
}

interface ScoreBarGroupProps {
  data: CompetencyDataPoint[];
  onDimensionClick: (start: number, end: number) => void;
  activeRange: { start: number; end: number } | null;
}

export const ScoreBarGroup: React.FC<ScoreBarGroupProps> = ({
  data,
  onDimensionClick,
  activeRange
}) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h4 className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1">
        Competency Scores & Breakdowns
      </h4>
      <div className="space-y-3">
        {data.map((item) => {
          const isSelected = activeRange && activeRange.start === item.startOffset && activeRange.end === item.endOffset;
          const pct = (item.score / item.maxScore) * 100;

          return (
            <div
              key={item.dimensionId}
              onClick={() => onDimensionClick(item.startOffset, item.endOffset)}
              className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? 'border-brand-summative-primary bg-brand-summative-light/5 shadow-sm'
                  : 'border-slate-150 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-heading font-bold text-slate-800">
                  {item.dimensionName}
                </span>
                <span className="font-mono font-bold text-brand-summative-primary">
                  {item.score}%
                </span>
              </div>
              
              {/* Progress bar tracks */}
              <div className="w-full h-1.5 bg-slate-150 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-brand-summative-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-[9px] text-slate-400 font-body leading-normal line-clamp-1">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
