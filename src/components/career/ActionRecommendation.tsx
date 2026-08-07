import React, { useEffect, useState } from 'react';
import { Calendar, BookOpen, ExternalLink, Award } from 'lucide-react';

interface RecommendedAction {
  id: string;
  targetCompetency: string;
  title: string;
  description: string;
  resourceType: 'writing_center' | 'micro_course' | 'workshop' | 'link';
  actionLink: string;
}

interface ActionRecommendationProps {
  selectedCompetencyId: string | null;
  actionsDatabase: RecommendedAction[];
}

export const ActionRecommendation: React.FC<ActionRecommendationProps> = ({
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

    // 1. Filter matching closed-loop recommendation items
    const filtered = actionsDatabase.filter(
      action => action.targetCompetency.toLowerCase() === selectedCompetencyId.toLowerCase()
    );
    
    setVisible(false);
    // 2. Add slight transition latency to trigger staggered animation effects
    const timer = setTimeout(() => {
      setRenderedActions(filtered);
      setVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCompetencyId, actionsDatabase]);

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'writing_center':
        return <Calendar className="w-4 h-4" />;
      case 'micro_course':
        return <BookOpen className="w-4 h-4" />;
      case 'workshop':
        return <Award className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'writing_center':
        return '1v1 consultation';
      case 'micro_course':
        return 'online course';
      case 'workshop':
        return 'practical workshop';
      default:
        return 'action link';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <h4 className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
        Closed-loop Recommendation actions
      </h4>
      
      {renderedActions.length === 0 ? (
        <div className="p-6 text-center border border-slate-150 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-400 italic">
            Click on any radar dimension or progress bar node to view targeted capability enhancement resources.
          </p>
        </div>
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
              className="p-4 bg-white border border-slate-150 rounded-xl shadow-sm hover:border-brand-formative-border hover:shadow-md transition-all duration-500 ease-out flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Card Accent Lines */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-formative-primary/40" />

              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-formative-light text-brand-formative-primary flex items-center gap-1">
                  {getResourceTypeIcon(action.resourceType)}
                  {getResourceTypeLabel(action.resourceType)}
                </span>
              </div>
              
              <h5 className="text-xs font-heading font-bold text-slate-800">
                {action.title}
              </h5>
              
              <p className="text-[10px] text-slate-500 font-body leading-relaxed">
                {action.description}
              </p>
              
              <a
                href={action.actionLink}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-heading font-bold text-brand-formative-primary hover:underline mt-1 self-start flex items-center gap-0.5"
              >
                Schedule Now ➔
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
