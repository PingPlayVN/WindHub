export const MIN_CHUNK_SIZE = 16 * 1024;
export const LEGACY_CHUNK_SIZE = 64 * 1024;
export const DEFAULT_CHUNK_SIZE = 256 * 1024;
export const MAX_CHUNK_SIZE = 256 * 1024;
export const HIGH_WATERMARK = 4 * 1024 * 1024;
export const LOW_WATERMARK = 1 * 1024 * 1024;
export const MAX_IN_FLIGHT_BYTES = 8 * 1024 * 1024;
export const ACK_BATCH_CHUNKS = 4;
export const ACK_BATCH_BYTES = 1 * 1024 * 1024;
export const ACK_BATCH_INTERVAL_MS = 100;
export const MAX_FRAME_HEADER_BYTES = 4096;
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
  const header = encoder.encode(JSON.stringify(metadata));
  const prefix = new Uint8Array(4 + header.length);
  new DataView(prefix.buffer).setUint32(0, header.length, false);
  prefix.set(header, 4);

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return new Blob([prefix, data]);
  }

  const payload = data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const frame = new Uint8Array(prefix.length + payload.length);
  frame.set(prefix);
  frame.set(payload, prefix.length);
  return frame.buffer;
}

export function decodeFileChunk(frame) {
  const isArrayBuffer = frame instanceof ArrayBuffer;
  const isView = ArrayBuffer.isView(frame);
  if ((!isArrayBuffer && !isView) || frame.byteLength < 5) {
    throw new Error('Gói dữ liệu file không hợp lệ.');
  }

  const buffer = isArrayBuffer ? frame : frame.buffer;
  const byteOffset = isArrayBuffer ? 0 : frame.byteOffset;
  const bytes = new Uint8Array(buffer, byteOffset, frame.byteLength);
  const headerLength = new DataView(buffer, byteOffset, frame.byteLength).getUint32(0, false);
  if (headerLength === 0 || headerLength > MAX_FRAME_HEADER_BYTES || 4 + headerLength >= frame.byteLength) {
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

  return { metadata, data: bytes.subarray(4 + headerLength) };
}

export function validateFileMetadata(metadata) {
  if (
    typeof metadata?.fileId !== 'string'
    || !/^[\w-]{1,80}$/.test(metadata.fileId)
    || typeof metadata.fileName !== 'string'
    || metadata.fileName.length < 1
    || metadata.fileName.length > MAX_FILE_NAME_LENGTH
    || /[\\/\p{Cc}]/u.test(metadata.fileName)
    || !Number.isSafeInteger(metadata.fileSize)
    || metadata.fileSize < 0
    || metadata.fileSize > MAX_FILE_SIZE
    || typeof metadata.mimeType !== 'string'
    || metadata.mimeType.length > 255
    || !Number.isSafeInteger(metadata.totalChunks)
    || metadata.totalChunks < 0
    || !Number.isSafeInteger(metadata.chunkSize)
    || metadata.chunkSize < MIN_CHUNK_SIZE
    || metadata.chunkSize > MAX_CHUNK_SIZE
    || metadata.totalChunks !== Math.ceil(metadata.fileSize / metadata.chunkSize)
  ) {
    throw new Error('Thông tin file nhận được không hợp lệ hoặc vượt giới hạn 1 GiB.');
  }
}
