import React from 'react';
import { ChevronRight, CornerUpLeft } from 'lucide-react';

export default function Breadcrumb({ path, handleNavigateTo }) {
  return (
    <div className="flex items-center gap-2 px-2 text-sm text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
      {path.length > 1 && (
        <button onClick={() => handleNavigateTo(path.length - 2)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors mr-1">
           <CornerUpLeft size={16} />
        </button>
      )}
      {path.map((p, idx) => (
        <React.Fragment key={p.id}>
          <button 
            onClick={() => handleNavigateTo(idx)} 
            className={`hover:text-blue-600 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${idx === path.length - 1 ? 'font-bold text-slate-800 dark:text-slate-200' : ''}`}
          >
            {p.name}
          </button>
          {idx < path.length - 1 && <ChevronRight size={16} className="text-slate-400" />}
        </React.Fragment>
      ))}
    </div>
  );
}