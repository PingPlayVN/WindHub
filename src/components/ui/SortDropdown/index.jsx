import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function SortDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'oldest', label: 'Cũ nhất' },
    { id: 'name-asc', label: 'Tên A-Z' },
    { id: 'name-desc', label: 'Tên Z-A' }
  ];

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = sortOptions.find(opt => opt.id === value) || sortOptions[0];

  return (
    <div className="relative w-[110px] sm:w-44 shrink-0 z-50" ref={dropdownRef}>
      {/* Nút Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm shadow-sm outline-none transition-all dark:bg-[#111] dark:text-slate-100 ${
          isOpen 
            ? 'border-primary-500 ring-1 ring-primary-500' 
            : 'border-slate-200 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50'
        }`}
      >
        <span className="truncate font-medium">{activeOption.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={`text-slate-500 transition-colors ${isOpen ? 'text-primary-500' : 'group-hover:text-primary-500'}`} />
        </motion.div>
      </button>

      {/* Menu xổ xuống */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
            className="absolute right-0 mt-2 w-full origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#111]"
          >
            <ul className="flex flex-col p-1.5">
              {sortOptions.map((option) => {
                const isActive = option.id === value;
                return (
                  <li key={option.id}>
                    <button
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option.label}
                      {isActive && <Check size={14} className="text-primary-500" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}