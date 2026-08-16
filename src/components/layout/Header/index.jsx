import { useThemeStore } from '@/store/useThemeStore';
import { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { Sun, Moon, Menu, LogIn, LogOut, ShieldCheck, CircleHelp } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export default function Header() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar, openLogin } = useUIStore();
  const { user, isAdmin } = useAuthStore();

  const handleLogout = async () => {
    try {
      const [{ signOut }, { auth }] = await Promise.all([import('firebase/auth'), import('@/services/firebase')]);
      await signOut(auth);
    toast.success('Đã đăng xuất');
    } catch {
    toast.error('Không thể đăng xuất');
    }
  };

  return (
    <header className={`bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 z-10 relative ${showShortcuts ? 'min-h-16 flex-wrap py-2' : 'h-16'}`}>
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
      <div className="flex items-center gap-2">
      {isAdmin ? (
        <div className="relative flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300"><ShieldCheck size={15} /> Admin</div>
          <button aria-label="Phím tắt" onClick={() => setShowShortcuts((visible) => !visible)} className="rounded-full p-1.5 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"><CircleHelp size={17} /></button>
          {showShortcuts && <div className="hidden" />}
        </div>
      ) : user ? (
        <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">{user.email}</span>
      ) : (
        <button onClick={openLogin} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:text-amber-400 dark:hover:bg-amber-950"><LogIn size={18} /> Đăng nhập</button>
      )}
      {user && <button aria-label="Đăng xuất" onClick={handleLogout} className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-900"><LogOut size={19} /></button>}
      <button 
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
      </div>
      {showShortcuts && <div className="order-3 mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"><p className="mb-2 font-bold text-zinc-800 dark:text-zinc-100">Phím tắt quản trị</p><ul className="flex flex-wrap gap-x-5 gap-y-1 text-zinc-600 dark:text-zinc-300"><li><kbd>Ctrl/Cmd + A</kbd> Chọn tất cả</li><li><kbd>Ctrl/Cmd + C</kbd> Sao chép</li><li><kbd>Ctrl/Cmd + X</kbd> Cắt</li><li><kbd>Ctrl/Cmd + V</kbd> Dán</li><li><kbd>F2</kbd> Đổi tên</li><li><kbd>Delete</kbd> Xóa</li></ul></div>}
    </header>
  );
}
