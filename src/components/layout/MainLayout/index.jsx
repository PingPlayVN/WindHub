import Sidebar from '@/components/os/Sidebar';
import TopBar from '@/components/os/TopBar';
import BottomNavigation from '@/components/os/BottomNavigation';
import CommandPalette from '@/components/os/CommandPalette';

export default function MainLayout({ children }) {
  return (
    <div className="os-app-canvas flex h-[100dvh] w-full overflow-hidden">
      <div className="os-ambient-backdrop" aria-hidden="true" />

      <Sidebar />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />

        <main
          id="main-content"
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 pt-4 pb-24 sm:px-5 sm:pt-5 md:px-6 md:pb-6"
        >
          {children}
        </main>
      </div>

      <BottomNavigation />
      <CommandPalette />
    </div>
  );
}
