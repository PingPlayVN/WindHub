import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, LockKeyhole, MoreVertical, Play } from 'lucide-react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { getFileCategoryInfo } from '../utils/fileCardVisuals';
import { EASE_OS_OUT } from '@/design-system/motion';

const gridItemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_OS_OUT },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.1 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: EASE_OS_OUT },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

function FileItem({
  file,
  viewMode,
  isSelected,
  isSelectionMode,
  isRenaming,
  renameText,
  setRenameText,
  handleRenameSubmit,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleItemClick,
  handleItemDoubleClick,
  handleContextMenu,
  handleLongPress,
  toggleItemSelection,
}) {
  const info = getFileCategoryInfo(file);
  const IconComponent = info.icon;
  const isFolder = file.type === 'folder';

  const touchHandlers = useTouchGestures({
    onLongPress: () => handleLongPress?.(file),
    delay: 450,
    moveThreshold: 10,
  });

  const renderGridVisual = () => {
    if (isFolder) {
      return (
        <div className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50/90 via-orange-50/50 to-amber-100/40 dark:from-[#1b1f2a] dark:via-[#171a23] dark:to-[#13161e]">
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 size-24 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative transition-transform duration-300 ease-out group-hover:scale-[1.06] group-hover:-translate-y-0.5">
            <div className="relative h-[54px] w-[72px] sm:h-[60px] sm:w-[80px]">
              <div className="absolute top-1.5 left-3 right-3 h-2.5 rounded-t-[4px] border border-slate-200/70 bg-white/85 dark:border-white/10 dark:bg-white/15" />
              <div
                className="absolute top-[9px] left-1 w-[40%] h-[11px] rounded-t-lg bg-gradient-to-r from-amber-400 to-orange-500"
                style={{ clipPath: 'polygon(0% 100%, 4px 0%, calc(100% - 6px) 0%, 100% 100%)' }}
              />
              <div className="absolute inset-x-0 bottom-0 top-[17px] overflow-hidden rounded-[11px] border border-amber-300/60 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-md shadow-orange-500/25 dark:border-amber-400/30">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (file.thumbnailUrl || (file.type === 'image' && file.url && !file.url.includes('drive.google.com'))) {
      const src = file.thumbnailUrl || file.url;
      return (
        <div className="relative size-full overflow-hidden bg-[var(--os-surface-3)]">
          <img
            src={src}
            alt={file.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {file.type === 'video' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md shadow-lg transition-transform group-hover:scale-110">
                <Play size={15} className="fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`relative flex size-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${info.gradient}`}>
        <IconComponent size={36} className={`${info.accentColor} transition-transform duration-200 group-hover:scale-110`} />
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <motion.div
        variants={gridItemVariants}
        draggable={!isSelectionMode}
        onDragStart={(e) => handleDragStart(e, file)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, file)}
        onClick={(e) => {
          e.stopPropagation();
          handleItemClick(e, file);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleItemDoubleClick?.(file);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          handleContextMenu(e, file);
        }}
        {...touchHandlers}
        className={`group relative flex flex-col gap-2.5 rounded-[var(--radius-lg)] border p-2.5 select-none cursor-pointer transition-[border-color,background-color,box-shadow,transform] duration-[var(--dur-micro)] active:scale-[0.98] ${
          isSelected && isSelectionMode
            ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] ring-2 ring-[var(--os-accent-border)]'
            : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] hover:border-[var(--os-accent-border)] hover:bg-[var(--os-surface-1)] hover:shadow-[var(--os-shadow-sm)]'
        }`}
      >
        {isSelectionMode && (
          <button
            type="button"
            aria-label={isSelected ? `Bỏ chọn ${file.name}` : `Chọn ${file.name}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleItemSelection?.(file.id);
            }}
            className={`absolute top-3.5 left-3.5 z-20 flex size-6 items-center justify-center rounded-full cursor-pointer shadow-sm transition-transform ${
              isSelected
                ? 'bg-[var(--os-accent)] text-[var(--os-accent-fg)] border-2 border-white dark:border-zinc-900'
                : 'border-2 border-slate-400 bg-white/90 dark:border-zinc-500 dark:bg-zinc-900/90'
            }`}
          >
            {isSelected && <Check size={13} strokeWidth={3} />}
          </button>
        )}

        <div
          className={`absolute top-3 right-3 z-20 transition-opacity ${
            isSelectionMode ? 'opacity-0 pointer-events-none' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <button
            type="button"
            aria-label={`Tùy chọn cho ${file.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleContextMenu(e, file);
            }}
            className="os-focus-ring flex size-7 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/90 text-[var(--os-text-secondary)] backdrop-blur-md hover:text-[var(--os-text-primary)] cursor-pointer shadow-2xs"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-subtle)]">
          {renderGridVisual()}

          <div className="absolute bottom-1.5 left-1.5 z-10">
            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider backdrop-blur-md ${info.badgeColor}`}>
              {info.label}
            </span>
          </div>

          {file.isLocked && (
            <div
              className="absolute bottom-1.5 right-1.5 z-10 rounded-md bg-black/75 p-1 text-amber-400 backdrop-blur-md"
              title="Đã khóa tải xuống"
            >
              <LockKeyhole size={11} />
            </div>
          )}
        </div>

        <div className="w-full px-0.5 text-left">
          {isRenaming ? (
            <form
              onSubmit={(e) => handleRenameSubmit(e, file.id)}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                type="text"
                value={renameText}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={(e) => handleRenameSubmit(e, file.id)}
                className="os-focus-ring w-full rounded-[var(--radius-xs)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--os-text-primary)]"
              />
            </form>
          ) : (
            <>
              <p
                className="truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors"
                title={file.name}
              >
                {file.name}
              </p>
              {file.createdAt && (
                <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--os-text-muted)]">
                  {file.createdAt}
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // LIST VIEW
  return (
    <motion.div
      variants={listItemVariants}
      draggable={!isSelectionMode}
      onDragStart={(e) => handleDragStart(e, file)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, file)}
      onClick={(e) => {
        e.stopPropagation();
        handleItemClick(e, file);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleItemDoubleClick?.(file);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        handleContextMenu(e, file);
      }}
      {...touchHandlers}
      className={`group relative flex items-center gap-3 rounded-[var(--radius-md)] border p-2.5 sm:px-3.5 select-none cursor-pointer transition-colors duration-[var(--dur-micro)] ${
        isSelected && isSelectionMode
          ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)]'
          : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] hover:border-[var(--os-accent-border)] hover:bg-[var(--os-surface-1)]'
      }`}
    >
      {isSelectionMode && (
        <button
          type="button"
          aria-label={isSelected ? `Bỏ chọn ${file.name}` : `Chọn ${file.name}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleItemSelection?.(file.id);
          }}
          className={`flex size-5 shrink-0 items-center justify-center rounded-full cursor-pointer ${
            isSelected
              ? 'bg-[var(--os-accent)] text-[var(--os-accent-fg)]'
              : 'border-2 border-[var(--os-border-strong)] bg-[var(--os-surface-1)]'
          }`}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </button>
      )}

      <div
        className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] ${
          isFolder
            ? 'bg-amber-500/15 text-amber-500'
            : `bg-gradient-to-br ${info.gradient}`
        }`}
      >
        {file.thumbnailUrl || (file.type === 'image' && file.url && !file.url.includes('drive.google.com')) ? (
          <img
            src={file.thumbnailUrl || file.url}
            alt={file.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <IconComponent size={19} className={isFolder ? 'text-amber-500' : info.accentColor} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <form
            onSubmit={(e) => handleRenameSubmit(e, file.id)}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              value={renameText}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setRenameText(e.target.value)}
              onBlur={(e) => handleRenameSubmit(e, file.id)}
              className="os-focus-ring w-full rounded-[var(--radius-xs)] border border-[var(--os-accent)] bg-[var(--os-surface-1)] px-2.5 py-1 text-sm font-semibold text-[var(--os-text-primary)]"
            />
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <p className="truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
              {file.name}
            </p>
            {file.isLocked && (
              <LockKeyhole size={13} className="shrink-0 text-[var(--os-warning)]" title="Đã khóa tải xuống" />
            )}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--os-text-muted)]">
          <span className="font-semibold uppercase">{info.label}</span>
          {file.createdAt && (
            <>
              <span>·</span>
              <span className="font-mono">{file.createdAt}</span>
            </>
          )}
        </div>
      </div>

      {!isSelectionMode && (
        <button
          type="button"
          aria-label={`Tùy chọn cho ${file.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleContextMenu(e, file);
          }}
          className="os-focus-ring flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </motion.div>
  );
}

export default memo(FileItem);
