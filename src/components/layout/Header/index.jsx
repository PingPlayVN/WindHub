import { useThemeStore } from '@/store/useThemeStore';
import { useUIStore } from '@/store/useUIStore';
import { Sun, Moon, Menu } from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 z-10 relative">
      <div className="flex items-center gap-3">
        {/* Nút Menu chỉ hiện trên Mobile */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Menu size={24} />
        </button>
        <span className="font-medium text-slate-700 dark:text-slate-200 hidden md:block">
          Tổng quan
        </span>
      </div>
      
      {/* Nút Toggle Theme */}
      <button 
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </header>
  );
}