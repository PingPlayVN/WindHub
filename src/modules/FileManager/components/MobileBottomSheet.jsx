import {
  ClipboardPaste,
  Copy,
  Download,
  Edit2,
  Eye,
  FolderInput,
  FolderPlus,
  Link2,
  LockKeyhole,
  Scissors,
  Share2,
  Trash2,
  UnlockKeyhole,
  X,
} from 'lucide-react';
import BottomSheet from '@/components/os/BottomSheet';
import IconButton from '@/components/os/IconButton';
import { getFileIcon } from '../utils/fileIcons';

function SheetAction({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`os-focus-ring flex min-h-[48px] w-full items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-2.5 text-left text-sm font-semibold cursor-pointer transition-colors ${
        danger
          ? 'text-[var(--os-danger)] hover:bg-[var(--os-danger-soft)]'
          : 'text-[var(--os-text-primary)] hover:bg-[var(--os-surface-hover)]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function MobileBottomSheet({
  contextMenu,
  setContextMenu,
  isAdmin,
  handlePreview,
  handleDownload,
  startRename,
  startMove,
  handleToggleLock,
  handleCopy,
  handleCut,
  setShowDeleteModal,
  onCreateFolder,
  onAddLink,
  handlePaste,
  hasClipboard,
  handleShare,
}) {
  if (!contextMenu) return null;

  const { item } = contextMenu;
  const isFile = item?.type && item.type !== 'folder';
  const hasItem = Boolean(item);
  const close = () => setContextMenu(null);
  const execute = (callback) => () => {
    callback?.(item);
    close();
  };

  const headerSlot = hasItem ? (
    <div className="mb-3 flex items-center gap-3 border-b border-[var(--os-border-subtle)] pb-3.5 px-1">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)]">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="size-full object-cover" />
        ) : (
          getFileIcon(item.type)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
          {item.name}
        </h4>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase text-[var(--os-text-muted)]">
            {item.type || 'tệp'}
          </span>
          {item.isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--os-warning-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--os-warning)]">
              <LockKeyhole size={10} /> Đã khóa tải
            </span>
          )}
        </div>
      </div>
      <IconButton label="Đóng" size="sm" variant="subtle" onClick={close}>
        <X size={17} />
      </IconButton>
    </div>
  ) : undefined;

  return (
    <BottomSheet
      open={Boolean(contextMenu)}
      onClose={close}
      title={!hasItem ? 'Tùy chọn không gian' : undefined}
      headerSlot={headerSlot}
    >
      <div className="space-y-1">
        {isFile && (
          <SheetAction
            icon={<Eye size={19} className="text-[var(--os-info)]" />}
            label="Xem trước"
            onClick={execute(() => handlePreview(item))}
          />
        )}

        {hasItem && (
          <SheetAction
            icon={<Share2 size={19} className="text-[var(--os-accent)]" />}
            label="Chia sẻ liên kết"
            onClick={execute(() => handleShare(item))}
          />
        )}

        {isFile && !item.isLocked && (
          <SheetAction
            icon={<Download size={19} className="text-[var(--os-success)]" />}
            label="Tải xuống"
            onClick={execute(() => handleDownload(item))}
          />
        )}

        {isAdmin && hasItem && (
          <>
            <SheetAction
              icon={<Edit2 size={19} className="text-[var(--os-warning)]" />}
              label="Đổi tên"
              onClick={execute(() => startRename(item))}
            />
            <SheetAction
              icon={<FolderInput size={19} className="text-[var(--os-accent)]" />}
              label="Di chuyển đến..."
              onClick={execute(() => startMove?.(item))}
            />
            {isFile && (
              <SheetAction
                icon={
                  item.isLocked ? (
                    <UnlockKeyhole size={19} className="text-[var(--os-success)]" />
                  ) : (
                    <LockKeyhole size={19} className="text-[var(--os-warning)]" />
                  )
                }
                label={item.isLocked ? 'Mở khóa tải xuống' : 'Khóa tải xuống'}
                onClick={execute(() => handleToggleLock(item))}
              />
            )}
            <SheetAction
              icon={<Scissors size={19} className="text-[var(--os-text-muted)]" />}
              label="Cắt (Cut)"
              onClick={execute(() => handleCut?.())}
            />
            <SheetAction
              icon={<Copy size={19} className="text-[var(--os-text-muted)]" />}
              label="Sao chép (Copy)"
              onClick={execute(() => handleCopy?.())}
            />
            <SheetAction
              danger
              icon={<Trash2 size={19} />}
              label="Xóa tài nguyên"
              onClick={execute(() => setShowDeleteModal(true))}
            />
          </>
        )}

        {isAdmin && !hasItem && (
          <>
            <SheetAction
              icon={<FolderPlus size={19} className="text-[var(--os-info)]" />}
              label="Tạo thư mục mới"
              onClick={execute(onCreateFolder)}
            />
            <SheetAction
              icon={<Link2 size={19} className="text-[var(--os-success)]" />}
              label="Dán liên kết tệp"
              onClick={execute(onAddLink)}
            />
            {hasClipboard && (
              <SheetAction
                icon={<ClipboardPaste size={19} className="text-[var(--os-accent)]" />}
                label="Dán vào thư mục này"
                onClick={execute(handlePaste)}
              />
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
