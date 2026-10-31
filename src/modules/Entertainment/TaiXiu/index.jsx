// src/modules/Entertainment/TaiXiu/index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import { Ticket, ChevronDown } from 'lucide-react';

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
  const navigate = useNavigate();
  const {
    player,
    isPlayerAuthenticated,
    isPlayerLoading,
    initPlayerAuth,
    betBalance,
    dailyReward
  } = useAuthStore();

  const [roomId, setRoomId] = useState('tai-xiu-30s');
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isMyBetsOpen, setIsMyBetsOpen] = useState(false);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [isGameInfoOpen, setIsGameInfoOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  // Bắt buộc xác thực tài khoản Google: Không cho phép chơi khách (No Guest Mode)
  if (!isPlayerLoading && !isPlayerAuthenticated) {
    return <GoogleLoginGate />;
  }

  const effectivePoints = betBalance || myPoints;

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
        onExitGame={() => navigate('/entertainment')}
        canClaimReward={dailyReward?.canClaimToday ?? true}
      />

      {/* 2. LAYOUT CHÍNH: BÀN CHƠI TÀI XỈU (TỰ ĐỘNG THÍCH ỨNG MOBILE / DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 lg:gap-5 items-start flex-1 min-h-0">
        {/* CỘT TRÁI (Mobile: Trên / Desktop: 5 phần): Khay xúc xắc + Vé cược cá nhân */}
        <div className="lg:col-span-5 flex flex-col gap-2 sm:gap-4">
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

          {/* NÚT CHUYỂN BÀN CHƠI TRÊN MOBILE (NẰM DƯỚI NẶN BÁT VÀ TRÊN ĐẶT CƯỢC) */}
          <div className="flex lg:hidden items-center w-full">
            <button
              type="button"
              onClick={() => setIsRoomSelectorOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#241712] via-[#2d1e17] to-[#241712] text-xs font-bold text-[#E8DDC8] shadow-md active:scale-[0.98] transition-all hover:border-[#D5B46B]"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{roomId === 'tai-xiu-15s' ? '⚡' : '🏛️'}</span>
                <div className="text-left">
                  <span className="text-[9px] text-[#D5B46B] font-semibold uppercase tracking-wider block leading-tight">
                    BÀN ĐANG CHƠI
                  </span>
                  <span className="text-xs font-black text-[#FAF5EB]">
                    {roomId === 'tai-xiu-15s' ? 'Chợ Phiên (25s)' : 'Xóm Đình (50s)'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#D5B46B] bg-[#171411]/90 px-2.5 py-1 rounded-lg border border-[#A87932]/50 shadow-inner">
                <span>Đổi bàn</span>
                <ChevronDown size={14} />
              </div>
            </button>
          </div>

          <div className="hidden lg:block">
            <MyBetsCard myCurrentBets={myCurrentBets} />
          </div>
        </div>

        {/* CỘT PHẢI (Mobile: Dưới / Desktop: 7 phần): Bàn cược Tài/Xỉu + Lịch sử kết quả trực quan */}
        <div className="lg:col-span-7 flex flex-col gap-2 sm:gap-4">
          <BetBoard
            state={roomState}
            myBets={myCurrentBets}
            myPoints={effectivePoints}
            betSummary={betSummary}
            onPlaceBet={handlePlaceBet}
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
        onRewardClaimed={() => sfx.playWinFanfare()}
      />

      <ProfileWalletModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
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
        onSelectRoom={(id) => setRoomId(id)}
      />

      <GameInfoModal
        isOpen={isGameInfoOpen}
        onClose={() => setIsGameInfoOpen(false)}
      />
    </motion.div>
  );
}
