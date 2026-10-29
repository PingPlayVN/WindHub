import { decodeControl, encodeControl, MAX_TEXT_SIZE } from './protocol.js';

export default class TextTransfer {
  constructor(core, { onText = () => {}, onError = () => {} } = {}) {
    this.core = core;
    this.onText = onText;
    this.onError = onError;
    this.unsubscribe = core.onMessage((data) => this.receive(data));
  }

  sendText(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Hãy nhập nội dung cần gửi.');
    const byteLength = new TextEncoder().encode(text).byteLength;
    if (byteLength > MAX_TEXT_SIZE) throw new Error('Tin nhắn vượt quá giới hạn 1 MiB.');

    const message = {
      type: 'TEXT',
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text,
    };
    this.core.send(encodeControl(message));
    return message;
  }

  receive(data) {
    if (typeof data !== 'string') return;
    try {
      const message = decodeControl(data);
      if (message.type !== 'TEXT') return;
      if (
        typeof message.id !== 'string'
        || message.id.length > 80
        || !Number.isFinite(message.timestamp)
        || typeof message.text !== 'string'
        || new TextEncoder().encode(message.text).byteLength > MAX_TEXT_SIZE
      ) {
        throw new Error('Tin nhắn nhận được không hợp lệ.');
      }
      this.onText(message);
    } catch (error) {
      this.onError(error);
    }
  }

  close() {
    this.unsubscribe();
  }
}
