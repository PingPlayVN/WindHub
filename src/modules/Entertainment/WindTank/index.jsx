import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react';
import {
  WINDTANK_ENTRY_PATH,
  hasWindTankOfflineCache,
  syncWindTankOfflineCache,
} from './windtankOfflineSync';

const BRIDGE_ID = 'windhub-exit-bridge';
const BRIDGE_STYLE_ID = 'windhub-exit-bridge-style';

const BRIDGE_CSS = `
#${BRIDGE_ID} {
  position: absolute;
  top: max(10px, env(safe-area-inset-top, 0px));
  left: max(12px, env(safe-area-inset-left, 0px));
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  transition: top 160ms ease, left 160ms ease, opacity 160ms ease, transform 140ms ease;
}
#${BRIDGE_ID}[data-combat="true"][data-confirm="false"] {
  top: max(6px, env(safe-area-inset-top, 0px));
  left: max(8px, env(safe-area-inset-left, 0px));
  opacity: 0.88;
}
#${BRIDGE_ID}[data-combat="true"][data-confirm="false"]:hover {
  opacity: 1;
}
#${BRIDGE_ID} .wh-exit-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 11px;
  border-radius: 9px;
  border: 2px solid #18191B;
  background: #FFFFFF;
  color: #18191B;
  box-shadow: 0 3px 0 #18191B, 0 6px 14px rgba(0, 0, 0, 0.16);
  font-size: 12.5px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  transition: transform 90ms ease, background-color 120ms ease, box-shadow 90ms ease;
}
#${BRIDGE_ID}[data-combat="true"][data-confirm="false"] .wh-exit-btn {
  min-height: 27px;
  padding: 0 9px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.96);
}
#${BRIDGE_ID} .wh-exit-btn:hover {
  background: #FFF8E1;
}
#${BRIDGE_ID} .wh-exit-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #18191B;
}
#${BRIDGE_ID} .wh-exit-btn:focus-visible {
  outline: 2.5px solid #1565C0;
  outline-offset: 2px;
}
#${BRIDGE_ID} .wh-exit-confirm {
  background: #E53935;
  color: #FFFFFF;
}
#${BRIDGE_ID} .wh-exit-confirm:hover {
  background: #D32F2F;
}
#${BRIDGE_ID} .wh-exit-cancel {
  min-width: 30px;
  padding: 0 8px;
  background: #ECEFF1;
  color: #263238;
}
#${BRIDGE_ID} .wh-exit-cancel:hover {
  background: #CFD8DC;
}
`;

export default function WindTankGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef(null);
  const cleanupBridgeRef = useRef(null);

  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [checkingCache, setCheckingCache] = useState(() => !navigator.onLine);
  const [hasOfflineCopy, setHasOfflineCopy] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [bridgeMounted, setBridgeMounted] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (reloadNonce > 0) params.set('_wh', String(reloadNonce));
    const qs = params.toString();
    return qs ? `${WINDTANK_ENTRY_PATH}?${qs}` : WINDTANK_ENTRY_PATH;
  }, [location.search, reloadNonce]);

  const exitToWindHub = useCallback(async () => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      const iframeWin = iframeRef.current?.contentWindow;

      if (iframeDoc?.fullscreenElement && typeof iframeDoc.exitFullscreen === 'function') {
        await iframeDoc.exitFullscreen().catch(() => {});
      } else if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen().catch(() => {});
      }

      if (iframeWin) {
        if (iframeWin.__WINDTANK_BG_ONLINE_TIMER__) {
          iframeWin.clearInterval(iframeWin.__WINDTANK_BG_ONLINE_TIMER__);
        }
        if (iframeWin.__WINDTANK_GAME__?.destroy) {
          iframeWin.__WINDTANK_GAME__.destroy(true);
          iframeWin.__WINDTANK_GAME__ = undefined;
        }
      }
    } catch {
      // Cross-origin or already torn down; proceed with navigation
    }

    navigate('/entertainment');
  }, [navigate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWindTankOfflineCache().then((res) => {
        if (res.cached) setHasOfflineCopy(true);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (navigator.onLine) {
        const res = await syncWindTankOfflineCache();
        if (cancelled) return;
        setHasOfflineCopy(Boolean(res.cached || navigator.onLine));
        setCheckingCache(false);
      } else {
        const cached = await hasWindTankOfflineCache();
        if (cancelled) return;
        setHasOfflineCopy(cached);
        setCheckingCache(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  useEffect(() => {
    return () => {
      cleanupBridgeRef.current?.();
      cleanupBridgeRef.current = null;
    };
  }, []);

  const mountWindHubExitBridge = useCallback(() => {
    cleanupBridgeRef.current?.();
    cleanupBridgeRef.current = null;

    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;
      if (!iframeDoc || !iframeWin || !iframeDoc.body) return;

      const gameRoot = iframeDoc.getElementById('game-root');
      if (!gameRoot) {
        // Not genuine WindTank HTML (e.g. offline error document)
        if (!navigator.onLine) setHasOfflineCopy(false);
        return;
      }

      if (!iframeDoc.getElementById(BRIDGE_STYLE_ID)) {
        const styleEl = iframeDoc.createElement('style');
        styleEl.id = BRIDGE_STYLE_ID;
        styleEl.textContent = BRIDGE_CSS;
        (iframeDoc.head || iframeDoc.documentElement).appendChild(styleEl);
      }

      iframeDoc.getElementById(BRIDGE_ID)?.remove();

      const host = iframeDoc.createElement('div');
      host.id = BRIDGE_ID;
      host.dataset.combat = 'false';
      host.dataset.confirm = 'false';
      host.setAttribute('role', 'region');
      host.setAttribute('aria-label', 'Điều hướng WindHub');

      let confirmOpen = false;
      let confirmTimer = null;

      const clearConfirmTimer = () => {
        if (confirmTimer) {
          iframeWin.clearTimeout(confirmTimer);
          confirmTimer = null;
        }
      };

      const isCombatUnpaused = () => {
        const game = iframeWin.__WINDTANK_GAME__;
        if (!game?.scene?.isActive?.('GameScene')) return false;
        const gs = game.scene.getScene?.('GameScene');
        if (gs && typeof gs.getIsPaused === 'function' && gs.getIsPaused()) {
          return false;
        }
        return true;
      };

      const stopCanvasLeak = (e) => {
        e.stopPropagation();
      };

      for (const evtName of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click']) {
        host.addEventListener(evtName, stopCanvasLeak);
      }

      const renderButtons = () => {
        const inCombat = isCombatUnpaused();
        if (!inCombat && confirmOpen) {
          confirmOpen = false;
          clearConfirmTimer();
        }
        host.dataset.combat = inCombat ? 'true' : 'false';
        host.dataset.confirm = confirmOpen ? 'true' : 'false';
        host.replaceChildren();

        if (!confirmOpen) {
          const triggerBtn = iframeDoc.createElement('button');
          triggerBtn.type = 'button';
          triggerBtn.className = 'wh-exit-btn';
          triggerBtn.setAttribute('aria-label', 'Thoát trò chơi về lại WindHub');
          triggerBtn.title = inCombat
            ? 'Nhấn để mở xác nhận thoát về WindHub'
            : 'Thoát về lại WindHub';
          triggerBtn.textContent = inCombat ? '← Hub' : '← WindHub';
          triggerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isCombatUnpaused()) {
              confirmOpen = true;
              renderButtons();
              clearConfirmTimer();
              confirmTimer = iframeWin.setTimeout(() => {
                confirmOpen = false;
                renderButtons();
              }, 3500);
            } else {
              void exitToWindHub();
            }
          });
          host.appendChild(triggerBtn);
          return;
        }

        const confirmBtn = iframeDoc.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'wh-exit-btn wh-exit-confirm';
        confirmBtn.setAttribute('aria-label', 'Xác nhận thoát về lại WindHub');
        confirmBtn.textContent = '← Thoát về WindHub';
        confirmBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearConfirmTimer();
          void exitToWindHub();
        });

        const cancelBtn = iframeDoc.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'wh-exit-btn wh-exit-cancel';
        cancelBtn.setAttribute('aria-label', 'Hủy thoát và chơi tiếp');
        cancelBtn.title = 'Tiếp tục chơi';
        cancelBtn.textContent = '✕';
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearConfirmTimer();
          confirmOpen = false;
          renderButtons();
        });

        host.appendChild(confirmBtn);
        host.appendChild(cancelBtn);
      };

      renderButtons();
      gameRoot.appendChild(host);
      setBridgeMounted(true);

      let lastCombatState = isCombatUnpaused();
      const statePoll = iframeWin.setInterval(() => {
        if (!host.isConnected) {
          const nextRoot = iframeDoc.getElementById('game-root');
          if (nextRoot) nextRoot.appendChild(host);
        }
        const nowCombat = isCombatUnpaused();
        if (nowCombat !== lastCombatState) {
          lastCombatState = nowCombat;
          renderButtons();
        }
      }, 240);

      cleanupBridgeRef.current = () => {
        clearConfirmTimer();
        iframeWin.clearInterval(statePoll);
        host.remove();
      };
    } catch {
      // Fallback parent overlay button stays visible if iframe DOM cannot be accessed
      setBridgeMounted(false);
    }
  }, [exitToWindHub]);

  const showOfflineFirstTimeNotice = !isOnline && !checkingCache && !hasOfflineCopy;

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#dcdedf] select-none overscroll-none">
      {/* Fallback WindHub Exit Button before iframe mounts its orientation-synced control */}
      {(!bridgeMounted || showOfflineFirstTimeNotice) && (
        <div
          style={{
            top: 'max(10px, env(safe-area-inset-top, 0px))',
            left: 'max(12px, env(safe-area-inset-left, 0px))',
          }}
          className="fixed z-[60]"
        >
          <button
            type="button"
            onClick={exitToWindHub}
            aria-label="Thoát về lại WindHub"
            className="os-focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-[9px] border-2 border-[#18191B] bg-white px-3 text-xs font-black text-[#18191B] shadow-[0_3px_0_#18191B,0_6px_14px_rgba(0,0,0,0.16)] hover:bg-[#FFF8E1] active:translate-y-0.5 active:shadow-[0_1px_0_#18191B] cursor-pointer transition-all"
          >
            <ArrowLeft size={14} strokeWidth={2.6} />
            <span>WindHub</span>
          </button>
        </div>
      )}

      {showOfflineFirstTimeNotice ? (
        <div className="flex flex-1 items-center justify-center bg-[var(--os-bg)] p-4 text-[var(--os-text-primary)]">
          <section
            role="status"
            aria-live="polite"
            className="os-floating-surface w-full max-w-md rounded-[var(--radius-xl)] p-6 text-center"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-[var(--os-warning-border)] bg-[var(--os-warning-soft)] text-[var(--os-warning)]">
              <WifiOff size={22} />
            </span>
            <h1 className="mt-4 text-lg font-extrabold text-[var(--os-text-primary)]">
              Chưa có bản lưu đệm WindTank trên thiết bị này
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
              Hãy kết nối mạng và mở <strong>WindTank Trouble</strong> một lần đầu tiên để WindHub tự động lưu bộ đệm trò chơi. Từ những lần sau, bạn có thể vào chơi hoàn toàn Offline.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCheckingCache(true);
                  setReloadNonce((n) => n + 1);
                }}
                className="os-focus-ring inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-4 text-xs font-bold text-[var(--os-text-primary)] hover:bg-[var(--os-surface-1)] cursor-pointer transition-colors"
              >
                <RefreshCw size={14} />
                <span>Thử kiểm tra lại</span>
              </button>
              <button
                type="button"
                onClick={exitToWindHub}
                className="os-focus-ring inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--os-accent)] px-4 text-xs font-bold text-[var(--os-accent-fg)] hover:bg-[var(--os-accent-hover)] cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Quay về WindHub</span>
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="relative flex-1 w-full h-full">
          {!iframeLoaded && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#dcdedf] text-[#18191B]"
            >
              <div className="size-9 animate-spin rounded-full border-3 border-[#18191B]/20 border-t-[#E53935]" />
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#26292E]">
                Đang nạp đấu trường WindTank Trouble...
              </p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={reloadNonce}
            src={iframeSrc}
            title="WindTank Trouble — Đại Chiến Xe Tăng Mê Cung"
            allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
            onLoad={() => {
              setIframeLoaded(true);
              mountWindHubExitBridge();
            }}
            className="block h-full w-full border-0 bg-[#dcdedf]"
          />
        </div>
      )}
    </div>
  );
}
