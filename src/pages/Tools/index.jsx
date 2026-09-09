import { motion } from 'framer-motion';
import { Terminal, Wrench } from 'lucide-react';

const toolModules = import.meta.glob('../../modules/Tools/*/index.jsx', { eager: true });
const tools = Object.values(toolModules).map((module) => module.default.tool).filter(Boolean);

export default function Tools() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="tools-shell min-h-full space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0e12] p-6 text-slate-100 shadow-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-orange-400/40 bg-orange-400/10 text-orange-400"><Terminal size={22} /></div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-orange-400">windhub // toolbox</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Công cụ</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Những tiện ích nhỏ, gọn và thực dụng cho các phiên làm việc của bạn.</p>
          </div>
          <span className="ml-auto hidden items-center gap-2 font-mono text-xs text-emerald-400 sm:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />{tools.length.toString().padStart(2, '0')} tools online</span>
        </div>
      </section>
      {tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {tools.map(({ id, Component }, index) => (
            <motion.div key={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}><Component /></motion.div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center dark:border-slate-700"><Wrench className="mb-3 text-slate-400" size={28} /><p className="font-mono text-sm text-slate-500">No tools found.</p></div>
      )}
    </motion.div>
  );
}
