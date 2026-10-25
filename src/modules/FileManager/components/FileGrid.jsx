import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon } from 'lucide-react';
import FileItem from './FileItem';
import { FileCardSkeleton, FileRowSkeleton } from '@/components/ui/AsciiReveal';

// Container variants cho chế độ hiển thị Lưới (Grid) - Kích hoạt hiệu ứng sóng cuộn bung (Cascade Stagger)
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055, // Mỗi tệp/thư mục bung cách nhau 55ms tạo hiệu ứng sóng tầng cực rõ
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

// Container variants cho chế độ hiển thị Danh sách (List) - Thác nước trượt ngang
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

export default function FileGrid({
  loadError,
  currentFiles,
  viewMode,
  isLoading,
  currentFolderId,
  selectedItems,
  setSelectedItems,
  isSelectionMode,
  handleLongPress,
  toggleItemSelection,
  onClearSelection,
  renamingItem,
  renameText,
  setRenameText,
  handleRenameSubmit,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleItemClick,
  handleItemDoubleClick,
  handleContextMenu,
  getFileIcon,
  handleBackgroundContextMenu,
  onRetry,
}) {
  const skeletonItems = Array.from({ length: 12 }, (_, index) => index);

  return (
    <div
      className="min-h-0 flex-1 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/80 dark:border-zinc-800/80 p-3 sm:p-5 md:p-6 overflow-y-auto overscroll-contain custom-scrollbar"
      onClick={() => (onClearSelection ? onClearSelection() : setSelectedItems(new Set()))}
      onContextMenu={handleBackgroundContextMenu}
    >
      {loadError ? (
        <div className="flex h-full min-h-[220px] items-center justify-center text-center">
          <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-600 dark:text-red-400">
            <p className="text-lg font-semibold">Không thể tải dữ liệu</p>
            <p className="mt-2 text-sm text-red-500/80">{loadError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/15 dark:text-red-300"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5'
              : 'flex flex-col gap-2'
          }
        >
          {skeletonItems.map((item) =>
            viewMode === 'grid' ? (
              <FileCardSkeleton key={item} seed={item * 17 + 3} variant="dither" />
            ) : (
              <FileRowSkeleton key={item} seed={item * 17 + 3} variant="dither" />
            )
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentFiles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="h-full min-h-[240px] flex flex-col items-center justify-center text-slate-400"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
                <FolderIcon size={32} className="text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Thư mục trống</p>
              <p className="mt-1 text-xs text-slate-500">Thêm tệp mới hoặc tạo thư mục để bắt đầu.</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentFolderId || 'root'}-${viewMode}`}
              variants={viewMode === 'grid' ? gridContainerVariants : listContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ perspective: 1200 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5'
                  : 'flex flex-col gap-2'
              }
            >
              {currentFiles.map((file, index) => (
                <FileItem
                  key={file.id}
                  index={index}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedItems.has(file.id)}
                  isSelectionMode={isSelectionMode}
                  isRenaming={renamingItem === file.id}
                  renameText={renameText}
                  setRenameText={setRenameText}
                  handleRenameSubmit={handleRenameSubmit}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleItemClick={handleItemClick}
                  handleItemDoubleClick={handleItemDoubleClick}
                  handleContextMenu={handleContextMenu}
                  handleLongPress={handleLongPress}
                  toggleItemSelection={toggleItemSelection}
                  getFileIcon={getFileIcon}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}