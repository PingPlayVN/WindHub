import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardPaste, Copy, Download, Edit2, Eye, FolderPlus, Link2, 
  LockKeyhole, Scissors, Trash2, UnlockKeyhole, ChevronDown, Check, Share2
} from 'lucide-react';

const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-slate-300 hover:bg-primary-500/15 hover:text-primary-400'}`}>
    <span className="flex items-center gap-3"><Icon size={16} /><span>{label}</span></span>
    {shortcut && <span className="text-xs text-slate-600 font-mono tracking-widest">{shortcut}</span>}
  </button>
);

const Divider = () => <div className="h-px bg-white/10 my-1.5 mx-3" />;

export default function ContextMenu({
  contextMenu, setContextMenu, selectedItems, isAdmin,
  handlePreview, handleDownload, handleCopyLink, startRename, startEditLink,
  handleToggleLock, handleCopy, handleCut, setShowDeleteModal,
  onCreateFolder, onAddLink, handlePaste, hasClipboard, sortBy, onSortChange,
  handleShare
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: -1000, left: -1000 });
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Lưu lại giá trị contextMenu của lần render trước
  const [prevContextMenu, setPrevContextMenu] = useState(contextMenu);
  
  // Nếu contextMenu thay đổi (người dùng click chỗ khác hoặc đóng menu)
  if (contextMenu !== prevContextMenu) {
    setPrevContextMenu(contextMenu); // Cập nhật lại giá trị đối chiếu
    setIsSortOpen(false);            // Reset state ngay lập tức trong lần render này
  }

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
          {isFile && !isMulti && (
            <MenuItem icon={Eye} label="Xem trước" onClick={action(() => handlePreview(item))} />
          )}

          {/* NÚT CHIA SẺ MỚI (Bất kỳ ai cũng có thể copy link chia sẻ) */}
          {hasItem && !isMulti && (
            <MenuItem icon={Share2} label="Chia sẻ liên kết" onClick={action(() => handleShare(item))} />
          )}
          
          {/* LUẬT MỚI: Nếu file bị khóa, KHÔNG AI được tải xuống (Kể cả Admin) */}
          {isFile && !isMulti && !item.isLocked && (
            <MenuItem icon={Download} label="Tải xuống" onClick={action(() => handleDownload(item))} />
          )}
          
          {/* Báo hiệu File bị khóa cực trực quan */}
          {isFile && !isMulti && item.isLocked && (
            <p className="px-4 py-2 text-xs font-medium text-amber-500 bg-amber-500/10 rounded-lg mx-2 mb-1.5 flex items-center gap-2">
              <LockKeyhole size={14} /> Đã khóa tải xuống
            </p>
          )}

          {!isAdmin && !isFile && (
            <p className="px-4 py-2 text-sm text-slate-500">Thư mục chỉ để điều hướng.</p>
          )}

          {/* CÁC CHỨC NĂNG DÀNH RIÊNG CHO ADMIN */}
          {isAdmin && (
            <>
              {/* CHỈ HIỆN KHI CLICK VÀO VÙNG TRỐNG (!hasItem) */}
              {!hasItem && (
                <>
                  <MenuItem icon={FolderPlus} label="Tạo thư mục" onClick={action(onCreateFolder)} />
                  <MenuItem icon={Link2} label="Dán liên kết" onClick={action(onAddLink)} />
                  {hasClipboard && (
                    <MenuItem icon={ClipboardPaste} label="Dán sao chép" shortcut="Ctrl+V" onClick={action(handlePaste)} />
                  )}
                </>
              )}

              {/* Box Sắp xếp - Giao diện Custom Accordion */}
                <div className="px-4 py-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Sắp xếp</label>
                  <div className="relative">
                    {/* Nút Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn context menu đóng lại
                        setIsSortOpen(!isSortOpen);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg border bg-[#111] px-3 py-2 text-sm text-slate-300 outline-none transition-colors ${
                        isSortOpen 
                          ? 'border-primary-500 ring-1 ring-primary-500/50' 
                          : 'border-slate-800 hover:border-primary-500/50'
                      }`}
                    >
                      <span>
                        {sortBy === 'newest' ? 'Mới nhất' : sortBy === 'oldest' ? 'Cũ nhất' : sortBy === 'name-asc' ? 'Tên A-Z' : 'Tên Z-A'}
                      </span>
                      <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-slate-500" />
                      </motion.div>
                    </button>

                    {/* Menu tùy chọn Accordion */}
                    <AnimatePresence>
                      {isSortOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 flex flex-col gap-1 rounded-lg border border-slate-800/80 bg-[#0a0a0a] p-1 shadow-inner">
                            {[
                              { id: 'newest', label: 'Mới nhất' },
                              { id: 'oldest', label: 'Cũ nhất' },
                              { id: 'name-asc', label: 'Tên A-Z' },
                              { id: 'name-desc', label: 'Tên Z-A' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSortChange(opt.id);
                                  setIsSortOpen(false); // Chọn xong tự động thu gọn
                                }}
                                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                                  sortBy === opt.id
                                    ? 'bg-primary-500/15 text-primary-400'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                                {sortBy === opt.id && <Check size={12} className="text-primary-500" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
