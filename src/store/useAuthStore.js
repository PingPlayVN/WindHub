import { create } from 'zustand';
import {
  loginWithGoogleApi,
  logoutPlayerApi,
  fetchCurrentPlayerProfile,
  claimDailyRewardApi,
  getStoredSessionToken,
  setStoredSessionToken
} from '@/services/playerApi';
import { isAdminEmail } from '@/services/auth';
import {
  getOrCreatePlayerWallet,
  subscribeToPlayerWallet,
  claimFirebaseDailyReward,
  setPlayerBalanceInFirestore,
  formatDailyRewardState
} from '@/services/firebaseWallet';

let walletUnsubscribe = null;
let currentWalletUid = null;

function syncFirebaseWallet(user, set, get) {
  if (!user || !user.uid) {
    if (walletUnsubscribe) {
      walletUnsubscribe();
      walletUnsubscribe = null;
    }
    currentWalletUid = null;
    return;
  }

  if (currentWalletUid === user.uid && walletUnsubscribe) {
    return;
  }

  if (walletUnsubscribe) {
    walletUnsubscribe();
    walletUnsubscribe = null;
  }
  currentWalletUid = user.uid;

  // Khởi tạo hoặc lấy thông tin ví người chơi trên Firestore
  getOrCreatePlayerWallet(user).then((walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    let balance = typeof walletData.balance === 'number' ? walletData.balance : 0;
    try {
      const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`) || localStorage.getItem('windhub_dev_balance');
      if (stored && !isNaN(Number(stored))) {
        const sNum = Number(stored);
        if (sNum > balance) {
          balance = sNum;
          setPlayerBalanceInFirestore(user.uid, sNum).catch(() => {});
        } else if (balance > sNum) {
          localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
          localStorage.setItem('windhub_dev_balance', String(balance));
        }
      } else if (balance > 0) {
        localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
        localStorage.setItem('windhub_dev_balance', String(balance));
      }
    } catch {}

    set({
      player: {
        userId: user.uid,
        uid: user.uid,
        displayName: walletData.displayName || user.displayName || 'Người Chơi',
        email: playerEmail,
        avatarUrl: walletData.avatarUrl || user.photoURL || '',
        ...walletData
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      dailyReward: formatDailyRewardState(walletData.dailyReward),
      playerStats: walletData.stats || null,
      isAdmin: hasAdminRights
    });

    try {
      localStorage.setItem('windhub_dev_balance', String(balance));
      localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
      localStorage.setItem('windhub_last_user_id', user.uid);
    } catch {}
  }).catch((err) => {
    if (err?.code !== 'permission-denied') {
      console.warn('[FirebaseWallet] Error init wallet:', err);
    }
  });

  // Lắng nghe thay đổi ví theo thời gian thực (Real-time Firestore)
  walletUnsubscribe = subscribeToPlayerWallet(user.uid, (walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    let balance = typeof walletData.balance === 'number' ? walletData.balance : get().betBalance;
    try {
      const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`) || localStorage.getItem('windhub_dev_balance');
      if (stored && !isNaN(Number(stored))) {
        const sNum = Number(stored);
        if (sNum > balance) {
          balance = sNum;
          setPlayerBalanceInFirestore(user.uid, sNum).catch(() => {});
        }
      }
    } catch {}

    set((state) => ({
      player: {
        ...(state.player || {}),
        userId: user.uid,
        uid: user.uid,
        displayName: walletData.displayName || user.displayName || state.player?.displayName || 'Người Chơi',
        email: playerEmail,
        avatarUrl: walletData.avatarUrl || user.photoURL || state.player?.avatarUrl || '',
        ...walletData
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      dailyReward: walletData.dailyReward,
      playerStats: walletData.stats || state.playerStats,
      isAdmin: hasAdminRights
    }));

    try {
      localStorage.setItem('windhub_dev_balance', String(balance));
      localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
      localStorage.setItem('windhub_last_user_id', user.uid);
    } catch {}
  });
}

export const useAuthStore = create((set, get) => ({
  // Firebase Admin Auth (cho File Manager & Toàn hệ thống)
  user: null,
  isAdmin: false,
  isLoading: true,
  setAuth: (user, isAdmin) => {
    const calculatedAdmin = isAdmin ?? isAdminEmail(user?.email);
    set({
      user,
      isAdmin: Boolean(calculatedAdmin),
      isLoading: false
    });

    if (user) {
      syncFirebaseWallet(user, set, get);
    } else {
      if (walletUnsubscribe) {
        walletUnsubscribe();
        walletUnsubscribe = null;
      }
      currentWalletUid = null;
    }
  },

  // Google Player Auth & BET Wallet (cho Tài Xỉu và các Game WindHub)
  player: null,
  isPlayerAuthenticated: false,
  isPlayerLoading: true,
  betBalance: 0,
  dailyReward: null,
  playerStats: null,

  setPlayerAuth: (data) => {
    if (!data || !data.user) {
      if (walletUnsubscribe) {
        walletUnsubscribe();
        walletUnsubscribe = null;
      }
      currentWalletUid = null;
      set({
        player: null,
        isPlayerAuthenticated: false,
        isPlayerLoading: false,
        betBalance: 0,
        dailyReward: null,
        playerStats: null
      });
      return;
    }

    const playerEmail = data.user.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);

    set({
      player: data.user,
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: data.balance ?? get().betBalance,
      dailyReward: data.dailyReward ?? get().dailyReward,
      playerStats: data.stats ?? get().playerStats,
      isAdmin: hasAdminRights
    });
  },

  updateBetBalance: (newBalance) => {
    if (typeof newBalance === 'number') {
      const validBal = Math.max(0, newBalance);
      try {
        localStorage.setItem('windhub_dev_balance', String(validBal));
        const uid = get().user?.uid || get().player?.userId || get().player?.uid || localStorage.getItem('windhub_last_user_id');
        if (uid) {
          localStorage.setItem(`windhub_wallet_balance_${uid}`, String(validBal));
          setPlayerBalanceInFirestore(uid, validBal).catch(() => {});
        }
      } catch {}
      // Trì hoãn sang microtask tiếp theo để an toàn tuyệt đối, không gây xung đột React render cycle
      Promise.resolve().then(() => {
        set({ betBalance: validBal });
      });
    }
  },

  initPlayerAuth: async () => {
    let savedBal = null;
    try {
      const lastUid = localStorage.getItem('windhub_last_user_id');
      const stored = (lastUid ? localStorage.getItem(`windhub_wallet_balance_${lastUid}`) : null) || localStorage.getItem('windhub_dev_balance');
      if (stored && !isNaN(Number(stored))) {
        savedBal = Number(stored);
        set({ betBalance: savedBal });
      }
    } catch {}

    // 1. Kiểm tra Firebase currentUser nếu có sẵn
    try {
      const { auth } = await import('@/services/firebase');
      if (auth.currentUser) {
        syncFirebaseWallet(auth.currentUser, set, get);
        return;
      }
    } catch {}

    // 2. Dự phòng token phiên cũ
    const token = getStoredSessionToken();
    if (!token) {
      set({ isPlayerLoading: false });
      return;
    }

    try {
      set({ isPlayerLoading: true });
      const data = await fetchCurrentPlayerProfile();
      if (data && data.authenticated && data.user) {
        const playerEmail = data.user.email || '';
        const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
        const serverBal = typeof data.balance === 'number' ? data.balance : 0;
        const finalBal = savedBal !== null ? Math.max(serverBal, savedBal) : serverBal;

        set({
          player: data.user,
          isPlayerAuthenticated: true,
          isPlayerLoading: false,
          betBalance: finalBal,
          dailyReward: data.dailyReward ?? null,
          playerStats: data.stats ?? null,
          isAdmin: hasAdminRights
        });
        try {
          localStorage.setItem('windhub_dev_balance', String(finalBal));
        } catch {}
      } else {
        setStoredSessionToken('');
        set({ player: null, isPlayerAuthenticated: false, isPlayerLoading: false });
      }
    } catch {
      setStoredSessionToken('');
      set({ player: null, isPlayerAuthenticated: false, isPlayerLoading: false });
    }
  },

  loginWithGoogle: async (credential) => {
    const res = await loginWithGoogleApi(credential);
    if (res.ok && res.user) {
      const playerEmail = res.user.email || '';
      const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);

      set({
        player: res.user,
        isPlayerAuthenticated: true,
        isPlayerLoading: false,
        betBalance: res.balance ?? 0,
        dailyReward: res.dailyReward ?? null,
        isAdmin: hasAdminRights
      });
    }
    return res;
  },

  logoutPlayer: async () => {
    return get().logout();
  },

  // Đăng xuất hợp nhất toàn diện (cả Firebase và Game Wallet)
  logout: async () => {
    if (walletUnsubscribe) {
      walletUnsubscribe();
      walletUnsubscribe = null;
    }
    currentWalletUid = null;

    try {
      await logoutPlayerApi();
    } catch {}

    try {
      const [{ signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase')
      ]);
      await signOut(auth);
    } catch {}

    setStoredSessionToken('');
    set({
      user: null,
      isAdmin: false,
      player: null,
      isPlayerAuthenticated: false,
      isPlayerLoading: false,
      betBalance: 0,
      dailyReward: null,
      playerStats: null
    });
  },

  claimDailyReward: async () => {
    const uid = get().user?.uid || get().player?.userId || get().player?.uid;
    if (uid) {
      try {
        const res = await claimFirebaseDailyReward(uid);
        if (res && res.success) {
          set({
            betBalance: res.newBalance,
            dailyReward: res.dailyReward
          });
          return {
            ok: true,
            success: true,
            newBalance: res.newBalance,
            balance: res.newBalance,
            amount: res.amount,
            rewardAmount: res.amount,
            streakDay: res.streakDay,
            dailyReward: res.dailyReward
          };
        }
        return { ok: false, success: false, message: res?.message || 'Không thể nhận thưởng hôm nay.' };
      } catch (err) {
        return { ok: false, success: false, message: err.message || 'Lỗi nhận thưởng' };
      }
    }

    const res = await claimDailyRewardApi();
    if (res.success || res.ok) {
      const balance = typeof res.newBalance === 'number' ? res.newBalance : (res.balance ?? get().betBalance);
      set((state) => ({
        betBalance: balance,
        dailyReward: res.dailyReward || {
          ...state.dailyReward,
          canClaimToday: false,
          claimedToday: true,
          canClaim: false,
          currentStreak: res.streakDay ?? state.dailyReward?.currentStreak,
          streakDay: res.streakDay,
          rewardAmount: res.amount || res.rewardAmount,
          amount: res.amount || res.rewardAmount,
          nextRewardTime: res.nextRewardTime,
          history: [
            ...(state.dailyReward?.history || []),
            {
              claimedAt: new Date().toISOString(),
              amount: res.amount || res.rewardAmount,
              streakDay: res.streakDay
            }
          ]
        }
      }));
    }
    return res;
  },

  claimReward: async () => {
    return get().claimDailyReward();
  }
}));
