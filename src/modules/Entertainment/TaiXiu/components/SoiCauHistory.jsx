// src/modules/Entertainment/TaiXiu/components/SoiCauHistory.jsx
import { useMemo, useState, useEffect } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 6;

export default function SoiCauHistory({ history = [], onOpenModal }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Thống kê tỷ lệ Tài / Xỉu
  const stats = useMemo(() => {
    let taiCount = 0;
    let xiuCount = 0;
    let baoCount = 0;

    history.forEach((h) => {
      if (h.isTriple || h.outcome === 'BAO') baoCount++;
      else if (h.outcome === 'TAI') taiCount++;
      else if (h.outcome === 'XIU') xiuCount++;
    });

    const total = history.length || 1;
    return {
      taiCount,
      xiuCount,
      baoCount,
      taiPercent: Math.round((taiCount / total) * 100),
      xiuPercent: Math.round((xiuCount / total) * 100)
    };
  }, [history]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const displayedItems = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    const date = new Date(ts);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c0d10]">
      {/* HEADER & THỐNG KÊ SOI CẦU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Bảng Soi Cầu Tài Xỉu ({history.length} ván gần nhất)
          </h3>
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="ml-2 inline-flex items-center gap-1 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition"
              title="Mở popup Lịch Sử Phiên dạng đồ thị và ma trận hoàng gia"
            >
              <span>Popup Soi Cầu ↗</span>
            </button>
          )}
        </div>

        {/* Tỷ lệ Tài / Xỉu */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <span className="size-2 rounded-full bg-rose-500" /> Tài {stats.taiPercent}% ({stats.taiCount})
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
            <span className="size-2 rounded-full bg-sky-500" /> Xỉu {stats.xiuPercent}% ({stats.xiuCount})
          </span>
          {stats.baoCount > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-amber-500">
                <span className="size-2 rounded-full bg-amber-400 animate-ping" /> Bão ({stats.baoCount})
              </span>
            </>
          )}
        </div>
      </div>

      {/* DÒNG HẠT SOI CẦU (BEAD ROAD MAP) */}
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {history.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Đang chờ ván đầu tiên...</span>
        ) : (
          history.slice(0, 24).map((h, i) => {
            const isBao = h.isTriple || h.outcome === 'BAO';
            const isTai = h.outcome === 'TAI';

            return (
              <div
                key={h.roundId || i}
                title={`Ván ${h.roundId}: ${h.dice?.join('-')} (${h.total}đ) -> ${isBao ? 'BÃO' : isTai ? 'TÀI' : 'XỈU'}`}
                className={`flex size-8 shrink-0 flex-col items-center justify-center rounded-xl font-mono text-xs font-black shadow-sm ${
                  isBao
                    ? 'bg-amber-400 text-black border border-amber-300'
                    : isTai
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                }`}
              >
                <span>{isBao ? 'B' : isTai ? 'T' : 'X'}</span>
                <span className="text-[9px] font-semibold opacity-75">{h.total}</span>
              </div>
            );
          })
        )}
      </div>

      {/* BẢNG CHI TIẾT CÓ PHÂN TRANG */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 dark:border-slate-800/80">
              <th className="py-2 px-2">MÃ VÁN</th>
              <th className="py-2 px-2 text-center">3 XÚC XẮC</th>
              <th className="py-2 px-2 text-center">TỔNG ĐIỂM</th>
              <th className="py-2 px-2 text-center">KẾT QUẢ</th>
              <th className="py-2 px-2 text-right">THỜI GIAN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {displayedItems.map((item, idx) => {
              const isBao = item.isTriple || item.outcome === 'BAO';
              const isTai = item.outcome === 'TAI';

              return (
                <tr key={item.roundId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="py-2 px-2 text-slate-700 dark:text-slate-300 font-medium">
                    {item.roundId}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300">
                    {item.dice ? item.dice.join(' - ') : '--'}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-slate-800 dark:text-slate-100">
                    {item.total}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      isBao
                        ? 'bg-amber-400 text-black'
                        : isTai
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                    }`}>
                      {isBao ? 'BÃO' : isTai ? 'TÀI' : 'XỈU'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400 text-[11px]">
                    {formatTime(item.drawTime)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400">Trang {currentPage} / {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:text-slate-300"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:text-slate-300"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
