import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  Crosshair,
  Dices,
  Globe2,
  Languages,
  LogIn,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DUR, EASE_OS_IN, EASE_OS_OUT, modalBackdropVariants } from '@/design-system/motion';
import { PRIMARY_NAV_ITEMS, SYSTEM_ROUTES } from './navigationConfig';
import { LiquidGlassIcon } from './customIcons';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { isCommandOpen, closeCommand, openCommand, openLogin } = useUIStore();
  const { theme, toggleTheme, liquidGlass, toggleLiquidGlass } = useThemeStore();
  const { user, player } = useAuthStore();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleGlobalShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCommandOpen) closeCommand();
        else openCommand();
      } else if (e.key === 'Escape' && isCommandOpen) {
        closeCommand();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, [isCommandOpen, closeCommand, openCommand]);

  const commands = useMemo(() => {
    const navItems = [...PRIMARY_NAV_ITEMS, ...SYSTEM_ROUTES].map((item) => ({
      id: `nav-${item.id}`,
      group: 'Điều hướng không gian',
      label: item.label,
      subtitle: item.subtitle,
      icon: item.icon,
      keywords: `${item.label} ${item.subtitle} ${item.path}`,
      action: () => navigate(item.path),
    }));

    const quickTools = [
      {
        id: 'tool-casio',
        group: 'Công cụ & Tiện ích nhanh',
        label: 'Casio fx-580VN X Spell',
        subtitle: 'Viết chữ & tràn bộ nhớ Basic Overflow trên ClassWiz',
        icon: Calculator,
        keywords: 'casio 580 spell may tinh hex snake',
        action: () => navigate('/tools?toolId=Casio580Spell'),
      },
      {
        id: 'tool-ascii',
        group: 'Công cụ & Tiện ích nhanh',
        label: 'Image → ASCII Studio',
        subtitle: 'Chuyển ảnh sang nghệ thuật ký tự ASCII, Braille & Dither',
        icon: Sparkles,
        keywords: 'image ascii art braille dither anh',
        action: () => navigate('/tools?toolId=ImageArtStudio'),
      },
      {
        id: 'tool-vocab',
        group: 'Công cụ & Tiện ích nhanh',
        label: 'Vocabulary Practice',
        subtitle: 'Tạo bảng từ vựng và luyện dò bài thông minh',
        icon: Languages,
        keywords: 'vocabulary tu vung tieng anh practice',
        action: () => navigate('/tools?toolId=VocabularyPractice'),
      },
      {
        id: 'ext-osint',
        group: 'Công cụ & Tiện ích nhanh',
        label: 'Tiện ích Anime Trace & FB Analyzer',
        subtitle: 'Mở kho tiện ích tra cứu khung hình anime và phân tích URL',
        icon: Globe2,
        keywords: 'anime trace facebook analyzer osint extension',
        action: () => navigate('/extensions'),
      },
      {
        id: 'game-windtank',
        group: 'Giải trí & Trò chơi',
        label: 'WindTank Trouble (Chơi Offline)',
        subtitle: 'Đại chiến xe tăng mê cung 2–4 người, đấu AI không cần mạng',
        icon: Crosshair,
        keywords: 'windtank tank trouble xe tang game tro choi offline giai tri',
        action: () => navigate('/entertainment/windtank'),
      },
      {
        id: 'game-taixiu',
        group: 'Giải trí & Trò chơi',
        label: 'Tài Xỉu Dân Gian (Sòng bạc dân gian)',
        subtitle: 'Sòng xúc xắc trực tuyến đồng bộ nhiều người chơi (cần mạng)',
        icon: Dices,
        keywords: 'tai xiu bau cua song bac dan gian giai tri',
        action: () => navigate('/entertainment/tai-xiu'),
      },
    ];

    const systemActions = [
      {
        id: 'sys-glass',
        group: 'Giao diện & Hệ thống',
        label: liquidGlass ? 'Tắt chế độ Liquid Glass (Về Modern OS)' : 'Bật chế độ Liquid Glass',
        subtitle: 'Chuyển đổi vật liệu kính quang học xuyên thấu toàn ứng dụng',
        icon: LiquidGlassIcon,
        keywords: 'liquid glass kinh trong suot modern os appearance',
        action: () => toggleLiquidGlass(),
      },
      {
        id: 'sys-theme',
        group: 'Giao diện & Hệ thống',
        label: theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)',
        subtitle: 'Thay đổi bảng màu nền toàn cục ngay lập tức',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: 'dark light theme sang toi giao dien',
        action: () => toggleTheme(),
      },
      user || player
        ? {
            id: 'sys-account',
            group: 'Giao diện & Hệ thống',
            label: 'Quản lý Tài khoản & Cài đặt WindOS',
            subtitle: player?.email || user?.email || 'Hồ sơ người dùng',
            icon: User,
            keywords: 'account profile tai khoan cai dat settings',
            action: () => navigate('/settings'),
          }
        : {
            id: 'sys-login',
            group: 'Giao diện & Hệ thống',
            label: 'Đăng nhập bằng Google',
            subtitle: 'Đồng bộ quyền quản trị và ví giải trí',
            icon: LogIn,
            keywords: 'login google dang nhap auth',
            action: () => openLogin(),
          },
    ];

    return [...navItems, ...quickTools, ...systemActions];
  }, [liquidGlass, navigate, openLogin, player, theme, toggleLiquidGlass, toggleTheme, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const safeActiveIndex = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;

  const runItem = (item) => {
    if (!item) return;
    closeCommand();
    setQuery('');
    item.action();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isCommandOpen && (
        <div className="fixed inset-0 z-[var(--z-command)] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
          <motion.button
            type="button"
            aria-label="Đóng bảng tìm kiếm nhanh"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => {
              closeCommand();
              setQuery('');
            }}
            className="fixed inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm và điều khiển nhanh WindHub"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: DUR.ui, ease: EASE_OS_OUT } }}
            exit={{ opacity: 0, scale: 0.97, y: -6, transition: { duration: DUR.uiExit, ease: EASE_OS_IN } }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
              } else if (e.key === 'Enter' && filtered[safeActiveIndex]) {
                e.preventDefault();
                runItem(filtered[safeActiveIndex]);
              }
            }}
            className="os-floating-surface relative z-10 flex max-h-[72vh] w-full max-w-xl flex-col overflow-hidden rounded-[var(--radius-xl)] text-[var(--os-text-primary)]"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 border-b border-[var(--os-border-subtle)] px-4 py-3.5">
              <Search size={18} className="shrink-0 text-[var(--os-accent)]" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Tìm trang, công cụ, chế độ Liquid Glass..."
                aria-label="Nhập lệnh hoặc từ khóa tìm kiếm"
                className="min-w-0 flex-1 bg-transparent text-sm sm:text-base text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:outline-none"
              />
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--os-text-muted)]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-[var(--os-text-muted)]">
                  Không tìm thấy lệnh hoặc công cụ phù hợp với &ldquo;{query}&rdquo;.
                </div>
              ) : (
                <ul role="listbox" className="space-y-1">
                  {filtered.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === safeActiveIndex;
                    const prevGroup = idx > 0 ? filtered[idx - 1].group : null;
                    return (
                      <li key={item.id}>
                        {item.group !== prevGroup && (
                          <div className="px-3 pt-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
                            {item.group}
                          </div>
                        )}
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => runItem(item)}
                          className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--os-accent-soft)] text-[var(--os-text-primary)]'
                              : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]'
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border ${
                                isSelected
                                  ? 'border-[var(--os-accent-border)] bg-[var(--os-surface-1)] text-[var(--os-accent)]'
                                  : 'border-[var(--os-border-subtle)] bg-[var(--os-surface-2)] text-[var(--os-text-muted)]'
                              }`}
                            >
                              <Icon size={17} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs sm:text-sm font-semibold text-[var(--os-text-primary)]">
                                {item.label}
                              </span>
                              <span className="block truncate text-[11px] text-[var(--os-text-muted)]">
                                {item.subtitle}
                              </span>
                            </span>
                          </span>
                          <ArrowRight
                            size={15}
                            className={`shrink-0 transition-transform ${
                              isSelected ? 'translate-x-0.5 text-[var(--os-accent)]' : 'opacity-30'
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="hidden sm:flex items-center justify-between border-t border-[var(--os-border-subtle)] bg-[var(--os-surface-2)]/60 px-4 py-2 text-[11px] text-[var(--os-text-muted)]">
              <span>Dùng phím ↑↓ để di chuyển, Enter để mở</span>
              <span className="font-mono">WindOS Spotlight</span>
            </footer>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
