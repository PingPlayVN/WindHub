import { useState, useMemo } from 'react';
import { X, Search, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CHAR_TO_HEX, CHAR_TO_BUTTON } from '../data/casio580AxesmcData.js';

export default function CharLookupModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [copiedChar, setCopiedChar] = useState(null);

  const charList = useMemo(() => {
    return Object.entries(CHAR_TO_HEX).map(([char, hex]) => ({
      char,
      hex,
      button: CHAR_TO_BUTTON[char] || null,
    }));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return charList;
    const q = query.toLowerCase();
    return charList.filter(
      (item) =>
        item.char.toLowerCase().includes(q) ||
        item.hex.toLowerCase().includes(q)
    );
  }, [charList, query]);

  if (!isOpen) return null;

  const handleCopy = (hex, char) => {
    navigator.clipboard.writeText(hex);
    setCopiedChar(char);
    toast.success(`Đã sao chép mã Hex: ${hex}`);
    setTimeout(() => setCopiedChar(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bảng tra cứu mã Hex Casio fx-580VN X
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {charList.length} ký tự được hỗ trợ theo chuẩn chars.txt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo ký tự (ví dụ: A, Ơ, Ệ, π, ...) hoặc mã hex (ví dụ: F4 1E, 41)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-sky-500 font-mono transition"
            />
          </div>
        </div>

        {/* List Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCopy(item.hex, item.char)}
              className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-sky-500 bg-white dark:bg-zinc-950/60 cursor-pointer transition group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  {item.char === ' ' ? '␣' : item.char}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {item.hex}
                </span>
              </div>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-500 transition"
              >
                {copiedChar === item.char ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
