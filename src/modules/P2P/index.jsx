import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Check,
  Copy,
  Download,
  Edit3,
  FileUp,
  Laptop,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
import { Button, Card, EmptyState, GlassCard } from '@/components/os';
import { staggerContainerVariants, staggerItemVariants } from '@/design-system/motion';
import WebRTCCore from './core/WebRTCCore.js';
import ManualPairingAdapter from './pairing/ManualPairingAdapter.js';
import { canTransitionPairing } from './pairing/PairingState.js';
import SignalingClient from './pairing/SignalingClient.js';
import TextTransfer from './transfers/TextTransfer.js';
import FileTransfer from './transfers/FileTransfer.js';
import { MAX_FILE_SIZE, MAX_TEXT_SIZE } from './transfers/protocol.js';

const connectionLabels = {
  idle: 'Sẵn sàng ghép nối',
  creating: 'Đang khởi tạo kênh',
  waiting: 'Đang chờ phản hồi',
  connecting: 'Đang thiết lập P2P',
  connected: 'Đã kết nối trực tiếp',
  disconnected: 'Đã ngắt kết nối',
  failed: 'Kết nối thất bại',
  closed: 'Đã đóng phiên',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

function formatSpeed(bytesPerSecond) {
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(timestamp);
}

function transferStatusLabel(status) {
  return ({
    preparing: 'Đang chờ thiết bị nhận',
    sending: 'Đang gửi',
    receiving: 'Đang nhận',
    sent: 'Đã gửi',
    received: 'Đã nhận',
    cancelled: 'Đã hủy',
    failed: 'Thất bại',
  })[status] || status;
}

function formatRemainingTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds < 60) return `Còn khoảng ${Math.ceil(seconds)} giây`;
  if (seconds < 3600) return `Còn khoảng ${Math.ceil(seconds / 60)} phút`;
  return `Còn khoảng ${Math.ceil(seconds / 3600)} giờ`;
}

function logP2PTiming(sessionId, event, durationMs = null) {
  if (!import.meta.env.DEV) return;
  console.info('[P2P timing]', {
    sessionId: sessionId || null,
    event,
    durationMs: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
  });
}

function getP2PTimestamp() {
  return performance.now();
}

function getStableDeviceId() {
  const key = 'windhub-p2p-device-id';
  try {
    const storedId = window.localStorage.getItem(key);
    if (storedId) return storedId;
  } catch {
    // Continue with session storage when persistent storage is unavailable.
  }
  try {
    const storedId = window.sessionStorage.getItem(key);
    if (storedId) return storedId;
  } catch {
    // Use an in-memory identity when browser storage is disabled.
  }
  const nextId = crypto.randomUUID();
  try {
    window.localStorage.setItem(key, nextId);
  } catch {
    try {
      window.sessionStorage.setItem(key, nextId);
    } catch {
      return nextId;
    }
  }
  return nextId;
}

export default function P2P() {
  const sessionRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const signalingRef = useRef(null);
  const activePeerIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const requestIdRef = useRef(null);
  const initiatorIdRef = useRef(null);
  const queuedLocalCandidatesRef = useRef([]);
  const pairingStartedAtRef = useRef(null);
  const requestSentAtRef = useRef(null);
  const incomingRequestRef = useRef(null);
  const pairingStateRef = useRef('IDLE');
  const pairingTimerRef = useRef(null);
  const pairingTimeoutHandlerRef = useRef(() => {});
  const sessionGenerationRef = useRef(0);
  const timingRef = useRef({});
  const discoveryStartedAtRef = useRef(null);
  const discoveryLoggedRef = useRef(false);
  const [status, setStatus] = useState('idle');
  const [pairingState, setPairingState] = useState('IDLE');
  const [busy, setBusy] = useState(false);
  const [deviceId] = useState(getStableDeviceId);
  const [deviceName, setDeviceName] = useState(() => window.localStorage.getItem('windhub-p2p-device-name') || '');
  const [deviceNameInput, setDeviceNameInput] = useState(() => window.localStorage.getItem('windhub-p2p-device-name') || '');
  const [editingDeviceName, setEditingDeviceName] = useState(!window.localStorage.getItem('windhub-p2p-device-name'));
  const [signalingState, setSignalingState] = useState('offline');
  const [devices, setDevices] = useState([]);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [outgoingRequest, setOutgoingRequest] = useState(null);
  const [activePeer, setActivePeer] = useState(null);
  const [connectionStats, setConnectionStats] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);

  const clearPairingTimer = useCallback(() => {
    clearTimeout(pairingTimerRef.current);
    pairingTimerRef.current = null;
  }, []);

  const setPairingStage = useCallback((nextState, { timeoutMs = 0, onTimeout = null } = {}) => {
    const currentState = pairingStateRef.current;
    if (currentState !== nextState && !canTransitionPairing(currentState, nextState)) {
      if (import.meta.env.DEV) console.warn('[P2P pairing] Invalid state transition', { currentState, nextState });
      return false;
    }
    clearPairingTimer();
    pairingStateRef.current = nextState;
    setPairingState(nextState);
    if (timeoutMs > 0 && onTimeout) {
      const sessionId = sessionIdRef.current;
      pairingTimerRef.current = setTimeout(() => {
        pairingTimerRef.current = null;
        if (pairingStateRef.current === nextState && sessionIdRef.current === sessionId) onTimeout();
      }, timeoutMs);
    }
    return true;
  }, [clearPairingTimer]);

  const flushQueuedLocalCandidates = useCallback(() => {
    const targetId = activePeerIdRef.current;
    const currentSessionId = sessionIdRef.current;
    const client = signalingRef.current;
    if (!targetId || !currentSessionId || !client || client.socket?.readyState !== WebSocket.OPEN) {
      return;
    }
    while (queuedLocalCandidatesRef.current.length > 0) {
      const queuedCandidate = queuedLocalCandidatesRef.current[0];
      if (queuedCandidate.sessionId && queuedCandidate.sessionId !== currentSessionId) {
        queuedLocalCandidatesRef.current.shift();
        continue;
      }
      try {
        client.send({
          type: 'ice-candidate',
          targetId,
          sessionId: currentSessionId,
          candidate: queuedCandidate.candidate,
          usernameFragment: queuedCandidate.usernameFragment,
        });
      } catch (signalError) {
        setError(signalError.message || 'Không thể gửi ICE candidate qua signaling.');
        return;
      }
      queuedLocalCandidatesRef.current.shift();
    }
  }, []);

  const queueLocalIceCandidate = useCallback((candidate, usernameFragment) => {
    const nextSessionId = sessionIdRef.current;
    queuedLocalCandidatesRef.current.push({
      sessionId: nextSessionId,
      candidate: candidate ?? null,
      usernameFragment: usernameFragment || null,
    });
    flushQueuedLocalCandidates();
  }, [flushQueuedLocalCandidates]);

  const createSession = useCallback(() => {
    sessionGenerationRef.current += 1;
    const generation = sessionGenerationRef.current;
    sessionRef.current?.fileTransfer.close();
    sessionRef.current?.textTransfer.close();
    sessionRef.current?.pairing.close();
    sessionIdRef.current = null;
    queuedLocalCandidatesRef.current = [];

    const core = new WebRTCCore({
      onStateChange: (nextStatus) => {
        if (generation !== sessionGenerationRef.current) return;
        setStatus(nextStatus);
        if (nextStatus !== 'connected') setConnectionStats(null);
        if (nextStatus === 'connected' && pairingStateRef.current === 'NEGOTIATING') {
          setPairingStage('CONNECTED');
          const startedAt = pairingStartedAtRef.current;
          if (startedAt !== null && !timingRef.current.totalLogged) {
            timingRef.current.totalLogged = true;
            logP2PTiming(sessionIdRef.current, 'total-pairing', getP2PTimestamp() - startedAt);
          }
        }
      },
      onMessage: () => { },
      onSignal: (candidate, usernameFragment) => {
        if (generation !== sessionGenerationRef.current) return;
        const targetId = activePeerIdRef.current;
        if (!sessionIdRef.current || !targetId || !signalingRef.current) {
          queueLocalIceCandidate(candidate, usernameFragment);
          return;
        }
        try {
          signalingRef.current.send({
            type: 'ice-candidate',
            targetId,
            sessionId: sessionIdRef.current,
            candidate,
            usernameFragment,
          });
        } catch (signalError) {
          queueLocalIceCandidate(candidate, usernameFragment);
          setError(signalError.message || 'Không thể gửi ICE candidate qua signaling.');
        }
      },
      onError: (connectionError) => {
        if (generation === sessionGenerationRef.current) setError(connectionError.message || 'Không thể áp dụng ICE candidate.');
      },
      onTiming: (event, durationMs) => {
        if (generation === sessionGenerationRef.current) logP2PTiming(sessionIdRef.current, event, durationMs);
      },
      onIceRestartRequest: async () => {
        if (generation !== sessionGenerationRef.current) return;
        const targetId = activePeerIdRef.current;
        const currentSessionId = sessionIdRef.current;
        const client = signalingRef.current;
        if (!targetId || !currentSessionId || !client || !initiatorIdRef.current) {
          core.iceRestartInProgress = false;
          return;
        }
        try {
          if (pairingStateRef.current === 'CONNECTED') {
            setPairingStage('NEGOTIATING', {
              timeoutMs: 45_000,
              onTimeout: () => pairingTimeoutHandlerRef.current('FAILED', 'ICE restart mất quá nhiều thời gian.'),
            });
          }
          if (initiatorIdRef.current === deviceId) {
            const signal = await core.createIceRestartOffer();
            if (generation !== sessionGenerationRef.current || sessionIdRef.current !== currentSessionId) return;
            client.send({ type: 'offer', targetId, sessionId: currentSessionId, signal });
          } else {
            client.send({
              type: 'ice-restart-request',
              targetId: initiatorIdRef.current,
              sessionId: currentSessionId,
            });
          }
        } catch (restartError) {
          if (generation === sessionGenerationRef.current) {
            setError(restartError.message || 'Không thể khởi động lại kết nối ICE.');
          }
          throw restartError;
        }
      },
    });
    const pairing = new ManualPairingAdapter(core);
    const textTransfer = new TextTransfer(core, {
      onText: (message) => setMessages((current) => [...current, { ...message, direction: 'received' }]),
      onError: (transferError) => setError(transferError.message),
    });
    const fileTransfer = new FileTransfer(core, {
      onProgress: (progress) => setTransfers((current) => {
        const existingIndex = current.findIndex((item) => item.fileId === progress.fileId);
        if (existingIndex === -1) return [...current.slice(-9), progress];
        return current.map((item, index) => (index === existingIndex ? progress : item));
      }),
      onReceived: (file) => {
        const url = URL.createObjectURL(file.blob);
        objectUrlsRef.current.push(url);
        setReceivedFiles((current) => [...current, { ...file, url }]);
      },
      onError: (transferError) => setError(transferError.message),
    });
    sessionRef.current = { pairing, textTransfer, fileTransfer };
  }, [deviceId, queueLocalIceCandidate, setPairingStage]);

  const clearPairingRefs = useCallback(() => {
    clearPairingTimer();
    requestIdRef.current = null;
    sessionIdRef.current = null;
    activePeerIdRef.current = null;
    initiatorIdRef.current = null;
    queuedLocalCandidatesRef.current = [];
    pairingStartedAtRef.current = null;
    requestSentAtRef.current = null;
    incomingRequestRef.current = null;
    timingRef.current = {};
  }, [clearPairingTimer]);

  const terminatePairing = useCallback((nextState, message = '', { notify = true } = {}) => {
    const client = signalingRef.current;
    const currentStage = pairingStateRef.current;
    try {
      if (notify && client && currentStage === 'REQUESTED' && requestIdRef.current && sessionIdRef.current) {
        if (timingRef.current.requestDirection === 'incoming') {
          client.send({
            type: 'respond',
            requestId: requestIdRef.current,
            sessionId: sessionIdRef.current,
            accepted: false,
          });
        } else {
          client.send({
            type: 'cancel',
            requestId: requestIdRef.current,
            sessionId: sessionIdRef.current,
          });
          if (incomingRequestRef.current && incomingRequestRef.current.requestId !== requestIdRef.current) {
            client.send({
              type: 'respond',
              requestId: incomingRequestRef.current.requestId,
              sessionId: incomingRequestRef.current.sessionId,
              accepted: false,
            });
          }
        }
      } else if (notify && client && activePeerIdRef.current && sessionIdRef.current) {
        client.send({
          type: 'disconnect',
          targetId: activePeerIdRef.current,
          sessionId: sessionIdRef.current,
        });
      }
    } catch (signalError) {
      if (notify) setError(signalError.message || 'Không thể hủy phiên ghép nối qua signaling.');
    }

    clearPairingRefs();
    createSession();
    setStatus('idle');
    setBusy(false);
    setIncomingRequest(null);
    setOutgoingRequest(null);
    setActivePeer(null);
    setPairingStage(nextState);
    if (message) setError(message);
  }, [clearPairingRefs, createSession, setPairingStage]);

  useEffect(() => {
    pairingTimeoutHandlerRef.current = terminatePairing;
  }, [terminatePairing]);

  useEffect(() => {
    createSession();
    const objectUrls = objectUrlsRef.current;
    return () => {
      sessionGenerationRef.current += 1;
      clearPairingTimer();
      sessionRef.current?.fileTransfer.close();
      sessionRef.current?.textTransfer.close();
      sessionRef.current?.pairing.close();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [clearPairingTimer, createSession]);

  useEffect(() => {
    if (status !== 'connected') return undefined;

    let active = true;
    const readStats = async () => {
      try {
        const stats = await sessionRef.current?.pairing.core.getConnectionStats();
        if (active) setConnectionStats(stats);
      } catch (statsError) {
        if (active) setError(`Không đọc được thống kê WebRTC: ${statsError.message}`);
      }
    };
    readStats();
    const timer = setInterval(readStats, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status]);

  useEffect(() => {
    if (!deviceName) return undefined;
    const endpoint = import.meta.env.VITE_P2P_SIGNALING_URL || 'https://windhub-p2p-signaling.onrender.com';
    const client = new SignalingClient(endpoint, {
      name: deviceName,
      deviceId,
      onStateChange: (nextState, message) => {
        setSignalingState(nextState);
        if (message) setError(message);
        if (nextState === 'offline' || nextState === 'error') {
          setDevices((currentDevices) => currentDevices.map((device) => ({ ...device, status: 'RECONNECTING' })));
          if (nextState === 'offline' && ['REQUESTED', 'ACCEPTED', 'NEGOTIATING'].includes(pairingStateRef.current)) {
            terminatePairing('INTERRUPTED', 'Signaling đã ngắt trong khi ghép nối. Hãy thử lại.', { notify: false });
          }
        }
        if (nextState === 'online') {
          setDevices([]);
          discoveryStartedAtRef.current = getP2PTimestamp();
          discoveryLoggedRef.current = false;
        }
      },
      onMessage: async (message) => {
        if (message.type === 'devices') {
          if (!discoveryLoggedRef.current && discoveryStartedAtRef.current !== null) {
            discoveryLoggedRef.current = true;
            logP2PTiming(null, 'device-discovery', getP2PTimestamp() - discoveryStartedAtRef.current);
          }
          const uniqueDevices = new Map(
            message.devices
              .filter((peer) => peer.id !== deviceId)
              .map((peer) => [peer.id, { ...peer, status: 'ACTIVE' }]),
          );
          setDevices([...uniqueDevices.values()]);
        } else if (message.type === 'device-upsert') {
          if (message.device?.id === deviceId) return;
          setDevices((currentDevices) => [
            ...currentDevices.filter((device) => device.id !== message.device.id),
            { ...message.device, status: 'ACTIVE' },
          ]);
        } else if (message.type === 'device-left') {
          setDevices((currentDevices) => currentDevices.filter((device) => (
            device.id !== message.deviceId
            || device.connectionId !== message.connectionId
          )));
        } else if (message.type === 'connection-request') {
          if (!message.requestId || !message.sessionId || !message.from?.id) return;
          if (
            message.requestId === requestIdRef.current
            || message.requestId === incomingRequestRef.current?.requestId
          ) return;
          const sameOutgoingPeer = timingRef.current.requestDirection === 'outgoing'
            && activePeerIdRef.current === message.from.id;
          const coreIsIdle = sessionRef.current?.pairing.core.state === 'idle';
          const canAcceptRequest = [
            'IDLE', 'REJECTED', 'EXPIRED', 'CANCELLED', 'FAILED', 'INTERRUPTED',
          ].includes(pairingStateRef.current) && coreIsIdle;
          if (canAcceptRequest) {
            requestIdRef.current = message.requestId;
            sessionIdRef.current = message.sessionId;
            activePeerIdRef.current = message.from.id;
            timingRef.current = {
              requestDirection: 'incoming',
              requestReceivedAt: getP2PTimestamp(),
            };
            pairingStartedAtRef.current = timingRef.current.requestReceivedAt;
            incomingRequestRef.current = message;
            setIncomingRequest(message);
            setPairingStage('REQUESTED', {
              timeoutMs: 90_000,
              onTimeout: () => terminatePairing('EXPIRED', 'Yêu cầu kết nối đã hết hạn.'),
            });
          } else if (sameOutgoingPeer && pairingStateRef.current === 'REQUESTED') {
            incomingRequestRef.current = message;
            setIncomingRequest(message);
          } else {
            client.send({
              type: 'respond',
              requestId: message.requestId,
              sessionId: message.sessionId,
              accepted: false,
            });
          }
        } else if (message.type === 'request-expired') {
          if (message.requestId !== requestIdRef.current) return;
          terminatePairing('EXPIRED', 'Yêu cầu kết nối đã hết hạn hoặc thiết bị kia đã ngoại tuyến.', { notify: false });
        } else if (message.type === 'request-cancelled') {
          if (message.requestId !== requestIdRef.current) return;
          terminatePairing('CANCELLED', 'Yêu cầu kết nối đã bị hủy.', { notify: false });
        } else if (message.type === 'request-sent') {
          if (
            message.requestId !== requestIdRef.current
            && pairingStateRef.current === 'REQUESTED'
            && timingRef.current.requestDirection === 'outgoing'
            && message.sessionId === sessionIdRef.current
          ) requestIdRef.current = message.requestId;
          if (message.requestId !== requestIdRef.current) return;
          if (message.sessionId) sessionIdRef.current = message.sessionId;
          setOutgoingRequest({ requestId: message.requestId, peer: message.to });
          if (requestSentAtRef.current !== null) {
            logP2PTiming(sessionIdRef.current, 'request-delivery', getP2PTimestamp() - requestSentAtRef.current);
          }
        } else if (message.type === 'connection-response') {
          if (message.requestId !== requestIdRef.current) return;
          if (message.sessionId) sessionIdRef.current = message.sessionId;
          incomingRequestRef.current = null;
          setIncomingRequest(null);
          setOutgoingRequest(null);
          if (!message.accepted) {
            terminatePairing('REJECTED', `${message.from?.name || 'Thiết bị'} đã từ chối yêu cầu kết nối.`, { notify: false });
            return;
          }
          const acceptedAt = getP2PTimestamp();
          const acceptanceBase = requestSentAtRef.current ?? timingRef.current.requestReceivedAt;
          if (acceptanceBase !== undefined && acceptanceBase !== null) {
            logP2PTiming(sessionIdRef.current, 'user-acceptance', acceptedAt - acceptanceBase);
          }
          requestSentAtRef.current = null;
          pairingStartedAtRef.current ??= acceptedAt;
          timingRef.current.initiatorId = message.initiatorId || deviceId;
          initiatorIdRef.current = timingRef.current.initiatorId;
          if (!setPairingStage('ACCEPTED', {
            timeoutMs: 10_000,
            onTimeout: () => terminatePairing('FAILED', 'Ghép nối không được xác nhận kịp thời.'),
          })) return;
          activePeerIdRef.current = message.from.id;
          setActivePeer(message.from);
          if (!setPairingStage('NEGOTIATING', {
            timeoutMs: 45_000,
            onTimeout: () => terminatePairing('FAILED', 'Kết nối WebRTC mất quá nhiều thời gian.'),
          })) return;
          if (initiatorIdRef.current === deviceId) {
            setBusy(true);
            try {
              const signal = await sessionRef.current.pairing.createOffer();
              if (pairingStateRef.current !== 'NEGOTIATING' || sessionIdRef.current !== message.sessionId) return;
              client.send({
                type: 'offer',
                targetId: message.from.id,
                sessionId: sessionIdRef.current,
                signal,
              });
              timingRef.current.offerSentAt = getP2PTimestamp();
              flushQueuedLocalCandidates();
            } catch (connectionError) {
              if (sessionIdRef.current === message.sessionId && pairingStateRef.current === 'NEGOTIATING') {
                terminatePairing('FAILED', connectionError.message || 'Không thể tạo kết nối WebRTC.');
              }
            } finally {
              if (sessionIdRef.current === message.sessionId) setBusy(false);
            }
          }
        } else if (message.type === 'response-sent') {
          if (message.requestId !== requestIdRef.current) return;
          if (message.sessionId) sessionIdRef.current = message.sessionId;
          if (!message.accepted) {
            terminatePairing('REJECTED', '', { notify: false });
            return;
          }
          const acceptedAt = getP2PTimestamp();
          const requestReceivedAt = timingRef.current.requestReceivedAt;
          if (requestReceivedAt !== undefined) {
            logP2PTiming(sessionIdRef.current, 'user-acceptance', acceptedAt - requestReceivedAt);
          }
          initiatorIdRef.current = message.initiatorId || message.from?.id;
          timingRef.current.initiatorId = initiatorIdRef.current;
          if (!setPairingStage('ACCEPTED', {
            timeoutMs: 10_000,
            onTimeout: () => terminatePairing('FAILED', 'Ghép nối không được xác nhận kịp thời.'),
          })) return;
          if (!setPairingStage('NEGOTIATING', {
            timeoutMs: 45_000,
            onTimeout: () => terminatePairing('FAILED', 'Kết nối WebRTC mất quá nhiều thời gian.'),
          })) return;
          activePeerIdRef.current = message.from.id;
          setActivePeer(message.from);
        } else if (message.type === 'offer') {
          if (
            message.sessionId !== sessionIdRef.current
            || message.from?.id !== activePeerIdRef.current
            || !['NEGOTIATING', 'CONNECTED'].includes(pairingStateRef.current)
            || initiatorIdRef.current !== message.from.id
          ) return;
          const offerKey = `${message.sessionId}:${message.signal}`;
          if (timingRef.current.remoteOfferKey === offerKey) return;
          timingRef.current.remoteOfferKey = offerKey;
          if (pairingStateRef.current === 'CONNECTED') {
            setPairingStage('NEGOTIATING', {
              timeoutMs: 45_000,
              onTimeout: () => terminatePairing('FAILED', 'ICE restart mất quá nhiều thời gian.'),
            });
          }
          activePeerIdRef.current = message.from.id;
          setActivePeer(message.from);
          setBusy(true);
          try {
            const signal = await sessionRef.current.pairing.createAnswer(message.signal);
            if (!['NEGOTIATING', 'CONNECTED'].includes(pairingStateRef.current) || message.sessionId !== sessionIdRef.current) return;
            client.send({
              type: 'answer',
              targetId: message.from.id,
              sessionId: sessionIdRef.current,
              signal,
            });
            timingRef.current.answerSentAt = getP2PTimestamp();
            flushQueuedLocalCandidates();
          } catch (connectionError) {
            if (sessionIdRef.current === message.sessionId && pairingStateRef.current === 'NEGOTIATING') {
              terminatePairing('FAILED', connectionError.message || 'Không thể trả lời yêu cầu kết nối.');
            }
          } finally {
            if (sessionIdRef.current === message.sessionId) setBusy(false);
          }
        } else if (message.type === 'answer') {
          if (
            message.sessionId !== sessionIdRef.current
            || message.from?.id !== activePeerIdRef.current
            || !['NEGOTIATING', 'CONNECTED'].includes(pairingStateRef.current)
            || initiatorIdRef.current !== deviceId
          ) return;
          if (timingRef.current.offerSentAt !== undefined) {
            logP2PTiming(sessionIdRef.current, 'answer-delivery', getP2PTimestamp() - timingRef.current.offerSentAt);
          }
          try {
            await sessionRef.current.pairing.acceptAnswer(message.signal);
            flushQueuedLocalCandidates();
          } catch (connectionError) {
            if (sessionIdRef.current === message.sessionId && pairingStateRef.current === 'NEGOTIATING') {
              terminatePairing('FAILED', connectionError.message || 'Không thể hoàn tất kết nối.');
            }
          }
        } else if (message.type === 'ice-candidate') {
          if (
            message.sessionId !== sessionIdRef.current
            || message.from?.id !== activePeerIdRef.current
            || !['NEGOTIATING', 'CONNECTED'].includes(pairingStateRef.current)
          ) return;
          try {
            await sessionRef.current.pairing.addIceCandidate(message.candidate, message.usernameFragment);
          } catch (connectionError) {
            if (sessionIdRef.current === message.sessionId) {
              setError(connectionError.message || 'Không thể áp dụng ICE candidate.');
            }
          }
        } else if (message.type === 'ice-restart-request') {
          if (
            message.sessionId !== sessionIdRef.current
            || message.from?.id !== activePeerIdRef.current
            || initiatorIdRef.current !== deviceId
            || pairingStateRef.current !== 'CONNECTED'
          ) return;
          setPairingStage('NEGOTIATING', {
            timeoutMs: 45_000,
            onTimeout: () => terminatePairing('FAILED', 'ICE restart mất quá nhiều thời gian.'),
          });
          try {
            const signal = await sessionRef.current.pairing.core.createIceRestartOffer();
            if (message.sessionId !== sessionIdRef.current || pairingStateRef.current !== 'NEGOTIATING') return;
            client.send({
              type: 'offer',
              targetId: activePeerIdRef.current,
              sessionId: sessionIdRef.current,
              signal,
            });
            timingRef.current.offerSentAt = getP2PTimestamp();
          } catch (restartError) {
            if (sessionIdRef.current === message.sessionId && pairingStateRef.current === 'NEGOTIATING') {
              terminatePairing('FAILED', restartError.message || 'Không thể khởi động lại kết nối ICE.');
            }
          }
        } else if (message.type === 'disconnect' || message.type === 'session-interrupted') {
          if (message.sessionId !== sessionIdRef.current) return;
          terminatePairing(
            'INTERRUPTED',
            message.reason === 'disconnected' ? 'Thiết bị kia đã ngắt kết nối.' : '',
            { notify: false },
          );
        } else if (message.type === 'error') {
          setError(message.message);
        }
      },
    });
    signalingRef.current = client;
    client.connect();
    return () => {
      client.close();
      if (signalingRef.current === client) signalingRef.current = null;
    };
  }, [deviceId, deviceName, flushQueuedLocalCandidates, setPairingStage, terminatePairing]);

  const runAction = async (action) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (actionError) {
      if (actionError.name !== 'AbortError') {
        setError(actionError.message || 'Đã xảy ra lỗi khi thiết lập kết nối.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDeviceName = (event) => {
    event.preventDefault();
    const name = deviceNameInput.trim().slice(0, 32);
    if (!name) {
      setError('Hãy nhập tên thiết bị.');
      return;
    }
    window.localStorage.setItem('windhub-p2p-device-name', name);
    setError('');
    setDeviceName(name);
    setDeviceNameInput(name);
    setEditingDeviceName(false);
  };

  const handleRequestConnection = (peer) => {
    setError('');
    if (
      signalingState !== 'online'
      || !['IDLE', 'REJECTED', 'EXPIRED', 'CANCELLED', 'FAILED', 'INTERRUPTED'].includes(pairingStateRef.current)
    ) return;
    if (sessionRef.current?.pairing.core.state !== 'idle') {
      setError('Hãy tạo phiên mới trước khi bắt đầu ghép nối khác.');
      return;
    }
    const requestId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    requestIdRef.current = requestId;
    sessionIdRef.current = sessionId;
    activePeerIdRef.current = peer.id;
    pairingStartedAtRef.current = getP2PTimestamp();
    requestSentAtRef.current = pairingStartedAtRef.current;
    timingRef.current = { requestDirection: 'outgoing', requestStartedAt: requestSentAtRef.current };
    setOutgoingRequest({ requestId, peer });
    setPairingStage('REQUESTED', {
      timeoutMs: 90_000,
      onTimeout: () => terminatePairing('EXPIRED', 'Yêu cầu kết nối đã hết hạn.'),
    });
    try {
      signalingRef.current.send({ type: 'request', targetId: peer.id, requestId, sessionId });
    } catch (requestError) {
      terminatePairing('FAILED', requestError.message || 'Không thể gửi yêu cầu kết nối.');
    }
  };

  const handleRespondToRequest = (accepted) => {
    const request = incomingRequestRef.current || incomingRequest;
    if (!request) return;
    try {
      if (accepted) {
        const outgoingRequestId = requestIdRef.current;
        if (
          timingRef.current.requestDirection === 'outgoing'
          && outgoingRequestId
          && outgoingRequestId !== request.requestId
        ) {
          signalingRef.current.send({
            type: 'cancel',
            requestId: outgoingRequestId,
            sessionId: sessionIdRef.current,
          });
        }
        requestIdRef.current = request.requestId;
        sessionIdRef.current = request.sessionId;
        timingRef.current = {
          requestDirection: 'incoming',
          requestReceivedAt: timingRef.current.requestReceivedAt ?? getP2PTimestamp(),
        };
        pairingStartedAtRef.current ??= timingRef.current.requestReceivedAt;
        requestSentAtRef.current = null;
        activePeerIdRef.current = request.from.id;
        setActivePeer(request.from);
        setOutgoingRequest(null);
        if (!setPairingStage('ACCEPTED', {
          timeoutMs: 10_000,
          onTimeout: () => terminatePairing('FAILED', 'Ghép nối không được xác nhận kịp thời.'),
        })) return;
      } else {
        const hasOutgoingRequest = timingRef.current.requestDirection === 'outgoing'
          && requestIdRef.current !== request.requestId;
        if (!hasOutgoingRequest) {
          requestIdRef.current = request.requestId;
          sessionIdRef.current = request.sessionId;
          timingRef.current = { requestDirection: 'incoming' };
        }
      }
      signalingRef.current.send({
        type: 'respond',
        requestId: request.requestId,
        accepted,
        sessionId: request.sessionId,
      });
      incomingRequestRef.current = null;
      setIncomingRequest(null);
      if (!accepted && timingRef.current.requestDirection !== 'outgoing') {
        activePeerIdRef.current = null;
        requestIdRef.current = null;
        sessionIdRef.current = null;
        pairingStartedAtRef.current = null;
        requestSentAtRef.current = null;
        setActivePeer(null);
        setPairingStage('REJECTED');
      }
    } catch (requestError) {
      terminatePairing('FAILED', requestError.message || 'Không thể phản hồi yêu cầu kết nối.');
    }
  };

  const handleCancelPairing = () => {
    terminatePairing('CANCELLED', 'Đã hủy ghép nối.');
  };

  const handleReset = () => {
    terminatePairing('IDLE', '');
    setMessages([]);
    setText('');
    setSelectedFile(null);
    setTransfers([]);
    setReceivedFiles([]);
  };

  const handleSendText = (event) => {
    event.preventDefault();
    setError('');
    try {
      const message = sessionRef.current.textTransfer.sendText(text);
      setMessages((current) => [...current, { ...message, direction: 'sent' }]);
      setText('');
    } catch (sendError) {
      setError(sendError.message);
    }
  };

  const handleCopyMessage = async (message) => {
    try {
      try {
        await navigator.clipboard.writeText(message.text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = message.text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        let copied;
        try {
          textarea.select();
          copied = document.execCommand('copy');
        } finally {
          textarea.remove();
        }
        if (!copied) throw new Error('Clipboard is unavailable');
      }
      setCopiedMessageId(message.id);
    } catch {
      setError('Không thể sao chép văn bản vào clipboard.');
    }
  };

  const handleSendFile = () => {
    if (!selectedFile) return;
    runAction(async () => {
      await sessionRef.current.fileTransfer.sendFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const [file] = event.dataTransfer.files;
    if (file) setSelectedFile(file);
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.fileName;
    link.click();
  };

  const connected = status === 'connected';
  const statusOrbClass = connected
    ? 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
    : status === 'failed'
      ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.45)]'
      : 'bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.4)]';

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-5xl space-y-5 pb-6"
    >
      {/* Hero Super-Device Header */}
      <motion.div variants={staggerItemVariants}>
        <GlassCard className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[var(--os-accent)]/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--os-accent)]">
                <Radio size={12} />
                <span>WindDrop // WebRTC Direct</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--os-text-primary)]">
                P2P Share
              </h1>
              <p className="text-sm text-[var(--os-text-secondary)] max-w-xl">
                Truyền tệp tin dung lượng lớn và tin nhắn trực tiếp ngang hàng giữa các thiết bị với mã hóa đầu cuối DTLS.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={15} />}
              onClick={handleReset}
            >
              Phiên mới
            </Button>
          </div>

          {/* Live Connection Telemetry Strip */}
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--os-border)] bg-[var(--os-surface-2)]/75 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex size-3.5 shrink-0 items-center justify-center">
                {signalingState === 'online' && !connected && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-55" />
                )}
                <span className={`relative inline-flex size-3 rounded-full ${statusOrbClass}`} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[var(--os-text-primary)]">
                    {connectionLabels[status] || 'Idle'}
                  </p>
                  <span className="rounded-full border border-[var(--os-border)] bg-[var(--os-surface-1)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">
                    {signalingState === 'online' ? 'Radar Online' : signalingState === 'connecting' ? 'Đang kết nối' : 'Radar Offline'}
                  </span>
                </div>

                {connected && (
                  <p className="mt-0.5 text-xs font-medium text-[var(--os-success)]">
                    Đã ghép nối bảo mật với <strong>{activePeer?.name || 'thiết bị đối tác'}</strong>
                  </p>
                )}

                {connected && connectionStats && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[var(--os-text-secondary)]">
                    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--os-border)] bg-[var(--os-surface-1)] px-2 py-0.5">
                      <Activity size={11} className="text-[var(--os-accent)]" />
                      {connectionStats.path === 'direct' ? 'P2P Trực tiếp' : 'Đang Relay'}
                    </span>
                    {connectionStats.protocol && (
                      <span className="rounded-md border border-[var(--os-border)] bg-[var(--os-surface-1)] px-2 py-0.5">
                        {connectionStats.protocol.toUpperCase()}
                      </span>
                    )}
                    {connectionStats.roundTripTime ? (
                      <span className="rounded-md border border-[var(--os-border)] bg-[var(--os-surface-1)] px-2 py-0.5">
                        RTT {Math.round(connectionStats.roundTripTime * 1000)} ms
                      </span>
                    ) : null}
                    {connectionStats.availableOutgoingBitrate ? (
                      <span className="rounded-md border border-[var(--os-border)] bg-[var(--os-surface-1)] px-2 py-0.5">
                        Max ~{formatSpeed(connectionStats.availableOutgoingBitrate / 8)}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--os-text-muted)]">
              <ShieldCheck size={15} className="shrink-0 text-[var(--os-success)]" />
              <span>Mã hóa DTLS · Server không lưu trữ tệp hay tin nhắn</span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3.5 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-red-500/30 bg-[var(--os-danger-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--os-danger)]"
            >
              <span>{error}</span>
              <button
                type="button"
                aria-label="Đóng thông báo lỗi"
                onClick={() => setError('')}
                className="os-focus-ring rounded-md p-1 hover:bg-red-500/15 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Discovery & Pairing Radar (when not connected) */}
      {!connected && (
        <motion.div variants={staggerItemVariants} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: Local Device Identity */}
          <Card className="lg:col-span-5 p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]">
                  <Laptop size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--os-text-primary)]">Danh tính thiết bị này</h2>
                  <p className="text-xs text-[var(--os-text-muted)]">Hiển thị trên radar ghép nối nội bộ</p>
                </div>
              </div>

              {editingDeviceName ? (
                <form onSubmit={handleSaveDeviceName} className="space-y-3 mt-4">
                  <input
                    autoFocus
                    maxLength={32}
                    value={deviceNameInput}
                    onChange={(event) => setDeviceNameInput(event.target.value)}
                    placeholder="Ví dụ: MacBook của Phong"
                    aria-label="Tên thiết bị"
                    className="os-focus-ring h-11 w-full rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-3.5 text-sm font-medium text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {deviceName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeviceNameInput(deviceName);
                          setEditingDeviceName(false);
                        }}
                      >
                        Hủy
                      </Button>
                    )}
                    <Button type="submit" variant="primary" size="sm">
                      Lưu tên thiết bị
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)]/70 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">
                      Tên hiển thị
                    </p>
                    <p className="truncate text-base font-bold text-[var(--os-text-primary)]">
                      {deviceName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconLeft={<Edit3 size={14} />}
                    onClick={() => setEditingDeviceName(true)}
                  >
                    Đổi tên
                  </Button>
                </div>
              )}
            </div>

            {signalingState !== 'online' && deviceName && (
              <div
                role="status"
                className="rounded-[var(--radius-md)] border border-amber-500/25 bg-[var(--os-warning-soft)] px-3.5 py-3 text-xs leading-relaxed text-[var(--os-text-secondary)]"
              >
                {signalingState === 'connecting'
                  ? 'Đang đồng bộ danh sách thiết bị trực tuyến…'
                  : 'Chưa kết nối được máy chủ ghép nối. Máy chủ có thể đang khởi động lại từ chế độ ngủ (Render Free Tier).'}
              </div>
            )}
          </Card>

          {/* Right Column: Nearby Online Peers & Active Handshakes */}
          <Card className="lg:col-span-7 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-sky-500/12 text-sky-500 border border-sky-500/20">
                  <Wifi size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--os-text-primary)]">
                    Thiết bị đang trực tuyến
                  </h2>
                  <p className="text-xs text-[var(--os-text-muted)]">
                    Chọn một thiết bị để bắt đầu phiên truyền P2P
                  </p>
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--os-border)] bg-[var(--os-surface-2)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--os-text-secondary)]">
                {devices.length} thiết bị
              </span>
            </div>

            {incomingRequest && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] p-4"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-accent)]">
                    Yêu cầu ghép nối đến
                  </p>
                  <p className="text-sm text-[var(--os-text-primary)]">
                    <strong>{incomingRequest.from.name}</strong> muốn kết nối trực tiếp với thiết bị này.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRespondToRequest(false)}
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleRespondToRequest(true)}
                  >
                    Chấp nhận
                  </Button>
                </div>
              </div>
            )}

            {outgoingRequest && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-4 py-3 text-sm text-[var(--os-text-secondary)]"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[var(--os-accent)] animate-pulse" />
                  <span>
                    Đang chờ <strong>{outgoingRequest.peer.name}</strong> chấp nhận yêu cầu…
                  </span>
                </span>
                <Button type="button" variant="outline" size="xs" onClick={handleCancelPairing}>
                  Hủy
                </Button>
              </div>
            )}

            {activePeer && status !== 'connected' && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-4 py-3 text-sm text-[var(--os-text-secondary)]"
              >
                <span>
                  Đang thiết lập kênh bảo mật với <strong>{activePeer.name}</strong>…
                </span>
                <Button type="button" variant="outline" size="xs" onClick={handleCancelPairing}>
                  Hủy
                </Button>
              </div>
            )}

            {devices.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {devices.map((peer) => {
                  const isConnectDisabled =
                    signalingState !== 'online'
                    || busy
                    || Boolean(outgoingRequest)
                    || Boolean(activePeer)
                    || !['IDLE', 'REJECTED', 'EXPIRED', 'CANCELLED', 'FAILED', 'INTERRUPTED'].includes(pairingState);

                  return (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)]/65 p-3.5 transition-colors hover:border-[var(--os-border-strong)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--os-surface-1)] border border-[var(--os-border)] text-[var(--os-accent)]">
                          <Laptop size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[var(--os-text-primary)]">
                            {peer.name}
                          </p>
                          <p className="text-[11px] text-[var(--os-success)] font-medium">
                            Sẵn sàng nhận
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isConnectDisabled}
                        onClick={() => handleRequestConnection(peer)}
                      >
                        Kết nối
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Radio size={22} />}
                title={
                  signalingState === 'online'
                    ? 'Chưa phát hiện thiết bị lân cận'
                    : 'Đang khởi động radar tìm thiết bị…'
                }
                description={
                  signalingState === 'online'
                    ? 'Mở mục P2P Share trên điện thoại hoặc máy tính thứ hai để xuất hiện tức thì tại đây.'
                    : 'Đặt tên thiết bị và giữ cửa sổ này mở để sẵn sàng ghép nối.'
                }
              />
            )}
          </Card>
        </motion.div>
      )}

      {/* Active Connected Transfer Workspace */}
      {connected && (
        <motion.section variants={staggerItemVariants} className="space-y-4">
          {/* Accessible Segmented Tablist */}
          <div
            role="tablist"
            aria-label="Chức năng truyền P2P"
            className="os-sunken inline-flex items-center gap-1 rounded-[var(--radius-lg)] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'file'}
              onClick={() => setActiveTab('file')}
              className={`os-focus-ring inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold transition-all ${
                activeTab === 'file'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-[var(--os-shadow-sm)] border border-[var(--os-border)]'
                  : 'text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <FileUp size={16} />
              <span>Truyền Tệp</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
              className={`os-focus-ring inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-[var(--os-surface-1)] text-[var(--os-accent)] shadow-[var(--os-shadow-sm)] border border-[var(--os-border)]'
                  : 'text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]'
              }`}
            >
              <MessageSquare size={16} />
              <span>Văn Bản Nhanh</span>
            </button>
          </div>

          {activeTab === 'text' ? (
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="os-sunken max-h-[46vh] min-h-56 space-y-3 overflow-y-auto custom-scrollbar rounded-[var(--radius-lg)] p-3.5 sm:p-4">
                {messages.length > 0 ? (
                  messages.map((message) => {
                    const isSent = message.direction === 'sent';
                    return (
                      <article
                        key={message.id}
                        className={`max-w-[88%] sm:max-w-[78%] rounded-[var(--radius-lg)] px-4 py-2.5 border ${
                          isSent
                            ? 'ml-auto border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-text-primary)]'
                            : 'border-[var(--os-border)] bg-[var(--os-surface-1)] text-[var(--os-text-primary)] shadow-[var(--os-shadow-sm)]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {message.text}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[var(--os-text-muted)]">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(message)}
                            aria-label={copiedMessageId === message.id ? 'Đã sao chép văn bản' : 'Sao chép văn bản'}
                            title={copiedMessageId === message.id ? 'Đã sao chép' : 'Sao chép văn bản'}
                            className="os-focus-ring inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] transition-colors"
                          >
                            {copiedMessageId === message.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedMessageId === message.id ? 'Đã sao chép' : 'Sao chép'}</span>
                          </button>
                          <span className="font-mono">
                            {isSent ? 'Đã gửi' : 'Đã nhận'} · {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="flex h-44 items-center justify-center text-center text-sm text-[var(--os-text-muted)]">
                    Chưa có tin nhắn nào trong phiên này. Hãy gửi đoạn văn bản hoặc liên kết đầu tiên!
                  </div>
                )}
              </div>

              <form onSubmit={handleSendText} className="space-y-2.5">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Dán đoạn mã, liên kết hoặc lời nhắn…"
                  rows={3}
                  className="os-focus-ring w-full resize-y rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] p-3.5 text-sm text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[var(--os-text-muted)]">
                    {formatBytes(new TextEncoder().encode(text).byteLength)} / {formatBytes(MAX_TEXT_SIZE)}
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!text.trim()}
                    iconLeft={<Send size={15} />}
                  >
                    Gửi tin nhắn
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* File Dropzone */}
              <Card
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                  isDragging
                    ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)]'
                    : 'border-[var(--os-border-strong)]'
                }`}
              >
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)] border border-[var(--os-accent-border)]">
                  <FileUp size={26} />
                </div>
                <p className="text-base font-bold text-[var(--os-text-primary)]">
                  Kéo thả tệp vào đây hoặc chọn từ thiết bị
                </p>
                <p className="mt-1 text-xs text-[var(--os-text-muted)]">
                  Giới hạn mỗi tệp: {formatBytes(MAX_FILE_SIZE)} · Truyền trực tiếp từ bộ nhớ thiết bị, không qua đám mây.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  disabled={busy}
                  className="sr-only"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Chọn tệp từ máy
                  </Button>
                </div>

                {selectedFile && (
                  <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-[var(--os-surface-2)] px-4 py-3 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--os-text-primary)]">
                        {selectedFile.name}
                      </p>
                      <p className="font-mono text-xs text-[var(--os-text-muted)]">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        loading={busy}
                        iconLeft={<Send size={14} />}
                        onClick={handleSendFile}
                      >
                        Gửi tệp ngay
                      </Button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label="Bỏ chọn file"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="os-focus-ring rounded-lg p-1.5 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text-primary)] disabled:opacity-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Live Transfer Progress Cards */}
              {transfers.map((transfer) => {
                const percentage = transfer.fileSize
                  ? Math.min(100, Math.round((transfer.transferred / transfer.fileSize) * 100))
                  : 100;
                const isActive = ['preparing', 'sending', 'receiving'].includes(transfer.status);

                return (
                  <Card key={transfer.fileId} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--os-text-primary)]">
                          {transfer.fileName}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">
                          {transfer.direction === 'send' ? 'Đang gửi đi' : 'Đang nhận về'} ·{' '}
                          <span className="font-mono">
                            {formatBytes(transfer.transferred)} / {formatBytes(transfer.fileSize)}
                          </span>{' '}
                          · {transferStatusLabel(transfer.status)}
                        </p>
                        {isActive && transfer.speed > 0 && (
                          <p className="mt-0.5 font-mono text-xs text-[var(--os-accent)]">
                            {formatSpeed(transfer.speed)}
                            {transfer.fileSize > transfer.transferred
                              ? ` · ${formatRemainingTime((transfer.fileSize - transfer.transferred) / transfer.speed)}`
                              : ''}
                          </p>
                        )}
                      </div>

                      {isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => sessionRef.current.fileTransfer.cancelTransfer(transfer.fileId)}
                        >
                          Hủy truyền
                        </Button>
                      ) : (
                        <span className="font-mono text-xs text-[var(--os-text-muted)]">
                          {formatSpeed(transfer.speed)}
                        </span>
                      )}
                    </div>

                    <div
                      className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-[var(--os-surface-3)]"
                      role="progressbar"
                      aria-label={`Tiến trình ${transfer.fileName}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--os-accent)] to-amber-400 transition-[width] duration-200"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-1.5 text-right font-mono text-xs text-[var(--os-text-muted)]">
                      {percentage}%
                      {isActive && transfer.speed > 0 ? ` · ${formatSpeed(transfer.speed)}` : ''}
                    </p>
                  </Card>
                );
              })}

              {/* Completed Received Files */}
              {receivedFiles.map((file) => (
                <Card
                  key={file.fileId}
                  className="flex flex-wrap items-center justify-between gap-3 border-emerald-500/30 bg-[var(--os-success-soft)] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--os-text-primary)]">
                      {file.fileName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--os-text-secondary)]">
                      Đã nhận hoàn tất · <span className="font-mono">{formatBytes(file.fileSize)}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    iconLeft={<Download size={15} />}
                    onClick={() => handleDownload(file)}
                  >
                    Tải xuống máy
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </motion.section>
      )}

      <p className="text-center text-xs leading-relaxed text-[var(--os-text-muted)] px-2">
        Offer/Answer chứa thông tin định tuyến mạng — chỉ ghép nối với thiết bị tin cậy. Kết nối yêu cầu HTTPS (hoặc localhost); STUN hỗ trợ xuyên NAT nhưng một số mạng doanh nghiệp nghiêm ngặt có thể chặn UDP.
      </p>
      {status === 'connected' && (
        <span className="sr-only">
          <Check />
        </span>
      )}
    </motion.div>
  );
}
