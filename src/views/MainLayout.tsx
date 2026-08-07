import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ActivityBar } from '../components/sidebar/ActivityBar';
import { SourceSidebar } from '../components/sidebar/SourceSidebar';
import { MainWorkspace } from './MainWorkspace';

export const MainLayout: React.FC = () => {
  const { sidebarExpanded } = useAppStore();

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-slate-50">
      {/* 1. Far Left Activity Bar (Icon Navigation Menu) */}
      <ActivityBar />

      {/* 2. Left permanent compact source list controls (Toggleable width inside) */}
      <SourceSidebar />

      {/* 3. Right dynamic workspace panel canvas */}
      <MainWorkspace />
    </div>
  );
};
export default MainLayout;
