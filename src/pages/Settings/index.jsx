import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Coins,
  Copy,
  Download,
  Laptop,
  LogIn,
  LogOut,
  Palette,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  User,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import UserAvatar from '@/components/ui/UserAvatar';
import { Button, IconButton, SettingsGroup, ThemeSelector } from '@/components/os';
import { pageTransitionVariants } from '@/design-system/motion';

export default function SettingsPage() {
  const { resetAppearance } = useThemeStore();
  const { user, player, isAdmin, betBalance, logout } = useAuthStore();
  const { openLogin } = useUIStore();
  const { canInstall, isInstalled, install } = useInstallPrompt();

  const [p2pName, setP2pName] = useState(
    () => (typeof window !== 'undefined' ? window.localStorage.getItem('windhub-p2p-device-name') || '' : '')
  );
  const [copiedUid, setCopiedUid] = useState(false);

  const displayName = player?.displayName || user?.displayName || 'Khách truy cập';
  const email = player?.email || user?.email || '';
  const photoURL = player?.avatarUrl || user?.photoURL;
  const uid = user?.uid || player?.userId || '';
  const isAuthenticated = Boolean(user || player);

  const handleSaveDeviceName = (e) => {
    e.preventDefault();
    const cleaned = p2pName.trim().slice(0, 32);
    if (!cleaned) {
      toast.warning('Vui lòng nhập tên thiết bị hợp lệ');
      return;
    }
    try {
      window.localStorage.setItem('windhub-p2p-device-name', cleaned);
      setP2pName(cleaned);
      toast.success(`Đã lưu tên thiết bị P2P: ${cleaned}`);
    } catch {
      toast.error('Không thể lưu vào bộ nhớ trình duyệt');
    }
  };

  const handleCopyUid = () => {
    if (!uid) return;
    navigator.clipboard?.writeText(uid);
    setCopiedUid(true);
    toast.success('Đã sao chép UID');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleResetAppearance = () => {
    resetAppearance();
    toast.success('Đã khôi phục giao diện Modern OS mặc định');
  };

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-4xl space-y-6 pb-8"
    >
      {/* OS Settings Hero Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--os-accent)]">
            WINDOS // SYSTEM PREFERENCES
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
            Cài đặt hệ thống
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--os-text-muted)]">
            Cá nhân hóa giao diện, hiệu ứng kính quang học Liquid Glass, tài khoản và định danh thiết bị.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw size={14} />}
          onClick={handleResetAppearance}
        >
          Đặt lại giao diện mặc định
        </Button>
      </header>

      {/* 1. APPEARANCE ENGINE */}
      <SettingsGroup
        title="Giao diện & Vật liệu hiển thị"
        description="Áp dụng đồng bộ tức thì trên mọi trang và tự động ghi nhớ trên thiết bị của bạn."
        icon={<Palette size={18} />}
        badge="WindOS 2.0"
      >
        <div className="p-5">
          <ThemeSelector />
        </div>
      </SettingsGroup>

      {/* 2. ACCOUNT & WALLET */}
      <SettingsGroup
        title="Tài khoản & Đồng bộ đám mây"
        description="Kết nối Google OAuth 2.0 để xác thực quyền quản trị viên và bảo toàn ví giải trí."
        icon={<User size={18} />}
      >
        {isAuthenticated ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <UserAvatar
                  src={photoURL}
                  name={displayName}
                  email={email}
                  size={52}
                  className="rounded-2xl border border-[var(--os-border-default)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold text-[var(--os-text-primary)]">
                      {displayName}
                    </p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--os-accent)]">
                        <ShieldCheck size={12} /> Quản trị viên
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-[var(--os-text-muted)]">{email}</p>
                </div>
              </div>

              <Button
                variant="dangerSoft"
                size="sm"
                icon={<LogOut size={15} />}
                onClick={async () => {
                  await logout();
                  toast.success('Đã đăng xuất khỏi hệ thống');
                }}
              >
                Đăng xuất
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-[var(--os-surface-2)]/40">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Coins size={18} className="text-[var(--os-warning)] shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                      Ví xu giải trí
                    </span>
                    <strong className="font-mono text-sm font-bold tabular-nums text-[var(--os-text-primary)]">
                      {(betBalance || 0).toLocaleString()} xu
                    </strong>
                  </div>
                </div>
              </div>

              {uid && (
                <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-4 py-3">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                      Mã định danh UID
                    </span>
                    <p className="truncate font-mono text-xs text-[var(--os-text-secondary)]">{uid}</p>
                  </div>
                  <IconButton label="Sao chép UID" size="sm" variant="subtle" onClick={handleCopyUid}>
                    {copiedUid ? <Check size={14} className="text-[var(--os-success)]" /> : <Copy size={14} />}
                  </IconButton>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-bold text-[var(--os-text-primary)]">
                Bạn chưa đăng nhập tài khoản
              </p>
              <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
                Đăng nhập Google để mở khóa các tính năng đồng bộ ví xu và quản trị tệp tin.
              </p>
            </div>
            <Button variant="primary" size="md" icon={<LogIn size={16} />} onClick={openLogin}>
              Đăng nhập Google
            </Button>
          </div>
        )}
      </SettingsGroup>

      {/* 3. DEVICE, P2P & PWA */}
      <SettingsGroup
        title="Thiết bị, P2P Share & Ứng dụng PWA"
        description="Cấu hình tên hiển thị khi ghép nối WebRTC trực tiếp và trạng thái cài đặt ngoại tuyến."
        icon={<Smartphone size={18} />}
      >
        <form onSubmit={handleSaveDeviceName} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-5">
          <div className="flex-1">
            <label
              htmlFor="settings-p2p-device-name"
              className="block text-xs font-bold text-[var(--os-text-primary)] mb-1.5"
            >
              Tên thiết bị hiển thị trong mạng P2P Share
            </label>
            <input
              id="settings-p2p-device-name"
              type="text"
              maxLength={32}
              value={p2pName}
              onChange={(e) => setP2pName(e.target.value)}
              placeholder="Ví dụ: Laptop Phong, iPhone 16 Pro..."
              className="os-focus-ring h-10.5 w-full rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3.5 text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)] focus:bg-[var(--os-surface-1)]"
            />
          </div>
          <Button type="submit" variant="secondary" size="md" icon={<Laptop size={15} />}>
            Lưu tên thiết bị
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-success-soft)] text-[var(--os-success)]">
              <Wifi size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--os-text-primary)]">
                Ứng dụng Web tiến bộ (PWA)
              </p>
              <p className="text-xs text-[var(--os-text-muted)]">
                {isInstalled
                  ? 'WindHub đã được cài đặt độc lập trên thiết bị này.'
                  : 'Cài đặt WindHub lên màn hình chính để mở toàn màn hình tốc độ cao.'}
              </p>
            </div>
          </div>

          {!isInstalled && canInstall && (
            <Button
              variant="subtle"
              size="sm"
              icon={<Download size={15} />}
              onClick={async () => {
                const outcome = await install();
                if (outcome === 'accepted') toast.success('Đã cài đặt WindHub!');
              }}
            >
              Cài đặt ngay
            </Button>
          )}
        </div>
      </SettingsGroup>
    </motion.div>
  );
}
