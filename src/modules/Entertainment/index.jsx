// src/modules/Entertainment/index.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dices, Sparkles, ArrowRight, Lock } from 'lucide-react';

const GAMES = [
  {
    id: 'tai-xiu',
    title: 'Tài Xỉu Dân Gian',
    subtitle: 'Lắc 3 xúc xắc, nặn đĩa hồi hộp, trúng lớn cửa Bão',
    tag: 'ĐANG HOẠT ĐỘNG',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <Dices size={28} className="text-amber-400" />,
    features: ['3 Xúc xắc truyền thống', 'Tính năng nặn bát độc đáo', '2 Bàn chơi: 30s & 15s'],
    link: '/entertainment/tai-xiu',
    isLive: true
  },
  {
    id: 'bau-cua',
    title: 'Bầu Cua Tôm Cá',
    subtitle: '6 Linh vật ngày hội xuân làng quê sum vầy',
    tag: 'SẮP RA MẮT',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: <Sparkles size={28} className="text-amber-400" />,
    features: ['Bầu - Cua - Tôm - Cá - Gà - Nai', 'Âm thanh chợ tết vui nhộn', 'Mở thưởng đồng bộ'],
    link: '#',
    isLive: false
  }
];

export default function Entertainment() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12"
    >
      {/* BANNER GÓC GIẢI TRÍ */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-800/40 bg-gradient-to-br from-[#24130d] via-[#160b07] to-[#0c0604] p-6 text-amber-50 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(245,158,11,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,.1)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              <Sparkles size={14} className="text-amber-400" />
              <span>GÓC GIẢI TRÍ LÀNG QUÊ WINDHUB</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-amber-100 sm:text-4xl">
              Sòng Trò Chơi Dân Gian
            </h1>
            <p className="mt-2 text-sm leading-6 text-amber-200/80">
              Nơi giao lưu, giải trí thư giãn cùng bạn bè sau những giờ làm việc.
              Tất cả các trò chơi đều sử dụng điểm mô phỏng miễn phí, phi thương mại và tuyệt đối không có yếu tố tiền thật.
            </p>
          </div>
        </div>
      </section>

      {/* DANH SÁCH GAME CARDS */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Dices size={20} className="text-amber-500" />
            Các Trò Chơi Dân Gian
          </h2>
          <span className="text-xs text-slate-400 font-mono">1 đang chạy · 1 sắp ra mắt</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GAMES.map((game) => {
            const CardWrapper = game.isLive ? Link : 'div';
            return (
              <CardWrapper
                key={game.id}
                to={game.isLive ? game.link : undefined}
                className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all ${
                  game.isLive
                    ? 'border-amber-500/40 bg-gradient-to-br from-white via-amber-50/20 to-white hover:border-amber-500 hover:shadow-xl dark:from-[#111317] dark:via-[#16120e] dark:to-[#0f1115] dark:border-amber-600/30 dark:hover:border-amber-500 cursor-pointer group'
                    : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-[#0c0d10] opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-inner">
                      {game.icon}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${game.tagColor}`}>
                      {game.isLive ? <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" /> : <Lock size={10} />}
                      {game.tag}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {game.subtitle}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                    {game.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="size-1.5 rounded-full bg-amber-500/80" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  {game.isLive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                      Vào sòng ngay <ArrowRight size={14} />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Đang xây dựng...</span>
                  )}
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
