// src/modules/Entertainment/index.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Dices,
  Gamepad2,
  Play,
  Share2,
  Users,
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
    genre: 'Hành động · Đấu trường mê cung',
    playersLabel: '1–4 người chơi',
    description:
      'Điều khiển xe tăng luồn lách mê cung, canh góc nảy đạn tiêu diệt đối thủ và nhặt thùng gỗ mở khóa 10 siêu kỹ năng. Chơi mượt với AI hoặc bạn bè ngay cả khi mất mạng.',
    thumbnail: '/games/windtank-cover.jpg',
    badge: 'Chơi được Offline',
    link: '/entertainment/windtank',
    roomTitle: 'Trò Chơi Giải Trí',
    ctaLabel: 'Chơi ngay',
    isLive: true,
    requiresInternet: false,
  },
];

const FOLK_CASINO_GAMES = [
  {
    id: 'tai-xiu',
    title: 'Tài Xỉu Dân Gian',
    genre: 'Trò chơi dân gian · Xúc xắc',
    playersLabel: 'Trực tuyến nhiều người',
    description:
      'Hòa mình vào không khí lễ hội truyền thống với 3 viên xúc xắc lắc trong bát sứ, tự tay kéo nặn đĩa hồi hộp từng giây cùng bạn bè ở hai bàn chơi nhanh và tiêu chuẩn.',
    thumbnail: '/games/tai-xiu-cover.jpg',
    badge: 'Đang mở bàn',
    link: '/entertainment/tai-xiu',
    roomTitle: 'Sòng Bạc Dân Gian',
    ctaLabel: 'Vào bàn chơi',
    isLive: true,
    requiresInternet: true,
  },
  {
    id: 'bau-cua',
    title: 'Bầu Cua Tôm Cá',
    genre: 'Trò chơi dân gian · Ngày Tết',
    playersLabel: 'Trực tuyến nhiều người',
    description:
      'Sáu linh vật quen thuộc Bầu, Cua, Tôm, Cá, Gà, Nai trên bàn gỗ ngày xuân rộn ràng tiếng trống hội. Chế độ mở thưởng đồng bộ nhiều người chơi đang được hoàn thiện.',
    thumbnail: '/games/bau-cua-cover.jpg',
    badge: 'Sắp ra mắt',
    link: '#',
    roomTitle: 'Sòng Bạc Dân Gian',
    ctaLabel: 'Sắp ra mắt',
    isLive: false,
    requiresInternet: true,
  },
];

function GameStoreCard({ game, isOnline, onShare }) {
  const isOfflineLocked = game.isLive && game.requiresInternet && !isOnline;
  const canPlay = game.isLive && !isOfflineLocked;

  const handleLockedClick = () => {
    if (isOfflineLocked) {
      toast.warning('Trò chơi này cần kết nối mạng Internet để vào bàn chơi trực tuyến.');
    }
  };

  const cardContent = (
    <>
      {/* 16:9 Game Cover Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--os-surface-2)]">
        <img
          src={game.thumbnail}
          alt={game.title}
          width={960}
          height={540}
          loading="eager"
          className={`h-full w-full object-cover transition-transform duration-500 ease-out ${
            canPlay ? 'group-hover:scale-105' : ''
          } ${!game.isLive ? 'saturate-[0.82]' : ''} ${
            isOfflineLocked ? 'brightness-75 saturate-75' : ''
          }`}
        />

        {/* Subtle bottom gradient for badge contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        />

        {/* Top-left Status Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isOfflineLocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              <WifiOff size={12} />
              <span>Cần mạng</span>
            </span>
          ) : !game.isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm backdrop-blur-md">
              <Clock size={12} />
              <span>{game.badge}</span>
            </span>
          ) : game.requiresInternet ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1 text-xs font-bold text-slate-950 shadow-sm backdrop-blur-md">
              <Wifi size={12} />
              <span>{game.badge}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-bold text-slate-950 shadow-sm backdrop-blur-md">
              <span>{game.badge}</span>
            </span>
          )}
        </div>

        {/* Top-right Share Button */}
        {game.isLive && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare(game);
            }}
            aria-label={`Chia sẻ ${game.title}`}
            title="Chia sẻ trò chơi"
            className="os-focus-ring absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70 cursor-pointer"
          >
            <Share2 size={15} />
          </button>
        )}

        {/* Bottom-left Players Pill over Artwork */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-xs">
          <Users size={12} className="shrink-0 opacity-90" />
          <span>{game.playersLabel}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold text-[var(--os-text-muted)]">
            {game.genre}
          </p>
          <h3 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
            {game.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--os-text-secondary)]">
            {game.description}
          </p>
        </div>

        {/* Primary Play Action */}
        <div className="pt-1">
          {canPlay ? (
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 py-2.5 text-sm font-bold text-[var(--os-accent-fg)] shadow-xs transition-all group-hover:bg-[var(--os-accent-hover)]">
              <Play size={16} className="fill-current" />
              <span>{game.ctaLabel}</span>
            </span>
          ) : isOfflineLocked ? (
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--os-text-muted)]">
              <WifiOff size={15} />
              <span>Kết nối mạng để chơi</span>
            </span>
          ) : (
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--os-text-muted)]">
              <Clock size={15} />
              <span>Sắp ra mắt</span>
            </span>
          )}
        </div>
      </div>
    </>
  );

  const baseCardClasses = `os-focus-ring group relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--os-surface-1)] transition-all duration-200 ${
    canPlay
      ? 'border-[var(--os-border-default)] shadow-[var(--os-shadow-xs)] hover:-translate-y-1 hover:border-[var(--os-accent-border)] hover:shadow-xl cursor-pointer'
      : isOfflineLocked
      ? 'border-[var(--os-border-default)] opacity-90 cursor-not-allowed'
      : 'border-[var(--os-border-subtle)] opacity-85'
  }`;

  if (canPlay) {
    return (
      <Link to={game.link} className={baseCardClasses}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      role={isOfflineLocked ? 'button' : undefined}
      tabIndex={isOfflineLocked ? 0 : undefined}
      aria-disabled="true"
      onClick={isOfflineLocked ? handleLockedClick : undefined}
      onKeyDown={
        isOfflineLocked
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLockedClick();
              }
            }
          : undefined
      }
      className={baseCardClasses}
    >
      {cardContent}
    </div>
  );
}

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12"
    >
      {/* CLEAN GAME HUB HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--os-border-subtle)] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
            Giải trí
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--os-text-secondary)] max-w-2xl">
            Khám phá các trò chơi giải trí nhanh ngay trên trình duyệt — hỗ trợ chơi Offline không cần mạng hoặc vào bàn dân gian trực tuyến cùng bạn bè bằng điểm xu mô phỏng miễn phí.
          </p>
        </div>

        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] px-3.5 py-1.5 text-xs font-bold text-[var(--os-warning)]"
          >
            <WifiOff size={14} />
            <span>Đang ở chế độ Offline</span>
          </div>
        )}
      </header>

      {/* =========================================================================
          MỤC 1: TRÒ CHƠI (CÓ THỂ CHƠI OFFLINE)
          ========================================================================= */}
      <section aria-labelledby="section-offline-games" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <Gamepad2 size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="section-offline-games"
                  className="text-lg sm:text-xl font-extrabold text-[var(--os-text-primary)]"
                >
                  Trò chơi
                </h2>
                <span className="inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Dùng được Offline
                </span>
              </div>
              <p className="text-xs text-[var(--os-text-muted)]">
                {windtankCached
                  ? 'Đã lưu sẵn trên thiết bị — mở chơi mượt ngay cả khi không có mạng'
                  : 'Chơi ngay với AI hoặc bạn bè trên cùng thiết bị'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OFFLINE_GAMES.map((game) => (
            <GameStoreCard
              key={game.id}
              game={game}
              isOnline={isOnline}
              onShare={setShareGame}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          MỤC 2: SÒNG BẠC DÂN GIAN (CẦN MẠNG ĐỂ DÙNG)
          ========================================================================= */}
      <section aria-labelledby="section-folk-casino" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <Dices size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="section-folk-casino"
                  className="text-lg sm:text-xl font-extrabold text-[var(--os-text-primary)]"
                >
                  Sòng bạc dân gian
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isOnline
                      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  <span>{isOnline ? 'Cần mạng để dùng' : 'Cần kết nối mạng'}</span>
                </span>
              </div>
              <p className="text-xs text-[var(--os-text-muted)]">
                Trò chơi mô phỏng lễ hội dân gian sử dụng xu miễn phí (phi thương mại, không tiền thật)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FOLK_CASINO_GAMES.map((game) => (
            <GameStoreCard
              key={game.id}
              game={game}
              isOnline={isOnline}
              onShare={setShareGame}
            />
          ))}
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
          shareGame?.description ||
          'Mời bạn bè cùng tham gia trò chơi giải trí trên nền tảng WindHub!'
        }
      />
    </motion.div>
  );
}
