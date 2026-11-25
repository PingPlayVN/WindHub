import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SPRING_OS_SNAPPY } from '@/design-system/motion';
import { PRIMARY_NAV_ITEMS, isNavPathActive } from './navigationConfig';

const DOCK_ITEMS = PRIMARY_NAV_ITEMS.filter((item) => item.mobileDock);

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      aria-label="Thanh điều hướng nhanh di động"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-nav)] flex justify-center px-3 pb-[calc(0.5rem+var(--safe-bottom))] md:hidden"
    >
      <div className="os-floating-surface pointer-events-auto flex w-full max-w-md items-center justify-around rounded-[var(--radius-2xl)] px-1.5 py-1.5">
        {DOCK_ITEMS.map((item) => {
          const active = isNavPathActive(item.path, location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={`os-focus-ring relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-lg)] py-1.5 px-1 text-[10px] font-semibold transition-colors ${
                active
                  ? 'text-[var(--os-accent)] font-bold'
                  : 'text-[var(--os-text-muted)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="os-bottom-dock-pill"
                  transition={SPRING_OS_SNAPPY}
                  className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] bg-[var(--os-accent-soft)] border border-[var(--os-accent-border)]"
                />
              )}
              <Icon size={19} className="relative z-10 shrink-0" />
              <span className="relative z-10 max-w-full truncate leading-tight">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
