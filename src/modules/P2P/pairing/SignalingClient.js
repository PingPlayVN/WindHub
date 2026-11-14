const MAX_RECONNECT_DELAY_MS = 30_000;
const REGISTRATION_TIMEOUT_MS = 15_000;

function toWebSocketUrl(endpoint) {
  const url = new URL(endpoint);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
    throw new Error('Địa chỉ signaling phải dùng HTTPS hoặc WSS.');
  }
  url.pathname = '/p2p';
  return url.href;
}

export default class SignalingClient {
  constructor(endpoint, { name, deviceId = null, onStateChange = () => {}, onMessage = () => {} }) {
    this.url = toWebSocketUrl(endpoint);
    this.name = name;
    this.deviceId = deviceId || this.resolveDeviceId();
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.socket = null;
    this.connectionId = null;
    this.closed = false;
    this.replaced = false;
    this.retryDelay = 1000;
    this.retryTimer = null;
    this.registrationTimer = null;
    this.connectionAttempt = 0;
  }

  resolveDeviceId() {
    if (typeof window === 'undefined') {
      return crypto.randomUUID();
    }
    try {
      const storedId = window.localStorage.getItem('windhub-p2p-device-id');
      if (storedId) return storedId;
    } catch {
      // Storage may be disabled; use a session-scoped identity below.
    }
    try {
      const storedId = window.sessionStorage.getItem('windhub-p2p-device-id');
      if (storedId) return storedId;
    } catch {
      // A fresh in-memory identity is the only available fallback.
    }
    const nextId = crypto.randomUUID();
    try {
      window.localStorage.setItem('windhub-p2p-device-id', nextId);
    } catch {
      try {
        window.sessionStorage.setItem('windhub-p2p-device-id', nextId);
      } catch {
        return nextId;
      }
    }
    return nextId;
  }

  connect() {
    if (this.closed || this.replaced || this.socket) return;
    this.onStateChange('connecting');
    let socket;
    try {
      socket = new WebSocket(this.url);
    } catch (error) {
      this.onStateChange('error', error.message || 'Không thể khởi tạo kết nối signaling.');
      this.scheduleReconnect();
      return;
    }
    const attempt = ++this.connectionAttempt;
    this.socket = socket;
    socket.addEventListener('open', () => {
      if (this.closed || this.socket !== socket || attempt !== this.connectionAttempt) {
        socket.close();
        return;
      }
      try {
        socket.send(JSON.stringify({
          type: 'register',
          name: this.name,
          deviceId: this.deviceId,
          protocolVersion: 2,
        }));
        this.registrationTimer = setTimeout(() => {
          if (this.socket === socket && socket.readyState === WebSocket.OPEN) {
            socket.close(4000, 'registration timeout');
          }
        }, REGISTRATION_TIMEOUT_MS);
      } catch (error) {
        this.onStateChange('error', error.message || 'Không thể đăng ký thiết bị với signaling server.');
        socket.close();
      }
    });
    socket.addEventListener('message', (event) => {
      if (this.closed || this.socket !== socket || attempt !== this.connectionAttempt) return;
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        this.onStateChange('error', 'Máy chủ gửi dữ liệu không hợp lệ.');
        return;
      }
      if (message.type === 'registered') {
        clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
        this.connectionId = message.connectionId || null;
        this.retryDelay = 1000;
        this.onStateChange('online');
      }
      Promise.resolve(this.onMessage(message)).catch((error) => {
        if (this.closed || this.socket !== socket || attempt !== this.connectionAttempt) return;
        this.onStateChange('error', error.message || 'Không thể xử lý thông điệp signaling.');
      });
    });
    socket.addEventListener('error', () => {
      if (!this.closed && this.socket === socket && attempt === this.connectionAttempt) {
        this.onStateChange('error', 'Không kết nối được signaling server.');
      }
    });
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket || attempt !== this.connectionAttempt) return;
      clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
      this.socket = null;
      this.connectionId = null;
      if (this.closed) return;
      if (event.code === 4001) {
        this.replaced = true;
        this.onStateChange('offline', 'Thiết bị này đã được thay thế bởi một tab khác. Tải lại trang để kết nối lại.');
        return;
      }
      this.onStateChange('offline', 'Mất kết nối signaling server, đang thử kết nối lại…');
      this.scheduleReconnect();
    });
  }

  scheduleReconnect() {
    if (this.closed || this.retryTimer) return;
    const jitteredDelay = Math.round(this.retryDelay * (0.8 + Math.random() * 0.4));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, jitteredDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, MAX_RECONNECT_DELAY_MS);
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Mất kết nối với signaling server. Đang thử kết nối lại.');
    }
    this.socket.send(JSON.stringify(message));
  }

  close() {
    this.closed = true;
    clearTimeout(this.retryTimer);
    clearTimeout(this.registrationTimer);
    this.retryTimer = null;
    this.registrationTimer = null;
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close();
    this.socket = null;
    this.connectionId = null;
  }
}
