import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Eye, Maximize2, Minimize2, X } from 'lucide-react';
import { modalBackdropVariants } from '@/design-system/motion';
import { IconButton } from '@/components/os';
import PreviewContent from '../Preview/PreviewContent';

function getExternalOpenUrl(url = '') {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/preview(\?.*)?$/, '/view$1');
  }
  return url;
}

function PreviewDialog({
  previewFile,
  onClose,
  viewerEngine,
  setViewerEngine,
}) {
  const dialogRef = useRef(null);
  const enteredDialogFullscreenRef = useRef(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  const isMediaPreview =
    previewFile.type === 'video' ||
    previewFile.type === 'image' ||
    previewFile.type === 'audio';

  const exitNativeFullscreenIfNeeded = useCallback(async () => {
    const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsElement) return;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit errors
    }
  }, []);

  const handleClose = useCallback(() => {
    exitNativeFullscreenIfNeeded();
    try {
      screen.orientation?.unlock?.();
    } catch {
      // Ignore orientation unlock errors
    }
    onClose();
  }, [exitNativeFullscreenIfNeeded, onClose]);

  const toggleImmersive = useCallback(async () => {
    const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (isImmersive || fsElement) {
      enteredDialogFullscreenRef.current = false;
      await exitNativeFullscreenIfNeeded();
      try {
        screen.orientation?.unlock?.();
      } catch {
        // Ignore orientation unlock errors
      }
      setIsImmersive(false);
      return;
    }

    setIsImmersive(true);
    const target = dialogRef.current;
    if (!target) return;

    try {
      const requestFs = target.requestFullscreen || target.webkitRequestFullscreen;
      if (requestFs) {
        await requestFs.call(target);
        enteredDialogFullscreenRef.current = true;
        if (
          previewFile.type === 'video' &&
          window.matchMedia?.('(pointer: coarse)').matches
        ) {
          screen.orientation?.lock?.('landscape')?.catch(() => {});
        }
      }
    } catch {
      // Fallback to CSS full-viewport immersive mode (e.g. iOS Safari)
    }
  }, [exitNativeFullscreenIfNeeded, isImmersive, previewFile.type]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (isImmersive && !(document.fullscreenElement || document.webkitFullscreenElement)) {
        setIsImmersive(false);
        return;
      }
      handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose, isImmersive]);

  useEffect(() => {
    const syncViewportResize = () => {
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), 240);
    };

    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
      const active = Boolean(fsElement);
      setIsNativeFullscreen(active);

      if (
        active &&
        fsElement?.tagName === 'IFRAME' &&
        previewFile.type === 'video' &&
        window.matchMedia?.('(pointer: coarse)').matches
      ) {
        screen.orientation?.lock?.('landscape')?.catch(() => {});
      }

      if (!active && enteredDialogFullscreenRef.current) {
        enteredDialogFullscreenRef.current = false;
        setIsImmersive(false);
        try {
          screen.orientation?.unlock?.();
        } catch {
          // Ignore unlock errors
        }
      }

      syncViewportResize();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('orientationchange', syncViewportResize);
    window.visualViewport?.addEventListener('resize', syncViewportResize);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('orientationchange', syncViewportResize);
      window.visualViewport?.removeEventListener('resize', syncViewportResize);
    };
  }, [previewFile.type]);

  const externalOpenUrl = getExternalOpenUrl(previewFile.url);
  const fullBleed = isImmersive || isNativeFullscreen;

  return (
    <div
      className={`windhub-preview-overlay fixed inset-0 z-[var(--z-modal)] flex items-center justify-center ${
        fullBleed
          ? 'p-0'
          : isMediaPreview
            ? 'windhub-preview-overlay--media p-0 sm:p-5'
            : 'p-2 sm:p-5'
      }`}
    >
      <motion.button
        type="button"
        aria-label="Đóng trình xem trước"
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={handleClose}
        className="absolute inset-0 border-0 cursor-default bg-[var(--os-backdrop)] backdrop-blur-xs"
      />

      {/* IMPORTANT: Keep zero CSS transform and zero backdrop-filter on this dialog ancestor
          so mobile Chromium/WebKit calculates child <iframe> fullscreen & landscape viewports accurately. */}
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={previewFile.name}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={`windhub-preview-stage relative z-10 flex flex-col bg-[var(--os-surface-floating)] text-[var(--os-text-primary)] ${
          fullBleed
            ? 'h-[100dvh] w-screen max-w-none rounded-none border-0 shadow-none overflow-visible'
            : isMediaPreview
              ? 'windhub-preview-dialog--media h-[100dvh] sm:h-[86vh] w-full max-w-5xl sm:rounded-[var(--radius-xl)] sm:border sm:border-[var(--material-floating-border)] shadow-[var(--material-floating-shadow)] overflow-hidden'
              : 'h-[90dvh] sm:h-[86vh] w-full max-w-5xl rounded-[var(--radius-xl)] border border-[var(--material-floating-border)] shadow-[var(--material-floating-shadow)] overflow-hidden'
        }`}
      >
        {isImmersive ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
            <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2 py-0.5 text-white shadow-lg backdrop-blur-md opacity-40 hover:opacity-100 focus-within:opacity-100 active:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={toggleImmersive}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white/90 hover:bg-white/15 transition-colors"
                title="Thu nhỏ chế độ toàn màn hình"
              >
                <Minimize2 size={14} />
                <span>Thu nhỏ</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng trình xem trước"
                className="inline-flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-red-500/25 hover:text-red-300 transition-colors"
                title="Đóng"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <header
            className={`flex shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border-subtle)] px-3.5 sm:px-5 py-2.5 sm:py-3 ${
              isMediaPreview ? 'windhub-preview-header--media' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="windhub-preview-badge flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]">
                <Eye size={16} />
              </span>
              <div className="min-w-0">
                <p className="windhub-preview-kicker font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--os-text-muted)]">
                  Quick Look
                </p>
                <h3 className="truncate text-sm sm:text-base font-bold text-[var(--os-text-primary)]">
                  {previewFile.name}
                </h3>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <IconButton
                label="Chế độ toàn màn hình"
                size="sm"
                variant="subtle"
                onClick={toggleImmersive}
              >
                <Maximize2 size={16} />
              </IconButton>

              {!previewFile.isLocked && externalOpenUrl && (
                <a
                  href={externalOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở bằng ứng dụng ngoài / thẻ mới"
                  aria-label="Mở bằng ứng dụng ngoài hoặc thẻ mới"
                  className="os-focus-ring inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--os-border)] bg-[var(--os-surface-2)] text-[var(--os-text-secondary)] hover:text-[var(--os-accent)] hover:border-[var(--os-accent-border)] transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
              <IconButton
                label="Đóng (Esc)"
                size="sm"
                variant="subtle"
                onClick={handleClose}
              >
                <X size={17} />
              </IconButton>
            </div>
          </header>
        )}

        <div className="dark flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-slate-100">
          <PreviewContent
            previewFile={previewFile}
            viewerEngine={viewerEngine}
            setViewerEngine={setViewerEngine}
            isImmersive={fullBleed}
          />
        </div>
      </motion.section>
    </div>
  );
}

export default function PreviewModal({
  previewFile,
  setPreviewFile,
  viewerEngine,
  setViewerEngine,
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {previewFile && (
        <PreviewDialog
          key={previewFile.id}
          previewFile={previewFile}
          onClose={() => setPreviewFile(null)}
          viewerEngine={viewerEngine}
          setViewerEngine={setViewerEngine}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
