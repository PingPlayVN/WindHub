import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Share2, Wrench, X, Calculator, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (!tool) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, onClose]);

  const shareUrl = useMemo(() => {
    if (!tool) return '';
    const origin = window.location.origin;
    return `${origin}/tools?toolId=${tool.id}`;
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

  const ToolIcon = tool.id === 'Casio580Spell' ? Calculator : tool.id === 'ImageArtStudio' ? Sparkles : Wrench;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Đóng hộp thoại chia sẻ"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 border-0 bg-black/75 backdrop-blur-sm"
        />
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="tool-share-title"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#10141d] p-5 text-slate-100 shadow-2xl sm:p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                <ToolIcon size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Chia sẻ công cụ
                </p>
                <h2 id="tool-share-title" className="truncate font-bold text-white text-base sm:text-lg">
                  {tool.title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subtitle / Description if present */}
          {tool.subtitle && (
            <p className="mt-2.5 text-xs text-slate-400 leading-relaxed font-mono">
              {tool.subtitle}
            </p>
          )}

          {/* Link Container */}
          <label htmlFor="tool-share-link" className="mt-4 block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
            Liên kết truy cập trực tiếp
          </label>
          <div className="mt-1.5 flex min-w-0 items-center gap-2 rounded-xl border border-slate-700/90 bg-black/40 p-2 font-mono text-xs">
            <input
              id="tool-share-link"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent px-1.5 text-xs text-slate-300 outline-none font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép liên kết"
              aria-label="Sao chép liên kết"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition text-xs font-bold"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3 text-sm font-bold text-white transition shadow-sm active:scale-95"
            >
              <Share2 size={16} /> Chia sẻ
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 px-3 text-sm font-semibold text-slate-200 transition active:scale-95"
            >
              <ExternalLink size={16} /> Mở thử
            </a>
          </div>

          {/* Feature tip note */}
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-400 border-t border-slate-800/80 pt-3">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            <span>Người nhận mở link sẽ được đưa thẳng vào công cụ này trong WindHub mà không cần tìm kiếm.</span>
          </p>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
