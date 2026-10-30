// src/modules/Entertainment/TaiXiu/components/RoomSwitchHeader.jsx
import React from 'react';
import { Wifi, WifiOff, Users, PlusCircle, Volume2, VolumeX, ShieldAlert, ArrowLeft, TrendingUp, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DongSonSun, HeritageCoinIcon } from './HeritageIcons';

export default function RoomSwitchHeader({
  currentRoomId = 'tai-xiu-30s',
  onSelectRoom,
  connectionStatus = 'CONNECTED',
  onlineCount = 1,
  myPoints = 10000,
  onClaimFreePoints,
  sfxEnabled = true,
  bgmEnabled = true,
  onOpenSoundSettings,
  onToggleSoiCau,
  isSoiCauOpen = false,
  _onOpenRoomSelector,
  onOpenMyBets,
  myBetsCount = 0,
  onOpenGameInfo,
}) {
  const isConnected = connectionStatus === 'CONNECTED';
  const isEligibleForFree = myPoints <= 500;

  return (
    <header className="w-full select-none">
      {/* =========================================================================
          1. HEADER TỐI GIẢN GÓI GỌN 1 HÀNG DÀNH RIÊNG CHO MOBILE (< 1024PX)
          ========================================================================= */}
      <div className="flex lg:hidden items-center justify-between gap-1.5 rounded-2xl border border-[#A87932]/45 bg-gradient-to-r from-[#241712] via-[#1a120e] to-[#241712] p-1.5 text-[#E8DDC8] shadow-md">
        {/* Nhóm bên trái: Quay lại sảnh */}
        <div className="flex items-center gap-1 min-w-0">
          <Link
            to="/entertainment"
            title="Quay lại sảnh"
            aria-label="Quay lại sảnh"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] active:scale-95 transition-all shadow-inner"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Nhóm trung tâm: VÍ XU & NÚT NHẬN THÊM */}
        <div className="flex items-center gap-1 rounded-xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#2a1c15] to-[#171411] px-2 py-1 text-xs shadow-inner">
          <HeritageCoinIcon size={14} className="text-[#D5B46B] shrink-0" />
          <span className="font-mono text-xs xs:text-sm font-black text-[#D5B46B]">
            {myPoints.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#E8DDC8]/80 font-medium">xu</span>

          <button
            type="button"
            onClick={onClaimFreePoints}
            title={isEligibleForFree ? 'Nhận thêm 10,000 xu giải trí miễn phí' : 'Chỉ nhận được khi số dư dưới 500 xu'}
            aria-label="Nhận thêm 10,000 xu giải trí miễn phí"
            className={`p-0.5 rounded-lg transition-all ${
              isEligibleForFree
                ? 'text-amber-400 hover:text-amber-200 animate-pulse'
                : 'text-[#E8DDC8]/40'
            }`}
          >
            <PlusCircle size={14} />
          </button>
        </div>

        {/* Nhóm bên phải: CÁC NÚT MỞ POPUP PHỤ TRỢ */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Nút Soi Cầu (Popup) */}
          <button
            type="button"
            onClick={onToggleSoiCau}
            title="Mở Bảng Soi Cầu"
            aria-label="Mở Bảng Soi Cầu"
            className={`flex size-8 items-center justify-center rounded-xl border transition-all active:scale-95 relative ${
              isSoiCauOpen
                ? 'border-[#D5B46B] bg-[#D5B46B] text-[#171411] shadow-[0_0_10px_rgba(213,180,107,0.5)]'
                : 'border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB]'
            }`}
          >
            <TrendingUp size={15} />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
          </button>

          {/* Nút Vé Cược Cá Nhân (Popup) */}
          <button
            type="button"
            onClick={onOpenMyBets}
            title="Xem Vé Cược Của Bạn"
            aria-label="Xem Vé Cược Của Bạn"
            className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all relative"
          >
            <Ticket size={15} />
            {myBetsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#8E2926] text-[9px] font-black text-[#FAF5EB] border border-[#D5B46B]">
                {myBetsCount}
              </span>
            )}
          </button>

          {/* Nút Âm Thanh (Popup) */}
          <button
            type="button"
            onClick={onOpenSoundSettings}
            title="Cài đặt âm thanh & Lofi"
            aria-label="Cài đặt âm thanh & Lofi"
            className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all relative"
          >
            {sfxEnabled || bgmEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-[#E8DDC8]/40" />}
            {bgmEnabled && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            )}
          </button>

          {/* Nút Thông Tin & Luật (Popup) */}
          <button
            type="button"
            onClick={onOpenGameInfo}
            title="Xem Luật Chơi & Giải Thích"
            aria-label="Xem Luật Chơi & Giải Thích"
            className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
          >
            <ShieldAlert size={15} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. HEADER ĐẦY ĐỦ DÀNH CHO BẢN DESKTOP (>= 1024PX)
          ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-2.5 w-full">
        {/* CẢNH BÁO GIẢI TRÍ LÀNH MẠNH */}
        <div className="flex items-center gap-2 rounded-xl border border-[#A87932]/30 bg-gradient-to-r from-[#241712]/90 via-[#1c120e]/80 to-[#241712]/90 px-3 py-1.5 text-xs text-[#E8DDC8]/90 shadow-sm backdrop-blur-xs">
          <ShieldAlert size={14} className="shrink-0 text-[#D5B46B]" />
          <span className="leading-snug">
            <strong className="text-[#D5B46B] font-semibold">Giải trí mô phỏng dân gian:</strong> Điểm xu cấp miễn phí, không có giá trị tiền tệ, không nạp/rút tiền thật.
          </span>
        </div>

        {/* KHUNG ĐIỀU KHIỂN CHÍNH */}
        <div className="relative overflow-hidden rounded-2xl border border-[#A87932]/40 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-4 text-[#E8DDC8] shadow-[0_8px_24px_rgba(0,0,0,0.65)]">
          <div className="pointer-events-none absolute -right-8 -top-8 opacity-10 text-[#D5B46B]">
            <DongSonSun size={140} />
          </div>

          {/* HÀNG TRÊN: NÚT QUAY LẠI, LOGO TRỐNG ĐỒNG, TÊN PHÒNG & TRẠNG THÁI */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#A87932]/25">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/entertainment"
                title="Quay lại sảnh trò chơi"
                aria-label="Quay lại sảnh trò chơi"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner"
              >
                <ArrowLeft size={18} />
              </Link>

              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#D5B46B]/60 bg-gradient-to-br from-[#A87932]/40 to-[#171411] text-[#D5B46B] shadow-sm">
                  <DongSonSun size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-widest text-[#D5B46B] uppercase">
                      SÒNG TÀI XỈU DÂN GIAN
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                        isConnected
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isConnected ? <Wifi size={10} className="text-emerald-400" /> : <WifiOff size={10} className="text-rose-400" />}
                      <span>{isConnected ? 'Trực tuyến' : 'Đang nối...'}</span>
                    </span>
                  </div>
                  <h1 className="text-lg font-black text-[#FAF5EB] tracking-tight truncate mt-0.5">
                    {currentRoomId === 'tai-xiu-15s' ? '⚡ Bàn Chợ Phiên (25s)' : '🏛️ Bàn Xóm Đình (50s)'}
                  </h1>
                </div>
              </div>
            </div>

            {/* SỐ BÀ CON & SỐ DƯ XU */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div
                title={`${onlineCount} bà con đang cùng sòng`}
                className="flex items-center gap-1.5 rounded-xl border border-[#A87932]/35 bg-[#1f1612]/90 px-2.5 py-1.5 text-xs text-[#E8DDC8]"
              >
                <Users size={14} className="text-[#D5B46B]" />
                <span className="text-xs">
                  <strong className="text-[#FAF5EB]">{onlineCount}</strong> bà con
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#2a1c15] to-[#1c130e] px-2.5 py-1.5 text-xs shadow-inner">
                <HeritageCoinIcon size={15} className="text-[#D5B46B]" />
                <span className="font-mono text-sm font-black text-[#D5B46B]">
                  {myPoints.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#E8DDC8]/80 font-medium">xu</span>

                <button
                  type="button"
                  onClick={onClaimFreePoints}
                  title={isEligibleForFree ? 'Nhận thêm 10,000 xu giải trí miễn phí' : 'Chỉ nhận được khi số dư dưới 500 xu'}
                  aria-label="Nhận thêm 10,000 xu giải trí miễn phí"
                  className={`ml-0.5 p-1 rounded-lg transition-all ${
                    isEligibleForFree
                      ? 'text-amber-400 hover:text-amber-200 animate-pulse'
                      : 'text-[#E8DDC8]/40 hover:text-[#E8DDC8]/60'
                  }`}
                >
                  <PlusCircle size={15} />
                </button>
              </div>

              {/* Cài đặt âm thanh */}
              <button
                type="button"
                onClick={onOpenSoundSettings}
                title="Cài đặt âm thanh & nhạc nền Lofi"
                aria-label="Cài đặt âm thanh & nhạc nền Lofi"
                className="flex size-9 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner relative"
              >
                {sfxEnabled || bgmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-[#E8DDC8]/40" />}
                {bgmEnabled && (
                  <span
                    className="absolute top-1 right-1 size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                    title="Đang phát nhạc nền Lofi"
                  />
                )}
              </button>
            </div>
          </div>

          {/* HÀNG DƯỚI: NÚT CHỌN BÀN & NÚT SOI CẦU */}
          <div className="relative z-10 flex items-center justify-between gap-2 pt-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectRoom('tai-xiu-30s')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  currentRoomId === 'tai-xiu-30s'
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] font-black shadow-[0_2px_10px_rgba(213,180,107,0.35)] border border-[#FAF5EB]/40'
                    : 'bg-[#221611]/80 border border-[#A87932]/40 text-[#E8DDC8] hover:bg-[#2e1f18] hover:text-[#FAF5EB]'
                }`}
              >
                <span>🏛️ Xóm Đình (50s)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRoom('tai-xiu-15s')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  currentRoomId === 'tai-xiu-15s'
                    ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] font-black shadow-[0_2px_10px_rgba(213,180,107,0.35)] border border-[#FAF5EB]/40'
                    : 'bg-[#221611]/80 border border-[#A87932]/40 text-[#E8DDC8] hover:bg-[#2e1f18] hover:text-[#FAF5EB]'
                }`}
              >
                <span>⚡ Chợ Phiên (25s)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleSoiCau}
              title="Bật/Tắt Cửa Sổ Soi Cầu Lịch Sử Phiên"
              className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border active:scale-95 ${
                isSoiCauOpen
                  ? 'border-[#D5B46B] bg-gradient-to-r from-[#D5B46B] to-[#B8974B] text-[#171411] font-black shadow-[0_0_16px_rgba(213,180,107,0.5)]'
                  : 'border-[#A87932]/50 bg-gradient-to-r from-[#291b14] to-[#1c120e] text-[#D5B46B] hover:border-[#D5B46B] hover:text-[#FAF5EB]'
              }`}
            >
              <TrendingUp size={16} className={isSoiCauOpen ? 'text-[#171411]' : 'text-[#D5B46B] animate-pulse'} />
              <span>Soi Cầu Lịch Sử Phiên</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
