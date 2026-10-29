// src/modules/FileManager/components/FileItem.jsx
import { memo } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, LockKeyhole, Check, Play } from 'lucide-react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { getFileCategoryInfo } from '../utils/fileCardVisuals';

// Animation cuộn/bung từ trong folder ra dạng 3D wave (Staggered 3D Rollout)
const gridItemVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.86,
    rotateX: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 22,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: { duration: 0.1 },
  },
};

// Animation trượt thác nước cho List View
const listItemVariants = {
  hidden: {
    opacity: 0,
    x: -24,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 26,
    },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.1 },
  },
};

function FileItem({
  file,
  _index = 0,
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

  // Hook nhận diện cử chỉ cảm ứng trên mobile (chỉ bắt long-press, không cản trở scroll)
  const touchHandlers = useTouchGestures({
    onLongPress: () => {
      handleLongPress?.(file);
    },
    delay: 450,
    moveThreshold: 10,
  });

  // HÌNH ẢNH BANNER CHO DẠNG LƯỚI (GRID)
  const renderGridVisual = () => {
    if (isFolder) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-amber-50 via-amber-100/50 to-orange-50 dark:from-zinc-900 dark:via-zinc-800/80 dark:to-zinc-900">
          {/* Ánh sáng hắt mềm mại */}
          <div className="absolute w-32 h-32 bg-amber-300/25 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-8 left-1/2 -translate-x-1/2" />
          <div className="absolute w-16 h-16 bg-orange-300/20 dark:bg-orange-500/8 rounded-full blur-2xl pointer-events-none bottom-0 right-0" />

          {/* Biểu tượng Thư mục 3D Premium */}
          <div className="relative transform group-hover:scale-[1.08] group-hover:-translate-y-0.5 transition-all duration-300 ease-out">
            <div className="w-[68px] h-[52px] sm:w-[80px] sm:h-[60px] relative">

              {/* Tờ giấy sau (nhô ra phía trên) */}
              <div className="absolute top-1.5 left-[14px] right-[14px] h-[10px] bg-white/80 dark:bg-zinc-400/20 rounded-t-[4px] border border-slate-200/60 dark:border-zinc-600/40" />
              <div className="absolute top-[5px] left-[10px] right-[10px] h-[10px] bg-white/90 dark:bg-zinc-400/30 rounded-t-[5px] border border-slate-200/60 dark:border-zinc-600/40" />

              {/* Nắp tab thư mục (tai folder) */}
              <div className="absolute top-[9px] left-[5px] w-[38%] h-[11px] sm:h-[12px] bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 rounded-t-lg" style={{ clipPath: 'polygon(0% 100%, 4px 0%, calc(100% - 6px) 0%, 100% 100%)' }} />

              {/* Thân folder chính */}
              <div className="absolute inset-x-0 bottom-0 top-[18px] sm:top-[18px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 dark:from-amber-500 dark:via-amber-600 dark:to-orange-700 rounded-[10px] shadow-lg shadow-amber-500/30 dark:shadow-amber-900/40 border border-amber-300/60 dark:border-amber-500/30 overflow-hidden">
                {/* Đường kẻ ngang trang trí */}
                <div className="absolute top-[4px] inset-x-2.5 h-[1px] bg-amber-300/60 dark:bg-amber-400/30 rounded-full" />
                {/* Vầng sáng bóng trên mặt folder */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              </div>

              {/* Viền sáng dưới đáy folder tạo chiều sâu */}
              <div className="absolute bottom-0 inset-x-[2px] h-[2px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent dark:via-amber-500/20 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    // Thumbnail trực tiếp (Image / Video đã sinh thumbnail)
    if (file.thumbnailUrl || (file.type === 'image' && file.url && !file.url.includes('drive.google.com'))) {
      const src = file.thumbnailUrl || file.url;
      return (
        <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-zinc-900">
          <img
            src={src}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          {/* Lớp phủ chuyển sắc nhẹ ở đáy */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Biểu tượng Play cho video */}
          {file.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20 transform group-hover:scale-110 transition-transform">
                <Play size={16} className="fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Tài liệu, Audio, Code hoặc Tệp khác: Hiển thị Card Hero gradient với Icon nổi bật
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br ${info.gradient}`}>
        <div className="relative transform group-hover:scale-110 transition-transform duration-200">
          <IconComponent size={38} className={`${info.accentColor} drop-shadow-sm`} />
        </div>
      </div>
    );
  };

  // ==================== GIAO DIỆN DẠNG LƯỚI (GRID VIEW) ====================
  if (viewMode === 'grid') {
    return (
      <motion.div
        variants={gridItemVariants}
        whileHover={{ y: -4, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.96 }}
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
        className={`group relative bg-white dark:bg-[#121316] rounded-2xl border select-none transition-colors transition-shadow duration-150 cursor-pointer ${
          isSelected && isSelectionMode
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/30 shadow-md'
            : 'border-slate-200/80 dark:border-white/[0.08] hover:border-primary-400/80 dark:hover:border-primary-500/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]'
        } p-2.5 sm:p-3 flex flex-col gap-2.5`}
      >
        {/* VÒNG TRÒN CHECKBOX: CHỈ HIỂN THỊ KHI BẬT NÚT CHỌN (isSelectionMode) */}
        {isSelectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleItemSelection?.(file.id);
            }}
            className={`absolute z-20 top-2.5 left-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isSelected
                ? 'bg-primary-600 text-white scale-100 border-2 border-white dark:border-zinc-900 shadow-md'
                : 'border-2 border-slate-400 dark:border-zinc-500 bg-white/95 dark:bg-zinc-800/95 hover:scale-110'
            }`}
            title={isSelected ? 'Bỏ chọn' : 'Chọn tệp'}
          >
            {isSelected && <Check size={14} className="stroke-[3]" />}
          </div>
        )}

        {/* NÚT 3 CHẤM MENU TÁC VỤ */}
        <div
          className={`absolute z-20 top-2 right-2 transition-opacity flex bg-white/90 dark:bg-zinc-900/90 rounded-xl shadow-sm border border-slate-200/60 dark:border-zinc-700/60 ${
            isSelectionMode ? 'opacity-0 pointer-events-none' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          <button
            aria-label={`Menu cho ${file.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleContextMenu(e, file);
            }}
            className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg min-w-[28px] min-h-[28px] flex items-center justify-center transition"
          >
            <MoreVertical size={15} />
          </button>
        </div>

        {/* KHUNG THUMBNAIL / HERO BANNER */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 dark:border-white/[0.04] relative">
          {renderGridVisual()}

          {/* BADGE LOẠI FILE (Góc dưới bên trái thẻ banner) */}
          <div className="absolute bottom-1.5 left-1.5 z-10">
            <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md border backdrop-blur-md shadow-xs ${info.badgeColor}`}>
              {info.label}
            </span>
          </div>

          {/* ICON KHÓA TẢI (Góc dưới bên phải) */}
          {file.isLocked && (
            <div className="absolute bottom-1.5 right-1.5 z-10 p-1 rounded-md bg-slate-900/80 text-amber-400 backdrop-blur-md shadow-xs" title="Đã khóa tải xuống">
              <LockKeyhole size={11} />
            </div>
          )}
        </div>

        {/* PHẦN CHÂN THẺ: TÊN TỆP VÀ METADATA */}
        <div className="w-full text-left px-0.5">
          {isRenaming ? (
            <form
              onSubmit={(e) => handleRenameSubmit(e, file.id)}
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                type="text"
                value={renameText}
                title={renameText}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setRenameText(e.target.value)}
                onBlur={(e) => handleRenameSubmit(e, file.id)}
                className="w-full min-w-0 text-xs sm:text-sm font-semibold bg-white dark:bg-zinc-900 border border-primary-500 rounded-lg px-2 py-1 focus:outline-none text-slate-800 dark:text-zinc-100"
              />
            </form>
          ) : (
            <p
              className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate w-full group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
              title={file.name}
            >
              {file.name}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // ==================== GIAO DIỆN DẠNG DANH SÁCH (LIST VIEW) ====================
  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ x: 4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
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
      className={`group relative bg-white dark:bg-[#121316] rounded-xl border select-none transition-colors duration-150 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#181a1f] ${
        isSelected && isSelectionMode
          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 ring-1 ring-primary-500/30'
          : 'border-slate-200/80 dark:border-white/[0.08] hover:border-primary-400/80 dark:hover:border-primary-500/50'
      } p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4`}
    >
      {/* CHECKBOX: CHỈ HIỂN THỊ KHI BẬT NÚT CHỌN (isSelectionMode) */}
      {isSelectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleItemSelection?.(file.id);
          }}
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isSelected
              ? 'bg-primary-600 text-white border-2 border-white dark:border-zinc-900 shadow-xs'
              : 'border-2 border-slate-400 dark:border-zinc-500 bg-white dark:bg-zinc-800'
          }`}
        >
          {isSelected && <Check size={12} className="stroke-[3]" />}
        </div>
      )}

      {/* THUMBNAIL / ICON NHỎ */}
      <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/60 dark:border-white/[0.06] ${isFolder ? 'bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900' : `bg-gradient-to-br ${info.gradient}`}`}>
        {isFolder ? (
          /* Mini 3D Folder cho List View */
          <div className="relative w-7 h-6">
            {/* Nắp tab nhỏ */}
            <div className="absolute top-0 left-[3px] w-[40%] h-[4px] bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 rounded-t-sm" />
            {/* Thân folder nhỏ */}
            <div className="absolute inset-x-0 bottom-0 top-[3px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 dark:from-amber-500 dark:to-orange-700 rounded-[4px] shadow-sm shadow-amber-500/20 border border-amber-300/40 dark:border-amber-500/20 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
        ) : file.thumbnailUrl || (file.type === 'image' && file.url && !file.url.includes('drive.google.com')) ? (
          <img
            src={file.thumbnailUrl || file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <IconComponent size={20} className={info.accentColor} />
        )}
      </div>

      {/* TÊN VÀ BADGE */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <form onSubmit={(e) => handleRenameSubmit(e, file.id)} className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              type="text"
              value={renameText}
              title={renameText}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setRenameText(e.target.value)}
              onBlur={(e) => handleRenameSubmit(e, file.id)}
              className="w-full text-xs sm:text-sm font-semibold bg-white dark:bg-zinc-900 border border-primary-500 rounded-lg px-2 py-1 focus:outline-none text-slate-800 dark:text-zinc-100"
            />
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" title={file.name}>
              {file.name}
            </p>
            {file.isLocked && <LockKeyhole size={13} className="text-amber-500 shrink-0" />}
          </div>
        )}
      </div>

      {/* PILL LOẠI TỆP */}
      <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${info.badgeColor} shrink-0`}>
        {info.label}
      </span>

      {/* NÚT 3 CHẤM MENU */}
      <button
        aria-label={`Menu cho ${file.name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleContextMenu(e, file);
        }}
        className="p-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg shrink-0 transition"
      >
        <MoreVertical size={16} />
      </button>
    </motion.div>
  );
}

export default memo(FileItem);