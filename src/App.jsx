// src/App.jsx
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';
import { Toaster } from 'sonner';
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

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      <MainLayout>
        <Toaster position="top-right" richColors theme={theme} />
        {isLoginOpen && <Suspense fallback={null}><LoginModal open={isLoginOpen} onClose={closeLogin} /></Suspense>}
        
        {/* THAY THẾ SUSPENSE FALLBACK BẰNG LOADER MỚI */}
        <Suspense fallback={<Loader fullScreen text="Đang tải ứng dụng..." />}>
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
