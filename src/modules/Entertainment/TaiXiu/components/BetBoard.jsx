// src/modules/Entertainment/TaiXiu/components/BetBoard.jsx
import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { HeritageCoinIcon, ChimLac, DongSonSun } from './HeritageIcons';

const CHIP_VALUES = [
  { label: '1k', value: 1000 },
  { label: '10k', value: 10000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '500k', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: '10M', value: 10000000 },
  { label: '50M', value: 50000000 }
];

export default function BetBoard({
  state,
  myBets = [],
  myPoints = 10000,
  betSummary = { taiTotal: 0, xiuTotal: 0, baoTotal: 0 },
  onPlaceBet
}) {
  const [selectedSide, setSelectedSide] = useState(null); // 'XIU' | 'TAI' | null
  const [pendingAmount, setPendingAmount] = useState(0);
  const [selectedChip, setSelectedChip] = useState(1000);

  const isLocked = state !== 'WAITING';

  // Khi hết thời gian cược hoặc đổi ván -> reset cược tạm thời
  useEffect(() => {
    if (state !== 'WAITING') {
      setSelectedSide(null);
      setPendingAmount(0);
    }
  }, [state]);

  // Lấy cược của bản thân cho từng cửa đã xác nhận từ server
  const getMyBetForSide = (side) => {
    return myBets.find((b) => b.side === side);
  };

  const myXiuBet = getMyBetForSide('XIU');
  const myTaiBet = getMyBetForSide('TAI');

  const handleSelectSide = (side) => {
    if (isLocked) return;

    if (selectedSide === side) {
      // Đang chọn cửa này rồi -> Bấm tiếp thì cộng dồn thêm chip đang chọn
      setPendingAmount((prev) => Math.min(myPoints, prev + selectedChip));
    } else {
      // Đổi sang cửa này
      setSelectedSide(side);
      setPendingAmount((prev) => (prev > 0 ? prev : Math.min(myPoints, selectedChip)));
    }
  };

  const handleSelectChip = (chipValue) => {
    setSelectedChip(chipValue);
    if (!isLocked && selectedSide) {
      // Nếu đã chọn cửa cược rồi thì cộng dồn thêm chip vào số tiền chờ xác nhận
      setPendingAmount((prev) => Math.min(myPoints, prev + chipValue));
    }
  };

  const handleAllIn = () => {
    if (isLocked || myPoints <= 0) return;
    if (!selectedSide) {
      setSelectedSide('XIU');
    }
    setPendingAmount(myPoints);
  };

  const handleConfirmBet = () => {
    if (isLocked || !selectedSide || pendingAmount <= 0) return;
    if (pendingAmount > myPoints) return;
    onPlaceBet(selectedSide, pendingAmount);
    setSelectedSide(null);
    setPendingAmount(0);
  };

  const handleCancelBet = () => {
    setSelectedSide(null);
    setPendingAmount(0);
  };

  const isSelectingXiu = selectedSide === 'XIU';
  const isSelectingTai = selectedSide === 'TAI';

  return (
    <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3.5 rounded-2xl sm:rounded-3xl border border-[#A87932]/40 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-2.5 xs:p-3 sm:p-4 text-[#E8DDC8] shadow-[0_8px_24px_rgba(0,0,0,0.65)] select-none w-full">
      {/* 2 CỬA CƯỢC CHÍNH: XỈU & TÀI (PHÙ ĐIÊU ĐỒNG & SƠN MÀI) */}
      <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-4">
        {/* CỬA XỈU (4 - 10) - Men Lam Trầm & Khảm Đồng */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => handleSelectSide('XIU')}
          className={`relative group flex flex-col items-center justify-between min-h-[92px] xs:min-h-[105px] sm:min-h-[150px] md:min-h-[165px] p-2 xs:p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-[0.98] ${
            isSelectingXiu
              ? 'border-[#D5B46B] bg-gradient-to-b from-[#1f2e3d]/95 via-[#15232e]/95 to-[#0e171f] ring-3 ring-[#D5B46B]/60 shadow-[0_0_20px_rgba(213,180,107,0.35)]'
              : myXiuBet
              ? 'border-[#D5B46B]/70 bg-gradient-to-b from-[#1f2833]/80 via-[#151f28]/85 to-[#0e161c] shadow-[0_0_12px_rgba(213,180,107,0.2)]'
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

          <div className="mt-1 xs:mt-1.5 sm:mt-2.5 flex flex-col items-center gap-1 w-full">
            <div className="flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs text-[#E8DDC8]/80 font-medium">
              <span>Làng:</span>
              <strong className="font-mono text-[#D5B46B]">
                {(betSummary.xiuTotal || 0).toLocaleString()}
              </strong>
              <span className="text-[9px]">xu</span>
            </div>

            {isSelectingXiu ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D5B46B] text-[#171411] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-black animate-pulse shadow-sm">
                + Chuẩn bị: {pendingAmount.toLocaleString()} xu
              </span>
            ) : myXiuBet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D5B46B]/20 border border-[#D5B46B]/60 text-[#D5B46B] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-bold shadow-xs">
                <Check size={11} strokeWidth={3} /> Đã cược: {myXiuBet.amount.toLocaleString()} xu
              </span>
            ) : (
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-[#E8DDC8]/90 font-bold bg-[#171411]/80 px-2 xs:px-2.5 py-0.5 rounded-full border border-[#A87932]/50 group-hover:border-[#D5B46B] group-hover:text-[#FAF5EB] transition-colors">
                + Chọn Xỉu
              </span>
            )}
          </div>
        </button>

        {/* CỬA TÀI (11 - 17) - Đỏ Son Sơn Mài & Khảm Vàng Cổ */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => handleSelectSide('TAI')}
          className={`relative group flex flex-col items-center justify-between min-h-[92px] xs:min-h-[105px] sm:min-h-[150px] md:min-h-[165px] p-2 xs:p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all active:scale-[0.98] ${
            isSelectingTai
              ? 'border-[#D5B46B] bg-gradient-to-b from-[#421d1a]/95 via-[#2f1412]/95 to-[#1c0c0b] ring-3 ring-[#D5B46B]/60 shadow-[0_0_20px_rgba(213,180,107,0.35)]'
              : myTaiBet
              ? 'border-[#D5B46B]/70 bg-gradient-to-b from-[#3a1917]/80 via-[#2a1211]/85 to-[#1c0c0b] shadow-[0_0_12px_rgba(213,180,107,0.2)]'
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

          <div className="mt-1 xs:mt-1.5 sm:mt-2.5 flex flex-col items-center gap-1 w-full">
            <div className="flex items-center gap-1 text-[10px] xs:text-[11px] sm:text-xs text-[#E8DDC8]/80 font-medium">
              <span>Làng:</span>
              <strong className="font-mono text-[#D5B46B]">
                {(betSummary.taiTotal || 0).toLocaleString()}
              </strong>
              <span className="text-[9px]">xu</span>
            </div>

            {isSelectingTai ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D5B46B] text-[#171411] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-black animate-pulse shadow-sm">
                + Chuẩn bị: {pendingAmount.toLocaleString()} xu
              </span>
            ) : myTaiBet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8E2926]/30 border border-[#8E2926] text-[#FAF5EB] px-2 xs:px-2.5 py-0.5 font-mono text-[9px] xs:text-[10px] sm:text-xs font-bold shadow-xs">
                <Check size={11} strokeWidth={3} /> Đã cược: {myTaiBet.amount.toLocaleString()} xu
              </span>
            ) : (
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-[#E8DDC8]/90 font-bold bg-[#171411]/80 px-2 xs:px-2.5 py-0.5 rounded-full border border-[#A87932]/50 group-hover:border-[#D5B46B] group-hover:text-[#FAF5EB] transition-colors">
                + Chọn Tài
              </span>
            )}
          </div>
        </button>
      </div>

      {/* THANH CHỌN MỆNH GIÁ CHIP CƯỢC (1k, 10k, 50k, 100k, 500k, 1M, 10M, 50M) */}
      <div className="flex items-center justify-between gap-1.5 border-t border-[#A87932]/25 pt-2">
        <div className="hidden xs:flex items-center gap-1 text-[11px] font-bold text-[#D5B46B] shrink-0">
          <HeritageCoinIcon size={14} />
          <span>Chip:</span>
        </div>

        {/* Danh sách 8 mệnh giá chip theo yêu cầu */}
        <div className="flex flex-1 items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
          {CHIP_VALUES.map((chip) => {
            const isSelected = selectedChip === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSelectChip(chip.value)}
                className={`min-h-[28px] xs:min-h-[30px] sm:min-h-[34px] px-2 xs:px-2.5 sm:px-3 py-0.5 rounded-lg xs:rounded-xl font-mono text-[10px] xs:text-[11px] sm:text-xs font-black transition-all active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] shadow-[0_2px_8px_rgba(213,180,107,0.4)] border border-[#FAF5EB]/60 scale-105'
                    : 'bg-[#241712]/90 text-[#E8DDC8] border border-[#A87932]/40 hover:border-[#D5B46B]/70 hover:text-[#FAF5EB]'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            );
          })}

          {/* Nút Tất tay */}
          <button
            type="button"
            disabled={isLocked || myPoints <= 0}
            onClick={handleAllIn}
            className="min-h-[28px] xs:min-h-[30px] sm:min-h-[34px] px-2 xs:px-2.5 sm:px-3 py-0.5 rounded-lg xs:rounded-xl border border-[#D5B46B]/60 bg-[#2b1b14] text-[10px] xs:text-[11px] sm:text-xs font-black text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] disabled:opacity-40 transition-all active:scale-95 shrink-0"
            title="Đặt cược toàn bộ số xu hiện có"
          >
            Tất tay
          </button>
        </div>
      </div>

      {/* THANH THAO TÁC: NÚT XÁC NHẬN GIÁ TIỀN & NÚT HỦY BÊN PHẢI */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#A87932]/25">
        {/* NÚT XÁC NHẬN GIÁ TIỀN */}
        <button
          type="button"
          disabled={isLocked || !selectedSide || pendingAmount <= 0 || pendingAmount > myPoints}
          onClick={handleConfirmBet}
          className="flex-1 flex items-center justify-center gap-1.5 xs:gap-2 min-h-[36px] xs:min-h-[40px] sm:min-h-[44px] px-2.5 xs:px-3 py-1.5 rounded-xl font-mono text-[11px] xs:text-xs sm:text-sm font-black transition-all active:scale-[0.98] shadow-md bg-gradient-to-r from-[#D5B46B] via-[#E8CD8C] to-[#A87932] text-[#171411] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
        >
          <Check size={16} strokeWidth={3} />
          <span>
            {!selectedSide || pendingAmount === 0
              ? 'CHỌN CỬA ĐẶT CƯỢC'
              : `XÁC NHẬN +${pendingAmount.toLocaleString()} XU (${selectedSide === 'TAI' ? 'TÀI' : 'XỈU'})`}
          </span>
        </button>

        {/* NÚT HỦY BÊN PHẢI */}
        <button
          type="button"
          disabled={!selectedSide && pendingAmount === 0}
          onClick={handleCancelBet}
          className="flex items-center justify-center gap-1 min-h-[36px] xs:min-h-[40px] sm:min-h-[44px] px-3 xs:px-4 py-1.5 rounded-xl font-mono text-[11px] xs:text-xs sm:text-sm font-black transition-all active:scale-95 shadow-md border border-[#8E2926]/70 bg-gradient-to-b from-[#2a1413] to-[#1a0c0b] text-[#FAF5EB] hover:bg-[#3d1917] hover:border-[#8E2926] disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Hủy mức cược và cửa vừa chọn"
        >
          <X size={15} strokeWidth={2.5} />
          <span>Hủy</span>
        </button>
      </div>

      {/* CẢNH BÁO NẾU SỐ DƯ KHÔNG ĐỦ SỐ TIỀN ĐANG CHỌN */}
      {selectedSide && pendingAmount > myPoints && (
        <div className="rounded-lg sm:rounded-xl border border-[#8E2926]/60 bg-[#8E2926]/15 px-2.5 py-1 text-[10px] xs:text-[11px] sm:text-xs text-[#FAF5EB] font-medium leading-snug">
          Số dư (<strong className="font-mono text-[#D5B46B]">{myPoints.toLocaleString()}</strong> xu) không đủ mức {pendingAmount.toLocaleString()} xu. Hãy chọn mệnh giá nhỏ hơn hoặc bấm dấu (+) nhận xu!
        </div>
      )}
    </div>
  );
}
