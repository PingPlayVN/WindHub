// src/modules/Entertainment/TaiXiu/components/SoiCauHistory.jsx
import React, { useMemo, useState } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const PAGE_SIZE = 6;

export default function SoiCauHistory({ history = [], onOpenModal }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Thống kê tỷ lệ Tài / Xỉu / Bão
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
  const safePage = Math.min(currentPage, totalPages);
  const displayedItems = history.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    const date = new Date(ts);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 rounded-3xl border border-[#A87932]/40 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-4 sm:p-5 text-[#E8DDC8] shadow-[0_8px_24px_rgba(0,0,0,0.65)] select-none w-full">
      {/* HEADER & THỐNG KÊ SOI CẦU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#A87932]/25 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUp size={18} className="text-[#D5B46B]" />
          <h3 className="text-xs sm:text-sm font-black text-[#FAF5EB] uppercase tracking-wide">
            Lịch Sử Kết Quả ({history.length} ván gần nhất)
          </h3>
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D5B46B]/50 bg-[#2b1c15] px-2.5 py-1 text-[11px] font-bold text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] transition-all active:scale-95 shadow-sm"
              title="Mở popup Lịch Sử Phiên dạng đồ thị ma trận chi tiết"
            >
              <span>Soi Cầu Chi Tiết</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>

        {/* Tỷ lệ Tài / Xỉu / Bão */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold flex-wrap">
          <span className="flex items-center gap-1.5 text-[#E8DDC8]">
            <span className="size-2 rounded-full bg-[#8E2926] shadow-[0_0_6px_#8E2926]" />
            <span>Tài: <strong className="text-[#FAF5EB]">{stats.taiPercent}%</strong> ({stats.taiCount})</span>
          </span>
          <span className="text-[#A87932]/40">|</span>
          <span className="flex items-center gap-1.5 text-[#E8DDC8]">
            <span className="size-2 rounded-full bg-[#D5B46B] shadow-[0_0_6px_#D5B46B]" />
            <span>Xỉu: <strong className="text-[#FAF5EB]">{stats.xiuPercent}%</strong> ({stats.xiuCount})</span>
          </span>
          {stats.baoCount > 0 && (
            <>
              <span className="text-[#A87932]/40">|</span>
              <span className="flex items-center gap-1.5 text-[#D5B46B]">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Bão: <strong>{stats.baoCount}</strong></span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* DẢI HẠT KẾT QUẢ PHIÊN (BEAD ROAD MAP) - CUỘN NGANG TRƠN TRU TRÊN MOBILE */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#D5B46B]/80 font-medium px-1">
          <span>Chuỗi phiên gần nhất:</span>
          <span>Mới nhất bên trái ➔</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-[#A87932] scrollbar-track-transparent">
          {history.length === 0 ? (
            <span className="text-xs text-[#E8DDC8]/50 italic">Đang chờ dữ liệu phiên đầu tiên...</span>
          ) : (
            history.slice(0, 24).map((h, i) => {
              const isBao = h.isTriple || h.outcome === 'BAO';
              const isTai = h.outcome === 'TAI';

              return (
                <div
                  key={h.roundId || i}
                  title={`Ván ${h.roundId}: ${h.dice?.join('-')} (${h.total} điểm) -> ${isBao ? 'BÃO' : isTai ? 'TÀI' : 'XỈU'}`}
                  className={`flex size-8 shrink-0 flex-col items-center justify-center rounded-xl font-mono text-xs font-black shadow-md border transition-transform hover:scale-110 ${isBao
                      ? 'bg-gradient-to-br from-cyan-600 to-cyan-950 text-white border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : isTai
                        ? 'bg-gradient-to-br from-[#8E2926] to-[#421312] text-[#FAF5EB] border-[#D5B46B]/50'
                        : 'bg-gradient-to-br from-[#261d18] to-[#120d0a] text-[#D5B46B] border-[#A87932]/60'
                    }`}
                >
                  <span className="text-[11px] font-black">{isBao ? 'B' : isTai ? 'T' : 'X'}</span>
                  <span className="text-[9px] font-semibold opacity-80 leading-none">{h.total}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* BẢNG CHI TIẾT KẾT QUẢ CÓ PHÂN TRANG */}
      <div className="overflow-x-auto rounded-2xl border border-[#A87932]/25 bg-[#171411]/70">
        <table className="w-full text-left text-xs min-w-[320px]">
          <thead>
            <tr className="border-b border-[#A87932]/25 text-[10px] sm:text-[11px] font-bold text-[#D5B46B] uppercase tracking-wider bg-[#221813]/60">
              <th className="py-2.5 px-3">MÃ VÁN</th>
              <th className="py-2.5 px-2 text-center">3 XÚC XẮC</th>
              <th className="py-2.5 px-2 text-center">TỔNG</th>
              <th className="py-2.5 px-2 text-center">KẾT QUẢ</th>
              <th className="py-2.5 px-3 text-right">THỜI GIAN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A87932]/20 font-mono">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-xs text-[#E8DDC8]/50 italic">
                  Chưa có dữ liệu ván đấu
                </td>
              </tr>
            ) : (
              displayedItems.map((item, idx) => {
                const isBao = item.isTriple || item.outcome === 'BAO';
                const isTai = item.outcome === 'TAI';

                return (
                  <tr key={item.roundId || idx} className="hover:bg-[#261a14]/50 transition-colors">
                    <td className="py-2 px-3 text-[#FAF5EB] font-bold">
                      #{item.roundId}
                    </td>
                    <td className="py-2 px-2 text-center text-[#E8DDC8]">
                      {item.dice ? item.dice.join(' - ') : '--'}
                    </td>
                    <td className="py-2 px-2 text-center font-black text-[#D5B46B]">
                      {item.total}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black border ${isBao
                            ? 'bg-cyan-950 text-cyan-200 border-cyan-400'
                            : isTai
                              ? 'bg-[#8E2926]/40 text-[#FAF5EB] border-[#8E2926]'
                              : 'bg-[#2b1c15] text-[#D5B46B] border-[#A87932]/60'
                          }`}
                      >
                        {isBao ? 'BÃO' : isTai ? 'TÀI' : 'XỈU'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-[#E8DDC8]/70 text-[11px]">
                      {formatTime(item.drawTime)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#A87932]/25 pt-2.5 text-xs text-[#E8DDC8]/80">
          <span className="text-[11px]">Trang {safePage} / {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              className="rounded-lg border border-[#A87932]/40 bg-[#221813] p-1.5 text-[#D5B46B] hover:bg-[#32221b] hover:border-[#D5B46B] disabled:opacity-30 transition-all active:scale-95"
              aria-label="Trang trước"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              className="rounded-lg border border-[#A87932]/40 bg-[#221813] p-1.5 text-[#D5B46B] hover:bg-[#32221b] hover:border-[#D5B46B] disabled:opacity-30 transition-all active:scale-95"
              aria-label="Trang sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
