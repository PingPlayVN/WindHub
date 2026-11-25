import { useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  ClipboardPaste,
  FileCheck2,
  Layers3,
  Plus,
} from 'lucide-react';
import Button from '@/components/os/Button';
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
    setNotice(
      `Đã nhập ${parsed.entries.length} cặp hợp lệ vào bảng “${board.name}”. Các cặp trùng lặp được tự động bỏ qua.`
    );
    setText('');
  };

  const loadClipboard = async () => {
    try {
      setText(await navigator.clipboard.readText());
      setNotice('');
    } catch {
      setNotice('Không đọc được clipboard tự động. Vui lòng nhấn Ctrl+V trực tiếp vào ô nhập.');
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] items-start">
      {/* Left: Bulk Text Editor */}
      <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
              Nhập danh sách hàng loạt
            </h3>
            <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
              Mỗi dòng một cặp từ. Tự nhận diện dấu gạch ngang, hai chấm, tab, dấu bằng hoặc dấu phẩy.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<ClipboardPaste size={14} />}
            onClick={loadClipboard}
          >
            Dán Clipboard
          </Button>
        </div>

        {/* Target Board Selector */}
        <fieldset disabled={!boards.length} className="space-y-2 disabled:opacity-50">
          <legend className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
            Bảng đích lưu trữ
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {boards.map((item) => {
              const isSelected = item.id === boardId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onBoardChange(item.id)}
                  className={`os-focus-ring flex min-w-0 items-center gap-2.5 rounded-[var(--radius-sm)] border p-2.5 text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)]'
                      : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] hover:border-[var(--os-border-strong)]'
                  }`}
                >
                  <Layers3
                    size={15}
                    className={
                      isSelected ? 'shrink-0 text-[var(--os-accent)]' : 'shrink-0 text-[var(--os-text-muted)]'
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[var(--os-text-primary)]">
                      {item.name}
                    </span>
                    <span className="block font-mono text-[10px] text-[var(--os-text-muted)]">
                      {item.words.length} từ hiện có
                    </span>
                  </span>
                  {isSelected && <Check size={14} className="shrink-0 text-[var(--os-accent)]" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Column Order Switch */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
            Thứ tự cột dữ liệu:
          </span>
          <div className="os-sunken inline-flex rounded-[var(--radius-sm)] p-0.5 text-xs">
            <button
              type="button"
              aria-pressed={order === 'english-first'}
              onClick={() => setOrder('english-first')}
              className={`os-focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
                order === 'english-first'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <ArrowRightLeft size={12} />
              <span>Anh → Việt</span>
            </button>
            <button
              type="button"
              aria-pressed={order === 'vietnamese-first'}
              onClick={() => setOrder('vietnamese-first')}
              className={`os-focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
                order === 'vietnamese-first'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] font-bold shadow-2xs'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <ArrowRightLeft size={12} />
              <span>Việt → Anh</span>
            </button>
          </div>
        </div>

        <label className="sr-only" htmlFor="quick-vocabulary-input">
          Dán danh sách từ vựng
        </label>
        <textarea
          id="quick-vocabulary-input"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setNotice('');
          }}
          placeholder={'1. resilient - kiên cường, bền bỉ\nthoughtful: chu đáo, ân cần\narchitecture\tkiến trúc'}
          rows={9}
          spellCheck="false"
          className="os-focus-ring w-full resize-y rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] p-3.5 font-mono text-xs sm:text-sm leading-6 text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="font-mono text-xs text-[var(--os-text-muted)]">
            <strong className="text-[var(--os-success)]">{parsed.entries.length}</strong> hợp lệ ·{' '}
            <strong className="text-[var(--os-warning)]">{parsed.invalidLines.length}</strong> cần xem lại
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!board || !parsed.entries.length}
            icon={<Plus size={14} />}
            onClick={importWords}
          >
            Nhập {parsed.entries.length} cặp từ
          </Button>
        </div>

        {notice && (
          <p
            role="status"
            className="rounded-[var(--radius-sm)] border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-3 py-2 text-xs font-medium text-[var(--os-success)]"
          >
            {notice}
          </p>
        )}
      </div>

      {/* Right: Live Normalization Preview */}
      <div className="space-y-4">
        <section className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--os-border-subtle)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--os-text-primary)]">
                Bản xem trước chuẩn hóa
              </h3>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--os-text-muted)]">
                {board ? `Đích: ${board.name}` : 'Chưa chọn bảng'}
              </p>
            </div>
            <FileCheck2 className="text-[var(--os-success)]" size={18} />
          </div>

          {parsed.entries.length > 0 ? (
            <ul className="max-h-72 divide-y divide-[var(--os-border-subtle)] overflow-y-auto custom-scrollbar">
              {parsed.entries.slice(0, 12).map((entry, index) => (
                <li
                  key={`${entry.english}-${entry.vietnamese}-${index}`}
                  className="grid grid-cols-2 gap-3 py-2 text-xs"
                >
                  <span className="break-words font-bold text-[var(--os-text-primary)]">
                    {entry.english}
                  </span>
                  <span className="break-words text-[var(--os-text-secondary)]">
                    {entry.vietnamese}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-xs text-[var(--os-text-muted)]">
              Dán văn bản ở cột trái để xem kết quả tách cột tự động.
            </p>
          )}

          {parsed.entries.length > 12 && (
            <p className="mt-2.5 text-center font-mono text-[11px] text-[var(--os-text-muted)]">
              + {parsed.entries.length - 12} cặp từ hợp lệ khác
            </p>
          )}
        </section>

        {parsed.invalidLines.length > 0 && (
          <section className="rounded-[var(--radius-lg)] border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] p-4">
            <h4 className="text-xs font-bold text-[var(--os-warning)]">
              Dòng chưa nhận diện được dấu ngăn cách ({parsed.invalidLines.length})
            </h4>
            <ul className="mt-2 space-y-1 font-mono text-xs text-[var(--os-text-secondary)]">
              {parsed.invalidLines.slice(0, 5).map((line) => (
                <li key={line.line} className="break-words">
                  Dòng {line.line}: {line.text}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
