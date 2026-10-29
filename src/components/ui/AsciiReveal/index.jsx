import {
  AsciiReveal,
  AsciiSkeleton,
  animateSkeleton,
  animateSkeletons,
  asciiSkeletonHTML,
  createAsciiReveal,
  imageMascot,
  mascots,
  presets,
  resolvePreset,
  useAsciiReveal,
} from './ascii-reveal.js';

export {
  AsciiReveal,
  AsciiSkeleton,
  animateSkeleton,
  animateSkeletons,
  asciiSkeletonHTML,
  createAsciiReveal,
  imageMascot,
  mascots,
  presets,
  resolvePreset,
  useAsciiReveal,
};

/**
 * FileCardSkeleton - ASCII Skeleton for Grid View in FileManager
 */
export function FileCardSkeleton({ variant = 'dither', seed = 1 }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-slate-100/50 p-3 shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* ASCII Thumbnail Block */}
      <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-200/50 dark:bg-zinc-800/50">
        <AsciiSkeleton
          variant={variant}
          rows={6}
          seed={seed}
          className="h-full w-full object-cover font-mono text-[10px] leading-none"
        />
      </div>

      {/* ASCII File Info */}
      <div className="space-y-1.5 px-0.5">
        <AsciiSkeleton
          variant={variant}
          lines={1}
          seed={seed + 2}
          widths={['70%']}
          className="font-mono text-xs font-medium"
        />
        <div className="flex items-center justify-between pt-0.5">
          <AsciiSkeleton
            variant={variant}
            lines={1}
            seed={seed + 4}
            widths={['45%']}
            className="font-mono text-[11px] opacity-65"
          />
          <AsciiSkeleton
            variant={variant}
            lines={1}
            seed={seed + 6}
            widths={['25%']}
            className="font-mono text-[11px] opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * FileRowSkeleton - ASCII Skeleton for List View in FileManager
 */
export function FileRowSkeleton({ variant = 'dither', seed = 1 }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-100/40 px-4 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
      {/* Small ASCII block avatar/icon */}
      <AsciiSkeleton
        variant={variant}
        rows={2}
        seed={seed}
        width={36}
        height={36}
        className="shrink-0 rounded-lg font-mono text-[10px] leading-none"
      />
      
      {/* Name and size lines */}
      <div className="min-w-0 flex-1 space-y-1">
        <AsciiSkeleton
          variant={variant}
          lines={1}
          seed={seed + 1}
          widths={['40%']}
          className="font-mono text-xs font-medium"
        />
        <AsciiSkeleton
          variant={variant}
          lines={1}
          seed={seed + 2}
          widths={['22%']}
          className="font-mono text-[10px] opacity-60"
        />
      </div>

      {/* Timestamp / Action placeholder */}
      <AsciiSkeleton
        variant={variant}
        lines={1}
        seed={seed + 3}
        widths={['64px']}
        className="hidden font-mono text-xs opacity-50 sm:block"
      />
    </div>
  );
}

/**
 * StatCardSkeleton - ASCII Skeleton for Home Dashboard Stats
 */
export function StatCardSkeleton({ variant = 'dither', seed = 1 }) {
  return (
    <div className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/60">
      <div className="mb-4">
        <AsciiSkeleton
          variant={variant}
          rows={3}
          seed={seed}
          width={48}
          height={48}
          circle
          className="font-mono text-[10px]"
        />
      </div>
      <div className="space-y-2">
        <AsciiSkeleton
          variant={variant}
          lines={1}
          seed={seed + 1}
          widths={['55%']}
          className="font-mono text-2xl font-black"
        />
        <AsciiSkeleton
          variant={variant}
          lines={1}
          seed={seed + 2}
          widths={['75%']}
          className="font-mono text-xs font-semibold opacity-75"
        />
      </div>
    </div>
  );
}

/**
 * OfflineAsciiSkeleton - ASCII Terminal/Scan style placeholder for OfflineGate
 */
export function OfflineAsciiSkeleton({ variant = 'terminal' }) {
  return (
    <div aria-hidden="true" className="w-full space-y-5 py-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="space-y-2">
          <AsciiSkeleton variant={variant} lines={1} widths={['110px']} seed={11} className="text-xs" />
          <AsciiSkeleton variant={variant} lines={1} widths={['180px']} seed={13} className="text-base" />
        </div>
        <AsciiSkeleton variant={variant} rows={2} width={90} height={34} seed={15} className="rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-3 rounded-xl border border-slate-800/80 bg-[#101319]/90 p-4">
            <AsciiSkeleton variant={variant} lines={1} widths={['40%']} seed={item * 20 + 2} className="text-xs" />
            <AsciiSkeleton variant={variant} lines={1} widths={['75%']} seed={item * 20 + 5} className="text-xs" />
            <AsciiSkeleton
              variant={variant}
              rows={4}
              height={96}
              seed={item * 20 + 8}
              className="w-full rounded-lg text-[10px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
