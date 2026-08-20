import { motion, AnimatePresence } from 'framer-motion';
import { Folder as FolderIcon } from 'lucide-react';
import FileItem from './FileItem';

export default function FileGrid({
  loadError, currentFiles, viewMode, selectedItems, setSelectedItems,
  renamingItem, renameText, setRenameText, handleRenameSubmit,
  handleDragStart, handleDragOver, handleDrop, handleItemClick, handleItemDoubleClick, handleContextMenu,
  getFileIcon, handleBackgroundContextMenu
}) {
  return (
    <div
      className="min-h-0 flex-1 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto custom-scrollbar"
      onClick={() => setSelectedItems(new Set())}
      onContextMenu={handleBackgroundContextMenu}
    >
      {loadError ? (
        <div className="flex h-full items-center justify-center text-center text-red-600 dark:text-red-400">{loadError}</div>
      ) : currentFiles.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400">
          <FolderIcon size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Thư mục trống</p>
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