// src/pages/Home/index.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { HardDrive, Image as ImageIcon, FileText, Video, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [stats, setStats] = useState({ total: 0, image: 0, document: 0, video: 0, raw: 0 });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'windhub_files'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Tính toán thống kê
      const newStats = { total: docs.length, image: 0, document: 0, video: 0, raw: 0 };
      docs.forEach(file => {
        if (newStats[file.type] !== undefined) {
          newStats[file.type]++;
        } else {
          newStats.raw++;
        }
      });
      
      setStats(newStats);
      setRecentFiles(docs.slice(0, 5)); // Lấy 5 file mới nhất
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const statCards = [
    { title: 'Tổng tài nguyên', value: stats.total, icon: <HardDrive size={24} />, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { title: 'Hình ảnh', value: stats.image, icon: <ImageIcon size={24} />, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Tài liệu', value: stats.document, icon: <FileText size={24} />, color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
    { title: 'Video', value: stats.video, icon: <Video size={24} />, color: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Xin chào, Trịnh Gia Phong! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400">Chào mừng bạn quay trở lại với hệ thống WindHub. Dưới đây là tổng quan tài nguyên của bạn.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Cột trái: Thống kê */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((card, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className={`${card.bg} p-6 rounded-2xl border border-white/50 dark:border-slate-800 shadow-sm flex flex-col justify-between`}>
                  <div className={`w-12 h-12 rounded-full ${card.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{card.value}</h3>
                    <p className={`text-sm font-medium mt-1 ${card.text}`}>{card.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Vùng gợi ý hoặc biểu đồ (Có thể thêm sau) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[250px]">
               <p className="text-slate-400">Khu vực này có thể gắn biểu đồ hoạt động trong tương lai.</p>
            </div>
          </div>

          {/* Cột phải: Hoạt động gần đây */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Hoạt động gần đây</h3>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              {recentFiles.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 p-6 text-center text-sm">
                  Chưa có hoạt động nào được ghi nhận.
                </div>
              ) : (
                <ul className="space-y-1 p-2">
                  {recentFiles.map(file => (
                    <li key={file.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        {file.type === 'image' ? <ImageIcon size={18} /> : file.type === 'video' ? <Video size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{file.createdAt}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-center">
              <Link to="/files" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                Xem tất cả tài nguyên →
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}