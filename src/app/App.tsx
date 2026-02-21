import { useState, useCallback } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { Canvas } from './layout/Canvas';
import { CommandBar } from './layout/CommandBar';
import { SplashScreen } from './layout/SplashScreen';
import { ToastContainer } from '@/shared/ui/Toast';
import { FormatModal } from '@/shared/ui/FormatModal';
import { ClipboardHandler } from '@/features/input/components/ClipboardHandler';
import { KeyboardHandler } from '@/features/input/components/KeyboardHandler';
import { SidebarNavigationProvider } from '@/features/settings/SidebarNavigationProvider';
import { useAppStore } from '@/features/settings/store';
import { useUrlParams } from '@/features/settings/hooks/useUrlParams';

function AppContent() {
  const formatModalOpen = useAppStore((s) => s.formatModalOpen);
  const formatModalMode = useAppStore((s) => s.formatModalMode);
  const setFormatModalOpen = useAppStore((s) => s.setFormatModalOpen);

  useUrlParams();

  return (
    <ThemeProvider>
      <SidebarNavigationProvider>
        <ClipboardHandler />
        <KeyboardHandler />
        <div className="flex flex-col h-full">
          <Header />
          <div className="flex flex-1 min-h-0 max-lg:flex-col">
            <Sidebar />
            <Canvas />
          </div>
          <CommandBar />
        </div>
        <ToastContainer />
        <FormatModal
          isOpen={formatModalOpen}
          onClose={() => setFormatModalOpen(false)}
          mode={formatModalMode}
        />
      </SidebarNavigationProvider>
    </ThemeProvider>
  );
}

export function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <AppContent />
    </>
  );
}
