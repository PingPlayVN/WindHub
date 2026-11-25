import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  CircleHelp,
  Coins,
  Download,
  Laptop,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Terminal,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore } from '@/store/useThemeStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import UserAvatar from '@/components/ui/UserAvatar';
import UserProfileModal from '@/components/layout/Header/UserProfileModal';
import { DUR, EASE_OS_IN, EASE_OS_OUT } from '@/design-system/motion';
import IconButton from './IconButton';
import Button from './Button';
import Modal from './Modal';
import { getRouteMetadata } from './navigationConfig';
import { LiquidGlassIcon } from './customIcons';

const ADMIN_SHORTCUTS = [
  ['Chọn tất cả tệp', 'Ctrl + A'],
  ['Sao chép mục chọn', 'Ctrl + C'],
  ['Cắt / Di chuyển', 'Ctrl + X'],
  ['Dán vào thư mục', 'Ctrl + V'],
  ['Đổi tên nhanh', 'F2'],
  ['Mở tìm kiếm toàn cục', 'Ctrl + K'],
  ['Xóa tài nguyên', 'Delete'],
];

export default function TopBar() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 60, right: 16 });

  const avatarTriggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const { themeMode, setThemeMode, liquidGlass, toggleLiquidGlass } = useThemeStore();
  const { toggleSidebar, openLogin, openCommand } = useUIStore();
  const { user, isAdmin, player, betBalance, logout } = useAuthStore();
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();

  const routeMeta = getRouteMetadata(location.pathname);
  const isSignedIn = Boolean(user || player);
  const displayName = player?.displayName || user?.displayName || player?.email || user?.email || 'Khách truy cập';
  const email = player?.email || user?.email || 'Chưa kết nối tài khoản Google';
  const avatarSrc = player?.avatarUrl || user?.photoURL;

  const updateMenuPosition = () => {
    const el = avatarTriggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  const toggleMenu = () => {
    if (!menuOpen) updateMenuPosition();
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (e) => {
      if (
        dropdownRef.current?.contains(e.target) ||
        avatarTriggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
      toast.success('Đã đăng xuất khỏi WindHub');
    } catch {
      toast.error('Không thể đăng xuất lúc này');
    }
  };

  const toggleEruda = () => {
    setMenuOpen(false);
    if (window.eruda) {
      if (window.eruda._isInit) {
        window.eruda.destroy();
        toast.info('Đã tắt Eruda DevTools');
      } else {
        window.eruda.init();
        toast.success('Đã bật Eruda DevTools');
      }
      return;
    }

    if (document.getElementById('eruda-plugin-script')) {
      toast.info('Eruda đang được tải xuống, vui lòng chờ...');
      return;
    }

    const script = document.createElement('script');
    script.id = 'eruda-plugin-script';
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.onload = () => {
      window.eruda.init();
      toast.success('Eruda DevTools đã sẵn sàng!');
    };
    document.head.appendChild(script);
  };

  const handleInstall = async () => {
    if (canInstall) {
      const outcome = await install();
      if (outcome === 'accepted') toast.success('Đã cài đặt ứng dụng WindHub');
      return;
    }
    setShowInstallHelp(true);
  };

  return (
    <>
      <header className="os-shell-surface sticky top-0 z-[var(--z-sticky)] flex h-16 shrink-0 items-center justify-between gap-3 border-b px-3.5 sm:px-5 md:px-6">
        {/* Left: Mobile Drawer Trigger + Context Title */}
        <div className="flex min-w-0 items-center gap-2.5">
          <IconButton
            label="Mở menu điều hướng"
            variant="subtle"
            size="md"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu size={19} />
          </IconButton>

          <div className="min-w-0">
            <h1 className="truncate text-sm sm:text-base font-bold tracking-tight text-[var(--os-text-primary)]">
              {routeMeta.label}
            </h1>
            <p className="hidden lg:block truncate text-[11px] text-[var(--os-text-muted)]">
              {routeMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Global Search + Install + Auth & Avatar Control Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={openCommand}
            aria-label="Tìm kiếm nhanh và bảng lệnh (Ctrl + K)"
            className="os-focus-ring flex h-9.5 items-center gap-2.5 rounded-full border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 text-xs text-[var(--os-text-muted)] hover:border-[var(--os-accent-border)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors sm:w-52 lg:w-64"
          >
            <Search size={15} className="shrink-0 text-[var(--os-accent)]" />
            <span className="hidden sm:inline truncate">Tìm trang, công cụ...</span>
            <kbd className="ml-auto hidden sm:inline-flex rounded-[var(--radius-xs)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-muted)]">
              Ctrl K
            </kbd>
          </button>

          {!isInstalled && (
            <>
              <IconButton
                label="Cài đặt ứng dụng WindHub"
                variant="subtle"
                size="md"
                onClick={handleInstall}
                className="xl:hidden"
              >
                <Download size={16} />
              </IconButton>
              <Button
                variant="subtle"
                size="sm"
                onClick={handleInstall}
                icon={<Download size={14} />}
                title="Cài đặt ứng dụng WindHub"
                className="hidden xl:inline-flex"
              >
                Cài app
              </Button>
            </>
          )}

          {!isSignedIn && (
            <>
              <IconButton
                label="Đăng nhập"
                variant="primary"
                size="md"
                onClick={openLogin}
                className="sm:hidden"
              >
                <LogIn size={16} />
              </IconButton>
              <Button
                variant="primary"
                size="sm"
                onClick={openLogin}
                icon={<LogIn size={15} />}
                className="hidden sm:inline-flex"
              >
                Đăng nhập
              </Button>
            </>
          )}

          {/* Avatar / System Control Dropdown Trigger */}
          <button
            ref={avatarTriggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Mở hồ sơ, giao diện Liquid Glass và cài đặt hệ thống"
            onClick={toggleMenu}
            className={`os-focus-ring flex items-center gap-1.5 rounded-full border py-1 transition cursor-pointer ${
              isSignedIn
                ? isAdmin
                  ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] pl-2.5 pr-2 text-[var(--os-accent)] hover:bg-[var(--os-accent-soft-hover)]'
                  : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] pl-1 pr-2.5 text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)]'
                : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1.5 text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-text-primary)]'
            }`}
          >
            {isSignedIn ? (
              <>
                {isAdmin && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold">
                    <ShieldCheck size={13} />
                    <span>Admin</span>
                  </span>
                )}
                <UserAvatar
                  src={avatarSrc}
                  name={displayName}
                  email={email}
                  size={28}
                  className={isAdmin ? 'border border-[var(--os-accent-border)]' : 'border border-[var(--os-border-default)]'}
                />
                {!isAdmin && (
                  <span className="hidden max-w-28 truncate text-xs font-semibold lg:block">
                    {displayName}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`shrink-0 opacity-70 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </>
            ) : (
              <>
                <SlidersHorizontal size={15} className="text-[var(--os-accent)]" />
                <span className="hidden md:inline text-xs font-semibold">Hệ thống</span>
                <ChevronDown
                  size={13}
                  className={`shrink-0 opacity-70 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Portal Dropdown Menu for Avatar & System Control */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={dropdownRef}
                role="menu"
                aria-label="Menu tài khoản và cài đặt nhanh"
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: DUR.micro, ease: EASE_OS_OUT } }}
                exit={{ opacity: 0, scale: 0.97, y: -4, transition: { duration: DUR.microExit, ease: EASE_OS_IN } }}
                style={{
                  position: 'fixed',
                  top: `${menuPos.top}px`,
                  right: `${menuPos.right}px`,
                }}
                className="os-floating-surface z-[var(--z-dropdown)] w-[min(92vw,312px)] overflow-hidden rounded-[var(--radius-xl)] p-2.5 text-[var(--os-text-primary)]"
              >
                {/* Identity Summary */}
                <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--os-surface-2)]/80 p-3 border border-[var(--os-border-subtle)]">
                  <UserAvatar
                    src={avatarSrc}
                    name={displayName}
                    email={email}
                    size={40}
                    className="rounded-xl border border-[var(--os-border-default)] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-bold text-[var(--os-text-primary)]">
                      {displayName}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[var(--os-text-muted)]">
                      {email}
                    </p>
                    {isSignedIn && (
                      <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--os-warning)]">
                        <Coins size={12} />
                        {(betBalance || 0).toLocaleString()} xu
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Appearance Switcher */}
                <div className="mt-2.5 space-y-2 rounded-[var(--radius-lg)] border border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/50 p-2.5">
                  <div className="os-sunken grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] p-0.5">
                    {[
                      { id: 'light', label: 'Sáng', icon: Sun },
                      { id: 'dark', label: 'Tối', icon: Moon },
                      { id: 'system', label: 'Tự động', icon: Laptop },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = themeMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setThemeMode(m.id)}
                          className={`os-focus-ring inline-flex items-center justify-center gap-1 rounded-[var(--radius-xs)] py-1.5 text-[11px] font-bold cursor-pointer transition-all ${
                            active
                              ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-2xs border border-[var(--os-accent-border)]'
                              : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
                          }`}
                        >
                          <Icon size={12} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Liquid Glass Toggle Row */}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={liquidGlass}
                    onClick={toggleLiquidGlass}
                    className={`os-focus-ring flex w-full items-center justify-between gap-2.5 rounded-[var(--radius-sm)] border px-2.5 py-2 text-left text-xs cursor-pointer transition-colors ${
                      liquidGlass
                        ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                        : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-1)] text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 font-bold">
                      <LiquidGlassIcon size={16} active={liquidGlass} />
                      <span>Liquid Glass</span>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                        liquidGlass
                          ? 'bg-[var(--os-accent)] text-[var(--os-accent-fg)]'
                          : 'bg-[var(--os-surface-3)] text-[var(--os-text-muted)]'
                      }`}
                    >
                      {liquidGlass ? 'BẬT' : 'TẮT'}
                    </span>
                  </button>
                </div>

                {/* Navigation & Account Menu Items */}
                <div className="mt-2 space-y-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="os-focus-ring flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-hover)] cursor-pointer transition-colors"
                  >
                    <User size={15} className="text-[var(--os-accent)]" />
                    <span>Hồ sơ & Trạng thái hệ thống</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="os-focus-ring flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-semibold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-hover)] cursor-pointer transition-colors"
                  >
                    <Settings size={15} className="text-[var(--os-text-muted)]" />
                    <span>Cài đặt hệ thống</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowShortcuts(true);
                        }}
                        className="os-focus-ring flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
                      >
                        <CircleHelp size={15} />
                        <span>Phím tắt quản trị</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={toggleEruda}
                        className="os-focus-ring flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors md:hidden"
                      >
                        <Terminal size={15} />
                        <span>Bật/Tắt Eruda Console</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Auth Action Footer */}
                <div className="mt-2 border-t border-[var(--os-border-subtle)] pt-2">
                  {isSignedIn ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="os-focus-ring flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-xs font-bold text-[var(--os-danger)] hover:bg-[var(--os-danger-soft)] cursor-pointer transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        openLogin();
                      }}
                      className="os-focus-ring flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--os-accent)] px-3 py-2 text-xs font-bold text-[var(--os-accent-fg)] hover:bg-[var(--os-accent-hover)] cursor-pointer transition-colors"
                    >
                      <LogIn size={14} />
                      <span>Đăng nhập Google</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <UserProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onToggleEruda={toggleEruda}
      />

      <Modal
        open={showInstallHelp}
        onClose={() => setShowInstallHelp(false)}
        title="Cài đặt WindHub vào thiết bị"
        subtitle="PWA · OFFLINE READY"
        icon={<Download size={19} />}
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setShowInstallHelp(false)}>
            Đã hiểu
          </Button>
        }
      >
        <p className="text-sm leading-relaxed text-[var(--os-text-secondary)]">
          Trình duyệt hiện tại chưa hiển thị hộp thoại cài tự động. Hãy mở menu trình duyệt và chọn{' '}
          <strong className="text-[var(--os-text-primary)]">Cài đặt ứng dụng</strong> hoặc{' '}
          <strong className="text-[var(--os-text-primary)]">Thêm vào màn hình chính</strong> để mở WindHub như ứng dụng độc lập.
        </p>
      </Modal>

      <Modal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Phím tắt hệ thống & Quản lý tệp"
        subtitle="WINDOS SHORTCUTS"
        icon={<CircleHelp size={19} />}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ADMIN_SHORTCUTS.map(([actionName, keys]) => (
            <div
              key={actionName}
              className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3.5 py-2.5 text-xs sm:text-sm ${
                keys === 'Delete'
                  ? 'border-[var(--os-danger-border)] bg-[var(--os-danger-soft)] text-[var(--os-danger)]'
                  : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-primary)]'
              }`}
            >
              <span className="font-medium">{actionName}</span>
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2 py-0.5 font-mono text-[11px] font-bold">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
