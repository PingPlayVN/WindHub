// src/modules/Entertainment/index.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Dices,
  Gamepad2,
  Lock,
  Share2,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import GameShareModal from './components/GameShareModal';
import {
  hasWindTankOfflineCache,
  syncWindTankOfflineCache,
} from './WindTank/windtankOfflineSync';

const OFFLINE_GAMES = [
  {
    id: 'windtank-trouble',
    title: 'WindTank Trouble',
    subtitle: 'Đại chiến xe tăng mê cung 2–4 người, đấu AI thông minh Offline hoặc solo Online 1vs1',
    tag: 'CHƠI ĐƯỢC OFFLINE',
    icon: <Crosshair size={26} className="text-emerald-400" />,
    features: [
      'Chơi Offline 100%: Đấu máy AI 4 cấp độ & 2–4 người chung thiết bị',
      '10 Kỹ năng chiến thuật, thùng gỗ bí ẩn & chế độ Đêm / Giáp',
      'Tự động xoay ngang trên điện thoại & hỗ trợ phòng Online 1vs1 khi có mạng',
    ],
    link: '/entertainment/windtank',
    roomTitle: 'Đấu Trường Trò Chơi',
    isLive: true,
  },
];

const FOLK_CASINO_GAMES = [
  {
    id: 'tai-xiu',
    title: 'Tài Xỉu Dân Gian',
    subtitle: 'Lắc 3 xúc xắc, nặn đĩa hồi hộp, trúng lớn cửa Bão',
    tag: 'ĐANG HOẠT ĐỘNG',
    icon: <Dices size={26} className="text-amber-400" />,
    features: ['3 Xúc xắc truyền thống', 'Tính năng nặn bát độc đáo', '2 Bàn chơi đồng bộ: 50s & 25s'],
    link: '/entertainment/tai-xiu',
    roomTitle: 'Sòng Bạc Dân Gian',
    isLive: true,
  },
  {
    id: 'bau-cua',
    title: 'Bầu Cua Tôm Cá',
    subtitle: '6 Linh vật ngày hội xuân làng quê sum vầy',
    tag: 'SẮP RA MẮT',
    icon: <Sparkles size={26} className="text-amber-400" />,
    features: ['Bầu - Cua - Tôm - Cá - Gà - Nai', 'Âm thanh chợ tết vui nhộn', 'Mở thưởng đồng bộ trực tuyến'],
    link: '#',
    roomTitle: 'Sòng Bạc Dân Gian',
    isLive: false,
  },
];

export default function Entertainment() {
  const [shareGame, setShareGame] = useState(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [windtankCached, setWindtankCached] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refreshCacheStatus = async () => {
      if (navigator.onLine) {
        const res = await syncWindTankOfflineCache();
        if (!cancelled) setWindtankCached(Boolean(res.cached));
      } else {
        const cached = await hasWindTankOfflineCache();
        if (!cancelled) setWindtankCached(cached);
      }
    };

    refreshCacheStatus();

    const handleOnline = () => {
      setIsOnline(true);
      refreshCacheStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      hasWindTankOfflineCache().then((cached) => {
        if (!cancelled) setWindtankCached(cached);
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12"
    >
      {/* BANNER TRUNG TÂM GIẢI TRÍ */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--os-border-default)] bg-gradient-to-br from-[#131924] via-[#121318] to-[#1a110b] p-6 text-slate-50 shadow-2xl md:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,.1)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <Gamepad2 size={14} className="text-emerald-400" />
                <span>KHÔNG GIAN GIẢI TRÍ WINDHUB</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${
                  isOnline
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                }`}
              >
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{isOnline ? 'Đang trực tuyến' : 'Chế độ Offline'}</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Giải Trí &amp; Trò Chơi
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Thư giãn mọi lúc với mục <strong className="text-emerald-300">Trò chơi</strong> hoạt động ngay cả khi không có mạng, hoặc giao lưu trực tuyến tại <strong className="text-amber-300">Sòng bạc dân gian</strong> bằng điểm xu mô phỏng miễn phí (phi thương mại, không tiền thật).
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MỤC 1: TRÒ CHƠI (CÓ THỂ SỬ DỤNG OFFLINE)
          ========================================================================= */}
      <section aria-labelledby="section-offline-games" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="section-offline-games"
              className="text-lg font-bold text-[var(--os-text-primary)] flex items-center gap-2"
            >
              <Gamepad2 size={20} className="text-emerald-500" />
              <span>Trò chơi</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>Dùng được Offline</span>
            </span>
          </div>

          <span className="text-xs text-[var(--os-text-muted)] font-mono">
            {windtankCached ? '✓ Đã sẵn sàng bộ đệm Offline' : '1 trò chơi hoạt động'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {OFFLINE_GAMES.map((game) => (
            <Link
              key={game.id}
              to={game.link}
              className="os-focus-ring relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-white via-emerald-50/20 to-white p-6 transition-all hover:border-emerald-500 hover:shadow-xl dark:from-[#111518] dark:via-[#0f1916] dark:to-[#0d1115] dark:border-emerald-500/30 dark:hover:border-emerald-400 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-inner">
                    {game.icon}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{game.tag}</span>
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {game.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {game.subtitle}
                </p>

                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  {game.features.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/80" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Vào chơi ngay</span>
                  <ArrowRight size={14} />
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareGame(game);
                  }}
                  title="Chia sẻ liên kết trò chơi"
                  className="os-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          MỤC 2: SÒNG BẠC DÂN GIAN (CẦN MẠNG ĐỂ DÙNG)
          ========================================================================= */}
      <section aria-labelledby="section-folk-casino" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="section-folk-casino"
              className="text-lg font-bold text-[var(--os-text-primary)] flex items-center gap-2"
            >
              <Dices size={20} className="text-amber-500" />
              <span>Sòng bạc dân gian</span>
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                isOnline
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-rose-500/35 bg-rose-500/15 text-rose-600 dark:text-rose-300'
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Cần mạng để dùng' : 'Đang Offline · Cần mạng'}</span>
            </span>
          </div>

          <span className="text-xs text-[var(--os-text-muted)] font-mono">
            1 đang chạy · 1 sắp ra mắt
          </span>
        </div>

        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-2xl border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] px-4 py-3 text-xs sm:text-sm text-[var(--os-text-primary)]"
          >
            <WifiOff size={17} className="shrink-0 text-[var(--os-warning)]" />
            <span>
              Mục <strong>Sòng bạc dân gian</strong> yêu cầu kết nối mạng Internet để đồng bộ phiên mở thưởng và ví xu. Trong lúc mất mạng, bạn vẫn có thể chơi <strong>WindTank Trouble</strong> ở mục Trò chơi phía trên.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FOLK_CASINO_GAMES.map((game) => {
            const canEnter = game.isLive && isOnline;
            const isOfflineBlocked = game.isLive && !isOnline;
            const CardWrapper = canEnter ? Link : 'div';

            return (
              <CardWrapper
                key={game.id}
                to={canEnter ? game.link : undefined}
                onClick={
                  isOfflineBlocked
                    ? () =>
                        toast.warning(
                          'Sòng bạc dân gian cần kết nối mạng Internet để đồng bộ phiên chơi.'
                        )
                    : undefined
                }
                role={isOfflineBlocked ? 'button' : undefined}
                tabIndex={isOfflineBlocked ? 0 : undefined}
                aria-disabled={isOfflineBlocked || !game.isLive || undefined}
                onKeyDown={
                  isOfflineBlocked
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toast.warning(
                            'Sòng bạc dân gian cần kết nối mạng Internet để đồng bộ phiên chơi.'
                          );
                        }
                      }
                    : undefined
                }
                className={`os-focus-ring relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all ${
                  canEnter
                    ? 'border-amber-500/40 bg-gradient-to-br from-white via-amber-50/20 to-white hover:border-amber-500 hover:shadow-xl dark:from-[#111317] dark:via-[#16120e] dark:to-[#0f1115] dark:border-amber-600/30 dark:hover:border-amber-500 cursor-pointer group'
                    : isOfflineBlocked
                    ? 'border-amber-500/25 bg-slate-50/80 dark:border-amber-900/40 dark:bg-[#111216] opacity-85 cursor-not-allowed'
                    : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-[#0c0d10] opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-inner">
                      {game.icon}
                    </div>

                    {canEnter ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{game.tag}</span>
                      </span>
                    ) : isOfflineBlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                        <WifiOff size={10} />
                        <span>CẦN MẠNG</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Lock size={10} />
                        <span>{game.tag}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {game.subtitle}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                    {game.features.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span className="size-1.5 rounded-full bg-amber-500/80" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  {canEnter ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                        <span>Vào sòng ngay</span>
                        <ArrowRight size={14} />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShareGame(game);
                        }}
                        title="Chia sẻ liên kết bàn chơi"
                        className="os-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 dark:text-slate-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Share2 size={13} />
                        <span>Chia sẻ</span>
                      </button>
                    </>
                  ) : isOfflineBlocked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 dark:text-rose-400">
                      <WifiOff size={13} />
                      <span>Kết nối mạng để vào sòng</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Đang xây dựng...</span>
                  )}
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </section>

      <GameShareModal
        isOpen={!!shareGame}
        onClose={() => setShareGame(null)}
        gameTitle={shareGame?.title || 'Giải trí WindHub'}
        roomTitle={shareGame?.roomTitle || 'Giải Trí WindHub'}
        shareUrl={
          shareGame
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}${shareGame.link}`
            : ''
        }
        description={
          shareGame?.subtitle ||
          'Mời bạn bè cùng tham gia không gian Giải trí trên nền tảng WindHub!'
        }
      />
    </motion.div>
  );
}
