import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShieldCheck, Coins, Sparkles, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/services/firebase';
import { isAdminEmail } from '@/services/auth';
import { useAuthStore } from '@/store/useAuthStore';

const getLoginErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập Google chưa được kích hoạt trên Firebase.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra lại mạng.';
    case 'auth/popup-closed-by-user':
      return 'Bạn đã đóng cửa sổ đăng nhập Google.';
    case 'auth/cancelled-popup-request':
      return 'Yêu cầu đăng nhập đã được thay thế.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép popup để đăng nhập.';
    default:
      return error.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
  }
};

export default function LoginModal({ open, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đăng nhập duy nhất & bảo mật qua Google OAuth 2.0
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Đồng bộ ví game và profile
      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = credential?.idToken;
        if (idToken) {
          await useAuthStore.getState().loginWithGoogle(idToken);
        } else {
          await useAuthStore.getState().initPlayerAuth();
        }
      } catch (err) {
        console.warn('Game wallet sync error:', err);
      }

      if (isAdminEmail(user?.email)) {
        toast.success(`Xin chào Admin ${user.displayName || user.email}! Đã kích hoạt quyền quản trị.`);
      } else {
        toast.success(`Đăng nhập thành công! Chào mừng ${user.displayName || user.email}`);
      }
      onClose();
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Đóng đăng nhập"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
          />

          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#0c0e12] select-none"
          >
            {/* Vòng sáng background */}
            <div className="pointer-events-none absolute -top-24 -right-20 size-56 rounded-full bg-gradient-to-br from-blue-500/15 via-amber-500/15 to-transparent blur-3xl dark:from-blue-500/10 dark:via-amber-500/10" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 size-56 rounded-full bg-gradient-to-tr from-emerald-500/15 via-blue-500/10 to-transparent blur-3xl dark:from-emerald-500/10" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Đăng nhập WindHub
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cổng dịch vụ & Trung tâm tiện ích cá nhân
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nút đăng nhập Google nổi bật */}
            <div className="relative z-10 mt-6">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/80 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.99] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-blue-500" />
                    <span>Đang kết nối tài khoản Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-medium">Tiếp tục bằng tài khoản Google</span>
                    <ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500" />
                  </>
                )}
              </button>
            </div>

            {/* Danh sách lợi ích & tính năng tự động */}
            <div className="relative z-10 mt-6 space-y-2.5">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-colors dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Ủy quyền Quản trị Tự động
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Email quản trị viên nhận ngay quyền Admin quản lý file và hệ thống
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-colors dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Coins size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Đồng bộ Ví & Điểm danh Tài Xỉu
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Lưu trữ số dư xu cược, chuỗi điểm danh 7 ngày an toàn trên Firebase
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition-colors dark:border-zinc-800/60 dark:bg-zinc-900/40">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Lock size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Bảo mật Google OAuth 2.0
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Xác thực 1 chạm an toàn, không cần tạo và ghi nhớ mật khẩu riêng
                  </p>
                </div>
              </div>
            </div>

            {/* Footer cam kết bảo mật */}
            <div className="relative z-10 mt-6 border-t border-slate-100 pt-4 text-center dark:border-zinc-800/70">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                WindHub chỉ truy cập họ tên, email và avatar cơ bản từ tài khoản Google của bạn.
              </p>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
