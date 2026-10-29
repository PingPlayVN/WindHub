// src/modules/Entertainment/TaiXiu/components/RoomSwitchHeader.jsx
import { Wifi, WifiOff, Users, Coins, PlusCircle, Volume2, VolumeX, ShieldAlert, ArrowLeft, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoomSwitchHeader({
  currentRoomId = 'tai-xiu-30s',
  onSelectRoom,
  connectionStatus = 'CONNECTED',
  onlineCount = 1,
  myPoints = 10000,
  onClaimFreePoints,
  soundEnabled = true,
  onToggleSound,
  onToggleSoiCau,
  isSoiCauOpen = false,
}) {
  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <div className="flex flex-col gap-3">
      {/* CẢNH BÁO GIẢI TRÍ LÀNH MẠNH */}
      <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200">
        <ShieldAlert size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="leading-tight">
          <strong>Trò chơi giải trí mô phỏng:</strong> Điểm xu được cấp miễn phí, không có giá trị tiền tệ, không nạp/rút tiền thật.
        </span>
      </div>

      {/* HEADER BẢNG ĐIỀU KHIỂN & CHỌN PHÒNG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-amber-900/40 bg-[#160f0c] p-5 text-amber-100 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/entertainment"
            title="Quay lại sảnh trò chơi"
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-950/80 border border-amber-700/50 text-amber-300 hover:bg-amber-900 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/80">SÒNG TÀI XỈU DÂN GIAN</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isConnected ? 'Trực tuyến' : 'Đang kết nối...'}
              </span>
            </div>
            <h1 className="text-xl font-black text-amber-200 tracking-tight mt-0.5">
              {currentRoomId === 'tai-xiu-15s' ? '⚡ Bàn Chợ Phiên (25s)' : '🏛️ Bàn Xóm Đình (50s)'}
            </h1>
          </div>
        </div>

        {/* CÁC NÚT ĐIỀU HƯỚNG BÀN & NÚT BẬT TẮT LỊCH SỬ PHIÊN */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 2 Nút chọn bàn */}
          <button
            type="button"
            onClick={() => onSelectRoom('tai-xiu-30s')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentRoomId === 'tai-xiu-30s'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-amber-950/60 border border-amber-800/40 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            🏛️ Xóm Đình (50s)
          </button>
          <button
            type="button"
            onClick={() => onSelectRoom('tai-xiu-15s')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              currentRoomId === 'tai-xiu-15s'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-amber-950/60 border border-amber-800/40 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            ⚡ Chợ Phiên (25s)
          </button>

          {/* Nút bật/tắt Lịch Sử Phiên (Soi Cầu) */}
          <button
            type="button"
            onClick={onToggleSoiCau}
            title="Bật/Tắt Cửa Sổ Lịch Sử Phiên (Kéo thả di chuyển tự do)"
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-md ${
              isSoiCauOpen
                ? 'border-yellow-400 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-[0_0_16px_rgba(250,204,21,0.6)] font-black'
                : 'border-amber-500/60 bg-gradient-to-r from-amber-950 via-[#261507] to-amber-950 text-amber-300 hover:border-amber-400 hover:text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
          >
            <TrendingUp size={15} className={isSoiCauOpen ? 'text-slate-950' : 'text-amber-400 animate-pulse'} />
            <span>Lịch Sử Phiên</span>
          </button>
        </div>

        {/* ĐIỂM XU, ONLINE & ÂM THANH */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 px-3 py-1.5 text-xs text-amber-200">
            <Users size={15} className="text-amber-400" />
            <span><strong>{onlineCount}</strong> bà con</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 px-3 py-1.5 text-xs text-amber-200">
            <Coins size={15} className="text-yellow-400" />
            <span className="font-mono text-yellow-300 font-bold">{myPoints.toLocaleString()}</span> xu
            <button
              type="button"
              onClick={onClaimFreePoints}
              title={myPoints <= 500 ? "Nhận thêm 10,000 xu giải trí miễn phí" : "Chỉ nhận được khi số dư dưới 500 xu"}
              aria-label="Nhận thêm 10,000 xu giải trí miễn phí"
              className="text-amber-400 hover:text-amber-300 ml-1 transition"
            >
              <PlusCircle size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="rounded-xl bg-amber-950/80 border border-amber-700/50 p-2 text-amber-300 hover:bg-amber-900 transition"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
