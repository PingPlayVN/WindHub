import { motion } from 'framer-motion';
import { LayoutGrid, List } from 'lucide-react';

export default function FileManagerToolbar({
  TABS, activeTab, handleTabChange,
  searchTerm, setSearchTerm,
  effectiveSort, handleLocalSortChange,
  viewMode, setViewMode
}) {
  return (
    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-stretch">
      {/* THANH TAB PHÂN KHÔNG GIAN */}
      <div className="flex w-full shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#111] dark:shadow-[0_12px_30px_rgba(0,0,0,0.25)] custom-scrollbar xl:w-max relative z-20 mb-3 xl:mb-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab)}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 whitespace-nowrap outline-none flex-1 xl:flex-none ${
                isActive ? 'text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-primary-100 dark:bg-primary-500/20 shadow-sm border border-primary-200 dark:border-primary-500/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KHU VỰC TÌM KIẾM VÀ LỌC (Nằm ngang trên Mobile) */}
      <div className="flex w-full flex-1 flex-row items-center gap-2 z-10">
        <div className="relative flex-1 min-w-0">
          <span className="sr-only">Tìm kiếm</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-[#111] dark:text-slate-100 placeholder:text-slate-500 truncate"
          />
        </div>
        <div className="relative w-[100px] sm:w-44 shrink-0 group">
          <select
              value={effectiveSort}
              onChange={(e) => handleLocalSortChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-2 py-2 sm:px-4 sm:py-2.5 pr-6 sm:pr-10 text-xs sm:text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-[#111] dark:text-slate-100 cursor-pointer truncate"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name-asc">Tên A-Z</option>
            <option value="name-desc">Tên Z-A</option>
          </select>
          <div className="absolute inset-y-0 right-2 sm:right-3 flex items-center pointer-events-none text-slate-500 group-hover:text-primary-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <div className="flex items-center bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 sm:p-1 shadow-sm shrink-0">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 sm:p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-primary-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Dạng lưới"><LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 sm:p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-primary-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} title="Dạng danh sách"><List size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
        </div>
      </div>
    </div>
  );
}