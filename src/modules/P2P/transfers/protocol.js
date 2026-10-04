export const MIN_CHUNK_SIZE = 16 * 1024;
export const DEFAULT_CHUNK_SIZE = 32 * 1024;
export const MAX_CHUNK_SIZE = 64 * 1024;
export const HIGH_WATERMARK = 512 * 1024;
export const LOW_WATERMARK = 128 * 1024;
export const TRANSFER_WINDOW_SIZE = 8;
export const PROGRESS_INTERVAL_MS = 150;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
export const MAX_TEXT_SIZE = 1024 * 1024;
export const MAX_FILE_NAME_LENGTH = 255;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeControl(message) {
  return JSON.stringify(message);
}

export function decodeControl(message) {
  if (typeof message !== 'string' || message.length > MAX_TEXT_SIZE + 4096) {
    throw new Error('Thông điệp điều khiển không hợp lệ hoặc quá lớn.');
  }

  let value;
  try {
    value = JSON.parse(message);
  } catch {
    throw new Error('Không đọc được thông điệp P2P.');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.type !== 'string') {
    throw new Error('Sai định dạng thông điệp P2P.');
  }
  return value;
}

export function encodeFileChunk(metadata, data) {
  const payload = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const header = encoder.encode(JSON.stringify(metadata));
  const frame = new Uint8Array(4 + header.length + payload.length);
  new DataView(frame.buffer).setUint32(0, header.length, false);
  frame.set(header, 4);
  frame.set(payload, 4 + header.length);
  return frame.buffer;
}

export function decodeFileChunk(frame) {
  if (!(frame instanceof ArrayBuffer) || frame.byteLength < 5) {
    throw new Error('Gói dữ liệu file không hợp lệ.');
  }

  const bytes = new Uint8Array(frame);
  const headerLength = new DataView(frame).getUint32(0, false);
  if (headerLength === 0 || headerLength > 4096 || 4 + headerLength >= frame.byteLength) {
    throw new Error('Metadata của chunk không hợp lệ.');
  }

  let metadata;
  try {
    metadata = JSON.parse(decoder.decode(bytes.subarray(4, 4 + headerLength)));
  } catch {
    throw new Error('Không đọc được metadata của chunk.');
  }

  if (
    metadata?.type !== 'FILE_CHUNK'
    || typeof metadata.fileId !== 'string'
    || !Number.isSafeInteger(metadata.chunkIndex)
    || metadata.chunkIndex < 0
  ) {
    throw new Error('Metadata của chunk không hợp lệ.');
  }

  return { metadata, data: bytes.slice(4 + headerLength) };
}

export function validateFileMetadata(metadata) {
  if (
    typeof metadata?.fileId !== 'string'
    || !/^[\w-]{1,80}$/.test(metadata.fileId)
    || typeof metadata.fileName !== 'string'
    || metadata.fileName.length < 1
    || metadata.fileName.length > MAX_FILE_NAME_LENGTH
    || /[\\/\u0000-\u001f]/.test(metadata.fileName)
    || !Number.isSafeInteger(metadata.fileSize)
    || metadata.fileSize < 0
    || metadata.fileSize > MAX_FILE_SIZE
    || typeof metadata.mimeType !== 'string'
    || metadata.mimeType.length > 255
    || !Number.isSafeInteger(metadata.totalChunks)
    || metadata.totalChunks < 1
    || !Number.isSafeInteger(metadata.chunkSize)
    || metadata.chunkSize < MIN_CHUNK_SIZE
    || metadata.chunkSize > MAX_CHUNK_SIZE
    || metadata.totalChunks !== Math.ceil(metadata.fileSize / metadata.chunkSize)
  ) {
    throw new Error('Thông tin file nhận được không hợp lệ hoặc vượt giới hạn 1 GiB.');
  }
}
