import { useState } from 'react';
import { ArrowRight, Folder, FolderCheck, FolderInput } from 'lucide-react';
import { Button, Modal } from '@/components/os';
import { getDescendantIds } from '../../utils/fileUtils';

export default function MoveToModal({
  showMoveModal,
  setShowMoveModal,
  itemsToMove = [],
  allFiles = [],
  handleMoveSubmit,
  activeTabRootId,
}) {
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invalidIds = new Set(getDescendantIds(allFiles, itemsToMove.map((i) => i.id)));
  const availableFolders = allFiles.filter(
    (f) => f.type === 'folder' && !invalidIds.has(f.id)
  );

  const handleConfirm = async () => {
    if (!selectedTargetId) return;
    setIsSubmitting(true);
    try {
      await handleMoveSubmit(selectedTargetId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(showMoveModal)}
      onClose={() => setShowMoveModal(false)}
      size="md"
      subtitle={`Đang chọn ${itemsToMove.length} mục`}
      title="Di chuyển tài nguyên"
      icon={<FolderInput size={19} />}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowMoveModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!selectedTargetId || isSubmitting}
            iconRight={<ArrowRight size={15} />}
            onClick={handleConfirm}
          >
            {isSubmitting ? 'Đang chuyển...' : 'Chuyển vào đây'}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--os-text-muted)] mb-2.5">
          Chọn thư mục đích
        </p>

        {activeTabRootId && (
          <button
            type="button"
            onClick={() => setSelectedTargetId(activeTabRootId)}
            className={`os-focus-ring w-full flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all ${
              selectedTargetId === activeTabRootId
                ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] font-semibold'
                : 'border-[var(--os-border)] bg-[var(--os-surface-2)]/60 text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-amber-500/12 text-amber-500 border border-amber-500/20">
                <Folder size={18} />
              </span>
              <span className="truncate text-sm">Thư mục gốc (Root)</span>
            </div>
            {selectedTargetId === activeTabRootId && (
              <FolderCheck className="shrink-0 text-[var(--os-accent)]" size={18} />
            )}
          </button>
        )}

        {availableFolders.map((folder) => {
          const isSelected = selectedTargetId === folder.id;
          const isCurrentParent = itemsToMove.every((i) => i.parentId === folder.id);

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedTargetId(folder.id)}
              className={`os-focus-ring w-full flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-all ${
                isSelected
                  ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] font-semibold'
                  : 'border-[var(--os-border)] bg-[var(--os-surface-2)]/60 text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-sky-500/12 text-sky-500 border border-sky-500/20">
                  <Folder size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{folder.name}</p>
                  {isCurrentParent && (
                    <span className="text-[11px] font-medium text-amber-500 block">
                      Thư mục hiện tại
                    </span>
                  )}
                </div>
              </div>
              {isSelected && <FolderCheck className="shrink-0 text-[var(--os-accent)]" size={18} />}
            </button>
          );
        })}

        {availableFolders.length === 0 && !activeTabRootId && (
          <p className="text-center text-xs text-[var(--os-text-muted)] py-8">
            Không có thư mục đích nào khả dụng.
          </p>
        )}
      </div>
    </Modal>
  );
}
