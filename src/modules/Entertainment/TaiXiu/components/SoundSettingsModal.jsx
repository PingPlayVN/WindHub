// src/modules/Entertainment/TaiXiu/components/SoundSettingsModal.jsx
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
          className="relative z-10 w-full max-w-md rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-[#24130d] via-[#160c07] to-[#0d0705] p-6 text-amber-50 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(245,158,11,0.25)]"
        >
          {/* Nút đóng X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-amber-500/40 bg-amber-950/80 text-amber-300 hover:bg-amber-800 transition"
          >
            <X size={16} />
          </button>

          {/* Tiêu đề */}
          <div className="flex items-center gap-2.5 mb-5 border-b border-amber-700/40 pb-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-200 uppercase tracking-wide">
                Cài Đặt Âm Thanh
              </h3>
              <p className="text-xs text-amber-400/70">
                Điều chỉnh âm lượng hiệu ứng & nhạc nền
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* 1. HIỆU ỨNG ÂM THANH (SFX / VFX) */}
            <div className="rounded-2xl border border-amber-600/30 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BellRing size={18} className="text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">Hiệu ứng (SFX / VFX)</h4>
                    <p className="text-[11px] text-amber-400/60">Tiếng cược, lắc xúc xắc, mở bát, trúng thưởng</p>
                  </div>
                </div>

                {/* Switch bật/tắt SFX */}
                <button
                  type="button"
                  onClick={onToggleSfx}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    sfxEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sfxEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider âm lượng SFX */}
              {sfxEnabled && (
                <div className="mt-3 pt-3 border-t border-amber-800/30 flex items-center gap-3">
                  <span className="text-xs text-amber-300/80 font-mono w-10">{Math.round(sfxVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(e) => onChangeSfxVolume(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-amber-950/80"
                  />
                  <button
                    type="button"
                    onClick={onTestSound}
                    className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/60 px-2 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-900/60 transition"
                  >
                    Thử
                  </button>
                </div>
              )}
            </div>

            {/* 2. NHẠC NỀN LÀNG QUÊ (BGM LOFI) */}
            <div className="rounded-2xl border border-amber-600/30 bg-black/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music size={18} className="text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">Nhạc nền Lofi Làng Quê</h4>
                    <p className="text-[11px] text-amber-400/60">Giai điệu lofi Việt Nam thư giãn, êm dịu</p>
                  </div>
                </div>

                {/* Switch bật/tắt BGM */}
                <button
                  type="button"
                  onClick={onToggleBgm}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    bgmEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      bgmEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slider âm lượng BGM */}
              {bgmEnabled && (
                <div className="mt-3 pt-3 border-t border-amber-800/30 flex items-center gap-3">
                  <span className="text-xs text-amber-300/80 font-mono w-10">{Math.round(bgmVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => onChangeBgmVolume(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-amber-950/80"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Nút Hoàn tất */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 shadow hover:bg-amber-400 transition"
            >
              <Check size={16} />
              <span>Xong</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
