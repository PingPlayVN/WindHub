// src/components/layout/MainLayout/index.jsx
import Sidebar from '../Sidebar';
import Header from '../Header';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-black transition-colors duration-300">
      <Sidebar />
      <main className="min-w-0 min-h-0 flex-1 flex flex-col relative">
        <Header />
        {/* Khu vực render nội dung các trang */}
        <div className="relative min-w-0 min-h-0 flex flex-1 flex-col overflow-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
