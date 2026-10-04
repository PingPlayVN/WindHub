import { useThemeStore } from '@/store/useThemeStore';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { Download, Sun, Moon, Menu, LogIn, LogOut, ShieldCheck, CircleHelp, X, Terminal } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar, openLogin } = useUIStore();
  const { user, isAdmin } = useAuthStore();
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const location = useLocation();
  const pageTitle = location.pathname === '/files'
    ? 'Quản lý File'
    : location.pathname === '/tools'
      ? 'Công cụ'
      : location.pathname === '/extensions'
      ? 'Tiện ích'
      : location.pathname === '/ai-lab'
        ? 'AI Battle'
        : location.pathname === '/p2p'
          ? 'P2P Share'
        : 'Tổng quan';

  const handleLogout = async () => {
    try {
      const [{ signOut }, { auth }] = await Promise.all([import('firebase/auth'), import('@/services/firebase')]);
      await signOut(auth);
      toast.success('Đăng xuất thành công');
    } catch {
      toast.error('Không thể đăng xuất');
    }
  };

  // HÀM TIÊM ERUDA DÀNH RIÊNG CHO MOBILE ADMIN
  const toggleEruda = () => {
    if (window.eruda) {
      if (window.eruda._isInit) {
        window.eruda.destroy();
        toast.info('Đã tắt Eruda DevTools');
      } else {
        window.eruda.init();
        toast.success('Đã bật lại Eruda DevTools');
      }
    } else {
      // KIỂM TRA XEM ĐANG TẢI DỞ KHÔNG
      if (document.getElementById('eruda-plugin-script')) {
        return toast.info('Eruda đang được tải xuống, vui lòng chờ...');
      }

      const script = document.createElement('script');
      script.id = 'eruda-plugin-script'; // Gắn ID để đánh dấu
      script.src = 'https://cdn.jsdelivr.net/npm/eruda';
      script.onload = () => {
        window.eruda.init();
        toast.success('Eruda DevTools đã được bật!');
      };
      document.head.appendChild(script);
    }
  };

  const handleInstall = async () => {
    if (canInstall) {
      const outcome = await install();
      if (outcome === 'accepted') toast.success('WindHub đã được cài đặt');
      return;
    }
    setShowInstallHelp(true);
  };

  return (
    <>
      <header className="bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 z-10 relative h-16">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu size={24} />
          </button>
          <span className="font-medium text-slate-700 dark:text-slate-200 hidden md:block">
            {pageTitle}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isInstalled && (
            <button type="button" onClick={handleInstall} aria-label="Cài đặt WindHub" title="Cài đặt WindHub" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/50 px-2.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700/60 dark:text-amber-300 dark:hover:bg-amber-950/40">
              <Download size={16} /> <span className="hidden sm:inline">Cài app</span>
            </button>
          )}
          {isAdmin ? (
            <div className="relative flex items-center gap-1">
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <ShieldCheck size={15} /> Admin
              </div>
              
              {/* NÚT BẬT ERUDA: Dùng md:hidden để chỉ hiện trên Mobile */}
              <button aria-label="Mobile DevTools" onClick={toggleEruda} className="md:hidden rounded-full p-1.5 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950">
                <Terminal size={17} />
              </button>

              <button aria-label="Phím tắt" onClick={() => setShowShortcuts(true)} className="rounded-full p-1.5 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950">
                <CircleHelp size={17} />
              </button>
            </div>
          ) : user ? (
            <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">{user.email}</span>
          ) : (
            <button onClick={openLogin} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:text-amber-400 dark:hover:bg-amber-950"><LogIn size={18} /> Đăng nhập</button>
          )}
          {user && <button aria-label="Đăng xuất" onClick={handleLogout} className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-900"><LogOut size={19} /></button>}
          <button
            type="button"
            aria-label={theme === 'light' ? 'Bật giao diện tối' : 'Bật giao diện sáng'}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      {/* POPUP PHÍM TẮT XỊN XÒ */}
      <AnimatePresence>
        {showInstallHelp && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.button type="button" aria-label="Đóng hướng dẫn cài app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInstallHelp(false)} className="absolute inset-0 cursor-default border-0 bg-black/60 backdrop-blur-sm" />
            <motion.div role="dialog" aria-modal="true" aria-labelledby="install-title" initial={{ opacity: 0, y: 15, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-[#101319] p-6 text-slate-100 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">WindHub offline</p>
                  <h2 id="install-title" className="mt-2 text-lg font-bold">Cài WindHub vào thiết bị</h2>
                </div>
                <button type="button" onClick={() => setShowInstallHelp(false)} aria-label="Đóng" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">Trình duyệt chưa hiện nút cài tự động. Mở menu trình duyệt và chọn <strong className="text-slate-200">Cài đặt ứng dụng</strong> hoặc <strong className="text-slate-200">Thêm vào màn hình chính</strong>.</p>
              <button type="button" onClick={() => setShowInstallHelp(false)} className="mt-5 w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-300">Đã hiểu</button>
            </motion.div>
          </div>
        )}
        {showShortcuts && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.button 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowShortcuts(false)} 
              className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm border-0" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ type: 'spring', duration: 0.4 }} 
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0a0a0a]"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CircleHelp className="text-amber-500" size={24} /> Phím tắt quản trị
                </h3>
                <button onClick={() => setShowShortcuts(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors bg-transparent border-0 outline-none">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium">Chọn tất cả</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">Ctrl + A</kbd>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium">Sao chép</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">Ctrl + C</kbd>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium">Cắt (Di chuyển)</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">Ctrl + X</kbd>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium">Dán</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">Ctrl + V</kbd>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium">Đổi tên</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">F2</kbd>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#111] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium text-red-500 dark:text-red-400">Xóa tài nguyên</span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md font-mono text-[11px] font-bold text-red-500 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/50">Delete</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}