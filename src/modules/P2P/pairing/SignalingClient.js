const MAX_RECONNECT_DELAY_MS = 30_000;

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
  constructor(endpoint, { name, onStateChange = () => {}, onMessage = () => {} }) {
    this.url = toWebSocketUrl(endpoint);
    this.name = name;
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.socket = null;
    this.closed = false;
    this.retryDelay = 1000;
    this.retryTimer = null;
  }

  connect() {
    if (this.closed || this.socket) return;
    this.onStateChange('connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.addEventListener('open', () => {
      if (this.closed || this.socket !== socket) return;
      this.retryDelay = 1000;
      socket.send(JSON.stringify({ type: 'register', name: this.name }));
    });
    socket.addEventListener('message', (event) => {
      if (this.closed || this.socket !== socket) return;
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        this.onStateChange('error', 'Máy chủ gửi dữ liệu không hợp lệ.');
        return;
      }
      if (message.type === 'registered') this.onStateChange('online');
      this.onMessage(message);
    });
    socket.addEventListener('error', () => {
      if (!this.closed && this.socket === socket) this.onStateChange('error', 'Không kết nối được signaling server.');
    });
    socket.addEventListener('close', () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.closed) return;
      this.onStateChange('offline', 'Mất kết nối signaling server, đang thử kết nối lại…');
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.connect();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RECONNECT_DELAY_MS);
    });
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
    this.retryTimer = null;
    this.socket?.close();
    this.socket = null;
  }
}
