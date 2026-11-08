// src/modules/Entertainment/TaiXiu/components/DonateModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  X,
  QrCode,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Crown,
  HeartHandshake
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { DONATE_CONFIG, buildVietQrUrl } from '@/config/donateConfig';
import { createDonateOrder, subscribeDonateOrder, processCompletedDonateOrder } from '@/services/donateService';
import { HeritageCoinIcon, DongSonSun } from './HeritageIcons';

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

export default function DonateModal({ isOpen, onClose, onSuccess }) {
  const { user, player, updateBetBalance } = useAuthStore();
  const [selectedPkg, setSelectedPkg] = useState(DONATE_CONFIG.packages[0]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [step, setStep] = useState('SELECT'); // 'SELECT' | 'QR' | 'SUCCESS'
  const [loading, setLoading] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('SELECT');
      setCurrentOrder(null);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  }, [isOpen]);

  // Lắng nghe thay đổi trạng thái đơn hàng thời gian thực
  useEffect(() => {
    if (step === 'QR' && currentOrder?.orderId) {
      const unsub = subscribeDonateOrder(currentOrder.orderId, async (updatedOrder) => {
        if (updatedOrder && updatedOrder.status === 'COMPLETED') {
          handleOrderSuccess(updatedOrder);
        }
      });
      unsubscribeRef.current = unsub;
      return () => {
        if (unsub) unsub();
      };
    }
  }, [step, currentOrder?.orderId]);

  if (!isOpen) return null;

  const activeUser = user || (player ? { uid: player.userId, email: player.email, displayName: player.displayName } : null);

  const handleCreateOrder = async (pkg) => {
    if (!activeUser) {
      toast.error('Vui lòng đăng nhập để thực hiện ủng hộ server.');
      return;
    }
    setLoading(true);
    setSelectedPkg(pkg);
    try {
      const order = await createDonateOrder(activeUser, pkg);
      setCurrentOrder(order);
      setStep('QR');
      toast.info(`Đã tạo mã chuyển khoản cho gói ${pkg.title}!`);
    } catch (err) {
      toast.error(err.message || 'Không thể tạo đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = (order) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setStep('SUCCESS');
    const coins = order.rewardCoins || selectedPkg.rewardCoins;
    updateBetBalance((prev) => (typeof prev === 'number' ? prev + coins : coins));
    if (onSuccess) onSuccess(order);
  };

  // Dành cho môi trường kiểm thử / Admin bấm xác nhận tức thời
  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await processCompletedDonateOrder(currentOrder.orderId, {
        simulated: true,
        method: 'ADMIN_SIMULATION',
        time: Date.now()
      });
      toast.success('Mô phỏng ngân hàng chuyển khoản thành công!');
      handleOrderSuccess(res.order || currentOrder);
    } catch (err) {
      toast.error(err.message || 'Lỗi xử lý thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const qrImageUrl = currentOrder
    ? buildVietQrUrl({
        bankId: DONATE_CONFIG.bank.bankId,
        accountNo: DONATE_CONFIG.bank.accountNo,
        accountName: DONATE_CONFIG.bank.accountName,
        amount: currentOrder.amountVnd,
        memo: currentOrder.memo,
      })
    : '';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg rounded-3xl border border-[#A87932]/60 bg-gradient-to-b from-[#251812] via-[#1a120e] to-[#110c09] p-4 xs:p-5 sm:p-6 text-[#E8DDC8] shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-h-[95dvh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[#A87932]/25 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#D5B46B]/50 bg-gradient-to-br from-[#8E2926] to-[#A87932] text-[#FAF5EB] shadow-inner">
                <Coffee size={20} className="animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D5B46B] block">
                  ĐỒNG HÀNH & TRI ÂN
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#FAF5EB] tracking-tight">
                  Ủng Hộ Duy Trì Server
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-xl border border-[#A87932]/40 bg-[#2b1c15] text-[#D5B46B] hover:text-[#FAF5EB] active:scale-95 transition-all"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* =========================================================================
              BƯỚC 1: CHỌN GÓI ỦNG HỘ (10K & 20K)
              ========================================================================= */}
          {step === 'SELECT' && (
            <div className="mt-4 flex flex-col gap-3.5">
              <p className="text-xs text-[#E8DDC8]/80 leading-relaxed">
                Mỗi đóng góp của bạn giúp duy trì chi phí máy chủ, hạ tầng mạng Cloudflare và Firebase cho WindHub. Admin xin gửi tặng bạn gói quà Xu trải nghiệm tương ứng:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {DONATE_CONFIG.packages.map((pkg) => {
                  const is20k = pkg.id === 'pkg_20k';
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleCreateOrder(pkg)}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] group ${
                        is20k
                          ? 'border-[#D5B46B] bg-gradient-to-br from-[#381e15] via-[#28160f] to-[#1c0f0a] shadow-[0_4px_16px_rgba(213,180,107,0.25)] hover:border-[#FAF5EB]'
                          : 'border-[#A87932]/50 bg-gradient-to-br from-[#241712] to-[#17100b] hover:border-[#D5B46B]'
                      }`}
                    >
                      {/* Tag huy hiệu */}
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{pkg.icon}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pkg.badgeColor}`}>
                          {pkg.tag}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h3 className="text-sm font-black text-[#FAF5EB] group-hover:text-[#D5B46B] transition-colors">
                          {pkg.title}
                        </h3>
                        <p className="text-[11px] text-[#E8DDC8]/70 mt-0.5 leading-snug">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Số tiền & Xu nhận được */}
                      <div className="mt-3 pt-2.5 border-t border-[#A87932]/25 flex items-center justify-between">
                        <span className="font-mono text-sm font-black text-[#FAF5EB]">
                          {pkg.amountVnd.toLocaleString()}đ
                        </span>

                        <div className="flex items-center gap-1 font-mono text-xs font-black text-[#D5B46B]">
                          <HeritageCoinIcon size={14} />
                          <span>+{pkg.rewardCoins.toLocaleString()}</span>
                          <span className="text-[10px] text-[#E8DDC8]/70 font-normal">xu</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cam kết minh bạch */}
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-[#A87932]/30 bg-[#160f0b]/80 p-2.5 text-[11px] text-[#E8DDC8]/80 leading-relaxed">
                <ShieldCheck size={16} className="text-[#D5B46B] shrink-0 mt-0.5" />
                <span>
                  <strong>Hệ thống tự động 100%:</strong> Quét mã VietQR bằng bất kỳ App ngân hàng nào (MB, VCB, Techcombank, MoMo,...). Xu sẽ tự động được cộng vào ví ngay khi ngân hàng nhận tiền.
                </span>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 2: QUÉT MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
              ========================================================================= */}
          {step === 'QR' && currentOrder && (
            <div className="mt-3.5 flex flex-col gap-3">
              {/* Thông tin gói đang thanh toán */}
              <div className="flex items-center justify-between rounded-xl border border-[#D5B46B]/40 bg-gradient-to-r from-[#2c1a13] to-[#1c120e] px-3 py-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D5B46B]">Gói đang ủng hộ:</span>
                  <p className="text-xs font-black text-[#FAF5EB]">
                    {selectedPkg.title} ({currentOrder.amountVnd.toLocaleString()}đ)
                  </p>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm font-black text-[#D5B46B]">
                  <HeritageCoinIcon size={16} />
                  <span>+{currentOrder.rewardCoins.toLocaleString()} xu</span>
                </div>
              </div>

              {/* Khung ảnh mã VietQR */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#A87932]/40 bg-[#0e0a08] relative">
                <div className="relative rounded-xl overflow-hidden bg-white p-2 shadow-lg">
                  <img
                    src={qrImageUrl}
                    alt={`VietQR ${currentOrder.amountVnd}đ`}
                    className="size-48 xs:size-56 sm:size-64 object-contain rounded-lg"
                  />
                  {/* Watermark logo */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white px-2 py-1 rounded text-xs">Quét bằng App Ngân Hàng</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#D5B46B] font-bold animate-pulse">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang chờ hệ thống xác nhận thanh toán...</span>
                </div>
              </div>

              {/* Chi tiết thông tin chuyển khoản (Có nút copy) */}
              <div className="space-y-1.5 rounded-xl border border-[#A87932]/35 bg-[#17100b] p-3 text-xs font-mono">
                {/* 1. Ngân hàng & STK */}
                <div className="flex items-center justify-between py-1 border-b border-[#A87932]/20">
                  <span className="text-[#E8DDC8]/60">Ngân hàng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FAF5EB]">{DONATE_CONFIG.bank.bankId} - {DONATE_CONFIG.bank.accountNo}</span>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(DONATE_CONFIG.bank.accountNo);
                        setCopiedAcc(true);
                        toast.success('Đã chép số tài khoản');
                        setTimeout(() => setCopiedAcc(false), 2000);
                      }}
                      className="text-[#D5B46B] hover:text-[#FAF5EB]"
                      title="Sao chép STK"
                    >
                      {copiedAcc ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* 2. Chủ tài khoản */}
                <div className="flex items-center justify-between py-1 border-b border-[#A87932]/20">
                  <span className="text-[#E8DDC8]/60">Chủ tài khoản:</span>
                  <span className="font-bold text-[#FAF5EB]">{DONATE_CONFIG.bank.accountName}</span>
                </div>

                {/* 3. Số tiền */}
                <div className="flex items-center justify-between py-1 border-b border-[#A87932]/20">
                  <span className="text-[#E8DDC8]/60">Số tiền:</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-bold text-amber-400 text-sm">{currentOrder.amountVnd.toLocaleString()} đ</strong>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(String(currentOrder.amountVnd));
                        setCopiedAmount(true);
                        toast.success('Đã chép số tiền');
                        setTimeout(() => setCopiedAmount(false), 2000);
                      }}
                      className="text-[#D5B46B] hover:text-[#FAF5EB]"
                      title="Sao chép số tiền"
                    >
                      {copiedAmount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* 4. NỘI DUNG CHUYỂN KHOẢN (RẤT QUAN TRỌNG) */}
                <div className="flex items-center justify-between py-1.5 bg-[#251710] px-2 rounded-lg border border-[#D5B46B]/40">
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#D5B46B] font-bold uppercase block">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                    <strong className="text-xs xs:text-sm text-[#FAF5EB] font-black tracking-wider truncate block">
                      {currentOrder.memo}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(currentOrder.memo);
                      setCopiedMemo(true);
                      toast.success('Đã sao chép nội dung chuyển khoản!');
                      setTimeout(() => setCopiedMemo(false), 2000);
                    }}
                    className="flex items-center gap-1 bg-[#D5B46B] text-[#171411] px-2.5 py-1 rounded-md text-[11px] font-black active:scale-95 shrink-0"
                  >
                    {copiedMemo ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedMemo ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Lưu ý thanh toán */}
              <p className="text-[11px] text-[#E8DDC8]/70 leading-relaxed text-center">
                ⚠️ Vui lòng giữ nguyên nội dung <strong>{currentOrder.memo}</strong> để hệ thống nhận diện và cộng xu tự động sau 3 - 5 giây.
              </p>

              {/* Nút hành động */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="flex-1 py-2 rounded-xl border border-[#A87932]/40 bg-[#1e140f] text-xs font-bold text-[#E8DDC8] hover:text-[#FAF5EB] active:scale-95 transition-all"
                >
                  Chọn gói khác
                </button>

                {/* Nút mô phỏng thanh toán nhanh cho môi trường Test / Dev */}
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  title="Thử nghiệm cộng xu ngay lập tức mà không cần chuyển khoản thật"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#D5B46B] to-[#A87932] text-xs font-black text-[#171411] active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
                >
                  <Sparkles size={14} />
                  <span>Tôi đã chuyển khoản</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 3: THÔNG BÁO THÀNH CÔNG RỰC RỠ
              ========================================================================= */}
          {step === 'SUCCESS' && (
            <div className="mt-4 flex flex-col items-center justify-center text-center p-4">
              <span className="flex size-16 items-center justify-center rounded-3xl border-2 border-[#D5B46B] bg-gradient-to-br from-[#D5B46B]/30 via-[#8E2926]/40 to-[#171411] text-[#D5B46B] shadow-[0_0_24px_rgba(213,180,107,0.5)] mb-3 animate-bounce">
                <Crown size={36} />
              </span>

              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#D5B46B]">
                GIAO DỊCH HOÀN TẤT
              </span>
              <h3 className="text-xl font-black text-[#FAF5EB] mt-1">
                Cảm Ơn Bạn Đã Ủng Hộ Server!
              </h3>
              <p className="text-xs text-[#E8DDC8]/80 mt-1 max-w-sm leading-relaxed">
                Sự đồng hành của bạn là nguồn động lực to lớn giúp WindHub tiếp tục duy trì và phát triển thêm nhiều trò chơi thú vị!
              </p>

              {/* Thẻ phần thưởng xu */}
              <div className="my-4 flex items-center gap-2 rounded-2xl border border-[#D5B46B]/60 bg-gradient-to-r from-[#382218] via-[#4a2e21] to-[#382218] px-5 py-3 shadow-lg">
                <HeritageCoinIcon size={26} className="text-[#D5B46B]" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-[#D5B46B] block">Quà tri ân vào ví:</span>
                  <span className="font-mono text-xl font-black text-[#FAF5EB]">
                    +{(currentOrder?.rewardCoins || selectedPkg.rewardCoins).toLocaleString()} xu
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-xs py-2.5 rounded-xl bg-gradient-to-r from-[#D5B46B] via-[#E8CD8C] to-[#A87932] text-sm font-black text-[#171411] shadow-lg active:scale-95 transition-all"
              >
                Vào Bàn Chơi Ngay
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

