// src/modules/Entertainment/TaiXiu/hooks/useTaiXiuSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchWsTicket, getStoredSessionToken } from '@/services/playerApi';
import { useAuthStore } from '@/store/useAuthStore';

const HEARTBEAT_INTERVAL = 2500;
const CLOUDFLARE_WORKER_FALLBACK = 'https://windhub-worker.trinhgiaphong2k9.workers.dev';

export function useTaiXiuSocket({ roomId = 'tai-xiu-30s', userId, userName, customWorkerUrl, enabled = true }) {
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'
  const [roomState, setRoomState] = useState('WAITING'); // 'WAITING' | 'PLAYING' | 'RESULT' | 'CLOSED'
  const [currentRoundId, setCurrentRoundId] = useState('');
  const [roundEndTime, setRoundEndTime] = useState(0);
  const [waitingDuration, setWaitingDuration] = useState(30);
  const [dice, setDice] = useState([1, 2, 3]);
  const [total, setTotal] = useState(6);
  const [outcome, setOutcome] = useState('XIU');
  const [isTriple, setIsTriple] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [myPoints, setMyPoints] = useState(10000);
  const [myCurrentBets, setMyCurrentBets] = useState([]);
  const [betSummary, setBetSummary] = useState({ taiTotal: 0, xiuTotal: 0, baoTotal: 0 });
  const [history, setHistory] = useState([]);
  const [latestWinners, setLatestWinners] = useState([]);

  const socketRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isManuallyClosedRef = useRef(false);
  const lastProcessedSeqRef = useRef(0);
  const paramsRef = useRef({ roomId, userId, userName, customWorkerUrl, enabled });
  const backupStateRef = useRef({ bets: [], points: 10000 });

  useEffect(() => {
    paramsRef.current = { roomId, userId, userName, customWorkerUrl, enabled };
  }, [roomId, userId, userName, customWorkerUrl, enabled]);

  // Tính toán WebSocket URL an toàn (kết hợp One-time Ticket và Session Token dự phòng)
  const getWebSocketUrl = useCallback((ticket) => {
    const { roomId: rId, userId: uId, userName: uName, customWorkerUrl: cUrl } = paramsRef.current;
    let base = cUrl || import.meta.env.VITE_LOTTERY_WORKER_URL;
    if (base && (base.includes(':5173') || (typeof window !== 'undefined' && base === window.location.origin))) {
      base = '';
    }
    if (!base) {
      base = CLOUDFLARE_WORKER_FALLBACK;
    }
    base = base.replace(/\/+$/, '');

    let wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = base;
    if (base.startsWith('http://')) {
      wsProto = 'ws:';
      host = base.replace('http://', '');
    } else if (base.startsWith('https://')) {
      wsProto = 'wss:';
      host = base.replace('https://', '');
    }

    const queryParts = [`room=${encodeURIComponent(rId)}`];
    if (ticket) queryParts.push(`ticket=${encodeURIComponent(ticket)}`);
    const token = getStoredSessionToken();
    if (token) queryParts.push(`token=${encodeURIComponent(token)}`);
    if (uId) queryParts.push(`userId=${encodeURIComponent(uId)}`);
    if (uName) queryParts.push(`userName=${encodeURIComponent(uName)}`);

    const qs = queryParts.join('&');
    if (base.startsWith('ws://') || base.startsWith('wss://')) {
      return `${base}/api/lottery/ws?${qs}`;
    }

    return `${wsProto}//${host}/api/lottery/ws?${qs}`;
  }, []);

  // Gửi tin nhắn an toàn
  const send = useCallback((payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // Xử lý gói tin WebSocket
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.seq && data.seq < lastProcessedSeqRef.current && data.type !== 'SNAPSHOT') {
        return;
      }
      if (data.seq) {
        lastProcessedSeqRef.current = Math.max(lastProcessedSeqRef.current, data.seq);
      }

      switch (data.type) {
        case 'SNAPSHOT':
          lastProcessedSeqRef.current = data.seq || 0;
          setRoomState(data.state || 'WAITING');
          setCurrentRoundId(data.currentRoundId || '');
          setRoundEndTime(data.roundEndTime || 0);
          setWaitingDuration(data.waitingDuration || 30);
          if (data.dice) setDice(data.dice);
          if (data.total !== undefined) setTotal(data.total);
          if (data.outcome) setOutcome(data.outcome);
          setIsTriple(!!data.isTriple);
          setOnlineCount(data.onlineCount || 1);
          if (data.myPoints !== undefined) {
            setMyPoints(data.myPoints);
            useAuthStore.getState().updateBetBalance(data.myPoints);
          }
          if (data.myCurrentBets) setMyCurrentBets(data.myCurrentBets);
          if (data.betSummary) setBetSummary(data.betSummary);
          if (data.history) {
            const seen = new Set();
            const uniqueHistory = [];
            for (const item of data.history) {
              if (item?.roundId && !seen.has(item.roundId)) {
                seen.add(item.roundId);
                uniqueHistory.push(item);
              } else if (!item?.roundId) {
                uniqueHistory.push(item);
              }
            }
            setHistory(uniqueHistory);
          }
          break;

        case 'ROUND_START':
          setRoomState('WAITING');
          setCurrentRoundId(data.roundId);
          setRoundEndTime(data.endsAt);
          setWaitingDuration(data.duration || 30);
          setMyCurrentBets([]);
          setBetSummary({ taiTotal: 0, xiuTotal: 0, baoTotal: 0 });
          setLatestWinners([]);
          if (data.onlineCount) setOnlineCount(data.onlineCount);
          break;

        case 'ROUND_SHAKE':
          setRoomState('PLAYING');
          setCurrentRoundId(data.roundId);
          setRoundEndTime(data.endsAt);
          break;

        case 'ROUND_RESULT':
          setRoomState('RESULT');
          setCurrentRoundId(data.roundId);
          setDice(data.dice || [1, 2, 3]);
          setTotal(data.total || 6);
          setOutcome(data.outcome || 'XIU');
          setIsTriple(!!data.isTriple);
          setRoundEndTime(data.endsAt);
          setLatestWinners(data.winners || []);

          if (data.historyItem) {
            setHistory((prev) => {
              const withoutDuplicate = prev.filter((item) => item.roundId !== data.historyItem.roundId);
              return [data.historyItem, ...withoutDuplicate.slice(0, 49)];
            });
          }

          // Thông báo thắng/thua sẽ được phát ra khi người dùng hoặc hệ thống mở bát xong
          break;

        case 'BET_ACCEPTED':
          if (data.bet?.addedAmount && data.bet?.amount > data.bet?.addedAmount) {
            toast.success(`Đã cược thêm +${data.bet.addedAmount.toLocaleString()} xu vào cửa ${data.bet.sideName} (Tổng: ${data.bet.amount.toLocaleString()} xu)`);
          } else {
            toast.success(`Đã cược cửa ${data.bet?.sideName} (+${data.bet?.amount.toLocaleString()} xu)`);
          }
          setMyCurrentBets((prev) => {
            const existingIdx = prev.findIndex((b) => b.side === data.bet.side);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = data.bet;
              return updated;
            }
            return [...prev, data.bet];
          });
          if (data.newBalance !== undefined) {
            setMyPoints(data.newBalance);
            useAuthStore.getState().updateBetBalance(data.newBalance);
          }
          break;

        case 'BET_SUMMARY_UPDATE':
          if (data.betSummary) setBetSummary(data.betSummary);
          break;

        case 'BET_ERROR':
          toast.error(data.message || 'Không thể đặt cược.');
          if (backupStateRef.current) {
            setMyCurrentBets(backupStateRef.current.bets);
            setMyPoints(backupStateRef.current.points);
          }
          break;

        case 'POINTS_UPDATED':
          setMyPoints(data.points);
          useAuthStore.getState().updateBetBalance(data.points);
          if (data.message) toast.info(data.message);
          break;

        case 'PLAYER_JOIN':
        case 'PLAYER_LEAVE':
          if (data.onlineCount) setOnlineCount(data.onlineCount);
          break;

        case 'PONG':
          break;

        case 'ERROR':
          toast.error(data.message || 'Lỗi hệ thống');
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('[TaiXiuSocket] parse error:', err);
    }
  }, []);

  // Kết nối WebSocket (chống reload bão socket)
  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        isManuallyClosedRef.current = true;
        socketRef.current.close();
        socketRef.current = null;
      }
      clearInterval(heartbeatTimerRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      setConnectionStatus('DISCONNECTED');
      return;
    }

    isManuallyClosedRef.current = false;
    lastProcessedSeqRef.current = 0;
    let ws = null;

    const connectSocket = async () => {
      if (isManuallyClosedRef.current) return;
      setConnectionStatus((prev) => (prev === 'CONNECTED' ? 'CONNECTED' : prev === 'DISCONNECTED' ? 'RECONNECTING' : 'CONNECTING'));

      let ticket = '';
      try {
        const ticketRes = await fetchWsTicket();
        if (ticketRes?.ticket) {
          ticket = ticketRes.ticket;
        }
      } catch {
        // Fallback to cookie if ticket fetch fails
      }

      if (isManuallyClosedRef.current) return;

      const url = getWebSocketUrl(ticket);
      try {
        ws = new WebSocket(url);
        socketRef.current = ws;
      } catch {
        scheduleNextReconnect();
        return;
      }

      ws.onopen = () => {
        if (isManuallyClosedRef.current) return;
        setConnectionStatus('CONNECTED');
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, HEARTBEAT_INTERVAL);

        ws.send(JSON.stringify({
          type: 'GET_SNAPSHOT',
          userId: paramsRef.current.userId,
          userName: paramsRef.current.userName
        }));
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        clearInterval(heartbeatTimerRef.current);
        if (isManuallyClosedRef.current) return;
        setConnectionStatus('DISCONNECTED');
        scheduleNextReconnect();
      };

      ws.onerror = () => {
        // onclose sẽ xử lý reconnect
      };
    };

    const scheduleNextReconnect = () => {
      if (isManuallyClosedRef.current) return;
      setConnectionStatus('RECONNECTING');
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isManuallyClosedRef.current) {
          connectSocket();
        }
      }, 3500); // Tối thiểu 3.5s giữa các lần thử lại
    };

    connectSocket();

    return () => {
      isManuallyClosedRef.current = true;
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(heartbeatTimerRef.current);
      if (socketRef.current) {
        const sock = socketRef.current;
        if (sock.readyState === WebSocket.CONNECTING) {
          sock.onopen = () => {
            try {
              sock.close();
            } catch {
              // ignore socket close error during cleanup
            }
          };
          sock.onerror = () => {
            // ignore error during cleanup
          };
        } else if (sock.readyState === WebSocket.OPEN) {
          try {
            sock.close();
          } catch {
            // ignore socket close error during cleanup
          }
        }
        socketRef.current = null;
      }
    };
  }, [roomId, enabled, getWebSocketUrl, handleMessage]);

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

    // Sao lưu state hiện tại để rollback nếu gặp lỗi
    backupStateRef.current = { bets: myCurrentBets, points: myPoints };

    const sideName = betSide === 'TAI' ? 'Tài' : betSide === 'XIU' ? 'Xỉu' : 'Bão';

    // Cập nhật lạc quan (Optimistic update) ngay lập tức không cần đợi round-trip mạng
    setMyCurrentBets((prev) => {
      const idx = prev.findIndex((b) => b.side === betSide);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], amount: next[idx].amount + betNum };
        return next;
      }
      return [...prev, { side: betSide, amount: betNum, sideName }];
    });
    setMyPoints((p) => Math.max(0, p - betNum));

    const sent = send({
      type: 'PREDICT',
      roundId: currentRoundId,
      side: betSide,
      amount: betNum,
      userId: paramsRef.current.userId,
      userName: paramsRef.current.userName
    });

    if (!sent) {
      setMyCurrentBets(backupStateRef.current.bets);
      setMyPoints(backupStateRef.current.points);
      toast.error('Mất kết nối tới máy chủ. Đang thử kết nối lại...');
      return false;
    }
    return true;
  }, [roomState, myPoints, myCurrentBets, currentRoundId, send]);

  const claimFreePoints = useCallback(() => {
    return send({
      type: 'CLAIM_FREE_POINTS',
      userId: paramsRef.current.userId,
      userName: paramsRef.current.userName
    });
  }, [send]);

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
