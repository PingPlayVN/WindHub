// src/modules/Entertainment/TaiXiu/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaiXiuSocket } from './hooks/useTaiXiuSocket';
import RoomSwitchHeader from './components/RoomSwitchHeader';
import DicePlate from './components/DicePlate';
import BetBoard from './components/BetBoard';
import SoiCauHistory from './components/SoiCauHistory';
import SoiCauModal from './components/SoiCauModal';
import SoundSettingsModal from './components/SoundSettingsModal';
import MyBetsModal from './components/MyBetsModal';
import RoomSelectorModal from './components/RoomSelectorModal';
import GameInfoModal from './components/GameInfoModal';
import { Ticket } from 'lucide-react';

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.8;
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
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(960, this.ctx.currentTime + 0.08);
      const v = 0.14 * this.volume;
      gain.gain.setValueAtTime(v, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable or blocked by user gesture
    }
  }

  playWinFanfare() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        const v = 0.16 * this.volume;
        gain.gain.setValueAtTime(v, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.28);
      });
    } catch {
      // AudioContext unavailable or blocked by user gesture
    }
  }
}

const sfx = new SoundEffects();

/**
 * Thẻ hiển thị vé cược cá nhân của người chơi ván này (dùng trên Desktop)
 */
function MyBetsCard({ myCurrentBets = [] }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#A87932]/40 bg-gradient-to-b from-[#221813] via-[#171411] to-[#120f0d] p-3.5 sm:p-4 text-[#E8DDC8] shadow-[0_6px_20px_rgba(0,0,0,0.6)] select-none">
      <h3 className="text-xs font-black text-[#D5B46B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Ticket size={14} className="text-[#D5B46B]" />
        Vé cược của bạn ván này ({myCurrentBets.length})
      </h3>
      {myCurrentBets.length === 0 ? (
        <p className="text-xs text-[#E8DDC8]/60 italic">
          Chưa vào cược ván này. Hãy chọn cửa Tài hoặc Xỉu nhé!
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {myCurrentBets.map((b, i) => {
            const isTai = b.side === 'TAI';
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-xs sm:text-sm font-bold shadow-xs ${
                  isTai
                    ? 'border-[#8E2926] bg-[#8E2926]/30 text-[#FAF5EB]'
                    : 'border-[#D5B46B]/60 bg-[#D5B46B]/20 text-[#D5B46B]'
                }`}
              >
                <span>Cửa <strong>{b.sideName}</strong>:</span>
                <strong className="text-[#FAF5EB]">{b.amount.toLocaleString()} xu</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TaiXiuGame() {
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState('tai-xiu-30s');
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isMyBetsOpen, setIsMyBetsOpen] = useState(false);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [isGameInfoOpen, setIsGameInfoOpen] = useState(false);

  // Cấu hình âm thanh: SFX/VFX và Nhạc nền Lofi
  const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem('windhub_taixiu_sfx_enabled') !== 'false');
  const [sfxVolume, setSfxVolume] = useState(() => {
    const v = localStorage.getItem('windhub_taixiu_sfx_vol');
    return v !== null ? parseFloat(v) : 0.8;
  });
  const [bgmEnabled, setBgmEnabled] = useState(() => localStorage.getItem('windhub_taixiu_bgm_enabled') !== 'false');
  const [bgmVolume, setBgmVolume] = useState(() => {
    const v = localStorage.getItem('windhub_taixiu_bgm_vol');
    return v !== null ? parseFloat(v) : 0.35;
  });
  const bgmAudioRef = useRef(null);

  // Đồng bộ SFX volume & trạng thái bật tắt
  useEffect(() => {
    sfx.enabled = sfxEnabled;
    sfx.volume = sfxVolume;
  }, [sfxEnabled, sfxVolume]);

  // Quản lý phát nhạc nền Lofi
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!bgmAudioRef.current) {
      const audio = new Audio('/audio/vietnameselofi.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      bgmAudioRef.current = audio;
    }

    const audio = bgmAudioRef.current;
    audio.volume = Math.min(1, Math.max(0, bgmVolume));

    if (bgmEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const handleFirstClick = () => {
            if (bgmEnabled && bgmAudioRef.current) {
              bgmAudioRef.current.play().catch(() => {});
            }
            window.removeEventListener('click', handleFirstClick);
            window.removeEventListener('keydown', handleFirstClick);
          };
          window.addEventListener('click', handleFirstClick, { once: true });
          window.addEventListener('keydown', handleFirstClick, { once: true });
        });
      }
    } else {
      audio.pause();
    }

    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
    };
  }, [bgmEnabled, bgmVolume]);

  const [{ localUserId, localUserName }] = useState(() => {
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
  });

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
    latestWinners,
    placeBet,
    claimFreePoints
  } = useTaiXiuSocket({
    roomId,
    userId: activeUserId,
    userName: activeUserName
  });

  // KHI MỞ BÁT RA MỚI THÔNG BÁO THẮNG HAY THUA & PHÁT NHẠC CHIẾN THẮNG
  const handleReveal = useCallback(() => {
    // 1. Kiểm tra người chơi có đặt cược ván này không
    const userBets = myCurrentBets;
    if (!userBets || userBets.length === 0) {
      // Người chơi không cược ván này -> chỉ thông báo kết quả nhẹ nhàng
      toast.info(`🎲 Kết quả mở bát: ${outcome === 'TAI' ? 'TÀI' : outcome === 'XIU' ? 'XỈU' : 'BÃO'} (${total} điểm) [${dice.join(' - ')}]`);
      return;
    }

    // 2. Người chơi có cược -> kiểm tra thắng hay thua theo kết quả từ server
    const myWin = (latestWinners || []).find((w) => w.userId === activeUserId);
    if (myWin) {
      const sideName = myWin.betSide === 'TAI' ? 'TÀI' : myWin.betSide === 'XIU' ? 'XỈU' : 'BÃO';
      sfx.playWinFanfare();
      toast.success(`🎉 Thắng lớn! Cửa ${sideName} (${total} điểm) nổ giòn giã! Nhận +${myWin.payout.toLocaleString()} xu!`, {
        duration: 5000
      });
    } else {
      toast.error(`Tiếc quá! Kết quả ra ${outcome === 'TAI' ? 'TÀI' : outcome === 'XIU' ? 'XỈU' : 'BÃO'} (${total} điểm). Chúc bạn ván sau thắng lớn!`, {
        duration: 4000
      });
    }
  }, [myCurrentBets, latestWinners, activeUserId, outcome, total, dice]);

  const handleToggleSfx = () => {
    setSfxEnabled(prev => {
      const next = !prev;
      localStorage.setItem('windhub_taixiu_sfx_enabled', String(next));
      if (next) sfx.playPop();
      return next;
    });
  };

  const handleChangeSfxVolume = (vol) => {
    setSfxVolume(vol);
    localStorage.setItem('windhub_taixiu_sfx_vol', String(vol));
  };

  const handleToggleBgm = () => {
    setBgmEnabled(prev => {
      const next = !prev;
      localStorage.setItem('windhub_taixiu_bgm_enabled', String(next));
      return next;
    });
  };

  const handleChangeBgmVolume = (vol) => {
    setBgmVolume(vol);
    localStorage.setItem('windhub_taixiu_bgm_vol', String(vol));
  };

  const handleTestSound = () => {
    sfx.playWinFanfare();
  };

  const handlePlaceBet = useCallback((betSide, amount) => {
    sfx.playPop();
    placeBet(betSide, amount);
  }, [placeBet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col h-full max-h-[calc(100dvh-5.5rem)] lg:max-h-none lg:h-auto justify-between lg:justify-start gap-2 sm:gap-4 lg:gap-5 pb-1 lg:pb-10"
    >
      {/* 1. HEADER ĐIỀU KHIỂN & CHỌN PHÒNG (TỰ CO GỌN TRÊN MOBILE, MỞ RỘNG TRÊN DESKTOP) */}
      <RoomSwitchHeader
        currentRoomId={roomId}
        onSelectRoom={(id) => setRoomId(id)}
        connectionStatus={connectionStatus}
        onlineCount={onlineCount}
        myPoints={myPoints}
        onClaimFreePoints={claimFreePoints}
        sfxEnabled={sfxEnabled}
        bgmEnabled={bgmEnabled}
        onOpenSoundSettings={() => setIsSoundSettingsOpen(true)}
        onToggleSoiCau={() => setIsSoiCauOpen((prev) => !prev)}
        isSoiCauOpen={isSoiCauOpen}
        onOpenRoomSelector={() => setIsRoomSelectorOpen(true)}
        onOpenMyBets={() => setIsMyBetsOpen(true)}
        myBetsCount={myCurrentBets?.length || 0}
        onOpenGameInfo={() => setIsGameInfoOpen(true)}
      />

      {/* 2. LAYOUT MOBILE: TỐI GIẢN GÓI GỌN TRONG 1 TRANG VỪA KHÍT MÀN HÌNH KHÔNG CẦN CUỘN (< 1024PX) */}
      <div className="flex flex-col justify-between flex-1 min-h-0 gap-2 lg:hidden overflow-hidden">
        {/* DICE STAGE: Khay đồng sơn mài & bát nặn là tâm điểm thị giác */}
        <DicePlate
          state={roomState}
          dice={dice}
          total={total}
          outcome={outcome}
          isTriple={isTriple}
          roundEndTime={roundEndTime}
          waitingDuration={waitingDuration}
          onReveal={handleReveal}
        />

        {/* BÀN CƯỢC TÀI / XỈU & CHIP CONTROLS */}
        <BetBoard
          state={roomState}
          myBets={myCurrentBets}
          myPoints={myPoints}
          betSummary={betSummary}
          onPlaceBet={handlePlaceBet}
        />
      </div>

      {/* 3. LAYOUT DESKTOP TẬN DỤNG KHÔNG GIAN CÂN ĐỐI (>= 1024PX) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (5 phần): Khay xúc xắc + Vé cược cá nhân */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <DicePlate
            state={roomState}
            dice={dice}
            total={total}
            outcome={outcome}
            isTriple={isTriple}
            roundEndTime={roundEndTime}
            waitingDuration={waitingDuration}
            onReveal={handleReveal}
          />

          <MyBetsCard myCurrentBets={myCurrentBets} />
        </div>

        {/* CỘT PHẢI (7 phần): Bàn cược Tài/Xỉu + Lịch sử kết quả trực quan */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <BetBoard
            state={roomState}
            myBets={myCurrentBets}
            myPoints={myPoints}
            betSummary={betSummary}
            onPlaceBet={handlePlaceBet}
          />

          <SoiCauHistory
            history={history}
            onOpenModal={() => setIsSoiCauOpen(true)}
          />
        </div>
      </div>

      {/* 4. CÁC MODAL / POPUP PHỤ TRỢ (TRUY CẬP BẰNG NÚT BẤM TRÊN MOBILE & DESKTOP) */}
      <SoiCauModal
        isOpen={isSoiCauOpen}
        onClose={() => setIsSoiCauOpen(false)}
        history={history}
      />

      <SoundSettingsModal
        isOpen={isSoundSettingsOpen}
        onClose={() => setIsSoundSettingsOpen(false)}
        sfxEnabled={sfxEnabled}
        onToggleSfx={handleToggleSfx}
        sfxVolume={sfxVolume}
        onChangeSfxVolume={handleChangeSfxVolume}
        bgmEnabled={bgmEnabled}
        onToggleBgm={handleToggleBgm}
        bgmVolume={bgmVolume}
        onChangeBgmVolume={handleChangeBgmVolume}
        onTestSound={handleTestSound}
      />

      <MyBetsModal
        isOpen={isMyBetsOpen}
        onClose={() => setIsMyBetsOpen(false)}
        myBets={myCurrentBets}
        myPoints={myPoints}
        latestWinners={latestWinners}
        activeUserId={activeUserId}
        outcome={outcome}
        total={total}
      />

      <RoomSelectorModal
        isOpen={isRoomSelectorOpen}
        onClose={() => setIsRoomSelectorOpen(false)}
        currentRoomId={roomId}
        onSelectRoom={(id) => setRoomId(id)}
      />

      <GameInfoModal
        isOpen={isGameInfoOpen}
        onClose={() => setIsGameInfoOpen(false)}
      />
    </motion.div>
  );
}
