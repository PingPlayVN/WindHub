import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dices, X, FileArchive } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const location = useLocation();

  // Hàm hỗ trợ kiểm tra menu đang active
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay màng đen mờ khi mở menu trên Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Cột Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            WindHub.
          </h1>
          {/* Nút đóng menu trên Mobile */}
          <button onClick={closeSidebar} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link 
            to="/" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}
        >
            <LayoutDashboard size={20} />
            <span>Tổng quan</span>
        </Link>
        <Link 
            to="/files" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive('/files') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}
        >
            <FileArchive size={20} />
            <span>Quản lý File</span>
        </Link>
        </nav>
      </aside>
    </>
  );
}