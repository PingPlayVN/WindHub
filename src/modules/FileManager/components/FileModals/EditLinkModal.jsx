import { Link as LinkIcon } from 'lucide-react';
import { Button, Modal } from '@/components/os';

export default function EditLinkModal({
  showEditLinkModal,
  setShowEditLinkModal,
  editLinkInput,
  setEditLinkInput,
  handleSaveEditLink,
  isUpdating,
}) {
  return (
    <Modal
      open={Boolean(showEditLinkModal)}
      onClose={() => setShowEditLinkModal(false)}
      size="sm"
      subtitle="Cập nhật tài nguyên"
      title="Sửa liên kết tệp"
      icon={<LinkIcon size={19} />}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowEditLinkModal(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="edit-link-form"
            variant="primary"
            size="sm"
            loading={isUpdating}
            disabled={!editLinkInput.trim() || isUpdating}
          >
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </>
      }
    >
      <form id="edit-link-form" onSubmit={handleSaveEditLink} className="space-y-3">
        <label htmlFor="os-edit-link-input" className="block text-xs font-semibold text-[var(--os-text-secondary)]">
          Đường dẫn mới
        </label>
        <input
          id="os-edit-link-input"
          autoFocus
          type="url"
          value={editLinkInput}
          onChange={(e) => setEditLinkInput(e.target.value)}
          placeholder="https://..."
          required
          className="os-focus-ring h-11 w-full rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-3.5 text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-colors focus:border-[var(--os-accent)]"
        />
      </form>
    </Modal>
  );
}
