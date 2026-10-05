import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileUp,
  Laptop,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import WebRTCCore from './core/WebRTCCore.js';
import ManualPairingAdapter from './pairing/ManualPairingAdapter.js';
import SignalingClient from './pairing/SignalingClient.js';
import TextTransfer from './transfers/TextTransfer.js';
import FileTransfer from './transfers/FileTransfer.js';
import { MAX_FILE_SIZE, MAX_TEXT_SIZE } from './transfers/protocol.js';

const connectionLabels = {
  idle: 'Idle',
  creating: 'Creating connection',
  waiting: 'Waiting for answer',
  connecting: 'Connecting',
  connected: 'Connected',
  disconnected: 'Disconnected',
  failed: 'Failed',
  closed: 'Closed',
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

export default function P2P() {
  const sessionRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const signalingRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);

  const createSession = useCallback(() => {
    sessionRef.current?.fileTransfer.close();
    sessionRef.current?.textTransfer.close();
    sessionRef.current?.pairing.close();

    const core = new WebRTCCore({
      onStateChange: (nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus !== 'connected') setConnectionStats(null);
        if (['disconnected', 'failed', 'closed'].includes(nextStatus)) setActivePeer(null);
      },
      onMessage: () => {},
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
  }, []);

  useEffect(() => {
    createSession();
    const objectUrls = objectUrlsRef.current;
    return () => {
      sessionRef.current?.fileTransfer.close();
      sessionRef.current?.textTransfer.close();
      sessionRef.current?.pairing.close();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [createSession]);

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
      onStateChange: (nextState, message) => {
        setSignalingState(nextState);
        if (message) setError(message);
        if (nextState === 'offline' || nextState === 'error') setDevices([]);
      },
      onMessage: async (message) => {
        if (message.type === 'devices') {
          setDevices(message.devices);
        } else if (message.type === 'connection-request') {
          setIncomingRequest(message);
        } else if (message.type === 'request-expired') {
          setIncomingRequest((current) => current?.requestId === message.requestId ? null : current);
          setOutgoingRequest((current) => current?.requestId === message.requestId ? null : current);
          setError('Yêu cầu kết nối đã hết hạn hoặc thiết bị kia đã ngoại tuyến.');
        } else if (message.type === 'request-sent') {
          setOutgoingRequest({ requestId: message.requestId, peer: message.to });
        } else if (message.type === 'connection-response') {
          setOutgoingRequest(null);
          if (!message.accepted) {
            setError(`${message.from.name} đã từ chối yêu cầu kết nối.`);
            return;
          }
          setActivePeer(message.from);
          setBusy(true);
          try {
            const signal = await sessionRef.current.pairing.createOffer();
            client.send({ type: 'offer', targetId: message.from.id, signal });
          } catch (connectionError) {
            setError(connectionError.message || 'Không thể tạo kết nối WebRTC.');
          } finally {
            setBusy(false);
          }
        } else if (message.type === 'offer') {
          setActivePeer(message.from);
          setBusy(true);
          try {
            const signal = await sessionRef.current.pairing.createAnswer(message.signal);
            client.send({ type: 'answer', targetId: message.from.id, signal });
          } catch (connectionError) {
            setError(connectionError.message || 'Không thể trả lời yêu cầu kết nối.');
          } finally {
            setBusy(false);
          }
        } else if (message.type === 'answer') {
          try {
            await sessionRef.current.pairing.acceptAnswer(message.signal);
          } catch (connectionError) {
            setError(connectionError.message || 'Không thể hoàn tất kết nối.');
          }
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
  }, [deviceName]);

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
    try {
      signalingRef.current.send({ type: 'request', targetId: peer.id });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleRespondToRequest = (accepted) => {
    if (!incomingRequest) return;
    try {
      signalingRef.current.send({
        type: 'respond',
        requestId: incomingRequest.requestId,
        accepted,
      });
      if (accepted) setActivePeer(incomingRequest.from);
      setIncomingRequest(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleReset = () => {
    let resetWarning = '';
    if (activePeer) {
      try {
        signalingRef.current?.send({ type: 'disconnect', targetId: activePeer.id });
      } catch {
        resetWarning = 'Đã tạo phiên mới; signaling server hiện không khả dụng.';
      }
    }
    createSession();
    setStatus('idle');
    setBusy(false);
    setError(resetWarning);
    setIncomingRequest(null);
    setOutgoingRequest(null);
    setActivePeer(null);
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">windhub // direct transfer</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">P2P Share</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trao đổi văn bản và file trực tiếp qua WebRTC DataChannel.</p>
        </div>
        <button type="button" onClick={handleReset} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RefreshCw size={16} /> Phiên mới
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101010]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${connected ? 'bg-emerald-500' : status === 'failed' ? 'bg-red-500' : 'bg-amber-400'}`} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{connectionLabels[status] || 'Idle'}</p>
              {connected && <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">Đã kết nối với {activePeer?.name || 'thiết bị'}.</p>}
              {connected && connectionStats && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {connectionStats.path === 'direct' ? 'P2P trực tiếp' : 'Đang relay'}
                  {connectionStats.protocol ? ` · ${connectionStats.protocol.toUpperCase()}` : ''}
                  {connectionStats.roundTripTime ? ` · RTT ${Math.round(connectionStats.roundTripTime * 1000)} ms` : ''}
                  {connectionStats.availableOutgoingBitrate ? ` · Ước tính tối đa ${formatSpeed(connectionStats.availableOutgoingBitrate / 8)}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={15} />
            <span>DTLS encryption · Server chỉ dùng ghép nối, không relay file/text</span>
          </div>
        </div>
        {error && (
          <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <span>{error}</span>
            <button type="button" aria-label="Đóng thông báo lỗi" onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}
        {!connected && (
          <div className="mt-4 space-y-4">
            {editingDeviceName ? (
              <form onSubmit={handleSaveDeviceName} className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Đặt tên thiết bị</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tên được lưu trên thiết bị này và hiển thị cho các thiết bị đang trực tuyến.</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    autoFocus
                    maxLength={32}
                    value={deviceNameInput}
                    onChange={(event) => setDeviceNameInput(event.target.value)}
                    placeholder="Ví dụ: Laptop Phong"
                    aria-label="Tên thiết bị"
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-black"
                  />
                  <button type="submit" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black">Lưu tên</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">Thiết bị này: <strong>{deviceName}</strong></p>
                <button type="button" onClick={() => setEditingDeviceName(true)} className="text-sm font-semibold text-amber-700 dark:text-amber-400">Đổi tên</button>
              </div>
            )}

            {signalingState !== 'online' && (
              <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {signalingState === 'connecting' ? 'Đang kết nối danh sách thiết bị…' : 'Chưa kết nối được máy chủ ghép nối. Máy chủ có thể đang khởi động hoặc tạm ngừng do gói miễn phí.'}
              </p>
            )}

            {incomingRequest && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-slate-800 dark:text-slate-100"><strong>{incomingRequest.from.name}</strong> muốn kết nối với thiết bị này.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleRespondToRequest(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700">Từ chối</button>
                  <button type="button" onClick={() => handleRespondToRequest(true)} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black">Chấp nhận</button>
                </div>
              </div>
            )}

            {outgoingRequest && (
              <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Đang chờ {outgoingRequest.peer.name} chấp nhận yêu cầu…
              </p>
            )}

            {activePeer && status !== 'connected' && (
              <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Đang thiết lập kết nối bảo mật với {activePeer.name}…
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Thiết bị đang trực tuyến</h2>
                <span className="text-xs text-slate-500">{devices.length} thiết bị</span>
              </div>
              {devices.length ? devices.map((peer) => (
                <div key={peer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <Laptop size={19} className="shrink-0 text-slate-400" />
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{peer.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={signalingState !== 'online' || busy || Boolean(outgoingRequest) || Boolean(activePeer)}
                    onClick={() => handleRequestConnection(peer)}
                    className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Kết nối
                  </button>
                </div>
              )) : (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700">
                  {signalingState === 'online' ? 'Chưa có thiết bị nào khác trực tuyến. Mở Share trên thiết bị kia để bắt đầu.' : 'Đang tìm thiết bị…'}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {connected && (
        <section className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Chức năng truyền P2P">
            <button type="button" role="tab" aria-selected={activeTab === 'file'} onClick={() => setActiveTab('file')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold ${activeTab === 'file' ? 'border-amber-500 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-500'}`}><FileUp size={16} /> File</button>
            <button type="button" role="tab" aria-selected={activeTab === 'text'} onClick={() => setActiveTab('text')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold ${activeTab === 'text' ? 'border-amber-500 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-500'}`}><MessageSquare size={16} /> Text</button>
          </div>

          {activeTab === 'text' ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101010]">
              <div className="max-h-[45vh] min-h-48 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 dark:bg-black">
                {messages.length ? messages.map((message) => (
                  <article key={message.id} className={`max-w-[90%] rounded-xl px-3 py-2 ${message.direction === 'sent' ? 'ml-auto bg-amber-100 text-slate-900 dark:bg-amber-950/50 dark:text-amber-100' : 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    <p className="mt-1 text-right text-[11px] opacity-60">{message.direction === 'sent' ? 'Sent' : 'Received'} · {formatTime(message.timestamp)}</p>
                  </article>
                )) : <p className="py-12 text-center text-sm text-slate-500">Chưa có tin nhắn. Gửi lời chào đầu tiên!</p>}
              </div>
              <form onSubmit={handleSendText} className="space-y-2">
                <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhập tin nhắn…" rows={3} className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-black" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">{formatBytes(new TextEncoder().encode(text).byteLength)} / {formatBytes(MAX_TEXT_SIZE)}</span>
                  <button type="submit" disabled={!text.trim()} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"><Send size={15} /> Send</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`rounded-xl border-2 border-dashed p-5 text-center transition ${isDragging ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-300 dark:border-slate-700'}`}
              >
                <FileUp className="mx-auto mb-2 text-slate-400" size={25} />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kéo thả file vào đây hoặc chọn từ thiết bị</p>
                <p className="mt-1 text-xs text-slate-500">Giới hạn mỗi file: {formatBytes(MAX_FILE_SIZE)}. File chỉ nằm trên thiết bị của bạn.</p>
                <input ref={fileInputRef} type="file" disabled={busy} className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">Chọn file</button>
                {selectedFile && (
                  <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left dark:bg-slate-800">
                    <span className="min-w-0 truncate text-sm">{selectedFile.name} · {formatBytes(selectedFile.size)}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={busy} onClick={handleSendFile} className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-bold text-black disabled:opacity-50"><Send size={14} /> Send File</button>
                      <button type="button" disabled={busy} aria-label="Bỏ chọn file" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="rounded p-1 text-slate-500 disabled:opacity-50"><X size={16} /></button>
                    </div>
                  </div>
                )}
              </div>

              {transfers.map((transfer) => {
                const percentage = transfer.fileSize ? Math.min(100, Math.round((transfer.transferred / transfer.fileSize) * 100)) : 100;
                return (
                  <article key={transfer.fileId} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101010]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{transfer.fileName}</p>
                        <p className="mt-1 text-xs text-slate-500">{transfer.direction === 'send' ? 'Đang gửi' : 'Đang nhận'} · {formatBytes(transfer.transferred)} / {formatBytes(transfer.fileSize)} · {transferStatusLabel(transfer.status)}</p>
                        {['sending', 'receiving'].includes(transfer.status) && transfer.speed > 0 && (
                          <p className="mt-1 text-xs text-slate-500">{formatSpeed(transfer.speed)}{transfer.fileSize > transfer.transferred ? ` · ${formatRemainingTime((transfer.fileSize - transfer.transferred) / transfer.speed)}` : ''}</p>
                        )}
                      </div>
                      {['preparing', 'sending', 'receiving'].includes(transfer.status) ? (
                        <button type="button" onClick={() => sessionRef.current.fileTransfer.cancelTransfer(transfer.fileId)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700">Cancel</button>
                      ) : <span className="text-xs text-slate-500">{formatSpeed(transfer.speed)}</span>}
                    </div>
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                      role="progressbar"
                      aria-label={`Tiến trình ${transfer.fileName}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                    >
                      <div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {percentage}%{['sending', 'receiving'].includes(transfer.status) && transfer.speed > 0 ? ` · ${formatSpeed(transfer.speed)}` : ''}
                    </p>
                  </article>
                );
              })}

              {receivedFiles.map((file) => (
                <article key={file.fileId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{file.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">Đã nhận hoàn tất · {formatBytes(file.fileSize)}</p>
                  </div>
                  <button type="button" onClick={() => handleDownload(file)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600"><Download size={15} /> Download</button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="text-center text-xs leading-5 text-slate-500">
        Offer/Answer chứa thông tin mạng, chỉ chia sẻ với peer tin cậy. Kết nối cần HTTPS (hoặc localhost); STUN hỗ trợ ICE nhưng không bảo đảm vượt mọi NAT/firewall.
      </p>
      {status === 'connected' && <span className="sr-only"><Check /></span>}
    </div>
  );
}
