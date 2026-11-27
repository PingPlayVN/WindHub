// src/App.jsx
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { applyAppearance, useThemeStore } from '@/store/useThemeStore';
import { Toaster, toast } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { isAdminEmail } from '@/services/auth';
import MainLayout from '@/components/layout/MainLayout';
import Loader from '@/components/ui/Loader';
import OfflineGate from '@/components/ui/OfflineGate';
import Toast from '@/components/os/Toast';

const Home = lazy(() => import('@/pages/Home'));
const FileManager = lazy(() => import('@/modules/FileManager'));
const Tools = lazy(() => import('@/pages/Tools'));
const ToolsHub = lazy(() => import('@/pages/ToolsHub'));
const P2P = lazy(() => import('@/modules/P2P'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const LoginModal = lazy(() => import('@/modules/Auth/LoginModal'));
const Entertainment = lazy(() => import('@/modules/Entertainment'));
const TaiXiu = lazy(() => import('@/modules/Entertainment/TaiXiu'));
const WindTankGame = lazy(() => import('@/modules/Entertainment/WindTank'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkedPwaLaunch = useRef(false);
  const { theme, liquidGlass, motionLevel } = useThemeStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { isLoginOpen, closeLogin } = useUIStore();

  const isTaiXiuFullScreen =
    location.pathname.startsWith('/entertainment/tai-xiu') ||
    location.pathname === '/tai-xiu' ||
    location.pathname === '/lottery';

  const isWindTankFullScreen =
    location.pathname.startsWith('/entertainment/windtank') ||
    location.pathname === '/windtank-game';

  useEffect(() => {
    if (checkedPwaLaunch.current) return;
    checkedPwaLaunch.current = true;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isStandalone && window.location.pathname === '/tools') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (navigator.onLine) {
        import('@/modules/Entertainment/WindTank/windtankOfflineSync')
          .then(({ syncWindTankOfflineCache }) => syncWindTankOfflineCache())
          .catch(() => {});
      }
    }, 2200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    applyAppearance({ theme, liquidGlass, motionLevel });
  }, [theme, liquidGlass, motionLevel]);

  useEffect(() => {
    useAuthStore.getState().initPlayerAuth();

    let unsubscribe;
    Promise.all([
      import('firebase/auth'),
      import('@/services/firebase'),
    ]).then(([{ onAuthStateChanged }, { auth }]) => {
      unsubscribe = onAuthStateChanged(auth, (user) => setAuth(user, isAdminEmail(user?.email)));
    });
    return () => unsubscribe?.();
  }, [setAuth]);

  // --- HỆ THỐNG ANTI-DEVTOOLS (CHỈ ÁP DỤNG CHO USER THƯỜNG) ---
  useEffect(() => {
    if (isAdmin) return;

    const blockDevTools = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        toast.error('Access Denied: Khu vực này được bảo vệ.');
      }
      if (
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        toast.error('Access Denied: Hành động không được phép.');
      }
    };

    window.addEventListener('keydown', blockDevTools);

    const blockRightClick = (e) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', blockRightClick);

    return () => {
      window.removeEventListener('keydown', blockDevTools);
      window.removeEventListener('contextmenu', blockRightClick);
    };
  }, [isAdmin]);

  // CHẾ ĐỘ CHƠI GAME TOÀN MÀN HÌNH CHO WINDTANK TROUBLE (HỖ TRỢ 100% OFFLINE)
  if (isWindTankFullScreen) {
    return (
      <MotionConfig reducedMotion="never" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        <Toaster position="top-right" richColors theme={theme} />
        <Suspense fallback={<Loader fullScreen text="Đang mở đấu trường WindTank Trouble..." />}>
          <WindTankGame />
        </Suspense>
      </MotionConfig>
    );
  }

  // CHẾ ĐỘ CHƠI GAME TOÀN MÀN HÌNH CHUYÊN BIỆT CHO TÀI XỈU (GIỮ NGUYÊN 100%)
  if (isTaiXiuFullScreen) {
    return (
      <MotionConfig reducedMotion="never" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
        <Toaster position="top-right" richColors theme={theme} />
        <div className="fixed inset-0 w-screen h-[100dvh] max-h-[100dvh] overflow-hidden lg:overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#1a0f07] via-[#24140b] to-[#0d0704] select-none text-amber-100 flex flex-col p-1 xs:p-1.5 sm:p-3 lg:p-4 z-50 overscroll-none">
          <Suspense fallback={<Loader fullScreen text="Đang tải sòng quay số..." />}>
            <OfflineGate pageTitle="Tài Xỉu Dân Gian">
              <TaiXiu />
            </OfflineGate>
          </Suspense>
        </div>
      </MotionConfig>
    );
  }

  const framerReducedMode = motionLevel === 'reduced' ? 'always' : 'user';

  return (
    <MotionConfig reducedMotion={framerReducedMode} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      <MainLayout>
        <Toast />
        {isLoginOpen && (
          <Suspense fallback={null}>
            <LoginModal open={isLoginOpen} onClose={closeLogin} />
          </Suspense>
        )}

        <Suspense fallback={<Loader text="Đang mở không gian làm việc..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<OfflineGate pageTitle="Quản lý Tệp"><FileManager /></OfflineGate>} />
            <Route path="/tools" element={<ToolsHub />} />
            <Route path="/extensions" element={<OfflineGate pageTitle="Tiện ích mở rộng"><Tools /></OfflineGate>} />
            <Route path="/ai-lab" element={<Navigate to="/" replace />} />
            <Route path="/p2p" element={<P2P />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/entertainment" element={<Entertainment />} />
            <Route path="/entertainment/windtank" element={<WindTankGame />} />
            <Route path="/windtank-game" element={<Navigate to="/entertainment/windtank" replace />} />
            <Route path="/entertainment/tai-xiu" element={<OfflineGate pageTitle="Tài Xỉu Dân Gian"><TaiXiu /></OfflineGate>} />
            <Route path="/lottery" element={<Navigate to="/entertainment/tai-xiu" replace />} />
            <Route path="/tai-xiu" element={<Navigate to="/entertainment/tai-xiu" replace />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </MotionConfig>
  );
}

export default App;
