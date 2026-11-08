// src/modules/Entertainment/TaiXiu/hooks/useTaiXiuSocket.js
/**
 * Epoch-Synchronized Decentralized Tai Xiu Engine
 * - Hoàn toàn không phụ thuộc vào Cloudflare Durable Objects hay SQLite (0đ chi phí, 0 giới hạn Free Tier)
 * - Đồng bộ thời gian thực theo giây chuẩn toàn cầu (NTP Epoch Sync): Mọi người chơi cùng thấy cùng ván cược và số giây
 * - Công bằng toán học (Provably Fair SHA-256): 3 viên xúc xắc đồng nhất tuyệt đối cho mọi người chơi và server
 * - Tích hợp toàn diện Firebase Firestore: Quản lý số dư, lịch sử cược, trả thưởng và chuỗi điểm danh 7 ngày
 * - Số lượng người chơi & tổng cược 100% THỰC TẾ, không số liệu ảo
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { debitPlayerWallet, creditPlayerWallet } from '@/services/firebaseWallet';
import {
  getProvablyFairRound,
  generateRecentHistory
} from '../utils/provablyFair';

// Cấu hình chu kỳ thời gian (giây) theo từng bàn cược
const ROOM_TIMINGS = {
  'tai-xiu-30s': { totalDuration: 50, waitDuration: 33, shakeDuration: 3, resultDuration: 14, name: 'Xóm Đình Truyền Thống' },
  'tai-xiu-50s': { totalDuration: 50, waitDuration: 33, shakeDuration: 3, resultDuration: 14, name: 'Xóm Đình Truyền Thống' },
  'tai-xiu-15s': { totalDuration: 25, waitDuration: 15, shakeDuration: 2, resultDuration: 8, name: 'Chợ Phiên Siêu Tốc' },
  'tai-xiu-25s': { totalDuration: 25, waitDuration: 15, shakeDuration: 2, resultDuration: 8, name: 'Chợ Phiên Siêu Tốc' }
};

export { getProvablyFairRound, generateRecentHistory };

export function useTaiXiuSocket({ roomId = 'tai-xiu-30s', userId, userName, enabled = true }) {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');
  const [roomState, setRoomState] = useState('WAITING');
  const [currentRoundId, setCurrentRoundId] = useState('');
  const [roundEndTime, setRoundEndTime] = useState(0);
  const [waitingDuration, setWaitingDuration] = useState(33);
  const [dice, setDice] = useState([1, 2, 3]);
  const [total, setTotal] = useState(6);
  const [outcome, setOutcome] = useState('XIU');
  const [isTriple, setIsTriple] = useState(false);
  const [dramaticType, setDramaticType] = useState('NORMAL');
  const [dramaticMessage, setDramaticMessage] = useState('');
  
  // Số lượng người chơi THỰC TẾ (mặc định là 1 khi người chơi vào phòng)
  const [onlineCount, setOnlineCount] = useState(1);

  const storeBalance = useAuthStore((s) => s.betBalance);
  const [myPoints, setMyPoints] = useState(() => {
    const initBal = useAuthStore.getState().betBalance;
    return typeof initBal === 'number' && initBal > 0 ? initBal : 10000;
  });

  useEffect(() => {
    if (typeof storeBalance === 'number') {
      setMyPoints(storeBalance);
    }
  }, [storeBalance]);

  const [myCurrentBets, setMyCurrentBets] = useState([]);
  
  // Tổng xu cược THẬT của người chơi trong phòng (không số ảo)
  const [betSummary, setBetSummary] = useState({ taiTotal: 0, xiuTotal: 0, baoTotal: 0 });
  const [history, setHistory] = useState([]);
  const [latestWinners, setLatestWinners] = useState([]);

  const processedPocketsRef = useRef(new Set()); // Tránh tính thưởng trùng cho cùng một roundId
  const myCurrentBetsRef = useRef([]);
  const activeRoundRef = useRef(null); // Theo dõi ván hiện tại để dọn sạch cược khi sang ván mới
  useEffect(() => {
    myCurrentBetsRef.current = myCurrentBets;
  }, [myCurrentBets]);

  const config = ROOM_TIMINGS[roomId] || ROOM_TIMINGS['tai-xiu-30s'];

  // Khởi tạo lịch sử soi cầu 50 ván khi đổi phòng (Đồng bộ tức thì)
  useEffect(() => {
    activeRoundRef.current = null;
    setMyCurrentBets([]);
    setLatestWinners([]);
    setBetSummary({ taiTotal: 0, xiuTotal: 0, baoTotal: 0 });
    const now = Date.now();
    const totalMs = config.totalDuration * 1000;
    const cycleIndex = Math.floor(now / totalMs);
    setHistory(generateRecentHistory(cycleIndex, roomId, 50));
    setWaitingDuration(config.waitDuration);
  }, [roomId, config.totalDuration, config.waitDuration]);

  // 1. THEO DÕI SỰ HIỆN DIỆN THỰC TẾ CỦA NGƯỜI CHƠI TRÊN FIREBASE (PRESENCE TRACKING)
  useEffect(() => {
    if (!enabled) return;

    const activeUid = userId || `guest_${Math.random().toString(36).substring(2, 8)}`;
    let heartbeatTimer = null;
    let unsubscribe = null;

    import('firebase/firestore').then(({ doc, setDoc, deleteDoc, onSnapshot, collection }) => {
      import('@/services/firebase').then(({ db }) => {
        const presenceRef = doc(db, 'taixiu_presence', activeUid);

        const updatePresence = () => {
          setDoc(presenceRef, {
            userId: activeUid,
            userName: userName || 'Người chơi',
            roomId,
            lastSeen: Date.now()
          }, { merge: true }).catch(() => {});
        };

        updatePresence();
        heartbeatTimer = setInterval(updatePresence, 12000);

        const presenceCol = collection(db, 'taixiu_presence');
        unsubscribe = onSnapshot(presenceCol, (snap) => {
          const now = Date.now();
          let count = 0;
          snap.forEach((d) => {
            const data = d.data();
            if (data?.roomId === roomId && now - (data.lastSeen || 0) < 30000) {
              count++;
            }
          });
          setOnlineCount(Math.max(1, count));
        }, () => {
          setOnlineCount(1);
        });
      });
    }).catch(() => {
      setOnlineCount(1);
    });

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubscribe) unsubscribe();
      import('firebase/firestore').then(({ doc, deleteDoc }) => {
        import('@/services/firebase').then(({ db }) => {
          deleteDoc(doc(db, 'taixiu_presence', activeUid)).catch(() => {});
        });
      }).catch(() => {});
    };
  }, [enabled, userId, userName, roomId]);

  // 2. ĐỒNG BỘ TỔNG CƯỢC THẬT CỦA CÁC NGƯỜI CHƠI TRONG PHÒNG QUA FIRESTORE
  useEffect(() => {
    if (!enabled || !currentRoundId) return;

    let unsubscribe = null;
    import('firebase/firestore').then(({ collection, onSnapshot }) => {
      import('@/services/firebase').then(({ db }) => {
        const betsCol = collection(db, 'taixiu_rounds', `${roomId}_${currentRoundId}`, 'bets');
        unsubscribe = onSnapshot(betsCol, (snap) => {
          let tai = 0, xiu = 0, bao = 0;
          snap.forEach((d) => {
            const b = d.data();
            if (b.side === 'TAI') tai += b.amount || 0;
            else if (b.side === 'XIU') xiu += b.amount || 0;
            else if (b.side === 'BAO') bao += b.amount || 0;
          });
          setBetSummary({ taiTotal: tai, xiuTotal: xiu, baoTotal: bao });
        }, () => {});
      });
    }).catch(() => {});

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [enabled, roomId, currentRoundId]);

  // 3. VÒNG LẶP ĐẾM NHỊP THỜI GIAN THỰC ĐỒNG BỘ TOÀN CẦU (NTP EPOCH SYNC ENGINE)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const totalMs = config.totalDuration * 1000;
      const cycleIndex = Math.floor(now / totalMs);
      const elapsed = now % totalMs;
      const waitMs = config.waitDuration * 1000;
      const shakeMs = config.shakeDuration * 1000;

      const round = getProvablyFairRound(cycleIndex, roomId);
      const rId = round.roundId;

      // KHI CHUYỂN SANG VÁN MỚI (rId thay đổi): DỌN SẠCH CƯỢC CŨ VÀ RESET TỔNG CƯỢC VỀ 0
      if (activeRoundRef.current !== rId) {
        activeRoundRef.current = rId;
        setMyCurrentBets([]);
        setLatestWinners([]);
        setBetSummary({ taiTotal: 0, xiuTotal: 0, baoTotal: 0 });
        setCurrentRoundId(rId);
      }

      if (elapsed < waitMs) {
        // Giai đoạn 1: ĐẶT CƯỢC (WAITING)
        const endsAt = (cycleIndex * totalMs) + waitMs;
        setRoomState('WAITING');
        setCurrentRoundId(rId);
        setRoundEndTime(endsAt);

      } else if (elapsed < waitMs + shakeMs) {
        // Giai đoạn 2: LẮC BÁT (PLAYING)
        const endsAt = (cycleIndex * totalMs) + waitMs + shakeMs;
        setRoomState('PLAYING');
        setCurrentRoundId(rId);
        setRoundEndTime(endsAt);

      } else {
        // Giai đoạn 3: NẶN ĐĨA & KẾT QUẢ (RESULT)
        const endsAt = (cycleIndex + 1) * totalMs;
        setRoomState('RESULT');
        setCurrentRoundId(rId);
        setRoundEndTime(endsAt);
        setDice(round.dice);
        setTotal(round.total);
        setOutcome(round.outcome);
        setIsTriple(round.isTriple);
        setDramaticType(round.dramaticType || 'NORMAL');
        setDramaticMessage(round.dramaticMessage || '');

        // Cập nhật lịch sử soi cầu
        setHistory((prev) => {
          if (prev.length > 0 && prev[0].roundId === rId) return prev;
          const newItem = {
            roundId: rId,
            dice: round.dice,
            total: round.total,
            outcome: round.outcome,
            isTriple: round.isTriple,
            dramaticType: round.dramaticType || 'NORMAL',
            dramaticMessage: round.dramaticMessage || '',
            drawTime: now
          };
          return [newItem, ...prev.filter((h) => h.roundId !== rId).slice(0, 49)];
        });

        // Tính toán trả thưởng một lần duy nhất cho ván này
        if (!processedPocketsRef.current.has(rId)) {
          processedPocketsRef.current.add(rId);
          const currentBets = myCurrentBetsRef.current || [];
          let totalWinPayout = 0;
          const winners = [];

          for (const bet of currentBets) {
            const won = (bet.side === round.outcome) || (round.outcome === 'BAO' && bet.side === 'BAO');
            if (won) {
              const mult = bet.side === 'BAO' ? 30 : 2;
              const winAmount = bet.amount * mult;
              totalWinPayout += winAmount;
              winners.push({
                userId: userId || 'player',
                userName: userName || 'Người Chơi',
                betSide: bet.side,
                payout: winAmount
              });
            }
          }

          if (totalWinPayout > 0) {
            setLatestWinners(winners);
            setMyPoints((prev) => {
              const nextBal = prev + totalWinPayout;
              // Chạy ở microtask tiếp theo để tránh xung đột React render phase
              setTimeout(() => {
                useAuthStore.getState().updateBetBalance(nextBal);
              }, 0);
              return nextBal;
            });

            // Ghi nhận trả thưởng thẳng vào Firestore Wallet
            if (userId && userId !== 'auth_player' && userId !== 'guest_player') {
              creditPlayerWallet(userId, totalWinPayout, {
                type: 'PAYOUT',
                description: `Thắng cược ${round.outcome === 'TAI' ? 'Tài' : round.outcome === 'XIU' ? 'Xỉu' : 'Bão'} ván ${rId}`
              }).catch(() => {});
            }
          }
        }
      }



    }, 300);

    return () => clearInterval(interval);
  }, [enabled, roomId, config, userId, userName]);

  // Hành động đặt cược
  const placeBet = useCallback((betSide, amount) => {
    if (roomState !== 'WAITING') {
      toast.warning('Bát đã úp, đã khóa cược! Chờ ván sau nhé.');
      return false;
    }
    const betNum = parseInt(amount, 10);
    if (isNaN(betNum) || betNum <= 0) {
      toast.error('Số điểm cược không hợp lệ.');
      return false;
    }
    if (myPoints < betNum) {
      toast.warning('Bạn không đủ xu vui vẻ! Nhấn nút nhận thêm xu nhé.');
      return false;
    }

    const sideName = betSide === 'TAI' ? 'Tài' : betSide === 'XIU' ? 'Xỉu' : 'Bão';

    // Cập nhật cược người chơi ngay lập tức
    setMyCurrentBets((prev) => {
      const idx = prev.findIndex((b) => b.side === betSide);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], amount: next[idx].amount + betNum };
        return next;
      }
      return [...prev, { side: betSide, amount: betNum, sideName }];
    });

    // Cập nhật tổng cược THẬT tức thì cho giao diện
    setBetSummary((prev) => ({
      taiTotal: prev.taiTotal + (betSide === 'TAI' ? betNum : 0),
      xiuTotal: prev.xiuTotal + (betSide === 'XIU' ? betNum : 0),
      baoTotal: prev.baoTotal + (betSide === 'BAO' ? betNum : 0)
    }));

    const remainingBal = Math.max(0, myPoints - betNum);
    setMyPoints(remainingBal);
    useAuthStore.getState().updateBetBalance(remainingBal);

    // Ghi nhận trừ tiền cược vào Firebase Firestore
    if (userId && userId !== 'auth_player' && userId !== 'guest_player') {
      debitPlayerWallet(userId, betNum, {
        type: 'BET',
        description: `Cược cửa ${sideName} ván ${currentRoundId}`
      }).catch((err) => {
        console.warn('[TaiXiu] debitPlayerWallet warn:', err);
      });

      // Đồng bộ mức cược thực tế của bạn lên phòng chơi chung trên Firestore
      import('firebase/firestore').then(({ doc, setDoc, increment }) => {
        import('@/services/firebase').then(({ db }) => {
          const betDoc = doc(db, 'taixiu_rounds', `${roomId}_${currentRoundId}`, 'bets', `${userId}_${betSide}`);
          setDoc(betDoc, {
            userId,
            userName: userName || 'Người chơi',
            side: betSide,
            amount: increment(betNum),
            updatedAt: Date.now()
          }, { merge: true }).catch(() => {});
        });
      }).catch(() => {});
    }

    toast.success(`Đã cược cửa ${sideName} (+${betNum.toLocaleString()} xu)`);
    return true;
  }, [roomState, myPoints, currentRoundId, userId, userName, roomId]);

  // Nhận trợ cấp tân thủ
  const claimFreePoints = useCallback(async () => {
    if (myPoints > 500) {
      toast.warning('Chỉ được nhận thêm xu khi số dư dưới 500 xu!');
      return false;
    }
    if (userId && userId !== 'auth_player' && userId !== 'guest_player') {
      try {
        const res = await creditPlayerWallet(userId, 10000, {
          type: 'FREE_REWARD',
          description: 'Trợ cấp tân thủ 10,000 xu'
        });
        if (res?.success) {
          setMyPoints(res.balance);
          useAuthStore.getState().updateBetBalance(res.balance);
          toast.success('Nhận trợ cấp tân thủ 10,000 xu thành công!');
          return true;
        }
      } catch (err) {
        console.warn('[TaiXiu] claimFreePoints error:', err);
      }
    }

    // Fallback nếu offline hoặc tài khoản khách
    const newBal = myPoints + 10000;
    setMyPoints(newBal);
    useAuthStore.getState().updateBetBalance(newBal);
    toast.success('Nhận trợ cấp tân thủ 10,000 xu thành công!');
    return true;
  }, [myPoints, userId]);

  return {
    connectionStatus,
    roomState,
    currentRoundId,
    roundEndTime,
    waitingDuration,
    dice,
    total,
    outcome,
    isTriple,
    dramaticType,
    dramaticMessage,
    onlineCount,
    myPoints,
    myCurrentBets,
    betSummary,
    history,
    latestWinners,
    placeBet,
    claimFreePoints
  };
}
