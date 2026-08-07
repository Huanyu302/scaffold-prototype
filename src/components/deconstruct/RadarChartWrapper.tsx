import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface CompetencyDataPoint {
  dimensionId: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  startOffset: number;
  endOffset: number;
}

interface RadarChartWrapperProps {
  data: CompetencyDataPoint[];
  onDimensionClick: (start: number, end: number) => void;
}

export const RadarChartWrapper: React.FC<RadarChartWrapperProps> = ({
  data,
  onDimensionClick
}) => {
  // Format data for Recharts structure
  const chartData = data.map(item => ({
    subject: item.dimensionName,
    score: item.score,
    fullMark: item.maxScore,
    start: item.startOffset,
    end: item.endOffset
  }));

  const handleAngleAxisClick = (e: any) => {
    if (e && e.value) {
      // Find matching item in raw data
      const matched = data.find(item => item.dimensionName === e.value);
      if (matched) {
        onDimensionClick(matched.startOffset, matched.endOffset);
      }
    }
  };

  return (
    <div className="w-full h-[280px] flex items-center justify-center relative morph-element">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#4A5568', fontSize: 10, fontWeight: 600, fontFamily: 'Outfit' }}
            onClick={handleAngleAxisClick}
            style={{ cursor: 'pointer' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#A0AEC0', fontSize: 8 }}
          />
          <Radar
            name="Competency"
            dataKey="score"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.2}
            activeDot={{
              r: 6,
              onClick: (e: any, props: any) => {
                const index = props?.index;
                if (typeof index === 'number') {
                  const matched = chartData[index];
                  if (matched) {
                    onDimensionClick(matched.start, matched.end);
                  }
                }
              },
              style: { cursor: 'pointer' }
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Dynamic Overlay instruction */}
      <span className="absolute bottom-2 right-2 text-[8px] font-heading font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
        Click Labels to Anchor
      </span>
    </div>
  );
};
