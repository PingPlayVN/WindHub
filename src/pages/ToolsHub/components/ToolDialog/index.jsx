import { Suspense } from 'react';
import { X } from 'lucide-react';

export default function ToolDialog({ tool, onClose }) {
  const Tool = tool.Component;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button type="button" aria-label="Đóng công cụ" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="tool-dialog-title" className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0b0e12] shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 id="tool-dialog-title" className="min-w-0 truncate font-semibold text-slate-100">{tool.title}</h2>
          <button type="button" aria-label="Đóng công cụ" onClick={onClose} className="ml-4 rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-800" />}>
            <Tool />
          </Suspense>
        </div>
      </section>
    </div>
  );
}