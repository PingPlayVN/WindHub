import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogOut,
  ShieldCheck,
  User,
  Copy,
  Check,
  Sun,
  Moon,
  CircleHelp,
  Terminal,
  Sparkles,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import UserAvatar from '@/components/ui/UserAvatar';

export default function UserProfileModal({ open, onClose, onOpenShortcuts, onToggleEruda }) {
  const { user, player, isAdmin, betBalance, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [copiedUid, setCopiedUid] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!open) return null;

  const displayName = player?.displayName || user?.displayName || 'Người dùng';
  const email = player?.email || user?.email || '';
  const photoURL = player?.avatarUrl || user?.photoURL;
  const uid = user?.uid || player?.userId || '';

  const handleCopyUid = () => {
    if (!uid) return;
    navigator.clipboard?.writeText(uid);
    setCopiedUid(true);
    toast.success('Đã sao chép mã định danh (UID)!');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Đã đăng xuất tài khoản Google thành công!');
      onClose();
    } catch {
      toast.error('Lỗi khi đăng xuất.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.button
          type="button"
          aria-label="Đóng hồ sơ"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-zinc-800/90 dark:bg-[#0f1117] text-slate-800 dark:text-zinc-100 select-none"
        >
          {/* Header Banner Gradient */}
          <div className="relative h-28 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
            <div className="flex items-start justify-between relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm shadow-xs">
                <Sparkles size={12} /> Google Account
              </span>
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="rounded-full bg-black/25 p-1.5 text-white/90 backdrop-blur-sm transition hover:bg-black/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar & Role Badge */}
            <div className="-mt-12 flex items-end justify-between mb-3.5">
              <div className="relative">
                <UserAvatar
                  src={photoURL}
                  name={displayName}
                  email={email}
                  size={72}
                  className="rounded-2xl border-4 border-white shadow-xl dark:border-[#0f1117]"
                />
                <span
                  title="Xác thực Google OAuth"
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white p-0.5 shadow-md dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </span>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-xs">
                  <ShieldCheck size={15} />
                  <span>Quản trị viên (Admin)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs">
                  <User size={14} />
                  <span>Thành viên</span>
                </div>
              )}
            </div>

            {/* Tên & Email */}
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-mono">
                {email}
              </p>
            </div>

            {/* Thẻ Số dư Ví Game Xu */}
            <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8.5 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Coins size={17} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80 block">
                    Ví Game Giải Trí
                  </span>
                  <span className="font-mono text-sm font-black text-amber-800 dark:text-amber-300">
                    {(betBalance || 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400">xu</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mã UID người chơi */}
            {uid && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600 dark:bg-zinc-900/70 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-800/60">
                <span className="font-mono text-[11px] truncate max-w-[260px]">
                  UID: {uid}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  title="Sao chép UID"
                  className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 active:scale-90"
                >
                  {copiedUid ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* Cài đặt & Thao tác (Chỉ hiện Phím tắt hệ thống khi là Admin) */}
            <div className="mt-3.5">
              {isAdmin ? (
                /* Layout Admin: 2 cột (Giao diện Sáng/Tối + Phím tắt hệ thống) */
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={15} /> <span>Giao diện Tối</span>
                      </>
                    ) : (
                      <>
                        <Sun size={15} /> <span>Giao diện Sáng</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenShortcuts?.();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <CircleHelp size={15} />
                    <span>Phím tắt hệ thống</span>
                  </button>
                </div>
              ) : (
                /* Layout User Thường: Thanh chuyển đổi giao diện tinh tế, KHÔNG CÓ nút phím tắt */
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'light' ? (
                      <Moon size={16} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Sun size={16} className="text-amber-500" />
                    )}
                    <span className="font-semibold">
                      {theme === 'light' ? 'Chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500 bg-slate-200/60 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>
              )}
            </div>

            {/* Nút bật Eruda cho mobile Admin nếu có */}
            {isAdmin && onToggleEruda && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleEruda();
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50/60 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
              >
                <Terminal size={14} />
                <span>Bật / Tắt Mobile Eruda Console</span>
              </button>
            )}

            {/* Nút Đăng xuất đồng bộ */}
            <div className="mt-4 border-t border-slate-100 pt-3.5 dark:border-zinc-800/80">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/80 bg-rose-50/70 py-2.5 px-4 text-sm font-bold text-rose-700 shadow-xs transition hover:bg-rose-100 active:scale-[0.99] dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/60 disabled:opacity-60"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
