import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Clipboard,
  Download,
  FileUp,
  Link2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import WebRTCCore from './core/WebRTCCore.js';
import ManualPairingAdapter from './pairing/ManualPairingAdapter.js';
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

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

export default function P2P() {
  const sessionRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const [status, setStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [offerInput, setOfferInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');
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
      onStateChange: setStatus,
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
    return () => {
      sessionRef.current?.fileTransfer.close();
      sessionRef.current?.textTransfer.close();
      sessionRef.current?.pairing.close();
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [createSession]);

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

  const handleCreateOffer = () => runAction(async () => {
    const value = await sessionRef.current.pairing.createOffer();
    setOffer(value);
  });

  const handleCreateAnswer = () => runAction(async () => {
    const value = await sessionRef.current.pairing.createAnswer(offerInput);
    setAnswer(value);
  });

  const handleAcceptAnswer = () => runAction(() => sessionRef.current.pairing.acceptAnswer(answerInput));

  const handleReset = () => {
    createSession();
    setStatus('idle');
    setBusy(false);
    setOffer('');
    setAnswer('');
    setOfferInput('');
    setAnswerInput('');
    setError('');
    setMessages([]);
    setText('');
    setSelectedFile(null);
    setTransfers([]);
    setReceivedFiles([]);
  };

  const handleCopy = async (value) => {
    try {
      await copyText(value);
      toast.success('Đã sao chép mã kết nối');
    } catch {
      setError('Không thể truy cập clipboard. Hãy chọn và sao chép mã thủ công.');
    }
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
              {connected && <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">Peer connected successfully.</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={15} />
            <span>DTLS encryption · Không upload lên server</span>
          </div>
        </div>
        {error && (
          <div role="alert" className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <span>{error}</span>
            <button type="button" aria-label="Đóng thông báo lỗi" onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}
        {!connected && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100"><Link2 size={17} /> Tạo kết nối</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tạo Offer, gửi mã cho thiết bị kia, rồi dán Answer nhận được.</p>
              <button type="button" disabled={busy || Boolean(offer)} onClick={handleCreateOffer} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
                {busy && status === 'creating' ? 'Đang tạo Offer…' : 'Create Connection'}
              </button>
              {offer && (
                <div className="space-y-2">
                  <label htmlFor="p2p-offer" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Offer (copy sang thiết bị B)</label>
                  <textarea id="p2p-offer" readOnly value={offer} className="h-28 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-black dark:text-slate-300" />
                  <button type="button" onClick={() => handleCopy(offer)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700"><Clipboard size={15} /> Copy Offer</button>
                  <label htmlFor="p2p-answer-input" className="block pt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Paste Answer</label>
                  <textarea id="p2p-answer-input" value={answerInput} onChange={(event) => setAnswerInput(event.target.value)} placeholder="Dán Answer từ thiết bị B…" className="h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-black" />
                  <button type="button" disabled={busy || !answerInput.trim()} onClick={handleAcceptAnswer} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50">Connect</button>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100"><Link2 size={17} /> Tham gia kết nối</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dán Offer từ thiết bị A. Sau khi tạo Answer, gửi ngược mã đó cho A.</p>
              <label htmlFor="p2p-offer-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Paste Offer</label>
              <textarea id="p2p-offer-input" value={offerInput} onChange={(event) => setOfferInput(event.target.value)} placeholder="Dán Offer từ thiết bị A…" className="h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-black" />
              <button type="button" disabled={busy || !offerInput.trim() || Boolean(answer)} onClick={handleCreateAnswer} className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-200 dark:text-black">
                {busy && status === 'creating' ? 'Đang tạo Answer…' : 'Create Answer'}
              </button>
              {answer && (
                <div className="space-y-2">
                  <label htmlFor="p2p-answer" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Answer (gửi lại thiết bị A)</label>
                  <textarea id="p2p-answer" readOnly value={answer} className="h-28 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-black dark:text-slate-300" />
                  <button type="button" onClick={() => handleCopy(answer)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700"><Clipboard size={15} /> Copy Answer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {connected && (
        <section className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Chức năng truyền P2P">
            <button type="button" role="tab" aria-selected={activeTab === 'text'} onClick={() => setActiveTab('text')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold ${activeTab === 'text' ? 'border-amber-500 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-500'}`}><MessageSquare size={16} /> Text</button>
            <button type="button" role="tab" aria-selected={activeTab === 'file'} onClick={() => setActiveTab('file')} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold ${activeTab === 'file' ? 'border-amber-500 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-500'}`}><FileUp size={16} /> File</button>
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
                <input ref={fileInputRef} type="file" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-slate-700">Chọn file</button>
                {selectedFile && (
                  <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left dark:bg-slate-800">
                    <span className="min-w-0 truncate text-sm">{selectedFile.name} · {formatBytes(selectedFile.size)}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={busy} onClick={handleSendFile} className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-bold text-black disabled:opacity-50"><Send size={14} /> Send File</button>
                      <button type="button" aria-label="Bỏ chọn file" onClick={() => setSelectedFile(null)} className="rounded p-1 text-slate-500"><X size={16} /></button>
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
                        <p className="mt-1 text-xs text-slate-500">{transfer.direction === 'send' ? 'Sending' : 'Receiving'} · {formatBytes(transfer.transferred)} / {formatBytes(transfer.fileSize)} · {transfer.status}</p>
                      </div>
                      {transfer.status === 'sending' || transfer.status === 'receiving' ? (
                        <button type="button" onClick={() => sessionRef.current.fileTransfer.cancelTransfer(transfer.fileId)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold dark:border-slate-700">Cancel</button>
                      ) : <span className="text-xs text-slate-500">{formatSpeed(transfer.speed)}</span>}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${percentage}%` }} /></div>
                    <p className="mt-1 text-right text-xs text-slate-500">{percentage}% · {formatSpeed(transfer.speed)}</p>
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
