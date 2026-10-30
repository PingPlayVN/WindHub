// src/modules/Entertainment/TaiXiu/components/DicePlate.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Flame, Hand, Move, Crown } from 'lucide-react';
import { DongSonSun, ChimLac } from './HeritageIcons';

/**
 * Quân xúc xắc 3D men ngà chạm chìm (Engraved Ivory Die)
 * - Mặt 1: Đại hồng tâm đỏ son lớn viền kép có nhụy vàng thếp kim
 * - Mặt 4: 4 chấm đỏ son chìm tinh xảo (#8E2926)
 * - Mặt 2, 3, 5, 6: Chấm đen mun sơn mài (#171411)
 * - Hiệu ứng 3D bevel bóng mờ, vát góc mượt mà, phản chiếu ánh sáng chân thực
 */
function HeritageDiceFace({ value }) {
  const vermilionDot =
    'bg-gradient-to-br from-[#B52B27] via-[#8E2926] to-[#601614] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.65),0_0.5px_1px_rgba(255,255,255,0.4)]';
  const obsidianDot =
    'bg-gradient-to-br from-[#2D2520] via-[#171411] to-[#0A0807] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.7),0_0.5px_1px_rgba(255,255,255,0.3)]';

  const dotBase = (isRed) => `rounded-full ${isRed ? vermilionDot : obsidianDot}`;

  const renderDots = () => {
    switch (value) {
      case 1:
        return (
          <div className="flex items-center justify-center h-full w-full">
            {/* Đại hồng tâm: Vòng tròn son đỏ lớn với nhụy vàng thếp kim */}
            <span className={`size-4.5 xs:size-5 sm:size-6.5 md:size-7.5 ${dotBase(true)} relative flex items-center justify-center`}>
              <span className="size-1.5 xs:size-1.5 sm:size-2 rounded-full bg-gradient-to-br from-[#D5B46B] to-[#966E26] shadow-xs" />
            </span>
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between h-full w-full p-1 xs:p-1.5 sm:p-2.5">
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-start ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-end ${dotBase(false)}`} />
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between h-full w-full p-1 xs:p-1.5 sm:p-2.5">
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-start ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-center ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-end ${dotBase(false)}`} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 place-content-between h-full w-full p-1 xs:p-1.5 sm:p-2.5">
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(true)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 justify-self-end ${dotBase(true)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(true)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 justify-self-end ${dotBase(true)}`} />
          </div>
        );
      case 5:
        return (
          <div className="relative h-full w-full p-1 xs:p-1.5 sm:p-2.5 flex flex-col justify-between">
            <div className="flex justify-between">
              <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
              <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
            </div>
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 self-center ${dotBase(false)}`} />
            <div className="flex justify-between">
              <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
              <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 place-content-between h-full w-full p-1 xs:p-1.5 sm:p-2.5">
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 justify-self-end ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 justify-self-end ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 ${dotBase(false)}`} />
            <span className={`size-1.5 xs:size-2 sm:size-2.5 md:size-3 justify-self-end ${dotBase(false)}`} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="size-8 xs:size-9 sm:size-12 md:size-14 rounded-lg xs:rounded-xl sm:rounded-2xl border border-[#D5B46B]/40 bg-gradient-to-br from-[#FFFFFF] via-[#F8F2E4] to-[#E3D4BA] shadow-[0_6px_14px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.95),inset_-1.5px_-1.5px_3px_rgba(180,150,110,0.35)] relative overflow-hidden flex items-center justify-center select-none transform transition-transform"
    >
      <div className="pointer-events-none absolute inset-x-1 top-0.5 h-0.5 sm:h-1 bg-white/60 rounded-t-lg blur-[0.5px]" />
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
  roundEndTime,
  onReveal
}) {
  const shouldReduceMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState(0);
  const [squeezeProgress, setSqueezeProgress] = useState(0);
  const [isAutoRevealed, setIsAutoRevealed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const hasAnnouncedRef = useRef(false);

  // Đếm ngược thời gian phiên và kiểm tra tự động mở bát khi hết giờ nặn
  useEffect(() => {
    if (!roundEndTime) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      setTimeLeft(remaining);

      // Khi ở trạng thái RESULT: người chơi có 10s để nặn bát (còn <= 5s cuối trước khi sang ván mới thì tự động mở)
      if (state === 'RESULT') {
        const autoOpenLeft = remaining - 5;
        if (autoOpenLeft <= 0) {
          setIsAutoRevealed(true);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [roundEndTime, state]);

  // Quản lý trạng thái nặn đĩa khi chuyển đổi state
  useEffect(() => {
    if (state === 'WAITING' || state === 'PLAYING') {
      setSqueezeProgress(0);
      setIsAutoRevealed(false);
      setDragOffset({ x: 0, y: 0 });
      hasAnnouncedRef.current = false;
    } else if (state === 'RESULT') {
      setSqueezeProgress(0);
      setDragOffset({ x: 0, y: 0 });
      hasAnnouncedRef.current = false;

      // Khi vừa bước vào RESULT: kiểm tra ngay xem thời gian nặn còn hay đã hết (<= 5s)
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime - now) / 1000));
      if (roundEndTime > 0 && remaining <= 5) {
        setIsAutoRevealed(true);
      } else {
        setIsAutoRevealed(false);
      }
    }
  }, [state, roundEndTime]);

  const isRevealed = isAutoRevealed || squeezeProgress >= 100;
  const canDrag = state === 'RESULT' && !isRevealed;

  // THÔNG BÁO THẮNG / THUA & PHÁT NHẠC CHỈ KHI ĐÃ MỞ BÁT XONG
  useEffect(() => {
    if (state === 'RESULT' && isRevealed && !hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true;
      if (onReveal) {
        onReveal();
      }
    }
  }, [state, isRevealed, onReveal]);

  const autoOpenRemaining = Math.max(0, timeLeft - 5);

  // Vector trượt rút hết màn hình theo hướng người chơi nặn bát
  const exitVector = useMemo(() => {
    const hasMoved = dragOffset.x !== 0 || dragOffset.y !== 0;
    const dist = Math.hypot(dragOffset.x, dragOffset.y) || 1;
    const normX = hasMoved ? dragOffset.x / dist : 0;
    const normY = hasMoved ? dragOffset.y / dist : -1;
    return {
      x: Math.round(normX * 850),
      y: Math.round(normY * 850),
      rotate: normX !== 0 ? Math.sign(normX) * 16 : -8
    };
  }, [dragOffset.x, dragOffset.y]);

  return (
    <section
      aria-label="Khu vực khay xúc xắc và bát nặn Tài Xỉu"
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-[#A87932]/45 bg-gradient-to-b from-[#251812] via-[#171411] to-[#100c09] p-2 xs:p-2.5 sm:p-5 text-[#E8DDC8] shadow-[0_8px_24px_rgba(0,0,0,0.65)] w-full"
    >
      {/* Background hoa văn Đông Sơn tinh tế */}
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(#D5B46B_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* THANH TRẠNG THÁI & ĐỒNG HỒ ĐẾM NGƯỢC */}
      <div className="relative z-10 mb-1 flex items-center justify-between w-full max-w-sm px-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 sm:size-2.5 rounded-full ${state === 'WAITING'
              ? 'bg-emerald-400 animate-ping'
              : state === 'PLAYING'
                ? 'bg-amber-400 animate-bounce'
                : 'bg-[#D5B46B]'
              }`}
          />
          <span className="text-[10px] xs:text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#D5B46B]">
            {state === 'WAITING'
              ? 'ĐANG NHẬN CƯỢC'
              : state === 'PLAYING'
                ? 'LẮC BÁT ĐÔNG SƠN...'
                : !isRevealed
                  ? 'NẶN BÁT (KÉO LỘ 3 QUÂN)'
                  : 'ĐÃ MỞ BÁT'}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg sm:rounded-xl bg-[#171411]/90 border border-[#D5B46B]/40 px-2 sm:px-2.5 py-0.5 font-mono text-[11px] xs:text-xs sm:text-sm font-black text-[#D5B46B] shadow-inner">
          <Flame size={12} className="text-[#A87932] animate-pulse" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* KHU VỰC KHAY ĐỒNG SƠN MÀI & BÁT ÚP NẶN (DICE STAGE) */}
      <div className="relative z-10 my-0.5 sm:my-2 flex size-38 xs:size-42 sm:size-60 md:size-68 items-center justify-center select-none">
        {/* KHAY ĐỒNG / ĐĨA SƠN MÀI */}
        <div className="absolute inset-0 rounded-full border-5 sm:border-8 border-[#78531F] bg-gradient-to-br from-[#35251C] via-[#241812] to-[#171411] shadow-[0_10px_24px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(213,180,107,0.35)] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-dashed border-[#D5B46B]/40 pointer-events-none" />
          <div className="absolute inset-3 sm:inset-5 rounded-full border border-[#A87932]/30 pointer-events-none" />

          {/* Lòng đĩa sơn mài mun trầm */}
          <div className="absolute inset-5 sm:inset-8 rounded-full bg-gradient-to-b from-[#2a1d17] via-[#1a110c] to-[#120b08] border border-[#A87932]/35 shadow-inner flex items-center justify-center">
            <div className="absolute opacity-15 text-[#D5B46B] pointer-events-none">
              <DongSonSun size={85} />
            </div>

            {/* 3 VIÊN XÚC XẮC 3D NẰM TRÊN KHAY VỚI GÓC NGHIÊNG TỰ NHIÊN */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1 sm:gap-2">
              <div className="flex items-center justify-center transform -rotate-3 transition-transform">
                <HeritageDiceFace value={dice[0]} />
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                <div className="transform rotate-3 transition-transform">
                  <HeritageDiceFace value={dice[1]} />
                </div>
                <div className="transform -rotate-2 transition-transform">
                  <HeritageDiceFace value={dice[2]} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHỈ DẪN KÉO NẶN KHI ĐANG NẶN */}
        {canDrag && squeezeProgress === 0 && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="absolute top-1 text-[#D5B46B] font-black text-[9px] sm:text-[10px] animate-bounce drop-shadow">
              ▲ Kéo lên
            </div>
            <div className="absolute bottom-1 text-[#D5B46B] font-black text-[9px] sm:text-[10px] animate-bounce drop-shadow">
              ▼ Kéo xuống
            </div>
            <div className="absolute left-1 text-[#D5B46B] font-black text-[9px] sm:text-[10px] animate-pulse drop-shadow">
              ◀ Trái
            </div>
            <div className="absolute right-1 text-[#D5B46B] font-black text-[9px] sm:text-[10px] animate-pulse drop-shadow">
              Phải ▶
            </div>
          </div>
        )}

        {/* BÁT SƠN MÀI THẾP VÀNG ÚP TRÊN ĐĨA (LID) */}
        {/* CƠ CHẾ NẶN BÁT: Người chơi kéo nặn tự do 360 độ. Khi kéo hé thấy cả 3 xúc xắc (cự ly >= 110px) thì game TỰ GIẬT RA LUÔN! */}
        <motion.div
          key={state === 'RESULT' ? 'bowl-result' : 'bowl-waiting'}
          drag={canDrag}
          dragConstraints={{ left: -220, right: 220, top: -220, bottom: 220 }}
          dragElastic={0.25}
          dragSnapToOrigin={true}
          dragMomentum={false}
          whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}
          onDrag={(_, info) => {
            const currentX = info.offset.x;
            const currentY = info.offset.y;
            setDragOffset({ x: currentX, y: currentY });
            const dist = Math.hypot(currentX, currentY);
            const MAX_DIST = 130;
            const pct = Math.min(100, Math.round((dist / MAX_DIST) * 100));
            setSqueezeProgress(pct);

            // KHI KÉO HÉ ĐỦ NHÌN THẤY CẢ 3 VIÊN XÚC XẮC (CỰ LY >= 110PX) -> TỰ GIẬT RA LUÔN!
            if (dist >= MAX_DIST) {
              setIsAutoRevealed(true);
            }
          }}
          onDragEnd={(_, info) => {
            const dist = Math.hypot(info.offset.x, info.offset.y);
            const speed = Math.hypot(info.velocity.x, info.velocity.y);
            const isFling = speed > 600 && dist > 30;

            // Đủ cự ly hé cả 3 viên (>= 65px) hoặc vuốt nhanh khi buông tay -> tự giật mở bát luôn
            if (dist >= 65 || isFling) {
              setIsAutoRevealed(true);
            } else {
              // Chưa hé đủ cả 3 quân -> Bát tự động bật úp lại tâm đĩa để người chơi nặn tiếp
              setDragOffset({ x: 0, y: 0 });
              setSqueezeProgress(0);
            }
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={
            state === 'PLAYING'
              ? shouldReduceMotion
                ? { scale: [1, 1.04, 1], opacity: 1, transition: { repeat: Infinity, duration: 0.8 } }
                : {
                  x: [0, -10, 10, -8, 8, -5, 5, 0],
                  y: [0, -6, 6, -5, 5, -2, 2, 0],
                  rotate: [0, -5, 5, -4, 4, -1, 1, 0],
                  opacity: 1,
                  scale: 1,
                  transition: { repeat: Infinity, duration: 0.16, ease: 'easeInOut' }
                }
              : state === 'RESULT' && isRevealed
                ? {
                  // HIỆU ỨNG TỰ RÚT HẾT MÀN HÌNH THEO HƯỚNG NẶN MƯỢT MÀ
                  x: exitVector.x,
                  y: exitVector.y,
                  opacity: [1, 1, 0],
                  scale: 1.02,
                  rotate: exitVector.rotate,
                  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
                }
                : {
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  transition: { duration: 0.25 }
                }
          }
          style={{ touchAction: 'none' }}
          className={`absolute inset-2 xs:inset-2.5 sm:inset-4 rounded-full border-3 sm:border-4 border-[#A87932] bg-gradient-to-b from-[#35251C] via-[#211712] to-[#140e0b] shadow-[0_14px_32px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(213,180,107,0.3)] z-20 flex flex-col items-center justify-center transition-shadow ${canDrag
            ? 'cursor-grab active:cursor-grabbing ring-4 ring-[#D5B46B]/50 shadow-[0_0_24px_rgba(213,180,107,0.45)]'
            : isRevealed
              ? 'pointer-events-none'
              : ''
            }`}
        >
          {canDrag && (
            <div className="absolute inset-0 rounded-full border-2 border-[#D5B46B]/60 animate-ping opacity-25 pointer-events-none" />
          )}

          {/* NÚM CẦM MẶT TRỜI ĐÔNG SƠN */}
          <div className="size-8 xs:size-9 sm:size-14 rounded-full bg-gradient-to-b from-[#D5B46B] via-[#A87932] to-[#78531F] border-2 border-[#FAF5EB]/60 shadow-[0_3px_8px_rgba(0,0,0,0.5)] flex items-center justify-center mb-0.5 sm:mb-1 pointer-events-none p-0.5">
            <DongSonSun size={20} className="text-[#171411]" />
          </div>

          {state === 'PLAYING' ? (
            <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-black text-[#D5B46B] tracking-widest animate-pulse pointer-events-none">
              LẮC... LẮC...
            </span>
          ) : canDrag ? (
            <div className="flex flex-col items-center pointer-events-none">
              <div className="flex items-center gap-1 text-[8px] xs:text-[9px] sm:text-[11px] font-black text-[#FAF5EB] uppercase bg-[#171411]/90 px-1.5 xs:px-2 sm:px-3 py-0.5 rounded-full border border-[#D5B46B]/60 shadow-xs">
                <Hand size={10} className="text-[#D5B46B] animate-bounce" />
                <span>NẶN 3 XÚC XẮC</span>
              </div>
              <span className="text-[8px] xs:text-[9px] text-[#D5B46B] font-bold mt-0.5">
                {squeezeProgress > 0 ? `Lộ: ${squeezeProgress}% (thấy 3 quân tự giật)` : 'Kéo để nặn'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[8px] xs:text-[9px] sm:text-[11px] font-bold tracking-widest text-[#E8DDC8]/80 pointer-events-none">
              <ChimLac size={11} className="text-[#D5B46B]" />
              <span>TÀI XỈU ĐÔNG SƠN</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* THANH ĐIỀU KHIỂN NẶN ĐĨA & NÚT MỞ NHANH */}
      <AnimatePresence>
        {state === 'RESULT' && !isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative z-10 w-full max-w-sm rounded-xl bg-[#1d140f]/95 border border-[#A87932]/50 p-1.5 xs:p-2 sm:p-2.5 mt-0.5 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-1.5 text-[10px] xs:text-[11px] sm:text-xs text-[#E8DDC8] font-semibold">
              <Move size={13} className="text-[#D5B46B] animate-spin" style={{ animationDuration: '6s' }} />
              <span>
                Nặn ({squeezeProgress}%) • Tự giật: <strong className="text-[#D5B46B] font-mono">{autoOpenRemaining}s</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoRevealed(true)}
              className="min-h-[28px] xs:min-h-[30px] sm:min-h-[36px] rounded-lg bg-gradient-to-r from-[#D5B46B] to-[#A87932] px-2.5 xs:px-3 py-0.5 text-[10px] xs:text-[11px] sm:text-xs font-black text-[#171411] hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              Mở Ngay
            </button>
          </motion.div>
        )}

        {/* KẾT QUẢ PHIÊN SAU KHI MỞ BÁT */}
        {state === 'RESULT' && isRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 mt-0.5 sm:mt-1 flex items-center gap-2 rounded-xl border border-[#D5B46B]/60 bg-gradient-to-r from-[#2c1c14] via-[#3a251b] to-[#2c1c14] px-2.5 xs:px-3 py-1 sm:py-2 text-[#FAF5EB] shadow-[0_4px_16px_rgba(213,180,107,0.3)] w-full max-w-sm justify-center"
          >
            {isTriple ? (
              <Crown size={16} className="text-[#D5B46B] shrink-0 animate-pulse" />
            ) : (
              <Sparkles size={16} className="text-[#D5B46B] shrink-0" />
            )}
            <div className="text-center">
              <span className="text-xs xs:text-sm sm:text-base font-black tracking-wide text-[#FAF5EB] uppercase">
                {isTriple
                  ? `TAM BẢO BÃO ${dice[0]}-${dice[1]}-${dice[2]}!`
                  : `${outcome === 'TAI' ? 'TÀI' : 'XỈU'} (${total} ĐIỂM)`}
              </span>
              <p className="text-[9px] xs:text-[10px] sm:text-[11px] font-semibold text-[#D5B46B]">
                3 Xúc xắc: {dice[0]} - {dice[1]} - {dice[2]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
