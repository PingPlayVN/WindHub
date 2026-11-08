// src/modules/Entertainment/TaiXiu/index.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import GoogleLoginGate from './components/GoogleLoginGate';
import DailyRewardModal from './components/DailyRewardModal';
import ProfileWalletModal from './components/ProfileWalletModal';
import GameShareModal from '../components/GameShareModal';
import DonateModal from './components/DonateModal';
import { Ticket, ChevronDown, TrendingUp } from 'lucide-react';

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

  // Tiếng xúc xắc lách cách va đập liên hồi trong bát sứ khi xóc đĩa
  playDiceRattle(duration = 2.4) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const rattleCount = Math.floor(duration * 10); // Khoảng 24 cú va đập lách cách ngẫu nhiên

      for (let i = 0; i < rattleCount; i++) {
        const jitter = (Math.random() - 0.5) * 0.045;
        const hitTime = now + (i * (duration / rattleCount)) + jitter;
        if (hitTime < now) continue;

        // 1. Tiếng gõ gốm sứ / nhựa đục của xúc xắc va thành bát
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = 1600 + Math.random() * 1600;
        osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(baseFreq, hitTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, hitTime + 0.035);

        const hitVol = (0.09 + Math.random() * 0.11) * this.volume;
        gain.gain.setValueAtTime(hitVol, hitTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(hitTime);
        osc.stop(hitTime + 0.04);

        // 2. Tiếng sột soạt ma sát lạo xạo giữa 3 viên xúc xắc
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let s = 0; s < bufferSize; s++) {
          output[s] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2800 + Math.random() * 1400, hitTime);
        filter.Q.setValueAtTime(5, hitTime);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.05 * this.volume, hitTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.025);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        whiteNoise.start(hitTime);
        whiteNoise.stop(hitTime + 0.025);
      }
    } catch {
      // AudioContext unavailable
    }
  }

  // Tiếng đồng xu vàng nổ thưởng leng keng ngân vang rộn ràng
  playCoinJingle() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const coinFrequencies = [2093, 2637, 3136, 4186, 2637, 3520, 4186, 5274, 3136, 4186, 5274];

      coinFrequencies.forEach((freq, idx) => {
        const dropTime = now + idx * 0.065 + (Math.random() - 0.5) * 0.02;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, dropTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.985, dropTime + 0.35);

        const v = (0.13 + Math.random() * 0.07) * this.volume;
        gain.gain.setValueAtTime(v, dropTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(dropTime);
        osc.stop(dropTime + 0.36);

        // Họa âm leng keng kim loại đanh
        const harmOsc = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harmOsc.type = 'triangle';
        harmOsc.frequency.setValueAtTime(freq * 1.5, dropTime);
        harmGain.gain.setValueAtTime(v * 0.4, dropTime);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.16);

        harmOsc.connect(harmGain);
        harmGain.connect(this.ctx.destination);
        harmOsc.start(dropTime);
        harmOsc.stop(dropTime + 0.17);
      });
    } catch {
      // AudioContext unavailable
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
  const navigate = useNavigate();
  const {
    player,
    isPlayerAuthenticated,
    isPlayerLoading,
    initPlayerAuth,
    betBalance,
    dailyReward
  } = useAuthStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = searchParams.get('room');
  const initialRoom = (roomParam === 'tai-xiu-15s' || roomParam === 'tai-xiu-25s')
    ? 'tai-xiu-15s'
    : 'tai-xiu-30s';

  const [roomId, setRoomId] = useState(initialRoom);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isMyBetsOpen, setIsMyBetsOpen] = useState(false);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [isGameInfoOpen, setIsGameInfoOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Cập nhật roomId khi URL thay đổi (ví dụ người dùng dán link mới)
  useEffect(() => {
    if (roomParam === 'tai-xiu-15s' || roomParam === 'tai-xiu-25s') {
      setRoomId('tai-xiu-15s');
    } else if (roomParam === 'tai-xiu-30s' || roomParam === 'tai-xiu-50s') {
      setRoomId('tai-xiu-30s');
    }
  }, [roomParam]);

  const handleSelectRoom = (newRoomId) => {
    setRoomId(newRoomId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('room', newRoomId);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    initPlayerAuth();
  }, [initPlayerAuth]);

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

  const activeUserId = player?.userId || 'auth_player';
  const activeUserName = player?.displayName || 'Người Chơi';

  const {
    connectionStatus,
    roomState,
    roundEndTime,
    waitingDuration,
    dice,
    total,
    outcome,
    isTriple,
    dramaticType,
    dramaticMessage,
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
    userName: activeUserName,
    enabled: isPlayerAuthenticated && !!player?.userId
  });

  // Khi chuyển sang pha Xóc đĩa (PLAYING) -> Phát tiếng xúc xắc lách cách rộn rã trong bát
  const prevRoomStateRef = useRef(roomState);
  useEffect(() => {
    if (roomState === 'PLAYING' && prevRoomStateRef.current !== 'PLAYING') {
      sfx.playDiceRattle(3.0);
    }
    prevRoomStateRef.current = roomState;
  }, [roomState]);

  // KHI MỞ BÁT RA MỚI THÔNG BÁO THẮNG HAY THUA & PHÁT NHẠC CHIẾN THẮNG
  const handleReveal = useCallback(() => {
    // Thông báo kịch bản đột biến nếu có
    if (dramaticMessage) {
      if (dramaticType === 'TRIPLE_JACKPOT') {
        sfx.playWinFanfare();
        toast.warning(dramaticMessage, { duration: 6000 });
      } else if (dramaticType === 'STREAK_BREAKER') {
        sfx.playPop();
        toast.info(dramaticMessage, { duration: 5000 });
      } else if (dramaticType === 'EDGE_TENSION') {
        sfx.playPop();
        toast.info(dramaticMessage, { duration: 4500 });
      }
    }

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
      sfx.playCoinJingle();
      sfx.playWinFanfare();
      toast.success(`🎉 Thắng lớn! Cửa ${sideName} (${total} điểm) nổ giòn giã! Nhận +${myWin.payout.toLocaleString()} xu!`, {
        duration: 5000
      });

      // Ví người chơi đã được useTaiXiuSocket tự động cộng thưởng vào Firestore và Zustand Store

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
    sfx.playDiceRattle(1.2);
    setTimeout(() => sfx.playCoinJingle(), 600);
  };

  const handlePlaceBet = useCallback((betSide, amount) => {
    sfx.playPop();
    placeBet(betSide, amount);
  }, [placeBet]);

  // Bắt buộc xác thực tài khoản Google: Không cho phép chơi khách (No Guest Mode)
  if (!isPlayerLoading && !isPlayerAuthenticated) {
    return <GoogleLoginGate />;
  }

  const effectivePoints = typeof betBalance === 'number' ? betBalance : myPoints;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col h-full lg:min-h-full justify-between gap-1 xs:gap-1.5 sm:gap-3 lg:gap-5 pb-0 lg:pb-8 overflow-hidden lg:overflow-visible"
    >
      {/* 1. HEADER ĐIỀU KHIỂN & CHỌN PHÒNG (TỰ CO GỌN TRÊN MOBILE, MỞ RỘNG TRÊN DESKTOP) */}
      <RoomSwitchHeader
        currentRoomId={roomId}
        onSelectRoom={handleSelectRoom}
        connectionStatus={connectionStatus}
        onlineCount={onlineCount}
        myPoints={effectivePoints}
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
        onOpenDailyReward={() => setIsDailyRewardOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
        onExitGame={() => navigate('/entertainment')}
        canClaimReward={dailyReward?.canClaimToday ?? true}
      />

      {/* 2. DẢI SOI CẦU MINI NHANH DÀNH RIÊNG CHO MOBILE (< 1024PX) */}
      <div className="flex lg:hidden items-center justify-between gap-1.5 rounded-xl border border-[#A87932]/40 bg-gradient-to-r from-[#221711] via-[#1a120e] to-[#221711] px-2 py-1 text-[11px] shrink-0 shadow-sm">
        <div className="flex items-center gap-1 text-[#D5B46B] font-bold shrink-0">
          <TrendingUp size={13} className="text-[#D5B46B]" />
          <span className="text-[10px] font-mono uppercase font-black">Cầu ({history.length}):</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          {history.length === 0 ? (
            <span className="text-[10px] text-[#E8DDC8]/50 italic">Đang cập nhật dữ liệu phiên...</span>
          ) : (
            history.slice(0, 16).map((h, idx) => {
              const isBao = h.isTriple || h.outcome === 'BAO';
              const isTai = h.outcome === 'TAI';
              return (
                <span
                  key={`${h.roundId || 'r'}-${idx}`}
                  className={`flex size-5 xs:size-5.5 shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-black border shadow-xs transition-transform ${
                    isBao
                      ? 'bg-gradient-to-br from-cyan-600 to-cyan-950 text-white border-cyan-400'
                      : isTai
                        ? 'bg-gradient-to-br from-[#8E2926] to-[#421312] text-[#FAF5EB] border-[#D5B46B]/60'
                        : 'bg-gradient-to-br from-[#2b1f19] to-[#120d0a] text-[#D5B46B] border-[#A87932]/70'
                  }`}
                  title={`Ván ${h.roundId}: ${h.dice?.join('-')} (${h.total} điểm)`}
                >
                  {isBao ? 'B' : isTai ? 'T' : 'X'}
                </span>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsSoiCauOpen(true)}
          className="shrink-0 flex items-center gap-0.5 rounded-md bg-[#2b1c15] border border-[#D5B46B]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-xs"
        >
          <span>Chi tiết</span>
        </button>
      </div>

      {/* 3. LAYOUT CHÍNH: BÀN CHƠI TÀI XỈU (TỰ ĐỘNG THÍCH ỨNG MOBILE / DESKTOP) */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-1 xs:gap-1.5 sm:gap-4 lg:gap-5 items-stretch lg:items-start flex-1 min-h-0 overflow-hidden lg:overflow-visible">
        {/* CỘT TRÁI (Mobile: Trên / Desktop: 5 phần): Khay xúc xắc + Vé cược cá nhân */}
        <div className="lg:col-span-5 flex flex-col gap-2 sm:gap-4 flex-1 lg:flex-initial min-h-0">
          <DicePlate
            state={roomState}
            dice={dice}
            total={total}
            outcome={outcome}
            isTriple={isTriple}
            dramaticType={dramaticType}
            dramaticMessage={dramaticMessage}
            roundEndTime={roundEndTime}
            waitingDuration={waitingDuration}
            onReveal={handleReveal}
          />

          <div className="hidden lg:block">
            <MyBetsCard myCurrentBets={myCurrentBets} />
          </div>
        </div>

        {/* CỘT PHẢI (Mobile: Dưới / Desktop: 7 phần): Bàn cược Tài/Xỉu + Lịch sử kết quả trực quan */}
        <div className="lg:col-span-7 flex flex-col gap-2 sm:gap-4 justify-end lg:justify-start shrink-0 lg:shrink">
          <BetBoard
            state={roomState}
            myBets={myCurrentBets}
            myPoints={effectivePoints}
            betSummary={betSummary}
            onPlaceBet={handlePlaceBet}
            onOpenDonate={() => setIsDonateOpen(true)}
          />

          <div className="hidden lg:block">
            <SoiCauHistory
              history={history}
              onOpenModal={() => setIsSoiCauOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* 4. CÁC MODAL / POPUP PHỤ TRỢ (TRUY CẬP BẰNG NÚT BẤM TRÊN MOBILE & DESKTOP) */}
      <DailyRewardModal
        open={isDailyRewardOpen}
        onClose={() => setIsDailyRewardOpen(false)}
        onRewardClaimed={() => {
          sfx.playCoinJingle();
          sfx.playWinFanfare();
        }}
      />

      <ProfileWalletModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenDonate={() => setIsDonateOpen(true)}
      />

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        onSuccess={() => {
          sfx.playCoinJingle();
          sfx.playWinFanfare();
        }}
      />

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
        myPoints={effectivePoints}
        latestWinners={latestWinners}
        activeUserId={activeUserId}
        outcome={outcome}
        total={total}
      />

      <RoomSelectorModal
        isOpen={isRoomSelectorOpen}
        onClose={() => setIsRoomSelectorOpen(false)}
        currentRoomId={roomId}
        onSelectRoom={handleSelectRoom}
      />

      <GameInfoModal
        isOpen={isGameInfoOpen}
        onClose={() => setIsGameInfoOpen(false)}
      />

      <GameShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        gameTitle="Tài Xỉu Dân Gian"
        roomTitle={roomId === 'tai-xiu-15s' ? 'Bàn Chợ Phiên (25s)' : 'Bàn Xóm Đình (50s)'}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/entertainment/tai-xiu?room=${roomId}` : ''}
        description="Mời bạn bè cùng vào chung bàn cược thời gian thực, soi cầu và thử vận may cùng nhau!"
      />
    </motion.div>
  );
}
