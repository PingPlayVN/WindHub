import {
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

const CONTROL_TYPES = new Set(['FILE_START', 'FILE_END', 'FILE_READY', 'CONTROL', 'ACK']);
const ACK_TIMEOUT_MS = 30_000;

function makeFileId() {
  return crypto.randomUUID();
}

export default class FileTransfer {
  constructor(core, { onProgress = () => {}, onReceived = () => {}, onError = () => {} } = {}) {
    this.core = core;
    this.onProgress = onProgress;
    this.onReceived = onReceived;
    this.onError = onError;
    this.outgoing = null;
    this.incoming = null;
    this.unsubscribe = core.onMessage((data, channelLabel) => this.receive(data, channelLabel));
  }

  getAdaptiveChunkSize(bufferedAmount) {
    if (bufferedAmount < LOW_WATERMARK) return MAX_CHUNK_SIZE;
    if (bufferedAmount < HIGH_WATERMARK) return Math.min(MAX_CHUNK_SIZE, Math.max(MIN_CHUNK_SIZE, Math.round(bufferedAmount / 32)));
    return MIN_CHUNK_SIZE;
  }

  async waitForBufferSpace(channel, transfer, bufferLimit = HIGH_WATERMARK) {
    if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
    if (!channel || channel.readyState !== 'open') throw new Error('DataChannel đã ngắt kết nối.');
    if (channel.bufferedAmount <= bufferLimit) return;

    await new Promise((resolve, reject) => {
      let settled = false;
      const onLow = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onClose = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('DataChannel đã đóng trong khi gửi file.'));
      };
      const onCancel = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new DOMException('Đã hủy gửi file.', 'AbortError'));
      };
      const cleanup = () => {
        channel.removeEventListener('bufferedamountlow', onLow);
        channel.removeEventListener('close', onClose);
        transfer.cancelWaiters.delete(onCancel);
      };
      channel.addEventListener('bufferedamountlow', onLow, { once: true });
      channel.addEventListener('close', onClose, { once: true });
      transfer.cancelWaiters.add(onCancel);
      if (channel.bufferedAmount <= bufferLimit) onLow();
    });
  }

  async sendFile(file) {
    if (this.outgoing) throw new Error('Đang có một file được gửi. Hãy đợi hoặc hủy trước.');
    if (!(file instanceof File)) throw new Error('File được chọn không hợp lệ.');
    if (file.size > MAX_FILE_SIZE) throw new Error('Phiên bản hiện tại giới hạn file ở mức 1 GiB.');
    if (!file.name || file.name.length > 255 || /[\\/\p{Cc}]/u.test(file.name)) {
      throw new Error('Tên file không hợp lệ.');
    }

    const fileChannel = this.core.fileChannel;
    if (!fileChannel || fileChannel.readyState !== 'open') {
      throw new Error('Kênh truyền file chưa sẵn sàng. Hãy đợi kết nối ổn định rồi thử lại.');
    }
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

    const transfer = {
      metadata,
      fileName: file.name,
      cancelled: false,
      cancelWaiters: new Set(),
      pendingAcks: new Map(),
      ready: null,
      bytesSent: 0,
      lastProgressBytes: 0,
      lastReportedAt: performance.now(),
      lastSpeed: 0,
    };
    this.outgoing = transfer;

    const sendChunk = async (chunkIndex, start, end) => {
      if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
      await this.waitForBufferSpace(fileChannel, transfer, HIGH_WATERMARK);
      if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
      const slice = file.slice(start, end);
      const data = await slice.arrayBuffer();
      if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
      const chunkMeta = { type: 'FILE_CHUNK', fileId: metadata.fileId, chunkIndex, chunkSize: metadata.chunkSize };
      const acknowledgement = this.waitForAcknowledgement(transfer, chunkIndex, data.byteLength);
      this.core.sendFile(encodeFileChunk(chunkMeta, data));
      return { acknowledgement };
    };

    try {
      const readyPromise = this.waitForReceiverReady(transfer);
      this.core.send(encodeControl(metadata));
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: 0, speed: 0, status: 'preparing', chunkSize: metadata.chunkSize,
      });
      await readyPromise;
      transfer.lastReportedAt = performance.now();
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: 0, speed: 0, status: 'sending', chunkSize: metadata.chunkSize,
      });

      const inFlight = [];
      for (let chunkIndex = 0; chunkIndex < metadata.totalChunks; chunkIndex += 1) {
        const start = chunkIndex * metadata.chunkSize;
        const end = Math.min(start + metadata.chunkSize, file.size);
        inFlight.push((await sendChunk(chunkIndex, start, end)).acknowledgement);
        if (inFlight.length >= TRANSFER_WINDOW_SIZE) await inFlight.shift();
      }

      await Promise.all(inFlight);
      if (transfer.cancelled) throw new DOMException('Đã hủy gửi file.', 'AbortError');
      this.core.send(encodeControl({ type: 'FILE_END', fileId: metadata.fileId }));
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: file.size,
        speed: transfer.lastSpeed,
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
      if (transfer.ready) {
        clearTimeout(transfer.ready.timeout);
        transfer.ready.reject(new DOMException('Đã đóng truyền file.', 'AbortError'));
        transfer.ready = null;
      }
      transfer.pendingAcks.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(new DOMException('Đã đóng truyền file.', 'AbortError'));
      });
      transfer.pendingAcks.clear();
      transfer.cancelWaiters.clear();
      if (this.outgoing === transfer) this.outgoing = null;
    }
  }

  cancelTransfer(fileId = this.outgoing?.metadata.fileId || this.incoming?.metadata.fileId) {
    if (!fileId) return;
    if (this.outgoing?.metadata.fileId === fileId) {
      this.outgoing.cancelled = true;
      this.outgoing.cancelWaiters.forEach((wake) => wake());
      this.rejectPendingAcknowledgements(this.outgoing, new DOMException('Đã hủy gửi file.', 'AbortError'));
      if (this.outgoing.ready) {
        this.outgoing.ready.reject(new DOMException('Đã hủy gửi file.', 'AbortError'));
        clearTimeout(this.outgoing.ready.timeout);
        this.outgoing.ready = null;
      }
    }
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
      else if (message.type === 'FILE_READY') this.markReceiverReady(message);
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
      lastProgressBytes: 0,
      lastReportedAt: performance.now(),
    };
    this.onProgress({
      direction: 'receive', fileId: metadata.fileId, fileName: metadata.fileName,
      fileSize: metadata.fileSize, transferred: 0, speed: 0, status: 'receiving', chunkSize: metadata.chunkSize,
    });
    this.core.send(encodeControl({ type: 'FILE_READY', fileId: metadata.fileId }));
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
      const elapsed = Math.max((now - transfer.lastReportedAt) / 1000, 0.001);
      this.onProgress({
        direction: 'receive', fileId: transfer.metadata.fileId,
        fileName: transfer.metadata.fileName, fileSize: transfer.metadata.fileSize,
        transferred: transfer.receivedBytes,
        speed: (transfer.receivedBytes - transfer.lastProgressBytes) / elapsed,
        status: 'receiving', chunkSize: transfer.metadata.chunkSize,
      });
      transfer.lastReportedAt = now;
      transfer.lastProgressBytes = transfer.receivedBytes;
    }

    this.core.send(encodeControl({
      type: 'ACK',
      fileId: metadata.fileId,
      chunkIndex: metadata.chunkIndex,
    }));
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

  waitForAcknowledgement(transfer, chunkIndex, byteLength) {
    let resolveAck;
    let rejectAck;
    const promise = new Promise((resolve, reject) => {
      resolveAck = resolve;
      rejectAck = reject;
    });
    promise.catch(() => {});

    const timeout = setTimeout(() => {
      transfer.pendingAcks.delete(chunkIndex);
      rejectAck(new Error('Thiết bị nhận không xác nhận được dữ liệu. Kiểm tra kết nối rồi thử lại.'));
    }, ACK_TIMEOUT_MS);
    transfer.pendingAcks.set(chunkIndex, {
      byteLength,
      resolve: () => {
        clearTimeout(timeout);
        resolveAck();
      },
      reject: (error) => {
        clearTimeout(timeout);
        rejectAck(error);
      },
      timeout,
    });
    return promise;
  }

  waitForReceiverReady(transfer) {
    let resolveReady;
    let rejectReady;
    const promise = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    promise.catch(() => {});
    const timeout = setTimeout(() => {
      transfer.ready = null;
      rejectReady(new Error('Thiết bị nhận không phản hồi. Hãy kiểm tra kết nối rồi thử lại.'));
    }, ACK_TIMEOUT_MS);
    transfer.ready = {
      resolve: () => {
        clearTimeout(timeout);
        resolveReady();
      },
      reject: (error) => {
        clearTimeout(timeout);
        rejectReady(error);
      },
      timeout,
    };
    return promise;
  }

  markReceiverReady(message) {
    if (!this.outgoing || this.outgoing.metadata.fileId !== message.fileId || !this.outgoing.ready) return;
    const { resolve, timeout } = this.outgoing.ready;
    clearTimeout(timeout);
    this.outgoing.ready = null;
    resolve();
  }

  rejectPendingAcknowledgements(transfer, error) {
    transfer.pendingAcks.forEach(({ reject }) => reject(error));
    transfer.pendingAcks.clear();
  }

  acknowledge(message) {
    if (
      !this.outgoing
      || this.outgoing.metadata.fileId !== message.fileId
      || !Number.isSafeInteger(message.chunkIndex)
    ) return;

    const pending = this.outgoing.pendingAcks.get(message.chunkIndex);
    if (!pending) return;
    const transfer = this.outgoing;
    transfer.pendingAcks.delete(message.chunkIndex);
    transfer.bytesSent += pending.byteLength;
    pending.resolve();
    const now = performance.now();
    if (now - transfer.lastReportedAt >= PROGRESS_INTERVAL_MS || transfer.bytesSent === transfer.metadata.fileSize) {
      const elapsed = Math.max((now - transfer.lastReportedAt) / 1000, 0.001);
      transfer.lastSpeed = (transfer.bytesSent - transfer.lastProgressBytes) / elapsed;
      this.onProgress({
        direction: 'send',
        fileId: transfer.metadata.fileId,
        fileName: transfer.fileName,
        fileSize: transfer.metadata.fileSize,
        transferred: transfer.bytesSent,
        speed: transfer.lastSpeed,
        status: 'sending',
        chunkSize: transfer.metadata.chunkSize,
      });
      transfer.lastReportedAt = now;
      transfer.lastProgressBytes = transfer.bytesSent;
    }
  }

  close() {
    this.unsubscribe();
    if (this.incoming) this.cancelTransfer(this.incoming.metadata.fileId);
    if (this.outgoing) this.cancelTransfer(this.outgoing.metadata.fileId);
  }
}
