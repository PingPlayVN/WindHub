import {
  ACK_BATCH_BYTES,
  ACK_BATCH_CHUNKS,
  ACK_BATCH_INTERVAL_MS,
  HIGH_WATERMARK,
  LEGACY_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  MAX_FILE_SIZE,
  MIN_CHUNK_SIZE,
  MAX_IN_FLIGHT_BYTES,
  PROGRESS_INTERVAL_MS,
  decodeControl,
  decodeFileChunk,
  encodeControl,
  encodeFileChunk,
  validateFileMetadata,
} from './protocol.js';

const CONTROL_TYPES = new Set(['FILE_START', 'FILE_END', 'FILE_READY', 'FILE_CONFIG', 'FILE_CONFIG_ACK', 'CONTROL', 'ACK']);
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
    const maxMessageSize = this.core.getMaxFileChunkSize?.() ?? MAX_CHUNK_SIZE;
    if (maxMessageSize < MIN_CHUNK_SIZE) throw new Error('Kênh WebRTC không hỗ trợ kích thước chunk tối thiểu.');
    const preferred = Math.min(MAX_CHUNK_SIZE, maxMessageSize, bufferedAmount > HIGH_WATERMARK ? LEGACY_CHUNK_SIZE : MAX_CHUNK_SIZE);
    return preferred;
  }

  getLegacyChunkSize() {
    const maxPayload = this.core.getMaxFileChunkSize?.() ?? LEGACY_CHUNK_SIZE;
    if (maxPayload < MIN_CHUNK_SIZE) throw new Error('Kênh WebRTC không hỗ trợ kích thước chunk tối thiểu.');
    return Math.min(LEGACY_CHUNK_SIZE, maxPayload);
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
    const initialChunkSize = this.getLegacyChunkSize();
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
      configuration: null,
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
      const chunkMeta = { type: 'FILE_CHUNK', fileId: metadata.fileId, chunkIndex, chunkSize: metadata.chunkSize };
      const acknowledgement = this.waitForAcknowledgement(transfer, chunkIndex, end - start);
      this.core.sendFile(encodeFileChunk(chunkMeta, slice));
      return { acknowledgement, byteLength: end - start };
    };

    try {
      const readyPromise = this.waitForReceiverReady(transfer);
      this.core.send(encodeControl(metadata));
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: 0, speed: 0, status: 'preparing', chunkSize: metadata.chunkSize,
      });
      const peerCapabilities = await readyPromise;
      const selectedChunkSize = Math.min(
        this.getAdaptiveChunkSize(fileChannel.bufferedAmount),
        Number.isSafeInteger(peerCapabilities.maxChunkSize) ? peerCapabilities.maxChunkSize : LEGACY_CHUNK_SIZE,
      );
      if (selectedChunkSize !== metadata.chunkSize) {
        const nextMetadata = {
          ...metadata,
          chunkSize: selectedChunkSize,
          totalChunks: Math.ceil(file.size / selectedChunkSize),
        };
        const configurationPromise = this.waitForFileConfiguration(transfer, selectedChunkSize);
        this.core.send(encodeControl({
          type: 'FILE_CONFIG',
          fileId: metadata.fileId,
          chunkSize: nextMetadata.chunkSize,
          totalChunks: nextMetadata.totalChunks,
        }));
        await configurationPromise;
        Object.assign(metadata, nextMetadata);
      }
      transfer.lastReportedAt = performance.now();
      this.onProgress({
        direction: 'send', fileId: metadata.fileId, fileName: file.name,
        fileSize: file.size, transferred: 0, speed: 0, status: 'sending', chunkSize: metadata.chunkSize,
      });

      const inFlight = [];
      let inFlightBytes = 0;
      for (let chunkIndex = 0; chunkIndex < metadata.totalChunks; chunkIndex += 1) {
        const start = chunkIndex * metadata.chunkSize;
        const end = Math.min(start + metadata.chunkSize, file.size);
        const chunkBytes = end - start;
        while (inFlight.length && inFlightBytes + chunkBytes > MAX_IN_FLIGHT_BYTES) {
          const acknowledged = await inFlight.shift();
          inFlightBytes -= acknowledged.byteLength;
        }
        const packet = await sendChunk(chunkIndex, start, end);
        inFlight.push(packet.acknowledgement.then(() => packet));
        inFlightBytes += packet.byteLength;
      }

      while (inFlight.length) {
        const acknowledged = await inFlight.shift();
        inFlightBytes -= acknowledged.byteLength;
      }
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
      if (transfer.configuration) {
        clearTimeout(transfer.configuration.timeout);
        transfer.configuration.reject(new DOMException('Đã đóng truyền file.', 'AbortError'));
        transfer.configuration = null;
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
      if (this.outgoing.configuration) {
        this.outgoing.configuration.reject(new DOMException('Đã hủy gửi file.', 'AbortError'));
        clearTimeout(this.outgoing.configuration.timeout);
        this.outgoing.configuration = null;
      }
    }
    if (this.incoming?.metadata.fileId === fileId) {
      clearTimeout(this.incoming.ackTimer);
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
      else if (message.type === 'FILE_CONFIG') this.configureReceive(message);
      else if (message.type === 'FILE_CONFIG_ACK') this.markFileConfigured(message);
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
      lastAckedChunk: -1,
      lastAckedBytes: 0,
      ackTimer: null,
    };
    this.onProgress({
      direction: 'receive', fileId: metadata.fileId, fileName: metadata.fileName,
      fileSize: metadata.fileSize, transferred: 0, speed: 0, status: 'receiving', chunkSize: metadata.chunkSize,
    });
    this.core.send(encodeControl({
      type: 'FILE_READY',
      fileId: metadata.fileId,
      maxChunkSize: this.core.getMaxFileChunkSize?.() ?? MAX_CHUNK_SIZE,
    }));
  }

  receiveChunk(frame) {
    const { metadata, data } = decodeFileChunk(frame);
    const transfer = this.incoming;
    if (!transfer || metadata.fileId !== transfer.metadata.fileId) throw new Error('Chunk không thuộc file đang nhận.');
    if (metadata.chunkIndex !== transfer.nextChunk || metadata.chunkIndex >= transfer.metadata.totalChunks) {
      throw new Error('Thứ tự hoặc chỉ số chunk không hợp lệ.');
    }

    const remaining = transfer.metadata.fileSize - transfer.receivedBytes;
    const expectedSize = Math.min(transfer.metadata.chunkSize, remaining);
    if (data.byteLength !== expectedSize || data.byteLength === 0) throw new Error('Kích thước chunk không hợp lệ.');
    transfer.chunks.push(data);
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

    this.scheduleAcknowledgement(transfer);
  }

  scheduleAcknowledgement(transfer) {
    const chunksSinceAck = transfer.nextChunk - transfer.lastAckedChunk - 1;
    const bytesSinceAck = transfer.receivedBytes - transfer.lastAckedBytes;
    if (
      transfer.nextChunk === transfer.metadata.totalChunks
      || chunksSinceAck >= ACK_BATCH_CHUNKS
      || bytesSinceAck >= ACK_BATCH_BYTES
    ) {
      this.sendCumulativeAcknowledgement(transfer);
      return;
    }

    if (!transfer.ackTimer) {
      transfer.ackTimer = setTimeout(() => {
        transfer.ackTimer = null;
        if (this.incoming !== transfer) return;
        try {
          this.sendCumulativeAcknowledgement(transfer);
        } catch (error) {
          this.onError(error);
          this.cancelTransfer(transfer.metadata.fileId);
        }
      }, ACK_BATCH_INTERVAL_MS);
    }
  }

  sendCumulativeAcknowledgement(transfer) {
    const chunkIndex = transfer.nextChunk - 1;
    if (chunkIndex <= transfer.lastAckedChunk) return;
    clearTimeout(transfer.ackTimer);
    transfer.ackTimer = null;
    transfer.lastAckedChunk = chunkIndex;
    transfer.lastAckedBytes = transfer.receivedBytes;
    this.core.send(encodeControl({
      type: 'ACK',
      fileId: transfer.metadata.fileId,
      chunkIndex,
      receivedBytes: transfer.receivedBytes,
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

    clearTimeout(transfer.ackTimer);
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
    if (this.outgoing?.metadata.fileId === message.fileId) {
      const outgoing = this.outgoing;
      outgoing.cancelled = true;
      outgoing.cancelWaiters.forEach((wake) => wake());
      this.rejectPendingAcknowledgements(outgoing, new DOMException('Thiết bị nhận đã hủy truyền file.', 'AbortError'));
      if (outgoing.ready) {
        clearTimeout(outgoing.ready.timeout);
        outgoing.ready.reject(new DOMException('Thiết bị nhận đã hủy truyền file.', 'AbortError'));
        outgoing.ready = null;
      }
      if (outgoing.configuration) {
        clearTimeout(outgoing.configuration.timeout);
        outgoing.configuration.reject(new DOMException('Thiết bị nhận đã hủy truyền file.', 'AbortError'));
        outgoing.configuration = null;
      }
      this.onProgress({
        direction: 'send', fileId: outgoing.metadata.fileId, fileName: outgoing.fileName,
        fileSize: outgoing.metadata.fileSize, transferred: outgoing.bytesSent,
        speed: 0, status: 'cancelled', chunkSize: outgoing.metadata.chunkSize,
      });
    }
    if (this.incoming?.metadata.fileId === message.fileId) {
      const { metadata, receivedBytes } = this.incoming;
      clearTimeout(this.incoming.ackTimer);
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
      resolve: (capabilities) => {
        clearTimeout(timeout);
        resolveReady(capabilities);
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
    resolve({
      maxChunkSize: Number.isSafeInteger(message.maxChunkSize)
        ? Math.min(MAX_CHUNK_SIZE, message.maxChunkSize)
        : LEGACY_CHUNK_SIZE,
    });
  }

  waitForFileConfiguration(transfer, chunkSize) {
    let resolveConfigured;
    let rejectConfigured;
    const promise = new Promise((resolve, reject) => {
      resolveConfigured = resolve;
      rejectConfigured = reject;
    });
    promise.catch(() => {});
    const timeout = setTimeout(() => {
      transfer.configuration = null;
      rejectConfigured(new Error('Thiết bị nhận không xác nhận cấu hình truyền file.'));
    }, ACK_TIMEOUT_MS);
    transfer.configuration = {
      chunkSize,
      resolve: () => {
        clearTimeout(timeout);
        resolveConfigured();
      },
      reject: (error) => {
        clearTimeout(timeout);
        rejectConfigured(error);
      },
      timeout,
    };
    return promise;
  }

  configureReceive(message) {
    const transfer = this.incoming;
    if (!transfer || message.fileId !== transfer.metadata.fileId || transfer.nextChunk !== 0) {
      throw new Error('Cấu hình chunk không thuộc file đang nhận.');
    }

    const updatedMetadata = {
      ...transfer.metadata,
      chunkSize: message.chunkSize,
      totalChunks: message.totalChunks,
    };
    validateFileMetadata(updatedMetadata);
    const localMax = this.core.getMaxFileChunkSize?.() ?? MAX_CHUNK_SIZE;
    if (updatedMetadata.chunkSize > localMax) {
      throw new Error('Chunk được đề xuất vượt giới hạn của kết nối này.');
    }

    transfer.metadata = updatedMetadata;
    this.core.send(encodeControl({
      type: 'FILE_CONFIG_ACK',
      fileId: message.fileId,
      chunkSize: message.chunkSize,
    }));
  }

  markFileConfigured(message) {
    const transfer = this.outgoing;
    const configuration = transfer?.configuration;
    if (
      !configuration
      || message.fileId !== transfer.metadata.fileId
      || message.chunkSize !== configuration.chunkSize
    ) return;

    transfer.configuration = null;
    configuration.resolve();
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
      || !Number.isSafeInteger(message.receivedBytes)
      || message.chunkIndex < 0
      || message.chunkIndex >= this.outgoing.metadata.totalChunks
      || message.receivedBytes < this.outgoing.bytesSent
      || message.receivedBytes > this.outgoing.metadata.fileSize
    ) return;

    const transfer = this.outgoing;
    if (!transfer.pendingAcks.has(message.chunkIndex)) return;
    const expectedBytes = Math.min(
      (message.chunkIndex + 1) * transfer.metadata.chunkSize,
      transfer.metadata.fileSize,
    );
    if (message.receivedBytes !== expectedBytes) return;
    for (const [chunkIndex, pending] of transfer.pendingAcks) {
      if (chunkIndex > message.chunkIndex) continue;
      transfer.pendingAcks.delete(chunkIndex);
      pending.resolve();
    }
    transfer.bytesSent = message.receivedBytes;
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
