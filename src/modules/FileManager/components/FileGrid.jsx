import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon } from 'lucide-react';
import FileItem from './FileItem';

export default function FileGrid({
  loadError, currentFiles, viewMode, isLoading, selectedItems, setSelectedItems,
  renamingItem, renameText, setRenameText, handleRenameSubmit,
  handleDragStart, handleDragOver, handleDrop, handleItemClick, handleItemDoubleClick, handleContextMenu,
  getFileIcon, handleBackgroundContextMenu, onRetry
}) {
  const skeletonItems = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div
      className="min-h-0 flex-1 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto custom-scrollbar"
      onClick={() => setSelectedItems(new Set())}
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
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6' : 'flex flex-col gap-2'}>
          {skeletonItems.map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-900/60 p-3">
              <div className="h-28 rounded-xl bg-slate-200/80 dark:bg-zinc-800/90" />
              <div className="mt-3 h-3 w-2/3 rounded-full bg-slate-200/80 dark:bg-zinc-800/90" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-200/80 dark:bg-zinc-800/90" />
            </div>
          ))}
        </div>
      ) : currentFiles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400">
          <FolderIcon size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Thư mục trống</p>
          <p className="mt-1 text-sm text-slate-500">Thêm tệp mới hoặc tạo thư mục để bắt đầu.</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6" : "flex flex-col gap-2"}
          >
            <AnimatePresence>
              {currentFiles.map((file) => (
                <FileItem
                  key={file.id} file={file} viewMode={viewMode}
                  isSelected={selectedItems.has(file.id)}
                  isRenaming={renamingItem === file.id}
                  renameText={renameText} setRenameText={setRenameText} handleRenameSubmit={handleRenameSubmit}
                  handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
                  handleItemClick={handleItemClick} handleItemDoubleClick={handleItemDoubleClick} handleContextMenu={handleContextMenu}
                  getFileIcon={getFileIcon}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}