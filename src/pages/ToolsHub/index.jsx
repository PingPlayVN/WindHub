import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import ToolCard from './components/ToolCard';
import ToolDialog from './components/ToolDialog';
import { toolEntries } from './toolRegistry';

export default function ToolsHub() {
  const [selectedTool, setSelectedTool] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-full space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-500">windhub // tools</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Công cụ</h1>
        </div>
        <span className="font-mono text-xs text-slate-500">{toolEntries.length.toString().padStart(2, '0')} công cụ</span>
      </section>

      {toolEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {toolEntries.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} onOpen={() => setSelectedTool(tool)} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center dark:border-slate-700">
          <Wrench className="mb-3 text-slate-400" size={28} />
          <p className="font-mono text-sm text-slate-500">Chưa có công cụ nào.</p>
        </div>
      )}

      {selectedTool && <ToolDialog tool={selectedTool} onClose={() => setSelectedTool(null)} />}
    </motion.div>
  );
}