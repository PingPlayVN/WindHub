import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import {
  SPRING_OS_SNAPPY,
  modalBackdropVariants,
  DUR,
  EASE_OS_SHEET,
  EASE_OS_IN,
} from '@/design-system/motion';
import WindHubLogo from './WindHubLogo';
import IconButton from './IconButton';
import Tooltip from './Tooltip';
import { PRIMARY_NAV_ITEMS, isNavPathActive } from './navigationConfig';

function NavLinksList({ collapsed = false, onNavigate, layoutId }) {
  const location = useLocation();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2.5 py-3"
    >
      {PRIMARY_NAV_ITEMS.map((item) => {
        const active = isNavPathActive(item.path, location.pathname);
        const Icon = item.icon;

        const linkEl = (
          <Link
            key={item.id}
            to={item.path}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`os-focus-ring group relative flex items-center rounded-[var(--radius-md)] transition-colors duration-[var(--dur-micro)] ${
              collapsed ? 'justify-center size-11 mx-auto' : 'gap-3 px-3.5 py-2.5 w-full'
            } ${
              active
                ? 'text-[var(--os-accent)] font-bold'
                : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] font-medium'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_OS_SNAPPY}
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)] border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] shadow-[var(--os-shadow-xs)]"
              />
            )}

            <span className="relative z-10 flex shrink-0 items-center justify-center">
              <Icon
                size={19}
                className={
                  active
                    ? 'text-[var(--os-accent)]'
                    : item.accent
                    ? 'text-amber-500 group-hover:text-amber-400'
                    : 'text-[var(--os-text-muted)] group-hover:text-[var(--os-text-primary)]'
                }
              />
            </span>

            {!collapsed && (
              <span className="relative z-10 min-w-0 flex-1 truncate text-sm">
                {item.label}
              </span>
            )}

            {!collapsed && active && (
              <span
                aria-hidden="true"
                className="relative z-10 size-1.5 shrink-0 rounded-full bg-[var(--os-accent)]"
              />
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <div key={item.id} className="flex justify-center">
              <Tooltip content={item.label} side="right">
                {linkEl}
              </Tooltip>
            </div>
          );
        }

        return linkEl;
      })}
    </nav>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, closeSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const isSettingsActive = isNavPathActive('/settings', location.pathname);

  return (
    <>
      {/* Desktop OS Dock / Sidebar */}
      <aside
        aria-label="Thanh bên hệ thống"
        className={`os-shell-surface hidden md:flex shrink-0 flex-col overflow-x-hidden border-r transition-[width] duration-[var(--dur-large)] ease-[var(--ease-os-out)] z-[var(--z-nav)] ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-[252px]'
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[var(--os-border-subtle)] ${
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <WindHubLogo collapsed={isSidebarCollapsed} />
          {!isSidebarCollapsed && (
            <Tooltip content="Thu gọn thanh bên" side="bottom">
              <IconButton
                label="Thu gọn thanh bên"
                size="sm"
                variant="ghost"
                onClick={toggleSidebarCollapse}
              >
                <PanelLeftClose size={17} />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <NavLinksList collapsed={isSidebarCollapsed} layoutId="os-desktop-sidebar-pill" />

        {/* Clean Desktop Sidebar Footer: Collapse/Expand Control */}
        <div className="shrink-0 border-t border-[var(--os-border-subtle)] p-2.5">
          {isSidebarCollapsed ? (
            <div className="flex justify-center">
              <Tooltip content="Mở rộng thanh bên" side="right">
                <IconButton
                  label="Mở rộng thanh bên"
                  size="md"
                  variant="ghost"
                  onClick={toggleSidebarCollapse}
                >
                  <PanelLeftOpen size={18} />
                </IconButton>
              </Tooltip>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="os-focus-ring flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] cursor-pointer transition-colors"
            >
              <span>Thu gọn thanh menu</span>
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-over OS Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[var(--z-drawer)] flex md:hidden">
            <motion.button
              type="button"
              aria-label="Đóng menu điều hướng"
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeSidebar}
              className="fixed inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
            />
            <motion.aside
              aria-label="Menu điều hướng di động"
              initial={{ x: '-100%' }}
              animate={{ x: 0, transition: { duration: DUR.large, ease: EASE_OS_SHEET } }}
              exit={{ x: '-100%', transition: { duration: DUR.largeExit, ease: EASE_OS_IN } }}
              className="os-floating-surface relative z-10 flex h-full w-[min(84vw,296px)] flex-col overflow-x-hidden rounded-r-[var(--radius-xl)] border-l-0"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--os-border-subtle)] px-4">
                <WindHubLogo onClick={closeSidebar} />
                <IconButton label="Đóng menu" size="sm" variant="subtle" onClick={closeSidebar}>
                  <X size={17} />
                </IconButton>
              </div>

              <NavLinksList onNavigate={closeSidebar} layoutId="os-mobile-drawer-pill" />

              <div className="shrink-0 border-t border-[var(--os-border-subtle)] p-3">
                <Link
                  to="/settings"
                  onClick={closeSidebar}
                  className={`os-focus-ring flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isSettingsActive
                      ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]'
                      : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)]'
                  }`}
                >
                  <Settings size={17} />
                  <span>Cài đặt & Giao diện</span>
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
