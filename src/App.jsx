// src/App.jsx
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';
import { Toaster, toast } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import MainLayout from '@/components/layout/MainLayout';
import Loader from '@/components/ui/Loader';
import OfflineGate from '@/components/ui/OfflineGate';

const Home = lazy(() => import('@/pages/Home'));
const FileManager = lazy(() => import('@/modules/FileManager'));
const Tools = lazy(() => import('@/pages/Tools'));
const ToolsHub = lazy(() => import('@/pages/ToolsHub'));
const P2P = lazy(() => import('@/modules/P2P'));
const LoginModal = lazy(() => import('@/modules/Auth/LoginModal'));
const Entertainment = lazy(() => import('@/modules/Entertainment'));
const TaiXiu = lazy(() => import('@/modules/Entertainment/TaiXiu'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const checkedPwaLaunch = useRef(false);
  const { theme } = useThemeStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { isLoginOpen, closeLogin } = useUIStore();

  const isFullScreenGame =
    location.pathname.startsWith('/entertainment/tai-xiu') ||
    location.pathname === '/tai-xiu' ||
    location.pathname === '/lottery';

  useEffect(() => {
    if (checkedPwaLaunch.current) return;
    checkedPwaLaunch.current = true;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isStandalone && window.location.pathname === '/tools') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let unsubscribe;
    Promise.all([
      import('firebase/auth'),
      import('@/services/firebase'),
      import('@/services/auth'),
    ]).then(([{ onAuthStateChanged }, { auth }, { isAdminEmail }]) => {
      unsubscribe = onAuthStateChanged(auth, (user) => setAuth(user, isAdminEmail(user?.email)));
    });
    return () => unsubscribe?.();
  }, [setAuth]);

  // --- HỆ THỐNG ANTI-DEVTOOLS (CHỈ ÁP DỤNG CHO USER THƯỜNG) ---
  useEffect(() => {
    if (isAdmin) return; // Admin được phép dùng DevTools thoải mái

    const blockDevTools = (e) => {
      // Chặn F12
      if (e.key === 'F12') {
        e.preventDefault();
        toast.error("Access Denied: Khu vực này được bảo vệ.");
      }
      // Chặn Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (Xem source)
      if (
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        toast.error("Access Denied: Hành động không được phép.");
      }
    };

    window.addEventListener('keydown', blockDevTools);
    
    // Ngăn chặn chuột phải ở cấp độ toàn cục (ngoại trừ Context Menu custom của bạn)
    const blockRightClick = (e) => {
       e.preventDefault(); 
    };
    window.addEventListener('contextmenu', blockRightClick);

    return () => {
      window.removeEventListener('keydown', blockDevTools);
      window.removeEventListener('contextmenu', blockRightClick);
    };
  }, [isAdmin]);

  // CHẾ ĐỘ CHƠI GAME TOÀN MÀN HÌNH CHUYÊN BIỆT CHO TÀI XỈU (100vw x 100dvh, KHÔNG CÓ SIDEBAR/HEADER CHUNG)
  if (isFullScreenGame) {
    return (
      <MotionConfig reducedMotion="never" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
        <Toaster position="top-right" richColors theme={theme} />
        <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-gradient-to-b from-[#1a0f07] via-[#24140b] to-[#0d0704] select-none text-amber-100 flex flex-col p-2 sm:p-4 z-50">
          <Suspense fallback={<Loader fullScreen text="Đang tải sòng quay số..." />}>
            <OfflineGate pageTitle="Tài Xỉu Dân Gian">
              <TaiXiu />
            </OfflineGate>
          </Suspense>
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="never" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      <MainLayout>
        <Toaster position="top-right" richColors theme={theme} />
        {isLoginOpen && <Suspense fallback={null}><LoginModal open={isLoginOpen} onClose={closeLogin} /></Suspense>}
                 
        <Suspense fallback={<Loader fullScreen text="Đang tải dữ liệu..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<OfflineGate pageTitle="Quản lý File"><FileManager /></OfflineGate>} />
            <Route path="/tools" element={<ToolsHub />} />
            <Route path="/extensions" element={<OfflineGate pageTitle="Tiện ích"><Tools /></OfflineGate>} />
            <Route path="/ai-lab" element={<Navigate to="/" replace />} />
            <Route path="/p2p" element={<P2P />} />
            <Route path="/entertainment" element={<OfflineGate pageTitle="Giải trí"><Entertainment /></OfflineGate>} />
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
