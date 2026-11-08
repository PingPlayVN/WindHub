// src/utils/devTools.js
import { useAuthStore } from '@/store/useAuthStore';
import { creditPlayerWallet, setPlayerBalanceInFirestore } from '@/services/firebaseWallet';

export function setupDevTools() {
  if (typeof window === 'undefined') return;

  window.get_user_id = () => {
    const store = useAuthStore.getState();
    const userId = store.user?.uid || store.player?.userId || store.player?.uid || localStorage.getItem('windhub_last_user_id') || 'guest_player';
    console.log('%c[WindHub DevTools] User ID: %c' + userId, 'color: #D5B46B; font-weight: bold;', 'color: #38bdf8; font-weight: bold;');
    return userId;
  };
  window.getUserId = window.get_user_id;

  window.get_money = async (arg1, arg2) => {
    let userId = '';
    let amount = 50000;

    if (typeof arg1 === 'number') {
      amount = arg1;
      userId = window.get_user_id();
    } else if (typeof arg1 === 'string') {
      userId = arg1;
      amount = typeof arg2 === 'number' ? arg2 : 50000;
    } else {
      userId = window.get_user_id();
    }

    console.log(`%c[WindHub DevTools] Đang cộng +${amount.toLocaleString()} xu cho ${userId} trên Firebase Firestore...`, 'color: #38bdf8;');

    // 1. Thử ghi trực tiếp vào Firebase Firestore
    if (userId && userId !== 'guest_player') {
      try {
        const res = await creditPlayerWallet(userId, amount, {
          type: 'DEV_CREDIT',
          description: `Admin DevTools cộng +${amount.toLocaleString()} xu`
        });
        if (res && typeof res.balance === 'number') {
          useAuthStore.getState().updateBetBalance(res.balance);
          try {
            localStorage.setItem('windhub_dev_balance', String(res.balance));
          } catch {}
          console.log(`%c[WindHub DevTools] Thành công! Số dư ví Firestore của ${userId}: ${res.balance.toLocaleString()} xu. (Đã lưu Firebase & F5 không mất)`, 'color: #4ade80; font-weight: bold;');
          return res.balance;
        }
      } catch (fbErr) {
        console.warn('[WindHub DevTools] Firebase credit error:', fbErr);
      }
    }

    // 2. Fallback nếu không có Firestore user
    const current = useAuthStore.getState().betBalance || 0;
    const newBal = current + amount;
    useAuthStore.getState().updateBetBalance(newBal);
    try {
      localStorage.setItem('windhub_dev_balance', String(newBal));
    } catch {}
    console.log(`%c[WindHub DevTools] Đã cập nhật số dư client: ${newBal.toLocaleString()} xu. (Đã lưu bộ nhớ F5 không mất)`, 'color: #fbbf24; font-weight: bold;');
    return newBal;
  };
  window.getMoney = window.get_money;

  window.set_money = async (amount = 100000) => {
    const userId = window.get_user_id();
    console.log(`%c[WindHub DevTools] Đang đặt số dư ví ${userId} = ${amount.toLocaleString()} xu trên Firebase Firestore...`, 'color: #38bdf8;');

    if (userId && userId !== 'guest_player') {
      try {
        await setPlayerBalanceInFirestore(userId, amount);
        useAuthStore.getState().updateBetBalance(amount);
        try {
          localStorage.setItem('windhub_dev_balance', String(amount));
        } catch {}
        console.log(`%c[WindHub DevTools] Thành công! Số dư ví Firestore của ${userId} = ${amount.toLocaleString()} xu. (F5 không mất)`, 'color: #4ade80; font-weight: bold;');
        return amount;
      } catch (err) {
        console.warn('[WindHub DevTools] Firebase set error:', err);
      }
    }

    useAuthStore.getState().updateBetBalance(amount);
    try {
      localStorage.setItem('windhub_dev_balance', String(amount));
    } catch {}
    return amount;
  };
  window.setMoney = window.set_money;

  window.dev_help = () => {
    console.log(
      '%c🎮 WINDHUB CONSOLE DEV COMMANDS:\n' +
      '%c• get_user_id()%c : Lấy mã User ID hiện tại\n' +
      '%c• get_money(50000)%c : Cộng thêm xu vào ví (vd: get_money(50000))\n' +
      '%c• get_money(userId, 50000)%c : Cộng xu cho một User ID cụ thể\n' +
      '%c• set_money(100000)%c : Đặt số dư ví về con số mong muốn (vd: set_money(100000))\n',
      'color: #D5B46B; font-weight: bold; font-size: 14px;',
      'color: #38bdf8; font-weight: bold;', 'color: #FAF5EB;',
      'color: #38bdf8; font-weight: bold;', 'color: #FAF5EB;',
      'color: #38bdf8; font-weight: bold;', 'color: #FAF5EB;',
      'color: #38bdf8; font-weight: bold;', 'color: #FAF5EB;'
    );
  };

  console.log(
    '%c[WindHub] DevTools ready. Gõ %cdev_help()%c hoặc %cget_money(50000)%c để cấp xu.',
    'color: #94a3b8;',
    'color: #D5B46B; font-weight: bold;',
    'color: #94a3b8;',
    'color: #D5B46B; font-weight: bold;',
    'color: #94a3b8;'
  );
}

