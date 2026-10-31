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
  const googleBtnContainerRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Nạp Google Identity Services (GIS) script
  useEffect(() => {
    let script = document.getElementById('google-gis-script');

    const initializeGis = () => {
      if (window.google?.accounts?.id && googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setIsSubmitting(true);
              try {
                await loginWithGoogle(response.credential);
                toast.success('Đăng nhập Google thành công! Chúc bạn chơi vui vẻ.');
              } catch (err) {
                toast.error(err.message || 'Đăng nhập Google thất bại.');
              } finally {
                setIsSubmitting(false);
              }
            }
          }
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            locale: 'vi',
            width: 280
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGis;
      document.head.appendChild(script);
    } else {
      initializeGis();
    }
  }, [googleClientId, loginWithGoogle]);

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
          {/* Nơi render nút Google Identity Services */}
          <div ref={googleBtnContainerRef} className="min-h-[44px] flex items-center justify-center w-full" />

          {/* Nút đăng nhập phụ trợ / Fallback (CHỈ cho phép trong môi trường Local Dev Vite) */}
          {import.meta.env.DEV && (!googleClientId || !window.google?.accounts?.id) && (
            <button
              type="button"
              disabled={isSubmitting || isPlayerLoading}
              onClick={handleDevSignIn}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#D5B46B]/60 bg-gradient-to-r from-[#8E2926] via-[#A8322E] to-[#6A1A17] py-3 px-4 font-bold text-[#FAF5EB] shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-60"
            >
              <LogIn size={18} />
              <span>{isSubmitting ? 'Đang kết nối...' : 'Đăng Nhập Thử Nghiệm (Dev Only)'}</span>
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

