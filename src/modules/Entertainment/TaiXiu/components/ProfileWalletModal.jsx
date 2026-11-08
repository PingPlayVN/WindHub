// src/modules/Entertainment/TaiXiu/components/ProfileWalletModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, LogOut, RefreshCw, ShieldCheck, Coffee, ArrowRight, Ticket, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchPlayerTransactions, fetchPlayerBalance } from '@/services/playerApi';
import { fetchPlayerTransactionsFromFirestore } from '@/services/firebaseWallet';
import { HeritageCoinIcon, DongSonSun } from './HeritageIcons';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ProfileWalletModal({ open, onClose, onOpenDonate, onOpenGiftCode }) {
  const { player, betBalance, playerStats, updateBetBalance, logoutPlayer, redeemGiftCode } = useAuthStore();
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'GIFTCODE' | 'TRANSACTIONS'
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Giftcode state inside Profile
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [lastRedeemed, setLastRedeemed] = useState(null);

  const redeemedCodes = Array.isArray(player?.redeemedGiftcodes) ? player.redeemedGiftcodes : [];

  useEffect(() => {
    if (open && activeTab === 'TRANSACTIONS') {
      loadTransactions();
    }
  }, [open, activeTab]);

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const uid = player?.userId || player?.uid;
      let list = [];
      if (uid) {
        list = await fetchPlayerTransactionsFromFirestore(uid, 50);
      }
      if (list.length === 0) {
        const data = await fetchPlayerTransactions(50).catch(() => ({}));
        if (data && Array.isArray(data.transactions)) {
          list = data.transactions;
        }
      }
      setTransactions(list);
    } catch {
      toast.error('Không thể tải lịch sử giao dịch ví.');
    } finally {
      setLoadingTx(false);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      const uid = player?.userId || player?.uid;
      if (uid) {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/services/firebase');
        const snap = await getDoc(doc(db, 'players', uid));
        if (snap.exists() && typeof snap.data().balance === 'number') {
          const bal = snap.data().balance;
          updateBetBalance(bal);
          toast.success(`Đã cập nhật số dư: ${bal.toLocaleString()} xu`);
          return;
        }
      }
      const data = await fetchPlayerBalance();
      if (typeof data.balance === 'number') {
        updateBetBalance(data.balance);
        toast.success(`Đã cập nhật số dư: ${data.balance.toLocaleString()} xu`);
      }
    } catch {
      toast.error('Không thể cập nhật số dư');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logoutPlayer();
    onClose();
    toast.info('Đã đăng xuất tài khoản khỏi hệ thống và game.');
  };

  const handleRedeemCode = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = giftCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.warning('Vui lòng nhập mã Giftcode.');
      return;
    }

    if (redeemedCodes.includes(cleanCode)) {
      toast.error(`Bạn đã nhập mã ${cleanCode} rồi! Mỗi tài khoản chỉ được nhập 1 lần.`);
      return;
    }

    setIsSubmittingCode(true);
    try {
      const res = await redeemGiftCode(cleanCode);
      if (res && res.success) {
        setLastRedeemed({
          code: cleanCode,
          amount: res.rewardAmount
        });
        setGiftCodeInput('');
        toast.success(res.message || `🎉 Nhận thành công +${res.rewardAmount.toLocaleString()} xu!`, {
          duration: 5000
        });
      } else {
        toast.error(res?.message || 'Mã giftcode không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi hệ thống khi nhập giftcode.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  if (!open) return null;

  const totalBets = playerStats?.totalBets || 0;
  const winCount = playerStats?.winCount || 0;
  const totalWon = playerStats?.totalWon || 0;
  const winRate = totalBets > 0 ? Math.round((winCount / totalBets) * 100) : 0;

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
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#A87932]/70 bg-gradient-to-b from-[#2a1b14] via-[#1c120e] to-[#120a06] p-5 md:p-6 text-[#E8DDC8] shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none flex flex-col max-h-[90vh]"
        >
          {/* Họa tiết nền Trống Đồng */}
          <div className="pointer-events-none absolute -right-12 -top-12 opacity-10 text-[#D5B46B]">
            <DongSonSun size={240} />
          </div>

          {/* HEADER MODAL */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#A87932]/30 relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0">
                <UserAvatar
                  src={player?.avatarUrl}
                  name={player?.displayName}
                  email={player?.email}
                  size={48}
                  className="border-2 border-[#D5B46B] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white border border-[#2a1b14]">
                  <ShieldCheck size={12} />
                </span>
              </div>

              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold tracking-widest text-[#D5B46B] uppercase">
                  HỒ SƠ NGƯỜI CHƠI
                </span>
                <h2 className="text-lg font-black text-[#FAF5EB] tracking-tight truncate">
                  {player?.displayName || 'Dân Làng'}
                </h2>
                <p className="text-xs text-[#E8DDC8]/60 truncate font-mono">
                  {player?.email || player?.userId}
                </p>
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

          {/* Authoritative Xu Wallet Box */}
          <div className="my-3.5 flex items-center justify-between rounded-2xl border border-[#D5B46B]/50 bg-gradient-to-r from-[#331f16] to-[#1c120e] p-3 shadow-inner relative z-10 shrink-0">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#E8DDC8]/70 font-bold block">
                Số dư ví xu hiện tại
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <HeritageCoinIcon size={20} className="text-[#D5B46B]" />
                <span className="font-mono text-xl font-black text-[#D5B46B]">
                  {betBalance.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-[#E8DDC8]/80">xu</span>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={handleRefreshBalance}
              title="Làm mới số dư"
              className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* NÚT ỦNG HỘ SERVER NHẬN XU (DONATE) */}
          <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#27170f] to-amber-950/40 p-2.5 relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Coffee size={16} />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Ủng Hộ Duy Trì Server</span>
                <p className="text-[11px] text-[#FAF5EB] font-bold">10k = 100k xu • 20k = 250k xu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenDonate) {
                  onClose();
                  onOpenDonate();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] text-xs font-black active:scale-95 transition-all shadow-sm flex items-center gap-1"
            >
              <span>Ủng hộ</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex rounded-xl border border-[#A87932]/35 bg-[#170e0a] p-1 gap-1 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('PROFILE')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${activeTab === 'PROFILE'
                  ? 'bg-gradient-to-r from-[#A87932] to-[#8E2926] text-[#FAF5EB] shadow-sm'
                  : 'text-[#E8DDC8]/60 hover:text-[#FAF5EB]'
                }`}
            >
              Thống Kê
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('GIFTCODE')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${activeTab === 'GIFTCODE'
                  ? 'bg-gradient-to-r from-[#A87932] to-[#8E2926] text-[#FAF5EB] shadow-sm'
                  : 'text-[#E8DDC8]/60 hover:text-[#FAF5EB]'
                }`}
            >
              <Ticket size={12} className="text-[#D5B46B]" />
              <span>Giftcode</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${activeTab === 'TRANSACTIONS'
                  ? 'bg-gradient-to-r from-[#A87932] to-[#8E2926] text-[#FAF5EB] shadow-sm'
                  : 'text-[#E8DDC8]/60 hover:text-[#FAF5EB]'
                }`}
            >
              Lịch Sử Ví
            </button>
          </div>

          {/* TAB CONTENT: PROFILE / STATS */}
          {activeTab === 'PROFILE' && (
            <div className="my-3 space-y-3 overflow-y-auto relative z-10 flex-1 pr-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-3">
                  <span className="text-[10px] text-[#E8DDC8]/60 uppercase tracking-wide block">Tổng ván cược</span>
                  <strong className="font-mono text-base font-bold text-[#FAF5EB] mt-0.5 block">
                    {totalBets} ván
                  </strong>
                </div>

                <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-3">
                  <span className="text-[10px] text-[#E8DDC8]/60 uppercase tracking-wide block">Số ván thắng</span>
                  <strong className="font-mono text-base font-bold text-emerald-400 mt-0.5 block">
                    {winCount} ván
                  </strong>
                </div>

                <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-3">
                  <span className="text-[10px] text-[#E8DDC8]/60 uppercase tracking-wide block">Tỷ lệ thắng</span>
                  <strong className="font-mono text-base font-bold text-[#D5B46B] mt-0.5 block">
                    {winRate}%
                  </strong>
                </div>

                <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-3">
                  <span className="text-[10px] text-[#E8DDC8]/60 uppercase tracking-wide block">Tổng xu đã thắng</span>
                  <strong className="font-mono text-base font-bold text-amber-300 mt-0.5 block">
                    +{totalWon.toLocaleString()} xu
                  </strong>
                </div>
              </div>

              {/* Nút chuyển nhanh sang tab Giftcode */}
              <button
                type="button"
                onClick={() => setActiveTab('GIFTCODE')}
                className="w-full flex items-center justify-between rounded-xl border border-[#D5B46B]/40 bg-[#1f140e] px-3 py-2 text-xs font-bold text-[#D5B46B] hover:text-[#FAF5EB] hover:bg-[#2b1c15] active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Ticket size={14} className="text-[#D5B46B]" />
                  <span>Bạn có mã Giftcode quà tặng?</span>
                </div>
                <span className="text-[11px] underline">Nhập ngay ➔</span>
              </button>

              <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/60 p-3 text-[11px] text-[#E8DDC8]/70 space-y-1">
                <p>• Mã ID tài khoản: <code className="text-[#D5B46B]">{player?.userId}</code></p>
                <p>• Google Sub: <code className="text-[#D5B46B]">{player?.googleSub?.slice(0, 12)}...</code></p>
                <p>• Trạng thái: <span className="text-emerald-400 font-bold">Xác thực chính thức</span></p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: GIFTCODE REDEMPTION */}
          {activeTab === 'GIFTCODE' && (
            <div className="my-3 space-y-3 overflow-y-auto relative z-10 flex-1 pr-1">
              {lastRedeemed && (
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-2.5 text-emerald-200 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Đã nhận thành công: <strong>{lastRedeemed.code}</strong></span>
                  </div>
                  <span className="text-amber-300 font-mono font-black">+{lastRedeemed.amount.toLocaleString()} xu</span>
                </div>
              )}

              <form onSubmit={handleRedeemCode} className="space-y-2.5">
                <div>
                  <label
                    htmlFor="profile-giftcode-input"
                    className="block text-[11px] font-bold text-[#E8DDC8]/80 uppercase tracking-wider mb-1"
                  >
                    Ô Nhập Mã Giftcode
                  </label>
                  <div className="relative">
                    <input
                      id="profile-giftcode-input"
                      type="text"
                      value={giftCodeInput}
                      onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: TANTHU..."
                      autoComplete="off"
                      disabled={isSubmittingCode}
                      className="w-full rounded-xl border border-[#D5B46B]/50 bg-[#160e0a] px-3 py-2 pr-9 text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FAF5EB] placeholder:text-[#E8DDC8]/30 focus:border-[#D5B46B] focus:outline-hidden focus:ring-1 focus:ring-[#D5B46B] shadow-inner"
                    />
                    {giftCodeInput && (
                      <button
                        type="button"
                        onClick={() => setGiftCodeInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#E8DDC8]/50 hover:text-[#FAF5EB] p-1"
                        title="Xóa mã"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCode || !giftCodeInput.trim()}
                  className={`w-full min-h-[38px] rounded-xl flex items-center justify-center gap-1.5 font-black text-xs tracking-wide transition-all shadow-md active:scale-98 ${giftCodeInput.trim() && !isSubmittingCode
                      ? 'bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-[#171411] hover:brightness-110 shadow-sm cursor-pointer'
                      : 'bg-[#2b1c15] text-[#E8DDC8]/40 border border-[#A87932]/30 cursor-not-allowed'
                    }`}
                >
                  {isSubmittingCode ? (
                    <span>Đang kiểm tra & cộng xu...</span>
                  ) : (
                    <>
                      <Sparkles size={14} className={giftCodeInput.trim() ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                      <span>Nhận Xu Thưởng</span>
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/80 p-2.5 text-[11px] text-[#E8DDC8]/70 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 text-[#D5B46B] font-bold">
                  <ShieldCheck size={12} className="shrink-0" />
                  <span>Lưu ý:</span>
                </div>
                <p>• Mỗi mã chỉ sử dụng <strong>duy nhất 1 lần</strong> cho mỗi tài khoản.</p>
                <p>• Xu thưởng được cộng trực tiếp vào ví sau khi nhập thành công.</p>
              </div>

              {redeemedCodes.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D5B46B]/80 tracking-wider block mb-1">
                    Mã bạn đã sử dụng ({redeemedCodes.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {redeemedCodes.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded bg-[#251710] border border-[#A87932]/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#E8DDC8]"
                      >
                        <Check size={9} className="text-emerald-400" />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: TRANSACTIONS LEDGER */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="my-3 overflow-y-auto relative z-10 flex-1 pr-1">
              {loadingTx ? (
                <div className="flex h-40 items-center justify-center text-xs text-[#E8DDC8]/60">
                  Đang tải sổ cái giao dịch...
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-xs text-[#E8DDC8]/60">
                  <History size={24} className="mb-2 text-[#A87932]/50" />
                  <span>Chưa có giao dịch nào được ghi nhận.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    const dateStr = new Date(tx.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit'
                    });

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-xl border border-[#A87932]/25 bg-[#170e0a]/70 p-2.5 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${tx.type === 'DAILY_REWARD'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : tx.type === 'GIFT_CODE'
                                    ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                    : tx.type === 'PAYOUT'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                            >
                              {tx.type === 'DAILY_REWARD'
                                ? 'Điểm danh'
                                : tx.type === 'GIFT_CODE'
                                  ? 'Giftcode'
                                  : tx.type === 'PAYOUT'
                                    ? 'Thắng cược'
                                    : 'Đặt cược'}
                            </span>
                            <span className="font-mono text-[10px] text-[#E8DDC8]/50">{dateStr}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#FAF5EB] truncate">
                            {tx.description || tx.referenceId || 'Giao dịch'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                          >
                            {isCredit ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} xu
                          </div>
                          <span className="text-[9px] font-mono text-[#E8DDC8]/50 block">
                            Dư: {tx.balanceAfter?.toLocaleString()} xu
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FOOTER & LOGOUT */}
          <div className="mt-auto pt-3 border-t border-[#A87932]/30 flex items-center justify-between relative z-10 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/60 active:scale-95 transition-all"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#A87932]/40 bg-[#2b1c15] px-4 py-2 text-xs font-bold text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

