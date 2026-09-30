import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Search, Trash2 } from 'lucide-react';

export default function WordList({ words, onEdit, onDelete }) {
  const [query, setQuery] = useState('');
  const filteredWords = words.filter((word) => `${word.english} ${word.vietnamese}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <motion.section layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-xl border border-slate-800 bg-[#101319] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">Danh sách từ</h3>
          <p className="mt-1 text-xs text-slate-500">{words.length} cặp từ</p>
        </div>
        <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-black/40 px-2.5 text-slate-500 focus-within:border-amber-400">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm từ" aria-label="Tìm từ vựng" className="w-28 bg-transparent py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 sm:w-36" />
        </label>
      </div>

      {filteredWords.length ? (
        <motion.ul layout className="max-h-[24rem] divide-y divide-slate-800 overflow-auto">
          {filteredWords.map((word) => (
            <motion.li layout key={word.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-slate-100">{word.english}</p>
                <p className="mt-1 break-words text-xs text-slate-400">{word.vietnamese}</p>
              </div>
              <button type="button" onClick={() => onEdit(word)} title={`Sửa ${word.english}`} aria-label={`Sửa ${word.english}`} className="rounded-md p-2 text-slate-500 transition hover:bg-white/5 hover:text-amber-300">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => onDelete(word.id)} title={`Xóa ${word.english}`} aria-label={`Xóa ${word.english}`} className="rounded-md p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300">
                <Trash2 size={15} />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">{words.length ? 'Không tìm thấy từ phù hợp.' : 'Danh sách đang trống.'}</p>
      )}
    </motion.section>
  );
}