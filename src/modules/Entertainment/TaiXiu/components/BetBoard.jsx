// src/modules/Entertainment/TaiXiu/components/BetBoard.jsx
import { useState } from 'react';
import { Coins, Check, EyeOff } from 'lucide-react';

const CHIP_VALUES = [50, 100, 500, 1000, 2000, 5000];

export default function BetBoard({
  state,
  myBets = [],
  myPoints = 10000,
  betSummary = { taiTotal: 0, xiuTotal: 0, baoTotal: 0 },
  onPlaceBet
}) {
  const [selectedChip, setSelectedChip] = useState(100);
  const [hasSkipped, setHasSkipped] = useState(false);

  const isLocked = state !== 'WAITING';

  // Lấy cược của bản thân cho từng cửa
  const getMyBetForSide = (side) => {
    return myBets.find((b) => b.side === side);
  };

  const handleBetSide = (side) => {
    if (isLocked) return;
    onPlaceBet(side, selectedChip);
    setHasSkipped(false);
  };

  const myXiuBet = getMyBetForSide('XIU');
  const myTaiBet = getMyBetForSide('TAI');
  const myBaoBet = getMyBetForSide('BAO');

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c0d10]">
      {/* 2 CỬA CƯỢC CHÍNH: XỈU VÀ TÀI + CỬA PHỤ: BÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* CỬA XỈU (4 - 10) */}
        <button
          type="button"
          disabled={isLocked || myPoints < selectedChip}
          onClick={() => handleBetSide('XIU')}
          className={`sm:col-span-5 relative flex flex-col items-center justify-between p-5 rounded-2xl border-2 transition-all ${
            myXiuBet
              ? 'border-sky-500 bg-sky-500/15 shadow-lg shadow-sky-500/10'
              : 'border-slate-200 hover:border-sky-400 bg-gradient-to-b from-sky-50/60 to-white dark:from-sky-950/20 dark:to-[#111] dark:border-slate-800'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-sky-600 dark:text-sky-400 font-bold">
              TỔNG 4 - 10 (ĂN 1:1)
            </span>
            <h2 className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">XỈU</h2>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Làng cược: <strong className="font-mono text-slate-700 dark:text-slate-200">{(betSummary.xiuTotal || 0).toLocaleString()}</strong> xu
            </span>
            {myXiuBet && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-0.5 font-mono text-xs font-bold text-white shadow-sm">
                <Check size={12} strokeWidth={3} /> Bạn cược: {myXiuBet.amount.toLocaleString()} xu
              </span>
            )}
          </div>
        </button>

        {/* CỬA BÃO (TAM BẢO 1:30) */}
        <button
          type="button"
          disabled={isLocked || myPoints < selectedChip}
          onClick={() => handleBetSide('BAO')}
          className={`sm:col-span-2 relative flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
            myBaoBet
              ? 'border-amber-500 bg-amber-500/20 shadow-lg'
              : 'border-slate-200 hover:border-amber-400 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-[#111] dark:border-slate-800'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <span className="font-mono text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              1 ĂN 30
            </span>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">BÃO</h3>
            <span className="text-[10px] text-slate-400 block mt-1">3 xúc xắc giống nhau</span>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] text-slate-500 block font-mono">
              {(betSummary.baoTotal || 0).toLocaleString()} xu
            </span>
            {myBaoBet && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-black mt-1">
                {myBaoBet.amount}
              </span>
            )}
          </div>
        </button>

        {/* CỬA TÀI (11 - 17) */}
        <button
          type="button"
          disabled={isLocked || myPoints < selectedChip}
          onClick={() => handleBetSide('TAI')}
          className={`sm:col-span-5 relative flex flex-col items-center justify-between p-5 rounded-2xl border-2 transition-all ${
            myTaiBet
              ? 'border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-500/10'
              : 'border-slate-200 hover:border-rose-400 bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-950/20 dark:to-[#111] dark:border-slate-800'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 font-bold">
              TỔNG 11 - 17 (ĂN 1:1)
            </span>
            <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">TÀI</h2>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Làng cược: <strong className="font-mono text-slate-700 dark:text-slate-200">{(betSummary.taiTotal || 0).toLocaleString()}</strong> xu
            </span>
            {myTaiBet && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-0.5 font-mono text-xs font-bold text-white shadow-sm">
                <Check size={12} strokeWidth={3} /> Bạn cược: {myTaiBet.amount.toLocaleString()} xu
              </span>
            )}
          </div>
        </button>
      </div>

      {/* THANH CHỌN MỆNH GIÁ CHIP CƯỢC */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-amber-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chọn mức xu:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CHIP_VALUES.map((val) => {
            const isSelected = selectedChip === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedChip(val)}
                className={`rounded-xl px-3 py-1 font-mono text-xs font-bold transition ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {val.toLocaleString()}
              </button>
            );
          })}

          <button
            type="button"
            disabled={myPoints < 50}
            onClick={() => setSelectedChip(Math.max(50, Math.min(myPoints, 20000)))}
            className="rounded-xl border border-amber-500/50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-40 transition"
          >
            Tất tay
          </button>
        </div>
      </div>

      {/* CẢNH BÁO HOẶC HƯỚNG DẪN MỨC CƯỢC */}
      {myPoints < selectedChip && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
          Số dư ({myPoints.toLocaleString()} xu) không đủ mức cược {selectedChip.toLocaleString()} xu. Hãy chọn chip nhỏ hơn hoặc nhận thêm xu miễn phí!
        </div>
      )}

      {/* BỎ QUA LƯỢT */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Chọn cửa Tài hoặc Xỉu ở trên để đặt cược vé vui vẻ.</span>
        <button
          type="button"
          onClick={() => setHasSkipped(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 text-[11px]"
        >
          <EyeOff size={13} /> Bỏ qua lượt này
        </button>
      </div>

      {hasSkipped && (
        <p className="text-center text-xs text-slate-400 italic">
          Bà con đã chọn nghỉ ngơi ván này, nhâm nhi tách trà xem làng xóc đĩa!
        </p>
      )}
    </div>
  );
}
