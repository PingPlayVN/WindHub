// src/modules/Entertainment/TaiXiu/hooks/useTaiXiuSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const HEARTBEAT_INTERVAL = 2500;
const CLOUDFLARE_WORKER_FALLBACK = 'https://windhub-worker.trinhgiaphong2k9.workers.dev';

export function useTaiXiuSocket({ roomId = 'tai-xiu-30s', userId, userName, customWorkerUrl }) {
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
  const paramsRef = useRef({ roomId, userId, userName, customWorkerUrl });

  useEffect(() => {
    paramsRef.current = { roomId, userId, userName, customWorkerUrl };
  }, [roomId, userId, userName, customWorkerUrl]);

  // Tính toán WebSocket URL chuẩn
  const getWebSocketUrl = useCallback(() => {
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
    } else if (base.startsWith('ws://') || base.startsWith('wss://')) {
      return `${base}/api/lottery/ws?room=${encodeURIComponent(rId)}&userId=${encodeURIComponent(uId)}&userName=${encodeURIComponent(uName)}`;
    }

    return `${wsProto}//${host}/api/lottery/ws?room=${encodeURIComponent(rId)}&userId=${encodeURIComponent(uId)}&userName=${encodeURIComponent(uName)}`;
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
          if (data.myPoints !== undefined) setMyPoints(data.myPoints);
          if (data.myCurrentBets) setMyCurrentBets(data.myCurrentBets);
          if (data.betSummary) setBetSummary(data.betSummary);
          if (data.history) setHistory(data.history);
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
            setHistory((prev) => [data.historyItem, ...prev.slice(0, 49)]);
          }

          if (data.winners && data.winners.length > 0) {
            const myWin = data.winners.find((w) => w.userId === paramsRef.current.userId);
            if (myWin) {
              const sideName = myWin.betSide === 'TAI' ? 'TÀI' : myWin.betSide === 'XIU' ? 'XỈU' : 'BÃO';
              toast.success(`🎉 Thắng lớn! Cửa ${sideName} nổ giòn giã! Nhận +${myWin.payout.toLocaleString()} xu!`, {
                duration: 5000
              });
            }
          }
          break;

        case 'BET_ACCEPTED':
          toast.success(`Đã cược cửa ${data.bet.sideName} (+${data.bet.amount.toLocaleString()} xu)`);
          setMyCurrentBets((prev) => [...prev, data.bet]);
          if (data.newBalance !== undefined) setMyPoints(data.newBalance);
          break;

        case 'BET_SUMMARY_UPDATE':
          if (data.betSummary) setBetSummary(data.betSummary);
          break;

        case 'BET_ERROR':
          toast.error(data.message || 'Không thể đặt cược.');
          break;

        case 'POINTS_UPDATED':
          setMyPoints(data.points);
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
    isManuallyClosedRef.current = false;
    lastProcessedSeqRef.current = 0;
    let ws = null;

    const connectSocket = () => {
      if (isManuallyClosedRef.current) return;
      setConnectionStatus((prev) => (prev === 'CONNECTED' ? 'CONNECTED' : prev === 'DISCONNECTED' ? 'RECONNECTING' : 'CONNECTING'));

      const url = getWebSocketUrl();
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
            try { sock.close(); } catch {}
          };
          sock.onerror = () => {};
        } else if (sock.readyState === WebSocket.OPEN) {
          try { sock.close(); } catch {}
        }
        socketRef.current = null;
      }
    };
  }, [roomId, getWebSocketUrl, handleMessage]);

  const placeBet = useCallback((betSide, amount) => {
    return send({
      type: 'PREDICT',
      roundId: currentRoundId,
      side: betSide,
      amount,
      userId: paramsRef.current.userId,
      userName: paramsRef.current.userName
    });
  }, [currentRoundId, send]);

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
