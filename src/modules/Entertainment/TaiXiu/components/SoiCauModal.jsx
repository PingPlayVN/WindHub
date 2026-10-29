// src/modules/Entertainment/TaiXiu/components/SoiCauModal.jsx
import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Move } from 'lucide-react';

export default function SoiCauModal({ isOpen, onClose, history = [] }) {
  // Mode 1: Bảng lưới + Dây zic-zac (Ảnh 1)
  // Mode 2: Biểu đồ Tổng Điểm + 3 Xí Ngầu (Ảnh 2)
  const [activeTab, setActiveTab] = useState(1);

  // Bộ lọc bật/tắt từng xí ngầu ở Mode 2
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

      // Cùng cửa thì xếp tiếp vào cột (tối đa 6 hàng), khác cửa thì sang cột mới
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

  const scrollRef = useRef(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* CỬA SỔ POPUP HOÀNG GIA - CÓ THỂ KÉO DI CHUYỂN TOÀN MÀN HÌNH */}
        <motion.div
          drag
          dragConstraints={{ left: -320, right: 320, top: -240, bottom: 240 }}
          dragElastic={0.05}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto relative w-full max-w-2xl rounded-[28px] border-2 border-amber-500/90 bg-gradient-to-b from-[#2a1708] via-[#160b03] to-[#0a0502] p-4 sm:p-6 text-amber-50 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.35)] select-none"
        >
          {/* NÚT ĐÓNG "X" MÀU ĐỎ HOÀNG GIA GÓC TRÊN BÊN PHẢI */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-30 flex size-9 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-br from-red-600 to-rose-950 text-white shadow-lg hover:scale-110 active:scale-95 transition"
            title="Đóng popup"
          >
            <X size={18} className="stroke-[3]" />
          </button>

          {/* THANH TIÊU ĐỀ RỒNG VÀNG CÓ THỂ CẦM KÉO DI CHUYỂN */}
          <div className="relative mb-4 flex items-center justify-between border-b border-amber-600/40 pb-3 cursor-grab active:cursor-grabbing">
            {/* Nút lật trang sang trái (<) */}
            <button
              type="button"
              onClick={() => setActiveTab((prev) => (prev === 1 ? 2 : 1))}
              className="flex items-center gap-1 rounded-xl border border-amber-500/60 bg-amber-950/80 px-2.5 py-1 text-xs font-black text-amber-300 shadow hover:bg-amber-800/80 transition"
              title="Xem mẫu biểu đồ khác"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Mẫu {activeTab === 1 ? '2' : '1'}</span>
            </button>

            {/* TIÊU ĐỀ LỊCH SỬ PHIÊN */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400 animate-pulse" />
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  LỊCH SỬ PHIÊN
                </h2>
                <Sparkles size={18} className="text-amber-400 animate-pulse" />
              </div>
              <span className="text-[10px] sm:text-xs text-amber-400/80 font-medium flex items-center gap-1">
                <Move size={12} /> Cầm thanh tiêu đề kéo di chuyển • Bấm mũi tên lật bảng
              </span>
            </div>

            {/* Nút lật trang sang phải (>) */}
            <button
              type="button"
              onClick={() => setActiveTab((prev) => (prev === 1 ? 2 : 1))}
              className="flex items-center gap-1 rounded-xl border border-amber-500/60 bg-amber-950/80 px-2.5 py-1 text-xs font-black text-amber-300 shadow hover:bg-amber-800/80 transition"
              title="Xem mẫu biểu đồ khác"
            >
              <span className="hidden sm:inline">Mẫu {activeTab === 1 ? '2' : '1'}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ========================================================
              MẪU 1: BẢNG LƯỚI SOI CẦU & DÂY CẦU ZIC-ZAC (ẢNH 1)
             ======================================================== */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* THANH TỔNG HỢP TỈ LỆ TÀI / XỈU */}
              <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-black">
                <div className="flex items-center gap-1.5 rounded-full border-2 border-amber-500 bg-black/80 px-3.5 py-1 text-amber-400 shadow-md">
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span>Tài: {stats.tai}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border-2 border-slate-400 bg-black/80 px-3.5 py-1 text-slate-100 shadow-md">
                  <span className="size-2.5 rounded-full bg-slate-100" />
                  <span>Xỉu: {stats.xiu}</span>
                </div>
                {stats.bao > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border-2 border-red-500 bg-black/80 px-3 py-1 text-red-400 shadow-md">
                    <span className="size-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>Bão: {stats.bao}</span>
                  </div>
                )}
                <span className="text-[11px] text-amber-400/70 font-semibold">({stats.total} phiên gần nhất)</span>
              </div>

              {/* VÙNG CUỘN KÉO TỚI LUI: BẢNG LƯỚI SOI CẦU MA TRẬN 6 HÀNG */}
              <div className="rounded-2xl border border-amber-600/50 bg-[#120803]/90 p-3 shadow-inner">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>Bảng Lưới Soi Cầu (Kéo vuốt sang trái/phải)</span>
                  <span className="text-[10px] text-amber-400/70">Mới nhất ở bên phải ➔</span>
                </div>

                <div
                  ref={scrollRef}
                  className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-amber-600 cursor-grab active:cursor-grabbing"
                  style={{ minHeight: '170px' }}
                >
                  {gridColumns.length === 0 ? (
                    <div className="flex h-36 w-full items-center justify-center text-xs text-amber-400/60">
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
                                className="size-6 sm:size-7 rounded-md border border-amber-900/40 bg-black/30"
                              />
                            );
                          }

                          const isBao = item.isTriple || item.outcome === 'BAO';
                          const isTai = !isBao && (item.outcome === 'TAI' || item.total >= 11);

                          return (
                            <div
                              key={rIdx}
                              title={`Phiên #${item.roundId} • Xúc xắc: ${item.dice?.join('-')} • Tổng: ${item.total} (${item.outcome})`}
                              className={`flex size-6 sm:size-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-black shadow-md transform transition hover:scale-125 ${
                                isBao
                                  ? 'border-2 border-red-400 bg-gradient-to-br from-red-600 to-rose-900 text-white animate-pulse'
                                  : isTai
                                    ? 'border-2 border-amber-400 bg-black text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                    : 'border-2 border-slate-500 bg-slate-100 text-slate-950'
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

              {/* DÂY CẦU ZIC-ZAC (SNAKE PATH ROADMAP - THEO ẢNH 1) */}
              <div className="rounded-2xl border border-amber-600/50 bg-[#120803]/90 p-3 shadow-inner">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>Dây Cầu Zic-Zac (Biến thiên qua các phiên)</span>
                  <span className="text-[10px] text-amber-400/70">Đen: Tài • Trắng: Xỉu</span>
                </div>

                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-600 cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-1 min-w-max py-2 px-1">
                    {chronologicalHistory.slice(-24).map((r, idx, arr) => {
                      const isBao = r.isTriple || r.outcome === 'BAO';
                      const isTai = !isBao && (r.outcome === 'TAI' || r.total >= 11);

                      return (
                        <div key={idx} className="flex items-center">
                          {/* Hạt tròn đại diện phiên */}
                          <div
                            title={`Phiên #${r.roundId} • Tổng ${r.total}`}
                            className={`flex size-6 sm:size-7 items-center justify-center rounded-full text-[10px] font-black border-2 shadow-sm ${
                              isBao
                                ? 'border-red-400 bg-red-600 text-white'
                                : isTai
                                  ? 'border-amber-400 bg-black text-amber-300'
                                  : 'border-slate-400 bg-slate-100 text-slate-900'
                            }`}
                          >
                            {r.total}
                          </div>

                          {/* Đoạn kẻ nối giữa các hạt */}
                          {idx < arr.length - 1 && (
                            <div className="h-0.5 w-3 sm:w-4 bg-gradient-to-r from-amber-500 to-amber-700" />
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
              MẪU 2: BIỂU ĐỒ TỔNG ĐIỂM & 3 XÍ NGẦU CÓ TOGGLE (ẢNH 2)
             ======================================================== */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* 3 NÚT BẬT/TẮT ĐƯỜNG XÍ NGẦU (THEO ẢNH 2) */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDice1((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2 transition shadow-md ${
                    showDice1
                      ? 'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.5)]'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-500 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice1 ? 'bg-fuchsia-400' : 'bg-zinc-600'}`} />
                  XÍ NGẦU 1
                </button>

                <button
                  type="button"
                  onClick={() => setShowDice2((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2 transition shadow-md ${
                    showDice2
                      ? 'border-rose-400 bg-rose-950/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-500 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice2 ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                  XÍ NGẦU 2
                </button>

                <button
                  type="button"
                  onClick={() => setShowDice3((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2 transition shadow-md ${
                    showDice3
                      ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-500 opacity-60'
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${showDice3 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  XÍ NGẦU 3
                </button>
              </div>

              {/* KHUNG CHỨA 2 ĐỒ THỊ (CÓ THỂ CUỘN NGANG KÉO TỚI LUI) */}
              <div className="rounded-2xl border border-amber-600/50 bg-[#120803]/90 p-3 shadow-inner space-y-4">
                {/* 1. BIỂU ĐỒ TRÊN: ĐƯỜNG TỔNG ĐIỂM (3 - 18) */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1 text-amber-400">
                      <TrendingUp size={14} /> Biểu đồ Tổng Điểm (3 - 18)
                    </span>
                    <span className="text-[10px] text-amber-400/70">Vuốt kéo ngang để soi ➔</span>
                  </div>

                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-600 cursor-grab active:cursor-grabbing">
                    <TotalScoreGraph history={chronologicalHistory.slice(-20)} />
                  </div>
                </div>

                {/* 2. BIỂU ĐỒ DƯỚI: ĐƯỜNG 3 XÍ NGẦU (1 - 6) */}
                <div className="border-t border-amber-900/60 pt-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Sparkles size={14} /> Biểu đồ 3 Xí Ngầu (1 - 6)
                    </span>
                    <span className="text-[10px] text-amber-400/70">Bật/tắt theo 3 nút trên</span>
                  </div>

                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-600 cursor-grab active:cursor-grabbing">
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
          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-400/70 border-t border-amber-900/40 pt-2">
            <span>Dữ liệu đồng bộ thời gian thực theo từng phiên quay</span>
            <span className="font-bold text-amber-300">Tab {activeTab}/2</span>
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
    return <div className="h-32 flex items-center justify-center text-xs text-amber-400/50">Đang nạp dữ liệu phiên...</div>;
  }

  const pointSpacing = 34; // Khoảng cách giữa các phiên
  const width = Math.max(480, history.length * pointSpacing + 60);
  const height = 120;
  const paddingLeft = 32;
  const paddingTop = 12;
  const graphHeight = height - paddingTop - 16;

  // Tính tọa độ Y: thang từ 3 đến 18
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

  // Vạch ngang mốc 3, 6, 9, 12, 15, 18
  const gridLines = [3, 6, 9, 12, 15, 18];

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      {/* Vạch lưới ngang */}
      {gridLines.map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line x1={paddingLeft - 6} y1={y} x2={width - 10} y2={y} stroke="#451a03" strokeWidth="1" strokeDasharray="3 3" />
            <text x={paddingLeft - 10} y={y + 3} textAnchor="end" fill="#d97706" fontSize="9" fontWeight="bold">
              {val}
            </text>
          </g>
        );
      })}

      {/* Đường nối màu vàng kim rực rỡ */}
      <polyline points={polylineStr} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Hạt tròn hiển thị tổng điểm tại mỗi phiên */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="8" fill="#ffffff" stroke="#d97706" strokeWidth="2" />
          <text x={p.x} y={p.y + 3} textAnchor="middle" fill="#000000" fontSize="8" fontWeight="900">
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
    return <div className="h-32 flex items-center justify-center text-xs text-amber-400/50">Đang nạp dữ liệu xí ngầu...</div>;
  }

  const pointSpacing = 34;
  const width = Math.max(480, history.length * pointSpacing + 60);
  const height = 110;
  const paddingLeft = 32;
  const paddingTop = 10;
  const graphHeight = height - paddingTop - 16;

  // Tính tọa độ Y: thang từ 1 đến 6
  const getY = (val) => {
    const clamped = Math.max(1, Math.min(6, val || 1));
    return paddingTop + graphHeight - ((clamped - 1) / 5) * graphHeight;
  };

  const d1Points = history.map((item, idx) => ({ x: paddingLeft + idx * pointSpacing, y: getY(item.dice?.[0] || 1), val: item.dice?.[0] || 1 }));
  const d2Points = history.map((item, idx) => ({ x: paddingLeft + idx * pointSpacing, y: getY(item.dice?.[1] || 1), val: item.dice?.[1] || 1 }));
  const d3Points = history.map((item, idx) => ({ x: paddingLeft + idx * pointSpacing, y: getY(item.dice?.[2] || 1), val: item.dice?.[2] || 1 }));

  const gridLines = [1, 2, 3, 4, 5, 6];

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      {/* Vạch lưới ngang 1 - 6 */}
      {gridLines.map((val) => {
        const y = getY(val);
        return (
          <g key={val}>
            <line x1={paddingLeft - 6} y1={y} x2={width - 10} y2={y} stroke="#451a03" strokeWidth="1" strokeDasharray="3 3" />
            <text x={paddingLeft - 10} y={y + 3} textAnchor="end" fill="#d97706" fontSize="9" fontWeight="bold">
              {val}
            </text>
          </g>
        );
      })}

      {/* ĐƯỜNG XÍ NGẦU 1 (TÍM HỒNG) */}
      {showDice1 && (
        <>
          <polyline
            points={d1Points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#d946ef"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {d1Points.map((p, idx) => (
            <circle key={`d1-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#d946ef" stroke="#ffffff" strokeWidth="1" />
          ))}
        </>
      )}

      {/* ĐƯỜNG XÍ NGẦU 2 (ĐỎ CAM) */}
      {showDice2 && (
        <>
          <polyline
            points={d2Points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {d2Points.map((p, idx) => (
            <circle key={`d2-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
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
            <circle key={`d3-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
          ))}
        </>
      )}
    </svg>
  );
}
