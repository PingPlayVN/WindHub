import { useMemo, useState } from 'react';
import { Calculator, Check, Copy, ExternalLink, Share2, Sparkles, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/os/Modal';
import Button from '@/components/os/Button';

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

export default function ToolShareDialog({ tool, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!tool || typeof window === 'undefined') return '';
    return `${window.location.origin}/tools?toolId=${tool.id}`;
  }, [tool]);

  if (!tool) return null;

  const handleCopy = async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      toast.success(`Đã sao chép liên kết truy cập nhanh ${tool.title}!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép liên kết trên thiết bị này');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share !== 'function') {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: tool.title,
        text: `Mở công cụ ${tool.title} trên WindHub`,
        url: shareUrl,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Không thể mở bảng chia sẻ hệ thống');
      }
    }
  };

  const ToolIcon =
    tool.id === 'Casio580Spell' ? Calculator : tool.id === 'ImageArtStudio' ? Sparkles : Wrench;

  return (
    <Modal
      open={Boolean(tool)}
      onClose={onClose}
      title={tool.title}
      subtitle="CHIA SẺ CÔNG CỤ"
      icon={<ToolIcon size={19} />}
      size="md"
    >
      <div className="space-y-4">
        {tool.subtitle && (
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--os-text-secondary)]">
            {tool.subtitle}
          </p>
        )}

        <div>
          <label
            htmlFor="tool-share-link"
            className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)] mb-1.5"
          >
            Liên kết mở trực tiếp
          </label>
          <div className="os-sunken flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] p-1.5 pl-3">
            <input
              id="tool-share-link"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-[var(--os-text-primary)] focus:outline-none"
            />
            <Button
              variant={copied ? 'subtle' : 'secondary'}
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="primary" size="md" onClick={handleNativeShare} icon={<Share2 size={16} />}>
            Chia sẻ ngay
          </Button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="os-focus-ring inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 text-sm font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-3)] transition-colors"
          >
            <ExternalLink size={15} />
            <span>Mở thẻ mới</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}
