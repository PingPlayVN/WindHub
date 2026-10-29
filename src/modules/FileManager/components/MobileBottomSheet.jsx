// src/modules/FileManager/components/MobileBottomSheet.jsx
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Share2,
  Download,
  Edit2,
  FolderInput,
  LockKeyhole,
  UnlockKeyhole,
  Trash2,
  FolderPlus,
  Link2,
  ClipboardPaste,
  Scissors,
  Copy,
  X,
} from 'lucide-react';
import { getFileIcon } from '../utils/fileIcons';

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-end justify-center">
        {/* Backdrop mờ tối */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Ngăn kéo Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-slate-200 dark:border-zinc-800 shadow-2xl p-5 pb-8 overflow-y-auto z-10 flex flex-col"
        >
          {/* Thanh gạt kéo (Drag Handle) */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" />

          {/* Header hiển thị thông tin tệp nếu có */}
          {hasItem ? (
            <div className="flex items-center gap-3 pb-4 mb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-zinc-700">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(item.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs uppercase font-semibold text-slate-400">
                    {item.type || 'tệp'}
                  </span>
                  {item.isLocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-medium flex items-center gap-1">
                      <LockKeyhole size={10} /> Đã khóa tải
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Tùy chọn không gian
              </h4>
              <button
                type="button"
                onClick={close}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Danh sách hành động lớn (Touch targets >= 48px) */}
          <div className="space-y-1">
            {/* Thao tác xem trước */}
            {isFile && (
              <button
                type="button"
                onClick={execute(() => handlePreview(item))}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
              >
                <Eye size={20} className="text-blue-500 shrink-0" />
                <span>Xem trước</span>
              </button>
            )}

            {/* Thao tác chia sẻ */}
            {hasItem && (
              <button
                type="button"
                onClick={execute(() => handleShare(item))}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
              >
                <Share2 size={20} className="text-primary-500 shrink-0" />
                <span>Chia sẻ liên kết</span>
              </button>
            )}

            {/* Thao tác tải xuống */}
            {isFile && !item.isLocked && (
              <button
                type="button"
                onClick={execute(() => handleDownload(item))}
                className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
              >
                <Download size={20} className="text-emerald-500 shrink-0" />
                <span>Tải xuống</span>
              </button>
            )}

            {/* Quyền Admin đối với Item */}
            {isAdmin && hasItem && (
              <>
                <button
                  type="button"
                  onClick={execute(() => startRename(item))}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <Edit2 size={20} className="text-amber-500 shrink-0" />
                  <span>Đổi tên</span>
                </button>

                <button
                  type="button"
                  onClick={execute(() => startMove?.(item))}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <FolderInput size={20} className="text-amber-400 shrink-0" />
                  <span>Di chuyển đến...</span>
                </button>

                {isFile && (
                  <button
                    type="button"
                    onClick={execute(() => handleToggleLock(item))}
                    className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                  >
                    {item.isLocked ? (
                      <>
                        <UnlockKeyhole size={20} className="text-emerald-500 shrink-0" />
                        <span>Mở khóa tải xuống</span>
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={20} className="text-amber-500 shrink-0" />
                        <span>Khóa tải xuống</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={execute(() => handleCut?.())}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <Scissors size={20} className="text-slate-400 shrink-0" />
                  <span>Cắt (Cut)</span>
                </button>

                <button
                  type="button"
                  onClick={execute(() => handleCopy?.())}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <Copy size={20} className="text-slate-400 shrink-0" />
                  <span>Sao chép (Copy)</span>
                </button>

                <button
                  type="button"
                  onClick={execute(() => setShowDeleteModal(true))}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-[0.99]"
                >
                  <Trash2 size={20} className="shrink-0" />
                  <span>Xóa tài nguyên</span>
                </button>
              </>
            )}

            {/* Quyền Admin đối với Vùng trống (!hasItem) */}
            {isAdmin && !hasItem && (
              <>
                <button
                  type="button"
                  onClick={execute(onCreateFolder)}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <FolderPlus size={20} className="text-blue-500 shrink-0" />
                  <span>Tạo thư mục mới</span>
                </button>

                <button
                  type="button"
                  onClick={execute(onAddLink)}
                  className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                >
                  <Link2 size={20} className="text-emerald-500 shrink-0" />
                  <span>Dán liên kết tệp</span>
                </button>

                {hasClipboard && (
                  <button
                    type="button"
                    onClick={execute(handlePaste)}
                    className="w-full min-h-[48px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[0.99]"
                  >
                    <ClipboardPaste size={20} className="text-amber-500 shrink-0" />
                    <span>Dán nội dung sao chép</span>
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
