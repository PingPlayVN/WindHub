// src/modules/Entertainment/TaiXiu/index.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaiXiuSocket } from './hooks/useTaiXiuSocket';
import RoomSwitchHeader from './components/RoomSwitchHeader';
import DicePlate from './components/DicePlate';
import BetBoard from './components/BetBoard';
import SoiCauModal from './components/SoiCauModal';
import SoundSettingsModal from './components/SoundSettingsModal';
import { Sparkles } from 'lucide-react';

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

export default function TaiXiuGame() {
  const { user } = useAuthStore();
  const [roomId, setRoomId] = useState('tai-xiu-30s');
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);

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
          // Trình duyệt chặn autoplay khi chưa có user gesture
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
        soundEnabled={sfxEnabled || bgmEnabled}
        sfxEnabled={sfxEnabled}
        bgmEnabled={bgmEnabled}
        onOpenSoundSettings={() => setIsSoundSettingsOpen(true)}
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
                Chưa vào cược ván này. Hãy chọn cửa Tài hoặc Xỉu nhé!
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

        {/* CỘT PHẢI: BÀN CƯỢC TÀI / XỈU (7 phần) */}
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



      {/* POPUP HOÀNG GIA: LỊCH SỬ PHIÊN (KÉO THẢ TỰ DO, 2 MẪU SOI CẦU, TOGGLE 3 XÍ NGẦU) */}
      <SoiCauModal
        isOpen={isSoiCauOpen}
        onClose={() => setIsSoiCauOpen(false)}
        history={history}
      />

      {/* MODAL CÀI ĐẶT ÂM THANH (SFX/VFX & NHẠC NỀN LOFI) */}
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
    </motion.div>
  );
}
