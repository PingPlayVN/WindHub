import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  CircleHelp,
  Coins,
  Copy,
  Laptop,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import UserAvatar from '@/components/ui/UserAvatar';
import Modal from '@/components/os/Modal';
import Button from '@/components/os/Button';
import IconButton from '@/components/os/IconButton';
import { LiquidGlassIcon } from '@/components/os/customIcons';

export default function UserProfileModal({ open, onClose, onOpenShortcuts, onToggleEruda }) {
  const navigate = useNavigate();
  const { user, player, isAdmin, betBalance, logout } = useAuthStore();
  const {
    themeMode,
    setThemeMode,
    liquidGlass,
    toggleLiquidGlass,
    motionLevel,
    setMotionLevel,
  } = useThemeStore();
  const [copiedUid, setCopiedUid] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSignedIn = Boolean(user || player);
  const displayName = player?.displayName || user?.displayName || 'Khách truy cập';
  const email = player?.email || user?.email || 'Chưa đăng nhập tài khoản đám mây';
  const photoURL = player?.avatarUrl || user?.photoURL;
  const uid = user?.uid || player?.userId || '';

  const handleCopyUid = () => {
    if (!uid) return;
    navigator.clipboard?.writeText(uid);
    setCopiedUid(true);
    toast.success('Đã sao chép mã định danh (UID)');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Đã đăng xuất tài khoản thành công');
      onClose();
    } catch {
      toast.error('Không thể đăng xuất lúc này');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hồ sơ & Trạng thái hệ thống"
      subtitle="WINDOS CONTROL CENTER"
      size="md"
    >
      <div className="space-y-4">
        {/* Identity Header Card */}
        <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] p-4">
          <UserAvatar
            src={photoURL}
            name={displayName}
            email={email}
            size={54}
            className="rounded-2xl border-2 border-[var(--os-accent-border)] shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-[var(--os-text-primary)]">
                {displayName}
              </h3>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--os-accent)]">
                  <ShieldCheck size={12} /> Admin
                </span>
              ) : isSignedIn ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-success-border)] bg-[var(--os-success-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--os-success)]">
                  <User size={12} /> Thành viên
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--os-text-muted)]">
                  Chế độ Khách
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--os-text-muted)]">{email}</p>
          </div>
        </div>

        {/* Wallet & UID when signed in */}
        {isSignedIn && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--os-surface-1)] text-[var(--os-warning)] shadow-xs">
                <Coins size={16} />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                  Ví Giải Trí
                </span>
                <span className="font-mono text-sm font-extrabold tabular-nums text-[var(--os-text-primary)]">
                  {(betBalance || 0).toLocaleString()} <span className="text-[11px] font-medium text-[var(--os-text-muted)]">xu</span>
                </span>
              </div>
            </div>

            {uid && (
              <div className="os-sunken flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
                    Mã định danh
                  </span>
                  <span className="block truncate font-mono text-xs text-[var(--os-text-secondary)]">
                    {uid}
                  </span>
                </div>
                <IconButton label="Sao chép UID" size="sm" variant="ghost" onClick={handleCopyUid}>
                  {copiedUid ? <Check size={14} className="text-[var(--os-success)]" /> : <Copy size={14} />}
                </IconButton>
              </div>
            )}
          </div>
        )}

        {/* System Appearance & Liquid Glass Control Block */}
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)]/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
              Giao diện & Vật liệu hiển thị
            </span>
            <span className="font-mono text-[10px] font-semibold text-[var(--os-accent)]">
              {liquidGlass ? 'Liquid Glass' : 'Modern OS'}
            </span>
          </div>

          {/* 3-Mode Theme Segmented Bar */}
          <div className="os-sunken grid grid-cols-3 gap-1 rounded-[var(--radius-md)] p-1">
            {[
              { id: 'light', label: 'Sáng', icon: Sun },
              { id: 'dark', label: 'Tối', icon: Moon },
              { id: 'system', label: 'Hệ thống', icon: Laptop },
            ].map((m) => {
              const Icon = m.icon;
              const active = themeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setThemeMode(m.id)}
                  className={`os-focus-ring inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] py-2 text-xs font-bold cursor-pointer transition-all ${
                    active
                      ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-[var(--os-shadow-xs)] border border-[var(--os-accent-border)]'
                      : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Liquid Glass Switch Row */}
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border ${
                  liquidGlass
                    ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                    : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)]'
                }`}
              >
                <LiquidGlassIcon size={17} active={liquidGlass} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--os-text-primary)]">Hiệu ứng Liquid Glass</p>
                <p className="truncate text-[11px] text-[var(--os-text-muted)]">
                  Bề mặt kính quang học đa lớp & khúc xạ nền
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={liquidGlass}
              aria-label="Bật hoặc tắt Liquid Glass"
              onClick={toggleLiquidGlass}
              className={`os-focus-ring relative inline-flex h-6.5 w-11.5 shrink-0 items-center rounded-full border cursor-pointer transition-colors ${
                liquidGlass
                  ? 'border-[var(--os-accent)] bg-[var(--os-accent)]'
                  : 'border-[var(--os-border-strong)] bg-[var(--os-surface-3)]'
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                  liquidGlass ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Compact Motion Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--os-text-secondary)]">
              <Zap size={13} className="text-[var(--os-accent)]" />
              <span>Chuyển động</span>
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'full', label: 'Đầy đủ' },
                { id: 'subtle', label: 'Tinh giản' },
                { id: 'reduced', label: 'Tối giản' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMotionLevel(m.id)}
                  className={`os-focus-ring rounded-[var(--radius-xs)] px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                    motionLevel === m.id
                      ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]'
                      : 'text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full System Settings Page Navigation & Admin Tools */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/settings');
            }}
            className="os-focus-ring flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3.5 py-2.5 text-left text-xs font-bold text-[var(--os-text-primary)] hover:border-[var(--os-accent-border)] hover:bg-[var(--os-surface-hover)] cursor-pointer transition-colors"
          >
            <span className="inline-flex items-center gap-2.5">
              <Settings size={16} className="text-[var(--os-accent)]" />
              <span>Cài đặt hệ thống chi tiết</span>
            </span>
            <ChevronRight size={15} className="text-[var(--os-text-muted)]" />
          </button>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onOpenShortcuts && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<CircleHelp size={15} />}
                  onClick={() => {
                    onClose();
                    onOpenShortcuts();
                  }}
                >
                  Phím tắt quản trị
                </Button>
              )}
              {onToggleEruda && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Terminal size={15} />}
                  onClick={() => {
                    onClose();
                    onToggleEruda();
                  }}
                >
                  Bật/Tắt Eruda Console
                </Button>
              )}
            </div>
          )}
        </div>

        {isSignedIn && (
          <div className="border-t border-[var(--os-border-subtle)] pt-3">
            <Button
              variant="dangerSoft"
              size="md"
              loading={isLoggingOut}
              onClick={handleLogout}
              icon={<LogOut size={16} />}
              className="w-full"
            >
              Đăng xuất tài khoản
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
