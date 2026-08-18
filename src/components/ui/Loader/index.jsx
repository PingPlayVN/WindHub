// src/components/ui/Loader/index.jsx
import { motion } from 'framer-motion';

export default function Loader({ text = "Đang xử lý...", fullScreen = false, size = "md" }) {
  // Quản lý kích thước của vòng xoay
  const sizeClasses = {
    sm: "w-6 h-6 border-[3px]",
    md: "w-10 h-10 border-4",
    lg: "w-14 h-14 border-4"
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Vòng nền mờ phía sau */}
        <div className={`absolute inset-0 rounded-full border-slate-200 dark:border-slate-800 ${sizeClasses[size]}`}></div>
        
        {/* Vòng quay chính (Màu Primary) */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`rounded-full border-primary-500 border-t-transparent border-l-transparent ${sizeClasses[size]}`}
        ></motion.div>
      </div>
      
      {/* Hiệu ứng text mờ dần */}
      {text && (
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  // Nếu cần hiển thị toàn màn hình (vd: khi lướt giữa các trang)
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  // Hiển thị cục bộ trong một div
  return (
    <div className="flex w-full h-full min-h-[200px] items-center justify-center flex-1">
      {loaderContent}
    </div>
  );
}