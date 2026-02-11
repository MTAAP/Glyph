import { ThemeProvider } from './theme/ThemeProvider';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { Canvas } from './layout/Canvas';
import { Footer } from './layout/Footer';
import { ToastContainer } from '@/shared/ui/Toast';
import { ClipboardHandler } from '@/features/input/components/ClipboardHandler';
import { KeyboardHandler } from '@/features/input/components/KeyboardHandler';

export function App() {
  return (
    <ThemeProvider>
      <ClipboardHandler />
      <KeyboardHandler />
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex flex-1 min-h-0 max-lg:flex-col">
          <Sidebar />
          <Canvas />
        </div>
        <Footer />
      </div>
      <ToastContainer />
    </ThemeProvider>
  );
}
