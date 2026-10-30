// src/modules/Entertainment/TaiXiu/components/GameInfoModal.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, BookOpen, Sparkles, Hand, Coins } from 'lucide-react';
import { DongSonSun, ChimLac } from './HeritageIcons';

export default function GameInfoModal({ isOpen, onClose }) {
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
          className="relative z-10 w-full max-w-md rounded-3xl border-2 border-[#D5B46B]/70 bg-gradient-to-b from-[#241712] via-[#171411] to-[#100c09] p-4 sm:p-5 text-[#E8DDC8] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(213,180,107,0.25)] select-none max-h-[88vh] flex flex-col"
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full border border-[#D5B46B]/50 bg-[#8E2926]/90 text-[#FAF5EB] hover:bg-[#8E2926] active:scale-95 transition-all"
            aria-label="Đóng thông tin trò chơi"
          >
            <X size={16} />
          </button>

          {/* Tiêu đề */}
          <div className="flex items-center gap-2.5 border-b border-[#A87932]/30 pb-3 mb-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#2b1c15] border border-[#D5B46B]/50 text-[#D5B46B]">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#FAF5EB] uppercase tracking-wide">
                Luật Chơi & Thông Tin
              </h3>
              <p className="text-xs text-[#D5B46B]/80">
                Tài Xỉu Dân Gian Đông Sơn • Di Sản Việt
              </p>
            </div>
          </div>

          {/* Nội dung cuộn */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 text-xs">
            {/* Cảnh báo giải trí lành mạnh */}
            <div className="rounded-2xl border border-amber-600/50 bg-[#251711] p-3 flex gap-2.5">
              <ShieldAlert size={20} className="text-[#D5B46B] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#D5B46B] font-bold block mb-0.5">
                  Mô phỏng giải trí dân gian:
                </strong>
                <p className="text-[#E8DDC8]/90 leading-relaxed text-[11px]">
                  Trò chơi chỉ mang tính chất giải trí, phục dựng nét đẹp văn hóa ngày hội làng. Điểm xu cấp hoàn toàn miễn phí, không có giá trị quy đổi tiền mặt, không nạp/rút tiền thật.
                </p>
              </div>
            </div>

            {/* Luật tính điểm */}
            <div className="rounded-2xl bg-[#1b130f] border border-[#A87932]/30 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[#D5B46B] font-black text-xs uppercase">
                <Sparkles size={14} />
                <span>Quy Tắc Đặt Cược & Tính Điểm</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#E8DDC8]/80 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D5B46B] font-bold">•</span>
                  <span>
                    <strong className="text-[#FAF5EB]">Cửa XỈU:</strong> Tổng số điểm của 3 viên xúc xắc từ <strong>4 đến 10</strong>. Tỉ lệ trả thưởng <strong>1:1</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D5B46B] font-bold">•</span>
                  <span>
                    <strong className="text-[#FAF5EB]">Cửa TÀI:</strong> Tổng số điểm của 3 viên xúc xắc từ <strong>11 đến 17</strong>. Tỉ lệ trả thưởng <strong>1:1</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D5B46B] font-bold">•</span>
                  <span>
                    <strong className="text-[#FAF5EB]">Tam Bảo (Bão):</strong> Cả 3 viên xúc xắc ra cùng 1 số (ví dụ: 1-1-1, 6-6-6). Theo luật dân gian, nhà cái ăn cả Tài lẫn Xỉu.
                  </span>
                </li>
              </ul>
            </div>

            {/* Hướng dẫn cơ chế Nặn Bát */}
            <div className="rounded-2xl bg-[#1b130f] border border-[#A87932]/30 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[#D5B46B] font-black text-xs uppercase">
                <Hand size={14} />
                <span>Cơ Chế Nặn Bát Cảm Ứng 360°</span>
              </div>
              <p className="text-[11px] text-[#E8DDC8]/80 leading-relaxed">
                Khi đến thời gian mở bát (giai đoạn Kết Quả):
              </p>
              <ul className="space-y-1 text-[11px] text-[#E8DDC8]/80 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <ChimLac size={13} className="text-[#D5B46B] shrink-0 mt-0.5" />
                  <span>Dùng ngón tay/chuột kéo bát sang bất kỳ hướng nào để hé nhìn từng viên xúc xắc.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <DongSonSun size={13} className="text-[#D5B46B] shrink-0 mt-0.5" />
                  <span><strong>Tự giật nắp bát:</strong> Khi người chơi kéo hé đủ để thấy cả 3 viên xúc xắc, nắp bát sẽ tự động giật vút ra để mở kết quả và công bố thưởng!</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D5B46B] font-bold">•</span>
                  <span>Nếu buông tay khi chưa hé đủ cả 3 quân, nắp bát sẽ tự úp lại để bà con nặn tiếp. Hết thời gian nặn, game tự động giật mở.</span>
                </li>
              </ul>
            </div>

            {/* Cấp xu miễn phí */}
            <div className="rounded-2xl bg-[#1b130f] border border-[#A87932]/30 p-3 flex items-start gap-2.5">
              <Coins size={18} className="text-[#D5B46B] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#E8DDC8]/80 leading-relaxed">
                <strong className="text-[#FAF5EB] block mb-0.5">Nhận thêm xu miễn phí:</strong>
                Khi số dư của bà con xuống dưới 500 xu, biểu tượng dấu <strong>(+)</strong> cạnh ví xu sẽ sáng nhấp nháy. Bấm vào để nhận ngay <strong>10,000 xu</strong> tiếp tục giải trí!
              </div>
            </div>
          </div>

          {/* Nút đóng */}
          <div className="pt-3 border-t border-[#A87932]/25 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-xs font-black text-[#171411] active:scale-98 transition shadow-md"
            >
              Đã Rõ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
