import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ShieldCheck, Coins, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/services/firebase';
import { isAdminEmail } from '@/services/auth';
import { useAuthStore } from '@/store/useAuthStore';
import Modal from '@/components/os/Modal';
import Button from '@/components/os/Button';
import WindHubLogo from '@/components/os/WindHubLogo';

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

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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

  const googleBadge = (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đăng nhập WindHub"
      subtitle="WINDOS IDENTITY"
      size="md"
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-4 text-center">
          <div className="flex justify-center mb-2">
            <WindHubLogo />
          </div>
          <p className="text-xs sm:text-sm text-[var(--os-text-secondary)]">
            Đồng bộ quyền quản trị kho lưu trữ, cấu hình thiết bị và ví xu giải trí chỉ với một chạm.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          loading={isSubmitting}
          loadingLabel="Đang kết nối Google OAuth..."
          onClick={handleGoogleSignIn}
          icon={googleBadge}
          trailingIcon={<ArrowRight size={16} className="text-[var(--os-text-muted)]" />}
          className="w-full justify-between"
        >
          Tiếp tục bằng tài khoản Google
        </Button>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-3">
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
              <ShieldCheck size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[var(--os-text-primary)]">
                Ủy quyền Quản trị tự động
              </h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--os-text-muted)]">
                Email quản trị viên được kích hoạt ngay quyền tạo thư mục, dán liên kết và khóa tệp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-3">
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-success-soft)] text-[var(--os-success)]">
              <Coins size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[var(--os-text-primary)]">
                Đồng bộ Ví Xu & Chuỗi điểm danh
              </h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--os-text-muted)]">
                Bảo toàn số dư xu giải trí và lịch sử điểm danh trên Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-3">
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-info-soft)] text-[var(--os-info)]">
              <Lock size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-[var(--os-text-primary)]">
                Xác thực OAuth 2.0 chuẩn bảo mật
              </h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--os-text-muted)]">
                Không yêu cầu tạo mật khẩu riêng; chỉ đọc tên hiển thị, email và ảnh đại diện cơ bản.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
