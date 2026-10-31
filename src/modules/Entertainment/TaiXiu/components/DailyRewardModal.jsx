// src/modules/Entertainment/TaiXiu/components/DailyRewardModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { HeritageCoinIcon, DongSonSun } from './HeritageIcons';

const REWARD_AMOUNTS = [5000, 10000, 15000, 25000, 40000, 60000, 100000];

export default function DailyRewardModal({ open, onClose, onRewardClaimed }) {
  const { dailyReward, claimReward, betBalance } = useAuthStore();
  const [isClaiming, setIsClaiming] = useState(false);

  if (!open) return null;

  const currentStreak = dailyReward?.currentStreak || 0;
  const canClaimToday = dailyReward?.canClaimToday ?? true;
  const claimedToday = dailyReward?.claimedToday || false;
  const nextStreakDay = dailyReward?.nextStreakDay || 1;
  const nextRewardAmount = dailyReward?.nextRewardAmount || REWARD_AMOUNTS[nextStreakDay - 1] || 5000;

  const handleClaim = async () => {
    if (!canClaimToday || isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await claimReward();
      if (res.success) {
        toast.success(`🎉 Điểm danh thành công! Bạn nhận được +${res.amount.toLocaleString()} xu!`, {
          duration: 5000
        });
        if (typeof onRewardClaimed === 'function') {
          onRewardClaimed(res.newBalance);
        }
      } else {
        toast.error(res.message || 'Không thể nhận thưởng hôm nay.');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi kết nối khi nhận thưởng.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#A87932]/70 bg-gradient-to-b from-[#2a1b14] via-[#1c120e] to-[#120a06] p-5 md:p-6 text-[#E8DDC8] shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none"
        >
          {/* Họa tiết nền Trống Đồng */}
          <div className="pointer-events-none absolute -right-12 -top-12 opacity-10 text-[#D5B46B]">
            <DongSonSun size={240} />
          </div>

          {/* HEADER MODAL */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#A87932]/30 relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D5B46B]/60 bg-gradient-to-br from-[#A87932]/40 to-[#171411] text-[#D5B46B] shadow-inner">
                <Gift size={24} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[#D5B46B] uppercase">
                  LỘC ĐẦU NGÀY // 7 NGÀY ĐIỂM DANH
                </span>
                <h2 className="text-xl font-black text-[#FAF5EB] tracking-tight">
                  Điểm Danh Nhận Xu
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* THANH TIẾN ĐỘ CHUỖI ĐIỂM DANH */}
          <div className="my-4 rounded-2xl border border-[#A87932]/35 bg-[#170e0a]/80 p-3 relative z-10">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#E8DDC8]/80 font-medium">Chuỗi ngày liên tiếp:</span>
              <span className="font-mono font-bold text-[#D5B46B]">
                {currentStreak} / 7 ngày
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a1b14] border border-[#A87932]/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (currentStreak / 7) * 100)}%` }}
                className="h-full bg-gradient-to-r from-[#A87932] via-[#D5B46B] to-amber-300 rounded-full"
              />
            </div>
            <p className="mt-2 text-[10px] text-[#E8DDC8]/60">
              * Lưu ý: Giờ điểm danh tính theo múi giờ Việt Nam (Asia/Ho_Chi_Minh). Nếu bỏ lỡ một ngày, chuỗi sẽ bắt đầu lại từ Ngày 1.
            </p>
          </div>

          {/* LƯỚI 7 NGÀY ĐIỂM DANH */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 my-4 relative z-10">
            {REWARD_AMOUNTS.map((amount, idx) => {
              const dayNum = idx + 1;
              const isPastClaimed = (dayNum <= currentStreak && claimedToday) || (dayNum < nextStreakDay);
              const isTodayTarget = (dayNum === nextStreakDay && canClaimToday);

              return (
                <div
                  key={dayNum}
                  className={`flex flex-col items-center justify-between rounded-xl p-2.5 text-center transition-all border relative ${
                    isTodayTarget
                      ? 'border-[#D5B46B] bg-gradient-to-b from-[#3d2719] to-[#1c120e] shadow-[0_0_12px_rgba(213,180,107,0.4)] scale-102 ring-1 ring-[#D5B46B]'
                      : isPastClaimed
                      ? 'border-emerald-600/40 bg-emerald-950/20 text-emerald-300'
                      : 'border-[#A87932]/25 bg-[#170e0a]/50 text-[#E8DDC8]/40'
                  }`}
                >
                  <span className="font-mono text-[10px] font-bold">Ngày {dayNum}</span>

                  <div className="my-1.5 flex items-center justify-center">
                    {isPastClaimed ? (
                      <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check size={14} />
                      </div>
                    ) : isTodayTarget ? (
                      <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 animate-bounce">
                        <Sparkles size={14} />
                      </div>
                    ) : (
                      <div className="flex size-6 items-center justify-center rounded-full bg-black/30 text-[#E8DDC8]/30">
                        <Lock size={12} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 font-mono text-[11px] font-black text-[#D5B46B]">
                    <span>+{amount >= 1000 ? `${amount / 1000}k` : amount}</span>
                  </div>

                  {isTodayTarget && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[#8E2926] px-1.5 py-0.2 text-[8px] font-bold text-[#FAF5EB] border border-[#D5B46B]">
                      Hôm nay
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* NÚT BẤM NHẬN THƯỞNG */}
          <div className="mt-5 pt-3 border-t border-[#A87932]/30 flex flex-col items-center gap-2 relative z-10">
            {canClaimToday ? (
              <button
                type="button"
                disabled={isClaiming}
                onClick={handleClaim}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#D5B46B] bg-gradient-to-r from-[#D5B46B] via-[#E8DDC8] to-[#D5B46B] py-3.5 px-4 font-black text-[#171411] shadow-[0_8px_24px_rgba(213,180,107,0.35)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 text-base"
              >
                <Gift size={20} className="text-[#8E2926]" />
                <span>
                  {isClaiming ? 'Đang nhận quà...' : `ĐIỂM DANH NHẬN +${nextRewardAmount.toLocaleString()} XU`}
                </span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 py-3 px-4 text-emerald-300 font-bold text-sm">
                <Check size={18} />
                <span>Hôm nay bạn đã điểm danh. Hẹn gặp lại vào ngày mai!</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-[#E8DDC8]/80 mt-1">
              <span>Số dư ví hiện tại:</span>
              <HeritageCoinIcon size={14} className="text-[#D5B46B]" />
              <strong className="font-mono text-sm text-[#D5B46B]">{betBalance.toLocaleString()} xu</strong>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

