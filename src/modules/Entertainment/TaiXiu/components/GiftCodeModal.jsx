// src/modules/Entertainment/TaiXiu/components/GiftCodeModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, Check, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { HeritageCoinIcon, DongSonSun } from './HeritageIcons';

export default function GiftCodeModal({ open, onClose, onSuccess }) {
  const { player, betBalance, redeemGiftCode } = useAuthStore();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRedeemed, setLastRedeemed] = useState(null);

  if (!open) return null;

  const redeemedCodes = Array.isArray(player?.redeemedGiftcodes) ? player.redeemedGiftcodes : [];

  const handleRedeem = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.warning('Vui lòng nhập mã Giftcode.');
      return;
    }

    if (redeemedCodes.includes(cleanCode)) {
      toast.error(`Bạn đã nhập mã ${cleanCode} rồi! Mỗi tài khoản chỉ được nhập 1 lần.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await redeemGiftCode(cleanCode);
      if (res && res.success) {
        setLastRedeemed({
          code: cleanCode,
          amount: res.rewardAmount,
          newBalance: res.newBalance
        });
        setCode('');
        toast.success(res.message || `🎉 Nhận thành công +${res.rewardAmount.toLocaleString()} xu!`, {
          duration: 5000
        });
        if (typeof onSuccess === 'function') {
          onSuccess(res);
        }
      } else {
        toast.error(res?.message || 'Mã giftcode không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi hệ thống khi nhập giftcode.');
    } finally {
      setIsSubmitting(false);
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
          className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#A87932]/70 bg-gradient-to-b from-[#2a1b14] via-[#1c120e] to-[#120a06] p-5 md:p-6 text-[#E8DDC8] shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none flex flex-col"
        >
          {/* Họa tiết nền Trống Đồng */}
          <div className="pointer-events-none absolute -right-12 -top-12 opacity-10 text-[#D5B46B]">
            <DongSonSun size={240} />
          </div>

          {/* HEADER MODAL */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#A87932]/30 relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D5B46B]/60 bg-gradient-to-br from-[#A87932]/40 to-[#171411] text-[#D5B46B] shadow-inner">
                <Ticket size={24} />
              </div>
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[#D5B46B] uppercase">
                  QUÀ TẶNG TRI ÂN // MÃ GIFTCODE
                </span>
                <h2 className="text-xl font-black text-[#FAF5EB] tracking-tight">
                  Nhập Giftcode
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

          {/* KHUNG SỐ DƯ HIỆN TẠI */}
          <div className="my-3.5 flex items-center justify-between rounded-2xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#331f16] to-[#1c120e] px-3.5 py-2.5 shadow-inner relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <HeritageCoinIcon size={18} className="text-[#D5B46B]" />
              <span className="text-xs text-[#E8DDC8]/80 font-medium">Số dư hiện tại:</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base font-black text-[#D5B46B]">
                {betBalance.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#E8DDC8]/70">xu</span>
            </div>
          </div>

          {/* THÔNG BÁO VỪA NHẬN THÀNH CÔNG */}
          {lastRedeemed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-3 text-emerald-200 relative z-10"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>
                  Đã nhận thành công mã <strong>{lastRedeemed.code}</strong>:
                </span>
                <span className="text-amber-300 font-mono font-black ml-auto">
                  +{lastRedeemed.amount.toLocaleString()} xu
                </span>
              </div>
            </motion.div>
          )}

          {/* FORM NHẬP GIFT CODE */}
          <form onSubmit={handleRedeem} className="space-y-3 relative z-10">
            <div>
              <label
                htmlFor="giftcode-input"
                className="block text-[11px] font-bold text-[#E8DDC8]/80 uppercase tracking-wider mb-1.5"
              >
                Nhập mã quà tặng của bạn
              </label>

              <div className="relative">
                <input
                  id="giftcode-input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: TANTHU"
                  autoComplete="off"
                  autoFocus
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#D5B46B]/50 bg-[#160e0a] px-3.5 py-2.5 pr-10 text-sm font-mono font-bold tracking-wider text-[#FAF5EB] placeholder:text-[#E8DDC8]/30 focus:border-[#D5B46B] focus:outline-hidden focus:ring-1 focus:ring-[#D5B46B] shadow-inner"
                />

                {code && (
                  <button
                    type="button"
                    onClick={() => setCode('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#E8DDC8]/50 hover:text-[#FAF5EB] p-1"
                    title="Xóa mã"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* NÚT XÁC NHẬN NHẬN THƯỞNG */}
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className={`w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-black text-sm tracking-wide transition-all shadow-md active:scale-98 ${code.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-[#D5B46B] via-[#E5C887] to-[#A87932] text-[#171411] hover:brightness-110 shadow-[0_4px_16px_rgba(213,180,107,0.4)] cursor-pointer'
                : 'bg-[#2b1c15] text-[#E8DDC8]/40 border border-[#A87932]/30 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? (
                <span>Đang kiểm tra & cộng xu...</span>
              ) : (
                <>
                  <Sparkles size={16} className={code.trim() ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                  <span>Nhận Xu Thưởng</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* QUY ĐỊNH & HƯỚNG DẪN */}
          <div className="mt-4 rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-3 text-[11px] text-[#E8DDC8]/70 leading-relaxed relative z-10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#D5B46B] font-bold">
              <ShieldCheck size={13} className="shrink-0" />
              <span>Quy tắc nhập Giftcode:</span>
            </div>
            <p>
              • Mỗi mã Giftcode chỉ áp dụng <strong>duy nhất 1 lần</strong> cho mỗi tài khoản người chơi.
            </p>
            <p>
              • Xu thưởng được cộng trực tiếp vào ví sau khi nhập thành công và có thể dùng chơi ngay lập tức.
            </p>
          </div>

          {/* DANH SÁCH MÃ ĐÃ NHẬP TRƯỚC ĐÓ */}
          {redeemedCodes.length > 0 && (
            <div className="mt-3 relative z-10">
              <span className="text-[10px] uppercase font-bold text-[#D5B46B]/80 tracking-wider block mb-1.5">
                Mã bạn đã sử dụng ({redeemedCodes.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {redeemedCodes.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-md bg-[#251710] border border-[#A87932]/40 px-2 py-0.5 text-[10px] font-mono font-bold text-[#E8DDC8]"
                  >
                    <Check size={10} className="text-emerald-400" />
                    <span>{c}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

