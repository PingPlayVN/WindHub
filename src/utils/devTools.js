// src/utils/devTools.js
import { useAuthStore } from '@/store/useAuthStore';
import { getWorkerBaseUrl, getStoredSessionToken } from '@/services/playerApi';

export function setupDevTools() {
  if (typeof window === 'undefined') return;

  window.get_user_id = () => {
    const store = useAuthStore.getState();
    const userId = store.player?.userId || localStorage.getItem('windhub_last_user_id') || 'guest_player';
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

    console.log(`%c[WindHub DevTools] Đang cộng +${amount.toLocaleString()} xu cho ${userId}...`, 'color: #38bdf8;');

    try {
      const baseUrl = getWorkerBaseUrl();
      const token = getStoredSessionToken();
      const res = await fetch(`${baseUrl}/api/wallet/dev-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, amount })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.balance === 'number') {
        useAuthStore.getState().updateBetBalance(data.balance);
        console.log(`%c[WindHub DevTools] Thành công! Số dư ví của ${userId}: ${data.balance.toLocaleString()} xu.`, 'color: #4ade80; font-weight: bold;');
        return data.balance;
      }
    } catch {
      // Fallback: update client store optimistically if worker endpoint is not reachable
    }

    const current = useAuthStore.getState().betBalance || 0;
    const newBal = current + amount;
    useAuthStore.getState().updateBetBalance(newBal);
    console.log(`%c[WindHub DevTools] Đã cập nhật số dư client: ${newBal.toLocaleString()} xu.`, 'color: #fbbf24; font-weight: bold;');
    return newBal;
  };
  window.getMoney = window.get_money;

  window.set_money = async (amount = 100000) => {
    const cur = useAuthStore.getState().betBalance || 0;
    const delta = amount - cur;
    return window.get_money(delta);
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

