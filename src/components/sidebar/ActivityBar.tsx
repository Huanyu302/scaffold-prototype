import React from 'react';
import { Library, Archive, Route, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ActivityBar: React.FC = () => {
  const {
    currentRoute,
    setRoute,
    activeProject,
    setSidebarMode,
    sidebarExpanded,
    setSidebarExpanded,
    setIsOnboardingModalOpen,
    userProfile
  } = useAppStore();

  const isNewUser = userProfile.userFlowMode === 'new-onboarded';

  const handlePersonalSpaceClick = () => {
    const isCurrentlyInProject = currentRoute !== 'global-competency' && currentRoute !== 'personal-center';
    if (isCurrentlyInProject) {
      // Toggle sidebar drawer expansion
      setSidebarExpanded(!sidebarExpanded);
    } else {
      // Navigating back to workspace: restore route and expand the explorer sidebar
      if (activeProject) {
        setRoute(activeProject.feedbackType === 'formative' ? 'formative-sandbox' : 'summative-dashboard');
      } else {
        setRoute('workbench');
      }
      setSidebarExpanded(true);
    }
    setSidebarMode('library-tree');
  };

  const handleRepoClick = () => {
    setRoute('global-competency');
    setSidebarExpanded(false); // Collapse sidebar drawer to let repository graph fill screen
  };

  const handleUserClick = () => {
    setRoute('personal-center');
    setSidebarExpanded(false); // Collapse sidebar drawer to show clean user profile
  };

  const isPersonalSpaceActive = currentRoute !== 'global-competency' && currentRoute !== 'personal-center';
  const isRepoActive = currentRoute === 'global-competency';
  const isUserActive = currentRoute === 'personal-center';

  return (
    <div className="w-16 flex-shrink-0 h-screen bg-slate-50/90 border-r border-slate-200/70 flex flex-col justify-between items-center py-6 select-none z-30 shadow-sm backdrop-blur-md">
      
      {/* Top Branding Logo (Click to launch Full Page Onboarding) */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => {
            setRoute('auth-onboarding');
            setSidebarExpanded(false);
          }}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00A3C4] to-[#1A56DB] shadow-blue-500/25 flex items-center justify-center text-white font-heading font-extrabold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform"
        >
          <Library className="w-5 h-5" />
        </button>
      </div>

      {/* Center Navigation Menu (Lighter Aesthetics) */}
      <div className="flex flex-col items-center gap-5 w-full px-2 my-auto">
        
        {/* 1. My Archive Button */}
        <button
          onClick={handlePersonalSpaceClick}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group cursor-pointer border ${
            isPersonalSpaceActive
              ? 'bg-slate-150/90 border-slate-250 text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Archive className="w-5 h-5" />
          {/* Active side indicator */}
          {isPersonalSpaceActive && (
            <div className="absolute left-0 w-0.5 h-4 bg-slate-900 rounded-r-md top-1/2 -translate-y-1/2" />
          )}
          {/* Tooltip */}
          <div className="absolute left-14 hidden group-hover:block bg-slate-800 text-white text-xs font-sf-pro font-medium px-2.5 py-1 rounded-md shadow-md border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
            My Archive
          </div>
        </button>

        {/* 2. Long-Term Repository Button */}
        <button
          onClick={handleRepoClick}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group cursor-pointer border ${
            isRepoActive
              ? 'bg-slate-150/90 border-slate-250 text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Route className="w-5 h-5" />
          {/* Active side indicator */}
          {isRepoActive && (
            <div className="absolute left-0 w-0.5 h-4 bg-slate-900 rounded-r-md top-1/2 -translate-y-1/2" />
          )}
          {/* Tooltip */}
          <div className="absolute left-14 hidden group-hover:block bg-slate-800 text-white text-xs font-sf-pro font-medium px-2.5 py-1 rounded-md shadow-md border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
            Long-Term Repository
          </div>
        </button>

        {/* 3. User Center Button */}
        <button
          onClick={handleUserClick}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group cursor-pointer border ${
            isUserActive
              ? 'bg-slate-150/90 border-slate-250 text-slate-900 shadow-2xs font-extrabold'
              : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <User className="w-5 h-5" />
          {/* Active side indicator */}
          {isUserActive && (
            <div className="absolute left-0 w-0.5 h-4 bg-slate-900 rounded-r-md top-1/2 -translate-y-1/2" />
          )}
          {/* Tooltip */}
          <div className="absolute left-14 hidden group-hover:block bg-slate-800 text-white text-xs font-sf-pro font-medium px-2.5 py-1 rounded-md shadow-md border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
            User Center
          </div>
        </button>

      </div>

    </div>
  );
};
export default ActivityBar;
