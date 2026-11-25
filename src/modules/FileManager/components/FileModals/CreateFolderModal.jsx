import { FolderPlus } from 'lucide-react';
import { Button, Modal } from '@/components/os';

export default function CreateFolderModal({
  showFolderModal,
  setShowFolderModal,
  folderName,
  setFolderName,
  handleCreateFolder,
  isCreating,
}) {
  return (
    <Modal
      open={Boolean(showFolderModal)}
      onClose={() => setShowFolderModal(false)}
      size="sm"
      subtitle="WindOS Drive"
      title="Tạo thư mục mới"
      icon={<FolderPlus size={19} />}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowFolderModal(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-folder-form"
            variant="primary"
            size="sm"
            loading={isCreating}
            disabled={!folderName.trim() || isCreating}
          >
            {isCreating ? 'Đang tạo...' : 'Tạo thư mục'}
          </Button>
        </>
      }
    >
      <form id="create-folder-form" onSubmit={handleCreateFolder} className="space-y-3">
        <label htmlFor="os-folder-name-input" className="block text-xs font-semibold text-[var(--os-text-secondary)]">
          Tên thư mục hiển thị
        </label>
        <input
          id="os-folder-name-input"
          autoFocus
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Nhập tên thư mục..."
          className="os-focus-ring h-11 w-full rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-3.5 text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-colors focus:border-[var(--os-accent)]"
        />
      </form>
    </Modal>
  );
}
