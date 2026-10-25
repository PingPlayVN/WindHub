import React from 'react';
import { ChevronRight, CornerUpLeft } from 'lucide-react';

export default function Breadcrumb({ path, handleNavigateTo }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-1 text-sm text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1 touch-pan-x">
      {path.length > 1 && (
        <button
          type="button"
          onClick={() => handleNavigateTo(path.length - 2)}
          className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] flex items-center justify-center bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
          title="Quay lại thư mục cha"
        >
          <CornerUpLeft size={16} />
        </button>
      )}
      {path.map((p, idx) => (
        <React.Fragment key={p.id}>
          <button
            type="button"
            onClick={() => handleNavigateTo(idx)}
            className={`hover:text-blue-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[32px] flex items-center text-xs sm:text-sm ${
              idx === path.length - 1
                ? 'font-bold text-slate-800 dark:text-slate-200 bg-white/70 dark:bg-zinc-800/50 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {p.name}
          </button>
          {idx < path.length - 1 && (
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}