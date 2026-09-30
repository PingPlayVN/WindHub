import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, ClipboardPaste, FileCheck2, Layers3, Plus } from 'lucide-react';
import { parseVocabularyText } from '../../utils/importUtils';

export default function QuickImportPanel({ boards, boardId, onBoardChange, onImport }) {
  const [text, setText] = useState('');
  const [order, setOrder] = useState('english-first');
  const [notice, setNotice] = useState('');
  const parsed = parseVocabularyText(text, order);
  const board = boards.find((item) => item.id === boardId);

  const importWords = () => {
    if (!board || !parsed.entries.length) return;
    onImport(board.id, parsed.entries);
    setNotice(`Đã xử lý ${parsed.entries.length} cặp hợp lệ cho bảng “${board.name}”. Cặp trùng lặp được tự bỏ qua.`);
    setText('');
  };

  const loadClipboard = async () => {
    try {
      setText(await navigator.clipboard.readText());
      setNotice('');
    } catch {
      setNotice('Không đọc được clipboard. Hãy dán trực tiếp vào ô nhập.');
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
      <motion.div layout className="space-y-4 rounded-xl border border-slate-800 bg-[#101319] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-100">Nhập nhanh danh sách</h3>
            <p className="mt-1 text-xs text-slate-500">Mỗi dòng một cặp. Tự nhận dạng tab, dấu gạch, hai chấm, dấu bằng, pipe hoặc dấu phẩy.</p>
          </div>
          <button type="button" onClick={loadClipboard} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white">
            <ClipboardPaste size={15} /> Dán clipboard
          </button>
        </div>

        <fieldset disabled={!boards.length} className="space-y-2 disabled:opacity-50">
          <legend className="mb-2 text-xs font-medium text-slate-400">Bảng nhận từ</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {boards.map((item) => {
              const isSelected = item.id === boardId;
              return (
                <motion.button
                  key={item.id}
                  layout
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onBoardChange(item.id)}
                  className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${isSelected ? 'border-amber-400/70 bg-amber-400/10' : 'border-slate-800 bg-black/20 hover:border-slate-600'}`}
                >
                  <Layers3 size={16} className={isSelected ? 'shrink-0 text-amber-300' : 'shrink-0 text-slate-500'} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-xs font-semibold ${isSelected ? 'text-amber-100' : 'text-slate-300'}`}>{item.name}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{item.words.length} từ</span>
                  </span>
                  {isSelected && <Check size={15} className="shrink-0 text-amber-300" />}
                </motion.button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2" aria-label="Thứ tự ngôn ngữ trong dữ liệu">
          <span className="mr-1 text-xs text-slate-500">Thứ tự nhập:</span>
          <button type="button" aria-pressed={order === 'english-first'} onClick={() => setOrder('english-first')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${order === 'english-first' ? 'bg-amber-400 text-black' : 'bg-black/30 text-slate-400 hover:text-white'}`}>
            <ArrowDown size={13} /> Anh → Việt
          </button>
          <button type="button" aria-pressed={order === 'vietnamese-first'} onClick={() => setOrder('vietnamese-first')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${order === 'vietnamese-first' ? 'bg-amber-400 text-black' : 'bg-black/30 text-slate-400 hover:text-white'}`}>
            <ArrowUp size={13} /> Việt → Anh
          </button>
        </div>

        <label className="sr-only" htmlFor="quick-vocabulary-input">Dán danh sách từ vựng</label>
        <textarea
          id="quick-vocabulary-input"
          value={text}
          onChange={(event) => { setText(event.target.value); setNotice(''); }}
          placeholder={'1. apple - quả táo\nthoughtful: chu đáo, ân cần\nbook\tquyển sách'}
          rows={10}
          spellCheck="false"
          className="w-full resize-y rounded-lg border border-slate-700 bg-black/40 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs text-slate-500">{parsed.entries.length} dòng hợp lệ · {parsed.invalidLines.length} dòng cần xem lại</p>
          <button type="button" onClick={importWords} disabled={!board || !parsed.entries.length} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus size={15} /> Nhập {parsed.entries.length} cặp từ
          </button>
        </div>
        {notice && <p role="status" className="rounded-lg border border-emerald-900/70 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">{notice}</p>}
      </motion.div>

      <motion.div layout className="space-y-4">
        <motion.section layout className="rounded-xl border border-slate-800 bg-[#101319] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-100">Xem trước</h3>
              <p className="mt-1 text-xs text-slate-500">{board ? `Bảng: ${board.name}` : 'Chưa có bảng'}</p>
            </div>
            <FileCheck2 className="text-emerald-400" size={18} />
          </div>
          {parsed.entries.length ? (
            <ul className="max-h-72 divide-y divide-slate-800 overflow-auto">
              {parsed.entries.slice(0, 10).map((entry, index) => (
                <li key={`${entry.english}-${entry.vietnamese}-${index}`} className="grid grid-cols-2 gap-3 py-2.5 text-xs">
                  <span className="break-words font-medium text-slate-200">{entry.english}</span>
                  <span className="break-words text-slate-400">{entry.vietnamese}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-xs text-slate-500">Dán nội dung để xem kết quả chuẩn hóa.</p>
          )}
          {parsed.entries.length > 10 && <p className="mt-2 text-center text-[11px] text-slate-500">Còn {parsed.entries.length - 10} cặp từ khác</p>}
        </motion.section>

        {parsed.invalidLines.length > 0 && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-xl border border-amber-900/60 bg-amber-950/20 p-4">
            <h3 className="text-xs font-semibold text-amber-200">Dòng chưa nhận dạng</h3>
            <ul className="mt-2 space-y-1 text-xs text-amber-100/70">
              {parsed.invalidLines.slice(0, 5).map((line) => <li key={line.line} className="break-words">Dòng {line.line}: {line.text}</li>)}
            </ul>
            {parsed.invalidLines.length > 5 && <p className="mt-2 text-[11px] text-amber-200/60">Còn {parsed.invalidLines.length - 5} dòng khác</p>}
          </motion.section>
        )}
      </motion.div>
    </motion.section>
  );
}