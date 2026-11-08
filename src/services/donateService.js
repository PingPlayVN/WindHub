// src/services/donateService.js
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';
import { DONATE_CONFIG } from '@/config/donateConfig.js';
import { creditPlayerWallet } from './firebaseWallet.js';

/**
 * Sinh mã đơn hàng ngẫu nhiên gồm 6 chữ số (dễ nhập trên ứng dụng ngân hàng)
 */
function generateOrderCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Tạo một đơn ủng hộ mới trên Firestore
 */
export async function createDonateOrder(user, packageItem) {
  if (!user || !user.uid) throw new Error('Yêu cầu đăng nhập để tạo đơn ủng hộ.');
  if (!packageItem) throw new Error('Vui lòng chọn gói ủng hộ.');

  const orderCode = generateOrderCode();
  const orderId = `DON_${Date.now()}_${orderCode}`;
  const memo = `${DONATE_CONFIG.memoPrefix} ${orderCode}`;
  const now = Date.now();

  const orderData = {
    orderId,
    orderCode,
    memo,
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName || 'Người Chơi',
    packageId: packageItem.id,
    amountVnd: packageItem.amountVnd,
    rewardCoins: packageItem.rewardCoins,
    bonusCoins: packageItem.bonusCoins || 0,
    status: 'PENDING', // 'PENDING' | 'COMPLETED' | 'CANCELLED'
    createdAt: now,
    completedAt: null,
  };

  try {
    const orderRef = doc(db, 'donate_orders', orderId);
    await setDoc(orderRef, orderData);
  } catch (err) {
    console.warn('[DonateService] Không thể ghi đơn lên Firestore (có thể do rules), fallback sang local session:', err?.message || err);
  }

  // Lưu tạm vào localStorage để phục vụ kiểm tra ngoại tuyến
  try {
    sessionStorage.setItem(`windhub_current_donate_${orderId}`, JSON.stringify(orderData));
  } catch {}

  return orderData;
}

/**
 * Lắng nghe trạng thái đơn hàng thời gian thực từ Firestore
 */
export function subscribeDonateOrder(orderId, onStatusChange) {
  if (!orderId) return () => {};

  try {
    const orderRef = doc(db, 'donate_orders', orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onStatusChange(data);
      }
    }, (err) => {
      console.warn('[DonateService] onSnapshot listener warning:', err?.message);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Hoàn tất đơn ủng hộ và cộng xu vào ví người chơi
 */
export async function processCompletedDonateOrder(orderId, transactionMeta = {}) {
  let orderData = null;
  const orderRef = doc(db, 'donate_orders', orderId);

  try {
    const snap = await getDoc(orderRef);
    if (snap.exists()) {
      orderData = snap.data();
    }
  } catch {}

  if (!orderData) {
    try {
      const raw = sessionStorage.getItem(`windhub_current_donate_${orderId}`);
      if (raw) orderData = JSON.parse(raw);
    } catch {}
  }

  if (!orderData) {
    throw new Error('Không tìm thấy thông tin đơn ủng hộ.');
  }

  if (orderData.status === 'COMPLETED') {
    return { success: true, message: 'Đơn này đã được xử lý thành công trước đó.' };
  }

  // 1. Cộng xu vào ví authoritative của người chơi (Firebase Wallet)
  const creditResult = await creditPlayerWallet(orderData.userId, orderData.rewardCoins, {
    type: 'DONATE',
    description: `Ủng hộ server gói ${orderData.amountVnd.toLocaleString()}đ (+${orderData.rewardCoins.toLocaleString()} xu)`,
    txId: `tx_donate_${orderId}`
  });

  // 2. Cập nhật trạng thái đơn thành COMPLETED
  const completedAt = Date.now();
  try {
    await updateDoc(orderRef, {
      status: 'COMPLETED',
      completedAt,
      transactionMeta
    });
  } catch {}

  try {
    orderData.status = 'COMPLETED';
    orderData.completedAt = completedAt;
    sessionStorage.setItem(`windhub_current_donate_${orderId}`, JSON.stringify(orderData));
  } catch {}

  return {
    success: true,
    balance: creditResult.balance,
    order: orderData
  };
}

