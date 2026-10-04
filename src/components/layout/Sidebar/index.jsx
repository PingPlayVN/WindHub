import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileArchive, Command, Wrench, FlaskConical, Radio } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  // Hàm kiểm tra menu đang active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay mờ đen khi mở menu trên Mobile */}
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
        
        {/* KHU VỰC LOGO BIẾN HÌNH THEO THEME */}
        <div className="flex items-center justify-center mt-6 mb-8 h-12">
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              // LOGO DARK THEME (Cosplay P**nhub)
              <motion.div
                key="logo-dark"
                initial={{ opacity: 0, rotateX: 90, scale: 0.8 }}
                animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                exit={{ opacity: 0, rotateX: -90, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="brand-mark flex items-center justify-center font-bold text-3xl tracking-tighter select-none cursor-pointer"
              >
                <span className="text-white">Wind</span>
                <span className="bg-[#ff9900] text-black px-1.5 py-0.5 ml-1 rounded-md leading-none">hub</span>
              </motion.div>
            ) : (
              // LOGO LIGHT THEME (Cosplay xH**ster)
            <motion.div
              key="logo-light"
              initial={{ opacity: 0, rotateX: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: -90, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              className="brand-mark flex items-center justify-center select-none cursor-pointer"
            >
              {/* Giảm khoảng cách mr-2.5 xuống mr-1.5 để xích lại gần chữ */}
              <img 
                src="/hamster.png" 
                alt="Hamster Logo" 
                className="w-10 h-10 mr-1.5 object-contain" 
              />
              
              {/* Tăng độ mập của chữ lên font-bold */}
              <div className="font-bold text-3xl tracking-normal uppercase">
                <span className="text-[#E03E3E]">W</span>
                <span className="text-[#1C1F26]">indhub</span>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
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
          <Link
            to="/tools"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/tools') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
          >
            <Command size={20} />
            <span>Công cụ</span>
          </Link>
          <Link
            to="/extensions"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/extensions') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
          >
            <Wrench size={20} />
            <span>Tiện ích</span>
          </Link>
          <Link
            to="/ai-lab"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/ai-lab') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
          >
            <FlaskConical size={20} />
            <span>AI Battle</span>
          </Link>
          <Link
            to="/p2p"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/p2p') ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}
          >
            <Radio size={20} />
            <span>P2P Share</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
