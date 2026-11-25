import { Check, Laptop, Moon, Sun, Zap } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { LiquidGlassIcon } from './customIcons';

const THEME_MODES = [
  {
    id: 'light',
    label: 'Sáng (Light)',
    desc: 'Nền gốm sáng thanh lịch, tương phản cao',
    icon: Sun,
    previewBg: 'bg-[#f3f5f8]',
    previewCard: 'bg-white border-slate-200/80',
    previewAccent: 'bg-[#ea580c]',
  },
  {
    id: 'dark',
    label: 'Tối (Dark)',
    desc: 'Carbon Obsidian sâu, dịu mắt ban đêm',
    icon: Moon,
    previewBg: 'bg-[#090b0f]',
    previewCard: 'bg-[#151923] border-white/10',
    previewAccent: 'bg-[#f97316]',
  },
  {
    id: 'system',
    label: 'Theo hệ thống',
    desc: 'Tự động đồng bộ theo cài đặt thiết bị',
    icon: Laptop,
    previewBg: 'bg-gradient-to-r from-[#f3f5f8] via-[#f3f5f8] to-[#090b0f]',
    previewCard: 'bg-gradient-to-r from-white to-[#151923] border-slate-400/30',
    previewAccent: 'bg-[#f97316]',
  },
];

const MOTION_LEVELS = [
  { id: 'full', label: 'Đầy đủ', desc: 'Chuyển cảnh OS mượt mà & đàn hồi' },
  { id: 'subtle', label: 'Tinh giản', desc: 'Nhanh gọn, tiết kiệm chuyển động' },
  { id: 'reduced', label: 'Giảm chuyển động', desc: 'Tắt dịch chuyển, chỉ làm mờ nhẹ' },
];

export default function ThemeSelector({ compact = false }) {
  const {
    themeMode,
    liquidGlass,
    motionLevel,
    setThemeMode,
    setLiquidGlass,
    setMotionLevel,
  } = useThemeStore();

  return (
    <div className="space-y-5">
      {/* 1. Theme Mode Visual Cards */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
            Chế độ màu sắc
          </span>
          <span className="font-mono text-[11px] text-[var(--os-accent)] font-semibold">
            {themeMode === 'system' ? 'Tự động OS' : themeMode === 'light' ? 'Light OS' : 'Dark OS'}
          </span>
        </div>

        <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {THEME_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = themeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setThemeMode(mode.id)}
                className={`os-focus-ring group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border p-3 text-left cursor-pointer transition-all ${
                  active
                    ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] shadow-[var(--os-shadow-xs)]'
                    : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] hover:border-[var(--os-border-strong)]'
                }`}
              >
                {!compact && (
                  <div className={`mb-3 h-16 w-full rounded-[var(--radius-sm)] p-2 border border-black/5 dark:border-white/5 ${mode.previewBg}`}>
                    <div className={`flex h-full flex-col justify-between rounded-lg border p-2 ${mode.previewCard}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-6 rounded-full ${mode.previewAccent}`} />
                        <span className="h-1.5 w-10 rounded-full bg-current opacity-20" />
                      </div>
                      <div className="flex gap-1.5">
                        <span className="h-2.5 flex-1 rounded bg-current opacity-10" />
                        <span className="h-2.5 flex-1 rounded bg-current opacity-10" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--os-text-primary)]">
                    <Icon size={15} className={active ? 'text-[var(--os-accent)]' : 'text-[var(--os-text-muted)]'} />
                    <span>{mode.label}</span>
                  </span>
                  {active && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--os-accent)] text-[var(--os-accent-fg)]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {!compact && (
                  <p className="mt-1 text-[11px] leading-snug text-[var(--os-text-muted)]">
                    {mode.desc}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Liquid Glass Appearance Engine Toggle */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] p-4">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors ${
                liquidGlass
                  ? 'border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                  : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-secondary)]'
              }`}
            >
              <LiquidGlassIcon size={20} active={liquidGlass} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--os-text-primary)]">
                  Chế độ vật liệu Liquid Glass
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    liquidGlass
                      ? 'bg-[var(--os-accent)] text-[var(--os-accent-fg)]'
                      : 'bg-[var(--os-surface-3)] text-[var(--os-text-muted)]'
                  }`}
                >
                  {liquidGlass ? 'ĐANG BẬT' : 'TẮT · MODERN OS'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--os-text-muted)]">
                Kích hoạt bề mặt kính quang học đa lớp, viền phản xạ ánh sáng và chiều sâu khúc xạ nền trên cả giao diện Sáng và Tối. Mặc định sử dụng giao diện Modern OS tiêu chuẩn.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={liquidGlass}
            aria-label="Bật hoặc tắt giao diện Liquid Glass"
            onClick={() => setLiquidGlass(!liquidGlass)}
            className={`os-focus-ring relative inline-flex h-7 w-12.5 shrink-0 items-center rounded-full border cursor-pointer transition-colors duration-[var(--dur-ui)] ${
              liquidGlass
                ? 'border-[var(--os-accent)] bg-[var(--os-accent)]'
                : 'border-[var(--os-border-strong)] bg-[var(--os-surface-3)]'
            }`}
          >
            <span
              className={`inline-block size-5.5 rounded-full bg-white shadow-md transition-transform duration-[var(--dur-ui)] ease-[var(--ease-os-spring)] ${
                liquidGlass ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Motion Intensity Control */}
      {!compact && (
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <Zap size={14} className="text-[var(--os-accent)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--os-text-muted)]">
              Cường độ chuyển động (Motion)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {MOTION_LEVELS.map((item) => {
              const active = motionLevel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMotionLevel(item.id)}
                  className={`os-focus-ring rounded-[var(--radius-md)] border p-3 text-left cursor-pointer transition-colors ${
                    active
                      ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)]'
                      : 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] hover:border-[var(--os-border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--os-text-primary)]">{item.label}</span>
                    {active && <Check size={14} className="text-[var(--os-accent)]" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--os-text-muted)]">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
