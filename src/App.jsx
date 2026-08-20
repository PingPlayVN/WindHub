// src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';
import { Toaster, toast } from 'sonner'; // <-- Thêm import toast
import { MotionConfig } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import MainLayout from '@/components/layout/MainLayout';
import Loader from '@/components/ui/Loader';

const Home = lazy(() => import('@/pages/Home'));
const FileManager = lazy(() => import('@/modules/FileManager'));
const LoginModal = lazy(() => import('@/modules/Auth/LoginModal'));

function App() {
  const { theme } = useThemeStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAdmin = useAuthStore((state) => state.isAdmin); // <-- Lấy thêm isAdmin từ store
  const { isLoginOpen, closeLogin } = useUIStore();

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
       // Nếu bạn muốn cấm luôn chuột phải mặc định trên toàn trang, uncomment dòng dưới:
       e.preventDefault(); 
    };
    window.addEventListener('contextmenu', blockRightClick);

    return () => {
      window.removeEventListener('keydown', blockDevTools);
      window.removeEventListener('contextmenu', blockRightClick);
    };
  }, [isAdmin]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      <MainLayout>
        <Toaster position="top-right" richColors theme={theme} />
        {isLoginOpen && <Suspense fallback={null}><LoginModal open={isLoginOpen} onClose={closeLogin} /></Suspense>}
                 
        <Suspense fallback={<Loader fullScreen text="Đang tải dữ liệu..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<FileManager />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </MotionConfig>
  );
}

export default App;