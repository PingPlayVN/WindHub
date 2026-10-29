// src/modules/FileManager/components/FileModals/MoveToModal.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderCheck, X, ArrowRight } from 'lucide-react';
import { getDescendantIds } from '../../utils/fileUtils';

export function MoveToModal({
  showMoveModal,
  setShowMoveModal,
  itemsToMove = [],
  allFiles = [],
  handleMoveSubmit,
  activeTabRootId,
}) {
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showMoveModal) return null;

  // Lấy danh sách ID không hợp lệ: chính các items cần chuyển và con cháu của chúng
  const invalidIds = new Set(getDescendantIds(allFiles, itemsToMove.map((i) => i.id)));

  // Lọc tất cả các thư mục có thể làm đích đến trong cùng root
  const availableFolders = allFiles.filter(
    (f) => f.type === 'folder' && !invalidIds.has(f.id)
  );

  const handleConfirm = async () => {
    if (!selectedTargetId) return;
    setIsSubmitting(true);
    try {
      await handleMoveSubmit(selectedTargetId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-md bg-white dark:bg-zinc-900 border-t sm:border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Di chuyển tài nguyên
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đang chọn {itemsToMove.length} mục để di chuyển
            </p>
          </div>
          <button
            onClick={() => setShowMoveModal(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Danh sách các thư mục đích */}
        <div className="my-4 flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
            Chọn thư mục đích:
          </p>

          {/* Tùy chọn 1: Thư mục Gốc (Root) */}
          {activeTabRootId && (
            <button
              type="button"
              onClick={() => setSelectedTargetId(activeTabRootId)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                selectedTargetId === activeTabRootId
                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Folder className="shrink-0 text-amber-500" size={20} />
                <span className="truncate text-sm">Thư mục gốc (Root)</span>
              </div>
              {selectedTargetId === activeTabRootId && (
                <FolderCheck className="shrink-0 text-primary-500" size={18} />
              )}
            </button>
          )}

          {/* Danh sách các thư mục con */}
          {availableFolders.map((folder) => {
            const isSelected = selectedTargetId === folder.id;
            const isCurrentParent = itemsToMove.every((i) => i.parentId === folder.id);

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedTargetId(folder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Folder className="shrink-0 text-blue-500" size={20} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{folder.name}</p>
                    {isCurrentParent && (
                      <span className="text-[10px] text-amber-500 block">Thư mục hiện tại</span>
                    )}
                  </div>
                </div>
                {isSelected && <FolderCheck className="shrink-0 text-primary-500" size={18} />}
              </button>
            );
          })}

          {availableFolders.length === 0 && !activeTabRootId && (
            <p className="text-center text-xs text-slate-400 py-6">
              Không có thư mục đích nào khả dụng.
            </p>
          )}
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowMoveModal(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedTargetId || isSubmitting}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            <span>{isSubmitting ? 'Đang chuyển...' : 'Chuyển vào đây'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default MoveToModal;
