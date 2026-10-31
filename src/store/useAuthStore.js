import { create } from 'zustand';
import {
  loginWithGoogleApi,
  logoutPlayerApi,
  fetchCurrentPlayerProfile,
  claimDailyRewardApi,
  getStoredSessionToken,
  setStoredSessionToken
} from '@/services/playerApi';

export const useAuthStore = create((set, get) => ({
  // Firebase Admin Auth (cho File Manager)
  user: null,
  isAdmin: false,
  isLoading: true,
  setAuth: (user, isAdmin) => set({ user, isAdmin, isLoading: false }),

  // Google Player Auth & Xu Wallet (cho Tài Xỉu)
  player: null,
  isPlayerAuthenticated: false,
  isPlayerLoading: true,
  betBalance: 0,
  dailyReward: null,
  playerStats: null,

  setPlayerAuth: (data) => {
    if (!data || !data.user) {
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
    set({
      player: data.user,
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: data.balance ?? get().betBalance,
      dailyReward: data.dailyReward ?? get().dailyReward,
      playerStats: data.stats ?? get().playerStats
    });
  },

  updateBetBalance: (newBalance) => {
    if (typeof newBalance === 'number') {
      set({ betBalance: newBalance });
    }
  },

  initPlayerAuth: async () => {
    const token = getStoredSessionToken();
    if (!token) {
      set({ isPlayerLoading: false });
      return;
    }

    try {
      set({ isPlayerLoading: true });
      const data = await fetchCurrentPlayerProfile();
      if (data && data.authenticated && data.user) {
        set({
          player: data.user,
          isPlayerAuthenticated: true,
          isPlayerLoading: false,
          betBalance: data.balance ?? 0,
          dailyReward: data.dailyReward ?? null,
          playerStats: data.stats ?? null
        });
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
      set({
        player: res.user,
        isPlayerAuthenticated: true,
        isPlayerLoading: false,
        betBalance: res.balance ?? 0,
        dailyReward: res.dailyReward ?? null
      });
    }
    return res;
  },

  logoutPlayer: async () => {
    try {
      await logoutPlayerApi();
    } catch {}
    set({
      player: null,
      isPlayerAuthenticated: false,
      isPlayerLoading: false,
      betBalance: 0,
      dailyReward: null,
      playerStats: null
    });
  },

  claimReward: async () => {
    const res = await claimDailyRewardApi();
    if (res.success) {
      set({
        betBalance: res.newBalance ?? get().betBalance,
        dailyReward: res.dailyReward ?? get().dailyReward
      });
    }
    return res;
  }
}));
