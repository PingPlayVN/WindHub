// src/modules/Entertainment/TaiXiu/index.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaiXiuSocket } from './hooks/useTaiXiuSocket';
import RoomSwitchHeader from './components/RoomSwitchHeader';
import DicePlate from './components/DicePlate';
import BetBoard from './components/BetBoard';
import SoiCauHistory from './components/SoiCauHistory';
import SoiCauModal from './components/SoiCauModal';
import { Sparkles } from 'lucide-react';

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(960, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playWinFanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.28);
      });
    } catch {}
  }
}

const sfx = new SoundEffects();

export default function TaiXiuGame() {
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState('tai-xiu-30s');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);

  const { localUserId, localUserName } = useMemo(() => {
    let id = localStorage.getItem('windhub_lottery_user_id');
    let name = localStorage.getItem('windhub_lottery_user_name');
    if (!id) {
      id = `dan_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('windhub_lottery_user_id', id);
    }
    if (!name) {
      const titles = ['Bác Ba', 'Chú Tư', 'Cô Năm', 'Anh Sáu', 'Chị Bảy', 'Ông Giáo', 'Bác Trưởng Thôn', 'Bà Bảy Quán Nước'];
      name = titles[Math.floor(Math.random() * titles.length)];
      localStorage.setItem('windhub_lottery_user_name', name);
    }
    return { localUserId: id, localUserName: name };
  }, []);

  const activeUserId = user?.uid || localUserId;
  const activeUserName = user?.displayName || user?.email?.split('@')[0] || localUserName;

  const {
    connectionStatus,
    roomState,
    roundEndTime,
    waitingDuration,
    dice,
    total,
    outcome,
    isTriple,
    onlineCount,
    myPoints,
    myCurrentBets,
    betSummary,
    history,
    placeBet,
    claimFreePoints
  } = useTaiXiuSocket({
    roomId,
    userId: activeUserId,
    userName: activeUserName
  });

  useEffect(() => {
    if (roomState === 'RESULT') {
      sfx.playWinFanfare();
    }
  }, [roomState]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
    if (next) sfx.playPop();
  };

  const handlePlaceBet = useCallback((betSide, amount) => {
    sfx.playPop();
    placeBet(betSide, amount);
  }, [placeBet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10"
    >
      {/* HEADER ĐIỀU KHIỂN & CHỌN PHÒNG */}
      <RoomSwitchHeader
        currentRoomId={roomId}
        onSelectRoom={(id) => setRoomId(id)}
        connectionStatus={connectionStatus}
        onlineCount={onlineCount}
        myPoints={myPoints}
        onClaimFreePoints={claimFreePoints}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onToggleSoiCau={() => setIsSoiCauOpen((prev) => !prev)}
        isSoiCauOpen={isSoiCauOpen}
      />

      {/* KHU VỰC CHÍNH: ĐĨA NẶN XÚC XẮC & BÀN CƯỢC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI: ĐĨA SỨ VÀ NẶN BÁT (5 phần) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <DicePlate
            state={roomState}
            dice={dice}
            total={total}
            outcome={outcome}
            isTriple={isTriple}
            roundEndTime={roundEndTime}
            waitingDuration={waitingDuration}
          />

          {/* VÉ CƯỢC CỦA BẠN LƯỢT NÀY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0c0d10]">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Cược của bạn ván này ({myCurrentBets.length})
            </h3>
            {myCurrentBets.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Chưa vào cược ván này. Hãy chọn cửa Tài, Xỉu hoặc Bão nhé!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myCurrentBets.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-sm font-bold text-amber-700 dark:text-amber-300"
                  >
                    Cửa <strong>{b.sideName}</strong>: {b.amount.toLocaleString()} xu
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: BÀN CƯỢC TÀI / XỈU / BÃO (7 phần) */}
        <div className="lg:col-span-7">
          <BetBoard
            state={roomState}
            myBets={myCurrentBets}
            myPoints={myPoints}
            betSummary={betSummary}
            onPlaceBet={handlePlaceBet}
          />
        </div>
      </div>

      {/* SOI CẦU & LỊCH SỬ VÁN CHƠI DƯỚI BÀN */}
      <SoiCauHistory history={history} onOpenModal={() => setIsSoiCauOpen(true)} />

      {/* POPUP HOÀNG GIA: LỊCH SỬ PHIÊN (KÉO THẢ TỰ DO, 2 MẪU SOI CẦU, TOGGLE 3 XÍ NGẦU) */}
      <SoiCauModal
        isOpen={isSoiCauOpen}
        onClose={() => setIsSoiCauOpen(false)}
        history={history}
      />
    </motion.div>
  );
}
