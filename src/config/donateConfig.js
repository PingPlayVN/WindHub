// src/config/donateConfig.js
/**
 * Cấu hình hệ thống Ủng hộ (Donate) Server & Tặng Xu Tri Ân
 * Tích hợp chuẩn VietQR và cổng Webhook ngân hàng tự động (SePay.vn)
 */
export const DONATE_CONFIG = {
  // THÔNG TIN TÀI KHOẢN NGÂN HÀNG CỦA ADMIN (DÙNG ĐỂ TẠO MÃ VIETQR)
  bank: {
    // Mã ngân hàng theo chuẩn Napas/VietQR: MB (MBBank)
    bankId: 'MB',
    // Số tài khoản MBBank chính thức của bạn
    accountNo: '0908140709',
    // Tên chủ tài khoản (in hoa không dấu theo chuẩn ngân hàng)
    accountName: 'TRINH GIA PHONG',
    // Tên hiển thị cửa hàng / quỹ donate
    storeName: 'DONATE NUÔI SỐNG SERVER',
  },

  // DANH SÁCH GÓI ỦNG HỘ (ƯU TIÊN 2 MỐC 10K & 20K THEO YÊU CẦU)
  packages: [
    {
      id: 'pkg_10k',
      amountVnd: 10000,
      rewardCoins: 100000, // 1k = 10k xu
      bonusCoins: 0,
      bonusPercent: 0,
      title: 'Ly Cà Phê Đá',
      tag: 'Cơ bản',
      icon: '☕',
      badgeColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
      description: 'Góp kinh phí ly cà phê duy trì hosting • Nhận 100.000 xu'
    },
    {
      id: 'pkg_20k',
      amountVnd: 20000,
      rewardCoins: 250000, // Tặng thêm 50k xu (+25%)
      bonusCoins: 50000,
      bonusPercent: 25,
      title: 'Bữa Sáng Ấm Lòng',
      tag: 'Thưởng +25%',
      icon: '🥐',
      badgeColor: 'border-[#D5B46B] bg-gradient-to-r from-[#8E2926]/60 to-[#A87932]/40 text-[#FAF5EB]',
      description: 'Góp kinh phí bữa sáng cho admin • Nhận 250.000 xu (Thưởng thêm 25%)'
    }
  ],

  // Tiền tố nội dung chuyển khoản (Không dấu, viết liền): WINDHUB <MÃ_ĐƠN>
  memoPrefix: 'WINDHUB',

  // Cấu hình Webhook SePay (nếu dùng cloudflare-worker)
  webhookUrl: 'https://windhub-worker.trinhgiaphong2k9.workers.dev/api/donate/webhook',
};

/**
 * Sinh link ảnh mã VietQR chuẩn động (Dynamic VietQR EMVCo Napas247).
 * Chuẩn này tự động nhúng Tag 62.08 (Nội dung CK) vào mã QR, giúp 100% App ngân hàng
 * (MB, VCB, Techcom, VPBank, Momo, v.v.) tự động điền sẵn cả STK, Tên, Số tiền và Nội dung CK!
 */
export function buildVietQrUrl({ bankId, accountNo, accountName, amount, memo }) {
  const bId = (bankId || DONATE_CONFIG.bank.bankId) === 'MBBank' ? 'MB' : (bankId || DONATE_CONFIG.bank.bankId);
  const accNo = accountNo || DONATE_CONFIG.bank.accountNo;
  const holder = encodeURIComponent(accountName || DONATE_CONFIG.bank.accountName);
  const encMemo = encodeURIComponent(memo || '');

  // Chuẩn VietQR chính thức của Napas247 (img.vietqr.io)
  // Tham số addInfo chính là nội dung chuyển khoản tự động điền vào App ngân hàng!
  return `https://img.vietqr.io/image/${bId}-${accNo}-compact2.png?amount=${amount}&addInfo=${encMemo}&accountName=${holder}`;
}


