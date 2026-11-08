// src/services/firebaseWallet.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase.js';

export const DAILY_REWARD_AMOUNTS = [5000, 10000, 15000, 25000, 40000, 60000, 100000];
const DAILY_STORAGE_KEY_PREFIX = 'windhub_daily_reward_';

let hasLoggedRulesWarning = false;
function notifyRulesWarningOnce() {
  if (hasLoggedRulesWarning) return;
  hasLoggedRulesWarning = true;
  console.info(
    '%c[FirebaseWallet] Lưu ý: Firestore Rules chưa cấp quyền collection "players" trên Firebase Cloud.\n' +
    '👉 Hệ thống đang tự động kích hoạt bộ nhớ bền vững LocalStorage để bảo toàn 100% số dư.\n' +
    '👉 Để lưu trực tiếp lên Cloud Firestore, bạn chỉ cần mở: https://console.firebase.google.com/project/windhub1407/firestore/rules và thêm:\n' +
    '   match /players/{userId} { allow read, write: if true; }',
    'color: #f59e0b; font-weight: 500;'
  );
}

export function getStoredDailyReward(uid) {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(`${DAILY_STORAGE_KEY_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveStoredDailyReward(uid, dailyData) {
  if (!uid || !dailyData) return;
  try {
    localStorage.setItem(`${DAILY_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(dailyData));
  } catch {}
}

// Lấy ngày hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh: YYYY-MM-DD)
export function getVietnamDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

// Tính ngày hôm qua theo múi giờ Việt Nam
export function getYesterdayVietnamDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getVietnamDateString(d);
}

/**
 * Chuẩn hóa trạng thái Daily Reward theo thời gian thực chuẩn múi giờ Việt Nam
 */
export function formatDailyRewardState(daily = {}) {
  const today = getVietnamDateString();
  const yesterday = getYesterdayVietnamDateString();
  const lastClaimed = daily.lastClaimedDate || '';
  const claimedToday = lastClaimed === today;
  const canClaimToday = !claimedToday;

  let currentStreak = daily.currentStreak || 0;
  let nextStreakDay = 1;

  if (lastClaimed === today) {
    nextStreakDay = (currentStreak % 7) + 1;
  } else if (lastClaimed === yesterday) {
    nextStreakDay = (currentStreak % 7) + 1;
  } else {
    // Nếu chưa điểm danh hôm nay và ngày cuối không phải hôm qua -> streak bị reset về ngày 1
    nextStreakDay = 1;
  }

  const rewardAmount = DAILY_REWARD_AMOUNTS[nextStreakDay - 1] || 5000;

  return {
    ...daily,
    currentStreak: claimedToday ? currentStreak : (lastClaimed === yesterday ? currentStreak : 0),
    claimedToday,
    canClaimToday,
    canClaim: canClaimToday,
    nextStreakDay,
    streakDay: nextStreakDay,
    nextRewardAmount: rewardAmount,
    rewardAmount,
    amount: rewardAmount
  };
}

/**
 * Khởi tạo hoặc lấy thông tin hồ sơ và ví của người chơi trên Firestore
 */
export async function getOrCreatePlayerWallet(user) {
  if (!user || !user.uid) return null;

  try {
    const playerRef = doc(db, 'players', user.uid);
    const snap = await getDoc(playerRef);

    if (snap.exists()) {
      const data = snap.data();
      // Cập nhật thông tin profile mới nhất nếu có thay đổi
      const updates = {};
      if (user.displayName && data.displayName !== user.displayName) updates.displayName = user.displayName;
      if (user.photoURL && data.avatarUrl !== user.photoURL) updates.avatarUrl = user.photoURL;
      if (user.email && data.email !== user.email) updates.email = user.email;
      updates.lastLoginAt = Date.now();

      let currentBal = typeof data.balance === 'number' ? data.balance : 0;
      let shouldSyncToFirestore = false;
      try {
        const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`) || localStorage.getItem('windhub_dev_balance');
        if (stored && !isNaN(Number(stored))) {
          const sNum = Number(stored);
          if (sNum > currentBal) {
            currentBal = sNum;
            updates.balance = currentBal;
            shouldSyncToFirestore = true;
          }
        }
      } catch {}

      // Nếu trong Firestore chưa có trường balance, bổ sung ngay lập tức
      if (typeof data.balance !== 'number') {
        updates.balance = currentBal || 10000;
        currentBal = updates.balance;
        shouldSyncToFirestore = true;
      }

      if (Object.keys(updates).length > 0 || shouldSyncToFirestore) {
        updates.updatedAt = Date.now();
        await setDoc(playerRef, updates, { merge: true }).catch((err) => {
          if (err?.code === 'permission-denied') {
            notifyRulesWarningOnce();
          }
        });
      }
      if (data.dailyReward) {
        saveStoredDailyReward(user.uid, data.dailyReward);
      }
      try {
        localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(currentBal));
        localStorage.setItem('windhub_dev_balance', String(currentBal));
      } catch {}
      return { ...data, ...updates, balance: currentBal };
    }

    // Tài khoản mới: Tặng ngay 10,000 xu tân thủ khởi nghiệp
    const initialBalance = 10000;
    const now = Date.now();
    const newPlayerData = {
      userId: user.uid,
      googleSub: user.providerData?.[0]?.uid || user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Người Chơi',
      avatarUrl: user.photoURL || '',
      balance: initialBalance,
      dailyReward: {
        currentStreak: 0,
        lastClaimedDate: '',
        updatedAt: now
      },
      stats: {
        totalBets: 0,
        totalBetAmount: 0,
        totalWon: 0,
        winCount: 0
      },
      createdAt: now,
      lastLoginAt: now
    };

    await setDoc(playerRef, newPlayerData);
    saveStoredDailyReward(user.uid, newPlayerData.dailyReward);
    try {
      localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(initialBalance));
      localStorage.setItem('windhub_dev_balance', String(initialBalance));
    } catch {}

    // Ghi nhật ký giao dịch đầu tiên
    try {
      const txCol = collection(db, 'players', user.uid, 'transactions');
      await addDoc(txCol, {
        id: `tx_init_${user.uid}_${now}`,
        type: 'INITIAL',
        amount: initialBalance,
        balanceAfter: initialBalance,
        description: 'Tặng vốn khởi nghiệp tân thủ 10,000 xu',
        createdAt: now
      });
    } catch {}

    return newPlayerData;
  } catch (err) {
    if (err?.code === 'permission-denied') {
      notifyRulesWarningOnce();
    } else {
      console.warn('[FirebaseWallet] Error accessing wallet in Firestore:', err?.message || err);
    }
    // Fallback ví cục bộ để người chơi không bị gián đoạn trải nghiệm
    let localBalance = 10000;
    try {
      const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`) || localStorage.getItem('windhub_dev_balance');
      if (stored && !isNaN(Number(stored))) localBalance = Number(stored);
    } catch {}

    const storedDaily = getStoredDailyReward(user.uid) || {
      currentStreak: 0,
      lastClaimedDate: '',
      updatedAt: Date.now()
    };

    return {
      userId: user.uid,
      displayName: user.displayName || 'Người Chơi',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      balance: localBalance,
      dailyReward: storedDaily,
      stats: {
        totalBets: 0,
        totalBetAmount: 0,
        totalWon: 0,
        winCount: 0
      },
      isOfflineFallback: true
    };
  }
}

/**
 * Lắng nghe cập nhật số dư và ví theo thời gian thực (Real-time Firestore)
 */
export function subscribeToPlayerWallet(uid, callback) {
  if (!uid) return () => {};
  const playerRef = doc(db, 'players', uid);
  return onSnapshot(playerRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        ...data,
        dailyReward: formatDailyRewardState(data.dailyReward)
      });
    }
  }, (err) => {
    if (err?.code === 'permission-denied') {
      notifyRulesWarningOnce();
    } else {
      console.warn('[FirebaseWallet] subscribe error:', err);
    }
  });
}

/**
 * Cộng xu vào ví người chơi (Atomic Firestore Transaction)
 */
export async function creditPlayerWallet(uid, amount, { type = 'PAYOUT', description = '', txId = null } = {}) {
  if (!uid) throw new Error('Missing uid');
  const creditAmount = Math.max(0, parseInt(amount, 10) || 0);
  if (creditAmount === 0) return { success: true, balance: 0 };

  const playerRef = doc(db, 'players', uid);

  try {
    return await runTransaction(db, async (transaction) => {
      const playerDoc = await transaction.get(playerRef);
      if (!playerDoc.exists()) {
        throw new Error('Player wallet not found');
      }

      const currentBalance = Number(playerDoc.data().balance) || 0;
      const newBalance = currentBalance + creditAmount;
      const now = Date.now();

      transaction.update(playerRef, {
        balance: newBalance,
        updatedAt: now
      });

      const finalTxId = txId || `tx_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txRef = doc(db, 'players', uid, 'transactions', finalTxId);
      transaction.set(txRef, {
        id: finalTxId,
        type,
        amount: creditAmount,
        balanceAfter: newBalance,
        description: description || 'Cộng điểm ví',
        createdAt: now
      });

      try {
        localStorage.setItem(`windhub_wallet_balance_${uid}`, String(newBalance));
        localStorage.setItem('windhub_dev_balance', String(newBalance));
      } catch {}

      return {
        success: true,
        balance: newBalance,
        txId: finalTxId
      };
    });
  } catch (err) {
    if (err?.code === 'permission-denied') {
      console.warn('[FirebaseWallet] Firestore permission-denied. Fallback sang local storage.');
      const current = Number(localStorage.getItem(`windhub_wallet_balance_${uid}`)) || Number(localStorage.getItem('windhub_dev_balance')) || 0;
      const newBalance = current + creditAmount;
      try {
        localStorage.setItem(`windhub_wallet_balance_${uid}`, String(newBalance));
        localStorage.setItem('windhub_dev_balance', String(newBalance));
      } catch {}
      return { success: true, balance: newBalance };
    }
    throw err;
  }
}

/**
 * Trừ xu trong ví khi đặt cược (Atomic Firestore Transaction)
 */
export async function debitPlayerWallet(uid, amount, { type = 'BET', description = '', txId = null } = {}) {
  if (!uid) throw new Error('Missing uid');
  const debitAmount = Math.max(0, parseInt(amount, 10) || 0);
  if (debitAmount === 0) return { success: true, balance: 0 };

  const playerRef = doc(db, 'players', uid);

  try {
    return await runTransaction(db, async (transaction) => {
      const playerDoc = await transaction.get(playerRef);
      if (!playerDoc.exists()) {
        return { success: false, code: 'NOT_FOUND', message: 'Không tìm thấy ví người chơi.' };
      }

      const currentBalance = Number(playerDoc.data().balance) || 0;
      if (currentBalance < debitAmount) {
        return {
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          balance: currentBalance,
          message: 'Số dư xu không đủ để thực hiện giao dịch.'
        };
      }

      const newBalance = currentBalance - debitAmount;
      const now = Date.now();

      transaction.update(playerRef, {
        balance: newBalance,
        updatedAt: now
      });

      const finalTxId = txId || `tx_bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const txRef = doc(db, 'players', uid, 'transactions', finalTxId);
      transaction.set(txRef, {
        id: finalTxId,
        type,
        amount: -debitAmount,
        balanceAfter: newBalance,
        description: description || 'Đặt cược',
        createdAt: now
      });

      try {
        localStorage.setItem(`windhub_wallet_balance_${uid}`, String(newBalance));
        localStorage.setItem('windhub_dev_balance', String(newBalance));
      } catch {}

      return {
        success: true,
        balance: newBalance,
        txId: finalTxId
      };
    });
  } catch (err) {
    if (err?.code === 'permission-denied') {
      console.warn('[FirebaseWallet] Firestore permission-denied trong debit. Fallback sang local storage.');
      const current = Number(localStorage.getItem(`windhub_wallet_balance_${uid}`)) || Number(localStorage.getItem('windhub_dev_balance')) || 0;
      if (current < debitAmount) {
        return {
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          balance: current,
          message: 'Số dư xu không đủ.'
        };
      }
      const newBalance = current - debitAmount;
      try {
        localStorage.setItem(`windhub_wallet_balance_${uid}`, String(newBalance));
        localStorage.setItem('windhub_dev_balance', String(newBalance));
      } catch {}
      return { success: true, balance: newBalance };
    }
    throw err;
  }
}

/**
 * Điểm danh nhận thưởng 7 ngày chuẩn múi giờ Việt Nam (Atomic Firestore Transaction)
 */
export async function claimFirebaseDailyReward(uid) {
  if (!uid) throw new Error('Missing uid');
  const today = getVietnamDateString();
  const yesterday = getYesterdayVietnamDateString();

  // 1. Kiểm tra cache localStorage: Đã nhận hôm nay thì chặn ngay lập tức, chống lặp vô hạn khi reload web
  const cachedDaily = getStoredDailyReward(uid);
  if (cachedDaily && cachedDaily.lastClaimedDate === today) {
    return {
      success: false,
      code: 'ALREADY_CLAIMED',
      message: 'Hôm nay bạn đã điểm danh nhận quà rồi! Hãy quay lại vào ngày mai nhé.'
    };
  }

  const playerRef = doc(db, 'players', uid);

  try {
    const res = await runTransaction(db, async (transaction) => {
      const playerDoc = await transaction.get(playerRef);
      if (!playerDoc.exists()) {
        throw new Error('Player not found');
      }

      const data = playerDoc.data();
      const daily = data.dailyReward || {};
      const lastClaimed = daily.lastClaimedDate || cachedDaily?.lastClaimedDate || '';

      if (lastClaimed === today) {
        return {
          success: false,
          code: 'ALREADY_CLAIMED',
          message: 'Hôm nay bạn đã điểm danh nhận quà rồi! Hãy quay lại vào ngày mai nhé.'
        };
      }

      let nextStreak = 1;
      if (lastClaimed === yesterday) {
        nextStreak = ((daily.currentStreak || cachedDaily?.currentStreak || 0) % 7) + 1;
      } else {
        nextStreak = 1; // Bỏ lỡ một ngày -> reset streak về ngày 1
      }

      const rewardAmount = DAILY_REWARD_AMOUNTS[nextStreak - 1] || 5000;
      const currentBalance = Number(data.balance) || 0;
      const newBalance = currentBalance + rewardAmount;
      const now = Date.now();

      const updatedDailyReward = {
        currentStreak: nextStreak,
        lastClaimedDate: today,
        canClaimToday: false,
        claimedToday: true,
        rewardAmount,
        updatedAt: now
      };

      transaction.update(playerRef, {
        balance: newBalance,
        dailyReward: updatedDailyReward,
        updatedAt: now
      });

      const txId = `tx_daily_${uid}_${today}`;
      const txRef = doc(db, 'players', uid, 'transactions', txId);
      transaction.set(txRef, {
        id: txId,
        type: 'DAILY_REWARD',
        amount: rewardAmount,
        balanceAfter: newBalance,
        description: `Điểm danh Ngày ${nextStreak} (+${rewardAmount.toLocaleString()} xu)`,
        createdAt: now
      });

      return {
        success: true,
        amount: rewardAmount,
        streakDay: nextStreak,
        newBalance,
        dailyReward: formatDailyRewardState(updatedDailyReward)
      };
    });

    if (res && res.success) {
      saveStoredDailyReward(uid, {
        currentStreak: res.streakDay,
        lastClaimedDate: today,
        updatedAt: Date.now()
      });
      try {
        localStorage.setItem('windhub_dev_balance', String(res.newBalance));
      } catch {}
    }
    return res;
  } catch (err) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
      console.warn('[FirebaseWallet] Firestore permission-denied. Fallback sang local storage.');
      const prevStreak = cachedDaily?.lastClaimedDate === yesterday ? (cachedDaily.currentStreak || 0) : 0;
      const nextStreak = (prevStreak % 7) + 1;
      const rewardAmount = DAILY_REWARD_AMOUNTS[nextStreak - 1] || 5000;

      const current = Number(localStorage.getItem('windhub_dev_balance')) || 10000;
      const newBalance = current + rewardAmount;
      try {
        localStorage.setItem('windhub_dev_balance', String(newBalance));
      } catch {}

      const localDaily = {
        currentStreak: nextStreak,
        lastClaimedDate: today,
        updatedAt: Date.now()
      };
      saveStoredDailyReward(uid, localDaily);

      return {
        success: true,
        amount: rewardAmount,
        streakDay: nextStreak,
        newBalance,
        dailyReward: formatDailyRewardState(localDaily)
      };
    }
    throw err;
  }
}

/**
 * Đặt số dư cụ thể (cho DevTools)
 */
export async function setPlayerBalanceInFirestore(uid, targetBalance) {
  if (!uid) return;
  const val = Math.max(0, parseInt(targetBalance, 10) || 0);
  const now = Date.now();
  try {
    localStorage.setItem(`windhub_wallet_balance_${uid}`, String(val));
    localStorage.setItem('windhub_dev_balance', String(val));
  } catch {}
  try {
    const playerRef = doc(db, 'players', uid);
    await setDoc(playerRef, {
      balance: val,
      updatedAt: now
    }, { merge: true });
    console.info(`[FirebaseWallet] Đã đồng bộ số dư ${val.toLocaleString()} xu lên Firestore thành công.`);
  } catch (err) {
    if (err?.code === 'permission-denied') {
      notifyRulesWarningOnce();
    } else {
      console.warn('[FirebaseWallet] setPlayerBalanceInFirestore error:', err?.message || err);
    }
  }
  return val;
}

/**
 * Lấy lịch sử giao dịch ví của người chơi từ Firestore
 */
export async function fetchPlayerTransactionsFromFirestore(uid, limitCount = 50) {
  if (!uid) return [];
  try {
    const txCol = collection(db, 'players', uid, 'transactions');
    const q = query(txCol, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    return list;
  } catch (err) {
    console.warn('[FirebaseWallet] fetchTransactions error:', err);
    return [];
  }
}

