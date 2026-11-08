// src/modules/Entertainment/TaiXiu/components/GoogleLoginGate.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Gift, Coins, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { DongSonSun } from './HeritageIcons';

export default function GoogleLoginGate() {
  const navigate = useNavigate();
  const { loginWithGoogle, isPlayerLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đăng nhập trực tiếp bằng Google Popup (Firebase Auth) - Bảo mật, tiện lợi, không bị lỗi 403 Origin iframe của GIS
  const handleGooglePopupSignIn = async () => {
    setIsSubmitting(true);
    try {
      const [{ GoogleAuthProvider, signInWithPopup }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase')
      ]);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = credential?.idToken;
        if (idToken) {
          await loginWithGoogle(idToken);
        } else {
          await useAuthStore.getState().initPlayerAuth();
        }
      } catch (workerErr) {
        console.warn('Worker sync error:', workerErr);
      }

      toast.success(`Đăng nhập Google thành công! Xin chào ${user.displayName || user.email}`);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Bạn đã đóng cửa sổ đăng nhập.');
      } else {
        console.error('Google sign in error:', err);
        toast.error(err.message || 'Đăng nhập Google thất bại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hỗ trợ đăng nhập thử nghiệm môi trường phát triển (Khi chưa có Client ID Google)
  const handleDevSignIn = async () => {
    setIsSubmitting(true);
    try {
      // Mock Google ID Token cho local dev
      const header = btoa(JSON.stringify({ alg: 'RS256' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const payload = btoa(JSON.stringify({
        iss: 'mock_google_auth',
        sub: `google_dev_${Math.random().toString(36).substring(2, 8)}`,
        email: 'player.vietnam@gmail.com',
        name: 'Bác Ba Làng Quê',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        email_verified: true
      })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const mockToken = `${header}.${payload}.dev_mock_signature`;

      await loginWithGoogle(mockToken);
      toast.success('Đăng nhập tài khoản Google thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi đăng nhập thử nghiệm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-[#140b07] via-[#1f120b] to-[#0c0604] text-[#E8DDC8] select-none">
      {/* Họa tiết nền Trống Đồng mờ cổ kính */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 overflow-hidden">
        <DongSonSun size={700} className="text-[#D5B46B] animate-spin-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#A87932]/60 bg-gradient-to-b from-[#251812] via-[#1c120e] to-[#140c08] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.85)]"
      >
        {/* Nút thoát về sảnh */}
        <button
          type="button"
          onClick={() => navigate('/entertainment')}
          className="absolute top-4 left-4 flex size-9 items-center justify-center rounded-xl border border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all shadow-inner"
          title="Rời bàn về Sảnh Giải Trí"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Biểu tượng Trống đồng trung tâm */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-[#D5B46B] bg-gradient-to-br from-[#A87932]/50 via-[#3a2217] to-[#1a0f0a] text-[#D5B46B] shadow-[0_0_24px_rgba(213,180,107,0.35)]">
            <DongSonSun size={40} />
          </div>

          <span className="mt-3 font-mono text-[11px] font-bold tracking-widest text-[#D5B46B] uppercase">
            WINDHUB // SÒNG DÂN GIAN
          </span>
          <h2 className="mt-1 text-2xl font-black text-[#FAF5EB] tracking-tight">
            Tài Xỉu Xóm Đình
          </h2>
          <p className="mt-1.5 text-xs text-[#E8DDC8]/80 leading-relaxed max-w-xs">
            Hệ thống giải trí lành mạnh mô phỏng trò chơi dân gian Việt Nam. Điểm danh nhận xu miễn phí mỗi ngày.
          </p>
        </div>

        {/* BẢNG QUYỀN LỢI ĐĂNG NHẬP GOOGLE */}
        <div className="my-5 space-y-2 rounded-2xl border border-[#A87932]/35 bg-[#170e0a]/80 p-3.5 text-xs">
          <div className="flex items-center gap-2.5 text-[#FAF5EB]">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>Chỉ hỗ trợ tài khoản Google chính thức (Bảo mật tuyệt đối, chống clone)</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#FAF5EB]">
            <Coins size={16} className="text-[#D5B46B] shrink-0" />
            <span>Tặng ngay <strong>10.000 xu</strong> tân thủ khởi nghiệp vào ví</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#FAF5EB]">
            <Gift size={16} className="text-amber-400 shrink-0" />
            <span>Chuỗi điểm danh 7 ngày nhận từ <strong>5.000</strong> đến <strong>100.000 xu</strong></span>
          </div>
        </div>

        {/* NÚT ĐĂNG NHẬP GOOGLE */}
        <div className="flex flex-col items-center gap-3">
          {/* Nút Đăng Nhập Google Native Popup (Hoạt động ổn định trên mọi port / domain không bị lỗi 403 iframe) */}
          <button
            type="button"
            disabled={isSubmitting || isPlayerLoading}
            onClick={handleGooglePopupSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-xl transition-all hover:bg-slate-100 hover:shadow-2xl active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isSubmitting ? 'Đang kết nối Google...' : 'Đăng nhập nhanh với Google'}</span>
          </button>

          {/* Nút đăng nhập phụ trợ / Fallback (Môi trường Local Dev Vite) */}
          {import.meta.env.DEV && (
            <button
              type="button"
              disabled={isSubmitting || isPlayerLoading}
              onClick={handleDevSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#D5B46B]/40 bg-[#251812] py-2.5 px-4 text-xs font-semibold text-[#D5B46B] hover:text-[#FAF5EB] hover:bg-[#342219] active:scale-98 transition-all disabled:opacity-60"
            >
              <LogIn size={15} />
              <span>{isSubmitting ? 'Đang kết nối...' : 'Tài khoản thử nghiệm Local (Dev)'}</span>
            </button>
          )}

          <p className="text-[10px] text-center text-[#E8DDC8]/60 mt-1">
            * Không hỗ trợ tài khoản khách vãng lai. Vui lòng đăng nhập để lưu trữ số dư và lịch sử cược.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

