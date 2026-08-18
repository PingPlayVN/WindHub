// src/modules/FileManager/components/FileItem.jsx
import { motion } from 'framer-motion';
import { MoreVertical, LockKeyhole } from 'lucide-react';
import { useRef, useState } from 'react';

export default function FileItem({
  file, viewMode, isSelected, isRenaming, renameText, setRenameText, handleRenameSubmit,
  handleDragStart, handleDragOver, handleDrop, handleItemClick, handleContextMenu, getFileIcon
}) {
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const nameRef = useRef(null);

  const handleCardEnter = () => {
    const nameElement = nameRef.current;
    if (!nameElement) return;
    const overflow = nameElement.scrollWidth - nameElement.clientWidth;
    setMarqueeDistance(overflow > 0 ? nameElement.scrollWidth + 32 : 0);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.85 }} 
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 28 },
        default: { duration: 0.25, ease: "easeOut" }
      }}
      draggable={true}
      onDragStart={(e) => handleDragStart(e, file)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, file)}
      onMouseEnter={handleCardEnter}
      onMouseLeave={() => setMarqueeDistance(0)}
      onClick={(e) => { e.stopPropagation(); handleItemClick(e, file); }}
      onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, file); }}
      className={`group relative bg-slate-50 dark:bg-slate-800/50 border-2 ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md' : 'border-transparent hover:border-primary-300 dark:hover:border-primary-700'} rounded-xl transition-colors select-none ${viewMode === 'grid' ? 'p-4 flex flex-col items-center gap-3' : 'p-3 flex flex-row items-center gap-4'}`}
    >
      <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm z-10 ${viewMode === 'grid' ? 'top-2 right-2' : 'right-4'}`}>
        <button aria-label={`Mở menu cho ${file.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleContextMenu(e, file); }} className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
          <MoreVertical size={16} />
        </button>
      </div>
      
      {file.isLocked && (
        <div className={`absolute z-10 rounded-lg bg-slate-900/80 p-1.5 text-white shadow-sm ${viewMode === 'grid' ? 'top-2 left-2' : 'left-3'}`}>
          <LockKeyhole size={14} />
        </div>
      )}

      <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-12 h-12 shrink-0'} flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${file.type === 'folder' ? 'cursor-pointer' : 'cursor-default'}`}>
        
        {/* NẾU ĐÃ CÓ THUMBNAIL (Bất kể Video, Ảnh hay Tài liệu) -> HIỂN THỊ */}
        {file.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover bg-white dark:bg-[#111]" loading="lazy" />
          </div>
        ) 
        /* NẾU LÀ ẢNH THƯỜNG (Link direct đuôi .jpg, .png không phải GG Drive) -> Tải trực tiếp */
        : file.type === 'image' && !file.url.includes('drive.google.com') && !file.url.includes('docs.google.com') ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover bg-white dark:bg-[#111]" loading="lazy" decoding="async" />
        )
        
        /* NẾU ĐÃ CÓ THUMBNAIL TỪ DATABASE (Video, PDF đã được người trước xem) */
        : file.type === 'video' && file.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
            {/* Chèn một lớp overlay mờ mờ và Icon gốc góc nhỏ để người dùng biết đây là file gì */}
          </div>
        ) 
        
        /* CÒN LẠI (Chưa có thumbnail hoặc là folder) -> Hiển thị icon mặc định */
        : (
          getFileIcon(file.type)
        )}

      </div>

      <div className={`${viewMode === 'grid' ? 'w-full text-center' : 'flex-1 text-left min-w-0'} `}>
        {isRenaming ? (
          <form onSubmit={(e) => handleRenameSubmit(e, file.id)} className={viewMode === 'grid' ? 'w-full' : 'max-w-xs'}>
            <input autoFocus type="text" value={renameText} title={renameText} onFocus={(e) => e.currentTarget.select()} onChange={e => setRenameText(e.target.value)} onBlur={(e) => handleRenameSubmit(e, file.id)} className={`w-full min-w-0 text-sm font-medium bg-white dark:bg-slate-900 border border-blue-500 rounded px-2 py-1 focus:outline-none ${viewMode === 'grid' ? 'text-center' : 'text-left'}`} />
          </form>
        ) : (
          <div ref={nameRef} className="overflow-hidden whitespace-nowrap px-1 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200" title={file.name}>
            <span style={{ '--marquee-distance': `-${marqueeDistance}px` }} className={marqueeDistance > 0 ? 'file-name-marquee file-name-marquee--active' : 'file-name-marquee'}><span>{file.name}</span>{marqueeDistance > 0 && <span aria-hidden="true">{file.name}</span>}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
