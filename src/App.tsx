import React from 'react';
import { MainLayout } from './views/MainLayout';
import { OnboardingFlowModal } from './components/onboarding/OnboardingFlowModal';
import { useAppStore } from './store/useAppStore';

function App() {
  const { isOnboardingModalOpen, setIsOnboardingModalOpen, completeOnboarding } = useAppStore();

  return (
    <div className="min-h-screen w-full bg-slate-50 relative">
      <MainLayout />
      <OnboardingFlowModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onComplete={() => completeOnboarding({})}
      />
    </div>
  );
}

export default App;
