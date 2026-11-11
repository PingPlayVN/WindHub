// src/modules/Entertainment/TaiXiu/components/RoomSwitchHeader.jsx
import React from 'react';
import { Wifi, WifiOff, Users, Volume2, VolumeX, ShieldAlert, ArrowLeft, TrendingUp, Ticket, Gift, User, Share2, ChevronDown, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DongSonSun, HeritageCoinIcon } from './HeritageIcons';

export default function RoomSwitchHeader({
  currentRoomId = 'tai-xiu-30s',
  onSelectRoom,
  connectionStatus = 'CONNECTED',
  onlineCount = 1,
  myPoints = 10000,
  sfxEnabled = true,
  bgmEnabled = true,
  onOpenSoundSettings,
  onToggleSoiCau,
  isSoiCauOpen = false,
  onOpenRoomSelector,
  onOpenMyBets,
  myBetsCount = 0,
  onOpenGameInfo,
  onOpenDailyReward,
  onOpenProfile,
  onOpenShare,
  onOpenDonate,
  onOpenGiftCode,
  onExitGame,
  canClaimReward = true,
}) {
  const isConnected = connectionStatus === 'CONNECTED';

  const handleExit = (e) => {
    if (typeof onExitGame === 'function') {
      e.preventDefault();
      onExitGame();
    }
  };

  return (
    <header className="w-full select-none shrink-0">
      {/* =========================================================================
          1. HEADER GỌN HAI HÀNG DÀNH RIÊNG CHO MOBILE (< 1024PX)
          ========================================================================= */}
      <div className="flex lg:hidden flex-col gap-1 rounded-xl border border-[#A87932]/45 bg-gradient-to-r from-[#241712] via-[#1a120e] to-[#241712] p-1.5 text-[#E8DDC8] shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Link
              to="/entertainment"
              onClick={handleExit}
              title="Rời bàn về sảnh giải trí"
              aria-label="Rời bàn về sảnh giải trí"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] active:scale-95 transition-all shadow-inner"
            >
              <ArrowLeft size={14} />
            </Link>

            <button
              type="button"
              onClick={onOpenRoomSelector}
              title="Đổi bàn chơi (50s / 25s)"
              className="flex min-h-10 items-center gap-1 rounded-lg border border-[#D5B46B]/50 bg-[#2b1c15] px-2 py-1.5 text-[11px] font-black text-[#FAF5EB] active:scale-95 transition-all shadow-inner shrink-0"
            >
              <span>{currentRoomId === 'tai-xiu-15s' ? '⚡ 25s' : '🏛️ 50s'}</span>
              <ChevronDown size={11} className="text-[#D5B46B]" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            title="Nhấn để xem Ví & Sổ cái giao dịch"
            aria-label="Xem ví và sổ cái giao dịch"
            className="flex min-h-10 items-center gap-1 rounded-lg border border-[#D5B46B]/40 bg-gradient-to-r from-[#2a1c15] to-[#171411] px-2.5 py-1.5 text-xs shadow-inner active:scale-95 transition-all shrink-0"
          >
            <HeritageCoinIcon size={13} className="text-[#D5B46B] shrink-0" />
            <span className="font-mono text-[11px] xs:text-xs font-black text-[#D5B46B]">
              {myPoints.toLocaleString()}
            </span>
          </button>
        </div>

        <div className="flex w-full items-center justify-between gap-1 overflow-x-auto border-t border-[#A87932]/25 pt-1 touch-pan-x max-[375px]:grid max-[375px]:grid-cols-4 max-[375px]:justify-items-center max-[375px]:overflow-visible">
          {/* Nhóm nút thao tác phụ trên mobile */}
          <button
            type="button"
            onClick={onOpenDailyReward}
            title={canClaimReward ? 'Có quà điểm danh hôm nay!' : 'Đã điểm danh hôm nay'}
            aria-label={canClaimReward ? 'Nhận quà điểm danh' : 'Đã điểm danh hôm nay'}
            className={`relative flex size-10 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95 ${
              canClaimReward
                ? 'border-[#D5B46B] bg-gradient-to-br from-[#8E2926] to-[#A87932] text-[#FAF5EB] shadow-[0_0_8px_rgba(213,180,107,0.5)] animate-pulse'
                : 'border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B]/60'
            }`}
          >
            <Gift size={16} />
            {canClaimReward && (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGiftCode}
            title="Nhập Giftcode nhận xu"
            aria-label="Nhập Giftcode nhận xu"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
          >
            <Ticket size={16} />
          </button>

          <button
            type="button"
            onClick={onOpenDonate}
            title="Ủng hộ duy trì server • Tặng xu tri ân"
            aria-label="Ủng hộ duy trì server"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/60 bg-gradient-to-br from-[#8E2926] to-[#A87932] text-[#FAF5EB] shadow-[0_0_6px_rgba(213,180,107,0.4)] active:scale-95 transition-all"
          >
            <Coffee size={16} className="text-amber-200" />
          </button>

          {/* Nút Soi Cầu (Popup) */}
          <button
            type="button"
            onClick={onToggleSoiCau}
            title="Mở Bảng Soi Cầu"
            aria-label="Mở Bảng Soi Cầu"
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95 relative ${
              isSoiCauOpen
                ? 'border-[#D5B46B] bg-[#D5B46B] text-[#171411] shadow-[0_0_10px_rgba(213,180,107,0.5)]'
                : 'border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB]'
            }`}
          >
            <TrendingUp size={16} />
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
          </button>

          {/* Nút Vé Cược Cá Nhân (Popup) */}
          <button
            type="button"
            onClick={onOpenMyBets}
            title="Xem Vé Cược Của Bạn"
            aria-label="Xem Vé Cược Của Bạn"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all relative"
          >
            <Ticket size={16} />
            {myBetsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-[#8E2926] text-[8px] font-black text-[#FAF5EB] border border-[#D5B46B]">
                {myBetsCount}
              </span>
            )}
          </button>

          {/* Nút Chia Sẻ Bàn Chơi (Popup) */}
          <button
            type="button"
            onClick={onOpenShare}
            title="Chia sẻ liên kết bàn chơi cho bạn bè"
            aria-label="Chia sẻ liên kết bàn chơi cho bạn bè"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
          >
            <Share2 size={16} />
          </button>

          {/* Nút Âm Thanh (Popup) */}
          <button
            type="button"
            onClick={onOpenSoundSettings}
            title="Cài đặt âm thanh & Lofi"
            aria-label="Cài đặt âm thanh & Lofi"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all relative"
          >
            {sfxEnabled || bgmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-[#E8DDC8]/40" />}
            {bgmEnabled && (
              <span className="absolute top-0.5 right-0.5 size-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            )}
          </button>

          {/* Nút Hồ Sơ & Ví Xu */}
          {/* Nút Thông Tin & Luật (Popup) */}
          <button
            type="button"
            onClick={onOpenGameInfo}
            title="Xem Luật Chơi & Giải Thích"
            aria-label="Xem Luật Chơi & Giải Thích"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
          >
            <ShieldAlert size={16} />
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
                onClick={handleExit}
                title="Rời bàn về sảnh giải trí"
                aria-label="Rời bàn về sảnh giải trí"
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
                title={`${onlineCount} người chơi đang cùng sòng`}
                className="flex items-center gap-1.5 rounded-xl border border-[#A87932]/35 bg-[#1f1612]/90 px-2.5 py-1.5 text-xs text-[#E8DDC8]"
              >
                <Users size={14} className="text-[#D5B46B]" />
                <span className="text-xs">
                  <strong className="text-[#FAF5EB]">{onlineCount}</strong> người chơi
                </span>
              </div>

              {/* Nút Điểm danh 7 ngày */}
              <button
                type="button"
                onClick={onOpenDailyReward}
                title="Điểm danh nhận 5.000 - 100.000 xu mỗi ngày"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  canClaimReward
                    ? 'border-[#D5B46B] bg-gradient-to-r from-[#8E2926] via-[#A87932] to-[#8E2926] text-[#FAF5EB] animate-pulse shadow-[0_0_12px_rgba(213,180,107,0.4)]'
                    : 'border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B]/70 hover:text-[#FAF5EB]'
                }`}
              >
                <Gift size={15} className={canClaimReward ? 'text-amber-300' : ''} />
                <span>Điểm danh</span>
                {canClaimReward && (
                  <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
                )}
              </button>

              {/* Nút Nhập Giftcode */}
              <button
                type="button"
                onClick={onOpenGiftCode}
                title="Nhập mã Giftcode nhận xu quà tặng"
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-[#2b1c15] hover:bg-[#3d271c] hover:border-[#D5B46B] px-3 py-1.5 text-xs font-bold text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner"
              >
                <Ticket size={15} className="text-[#D5B46B]" />
                <span>Giftcode</span>
              </button>

              {/* Nút Ủng hộ server (Donate) */}
              <button
                type="button"
                onClick={onOpenDonate}
                title="Ủng hộ duy trì server • Tặng thêm 100k - 250k xu"
                className="flex items-center gap-1.5 rounded-xl border border-[#D5B46B] bg-gradient-to-r from-[#8E2926] via-[#A87932] to-[#8E2926] px-3 py-1.5 text-xs font-black text-[#FAF5EB] hover:brightness-110 active:scale-95 shadow-[0_0_12px_rgba(213,180,107,0.35)] transition-all"
              >
                <Coffee size={15} className="text-amber-300 animate-pulse" />
                <span>Ủng hộ server</span>
              </button>

              {/* Nút Xem Ví Xu & Sổ cái */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Nhấn để xem Ví & Sổ cái giao dịch"
                className="flex items-center gap-1.5 rounded-xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#2a1c15] to-[#1c130e] px-3 py-1.5 text-xs shadow-inner hover:border-[#D5B46B] active:scale-95 transition-all"
              >
                <HeritageCoinIcon size={15} className="text-[#D5B46B]" />
                <span className="font-mono text-sm font-black text-[#D5B46B]">
                  {myPoints.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#E8DDC8]/80 font-medium">xu</span>
              </button>

              {/* Hồ sơ người chơi */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Hồ sơ người chơi"
                aria-label="Hồ sơ người chơi"
                className="flex size-9 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner"
              >
                <User size={16} />
              </button>

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

              {/* Nút Chia sẻ liên kết bàn chơi */}
              <button
                type="button"
                onClick={onOpenShare}
                title="Chia sẻ liên kết bàn chơi cho bạn bè"
                aria-label="Chia sẻ liên kết bàn chơi cho bạn bè"
                className="flex size-9 items-center justify-center rounded-xl border border-[#A87932]/50 bg-[#2b1c15] text-[#D5B46B] hover:bg-[#3d271c] hover:border-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner"
              >
                <Share2 size={16} />
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
