import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, X, FileArchive } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const location = useLocation();

  // Hàm hỗ trợ kiểm tra menu đang active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay màng đen mờ khi mở menu trên Mobile */}
      <AnimatePresence>
      {isSidebarOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      </AnimatePresence>

      {/* Cột Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        
        <div className="flex items-center font-bold text-3xl tracking-tighter select-none cursor-pointer">
          <span className="text-white dark:text-white text-slate-900">Wind</span>
          <span className="bg-[#ff9900] text-black px-1.5 py-0.5 ml-1 rounded-md leading-none">hub</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link 
            to="/" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
        >
            <LayoutDashboard size={20} />
            <span>Tổng quan</span>
        </Link>
        <Link 
            to="/files" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/files') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
        >
            <FileArchive size={20} />
            <span>Quản lý File</span>
        </Link>
        </nav>
      </aside>
    </>
  );
}
