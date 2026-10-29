// src/modules/Entertainment/TaiXiu/components/SoiCauModal.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export default function SoiCauModal({ isOpen, onClose, history = [] }) {
  // Mode 1: Bảng lưới + Dây zic-zac (Ảnh 1)
  // Mode 2: Biểu đồ Tổng Điểm + 3 Xí Ngầu (Ảnh 2)
  const [activeTab, setActiveTab] = useState(1);
  const scrollRef = useRef(null);
  const dragControls = useDragControls();

  // Tự động cuộn sang phải mượt mà sau khi popup render xong (tránh giật lag khi mở)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* NỀN TỐI BACKDROP HỖ TRỢ BẤM RA NGOÀI ĐỂ ĐÓNG */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          aria-hidden="true"
        />

        {/* CỬA SỔ POPUP HOÀNG GIA - CÓ THỂ KÉO DI CHUYỂN AN TOÀN QUA THANH TIÊU ĐỀ */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="soicau-modal-title"
          drag
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ left: -240, right: 240, top: -200, bottom: 200 }}
          dragElastic={0.06}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[28px] border-2 border-amber-500/90 bg-gradient-to-b from-[#2a1708] via-[#160b03] to-[#0a0502] p-4 sm:p-6 text-amber-50 shadow-2xl select-none scrollbar-thin scrollbar-thumb-amber-700 transform-gpu will-change-transform"
        >
          {/* NÚT ĐÓNG "X" MÀU ĐỎ HOÀNG GIA GÓC TRÊN BÊN PHẢI */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 flex size-9 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-br from-red-600 to-rose-950 text-white shadow-lg hover:scale-110 active:scale-95 transition"
            title="Đóng popup (Esc)"
            aria-label="Đóng cửa sổ lịch sử phiên"
          >
            <X size={18} className="stroke-[3]" />
          </button>

          {/* THANH TIÊU ĐỀ RỒNG VÀNG & TAB CHUYỂN MẪU (KHÔNG BAO GIỜ BỊ NÚT X CHE) */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-amber-600/40 pb-3 cursor-grab active:cursor-grabbing touch-none select-none pr-14"
          >
            {/* TIÊU ĐỀ LỊCH SỬ PHIÊN */}
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
              <h2 id="soicau-modal-title" className="text-lg sm:text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                LỊCH SỬ PHIÊN
              </h2>
            </div>

            {/* TAB CHUYỂN MẪU 1 & MẪU 2: RÕ RÀNG, ĐỘC LẬP, KHÔNG CHE KHUẤT */}
            <div className="flex items-center gap-1 rounded-xl bg-black/70 p-1 border border-amber-500/60 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 1
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <span>Mẫu 1 (Bảng Cầu)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(2)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 2
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <span>Mẫu 2 (Biểu Đồ)</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              MẪU 1: BẢNG LƯỚI SOI CẦU & DÂY CẦU ZIC-ZAC (THEO ĐÚNG ẢNH MẪU 1)
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

              {/* KHU VỰC CHÍNH MẪU 1: 2 CỘT SONG SONG (BẢNG LƯỚI & DÂY CẦU CON RẮN THEO ẢNH) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                {/* CỘT TRÁI (7 phần): BẢNG LƯỚI SOI CẦU MA TRẬN 6 HÀNG (KÉO VUỐT SANG PHẢI) */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-amber-600/50 bg-[#120803]/90 p-3 shadow-inner">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>Bảng Lưới Soi Cầu (6 hàng dọc)</span>
                    <span className="text-[10px] text-amber-400/70">Mới nhất ở bên phải ➔</span>
                  </div>

                  <div
                    ref={scrollRef}
                    className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-amber-600 cursor-grab active:cursor-grabbing"
                    style={{ minHeight: '190px' }}
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
                            return (
                              <div
                                key={rIdx}
                                className="flex size-7 sm:size-8 items-center justify-center rounded-lg border border-amber-800/50 bg-[#1c0f07]/80 shadow-inner"
                              >
                                {item ? (() => {
                                  const isBao = item.isTriple || item.outcome === 'BAO';
                                  const isTai = !isBao && (item.outcome === 'TAI' || item.total >= 11);
                                  return (
                                    <div
                                      title={`Phiên #${item.roundId} • Xúc xắc: ${item.dice?.join('-')} • Tổng: ${item.total} (${item.outcome})`}
                                      className={`flex size-6 sm:size-6.5 items-center justify-center rounded-full text-[10px] sm:text-xs font-black shadow-sm transition-transform hover:scale-110 ${
                                        isBao
                                          ? 'border border-cyan-300 bg-cyan-600 text-white'
                                          : isTai
                                            ? 'border-2 border-amber-400 bg-black text-amber-300'
                                            : 'border-2 border-slate-300 bg-slate-100 text-slate-950'
                                      }`}
                                    >
                                      {item.total}
                                    </div>
                                  );
                                })() : null}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI (5 phần): DÂY CẦU ZIC-ZAC (ĐÚNG THEO ẢNH MẪU 1: CON RẮN 5 CỘT & HUY HIỆU DỌC) */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-amber-600/50 bg-[#120803]/90 p-3 shadow-inner">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>Dây Cầu Zic-Zac (Đúng Mẫu Ảnh 1)</span>
                    <span className="text-[10px] text-amber-400/70">50 phiên gần nhất</span>
                  </div>

                  <SerpentineSnakeGraph
                    history={chronologicalHistory}
                    stats={stats}
                  />
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

// -------------------------------------------------------------
// DÂY CẦU ZIC-ZAC (DẠNG CON RẮN 5 CỘT X 10 HÀNG THEO ẢNH MẪU 1)
// -------------------------------------------------------------
function SerpentineSnakeGraph({ history = [], stats = { tai: 0, xiu: 0, bao: 0 } }) {
  const rounds = useMemo(() => {
    return history.slice(-50);
  }, [history]);

  const COLS = 5;
  const colWidth = 26;
  const rowHeight = 22;
  const padX = 14;
  const padY = 14;

  const points = useMemo(() => {
    return rounds.map((r, i) => {
      const row = Math.floor(i / COLS);
      const isEvenRow = row % 2 === 0;
      const col = isEvenRow ? (i % COLS) : (COLS - 1 - (i % COLS));
      const x = padX + col * colWidth;
      const y = padY + row * rowHeight;
      return { x, y, round: r, row, col, isEvenRow, index: i };
    });
  }, [rounds]);

  const polylineStr = useMemo(() => {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }, [points]);

  const lastPoint = points[points.length - 1];

  const arrowInfo = useMemo(() => {
    if (!lastPoint) return null;
    const { x, y, col, isEvenRow } = lastPoint;
    if (isEvenRow) {
      if (col < COLS - 1) {
        return { type: 'right', x1: x, y1: y, x2: x + 12, y2: y };
      }
      return { type: 'down', x1: x, y1: y, x2: x, y2: y + 12 };
    } else {
      if (col > 0) {
        return { type: 'left', x1: x, y1: y, x2: x - 12, y2: y };
      }
      return { type: 'down', x1: x, y1: y, x2: x, y2: y + 12 };
    }
  }, [lastPoint]);

  const totalRows = Math.max(10, Math.ceil(rounds.length / COLS));
  const svgWidth = padX * 2 + (COLS - 1) * colWidth;
  const svgHeight = padY * 2 + (totalRows - 1) * rowHeight;

  return (
    <div className="flex items-center justify-between gap-3 p-2 bg-gradient-to-b from-[#180d05] to-[#0c0602] rounded-2xl border border-amber-600/40">
      {/* 1. ĐỒ THỊ DÂY CẦU ZIC-ZAC DẠNG CON RẮN */}
      <div className="relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="overflow-visible select-none"
        >
          {points.length > 1 && (
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {arrowInfo && (
            <g opacity="0.9">
              <line
                x1={arrowInfo.x1}
                y1={arrowInfo.y1}
                x2={arrowInfo.x2}
                y2={arrowInfo.y2}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              {arrowInfo.type === 'right' && (
                <polygon
                  points={`${arrowInfo.x2},${arrowInfo.y2 - 3} ${arrowInfo.x2 + 5},${arrowInfo.y2} ${arrowInfo.x2},${arrowInfo.y2 + 3}`}
                  fill="#f59e0b"
                />
              )}
              {arrowInfo.type === 'left' && (
                <polygon
                  points={`${arrowInfo.x2},${arrowInfo.y2 - 3} ${arrowInfo.x2 - 5},${arrowInfo.y2} ${arrowInfo.x2},${arrowInfo.y2 + 3}`}
                  fill="#f59e0b"
                />
              )}
              {arrowInfo.type === 'down' && (
                <polygon
                  points={`${arrowInfo.x2 - 3},${arrowInfo.y2} ${arrowInfo.x2},${arrowInfo.y2 + 5} ${arrowInfo.x2 + 3},${arrowInfo.y2}`}
                  fill="#f59e0b"
                />
              )}
            </g>
          )}

          {points.map((p, i) => {
            const isBao = p.round.isTriple || p.round.outcome === 'BAO';
            const isTai = !isBao && (p.round.outcome === 'TAI' || p.round.total >= 11);
            const isLatest = i === points.length - 1;

            return (
              <g key={i}>
                {isLatest && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8.5"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill={isBao ? '#06b6d4' : isTai ? '#18181b' : '#f8fafc'}
                  stroke={isBao ? '#22d3ee' : isTai ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.5"
                >
                  <title>{`Phiên #${p.round.roundId}: ${p.round.total} điểm (${isBao ? 'Bão' : isTai ? 'Tài' : 'Xỉu'})`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 2. HUY HIỆU TÀI / XỈU DỌC DẠNG VIÊN NHỘNG (THEO ĐÚNG ẢNH MẪU 1) */}
      <div className="flex flex-col items-center justify-center gap-2 pr-1 select-none">
        {/* Huy hiệu Tài */}
        <div
          title={`Tổng số phiên Tài: ${stats.tai}`}
          className="flex items-center gap-1.5 rounded-full border-2 border-yellow-500 bg-black/95 px-3 py-1 shadow-[0_0_12px_rgba(234,179,8,0.35)]"
        >
          <span className="text-xs font-black text-yellow-400 tracking-tight">Tài:</span>
          <span className="font-mono text-sm font-black text-yellow-300">
            {stats.tai}
          </span>
        </div>

        {/* Huy hiệu Xỉu */}
        <div
          title={`Tổng số phiên Xỉu: ${stats.xiu}`}
          className="flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 px-3 py-1 shadow-md"
        >
          <span className="text-xs font-black text-slate-800 tracking-tight">Xỉu:</span>
          <span className="font-mono text-sm font-black text-slate-950">
            {stats.xiu}
          </span>
        </div>

        {/* Huy hiệu Bão (nếu có) */}
        {stats.bao > 0 && (
          <div
            title={`Tổng số phiên Bão: ${stats.bao}`}
            className="flex items-center gap-1.5 rounded-full border-2 border-cyan-400 bg-cyan-950 px-2.5 py-1 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            <span className="text-xs font-black text-cyan-300 tracking-tight">Bão:</span>
            <span className="font-mono text-sm font-black text-cyan-200">
              {stats.bao}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
