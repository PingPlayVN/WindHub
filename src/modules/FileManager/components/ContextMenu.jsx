import { createPortal } from 'react-dom';
import { ClipboardPaste, Copy, Download, Edit2, Eye, FolderPlus, Link2, LockKeyhole, Scissors, Trash2, UnlockKeyhole } from 'lucide-react';

const MenuButton = ({ children, danger = false, onClick }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${danger ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>
    {children}
  </button>
);

const Divider = () => <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />;

export default function ContextMenu({
  contextMenu, setContextMenu, selectedItems, isAdmin,
  handlePreview, handleDownload, handleCopyLink, startRename, startEditLink,
  handleToggleLock, handleCopy, handleCut, setShowDeleteModal,
  onCreateFolder, onAddLink, handlePaste, hasClipboard, sortBy, onSortChange,
}) {
  if (!contextMenu) return null;

  const { item, x, y } = contextMenu;
  const isMulti = selectedItems.size > 1;
  const isFile = item?.type && item.type !== 'folder';
  const hasItem = Boolean(item);
  const close = () => setContextMenu(null);
  const action = (callback) => () => { callback(); close(); };

  return createPortal(
    <div role="menu" className="fixed z-[200] max-h-[calc(100vh-1rem)] w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-2xl dark:border-slate-700 dark:bg-black" style={{ top: y, left: x }} onClick={(event) => event.stopPropagation()}>
      {isFile && !isMulti && (!item.isLocked || isAdmin) && <MenuButton onClick={action(() => handlePreview(item))}><Eye size={16} /> Xem trước</MenuButton>}
      {isFile && !isMulti && (!item.isLocked || isAdmin) && <MenuButton onClick={action(() => handleDownload(item))}><Download size={16} /> Tải xuống</MenuButton>}
      {isFile && !isMulti && item.isLocked && !isAdmin && <p className="px-4 py-2 text-sm text-slate-500">File đã bị khóa.</p>}
      {!isAdmin && !isFile && <p className="px-4 py-2 text-sm text-slate-500">Thư mục chỉ để điều hướng.</p>}

      {isAdmin && <>
        <MenuButton onClick={action(onCreateFolder)}><FolderPlus size={16} /> Tạo thư mục</MenuButton>
        <MenuButton onClick={action(onAddLink)}><Link2 size={16} /> Dán liên kết</MenuButton>
        {hasClipboard && <MenuButton onClick={action(handlePaste)}><ClipboardPaste size={16} /> Dán mục đã sao chép</MenuButton>}
        <div className="px-4 py-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Sắp xếp thư mục</label>
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value)} onClick={(event) => event.stopPropagation()} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name-asc">Tên A–Z</option>
            <option value="name-desc">Tên Z–A</option>
          </select>
        </div>
        <Divider />
        {hasItem && !isMulti && <MenuButton onClick={action(() => startRename(item))}><Edit2 size={16} /> Đổi tên</MenuButton>}
        {isFile && !isMulti && <MenuButton onClick={action(() => startEditLink(item))}><Link2 size={16} /> Sửa liên kết</MenuButton>}
        {isFile && !isMulti && <MenuButton onClick={action(() => handleToggleLock(item))}>{item.isLocked ? <UnlockKeyhole size={16} /> : <LockKeyhole size={16} />}{item.isLocked ? ' Mở khóa file' : ' Khóa file'}</MenuButton>}
        {isFile && !isMulti && <MenuButton onClick={action(() => handleCopyLink(item))}><Copy size={16} /> Sao chép liên kết</MenuButton>}
        {hasItem && <>
          <Divider />
          <MenuButton onClick={action(handleCopy)}><Copy size={16} /> Sao chép{isMulti ? ` (${selectedItems.size})` : ''}</MenuButton>
          <MenuButton onClick={action(handleCut)}><Scissors size={16} /> Cắt{isMulti ? ` (${selectedItems.size})` : ''}</MenuButton>
          <Divider />
          <MenuButton danger onClick={action(() => setShowDeleteModal(true))}><Trash2 size={16} /> Xóa{isMulti ? ` (${selectedItems.size})` : ''}</MenuButton>
        </>}
      </>}
    </div>,
    document.body,
  );
}
