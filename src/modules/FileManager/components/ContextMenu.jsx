import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  Edit2,
  Eye,
  FolderInput,
  FolderPlus,
  Link2,
  LockKeyhole,
  Scissors,
  Share2,
  Trash2,
  UnlockKeyhole,
} from 'lucide-react';
import MobileBottomSheet from './MobileBottomSheet';

const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`os-focus-ring flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${
      danger
        ? 'text-[var(--os-danger)] hover:bg-[var(--os-danger-soft)]'
        : 'text-[var(--os-text-primary)] hover:bg-[var(--os-accent-soft)] hover:text-[var(--os-accent)]'
    }`}
  >
    <span className="flex items-center gap-2.5">
      <Icon size={15} />
      <span>{label}</span>
    </span>
    {shortcut && (
      <span className="font-mono text-[10px] text-[var(--os-text-muted)]">{shortcut}</span>
    )}
  </button>
);

const Divider = () => <div className="my-1.5 h-px bg-[var(--os-border-subtle)] mx-2" />;

export default function ContextMenu(props) {
  const {
    contextMenu,
    setContextMenu,
    selectedItems,
    isAdmin,
    handlePreview,
    handleDownload,
    handleCopyLink,
    startRename,
    startEditLink,
    handleToggleLock,
    handleCopy,
    handleCut,
    setShowDeleteModal,
    onCreateFolder,
    onAddLink,
    handlePaste,
    hasClipboard,
    sortBy,
    onSortChange,
    handleShare,
    startMove,
  } = props;

  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: -1000, left: -1000 });
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [prevContextMenu, setPrevContextMenu] = useState(contextMenu);
  if (contextMenu !== prevContextMenu) {
    setPrevContextMenu(contextMenu);
    setIsSortOpen(false);
  }

  useEffect(() => {
    if (!isMobile && contextMenu && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = contextMenu.x;
      let top = contextMenu.y;

      if (left + menuWidth > windowWidth) left = windowWidth - menuWidth - 8;
      if (top + menuHeight > windowHeight) top = windowHeight - menuHeight - 8;

      setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
    } else {
      setPosition({ top: -1000, left: -1000 });
    }
  }, [contextMenu, isMobile]);

  if (!contextMenu) return null;

  if (isMobile) {
    return createPortal(<MobileBottomSheet {...props} />, document.body);
  }

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

  return createPortal(
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          className="os-floating-surface fixed z-[var(--z-context)] max-h-[calc(100vh-1rem)] w-60 overflow-y-auto custom-scrollbar rounded-[var(--radius-lg)] p-1.5 text-[var(--os-text-primary)]"
          style={{
            top: position.top,
            left: position.left,
            visibility: position.top === -1000 ? 'hidden' : 'visible',
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {isFile && !isMulti && (
            <MenuItem icon={Eye} label="Xem trước" onClick={action(() => handlePreview(item))} />
          )}

          {hasItem && !isMulti && (
            <MenuItem icon={Share2} label="Chia sẻ liên kết" onClick={action(() => handleShare(item))} />
          )}

          {isAdmin && hasItem && !isMulti && (
            <MenuItem icon={FolderInput} label="Di chuyển đến..." onClick={action(() => startMove?.(item))} />
          )}

          {isFile && !isMulti && !item.isLocked && (
            <MenuItem icon={Download} label="Tải xuống" onClick={action(() => handleDownload(item))} />
          )}

          {isFile && !isMulti && item.isLocked && (
            <p className="mx-1.5 my-1 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--os-warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--os-warning)]">
              <LockKeyhole size={14} /> Đã khóa tải xuống
            </p>
          )}

          {!isAdmin && !isFile && (
            <p className="px-3 py-2 text-xs text-[var(--os-text-muted)]">Thư mục dùng để điều hướng.</p>
          )}

          {isAdmin && (
            <>
              {!hasItem && (
                <>
                  <MenuItem icon={FolderPlus} label="Tạo thư mục" onClick={action(onCreateFolder)} />
                  <MenuItem icon={Link2} label="Dán liên kết" onClick={action(onAddLink)} />
                  {hasClipboard && (
                    <MenuItem icon={ClipboardPaste} label="Dán sao chép" shortcut="Ctrl+V" onClick={action(handlePaste)} />
                  )}
                </>
              )}

              <div className="px-2.5 py-2">
                <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                  Sắp xếp đồng bộ
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSortOpen(!isSortOpen);
                  }}
                  className="os-focus-ring flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--os-text-primary)] cursor-pointer"
                >
                  <span>
                    {sortBy === 'newest'
                      ? 'Mới nhất'
                      : sortBy === 'oldest'
                      ? 'Cũ nhất'
                      : sortBy === 'name-asc'
                      ? 'Tên A → Z'
                      : 'Tên Z → A'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--os-text-muted)] transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-1 flex flex-col gap-0.5 rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-1"
                    >
                      {[
                        { id: 'newest', label: 'Mới nhất' },
                        { id: 'oldest', label: 'Cũ nhất' },
                        { id: 'name-asc', label: 'Tên A → Z' },
                        { id: 'name-desc', label: 'Tên Z → A' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSortChange(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                            sortBy === opt.id
                              ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)] font-bold'
                              : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <Check size={12} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  label={item.isLocked ? 'Mở khóa tệp' : 'Khóa tệp'}
                  onClick={action(() => handleToggleLock(item))}
                />
              )}
              {isFile && !isMulti && (
                <MenuItem icon={Copy} label="Sao chép liên kết gốc" onClick={action(() => handleCopyLink(item))} />
              )}

              {hasItem && (
                <>
                  <Divider />
                  <MenuItem
                    icon={Copy}
                    label={`Sao chép${isMulti ? ` (${selectedItems.size})` : ''}`}
                    shortcut="Ctrl+C"
                    onClick={action(handleCopy)}
                  />
                  <MenuItem
                    icon={Scissors}
                    label={`Cắt tệp${isMulti ? ` (${selectedItems.size})` : ''}`}
                    shortcut="Ctrl+X"
                    onClick={action(handleCut)}
                  />
                  <Divider />
                  <MenuItem
                    danger
                    icon={Trash2}
                    label={`Xóa${isMulti ? ` (${selectedItems.size})` : ''}`}
                    shortcut="Del"
                    onClick={action(() => setShowDeleteModal(true))}
                  />
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
