import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dices, Compass, ArrowRight, Lock, Share2 } from 'lucide-react';
import { pageTransitionVariants } from '@/design-system/motion';
import { TaiXiuDiceIcon } from '@/components/os/customIcons';
import GameShareModal from './components/GameShareModal';

const GAMES = [
  {
    id: 'tai-xiu',
    title: 'Tài Xỉu Dân Gian',
    subtitle: 'Lắc 3 xúc xắc truyền thống, nặn bát Đông Sơn kịch tính và điểm danh nhận xu mỗi ngày',
    tag: 'ĐANG HOẠT ĐỘNG',
    icon: <TaiXiuDiceIcon size={26} className="text-[#D5B46B]" />,
    features: [
      '3 Xúc xắc chạm khắc ngà truyền thống',
      'Cơ chế kéo nặn bát 360° chân thực',
      '2 Bàn thời gian thực: Xóm Đình (50s) & Chợ Phiên (25s)',
    ],
    link: '/entertainment/tai-xiu',
    isLive: true,
  },
  {
    id: 'bau-cua',
    title: 'Bầu Cua Tôm Cá',
    subtitle: '6 Linh vật ngày hội xuân làng quê sum vầy rộn rã',
    tag: 'SẮP RA MẮT',
    icon: <Compass size={26} className="text-[var(--os-text-muted)]" />,
    features: [
      'Bầu - Cua - Tôm - Cá - Gà - Nai',
      'Âm thanh lễ hội dân gian vui nhộn',
      'Mở thưởng đồng bộ đa người chơi',
    ],
    link: '#',
    isLive: false,
  },
];

export default function Entertainment() {
  const [shareGame, setShareGame] = useState(null);

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8"
    >
      {/* Heritage OS Hero Banner */}
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[#A87932]/45 bg-gradient-to-br from-[#24140c] via-[#170d08] to-[#0e0805] p-6 sm:p-8 text-[#FAF5EB] shadow-[var(--os-shadow-md)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(#D5B46B_1px,transparent_1px)] [background-size:20px_20px]"
        />

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D5B46B]/35 bg-[#D5B46B]/10 px-3 py-1 font-mono text-[11px] font-bold text-[#D5B46B]">
            <Dices size={13} />
            VIETNAMESE HERITAGE // GIẢI TRÍ DÂN GIAN
          </span>
          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-[#FAF5EB]">
            Sòng Trò Chơi Dân Gian
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#E8DDC8]/85">
            Không gian thư giãn giao lưu cùng bạn bè với họa tiết Trống Đồng Đông Sơn. Mọi trò chơi đều dùng điểm xu mô phỏng miễn phí, phi thương mại và không có giá trị quy đổi tiền thật.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GAMES.map((game) => {
          const CardWrapper = game.isLive ? Link : 'div';
          return (
            <CardWrapper
              key={game.id}
              to={game.isLive ? game.link : undefined}
              className={`os-card os-focus-ring relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] p-6 ${
                game.isLive ? 'os-card-interactive cursor-pointer group' : 'opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-[var(--radius-md)] border ${
                      game.isLive
                        ? 'border-[#A87932]/45 bg-[#24160e] shadow-inner'
                        : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)]'
                    }`}
                  >
                    {game.icon}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                      game.isLive
                        ? 'border-[var(--os-success-border)] bg-[var(--os-success-soft)] text-[var(--os-success)]'
                        : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-muted)]'
                    }`}
                  >
                    {game.isLive ? (
                      <span className="size-1.5 rounded-full bg-[var(--os-success)] animate-ping" />
                    ) : (
                      <Lock size={10} />
                    )}
                    {game.tag}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-[var(--os-text-primary)] group-hover:text-[var(--os-accent)] transition-colors">
                  {game.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[var(--os-text-muted)] leading-relaxed">
                  {game.subtitle}
                </p>

                <ul className="mt-4 space-y-2 border-t border-[var(--os-border-subtle)] pt-3.5">
                  {game.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-[var(--os-text-secondary)]">
                      <span className="size-1.5 shrink-0 rounded-full bg-[var(--os-accent)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--os-border-subtle)] pt-3.5">
                {game.isLive ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--os-accent)] group-hover:translate-x-1 transition-transform">
                      <span>Vào bàn toàn màn hình</span>
                      <ArrowRight size={15} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShareGame(game);
                      }}
                      title="Chia sẻ liên kết trò chơi"
                      className="os-focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--os-text-secondary)] hover:text-[var(--os-accent)] cursor-pointer transition-colors"
                    >
                      <Share2 size={13} />
                      <span>Chia sẻ</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-[var(--os-text-muted)] italic">Đang hoàn thiện...</span>
                )}
              </div>
            </CardWrapper>
          );
        })}
      </div>

      <GameShareModal
        isOpen={Boolean(shareGame)}
        onClose={() => setShareGame(null)}
        gameTitle={shareGame?.title || 'Tài Xỉu Dân Gian'}
        roomTitle="Sòng Trò Chơi"
        shareUrl={
          shareGame
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}${shareGame.link}`
            : ''
        }
        description={
          shareGame?.subtitle ||
          'Mời bạn bè cùng tham gia sòng trò chơi dân gian trực tuyến trên WindHub!'
        }
      />
    </motion.div>
  );
}
