import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '@/components/os';

export default function DeleteModal({ fileToDelete, setFileToDelete, confirmDelete }) {
  return (
    <Modal
      open={Boolean(fileToDelete)}
      onClose={() => setFileToDelete(null)}
      size="sm"
      subtitle="Cảnh báo hệ thống"
      title="Xác nhận xóa tài nguyên?"
      icon={<AlertTriangle size={19} className="text-[var(--os-danger)]" />}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setFileToDelete(null)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDelete}>
            Xóa vĩnh viễn
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-[var(--os-text-secondary)]">
        <p className="leading-relaxed">
          Bạn sắp xóa vĩnh viễn mục dưới đây khỏi kho lưu trữ đám mây. Hành động này không thể hoàn tác.
        </p>
        {fileToDelete?.name && (
          <div className="rounded-[var(--radius-md)] border border-red-500/25 bg-[var(--os-danger-soft)] px-3.5 py-2.5 font-semibold text-[var(--os-text-primary)] break-all">
            {fileToDelete.name}
          </div>
        )}
      </div>
    </Modal>
  );
}
