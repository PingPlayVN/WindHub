import { Link as LinkIcon } from 'lucide-react';
import { Button, Modal } from '@/components/os';

export default function AddLinkModal({
  showLinkModal,
  setShowLinkModal,
  linkInput,
  setLinkInput,
  handleAddLink,
  isCreating,
}) {
  return (
    <Modal
      open={Boolean(showLinkModal)}
      onClose={() => setShowLinkModal(false)}
      size="sm"
      subtitle="Liên kết đám mây"
      title="Dán liên kết tệp"
      icon={<LinkIcon size={19} />}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowLinkModal(false)}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="add-link-form"
            variant="primary"
            size="sm"
            loading={isCreating}
            disabled={!linkInput.trim() || isCreating}
          >
            {isCreating ? 'Đang lưu...' : 'Lưu liên kết'}
          </Button>
        </>
      }
    >
      <form id="add-link-form" onSubmit={handleAddLink} className="space-y-3">
        <label htmlFor="os-add-link-input" className="block text-xs font-semibold text-[var(--os-text-secondary)]">
          Địa chỉ URL trực tiếp
        </label>
        <input
          id="os-add-link-input"
          autoFocus
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="https://..."
          required
          className="os-focus-ring h-11 w-full rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-3.5 text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] transition-colors focus:border-[var(--os-accent)]"
        />
        <p className="text-xs leading-relaxed text-[var(--os-text-muted)]">
          Hỗ trợ liên kết tài liệu, video, trang web hoặc tài nguyên chia sẻ công khai.
        </p>
      </form>
    </Modal>
  );
}
