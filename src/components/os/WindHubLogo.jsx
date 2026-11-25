import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/useThemeStore';

export default function WindHubLogo({ collapsed = false, onClick, className = '' }) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Trang chủ WindHub"
      className={`os-focus-ring inline-flex items-center gap-2.5 rounded-[var(--radius-md)] select-none ${className}`}
    >
      {collapsed ? (
        theme === 'dark' ? (
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-black shadow-[var(--os-shadow-xs)] transition-transform duration-150 hover:scale-[1.03]">
            <img src="/windhub-192.png" alt="WindHub" className="size-full object-cover" />
          </span>
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-white p-1 shadow-[var(--os-shadow-xs)] transition-transform duration-150 hover:scale-[1.03]">
            <img src="/hamster.png" alt="WindHub" className="size-7 object-contain" />
          </span>
        )
      ) : theme === 'dark' ? (
        <span className="brand-mark inline-flex items-center font-bold text-2xl tracking-tight leading-none">
          <span className="text-white">Wind</span>
          <span className="ml-1 rounded-lg bg-[#ff9900] px-1.5 py-0.5 text-black shadow-xs">hub</span>
        </span>
      ) : (
        <span className="brand-mark inline-flex items-center leading-none">
          <img src="/hamster.png" alt="WindHub" className="mr-1.5 size-8 object-contain" />
          <span className="text-xl font-extrabold tracking-tight uppercase">
            <span className="text-[#E03E3E]">W</span>
            <span className="text-[#1C1F26]">indhub</span>
          </span>
        </span>
      )}
    </Link>
  );
}
