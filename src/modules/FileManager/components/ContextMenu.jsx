import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPaste, Copy, Download, Edit2, Eye, FolderPlus, Link2, LockKeyhole, Scissors, Trash2, UnlockKeyhole } from 'lucide-react';

export default function ContextMenu({
  contextMenu, setContextMenu, selectedItems, isAdmin,
  handlePreview, handleDownload, handleCopyLink, startRename, startEditLink,
  handleToggleLock, handleCopy, handleCut, setShowDeleteModal,
  onCreateFolder, onAddLink, handlePaste, hasClipboard, sortBy, onSortChange,
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: -1000, left: -1000 });

  // Thuật toán chống tràn màn hình
  useEffect(() => {
    if (contextMenu && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = contextMenu.x;
      let top = contextMenu.y;

      if (left + menuWidth > windowWidth) left = windowWidth - menuWidth - 8;
      if (top + menuHeight > windowHeight) top = windowHeight - menuHeight - 8;

      setPosition({ top, left });
    } else {
      setPosition({ top: -1000, left: -1000 });
    }
  }, [contextMenu]);

  if (!contextMenu) return null;

  const { item } = contextMenu;
  const isMulti = selectedItems && selectedItems.size > 1;
  const isFile = item?.type && item.type !== 'folder';
  const hasItem = Boolean(item);

  const close = () => setContextMenu(null);
  const action = (callback) => (e) => {
    e?.stopPropagation();
    callback();
    close();
  };

  // Nút bấm đồng nhất giao diện Dark Hacker
  const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-slate-300 hover:bg-primary-500/15 hover:text-primary-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-xs text-slate-600 font-mono tracking-widest">{shortcut}</span>}
    </button>
  );

  const Divider = () => <div className="h-px bg-white/10 my-1.5 mx-3" />;

  // Dùng createPortal để menu luôn đè lên trên cùng, không bị giới hạn bởi component cha
  return createPortal(
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-[200] max-h-[calc(100vh-1rem)] w-60 overflow-y-auto bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 custom-scrollbar"
          style={{ top: position.top, left: position.left, visibility: position.top === -1000 ? 'hidden' : 'visible' }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* QUYỀN LỢI CHO USER THƯỜNG */}
          {isFile && !isMulti && (!item.isLocked || isAdmin) && (
            <MenuItem icon={Eye} label="Xem trước" onClick={action(() => handlePreview(item))} />
          )}
          {isFile && !isMulti && (!item.isLocked || isAdmin) && (
            <MenuItem icon={Download} label="Tải xuống" onClick={action(() => handleDownload(item))} />
          )}
          
          {isFile && !isMulti && item.isLocked && !isAdmin && (
            <p className="px-4 py-2 text-sm text-slate-500">File đã bị khóa.</p>
          )}
          
          {!isAdmin && !isFile && (
            <p className="px-4 py-2 text-sm text-slate-500">Thư mục chỉ để điều hướng.</p>
          )}

          {/* CÁC CHỨC NĂNG DÀNH RIÊNG CHO ADMIN */}
          {isAdmin && (
            <>
              {/* Click vào nền trống (hasItem = false) vẫn hiển thị chức năng này */}
              <MenuItem icon={FolderPlus} label="Tạo thư mục" onClick={action(onCreateFolder)} />
              <MenuItem icon={Link2} label="Dán liên kết" onClick={action(onAddLink)} />
              {hasClipboard && (
                <MenuItem icon={ClipboardPaste} label="Dán mục đã sao chép" shortcut="Ctrl+V" onClick={action(handlePaste)} />
              )}

              {/* Box Sắp xếp - Đã được thiết kế lại chuẩn Dark */}
              <div className="px-4 py-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Sắp xếp thư mục</label>
                <select
                  value={sortBy}
                  onChange={(event) => onSortChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full rounded-lg border border-slate-800 bg-[#111] px-2 py-2 text-sm text-slate-300 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="name-asc">Tên A–Z</option>
                  <option value="name-desc">Tên Z–A</option>
                </select>
              </div>

              <Divider />

              {hasItem && !isMulti && (
                <MenuItem icon={Edit2} label="Đổi tên" shortcut="F2" onClick={action(() => startRename(item))} />
              )}
              {isFile && !isMulti && (
                <MenuItem icon={Link2} label="Sửa liên kết" onClick={action(() => startEditLink(item))} />
              )}
              {isFile && !isMulti && (
                <MenuItem 
                  icon={item.isLocked ? UnlockKeyhole : LockKeyhole} 
                  label={item.isLocked ? 'Mở khóa file' : 'Khóa file'} 
                  onClick={action(() => handleToggleLock(item))} 
                />
              )}
              {isFile && !isMulti && (
                <MenuItem icon={Copy} label="Sao chép liên kết" onClick={action(() => handleCopyLink(item))} />
              )}

              {hasItem && (
                <>
                  <Divider />
                  <MenuItem icon={Copy} label={`Sao chép${isMulti ? ` (${selectedItems.size})` : ''}`} shortcut="Ctrl+C" onClick={action(handleCopy)} />
                  <MenuItem icon={Scissors} label={`Cắt tệp${isMulti ? ` (${selectedItems.size})` : ''}`} shortcut="Ctrl+X" onClick={action(handleCut)} />
                  <Divider />
                  <MenuItem danger icon={Trash2} label={`Xóa${isMulti ? ` (${selectedItems.size})` : ''}`} shortcut="Del" onClick={action(() => setShowDeleteModal(true))} />
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}