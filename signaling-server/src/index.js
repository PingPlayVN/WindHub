import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';

const MAX_SIGNAL_LENGTH = 64 * 1024;
const MAX_NAME_LENGTH = 32;
const REQUEST_TTL_MS = 90_000;
const MAX_MESSAGES_PER_MINUTE = 60;

function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\p{Cc}/gu, '').trim().slice(0, MAX_NAME_LENGTH);
}

function send(socket, message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function makePairKey(firstId, secondId) {
  return [firstId, secondId].sort().join(':');
}

export function createSignalingServer({ allowedOrigins = process.env.ALLOWED_ORIGINS || '', port = Number(process.env.PORT) || 10000 } = {}) {
  const peers = new Map();
  const peersById = new Map();
  const requests = new Map();
  const authorizedPairs = new Map();
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: MAX_SIGNAL_LENGTH + 1024 });
  const allowed = allowedOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

  const broadcastDevices = () => {
    const devices = [...peers.values()].map(({ id, name }) => ({ id, name }));
    for (const socket of peers.keys()) send(socket, { type: 'devices', devices: devices.filter((device) => device.id !== peers.get(socket).id) });
  };

  server.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin || '';
    if (
      new URL(request.url, 'http://localhost').pathname !== '/p2p'
      || (allowed.length > 0 && !allowed.includes(origin))
    ) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (webSocket) => sockets.emit('connection', webSocket));
  });

  sockets.on('connection', (socket) => {
    let peer = null;
    let messageTimes = [];

    const removePeer = () => {
      if (!peer) return;
      peers.delete(socket);
      peersById.delete(peer.id);
      for (const [requestId, entry] of requests) {
        if (entry.fromId === peer.id || entry.toId === peer.id) {
          const remainingId = entry.fromId === peer.id ? entry.toId : entry.fromId;
          const remainingSocket = peersById.get(remainingId);
          if (entry.fromId === peer.id) {
            send(remainingSocket, { type: 'request-expired', requestId });
          } else {
            send(remainingSocket, { type: 'request-expired', requestId });
          }
          requests.delete(requestId);
        }
      }
      for (const [key, expiry] of authorizedPairs) {
        if (key.split(':').includes(peer.id) || expiry <= Date.now()) authorizedPairs.delete(key);
      }
      broadcastDevices();
      peer = null;
    };

    socket.on('message', (buffer) => {
      const now = Date.now();
      messageTimes = messageTimes.filter((timestamp) => now - timestamp < 60_000);
      if (messageTimes.length >= MAX_MESSAGES_PER_MINUTE) {
        send(socket, { type: 'error', message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });
        return;
      }
      messageTimes.push(now);

      let message;
      try {
        message = JSON.parse(buffer.toString());
      } catch {
        send(socket, { type: 'error', message: 'Thông điệp không hợp lệ.' });
        return;
      }

      if (!peer) {
        if (message.type !== 'register') {
          send(socket, { type: 'error', message: 'Cần đăng ký tên thiết bị trước.' });
          socket.close(1008, 'register required');
          return;
        }
        const name = cleanName(message.name);
        if (!name) {
          send(socket, { type: 'error', message: 'Tên thiết bị không hợp lệ.' });
          socket.close(1008, 'invalid name');
          return;
        }
        peer = { id: randomUUID(), name };
        peers.set(socket, peer);
        peersById.set(peer.id, socket);
        send(socket, { type: 'registered', deviceId: peer.id });
        broadcastDevices();
        return;
      }

      if (message.type === 'request') {
        const targetSocket = peersById.get(message.targetId);
        const target = targetSocket && peers.get(targetSocket);
        if (!target || target.id === peer.id) {
          send(socket, { type: 'error', message: 'Thiết bị đó không còn trực tuyến.' });
          return;
        }
        const requestId = randomUUID();
        requests.set(requestId, { fromId: peer.id, toId: target.id, expiresAt: now + REQUEST_TTL_MS });
        send(targetSocket, { type: 'connection-request', requestId, from: peer });
        send(socket, { type: 'request-sent', requestId, to: target });
        return;
      }

      if (message.type === 'respond') {
        const pending = requests.get(message.requestId);
        if (!pending || pending.toId !== peer.id || pending.expiresAt < now) {
          requests.delete(message.requestId);
          send(socket, { type: 'error', message: 'Yêu cầu kết nối đã hết hạn.' });
          return;
        }
        const requesterSocket = peersById.get(pending.fromId);
        if (!requesterSocket) {
          requests.delete(message.requestId);
          send(socket, { type: 'error', message: 'Thiết bị yêu cầu đã ngoại tuyến.' });
          return;
        }
        const accepted = message.accepted === true;
        requests.delete(message.requestId);
        if (accepted) authorizedPairs.set(makePairKey(peer.id, pending.fromId), now + REQUEST_TTL_MS);
        send(requesterSocket, { type: 'connection-response', requestId: message.requestId, accepted, from: peer });
        send(socket, { type: 'response-sent', requestId: message.requestId, accepted });
        return;
      }

      if (message.type === 'offer' || message.type === 'answer') {
        const targetSocket = peersById.get(message.targetId);
        const target = targetSocket && peers.get(targetSocket);
        const pairKey = target && makePairKey(peer.id, target.id);
        if (
          !target
          || !pairKey
          || (authorizedPairs.get(pairKey) || 0) < now
          || typeof message.signal !== 'string'
          || message.signal.length > MAX_SIGNAL_LENGTH
        ) {
          send(socket, { type: 'error', message: 'Không thể chuyển thông tin kết nối đến thiết bị.' });
          return;
        }
        authorizedPairs.set(pairKey, now + REQUEST_TTL_MS);
        send(targetSocket, { type: message.type, from: peer, signal: message.signal });
        return;
      }

      if (message.type === 'disconnect') {
        if (typeof message.targetId === 'string') authorizedPairs.delete(makePairKey(peer.id, message.targetId));
        return;
      }

      send(socket, { type: 'error', message: 'Loại thông điệp không được hỗ trợ.' });
    });

    socket.on('close', removePeer);
    socket.on('error', removePeer);
  });

  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const [requestId, entry] of requests) {
      if (entry.expiresAt <= now) {
        send(peersById.get(entry.fromId), { type: 'request-expired', requestId });
        send(peersById.get(entry.toId), { type: 'request-expired', requestId });
        requests.delete(requestId);
      }
    }
    for (const [key, expiresAt] of authorizedPairs) {
      if (expiresAt <= now) authorizedPairs.delete(key);
    }
    for (const socket of sockets.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);

  sockets.on('connection', (socket) => {
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
  });

  server.on('close', () => clearInterval(heartbeat));
  return {
    server,
    listen: () => new Promise((resolve) => server.listen(port, '0.0.0.0', () => resolve(server.address()))),
    close: () => new Promise((resolve, reject) => {
      clearInterval(heartbeat);
      for (const socket of sockets.clients) socket.close(1001, 'server shutting down');
      sockets.close();
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const signaling = createSignalingServer();
  signaling.listen().then((address) => console.log(`P2P signaling listening on ${address.port}`));
}
