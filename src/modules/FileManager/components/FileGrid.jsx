import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon, FolderPlus, Link2 } from 'lucide-react';
import FileItem from './FileItem';
import { FileCardSkeleton, FileRowSkeleton } from '@/components/ui/AsciiReveal';
import { Button, EmptyState } from '@/components/os';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12 },
  },
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12 },
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
  isAdmin,
  onCreateFolder,
  onAddLink,
  onRetry,
}) {
  const skeletonItems = Array.from({ length: 12 }, (_, index) => index);

  return (
    <div
      className="os-card min-h-[320px] flex-1 rounded-[var(--radius-xl)] p-3 sm:p-4 md:p-5 overflow-y-auto overscroll-contain custom-scrollbar"
      onClick={() => (onClearSelection ? onClearSelection() : setSelectedItems(new Set()))}
      onContextMenu={handleBackgroundContextMenu}
    >
      {loadError ? (
        <EmptyState
          title="Không thể tải danh sách tệp"
          description={loadError}
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Thử tải lại
            </Button>
          }
        />
      ) : isLoading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4'
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[260px] items-center justify-center"
            >
              <EmptyState
                icon={<FolderIcon size={28} />}
                title="Thư mục này đang trống"
                description={
                  isAdmin
                    ? 'Tạo thư mục con hoặc dán liên kết tài nguyên mới để lưu trữ vào không gian này.'
                    : 'Chưa có tài nguyên nào được chia sẻ trong thư mục này.'
                }
                action={
                  isAdmin && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<FolderPlus size={15} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateFolder?.();
                        }}
                      >
                        Tạo thư mục
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Link2 size={15} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddLink?.();
                        }}
                      >
                        Dán liên kết tệp
                      </Button>
                    </>
                  )
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${currentFolderId || 'root'}-${viewMode}`}
              variants={viewMode === 'grid' ? gridContainerVariants : listContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4'
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
