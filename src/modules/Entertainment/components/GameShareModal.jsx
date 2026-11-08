// src/modules/Entertainment/components/GameShareModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Share2, X, Dices } from 'lucide-react';
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

export default function GameShareModal({
  isOpen = false,
  onClose,
  gameTitle = 'Tài Xỉu Dân Gian',
  roomTitle = 'Bàn Xóm Đình (50s)',
  shareUrl = '',
  description = 'Mời bạn bè cùng vào chung bàn cược thời gian thực, soi cầu và thử vận may!'
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const targetUrl = useMemo(() => {
    if (shareUrl) return shareUrl;
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, [shareUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await copyText(targetUrl);
      setCopied(true);
      toast.success('Đã sao chép liên kết bàn chơi thành công!');
      setTimeout(() => setCopied(false), 2200);
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
        title: `${gameTitle} - ${roomTitle}`,
        text: `${description}\nTham gia ngay tại:`,
        url: targetUrl,
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('Không thể mở hộp thoại chia sẻ của hệ thống');
      }
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
        {/* Backdrop mờ nền */}
        <motion.button
          type="button"
          aria-label="Đóng hộp thoại chia sẻ"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 border-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        />

        {/* Khung Hộp thoại chia sẻ mang phong cách Đông Sơn Bronze */}
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-share-dialog-title"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-[#A87932]/60 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-5 sm:p-6 text-[#E8DDC8] shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#D5B46B]/50 bg-gradient-to-br from-[#8E2926]/40 to-[#A87932]/30 text-[#D5B46B] shadow-inner">
                <Dices size={22} className="animate-pulse" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D5B46B]">
                    Chia sẻ bàn chơi
                  </span>
                  {roomTitle && (
                    <span className="inline-flex items-center rounded-full bg-[#8E2926]/40 border border-[#8E2926] px-2 py-0.5 text-[9px] font-black text-[#FAF5EB]">
                      {roomTitle}
                    </span>
                  )}
                </div>
                <h2 id="game-share-dialog-title" className="truncate font-black text-white text-base sm:text-lg">
                  {gameTitle}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-xl p-2 text-[#E8DDC8]/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Lời nhắn mời gọi */}
          {description && (
            <p className="mt-3 text-xs text-[#E8DDC8]/80 leading-relaxed font-sans">
              {description}
            </p>
          )}

          {/* Khung Liên kết chia sẻ */}
          <label htmlFor="game-share-link-input" className="mt-4 block text-[11px] font-mono font-bold text-[#D5B46B] uppercase tracking-wider">
            Liên kết truy cập trực tiếp
          </label>
          <div className="mt-1.5 flex min-w-0 items-center gap-2 rounded-xl border border-[#A87932]/50 bg-[#0e0c0a]/90 p-2 font-mono text-xs shadow-inner">
            <input
              id="game-share-link-input"
              readOnly
              value={targetUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent px-1.5 text-xs text-[#E8DDC8] outline-none font-mono selection:bg-[#D5B46B]/30"
            />
            <button
              type="button"
              onClick={handleCopy}
              title="Sao chép liên kết"
              aria-label="Sao chép liên kết"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] hover:brightness-110 border border-[#FAF5EB]/30 transition text-xs font-black shadow-xs active:scale-95 shrink-0"
            >
              {copied ? <Check size={14} className="text-black" /> : <Copy size={14} />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Các nút hành động chính */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D5B46B] via-[#E6C67E] to-[#A87932] hover:brightness-110 px-3 text-sm font-black text-[#171411] transition shadow-md active:scale-95"
            >
              <Share2 size={16} /> Chia sẻ ngay
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#A87932]/50 bg-[#251913] hover:bg-[#342219] hover:border-[#D5B46B] px-3 text-sm font-bold text-[#FAF5EB] transition active:scale-95"
            >
              <ExternalLink size={16} /> Mở thử
            </a>
          </div>

          {/* Ghi chú hướng dẫn */}
          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#E8DDC8]/70 border-t border-[#A87932]/25 pt-3">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            <span>
              Người nhận mở liên kết sẽ được đưa thẳng vào bàn chơi <strong className="text-[#D5B46B] font-semibold">{roomTitle}</strong> trong WindHub để cùng cược và soi cầu trực tuyến.
            </span>
          </div>
        </motion.section>
      </div>
    </AnimatePresence>,
    document.body
  );
}

