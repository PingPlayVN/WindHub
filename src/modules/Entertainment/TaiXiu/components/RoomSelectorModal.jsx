// src/modules/Entertainment/TaiXiu/components/RoomSelectorModal.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const ROOMS = [
  {
    id: 'tai-xiu-30s',
    name: 'Bàn Xóm Đình',
    icon: '🏛️',
    durationText: '50s / phiên',
    desc: 'Nhịp điệu thư thái, đàm đạo uống trà ngắm trăng thưởng nguyệt.'
  },
  {
    id: 'tai-xiu-15s',
    name: 'Bàn Chợ Phiên',
    icon: '⚡',
    durationText: '25s / phiên',
    desc: 'Nhanh gọn, sôi nổi, kịch tính từng giây như chợ quê ngày Tết.'
  }
];

export default function RoomSelectorModal({
  isOpen,
  onClose,
  currentRoomId = 'tai-xiu-30s',
  onSelectRoom
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm rounded-3xl border-2 border-[#D5B46B]/70 bg-gradient-to-b from-[#241712] via-[#171411] to-[#100c09] p-4 sm:p-5 text-[#E8DDC8] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(213,180,107,0.25)] select-none"
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full border border-[#D5B46B]/50 bg-[#8E2926]/90 text-[#FAF5EB] hover:bg-[#8E2926] active:scale-95 transition-all"
            aria-label="Đóng chọn phòng"
          >
            <X size={16} />
          </button>

          {/* Tiêu đề */}
          <div className="mb-4 border-b border-[#A87932]/30 pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#FAF5EB] uppercase tracking-wide">
              Chọn Bàn Chơi
            </h3>
            <p className="text-xs text-[#D5B46B]/80">
              Chọn sòng Tài Xỉu phù hợp với phong cách của bạn
            </p>
          </div>

          {/* Danh sách phòng */}
          <div className="space-y-3">
            {ROOMS.map((room) => {
              const isSelected = currentRoomId === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    onSelectRoom(room.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left ${
                    isSelected
                      ? 'border-[#D5B46B] bg-gradient-to-r from-[#382318] to-[#251710] shadow-[0_0_18px_rgba(213,180,107,0.35)] ring-1 ring-[#D5B46B]/50'
                      : 'border-[#A87932]/35 bg-[#1b130f]/80 hover:border-[#D5B46B]/70 hover:bg-[#251812]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{room.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#FAF5EB]">
                          {room.name}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#171411] text-[#D5B46B] border border-[#A87932]/40">
                          {room.durationText}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E8DDC8]/70 mt-0.5">
                        {room.desc}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="size-6 rounded-full bg-[#D5B46B] text-[#171411] flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
