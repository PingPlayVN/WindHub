// src/components/ui/Button/index.jsx
import { motion } from 'framer-motion';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  // Định nghĩa sẵn các kiểu nút
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors duration-200 outline-none";
  
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black shadow-sm",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
