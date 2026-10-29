// src/modules/FileManager/components/BottomActionBar.jsx
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  FolderInput,
  Trash2,
  X,
  CheckSquare,
  Square,
  LockKeyhole,
  UnlockKeyhole,
} from 'lucide-react';

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

  // CHỈ HIỂN THỊ KHI ĐANG Ở CHẾ ĐỘ CHỌN (isSelectionMode) VÀ CÓ ÍT NHẤT 1 TỆP ĐƯỢC CHỌN
  if (!isSelectionMode || count === 0) return null;

  // Nếu chọn duy nhất 1 item
  const singleItem = count === 1 ? allFiles.find((f) => selectedItems.has(f.id)) : null;
  const isSingleFile = singleItem && singleItem.type !== 'folder';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[180] flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 bg-slate-900/90 dark:bg-black/90 text-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl"
      >
        {/* Số lượng đã chọn & Nút Chọn tất cả */}
        <div className="flex items-center gap-2 pr-2 border-r border-white/15">
          <button
            type="button"
            onClick={onSelectAllToggle}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-primary-400" />
            ) : (
              <Square size={16} />
            )}
            <span className="hidden sm:inline">{isAllSelected ? 'Bỏ chọn' : 'Tất cả'}</span>
          </button>
          <span className="text-xs font-bold text-primary-400 whitespace-nowrap">
            {count} mục
          </span>
        </div>

        {/* Các nút hành động tác vụ */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tải xuống (nếu là 1 file chưa bị khóa) */}
          {isSingleFile && !singleItem.isLocked && (
            <button
              type="button"
              onClick={() => onDownload(singleItem)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
              title="Tải xuống"
            >
              <Download size={16} />
              <span className="hidden md:inline">Tải về</span>
            </button>
          )}

          {/* Chia sẻ (nếu chọn 1 mục) */}
          {singleItem && (
            <button
              type="button"
              onClick={() => onShare(singleItem)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
              title="Chia sẻ liên kết"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Chia sẻ</span>
            </button>
          )}

          {/* Di chuyển thư mục (Dành cho Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onMove}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
              title="Di chuyển đến thư mục khác"
            >
              <FolderInput size={16} className="text-amber-400" />
              <span className="hidden md:inline">Di chuyển</span>
            </button>
          )}

          {/* Khóa / Mở khóa (Dành cho Admin khi chọn 1 file) */}
          {isAdmin && singleItem && (
            <button
              type="button"
              onClick={() => onToggleLock(singleItem)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 transition flex items-center gap-1.5 text-xs font-medium ${
                singleItem.isLocked ? 'text-amber-400' : 'text-slate-200 hover:text-white'
              }`}
              title={singleItem.isLocked ? 'Mở khóa tải xuống' : 'Khóa tải xuống'}
            >
              {singleItem.isLocked ? <LockKeyhole size={16} /> : <UnlockKeyhole size={16} />}
              <span className="hidden md:inline">
                {singleItem.isLocked ? 'Mở khóa' : 'Khóa'}
              </span>
            </button>
          )}

          {/* Xóa mục đã chọn (Dành cho Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition flex items-center gap-1.5 text-xs font-medium"
              title="Xóa các mục đã chọn"
            >
              <Trash2 size={16} />
              <span className="hidden md:inline">Xóa</span>
            </button>
          )}
        </div>

        {/* Nút Hủy / Thoát chế độ chọn */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Bỏ chọn và đóng"
        >
          <X size={18} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
