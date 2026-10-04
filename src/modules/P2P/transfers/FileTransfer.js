import {
  DEFAULT_CHUNK_SIZE,
  HIGH_WATERMARK,
  LOW_WATERMARK,
  MAX_FILE_SIZE,
  MAX_CHUNK_SIZE,
  MIN_CHUNK_SIZE,
  PROGRESS_INTERVAL_MS,
  TRANSFER_WINDOW_SIZE,
  decodeControl,
  decodeFileChunk,
  encodeControl,
  encodeFileChunk,
  validateFileMetadata,
} from './protocol.js';

const CONTROL_TYPES = new Set(['FILE_START', 'FILE_END', 'CONTROL', 'ACK']);

function makeFileId() {
  return crypto.randomUUID();
}

class TransferQueue {
  constructor(windowSize = TRANSFER_WINDOW_SIZE) {
    this.windowSize = windowSize;
    this.pending = [];
    this.inFlight = 0;
  }

  enqueue(chunk) {
    if (this.pending.length >= this.windowSize * 4) return false;
    this.pending.push(chunk);
    return true;
  }

  canSend() {
    return this.inFlight < this.windowSize;
  }

  markSent() {
    this.inFlight += 1;
  }

  markAcked() {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }
}

export default class FileTransfer {
  constructor(core, { onProgress = () => {}, onReceived = () => {}, onError = () => {} } = {}) {
    this.core = core;
    this.onProgress = onProgress;
    this.onReceived = onReceived;
    this.onError = onError;
    this.outgoing = null;
    this.incoming = null;
    this.transferQueue = new TransferQueue();
    this.unsubscribe = core.onMessage((data, channelLabel) => this.receive(data, channelLabel));
  }

  getAdaptiveChunkSize(bufferedAmount) {
    if (bufferedAmount < LOW_WATERMARK) return Math.min(MAX_CHUNK_SIZE, Math.max(DEFAULT_CHUNK_SIZE, 40 * 1024));
    if (bufferedAmount < HIGH_WATERMARK) return Math.min(MAX_CHUNK_SIZE, Math.max(MIN_CHUNK_SIZE, Math.round(bufferedAmount / 32)));
    return MIN_CHUNK_SIZE;
  }

  async waitForBufferSpace(channel, bufferLimit = HIGH_WATERMARK) {
    if (!channel || channel.readyState !== 'open') throw new Error('DataChannel đã ngắt kết nối.');
    if (channel.bufferedAmount <= bufferLimit) return;

    await new Promise((resolve, reject) => {
      const onLow = () => {
        cleanup();
        resolve();
      };
      const onClose = () => {
        cleanup();
        reject(new Error('DataChannel đã đóng trong khi gửi file.'));
      };
      const cleanup = () => {
        channel.removeEventListener('bufferedamountlow', onLow);
        channel.removeEventListener('close', onClose);
      };
      channel.addEventListener('bufferedamountlow', onLow, { once: true });
      channel.addEventListener('close', onClose, { once: true });
      if (channel.bufferedAmount <= bufferLimit) onLow();
    });
  }

  async sendFile(file) {
    if (this.outgoing) throw new Error('Đang có một file được gửi. Hãy đợi hoặc hủy trước.');
    if (!(file instanceof File)) throw new Error('File được chọn không hợp lệ.');
    if (file.size > MAX_FILE_SIZE) throw new Error('Phiên bản hiện tại giới hạn file ở mức 1 GiB.');
    if (!file.name || file.name.length > 255 || /[\\/\u0000-\u001f]/.test(file.name)) {
      throw new Error('Tên file không hợp lệ.');
    }

    const fileChannel = this.core.fileChannel;
    const initialChunkSize = this.getAdaptiveChunkSize(fileChannel?.bufferedAmount || 0);
    const metadata = {
      type: 'FILE_START',
      fileId: makeFileId(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks: Math.ceil(file.size / initialChunkSize),
      chunkSize: initialChunkSize,
      createdAt: Date.now(),
    };

    const transfer = { metadata, cancelled: false, queue: new TransferQueue(), bytesSent: 0, startedAt: performance.now(), lastReportedAt: 0 };
    this.outgoing = transfer;

    const sendChunk = async (chunkIndex, start, end) => {
      if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
      await this.waitForBufferSpace(fileChannel, HIGH_WATERMARK);
      const slice = file.slice(start, end);
      const data = await slice.arrayBuffer();
      const chunkMeta = { type: 'FILE_CHUNK', fileId: metadata.fileId, chunkIndex, chunkSize: metadata.chunkSize };
      this.core.sendFile(encodeFileChunk(chunkMeta, data));
      transfer.bytesSent += data.byteLength;
      transfer.queue.markAcked();
      if (performance.now() - transfer.lastReportedAt >= PROGRESS_INTERVAL_MS || chunkIndex === metadata.totalChunks - 1) {
        const elapsed = Math.max((performance.now() - transfer.startedAt) / 1000, 0.001);
        this.onProgress({
          direction: 'send',
          fileId: metadata.fileId,
          fileName: file.name,
          fileSize: file.size,
          transferred: transfer.bytesSent,
          speed: transfer.bytesSent / elapsed,
          status: 'sending',
          chunkSize: metadata.chunkSize,
        });
        transfer.lastReportedAt = performance.now();
      }
    };

    try {
      this.core.send(encodeControl(metadata));
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: 0, speed: 0, status: 'sending', chunkSize: metadata.chunkSize,
      });

      for (let chunkIndex = 0; chunkIndex < metadata.totalChunks; chunkIndex += 1) {
        const start = chunkIndex * metadata.chunkSize;
        const end = Math.min(start + metadata.chunkSize, file.size);
        transfer.queue.enqueue({ chunkIndex, start, end, key: `${metadata.fileId}-${chunkIndex}` });
        while (transfer.queue.canSend() && transfer.queue.pending.length) {
          const next = transfer.queue.pending.shift();
          transfer.queue.markSent();
          await sendChunk(next.chunkIndex, next.start, next.end);
        }
      }

      while (transfer.queue.inFlight > 0) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      this.core.send(encodeControl({ type: 'FILE_END', fileId: metadata.fileId }));
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: file.size,
        speed: transfer.bytesSent / Math.max((performance.now() - transfer.startedAt) / 1000, 0.001),
        status: 'sent', chunkSize: metadata.chunkSize,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        try {
          this.core.send(encodeControl({ type: 'CONTROL', action: 'CANCEL', fileId: metadata.fileId }));
        } catch {
          // peer disconnected
        }
        this.onProgress({
          direction: 'send', fileId: metadata.fileId, fileName: file.name,
          fileSize: file.size, transferred: transfer.bytesSent, speed: 0, status: 'failed', chunkSize: metadata.chunkSize,
        });
      } else {
        this.onProgress({
          direction: 'send', fileId: metadata.fileId, fileName: file.name,
          fileSize: file.size, transferred: transfer.bytesSent, speed: 0, status: 'cancelled', chunkSize: metadata.chunkSize,
        });
      }
      throw error;
    } finally {
      if (this.outgoing === transfer) this.outgoing = null;
    }
  }

  cancelTransfer(fileId = this.outgoing?.metadata.fileId || this.incoming?.metadata.fileId) {
    if (!fileId) return;
    if (this.outgoing?.metadata.fileId === fileId) this.outgoing.cancelled = true;
    if (this.incoming?.metadata.fileId === fileId) {
      this.onProgress({
        direction: 'receive',
        fileId,
        fileName: this.incoming.metadata.fileName,
        fileSize: this.incoming.metadata.fileSize,
        transferred: this.incoming.receivedBytes,
        speed: 0,
        status: 'cancelled',
      });
      this.incoming = null;
    }
    try {
      this.core.send(encodeControl({ type: 'CONTROL', action: 'CANCEL', fileId }));
    } catch {
      if (this.outgoing?.metadata.fileId === fileId) this.outgoing.cancelled = true;
    }
  }

  receive(data, channelLabel) {
    try {
      if (channelLabel === 'windhub-file') {
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          this.receiveChunk(data);
          return;
        }
        return;
      }
      if (typeof data !== 'string') return;
      const message = decodeControl(data);
      if (!CONTROL_TYPES.has(message.type)) return;
      if (message.type === 'FILE_START') this.startReceive(message);
      else if (message.type === 'FILE_END') this.finishReceive(message);
      else if (message.type === 'CONTROL') this.receiveControl(message);
      else if (message.type === 'ACK') this.acknowledge(message);
    } catch (error) {
      this.onError(error);
      if (this.incoming) this.cancelTransfer(this.incoming.metadata.fileId);
    }
  }

  startReceive(metadata) {
    validateFileMetadata(metadata);
    if (this.incoming) throw new Error('Không thể nhận nhiều file cùng lúc.');
    this.incoming = {
      metadata,
      chunks: [],
      nextChunk: 0,
      receivedBytes: 0,
      startedAt: performance.now(),
      lastReportedAt: 0,
    };
    this.onProgress({
      direction: 'receive', fileId: metadata.fileId, fileName: metadata.fileName,
      fileSize: metadata.fileSize, transferred: 0, speed: 0, status: 'receiving', chunkSize: metadata.chunkSize,
    });
  }

  receiveChunk(frame) {
    const { metadata, data } = decodeFileChunk(frame instanceof ArrayBuffer ? frame : frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength));
    const transfer = this.incoming;
    if (!transfer || metadata.fileId !== transfer.metadata.fileId) throw new Error('Chunk không thuộc file đang nhận.');
    if (metadata.chunkIndex !== transfer.nextChunk || metadata.chunkIndex >= transfer.metadata.totalChunks) {
      throw new Error('Thứ tự hoặc chỉ số chunk không hợp lệ.');
    }

    const remaining = transfer.metadata.fileSize - transfer.receivedBytes;
    const expectedSize = Math.min(transfer.metadata.chunkSize, remaining);
    if (data.byteLength !== expectedSize || data.byteLength === 0) throw new Error('Kích thước chunk không hợp lệ.');
    transfer.chunks.push(new Uint8Array(data));
    transfer.receivedBytes += data.byteLength;
    transfer.nextChunk += 1;

    const now = performance.now();
    if (now - transfer.lastReportedAt >= PROGRESS_INTERVAL_MS || transfer.receivedBytes === transfer.metadata.fileSize) {
      this.onProgress({
        direction: 'receive', fileId: transfer.metadata.fileId,
        fileName: transfer.metadata.fileName, fileSize: transfer.metadata.fileSize,
        transferred: transfer.receivedBytes,
        speed: transfer.receivedBytes / Math.max((now - transfer.startedAt) / 1000, 0.001),
        status: 'receiving', chunkSize: transfer.metadata.chunkSize,
      });
      transfer.lastReportedAt = now;
    }

    try {
      this.core.send(encodeControl({ type: 'ACK', fileId: metadata.fileId, chunkIndex: metadata.chunkIndex }));
    } catch {
      throw new Error('Không thể xác nhận chunk đã nhận.');
    }
  }

  finishReceive(message) {
    const transfer = this.incoming;
    if (
      !transfer
      || message.fileId !== transfer.metadata.fileId
      || transfer.nextChunk !== transfer.metadata.totalChunks
      || transfer.receivedBytes !== transfer.metadata.fileSize
    ) {
      throw new Error('File nhận chưa đầy đủ hoặc FILE_END không hợp lệ.');
    }

    const blob = new Blob(transfer.chunks, { type: transfer.metadata.mimeType });
    this.onReceived({ ...transfer.metadata, blob });
    this.onProgress({
      direction: 'receive', fileId: transfer.metadata.fileId,
      fileName: transfer.metadata.fileName, fileSize: transfer.metadata.fileSize,
      transferred: transfer.receivedBytes, speed: 0, status: 'received', chunkSize: transfer.metadata.chunkSize,
    });
    this.incoming = null;
  }

  receiveControl(message) {
    if (message.action !== 'CANCEL' || typeof message.fileId !== 'string') {
      throw new Error('Lệnh điều khiển không hợp lệ.');
    }
    if (this.outgoing?.metadata.fileId === message.fileId) this.outgoing.cancelled = true;
    if (this.incoming?.metadata.fileId === message.fileId) {
      const { metadata, receivedBytes } = this.incoming;
      this.incoming = null;
      this.onProgress({
        direction: 'receive', fileId: metadata.fileId, fileName: metadata.fileName,
        fileSize: metadata.fileSize, transferred: receivedBytes, speed: 0, status: 'cancelled', chunkSize: metadata.chunkSize,
      });
    }
  }

  acknowledge(message) {
    if (this.outgoing && this.outgoing.metadata.fileId === message.fileId) {
      this.outgoing.transferAcknowledged = true;
      this.transferQueue.markAcked();
    }
  }

  close() {
    this.unsubscribe();
    if (this.incoming) this.cancelTransfer(this.incoming.metadata.fileId);
    if (this.outgoing) this.outgoing.cancelled = true;
  }
}
