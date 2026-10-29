// src/modules/Entertainment/TaiXiu/components/DicePlate.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Flame, Hand, Move } from 'lucide-react';

// Render mặt xúc xắc chấm chuẩn truyền thống Á Đông (Mặt 1 và 4 chấm đỏ)
function DiceFace({ value, size = 'md' }) {
  const dotClass = (isRed) =>
    `rounded-full shadow-inner ${isRed ? 'bg-red-600' : 'bg-slate-900 dark:bg-black'}`;

  const dim = size === 'lg' ? 'size-14 sm:size-16' : 'size-12 sm:size-14';

  const renderDots = () => {
    switch (value) {
      case 1:
        return (
          <div className="flex items-center justify-center h-full w-full">
            <span className={`size-5 sm:size-6 ${dotClass(true)}`} />
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between h-full w-full p-2">
            <span className={`size-2.5 sm:size-3 self-start ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 self-end ${dotClass(false)}`} />
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between h-full w-full p-2">
            <span className={`size-2.5 sm:size-3 self-start ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 self-center ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 self-end ${dotClass(false)}`} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 place-content-between h-full w-full p-2">
            <span className={`size-2.5 sm:size-3 ${dotClass(true)}`} />
            <span className={`size-2.5 sm:size-3 justify-self-end ${dotClass(true)}`} />
            <span className={`size-2.5 sm:size-3 ${dotClass(true)}`} />
            <span className={`size-2.5 sm:size-3 justify-self-end ${dotClass(true)}`} />
          </div>
        );
      case 5:
        return (
          <div className="relative h-full w-full p-2 flex flex-col justify-between">
            <div className="flex justify-between">
              <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
              <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
            </div>
            <span className={`size-2.5 sm:size-3 self-center ${dotClass(false)}`} />
            <div className="flex justify-between">
              <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
              <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 place-content-between h-full w-full p-2">
            <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 justify-self-end ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 justify-self-end ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 ${dotClass(false)}`} />
            <span className={`size-2.5 sm:size-3 justify-self-end ${dotClass(false)}`} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`${dim} rounded-2xl border-2 border-amber-200/80 bg-gradient-to-b from-white via-slate-50 to-amber-50 shadow-[0_4px_12px_rgba(0,0,0,0.35)] relative overflow-hidden flex items-center justify-center select-none transform transition-transform hover:scale-105`}
    >
      {renderDots()}
    </div>
  );
}

export default function DicePlate({
  state,
  dice = [1, 2, 3],
  total = 6,
  outcome = 'XIU',
  isTriple = false,
  roundEndTime
}) {
  const shouldReduceMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState(0);
  const [squeezeProgress, setSqueezeProgress] = useState(0); // 0 (kín) đến 100 (mở hoàn toàn)
  const [isAutoRevealed, setIsAutoRevealed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Đếm ngược thời gian (chỉ update state khi giây thay đổi thực tế)
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      setTimeLeft((prev) => (prev !== remaining ? remaining : prev));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [roundEndTime]);

  // Reset nặn đĩa khi sang ván mới hoặc bắt đầu lắc
  useEffect(() => {
    if (state === 'WAITING' || state === 'PLAYING') {
      setSqueezeProgress(0);
      setIsAutoRevealed(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [state]);

  const isRevealed = squeezeProgress >= 90 || isAutoRevealed;
  const canDrag = state === 'RESULT' && !isRevealed;

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-amber-900/40 bg-gradient-to-b from-[#24130d] via-[#180d09] to-[#0d0705] p-6 text-amber-50 shadow-2xl">
      {/* Nền hoa văn truyền thống */}
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* Đồng hồ đếm ngược và trạng thái */}
      <div className="relative z-10 mb-3 flex items-center justify-between w-full max-w-sm px-2">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${
            state === 'WAITING' ? 'bg-emerald-400 animate-ping' : state === 'PLAYING' ? 'bg-orange-400 animate-bounce' : 'bg-amber-400'
          }`} />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {state === 'WAITING' ? 'ĐANG NHẬN CƯỢC' : state === 'PLAYING' ? 'ĐANG LẮC BÁT (2S)...' : 'KẾT QUẢ - KÉO BÁT MỌI HƯỚNG!'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-black/50 border border-amber-600/30 px-3 py-1 font-mono text-sm font-black text-amber-300">
          <Flame size={14} className="text-amber-500 animate-pulse" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* KHU VỰC ĐĨA SỨ VÀ BÁT ÚP NẶN XÚC XẮC */}
      <div className="relative z-10 my-4 flex size-64 sm:size-72 items-center justify-center select-none">
        {/* ĐĨA SỨ DÂN GIAN MEN LAM */}
        <div className="absolute inset-0 rounded-full border-8 border-amber-700/60 bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center justify-center pointer-events-none">
          {/* Viền hoa văn đĩa */}
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-800/40 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-sky-900/30 pointer-events-none" />

          {/* 3 VIÊN XÚC XẮC NẰM TRÊN ĐĨA */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            <DiceFace value={dice[0]} size="lg" />
            <div className="flex flex-col gap-2">
              <DiceFace value={dice[1]} size="md" />
              <DiceFace value={dice[2]} size="md" />
            </div>
          </div>
        </div>

        {/* CÁC MŨI TÊN CHỈ DẪN KÉO 4 HƯỚNG KHI ĐANG NẶN */}
        {canDrag && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="absolute top-1 text-amber-300/80 font-black text-[11px] animate-bounce">
              ▲ Kéo lên
            </div>
            <div className="absolute bottom-1 text-amber-300/80 font-black text-[11px] animate-bounce">
              ▼ Kéo xuống
            </div>
            <div className="absolute left-1 text-amber-300/80 font-black text-[11px] animate-pulse">
              ◀ Trái
            </div>
            <div className="absolute right-1 text-amber-300/80 font-black text-[11px] animate-pulse">
              Phải ▶
            </div>
          </div>
        )}

        {/* BÁT ÚP (LID) - HỖ TRỢ KÉO BẰNG TAY CẢM ỨNG & CHUỘT MỌI HƯỚNG 360 ĐỘ */}
        <motion.div
          key={state === 'RESULT' ? 'bowl-result' : 'bowl-waiting'}
          drag={canDrag}
          dragConstraints={{ left: -260, right: 260, top: -260, bottom: 260 }}
          dragElastic={0}
          dragMomentum={false}
          whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 50 }}
          onDrag={(_, info) => {
            const currentX = info.offset.x;
            const currentY = info.offset.y;
            setDragOffset({ x: currentX, y: currentY });
            const dist = Math.hypot(currentX, currentY);
            const pct = Math.min(100, Math.round((dist / 100) * 100));
            setSqueezeProgress(pct);
            if (dist >= 110) {
              setIsAutoRevealed(true);
            }
          }}
          onDragEnd={(_, info) => {
            const dist = Math.hypot(info.offset.x, info.offset.y);
            if (dist >= 85) {
              setIsAutoRevealed(true);
            }
          }}
          animate={
            state === 'PLAYING'
              ? shouldReduceMotion
                ? { scale: [1, 1.04, 1], opacity: 1, transition: { repeat: Infinity, duration: 0.8 } }
                : {
                    x: [0, -12, 12, -10, 10, -6, 6, 0],
                    y: [0, -8, 8, -6, 6, -3, 3, 0],
                    rotate: [0, -6, 6, -5, 5, -2, 2, 0],
                    opacity: 1,
                    scale: 1,
                    transition: { repeat: Infinity, duration: 0.15, ease: 'easeInOut' }
                  }
              : state === 'RESULT' && isRevealed
                ? {
                    x: dragOffset.x !== 0 ? Math.sign(dragOffset.x || 1) * 320 : 0,
                    y: dragOffset.y !== 0 ? Math.sign(dragOffset.y || -1) * 320 : -320,
                    opacity: 0,
                    scale: 0.7,
                    transition: { duration: 0.35, ease: 'easeOut' }
                  }
                : state === 'WAITING'
                  ? {
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                      transition: { duration: 0.3 }
                    }
                  : undefined
          }
          style={{ touchAction: 'none' }}
          className={`absolute inset-4 rounded-full border-4 border-amber-500/70 bg-gradient-to-b from-[#854d0e] via-[#451a03] to-[#1c0c05] shadow-[0_22px_40px_rgba(0,0,0,0.85)] z-20 flex flex-col items-center justify-center transition-shadow ${
            canDrag
              ? 'cursor-grab active:cursor-grabbing ring-4 ring-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              : isRevealed
                ? 'pointer-events-none'
                : ''
          }`}
        >
          {/* Hiệu ứng hào quang khi đang ở trạng thái nặn */}
          {canDrag && (
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-ping opacity-30 pointer-events-none" />
          )}

          {/* Núm cầm bát */}
          <div className="size-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 border-2 border-amber-300/80 shadow-md flex items-center justify-center mb-1 pointer-events-none">
            <span className="font-mono text-[10px] font-bold text-amber-950 uppercase">ĐÌNH</span>
          </div>

          {/* Nhãn hướng dẫn trực quan trên bát */}
          {state === 'PLAYING' ? (
            <span className="text-[11px] font-black text-amber-300 tracking-wider animate-pulse pointer-events-none">
              LẮC... LẮC...
            </span>
          ) : canDrag ? (
            <div className="flex flex-col items-center pointer-events-none">
              <div className="flex items-center gap-1 text-[11px] font-black text-amber-100 uppercase bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-400/70 shadow-sm">
                <Hand size={12} className="text-amber-400 animate-bounce" />
                <span>KÉO BÁT MỌI HƯỚNG</span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold mt-0.5">
                {squeezeProgress > 0 ? `Đã hé: ${squeezeProgress}%` : 'Chạm/rê chuột kéo bát'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-amber-200 tracking-wider pointer-events-none">
              TÀI XỈU LÀNG
            </span>
          )}
        </motion.div>
      </div>

      {/* THANH ĐIỀU KHIỂN NẶN ĐĨA VÀ NÚT MỞ NHANH */}
      <AnimatePresence>
        {state === 'RESULT' && !isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-amber-950/90 border border-amber-600/50 p-3 mt-2 flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-2 text-xs text-amber-200 font-semibold">
              <Move size={16} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Dùng tay/chuột kéo bát: <strong>{squeezeProgress}%</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoRevealed(true)}
              className="rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950 hover:brightness-110 active:scale-95 transition shadow-sm"
            >
              Mở Bát Ngay
            </button>
          </motion.div>
        )}

        {/* KẾT QUẢ ĐÃ MỞ BÁT */}
        {state === 'RESULT' && isRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-3 text-slate-950 font-black shadow-lg shadow-amber-500/30"
          >
            <Sparkles size={22} className="text-slate-950" />
            <div className="text-center">
              <span className="text-base sm:text-lg uppercase">
                {isTriple ? `TAM BẢO BÃO ${dice[0]}-${dice[1]}-${dice[2]}!` : `${outcome === 'TAI' ? 'TÀI' : 'XỈU'} (${total} ĐIỂM)`}
              </span>
              <p className="text-[11px] font-medium text-amber-950">
                Xúc xắc: {dice[0]} - {dice[1]} - {dice[2]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

