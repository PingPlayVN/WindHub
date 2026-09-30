import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ClipboardCopy, Pencil, Search, Trash2 } from 'lucide-react';

export default function WordList({ words, onEdit, onDelete }) {
  const [query, setQuery] = useState('');
  const [copyStatus, setCopyStatus] = useState('idle');
  const filteredWords = words.filter((word) => `${word.english} ${word.vietnamese}`.toLowerCase().includes(query.trim().toLowerCase()));

  const copyWords = async () => {
    if (!words.length) return;
    const text = ['English\tVietnamese', ...words.map((word) => `${word.english}\t${word.vietnamese}`)].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      setCopyStatus(copied ? 'copied' : 'error');
    }
  };

  return (
    <motion.section layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-xl border border-slate-800 bg-[#101319] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">Danh sách từ</h3>
          <p className="mt-1 text-xs text-slate-500">{words.length} cặp từ</p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={copyWords} disabled={!words.length} aria-label="Sao chép danh sách từ dạng bảng" title="Sao chép danh sách dạng tab-separated" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-semibold text-slate-400 transition hover:border-amber-400/60 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40">
            {copyStatus === 'copied' ? <Check size={14} /> : <ClipboardCopy size={14} />}
            <span className="hidden sm:inline">{copyStatus === 'copied' ? 'Đã sao chép' : copyStatus === 'error' ? 'Copy lỗi' : 'Sao chép'}</span>
          </button>
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-black/40 px-2.5 text-slate-500 focus-within:border-amber-400">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm từ" aria-label="Tìm từ vựng" className="w-20 bg-transparent py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 sm:w-36" />
          </label>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{copyStatus === 'copied' ? 'Đã sao chép toàn bộ danh sách từ.' : copyStatus === 'error' ? 'Không thể sao chép danh sách từ.' : ''}</p>

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