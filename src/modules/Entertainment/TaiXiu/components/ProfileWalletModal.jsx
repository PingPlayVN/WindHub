// src/modules/Entertainment/TaiXiu/components/ProfileWalletModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, History, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchPlayerTransactions, fetchPlayerBalance } from '@/services/playerApi';
import { HeritageCoinIcon, DongSonSun } from './HeritageIcons';

export default function ProfileWalletModal({ open, onClose }) {
  const { player, betBalance, playerStats, updateBetBalance, logoutPlayer } = useAuthStore();
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'TRANSACTIONS'
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (open && activeTab === 'TRANSACTIONS') {
      loadTransactions();
    }
  }, [open, activeTab]);

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const data = await fetchPlayerTransactions(50);
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch {
      toast.error('Không thể tải lịch sử giao dịch ví.');
    } finally {
      setLoadingTx(false);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
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
    toast.info('Đã đăng xuất tài khoản Google.');
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
                {player?.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.displayName}
                    className="size-12 rounded-full border-2 border-[#D5B46B] object-cover shadow-md"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#D5B46B] bg-[#2b1c15] text-[#D5B46B]">
                    <User size={24} />
                  </div>
                )}
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

          {/* TAB SELECTOR */}
          <div className="flex rounded-xl border border-[#A87932]/35 bg-[#170e0a] p-1 gap-1 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('PROFILE')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PROFILE'
                  ? 'bg-gradient-to-r from-[#A87932] to-[#8E2926] text-[#FAF5EB] shadow-sm'
                  : 'text-[#E8DDC8]/60 hover:text-[#FAF5EB]'
              }`}
            >
              Thống Kê Chiến Tích
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-gradient-to-r from-[#A87932] to-[#8E2926] text-[#FAF5EB] shadow-sm'
                  : 'text-[#E8DDC8]/60 hover:text-[#FAF5EB]'
              }`}
            >
              Lịch Sử Giao Dịch
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

              <div className="rounded-xl border border-[#A87932]/30 bg-[#170e0a]/60 p-3 text-[11px] text-[#E8DDC8]/70 space-y-1">
                <p>• Mã ID tài khoản: <code className="text-[#D5B46B]">{player?.userId}</code></p>
                <p>• Google Sub: <code className="text-[#D5B46B]">{player?.googleSub?.slice(0, 12)}...</code></p>
                <p>• Trạng thái: <span className="text-emerald-400 font-bold">Xác thực chính thức</span></p>
              </div>
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
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                tx.type === 'DAILY_REWARD'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : tx.type === 'PAYOUT'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {tx.type === 'DAILY_REWARD' ? 'Điểm danh' : tx.type === 'PAYOUT' ? 'Thắng cược' : 'Đặt cược'}
                            </span>
                            <span className="font-mono text-[10px] text-[#E8DDC8]/50">{dateStr}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#FAF5EB] truncate">
                            {tx.description || tx.referenceId || 'Giao dịch'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono font-bold text-sm ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
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

