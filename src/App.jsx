// src/App.jsx
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useThemeStore } from '@/store/useThemeStore';
import { Toaster } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import FileManager from '@/modules/FileManager';

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <MainLayout>
      {/* Thêm Toaster vào đây, richColors giúp thông báo có màu sắc sinh động */}
      <Toaster position="top-right" richColors theme={theme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/files" element={<FileManager />} />
      </Routes>
    </MainLayout>
  );
}

export default App;