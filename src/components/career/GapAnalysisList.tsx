import React from 'react';

interface CareerGap {
  competencyName: string;
  academicScore: number;
  requiredScore: number;
  gapDistance: number;
}

interface GapAnalysisListProps {
  gaps: CareerGap[];
}

export const GapAnalysisList: React.FC<GapAnalysisListProps> = ({ gaps }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h4 className="text-[10px] font-heading font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1">
        Competency Gap Analysis
      </h4>
      <div className="space-y-4">
        {gaps.map((gap, index) => {
          const studentPct = gap.academicScore;
          const requiredPct = gap.requiredScore;

          return (
            <div
              key={`${gap.competencyName}-${index}`}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 relative overflow-hidden"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-heading font-bold text-slate-800">
                  {gap.competencyName}
                </span>
                
                {/* Score indicators */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-body text-slate-550">
                    Required: <strong className="text-slate-700">{requiredPct}%</strong>
                  </span>
                  <span className="text-[10px] font-body text-slate-550">
                    Current: <strong className="text-emerald-600">{studentPct}%</strong>
                  </span>
                  <span className="font-mono font-bold text-red-650 bg-red-50 border border-red-150 px-1.5 py-0.5 rounded text-[10px]">
                    -{gap.gapDistance}
                  </span>
                </div>
              </div>

              {/* Overlapping progress track bars */}
              <div className="w-full h-3 bg-slate-200/60 rounded-full relative overflow-hidden">
                {/* Target baseline background block */}
                <div 
                  className="h-full bg-slate-300/40 border-r-2 border-slate-400/60 absolute top-0 left-0"
                  style={{ width: `${requiredPct}%` }}
                />
                
                {/* Student score fill bar in Aurora Green */}
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 absolute top-0 left-0"
                  style={{ width: `${studentPct}%` }}
                />

                {/* Dotted target marker */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-slate-400/60"
                  style={{ left: `${requiredPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-500">
                <span>Critical Gap Distance</span>
                <span>Target Baseline</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
