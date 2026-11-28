import { create } from 'zustand';
import {
  loginWithGoogleApi,
  logoutPlayerApi,
  fetchCurrentPlayerProfile,
  claimDailyRewardApi,
  fetchPlayerOwnedSkinsApi,
  syncPlayerOwnedSkinsApi,
  purchasePlayerSkinApi,
  getStoredSessionToken,
  setStoredSessionToken
} from '@/services/playerApi';
import { isAdminEmail } from '@/services/auth';
import {
  getOrCreatePlayerWallet,
  subscribeToPlayerWallet,
  claimFirebaseDailyReward,
  setPlayerBalanceInFirestore,
  formatDailyRewardState,
  redeemFirebaseGiftCode,
  resolveGoogleAccountStorageKey,
  getStoredOwnedTankSkins,
  saveStoredOwnedTankSkins,
  syncOwnedTankSkinsToFirestore,
  purchaseWindTankSkinInFirestore
} from '@/services/firebaseWallet';

let walletUnsubscribe = null;
let currentWalletUid = null;

function buildIdentityFromUser(user, extra = {}) {
  if (!user && !extra) return null;
  return {
    uid: user?.uid || extra?.uid || extra?.userId || null,
    userId: extra?.userId || user?.uid || null,
    googleSub:
      extra?.googleSub ||
      user?.providerData?.[0]?.uid ||
      user?.googleSub ||
      null,
    email: user?.email || extra?.email || '',
    displayName: extra?.displayName || user?.displayName || ''
  };
}

/**
 * Ensures the signed-in Firebase Google user also establishes an authenticated
 * Cloudflare Worker `PlayerAccountDO` session (`idFromName(googleSub)`) and merges
 * `ownedSkins` across Worker SQLite + Firestore + Per-Google-Account Offline Cache!
 */
async function syncWorkerGoogleSkinsForUser(firebaseUser, set, get) {
  if (!firebaseUser || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return;
  }

  try {
    let workerSkins = [];
    let workerProfile = null;
    let hasValidWorkerSession = Boolean(getStoredSessionToken());

    if (hasValidWorkerSession) {
      try {
        const skinRes = await fetchPlayerOwnedSkinsApi();
        if (skinRes?.ok && Array.isArray(skinRes.ownedSkins)) {
          workerSkins = skinRes.ownedSkins;
        }
      } catch (err) {
        if (err?.status === 401) {
          hasValidWorkerSession = false;
        }
      }
    }

    if (!hasValidWorkerSession && typeof firebaseUser.getIdToken === 'function') {
      try {
        const fbIdToken = await firebaseUser.getIdToken();
        if (fbIdToken) {
          const loginRes = await loginWithGoogleApi(fbIdToken);
          if (loginRes?.ok) {
            workerProfile = loginRes;
            if (Array.isArray(loginRes.ownedSkins)) {
              workerSkins = loginRes.ownedSkins;
            }
          }
        }
      } catch {
        // Worker may not yet have FIREBASE_PROJECT_ID deployed; fallback gracefully
      }
    }

    const identity = buildIdentityFromUser(firebaseUser, workerProfile?.user || get().player || {});
    const localAndStateSkins = [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(get().ownedTankSkins) ? get().ownedTankSkins : []),
      ...workerSkins
    ];
    const mergedSkins = saveStoredOwnedTankSkins(identity, localAndStateSkins);

    // Push any locally-unlocked skins for this Google account up to Worker DO + Firestore
    if (getStoredSessionToken() && mergedSkins.some((id) => id !== 'classic' && !workerSkins.includes(id))) {
      try {
        const pushed = await syncPlayerOwnedSkinsApi(mergedSkins);
        if (pushed?.ok && Array.isArray(pushed.ownedSkins)) {
          saveStoredOwnedTankSkins(identity, [...mergedSkins, ...pushed.ownedSkins]);
        }
      } catch {}
    }

    if (firebaseUser.uid && mergedSkins.length > 1) {
      void syncOwnedTankSkinsToFirestore(firebaseUser.uid, mergedSkins);
    }

    const finalOwned = getStoredOwnedTankSkins(identity);
    set((cur) => ({
      ownedTankSkins: finalOwned,
      player: cur.player
        ? {
            ...cur.player,
            googleSub: identity?.googleSub || cur.player.googleSub,
            accountKey: resolveGoogleAccountStorageKey(identity),
            ownedTankSkins: finalOwned
          }
        : cur.player
    }));
  } catch {
    // Non-blocking background cloud sync
  }
}

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

  // Khởi tạo hoặc lấy thông tin ví người chơi trên Firestore + Đồng bộ kho Chiến Xa Google
  getOrCreatePlayerWallet(user).then((walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    const identity = buildIdentityFromUser(user, walletData);
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

    const syncedSkins = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(walletData.ownedTankSkins) ? walletData.ownedTankSkins : []),
      ...(Array.isArray(get().ownedTankSkins) ? get().ownedTankSkins : [])
    ]);

    set({
      player: {
        userId: user.uid,
        uid: user.uid,
        googleSub: identity?.googleSub || '',
        accountKey: resolveGoogleAccountStorageKey(identity),
        displayName: walletData.displayName || user.displayName || 'Người Chơi',
        email: playerEmail,
        avatarUrl: walletData.avatarUrl || user.photoURL || '',
        ...walletData,
        ownedTankSkins: syncedSkins
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      ownedTankSkins: syncedSkins,
      dailyReward: formatDailyRewardState(walletData.dailyReward),
      playerStats: walletData.stats || null,
      isAdmin: hasAdminRights
    });

    try {
      localStorage.setItem('windhub_dev_balance', String(balance));
      localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
      localStorage.setItem('windhub_last_user_id', user.uid);
    } catch {}

    void syncWorkerGoogleSkinsForUser(user, set, get);
  }).catch((err) => {
    if (err?.code !== 'permission-denied') {
      console.warn('[FirebaseWallet] Error init wallet:', err);
    }
    void syncWorkerGoogleSkinsForUser(user, set, get);
  });

  // Lắng nghe thay đổi ví theo thời gian thực (Real-time Firestore)
  walletUnsubscribe = subscribeToPlayerWallet(user.uid, (walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    const identity = buildIdentityFromUser(user, walletData);
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

    const syncedSkins = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(walletData.ownedTankSkins) ? walletData.ownedTankSkins : []),
      ...(Array.isArray(get().ownedTankSkins) ? get().ownedTankSkins : [])
    ]);

    set((state) => ({
      player: {
        ...(state.player || {}),
        userId: user.uid,
        uid: user.uid,
        googleSub: identity?.googleSub || state.player?.googleSub || '',
        accountKey: resolveGoogleAccountStorageKey(identity),
        displayName: walletData.displayName || user.displayName || state.player?.displayName || 'Người Chơi',
        email: playerEmail,
        avatarUrl: walletData.avatarUrl || user.photoURL || state.player?.avatarUrl || '',
        ...walletData,
        ownedTankSkins: syncedSkins
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      ownedTankSkins: syncedSkins,
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
    if (!user) {
      if (walletUnsubscribe) {
        walletUnsubscribe();
        walletUnsubscribe = null;
      }
      currentWalletUid = null;
      set({
        user: null,
        isAdmin: false,
        isLoading: false,
        ownedTankSkins: get().isPlayerAuthenticated ? get().ownedTankSkins : ['classic']
      });
      return;
    }

    const identity = buildIdentityFromUser(user);
    const cachedAccountSkins = getStoredOwnedTankSkins(identity);
    set({
      user,
      isAdmin: Boolean(calculatedAdmin),
      isLoading: false,
      ownedTankSkins: cachedAccountSkins
    });

    syncFirebaseWallet(user, set, get);
  },

  // Google Player Auth & BET Wallet (cho Tài Xỉu, WindTank và các Game WindHub)
  player: null,
  isPlayerAuthenticated: false,
  isPlayerLoading: true,
  betBalance: 0,
  ownedTankSkins: ['classic'],
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
        ownedTankSkins: ['classic'],
        dailyReward: null,
        playerStats: null
      });
      return;
    }

    const playerEmail = data.user.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    const identity = buildIdentityFromUser(get().user, data.user);
    const syncedSkins = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(data.ownedSkins) ? data.ownedSkins : []),
      ...(Array.isArray(data.user.ownedTankSkins) ? data.user.ownedTankSkins : [])
    ]);

    set({
      player: {
        ...data.user,
        accountKey: resolveGoogleAccountStorageKey(identity),
        ownedTankSkins: syncedSkins
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: data.balance ?? get().betBalance,
      ownedTankSkins: syncedSkins,
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

    // 2. Dự phòng token phiên Cloudflare Worker
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
        const identity = buildIdentityFromUser(null, data.user);
        const syncedSkins = saveStoredOwnedTankSkins(identity, [
          ...getStoredOwnedTankSkins(identity),
          ...(Array.isArray(data.ownedSkins) ? data.ownedSkins : [])
        ]);

        set({
          player: {
            ...data.user,
            accountKey: resolveGoogleAccountStorageKey(identity),
            ownedTankSkins: syncedSkins
          },
          isPlayerAuthenticated: true,
          isPlayerLoading: false,
          betBalance: finalBal,
          ownedTankSkins: syncedSkins,
          dailyReward: data.dailyReward ?? null,
          playerStats: data.stats ?? null,
          isAdmin: hasAdminRights
        });
        try {
          localStorage.setItem('windhub_dev_balance', String(finalBal));
          if (data.user.userId) {
            localStorage.setItem('windhub_last_user_id', data.user.userId);
          }
        } catch {}
      } else {
        setStoredSessionToken('');
        set({ player: null, isPlayerAuthenticated: false, isPlayerLoading: false, ownedTankSkins: ['classic'] });
      }
    } catch {
      setStoredSessionToken('');
      set({ player: null, isPlayerAuthenticated: false, isPlayerLoading: false, ownedTankSkins: ['classic'] });
    }
  },

  loginWithGoogle: async (credential) => {
    const res = await loginWithGoogleApi(credential);
    if (res.ok && res.user) {
      const playerEmail = res.user.email || '';
      const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
      const identity = buildIdentityFromUser(get().user, res.user);
      const mergedSkins = saveStoredOwnedTankSkins(identity, [
        ...getStoredOwnedTankSkins(identity),
        ...(Array.isArray(res.ownedSkins) ? res.ownedSkins : [])
      ]);

      // Đồng bộ hai chiều nếu máy hiện tại có sẵn skin của đúng tài khoản Google này
      if (
        Array.isArray(res.ownedSkins) &&
        mergedSkins.some((id) => id !== 'classic' && !res.ownedSkins.includes(id))
      ) {
        syncPlayerOwnedSkinsApi(mergedSkins).catch(() => {});
      }

      set({
        player: {
          ...res.user,
          accountKey: resolveGoogleAccountStorageKey(identity),
          ownedTankSkins: mergedSkins
        },
        isPlayerAuthenticated: true,
        isPlayerLoading: false,
        betBalance: Math.max(res.balance ?? 0, get().betBalance || 0),
        ownedTankSkins: mergedSkins,
        dailyReward: res.dailyReward ?? null,
        isAdmin: hasAdminRights
      });
    }
    return res;
  },

  logoutPlayer: async () => {
    return get().logout();
  },

  // Đăng xuất hợp nhất toàn diện (xóa phiên đang chạy, giữ kho Offline theo từng tài khoản riêng biệt)
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
      ownedTankSkins: ['classic'],
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
  },

  redeemGiftCode: async (code) => {
    const uid = get().user?.uid || get().player?.userId || get().player?.uid;
    if (!uid) {
      return { success: false, code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập tài khoản trước khi nhập mã quà tặng.' };
    }
    const res = await redeemFirebaseGiftCode(uid, code);
    if (res && res.success && typeof res.newBalance === 'number') {
      get().updateBetBalance(res.newBalance);
      const currentPlayer = get().player || {};
      const currentRedeemed = Array.isArray(currentPlayer.redeemedGiftcodes) ? currentPlayer.redeemedGiftcodes : [];
      set({
        player: {
          ...currentPlayer,
          balance: res.newBalance,
          redeemedGiftcodes: [...currentRedeemed, res.code]
        }
      });
    }
    return res;
  },

  syncOwnedTankSkins: async (incomingSkins = []) => {
    const state = get();
    if (!state.isPlayerAuthenticated && !state.user) {
      return { ok: false, ownedSkins: ['classic'] };
    }
    const identity = buildIdentityFromUser(state.user, state.player || {});
    const merged = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(state.ownedTankSkins) ? state.ownedTankSkins : []),
      ...(Array.isArray(incomingSkins) ? incomingSkins : [])
    ]);

    if (getStoredSessionToken()) {
      try {
        const cloudRes = await syncPlayerOwnedSkinsApi(merged);
        if (cloudRes?.ok && Array.isArray(cloudRes.ownedSkins)) {
          saveStoredOwnedTankSkins(identity, [...merged, ...cloudRes.ownedSkins]);
        }
      } catch {}
    }

    const uid = state.user?.uid || state.player?.uid;
    if (uid) {
      void syncOwnedTankSkinsToFirestore(uid, getStoredOwnedTankSkins(identity));
    }

    const finalOwned = getStoredOwnedTankSkins(identity);
    set((cur) => ({
      ownedTankSkins: finalOwned,
      player: cur.player ? { ...cur.player, ownedTankSkins: finalOwned } : cur.player
    }));
    return { ok: true, ownedSkins: finalOwned };
  },

  purchaseTankSkin: async (skinId, skinName, costXu) => {
    const state = get();
    const uid = state.user?.uid || state.player?.userId || state.player?.uid;
    if (!uid || (!state.isPlayerAuthenticated && !state.user)) {
      return {
        success: false,
        code: 'AUTH_REQUIRED',
        message: '🔑 Vui lòng đăng nhập tài khoản Google trên WindHub để mua & đồng bộ Chiến Xa!'
      };
    }

    const identity = buildIdentityFromUser(state.user, state.player || {});
    let res = null;

    // 1. Thử giao dịch trực tiếp qua Cloudflare Worker PlayerAccountDO (Authoritative Google Account SQLite)
    if (getStoredSessionToken()) {
      try {
        const workerRes = await purchasePlayerSkinApi({ skinId, skinName, costXu });
        if (workerRes && workerRes.success) {
          res = workerRes;
        }
      } catch {
        // Nếu Worker chưa cập nhật số dư từ Firestore hoặc chưa deploy route mới -> xử lý tiếp qua Firestore + Sync
      }
    }

    // 2. Nếu chưa trừ qua Worker DO (ví dụ Xu nằm bên ví Firestore), trừ qua Firestore và đẩy danh sách Skin lên Worker DO
    if (!res) {
      res = await purchaseWindTankSkinInFirestore(uid, skinId, skinName, costXu);
    }

    if (res && res.success) {
      if (typeof res.newBalance === 'number') {
        get().updateBetBalance(res.newBalance);
      }
      const nextOwned = saveStoredOwnedTankSkins(identity, [
        ...getStoredOwnedTankSkins(identity),
        ...(get().ownedTankSkins || []),
        ...(Array.isArray(res.ownedSkins) ? res.ownedSkins : []),
        skinId
      ]);

      // Đồng bộ ngay lên cả Cloudflare Worker SQLite (theo GoogleSub) & Firestore (theo Firebase UID)
      if (getStoredSessionToken()) {
        syncPlayerOwnedSkinsApi(nextOwned).catch(() => {});
      }
      if (state.user?.uid) {
        void syncOwnedTankSkinsToFirestore(state.user.uid, nextOwned);
      }

      set((cur) => ({
        ownedTankSkins: nextOwned,
        player: cur.player ? { ...cur.player, ownedTankSkins: nextOwned } : cur.player
      }));
      return {
        ...res,
        ownedSkins: nextOwned,
        message: `🎉 Đã mở khóa ${skinName}! Đã đồng bộ vào tài khoản Google & lưu kho Offline.`
      };
    }

    return res;
  }
}));
