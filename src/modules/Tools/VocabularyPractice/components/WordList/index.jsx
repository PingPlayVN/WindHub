import { useState } from 'react';
import { Check, ClipboardCopy, Pencil, Search, Trash2 } from 'lucide-react';

export default function WordList({ words, onEdit, onDelete }) {
  const [query, setQuery] = useState('');
  const [copyStatus, setCopyStatus] = useState('idle');

  const filteredWords = words.filter((word) =>
    `${word.english} ${word.vietnamese}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const copyWords = async () => {
    if (!words.length) return;
    const text = [
      'English\tVietnamese',
      ...words.map((word) => `${word.english}\t${word.vietnamese}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
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
    <section className="min-w-0 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--os-border-subtle)] pb-3">
        <div>
          <h4 className="text-sm font-bold text-[var(--os-text-primary)]">Danh mục từ vựng</h4>
          <p className="font-mono text-[11px] text-[var(--os-text-muted)]">
            {words.length} cặp từ đã lưu
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={copyWords}
            disabled={!words.length}
            aria-label="Sao chép danh sách từ dạng bảng"
            title="Xuất nhanh dạng TSV (Excel / Notion)"
            className="os-focus-ring inline-flex h-8.5 shrink-0 items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 text-xs font-semibold text-[var(--os-text-secondary)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-text-primary)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
          >
            {copyStatus === 'copied' ? (
              <Check size={13} className="text-[var(--os-success)]" />
            ) : (
              <ClipboardCopy size={13} />
            )}
            <span className="hidden sm:inline">
              {copyStatus === 'copied'
                ? 'Đã chép TSV'
                : copyStatus === 'error'
                ? 'Lỗi copy'
                : 'Xuất TSV'}
            </span>
          </button>

          <label className="flex h-8.5 min-w-0 items-center gap-1.5 rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 text-[var(--os-text-muted)] focus-within:border-[var(--os-accent)]">
            <Search size={13} className="shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Lọc từ..."
              aria-label="Tìm từ vựng"
              className="w-24 bg-transparent text-xs text-[var(--os-text-primary)] outline-none placeholder:text-[var(--os-text-muted)] sm:w-36"
            />
          </label>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {copyStatus === 'copied'
          ? 'Đã sao chép toàn bộ danh sách từ.'
          : copyStatus === 'error'
          ? 'Không thể sao chép danh sách từ.'
          : ''}
      </p>

      {filteredWords.length > 0 ? (
        <ul className="max-h-[22rem] divide-y divide-[var(--os-border-subtle)] overflow-y-auto custom-scrollbar pr-1">
          {filteredWords.map((word) => (
            <li
              key={word.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 sm:gap-3">
                <p className="break-words text-sm font-bold text-[var(--os-text-primary)]">
                  {word.english}
                </p>
                <p className="mt-0.5 sm:mt-0 break-words text-xs sm:text-sm text-[var(--os-text-secondary)]">
                  {word.vietnamese}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(word)}
                  title={`Sửa ${word.english}`}
                  aria-label={`Sửa ${word.english}`}
                  className="rounded p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-accent)] cursor-pointer transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(word.id)}
                  title={`Xóa ${word.english}`}
                  aria-label={`Xóa ${word.english}`}
                  className="rounded p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)] cursor-pointer transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center text-xs text-[var(--os-text-muted)]">
          {words.length
            ? 'Không tìm thấy cặp từ nào khớp bộ lọc.'
            : 'Bảng này chưa có từ vựng. Hãy thêm từ ở khung bên trái hoặc dùng mục Nhập hàng loạt.'}
        </div>
      )}
    </section>
  );
}
