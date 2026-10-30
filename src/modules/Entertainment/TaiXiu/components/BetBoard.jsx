// src/modules/Entertainment/TaiXiu/components/BetBoard.jsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { HeritageCoinIcon, ChimLac, DongSonSun } from './HeritageIcons';

const CHIP_VALUES = [50, 100, 500, 1000, 2000, 5000];

export default function BetBoard({
  state,
  myBets = [],
  myPoints = 10000,
  betSummary = { taiTotal: 0, xiuTotal: 0, baoTotal: 0 },
  onPlaceBet
}) {
  const [selectedChip, setSelectedChip] = useState(100);

  const isLocked = state !== 'WAITING';

  // Lấy cược của bản thân cho từng cửa
  const getMyBetForSide = (side) => {
    return myBets.find((b) => b.side === side);
  };

  const handleBetSide = (side) => {
    if (isLocked) return;
    onPlaceBet(side, selectedChip);
  };

  const myXiuBet = getMyBetForSide('XIU');
  const myTaiBet = getMyBetForSide('TAI');

  return (
    <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#A87932]/40 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-2.5 xs:p-3 sm:p-5 text-[#E8DDC8] shadow-[0_8px_24px_rgba(0,0,0,0.65)] select-none w-full">
      {/* 2 CỬA CƯỢC CHÍNH: XỈU & TÀI (PHÙ ĐIÊU ĐỒNG & SƠN MÀI) */}
      <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-4">
        {/* CỬA XỈU (4 - 10) - Men Lam Trầm & Khảm Đồng */}
        <button
          type="button"
          disabled={isLocked || myPoints < selectedChip}
          onClick={() => handleBetSide('XIU')}
          className={`relative group flex flex-col items-center justify-between min-h-[92px] xs:min-h-[105px] sm:min-h-[160px] md:min-h-[180px] p-2 xs:p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-[0.98] ${
            myXiuBet
              ? 'border-[#D5B46B] bg-gradient-to-b from-[#1f2833]/90 via-[#151f28]/95 to-[#0e161c] shadow-[0_0_18px_rgba(213,180,107,0.3)] ring-2 ring-[#D5B46B]/40'
              : 'border-[#A87932]/35 bg-gradient-to-b from-[#1b1c20]/80 via-[#131418]/90 to-[#0e0f12] hover:border-[#D5B46B]/70 hover:bg-[#1a1f26]/80'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {/* Họa tiết chim Lạc trang trí góc */}
          <div className="pointer-events-none absolute top-1.5 left-1.5 xs:top-2 xs:left-2 opacity-20 text-[#D5B46B]">
            <ChimLac size={14} />
          </div>

          <div className="text-center w-full">
            <span className="font-mono text-[8px] xs:text-[9px] sm:text-xs uppercase tracking-widest text-[#D5B46B] font-bold block">
              TỔNG 4 - 10 • ĂN 1:1
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#FAF5EB] tracking-wider mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              XỈU
            </h2>
          </div>

          <div className="mt-1 xs:mt-1.5 sm:mt-3 flex flex-col items-center gap-1 w-full">
            <div className="flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs text-[#E8DDC8]/80 font-medium">
              <span>Làng:</span>
              <strong className="font-mono text-[#D5B46B]">
                {(betSummary.xiuTotal || 0).toLocaleString()}
              </strong>
              <span className="text-[9px]">xu</span>
            </div>

            {myXiuBet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D5B46B] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-black text-[#171411] shadow-xs">
                <Check size={11} strokeWidth={3} /> Đang cược: {myXiuBet.amount.toLocaleString()} xu
              </span>
            ) : (
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-[#E8DDC8] font-bold bg-[#171411]/80 px-2 xs:px-2.5 py-0.5 rounded-full border border-[#A87932]/50 group-hover:border-[#D5B46B] group-hover:text-[#FAF5EB] transition-colors">
                + Cược {selectedChip.toLocaleString()} xu
              </span>
            )}
          </div>
        </button>

        {/* CỬA TÀI (11 - 17) - Đỏ Son Sơn Mài & Khảm Vàng Cổ */}
        <button
          type="button"
          disabled={isLocked || myPoints < selectedChip}
          onClick={() => handleBetSide('TAI')}
          className={`relative group flex flex-col items-center justify-between min-h-[92px] xs:min-h-[105px] sm:min-h-[160px] md:min-h-[180px] p-2 xs:p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-[0.98] ${
            myTaiBet
              ? 'border-[#D5B46B] bg-gradient-to-b from-[#3a1917]/90 via-[#2a1211]/95 to-[#1c0c0b] shadow-[0_0_18px_rgba(213,180,107,0.3)] ring-2 ring-[#D5B46B]/40'
              : 'border-[#A87932]/35 bg-gradient-to-b from-[#251614]/80 via-[#1c100e]/90 to-[#120a09] hover:border-[#D5B46B]/70 hover:bg-[#2b1715]/80'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {/* Họa tiết mặt trời Đông Sơn trang trí góc */}
          <div className="pointer-events-none absolute top-1.5 right-1.5 xs:top-2 xs:right-2 opacity-20 text-[#D5B46B]">
            <DongSonSun size={14} />
          </div>

          <div className="text-center w-full">
            <span className="font-mono text-[8px] xs:text-[9px] sm:text-xs uppercase tracking-widest text-[#D5B46B] font-bold block">
              TỔNG 11 - 17 • ĂN 1:1
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#FAF5EB] tracking-wider mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              TÀI
            </h2>
          </div>

          <div className="mt-1 xs:mt-1.5 sm:mt-3 flex flex-col items-center gap-1 w-full">
            <div className="flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs text-[#E8DDC8]/80 font-medium">
              <span>Làng:</span>
              <strong className="font-mono text-[#D5B46B]">
                {(betSummary.taiTotal || 0).toLocaleString()}
              </strong>
              <span className="text-[9px]">xu</span>
            </div>

            {myTaiBet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8E2926] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-black text-[#FAF5EB] border border-[#D5B46B]/60 shadow-xs">
                <Check size={11} strokeWidth={3} /> Đang cược: {myTaiBet.amount.toLocaleString()} xu
              </span>
            ) : (
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-[#E8DDC8] font-bold bg-[#171411]/80 px-2 xs:px-2.5 py-0.5 rounded-full border border-[#A87932]/50 group-hover:border-[#D5B46B] group-hover:text-[#FAF5EB] transition-colors">
                + Cược {selectedChip.toLocaleString()} xu
              </span>
            )}
          </div>
        </button>
      </div>

      {/* THANH CHỌN MỆNH GIÁ CHIP CƯỢC (ĐỒNG XU CỔ VIỆT NAM) */}
      <div className="flex items-center justify-between gap-1.5 xs:gap-2 border-t border-[#A87932]/25 pt-2">
        <div className="hidden xs:flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#D5B46B] shrink-0">
          <HeritageCoinIcon size={14} />
          <span>Xu:</span>
        </div>

        {/* Dàn nút Chip dạng đồng xu đồng cổ */}
        <div className="flex flex-1 items-center justify-between sm:justify-end gap-1 xs:gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CHIP_VALUES.map((val) => {
            const isSelected = selectedChip === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedChip(val)}
                className={`min-h-[28px] xs:min-h-[30px] sm:min-h-[36px] px-1.5 xs:px-2.5 sm:px-3 py-0.5 rounded-lg xs:rounded-xl font-mono text-[10px] xs:text-[11px] sm:text-xs font-black transition-all active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] shadow-[0_2px_8px_rgba(213,180,107,0.4)] border border-[#FAF5EB]/50 scale-105'
                    : 'bg-[#241712]/90 text-[#E8DDC8] border border-[#A87932]/40 hover:border-[#D5B46B]/70 hover:text-[#FAF5EB]'
                }`}
              >
                <span>{val >= 1000 ? `${val / 1000}k` : val}</span>
              </button>
            );
          })}

          {/* Nút Tất tay */}
          <button
            type="button"
            disabled={myPoints < 50}
            onClick={() => setSelectedChip(Math.max(50, Math.min(myPoints, 20000)))}
            className="min-h-[28px] xs:min-h-[30px] sm:min-h-[36px] px-2 xs:px-2.5 sm:px-3 py-0.5 rounded-lg xs:rounded-xl border border-[#D5B46B]/60 bg-[#2b1b14] text-[10px] xs:text-[11px] sm:text-xs font-black text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] disabled:opacity-40 transition-all active:scale-95 shrink-0"
          >
            Tất tay
          </button>
        </div>
      </div>

      {/* CẢNH BÁO SỐ DƯ NẾU KHÔNG ĐỦ */}
      {myPoints < selectedChip && (
        <div className="rounded-lg sm:rounded-xl border border-[#8E2926]/60 bg-[#8E2926]/15 px-2.5 py-1 text-[10px] xs:text-[11px] sm:text-xs text-[#FAF5EB] font-medium leading-snug">
          Số dư (<strong className="font-mono text-[#D5B46B]">{myPoints.toLocaleString()}</strong> xu) không đủ mức {selectedChip.toLocaleString()} xu. Hãy chọn chip nhỏ hơn hoặc bấm dấu (+) ở trên!
        </div>
      )}
    </div>
  );
}
