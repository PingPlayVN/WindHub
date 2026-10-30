// src/modules/Entertainment/TaiXiu/components/SoundSettingsModal.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Music, BellRing, Check } from 'lucide-react';

export default function SoundSettingsModal({
  isOpen,
  onClose,
  sfxEnabled,
  onToggleSfx,
  sfxVolume,
  onChangeSfxVolume,
  bgmEnabled,
  onToggleBgm,
  bgmVolume,
  onChangeBgmVolume,
  onTestSound
}) {
  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md rounded-3xl border-2 border-[#D5B46B]/70 bg-gradient-to-b from-[#241712] via-[#171411] to-[#100c09] p-5 sm:p-6 text-[#E8DDC8] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(213,180,107,0.25)] select-none"
        >
          {/* Nút đóng X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-[#D5B46B]/50 bg-[#8E2926]/90 text-[#FAF5EB] hover:bg-[#8E2926] active:scale-95 transition-all"
            aria-label="Đóng cài đặt âm thanh"
          >
            <X size={16} />
          </button>

          {/* Tiêu đề với biểu tượng Đông Sơn */}
          <div className="flex items-center gap-2.5 mb-5 border-b border-[#A87932]/30 pb-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#2b1c15] border border-[#D5B46B]/50 text-[#D5B46B]">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#FAF5EB] uppercase tracking-wide">
                Cài Đặt Âm Thanh
              </h3>
              <p className="text-xs text-[#D5B46B]/80">
                Hiệu ứng gõ đĩa & Nhạc nền Lofi làng quê
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. HIỆU ỨNG ÂM THANH (SFX) */}
            <div className="rounded-2xl border border-[#A87932]/35 bg-[#171411]/80 p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BellRing size={18} className="text-[#D5B46B]" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#FAF5EB]">Hiệu ứng âm thanh (SFX)</h4>
                    <p className="text-[11px] text-[#E8DDC8]/60">Tiếng cược, lắc xúc xắc, mở bát, trúng thưởng</p>
                  </div>
                </div>

                {/* Switch bật/tắt SFX */}
                <button
                  type="button"
                  onClick={onToggleSfx}
                  aria-label="Bật hoặc tắt hiệu ứng âm thanh"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    sfxEnabled ? 'bg-[#D5B46B]' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#171411] shadow ring-0 transition duration-200 ease-in-out ${
                      sfxEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider âm lượng SFX */}
              {sfxEnabled && (
                <div className="mt-3 pt-3 border-t border-[#A87932]/25 flex items-center gap-3">
                  <span className="text-xs text-[#D5B46B] font-mono w-10">
                    {Math.round(sfxVolume * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(e) => onChangeSfxVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#D5B46B] cursor-pointer h-1.5 rounded-lg bg-[#2b1c15]"
                  />
                  <button
                    type="button"
                    onClick={onTestSound}
                    className="shrink-0 rounded-lg border border-[#D5B46B]/40 bg-[#2b1c15] px-2.5 py-1 text-[11px] font-bold text-[#D5B46B] hover:bg-[#3d271c] hover:text-[#FAF5EB] active:scale-95 transition-all"
                  >
                    Thử
                  </button>
                </div>
              )}
            </div>

            {/* 2. NHẠC NỀN LÀNG QUÊ (BGM LOFI) */}
            <div className="rounded-2xl border border-[#A87932]/35 bg-[#171411]/80 p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music size={18} className="text-emerald-400" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#FAF5EB]">Nhạc nền Lofi Làng Quê</h4>
                    <p className="text-[11px] text-[#E8DDC8]/60">Giai điệu dân gian thư giãn, êm dịu</p>
                  </div>
                </div>

                {/* Switch bật/tắt BGM */}
                <button
                  type="button"
                  onClick={onToggleBgm}
                  aria-label="Bật hoặc tắt nhạc nền"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    bgmEnabled ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-[#171411] shadow ring-0 transition duration-200 ease-in-out ${
                      bgmEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider âm lượng BGM */}
              {bgmEnabled && (
                <div className="mt-3 pt-3 border-t border-[#A87932]/25 flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-mono w-10">
                    {Math.round(bgmVolume * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => onChangeBgmVolume(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-[#2b1c15]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Nút Hoàn tất */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D5B46B] to-[#A87932] px-5 py-2 font-black text-[#171411] shadow hover:brightness-110 active:scale-95 transition-all"
            >
              <Check size={16} strokeWidth={3} />
              <span>Xong</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
