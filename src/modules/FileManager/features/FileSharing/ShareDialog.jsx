import { Check, Copy, ExternalLink, File, Folder, Share2 } from 'lucide-react';
import { Button, IconButton, Modal } from '@/components/os';

export default function ShareDialog({ item, url, onClose, onCopy, onShare }) {
  const isFolder = item?.type === 'folder';
  const ItemIcon = isFolder ? Folder : File;

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      size="md"
      subtitle={`Chia sẻ ${isFolder ? 'thư mục' : 'tệp'}`}
      title={item?.name || 'Chia sẻ tài nguyên'}
      icon={<ItemIcon size={19} />}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="share-link"
            className="block text-xs font-semibold text-[var(--os-text-secondary)] mb-2"
          >
            Liên kết truy cập trực tiếp
          </label>
          <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] p-1.5 pl-3">
            <input
              id="share-link"
              readOnly
              value={url || ''}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-mono text-[var(--os-text-primary)] outline-none"
            />
            <IconButton
              label="Sao chép liên kết"
              size="sm"
              variant="outline"
              onClick={onCopy}
            >
              <Copy size={15} />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="primary"
            iconLeft={<Share2 size={16} />}
            onClick={onShare}
            className="w-full"
          >
            Chia sẻ ngay
          </Button>
          <a
            href={url || '#'}
            target="_blank"
            rel="noreferrer"
            className="os-focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-4 text-sm font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-hover)] hover:border-[var(--os-border-strong)] transition-all"
          >
            <ExternalLink size={15} />
            <span>Mở thử</span>
          </a>
        </div>

        <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-emerald-500/20 bg-[var(--os-success-soft)] px-3 py-2.5 text-xs leading-relaxed text-[var(--os-text-secondary)]">
          <Check size={14} className="mt-0.5 shrink-0 text-[var(--os-success)]" />
          <span>
            Người nhận mở liên kết sẽ được điều hướng thẳng đến{' '}
            {isFolder ? 'thư mục này' : 'bản xem trước của tệp'} trong WindHub.
          </span>
        </p>
      </div>
    </Modal>
  );
}
