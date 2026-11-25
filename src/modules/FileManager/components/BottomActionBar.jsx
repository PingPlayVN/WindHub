import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Download,
  FolderInput,
  LockKeyhole,
  Share2,
  Square,
  Trash2,
  UnlockKeyhole,
  X,
} from 'lucide-react';
import { SPRING_OS_GENTLE } from '@/design-system/motion';

export default function BottomActionBar({
  isSelectionMode,
  selectedItems,
  allFiles,
  isAdmin,
  onClearSelection,
  onSelectAllToggle,
  isAllSelected,
  onDownload,
  onShare,
  onMove,
  onDelete,
  onToggleLock,
}) {
  const count = selectedItems?.size || 0;

  if (!isSelectionMode || count === 0) return null;

  const singleItem = count === 1 ? allFiles.find((f) => selectedItems.has(f.id)) : null;
  const isSingleFile = singleItem && singleItem.type !== 'folder';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 72, opacity: 0 }}
        transition={SPRING_OS_GENTLE}
        className="os-floating-surface fixed bottom-[calc(4.75rem+var(--safe-bottom))] md:bottom-5 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[var(--z-action-bar)] flex items-center justify-between gap-2 sm:gap-3 rounded-[var(--radius-xl)] px-3.5 sm:px-5 py-2.5 text-[var(--os-text-primary)]"
      >
        <div className="flex items-center gap-2 border-r border-[var(--os-border-default)] pr-2.5">
          <button
            type="button"
            onClick={onSelectAllToggle}
            title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            className="os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-[var(--os-accent)]" />
            ) : (
              <Square size={16} />
            )}
            <span className="hidden sm:inline">{isAllSelected ? 'Bỏ chọn' : 'Tất cả'}</span>
          </button>
          <span className="font-mono text-xs font-bold tabular-nums text-[var(--os-accent)] whitespace-nowrap">
            {count} mục
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {isSingleFile && !singleItem.isLocked && (
            <button
              type="button"
              onClick={() => onDownload(singleItem)}
              title="Tải xuống"
              className="os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-3)] cursor-pointer"
            >
              <Download size={15} />
              <span className="hidden md:inline">Tải về</span>
            </button>
          )}

          {singleItem && (
            <button
              type="button"
              onClick={() => onShare(singleItem)}
              title="Chia sẻ liên kết"
              className="os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-3)] cursor-pointer"
            >
              <Share2 size={15} />
              <span className="hidden md:inline">Chia sẻ</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onMove}
              title="Di chuyển đến thư mục khác"
              className="os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-3)] cursor-pointer"
            >
              <FolderInput size={15} className="text-[var(--os-accent)]" />
              <span className="hidden md:inline">Di chuyển</span>
            </button>
          )}

          {isAdmin && singleItem && (
            <button
              type="button"
              onClick={() => onToggleLock(singleItem)}
              title={singleItem.isLocked ? 'Mở khóa tải xuống' : 'Khóa tải xuống'}
              className={`os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--os-surface-3)] cursor-pointer ${
                singleItem.isLocked ? 'text-[var(--os-warning)]' : 'text-[var(--os-text-primary)]'
              }`}
            >
              {singleItem.isLocked ? <LockKeyhole size={15} /> : <UnlockKeyhole size={15} />}
              <span className="hidden md:inline">{singleItem.isLocked ? 'Mở khóa' : 'Khóa'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              title="Xóa các mục đã chọn"
              className="os-focus-ring flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--os-danger-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-danger)] cursor-pointer hover:opacity-90"
            >
              <Trash2 size={15} />
              <span className="hidden md:inline">Xóa</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          title="Đóng thanh chọn"
          aria-label="Bỏ chọn và đóng"
          className="os-focus-ring ml-0.5 rounded-[var(--radius-sm)] p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer"
        >
          <X size={17} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
