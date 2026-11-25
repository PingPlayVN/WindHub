import { useMemo, useState } from 'react';
import { BookOpen, Check, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/os/Modal';
import { CHAR_TO_BUTTON, CHAR_TO_HEX } from '../data/casio580AxesmcData.js';

export default function CharLookupModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [copiedChar, setCopiedChar] = useState(null);

  const charList = useMemo(
    () =>
      Object.entries(CHAR_TO_HEX).map(([char, hex]) => ({
        char,
        hex,
        button: CHAR_TO_BUTTON[char] || null,
      })),
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return charList;
    const q = query.toLowerCase();
    return charList.filter(
      (item) =>
        item.char.toLowerCase().includes(q) ||
        item.hex.toLowerCase().includes(q)
    );
  }, [charList, query]);

  const handleCopy = (hex, char) => {
    navigator.clipboard.writeText(hex);
    setCopiedChar(char);
    toast.success(`Đã sao chép mã Hex: ${hex}`);
    setTimeout(() => setCopiedChar(null), 1500);
  };

  return (
    <Modal
      open={Boolean(isOpen)}
      onClose={onClose}
      size="lg"
      subtitle={`${charList.length} KÝ TỰ HỖ TRỢ`}
      title="Bảng tra cứu mã Hex Casio fx-580VN X"
      icon={<BookOpen size={18} />}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"
          />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo ký tự (A, Ơ, Ệ, π...) hoặc mã Hex (F4 1E, 41)..."
            className="os-focus-ring h-10.5 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-9.5 pr-3 text-xs font-mono text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
          />
        </div>

        <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 sm:grid-cols-3">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCopy(item.hex, item.char)}
              className="os-focus-ring group flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-2 text-left font-mono hover:border-[var(--os-accent-border)] cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--os-info-soft)] text-sm font-bold text-[var(--os-info)]">
                  {item.char === ' ' ? '␣' : item.char}
                </span>
                <span className="truncate text-xs font-bold text-[var(--os-text-primary)]">
                  {item.hex}
                </span>
              </span>
              <span className="text-[var(--os-text-muted)] group-hover:text-[var(--os-accent)]">
                {copiedChar === item.char ? (
                  <Check size={13} className="text-[var(--os-success)]" />
                ) : (
                  <Copy size={13} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
