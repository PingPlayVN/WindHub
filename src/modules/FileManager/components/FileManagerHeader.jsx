import { ClipboardPaste, FolderPlus, HardDrive, Link2 } from 'lucide-react';
import Button from '@/components/os/Button';

export default function FileManagerHeader({
  isAdmin = false,
  itemCount = 0,
  currentFolderName = 'Tài nguyên',
  hasClipboard = false,
  onCreateFolder,
  onAddLink,
  onPaste,
}) {
  return (
    <div className="os-card flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]"
        >
          <HardDrive size={19} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-[var(--os-text-primary)]">
              {currentFolderName}
            </h2>
            <span className="shrink-0 rounded-full border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[var(--os-text-muted)]">
              {itemCount} mục
            </span>
          </div>
          <p className="hidden sm:block truncate text-xs text-[var(--os-text-muted)]">
            Duyệt thư mục, xem trước trực tiếp và chia sẻ liên kết tốc độ cao
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {hasClipboard && (
            <Button
              variant="subtle"
              size="sm"
              icon={<ClipboardPaste size={15} />}
              onClick={onPaste}
            >
              Dán vào đây
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus size={15} />}
            onClick={onCreateFolder}
          >
            Thư mục mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Link2 size={15} />}
            onClick={onAddLink}
          >
            Dán liên kết
          </Button>
        </div>
      )}
    </div>
  );
}
