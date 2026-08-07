import React from 'react';
import { Database, Sparkles, Lock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FormativeSandbox } from './FormativeSandbox';
import { SummativeDashboard } from './SummativeDashboard';
import { GlobalCompetency } from './GlobalCompetency';
import { PersonalCenter } from './PersonalCenter';
import { ArchiveAssetDetailView } from './ArchiveAssetDetailView';
import { AuthOnboardingView } from './AuthOnboardingView';
import { Workbench } from './Workbench';

export const MainWorkspace: React.FC = () => {
  const { currentRoute, activeProject, isLaunched, isReadOnly } = useAppStore();

  const projectName = activeProject?.projectName || '';

  // Render sub-view inside the workspace canvas based on routing state
  const renderWorkspaceContent = () => {
    // 0. Dedicated Full-Page Auth & Onboarding View
    if (currentRoute === 'auth-onboarding') {
      return <AuthOnboardingView />;
    }

    // 0. Dedicated Main Workbench Hub View
    if (currentRoute === 'workbench') {
      return (
        <div className="h-full w-full overflow-y-auto">
          <Workbench />
        </div>
      );
    }

    // 0. Global direct navigation routes (accessible anytime without active draft project launch)
    if (currentRoute === 'global-competency') {
      return (
        <div className="h-full w-full overflow-y-auto">
          <GlobalCompetency />
        </div>
      );
    }

    if (currentRoute === 'personal-center') {
      return (
        <div className="h-full w-full overflow-y-auto">
          <PersonalCenter />
        </div>
      );
    }

    // 0. Static Archive Asset Detail View -> Render Workbench for unpopulated projects
    if (currentRoute === 'archive-asset-detail') {
      return (
        <div className="h-full w-full overflow-y-auto">
          <Workbench />
        </div>
      );
    }

    // 1. Friction Lock: If not launched or name is empty, retain Idle/Empty Slate
    if (!isLaunched || !projectName.trim()) {
      return (
        <div className="h-full w-full overflow-y-auto">
          <Workbench />
        </div>
      );
    }

    // 2. Switch subviews dynamically when launched
    const renderActiveView = () => {
      switch (currentRoute) {
        case 'formative-sandbox':
          return <FormativeSandbox />;
        case 'summative-dashboard':
          return <SummativeDashboard />;
        default:
          return <FormativeSandbox />;
      }
    };

    return (
      <div className="h-full w-full flex flex-col min-h-0 relative">
        {/* Render Read-Only review top banner when isReadOnly is true */}
        {isReadOnly && (
          <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-2.5 px-4 flex items-center gap-2 text-[10px] font-heading font-bold tracking-wider sticky top-0 z-50">
            <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Read-Only Review Mode — This archived research project is locked for evaluation and retrospective analysis only.</span>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderActiveView()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-hidden bg-slate-50 relative select-none">
      {renderWorkspaceContent()}
    </div>
  );
};
export default MainWorkspace;
