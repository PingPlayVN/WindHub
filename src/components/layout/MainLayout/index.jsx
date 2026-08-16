// src/components/layout/MainLayout/index.jsx
import Sidebar from '../Sidebar';
import Header from '../Header';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        <Header />
        {/* Khu vực render nội dung các trang */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}