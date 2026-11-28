import { create } from 'zustand';
import {
  loginWithGoogleApi,
  logoutPlayerApi,
  fetchCurrentPlayerProfile,
  claimDailyRewardApi,
  fetchDailyRewardStatus,
  fetchPlayerOwnedSkinsApi,
  syncPlayerOwnedSkinsApi,
  purchasePlayerSkinApi,
  syncPlayerRedeemedGiftcodesApi,
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
  normalizeGiftCode,
  resolveGoogleAccountStorageKey,
  getStoredDailyReward,
  saveStoredDailyReward,
  getStoredRedeemedGiftcodes,
  saveStoredRedeemedGiftcodes,
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
 * Merges two dailyReward snapshots (e.g. Firestore + Cloudflare Worker / LocalStorage)
 * so if the player ALREADY claimed today's login reward in Tài Xỉu, WindTank immediately
 * recognizes `claimedToday === true` (`canClaimToday === false`) and vice versa!
 */
function reconcileDailyRewardStates(primaryDaily, secondaryDaily) {
  const formattedA = formatDailyRewardState(primaryDaily || {});
  const formattedB = formatDailyRewardState(secondaryDaily || {});
  if (formattedA.claimedToday) return formattedA;
  if (formattedB.claimedToday) return formattedB;
  if ((formattedB.currentStreak || 0) > (formattedA.currentStreak || 0)) {
    return formattedB;
  }
  return formattedA;
}

/**
 * Ensures the signed-in Firebase Google user also establishes an authenticated
 * Cloudflare Worker `PlayerAccountDO` session (`idFromName(googleSub)`) and merges
 * `ownedSkins`, `redeemedGiftcodes`, and `dailyReward` across Tài Xỉu & WindTank!
 */
async function syncWorkerGoogleSkinsForUser(firebaseUser, set, get) {
  if (!firebaseUser || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return;
  }

  try {
    let workerSkins = [];
    let workerCodes = [];
    let workerDaily = null;
    let workerProfile = null;
    let hasValidWorkerSession = Boolean(getStoredSessionToken());

    if (hasValidWorkerSession) {
      try {
        const [skinRes, profRes] = await Promise.all([
          fetchPlayerOwnedSkinsApi().catch(() => null),
          fetchCurrentPlayerProfile().catch(() => null)
        ]);
        if (skinRes?.ok && Array.isArray(skinRes.ownedSkins)) {
          workerSkins = skinRes.ownedSkins;
        }
        if (profRes?.authenticated) {
          workerProfile = profRes;
          if (Array.isArray(profRes.redeemedGiftcodes)) {
            workerCodes = profRes.redeemedGiftcodes;
          }
          if (profRes.dailyReward) {
            workerDaily = profRes.dailyReward;
          }
        } else if (!skinRes?.ok) {
          hasValidWorkerSession = false;
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
            if (Array.isArray(loginRes.redeemedGiftcodes)) {
              workerCodes = loginRes.redeemedGiftcodes;
            }
            if (loginRes.dailyReward) {
              workerDaily = loginRes.dailyReward;
            }
          }
        }
      } catch {
        // Worker fallback
      }
    }

    const identity = buildIdentityFromUser(firebaseUser, workerProfile?.user || get().player || {});
    const mergedSkins = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(get().ownedTankSkins) ? get().ownedTankSkins : []),
      ...workerSkins
    ]);

    const mergedCodes = saveStoredRedeemedGiftcodes(identity, [
      ...getStoredRedeemedGiftcodes(identity),
      ...(Array.isArray(get().player?.redeemedGiftcodes) ? get().player.redeemedGiftcodes : []),
      ...workerCodes
    ]);

    const reconciledDaily = reconcileDailyRewardStates(
      get().dailyReward || getStoredDailyReward(identity),
      workerDaily
    );
    saveStoredDailyReward(identity, reconciledDaily);

    if (getStoredSessionToken()) {
      if (mergedSkins.some((id) => id !== 'classic' && !workerSkins.includes(id))) {
        syncPlayerOwnedSkinsApi(mergedSkins).catch(() => {});
      }
      if (mergedCodes.some((c) => !workerCodes.includes(c))) {
        syncPlayerRedeemedGiftcodesApi(mergedCodes).catch(() => {});
      }
      // If today's daily reward was already claimed in Firestore/Tài Xỉu, mark Worker DO claimed too (without double-adding local balance!)
      if (reconciledDaily.claimedToday && workerDaily && !workerDaily.claimedToday) {
        claimDailyRewardApi().catch(() => {});
      }
    }

    if (firebaseUser.uid && mergedSkins.length > 1) {
      void syncOwnedTankSkinsToFirestore(firebaseUser.uid, mergedSkins);
    }

    const finalOwned = getStoredOwnedTankSkins(identity);
    set((cur) => ({
      ownedTankSkins: finalOwned,
      dailyReward: reconciledDaily,
      player: cur.player
        ? {
            ...cur.player,
            googleSub: identity?.googleSub || cur.player.googleSub,
            accountKey: resolveGoogleAccountStorageKey(identity),
            ownedTankSkins: finalOwned,
            redeemedGiftcodes: mergedCodes
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

  getOrCreatePlayerWallet(user).then((walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    const identity = buildIdentityFromUser(user, walletData);
    let balance = typeof walletData.balance === 'number' ? walletData.balance : 0;
    try {
      const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`);
      if (stored && !isNaN(Number(stored))) {
        const sNum = Number(stored);
        if (sNum > balance) {
          balance = sNum;
          setPlayerBalanceInFirestore(user.uid, sNum).catch(() => {});
        } else if (balance > sNum) {
          localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
        }
      } else if (balance >= 0) {
        localStorage.setItem(`windhub_wallet_balance_${user.uid}`, String(balance));
      }
      localStorage.setItem('windhub_dev_balance', String(balance));
    } catch {}

    const syncedSkins = saveStoredOwnedTankSkins(identity, [
      ...getStoredOwnedTankSkins(identity),
      ...(Array.isArray(walletData.ownedTankSkins) ? walletData.ownedTankSkins : []),
      ...(Array.isArray(get().ownedTankSkins) ? get().ownedTankSkins : [])
    ]);

    const syncedCodes = saveStoredRedeemedGiftcodes(identity, [
      ...getStoredRedeemedGiftcodes(identity),
      ...(Array.isArray(walletData.redeemedGiftcodes) ? walletData.redeemedGiftcodes : [])
    ]);

    const reconciledDaily = reconcileDailyRewardStates(
      walletData.dailyReward,
      getStoredDailyReward(identity)
    );
    saveStoredDailyReward(identity, reconciledDaily);

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
        ownedTankSkins: syncedSkins,
        redeemedGiftcodes: syncedCodes
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      ownedTankSkins: syncedSkins,
      dailyReward: reconciledDaily,
      playerStats: walletData.stats || null,
      isAdmin: hasAdminRights
    });

    try {
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

  walletUnsubscribe = subscribeToPlayerWallet(user.uid, (walletData) => {
    if (!walletData) return;
    const playerEmail = user.email || walletData.email || '';
    const hasAdminRights = get().isAdmin || isAdminEmail(playerEmail);
    const identity = buildIdentityFromUser(user, walletData);
    let balance = typeof walletData.balance === 'number' ? walletData.balance : get().betBalance;
    try {
      const stored = localStorage.getItem(`windhub_wallet_balance_${user.uid}`);
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

    const syncedCodes = saveStoredRedeemedGiftcodes(identity, [
      ...getStoredRedeemedGiftcodes(identity),
      ...(Array.isArray(walletData.redeemedGiftcodes) ? walletData.redeemedGiftcodes : []),
      ...(Array.isArray(get().player?.redeemedGiftcodes) ? get().player.redeemedGiftcodes : [])
    ]);

    const reconciledDaily = reconcileDailyRewardStates(
      walletData.dailyReward,
      getStoredDailyReward(identity)
    );
    saveStoredDailyReward(identity, reconciledDaily);

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
        ownedTankSkins: syncedSkins,
        redeemedGiftcodes: syncedCodes
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: balance,
      ownedTankSkins: syncedSkins,
      dailyReward: reconciledDaily,
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

  // Google Player Auth & BET Wallet (dùng chung 100% giữa Tài Xỉu & WindTank)
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
    const syncedCodes = saveStoredRedeemedGiftcodes(identity, [
      ...getStoredRedeemedGiftcodes(identity),
      ...(Array.isArray(data.redeemedGiftcodes) ? data.redeemedGiftcodes : []),
      ...(Array.isArray(data.user.redeemedGiftcodes) ? data.user.redeemedGiftcodes : [])
    ]);
    const reconciledDaily = reconcileDailyRewardStates(
      data.dailyReward,
      getStoredDailyReward(identity)
    );
    saveStoredDailyReward(identity, reconciledDaily);

    set({
      player: {
        ...data.user,
        accountKey: resolveGoogleAccountStorageKey(identity),
        ownedTankSkins: syncedSkins,
        redeemedGiftcodes: syncedCodes
      },
      isPlayerAuthenticated: true,
      isPlayerLoading: false,
      betBalance: data.balance ?? get().betBalance,
      ownedTankSkins: syncedSkins,
      dailyReward: reconciledDaily,
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
      const stored = lastUid ? localStorage.getItem(`windhub_wallet_balance_${lastUid}`) : null;
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

    // 2. Dự phòng token phiên Cloudflare Worker (ví dụ đăng nhập từ Tài Xỉu GoogleLoginGate)
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
        const uidKey = data.user.userId;
        let storedUserBal = null;
        try {
          const rawU = uidKey ? localStorage.getItem(`windhub_wallet_balance_${uidKey}`) : null;
          if (rawU && !isNaN(Number(rawU))) storedUserBal = Number(rawU);
        } catch {}
        const finalBal = storedUserBal !== null ? Math.max(serverBal, storedUserBal) : serverBal;

        const identity = buildIdentityFromUser(null, data.user);
        const syncedSkins = saveStoredOwnedTankSkins(identity, [
          ...getStoredOwnedTankSkins(identity),
          ...(Array.isArray(data.ownedSkins) ? data.ownedSkins : [])
        ]);
        const syncedCodes = saveStoredRedeemedGiftcodes(identity, [
          ...getStoredRedeemedGiftcodes(identity),
          ...(Array.isArray(data.redeemedGiftcodes) ? data.redeemedGiftcodes : [])
        ]);
        const reconciledDaily = reconcileDailyRewardStates(
          data.dailyReward,
          getStoredDailyReward(identity)
        );
        saveStoredDailyReward(identity, reconciledDaily);

        set({
          player: {
            ...data.user,
            accountKey: resolveGoogleAccountStorageKey(identity),
            ownedTankSkins: syncedSkins,
            redeemedGiftcodes: syncedCodes
          },
          isPlayerAuthenticated: true,
          isPlayerLoading: false,
          betBalance: finalBal,
          ownedTankSkins: syncedSkins,
          dailyReward: reconciledDaily,
          playerStats: data.stats ?? null,
          isAdmin: hasAdminRights
        });
        try {
          localStorage.setItem('windhub_dev_balance', String(finalBal));
          if (uidKey) {
            localStorage.setItem(`windhub_wallet_balance_${uidKey}`, String(finalBal));
            localStorage.setItem('windhub_last_user_id', uidKey);
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
      const existingFirebaseUser = get().user;
      const identity = buildIdentityFromUser(existingFirebaseUser, res.user);

      const mergedSkins = saveStoredOwnedTankSkins(identity, [
        ...getStoredOwnedTankSkins(identity),
        ...(Array.isArray(res.ownedSkins) ? res.ownedSkins : [])
      ]);

      const mergedCodes = saveStoredRedeemedGiftcodes(identity, [
        ...getStoredRedeemedGiftcodes(identity),
        ...(Array.isArray(res.redeemedGiftcodes) ? res.redeemedGiftcodes : []),
        ...(Array.isArray(get().player?.redeemedGiftcodes) ? get().player.redeemedGiftcodes : [])
      ]);

      const reconciledDaily = reconcileDailyRewardStates(
        get().dailyReward || getStoredDailyReward(identity),
        res.dailyReward
      );
      saveStoredDailyReward(identity, reconciledDaily);

      if (
        Array.isArray(res.ownedSkins) &&
        mergedSkins.some((id) => id !== 'classic' && !res.ownedSkins.includes(id))
      ) {
        syncPlayerOwnedSkinsApi(mergedSkins).catch(() => {});
      }
      if (mergedCodes.length > 0) {
        syncPlayerRedeemedGiftcodesApi(mergedCodes).catch(() => {});
      }
      if (reconciledDaily.claimedToday && res.dailyReward && !res.dailyReward.claimedToday) {
        claimDailyRewardApi().catch(() => {});
      }

      // Nếu đã có ví Firebase của chính tài khoản này đang active (ví dụ từ Tài Xỉu), giữ nguyên số dư thực tế (không nhân đôi vốn tân thủ!)
      const nextBalance = existingFirebaseUser && get().isPlayerAuthenticated
        ? get().betBalance
        : (res.balance ?? 0);

      set((cur) => ({
        player: {
          ...(cur.player || {}),
          ...res.user,
          uid: existingFirebaseUser?.uid || res.user.userId,
          accountKey: resolveGoogleAccountStorageKey(identity),
          ownedTankSkins: mergedSkins,
          redeemedGiftcodes: mergedCodes
        },
        isPlayerAuthenticated: true,
        isPlayerLoading: false,
        betBalance: nextBalance,
        ownedTankSkins: mergedSkins,
        dailyReward: reconciledDaily,
        isAdmin: hasAdminRights
      }));
    }
    return res;
  },

  logoutPlayer: async () => {
    return get().logout();
  },

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

    try {
      localStorage.removeItem('windhub_dev_balance');
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
    const state = get();
    const uid = state.user?.uid || state.player?.userId || state.player?.uid;
    const identity = buildIdentityFromUser(state.user, state.player || {});

    // Chốt chặn đồng bộ Tài Xỉu <-> WindTank: nếu hôm nay đã điểm danh ở bất kỳ game nào thì chặn ngay!
    const currentDaily = reconcileDailyRewardStates(
      state.dailyReward,
      getStoredDailyReward(identity)
    );
    if (currentDaily.claimedToday) {
      set({ dailyReward: currentDaily });
      return {
        ok: false,
        success: false,
        code: 'ALREADY_CLAIMED',
        message: 'Hôm nay bạn đã điểm danh nhận thưởng rồi! (Dùng chung Tài Xỉu & WindTank)'
      };
    }

    // Kiểm tra thêm trên Cloudflare Worker nếu có session để chống nhận chéo trên trình duyệt khác
    if (getStoredSessionToken()) {
      try {
        const workerStatus = await fetchDailyRewardStatus();
        if (workerStatus?.dailyReward?.claimedToday) {
          const syncedDaily = formatDailyRewardState({
            ...workerStatus.dailyReward,
            lastClaimedDate: workerStatus.dailyReward.lastClaimedDate || workerStatus.dailyReward.todayDate
          });
          saveStoredDailyReward(identity, syncedDaily);
          set({ dailyReward: syncedDaily });
          return {
            ok: false,
            success: false,
            code: 'ALREADY_CLAIMED',
            message: 'Tài khoản Google này đã nhận thưởng đăng nhập hôm nay rồi!'
          };
        }
      } catch {}
    }

    if (uid && state.user) {
      try {
        const res = await claimFirebaseDailyReward(uid);
        if (res && res.success) {
          saveStoredDailyReward(identity, {
            currentStreak: res.streakDay,
            lastClaimedDate: res.dailyReward?.lastClaimedDate || new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(new Date()),
            claimedToday: true,
            canClaimToday: false,
            updatedAt: Date.now()
          });
          // Đánh dấu đã điểm danh đồng thời trên Worker DO (không cộng lặp vào betBalance local)
          if (getStoredSessionToken()) {
            claimDailyRewardApi().catch(() => {});
          }
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
        return { ok: false, success: false, message: res?.message || 'Hôm nay bạn đã điểm danh nhận thưởng rồi.' };
      } catch (err) {
        return { ok: false, success: false, message: err.message || 'Lỗi nhận thưởng' };
      }
    }

    const res = await claimDailyRewardApi();
    if (res.success || res.ok) {
      const balance = typeof res.newBalance === 'number' ? res.newBalance : (res.balance ?? get().betBalance);
      const formattedDaily = formatDailyRewardState(
        res.dailyReward || {
          currentStreak: res.streakDay ?? 1,
          lastClaimedDate: res.rewardDate,
          claimedToday: true,
          canClaimToday: false
        }
      );
      saveStoredDailyReward(identity, formattedDaily);
      set({
        betBalance: balance,
        dailyReward: formattedDaily
      });
    }
    return res;
  },

  claimReward: async () => {
    return get().claimDailyReward();
  },

  redeemGiftCode: async (code) => {
    const state = get();
    const uid = state.user?.uid || state.player?.userId || state.player?.uid;
    if (!uid || (!state.isPlayerAuthenticated && !state.user)) {
      return {
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Vui lòng đăng nhập tài khoản Google trước khi nhập mã Giftcode.'
      };
    }

    const cleanCode = normalizeGiftCode(code);
    if (!cleanCode) {
      return { success: false, code: 'EMPTY_CODE', message: 'Vui lòng nhập mã Giftcode.' };
    }

    const identity = buildIdentityFromUser(state.user, state.player || {});
    const knownRedeemed = Array.from(
      new Set([
        ...(Array.isArray(state.player?.redeemedGiftcodes) ? state.player.redeemedGiftcodes : []),
        ...getStoredRedeemedGiftcodes(identity)
      ])
    );

    if (knownRedeemed.includes(cleanCode)) {
      return {
        success: false,
        code: 'ALREADY_REDEEMED',
        message: `Bạn đã nhập mã ${cleanCode} rồi! Mỗi tài khoản chỉ được nhập 1 lần (dùng chung Tài Xỉu & WindTank).`
      };
    }

    const res = await redeemFirebaseGiftCode(uid, cleanCode);
    if (res && (res.success || res.code === 'ALREADY_REDEEMED')) {
      const updatedCodes = saveStoredRedeemedGiftcodes(identity, [...knownRedeemed, cleanCode]);
      if (getStoredSessionToken()) {
        syncPlayerRedeemedGiftcodesApi(updatedCodes).catch(() => {});
      }

      if (res.success && typeof res.newBalance === 'number') {
        get().updateBetBalance(res.newBalance);
      }

      set((cur) => ({
        player: cur.player
          ? {
              ...cur.player,
              balance: typeof res.newBalance === 'number' ? res.newBalance : cur.player.balance,
              redeemedGiftcodes: updatedCodes
            }
          : cur.player
      }));
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

    if (getStoredSessionToken()) {
      try {
        const workerRes = await purchasePlayerSkinApi({ skinId, skinName, costXu });
        if (workerRes && workerRes.success) {
          res = workerRes;
        }
      } catch {
        // Fallback to Firestore wallet if Xu balance is held in Firestore
      }
    }

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
