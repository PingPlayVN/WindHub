// src/modules/Entertainment/TaiXiu/components/SoiCauModal.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, TrendingUp, Sparkles } from 'lucide-react';
import { DongSonSun } from './HeritageIcons';

export default function SoiCauModal({ isOpen, onClose, history = [] }) {
  // Tab 1: Bảng lưới ma trận 6 hàng + Dây cầu zic-zac
  // Tab 2: Biểu đồ SVG Tổng điểm (3 - 18) + Biểu đồ 3 xí ngầu (1 - 6)
  const [activeTab, setActiveTab] = useState(1);
  const scrollRef = useRef(null);
  const dragControls = useDragControls();

  // Tự động cuộn sang phải (phiên mới nhất) khi mở tab 1
  useEffect(() => {
    if (activeTab === 1 && isOpen) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: scrollRef.current.scrollWidth,
            behavior: 'smooth'
          });
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isOpen]);

  // Bộ lọc bật/tắt từng xí ngầu ở Tab 2
  const [showDice1, setShowDice1] = useState(true);
  const [showDice2, setShowDice2] = useState(true);
  const [showDice3, setShowDice3] = useState(true);

  // Danh sách phiên theo thứ tự thời gian tăng dần (cũ -> mới nhất)
  const chronologicalHistory = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  // Thống kê số phiên Tài, Xỉu, Bão
  const stats = useMemo(() => {
    let tai = 0;
    let xiu = 0;
    let bao = 0;
    for (const h of history) {
      if (h.isTriple || h.outcome === 'BAO') bao++;
      else if (h.outcome === 'TAI' || h.total >= 11) tai++;
      else xiu++;
    }
    return { tai, xiu, bao, total: history.length };
  }, [history]);

  // Tạo ma trận bảng lưới (Grid Matrix 6 hàng dọc x N cột) theo dây cầu
  const gridColumns = useMemo(() => {
    if (!chronologicalHistory.length) return [];
    const cols = [];
    let currentCol = [];
    let currentSide = null;

    for (const round of chronologicalHistory) {
      const isBao = round.isTriple || round.outcome === 'BAO';
      const side = isBao ? 'BAO' : (round.outcome === 'TAI' || round.total >= 11) ? 'TAI' : 'XIU';

      if (currentSide === null) {
        currentSide = side;
        currentCol.push(round);
      } else if (currentSide === side && currentCol.length < 6) {
        currentCol.push(round);
      } else {
        cols.push({ side: currentSide, rounds: currentCol });
        currentSide = side;
        currentCol = [round];
      }
    }
    if (currentCol.length > 0) {
      cols.push({ side: currentSide, rounds: currentCol });
    }
    return cols;
  }, [chronologicalHistory]);

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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* NỀN TỐI BACKDROP HỖ TRỢ BẤM RA NGOÀI ĐỂ ĐÓNG */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
          aria-hidden="true"
        />

        {/* MODAL DI SẢN: BOTTOM SHEET TRÊN MOBILE, DRAGGABLE POPUP TRÊN DESKTOP */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="soicau-modal-title"
          drag
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ left: -260, right: 260, top: -200, bottom: 200 }}
          dragElastic={0.06}
          dragMomentum={false}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border-t-2 sm:border-2 border-[#D5B46B]/80 bg-gradient-to-b from-[#241712] via-[#171411] to-[#100c09] p-4 sm:p-6 text-[#E8DDC8] shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none scrollbar-thin scrollbar-thumb-[#A87932] transform-gpu will-change-transform pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
        >
          {/* NÚT ĐÓNG "X" MÀU ĐỎ SON SƠN MÀI GÓC TRÊN PHẢI */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex size-9 items-center justify-center rounded-full border border-[#D5B46B]/70 bg-gradient-to-br from-[#8E2926] to-[#451311] text-[#FAF5EB] shadow-lg hover:scale-110 active:scale-95 transition-all"
            title="Đóng popup (Esc)"
            aria-label="Đóng cửa sổ lịch sử phiên"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>

          {/* THANH TIÊU ĐỀ: DRAG HANDLE TRÊN DESKTOP & CÁC TAB CHUYỂN MẪU */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#A87932]/30 pb-3 cursor-grab active:cursor-grabbing touch-none select-none pr-12"
          >
            {/* TIÊU ĐỀ POPUP */}
            <div className="flex items-center gap-2">
              <DongSonSun size={24} className="text-[#D5B46B]" />
              <h2
                id="soicau-modal-title"
                className="text-base sm:text-xl font-black uppercase tracking-wider text-[#FAF5EB] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                SOI CẦU LỊCH SỬ PHIÊN
              </h2>
            </div>

            {/* TAB CHUYỂN MẪU 1 & MẪU 2 */}
            <div className="flex items-center gap-1 rounded-xl bg-[#120d0a] p-1 border border-[#A87932]/40 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 1
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] font-black shadow-md'
                    : 'text-[#E8DDC8]/80 hover:text-[#FAF5EB]'
                }`}
              >
                <span>Mẫu 1 (Bảng Cầu)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(2)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 2
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] font-black shadow-md'
                    : 'text-[#E8DDC8]/80 hover:text-[#FAF5EB]'
                }`}
              >
                <span>Mẫu 2 (Biểu Đồ)</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              MẪU 1: BẢNG LƯỚI MA TRẬN 6 HÀNG & DÂY CẦU ZIC-ZAC
             ======================================================== */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* THANH TỔNG HỢP TỈ LỆ TÀI / XỈU */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-black">
                <div className="flex items-center gap-1.5 rounded-full border border-[#8E2926] bg-[#22100f] px-3.5 py-1 text-[#FAF5EB] shadow-md">
                  <span className="size-2.5 rounded-full bg-[#8E2926]" />
                  <span>Tài: {stats.tai}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[#D5B46B]/60 bg-[#1c140e] px-3.5 py-1 text-[#D5B46B] shadow-md">
                  <span className="size-2.5 rounded-full bg-[#D5B46B]" />
                  <span>Xỉu: {stats.xiu}</span>
                </div>
                {stats.bao > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-cyan-500 bg-cyan-950 px-3 py-1 text-cyan-300 shadow-md">
                    <span className="size-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Bão: {stats.bao}</span>
                  </div>
                )}
                <span className="text-[11px] text-[#D5B46B]/70 font-semibold">
                  ({stats.total} phiên gần nhất)
                </span>
              </div>

              {/* VÙNG CUỘN KÉO TỚI LUI: BẢNG LƯỚI SOI CẦU MA TRẬN 6 HÀNG */}
              <div className="rounded-2xl border border-[#A87932]/35 bg-[#120d0a]/95 p-3 shadow-inner">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#D5B46B]">
                  <span>Bảng Lưới Soi Cầu (Kéo vuốt sang trái/phải)</span>
                  <span className="text-[10px] text-[#D5B46B]/70">Mới nhất ở bên phải ➔</span>
                </div>

                <div
                  ref={scrollRef}
                  className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#A87932] cursor-grab active:cursor-grabbing"
                  style={{ minHeight: '170px' }}
                >
                  {gridColumns.length === 0 ? (
                    <div className="flex h-36 w-full items-center justify-center text-xs text-[#E8DDC8]/50">
                      Chưa có đủ dữ liệu phiên để soi cầu
                    </div>
                  ) : (
                    gridColumns.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-1.5 justify-start">
                        {Array.from({ length: 6 }).map((_, rIdx) => {
                          const item = col.rounds[rIdx];
                          if (!item) {
                            return (
                              <div
                                key={rIdx}
                                className="size-6 sm:size-7 rounded-md border border-[#A87932]/20 bg-[#171411]/50"
                              />
                            );
                          }

                          const isBao = item.isTriple || item.outcome === 'BAO';
                          const isTai = !isBao && (item.outcome === 'TAI' || item.total >= 11);

                          return (
                            <div
                              key={rIdx}
                              title={`Phiên #${item.roundId} • Xúc xắc: ${item.dice?.join('-')} • Tổng: ${item.total} (${item.outcome})`}
                              className={`flex size-6 sm:size-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-black shadow-sm transition-transform hover:scale-110 ${
                                isBao
                                  ? 'border-2 border-cyan-400 bg-cyan-600 text-white'
                                  : isTai
                                  ? 'border-2 border-[#D5B46B]/80 bg-[#8E2926] text-[#FAF5EB]'
                                  : 'border-2 border-[#A87932]/80 bg-[#251a14] text-[#D5B46B]'
                              }`}
                            >
                              {item.total}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* DÂY CẦU ZIC-ZAC (BIẾN THIÊN QUA CÁC PHIÊN) */}
              <div className="rounded-2xl border border-[#A87932]/35 bg-[#120d0a]/95 p-3 shadow-inner">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#D5B46B]">
                  <span>Dây Cầu Zic-Zac (Biến thiên qua các phiên)</span>
                  <span className="text-[10px] text-[#D5B46B]/70">Đỏ: Tài • Vàng: Xỉu • Xanh: Bão</span>
                </div>

                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#A87932] cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-1 min-w-max py-2 px-1">
                    {chronologicalHistory.slice(-24).map((r, idx, arr) => {
                      const isBao = r.isTriple || r.outcome === 'BAO';
                      const isTai = !isBao && (r.outcome === 'TAI' || r.total >= 11);

                      return (
                        <div key={idx} className="flex items-center">
                          {/* Hạt tròn đại diện phiên */}
                          <div
                            title={`Phiên #${r.roundId} • Tổng ${r.total}`}
                            className={`flex size-6 sm:size-7 items-center justify-center rounded-full text-[10px] font-black border shadow-sm ${
                              isBao
                                ? 'border-cyan-400 bg-cyan-600 text-white'
                                : isTai
                                ? 'border-[#D5B46B] bg-[#8E2926] text-[#FAF5EB]'
                                : 'border-[#A87932] bg-[#251a14] text-[#D5B46B]'
                            }`}
                          >
                            {r.total}
                          </div>

                          {/* Đoạn kẻ nối giữa các hạt */}
                          {idx < arr.length - 1 && (
                            <div className="h-0.5 w-3 sm:w-4 bg-gradient-to-r from-[#A87932] to-[#D5B46B]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MẪU 2: BIỂU ĐỒ TỔNG ĐIỂM & 3 XÍ NGẦU CÓ TOGGLE
             ======================================================== */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* 3 NÚT BẬT/TẮT ĐƯỜNG XÍ NGẦU */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDice1((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border transition-all active:scale-95 shadow-sm ${
                    showDice1
                      ? 'border-[#D5B46B] bg-[#2e1d15] text-[#D5B46B]'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-600 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice1 ? 'bg-[#D5B46B]' : 'bg-zinc-700'}`} />
                  XÍ NGẦU 1
                </button>

                <button
                  type="button"
                  onClick={() => setShowDice2((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border transition-all active:scale-95 shadow-sm ${
                    showDice2
                      ? 'border-[#8E2926] bg-[#341412] text-[#FAF5EB]'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-600 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice2 ? 'bg-[#8E2926]' : 'bg-zinc-700'}`} />
                  XÍ NGẦU 2
                </button>

                <button
                  type="button"
                  onClick={() => setShowDice3((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border transition-all active:scale-95 shadow-sm ${
                    showDice3
                      ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-600 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice3 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                  XÍ NGẦU 3
                </button>
              </div>

              {/* KHUNG CHỨA 2 ĐỒ THỊ */}
              <div className="rounded-2xl border border-[#A87932]/35 bg-[#120d0a]/95 p-3 shadow-inner space-y-4">
                {/* 1. BIỂU ĐỒ TRÊN: ĐƯỜNG TỔNG ĐIỂM (3 - 18) */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#D5B46B]">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} /> Biểu đồ Tổng Điểm (3 - 18)
                    </span>
                    <span className="text-[10px] text-[#D5B46B]/70">Vuốt kéo ngang để soi ➔</span>
                  </div>

                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#A87932] cursor-grab active:cursor-grabbing">
                    <TotalScoreGraph history={chronologicalHistory.slice(-20)} />
                  </div>
                </div>

                {/* 2. BIỂU ĐỒ DƯỚI: ĐƯỜNG 3 XÍ NGẦU (1 - 6) */}
                <div className="border-t border-[#A87932]/25 pt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#D5B46B]">
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} /> Biểu đồ 3 Xí Ngầu (1 - 6)
                    </span>
                    <span className="text-[10px] text-[#D5B46B]/70">Bật/tắt theo 3 nút trên</span>
                  </div>

                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#A87932] cursor-grab active:cursor-grabbing">
                    <DiceTrajectoryGraph
                      history={chronologicalHistory.slice(-20)}
                      showDice1={showDice1}
                      showDice2={showDice2}
                      showDice3={showDice3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHỈ DẪN CUỐI POPUP */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#D5B46B]/70 border-t border-[#A87932]/25 pt-2">
            <span>Dữ liệu đồng bộ thời gian thực theo từng phiên quay</span>
            <span className="font-bold text-[#FAF5EB]">Mẫu {activeTab}/2</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------
// BIỂU ĐỒ TỔNG ĐIỂM (Thang 3 - 18) DÙNG SVG
// -------------------------------------------------------------
function TotalScoreGraph({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-[#E8DDC8]/50">
        Đang nạp dữ liệu phiên...
      </div>
    );
  }

  const pointSpacing = 36;
  const width = Math.max(480, history.length * pointSpacing + 60);
  const height = 120;
  const paddingLeft = 32;
  const paddingTop = 12;
  const graphHeight = height - paddingTop - 16;

  const getY = (val) => {
    const clamped = Math.max(3, Math.min(18, val || 3));
    return paddingTop + graphHeight - ((clamped - 3) / 15) * graphHeight;
  };

  const points = history.map((item, idx) => ({
    x: paddingLeft + idx * pointSpacing,
    y: getY(item.total),
    total: item.total,
    roundId: item.roundId
  }));

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridLines = [3, 6, 9, 12, 15, 18];

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      {/* Vạch lưới ngang */}
      {gridLines.map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line
              x1={paddingLeft - 6}
              y1={y}
              x2={width - 10}
              y2={y}
              stroke="#35251C"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={paddingLeft - 10}
              y={y + 3}
              textAnchor="end"
              fill="#D5B46B"
              fontSize="9"
              fontWeight="bold"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Đường nối màu vàng kim rực rỡ */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke="#D5B46B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hạt tròn hiển thị tổng điểm tại mỗi phiên */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="8" fill="#171411" stroke="#D5B46B" strokeWidth="2" />
          <text
            x={p.x}
            y={p.y + 3}
            textAnchor="middle"
            fill="#FAF5EB"
            fontSize="8"
            fontWeight="900"
          >
            {p.total}
          </text>
        </g>
      ))}
    </svg>
  );
}

// -------------------------------------------------------------
// BIỂU ĐỒ 3 XÍ NGẦU (Thang 1 - 6) CÓ BẬT/TẮT TOGGLE DÙNG SVG
// -------------------------------------------------------------
function DiceTrajectoryGraph({ history, showDice1, showDice2, showDice3 }) {
  if (!history || history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-[#E8DDC8]/50">
        Đang nạp dữ liệu xí ngầu...
      </div>
    );
  }

  const pointSpacing = 36;
  const width = Math.max(480, history.length * pointSpacing + 60);
  const height = 110;
  const paddingLeft = 32;
  const paddingTop = 10;
  const graphHeight = height - paddingTop - 16;

  const getY = (val) => {
    const clamped = Math.max(1, Math.min(6, val || 1));
    return paddingTop + graphHeight - ((clamped - 1) / 5) * graphHeight;
  };

  const d1Points = history.map((item, idx) => ({
    x: paddingLeft + idx * pointSpacing,
    y: getY(item.dice?.[0] || 1)
  }));
  const d2Points = history.map((item, idx) => ({
    x: paddingLeft + idx * pointSpacing,
    y: getY(item.dice?.[1] || 1)
  }));
  const d3Points = history.map((item, idx) => ({
    x: paddingLeft + idx * pointSpacing,
    y: getY(item.dice?.[2] || 1)
  }));

  const gridLines = [1, 2, 3, 4, 5, 6];

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      {/* Vạch lưới ngang 1 - 6 */}
      {gridLines.map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line
              x1={paddingLeft - 6}
              y1={y}
              x2={width - 10}
              y2={y}
              stroke="#35251C"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={paddingLeft - 10}
              y={y + 3}
              textAnchor="end"
              fill="#D5B46B"
              fontSize="9"
              fontWeight="bold"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* ĐƯỜNG XÍ NGẦU 1 (VÀNG CỔ) */}
      {showDice1 && (
        <>
          <polyline
            points={d1Points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#D5B46B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {d1Points.map((p, idx) => (
            <circle
              key={`d1-${idx}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#D5B46B"
              stroke="#FAF5EB"
              strokeWidth="1"
            />
          ))}
        </>
      )}

      {/* ĐƯỜNG XÍ NGẦU 2 (ĐỎ SON) */}
      {showDice2 && (
        <>
          <polyline
            points={d2Points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#8E2926"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {d2Points.map((p, idx) => (
            <circle
              key={`d2-${idx}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#8E2926"
              stroke="#FAF5EB"
              strokeWidth="1"
            />
          ))}
        </>
      )}

      {/* ĐƯỜNG XÍ NGẦU 3 (XANH LỤC) */}
      {showDice3 && (
        <>
          <polyline
            points={d3Points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {d3Points.map((p, idx) => (
            <circle
              key={`d3-${idx}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#10b981"
              stroke="#FAF5EB"
              strokeWidth="1"
            />
          ))}
        </>
      )}
    </svg>
  );
}
