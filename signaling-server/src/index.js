import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';

const MAX_SIGNAL_LENGTH = 64 * 1024;
const MAX_MESSAGE_LENGTH = MAX_SIGNAL_LENGTH + 1024;
const MAX_NAME_LENGTH = 32;
const REQUEST_TTL_MS = 90_000;
const SESSION_TTL_MS = 30 * 60_000;
const RATE_LIMITS = {
  register: 5,
  request: 12,
  respond: 24,
  cancel: 24,
  offer: 12,
  answer: 12,
  'ice-candidate': 240,
  'ice-restart-request': 12,
  disconnect: 24,
};

function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\p{Cc}/gu, '').trim().slice(0, MAX_NAME_LENGTH);
}

function send(socket, message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function makePairKey(firstId, secondId) {
  return JSON.stringify([firstId, secondId].sort());
}

function isValidIdentifier(value) {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 128
    && /^[\w.:-]+$/.test(value);
}

function isValidIceCandidate(candidate) {
  if (candidate === null) return true;
  if (
    !candidate
    || typeof candidate !== 'object'
    || Array.isArray(candidate)
    || typeof candidate.candidate !== 'string'
    || candidate.candidate.length > 4096
  ) return false;

  const validSdpMid = candidate.sdpMid === undefined
    || candidate.sdpMid === null
    || typeof candidate.sdpMid === 'string' && candidate.sdpMid.length <= 256;
  const validMLineIndex = candidate.sdpMLineIndex === undefined
    || candidate.sdpMLineIndex === null
    || Number.isSafeInteger(candidate.sdpMLineIndex) && candidate.sdpMLineIndex >= 0;
  const validUsernameFragment = candidate.usernameFragment === undefined
    || candidate.usernameFragment === null
    || typeof candidate.usernameFragment === 'string' && candidate.usernameFragment.length <= 256;

  return validSdpMid && validMLineIndex && validUsernameFragment;
}

export function createSignalingServer({ allowedOrigins = process.env.ALLOWED_ORIGINS || '', port = Number(process.env.PORT) || 10000 } = {}) {
  const peers = new Map();
  const peersById = new Map();
  const requests = new Map();
  const sessions = new Map();
  const activeSessionsByPair = new Map();
  const server = createServer((request, response) => {
    if (request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_LENGTH });
  const allowed = allowedOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

  const sendDeviceSnapshot = (socket) => {
    const ownPeer = peers.get(socket);
    if (!ownPeer) return;
    const devices = [...peers.values()]
      .filter((device) => device.id !== ownPeer.id)
      .map(({ id, name, connectionId }) => ({ id, name, connectionId }));
    send(socket, { type: 'devices', devices });
  };

  const broadcastDeviceChange = (message, exceptSocket = null) => {
    for (const socket of peers.keys()) {
      if (socket === exceptSocket) continue;
      const peer = peers.get(socket);
      if (peer.protocolVersion >= 2) send(socket, message);
      else sendDeviceSnapshot(socket);
    }
  };

  const clearRequest = (requestId) => {
    const pending = requests.get(requestId);
    if (!pending) return null;
    clearTimeout(pending.timer);
    requests.delete(requestId);
    return pending;
  };

  const removeSession = (sessionId, reason = null) => {
    const session = sessions.get(sessionId);
    if (!session) return null;
    clearTimeout(session.timer);
    sessions.delete(sessionId);
    const pairKey = makePairKey(session.firstId, session.secondId);
    if (activeSessionsByPair.get(pairKey) === sessionId) activeSessionsByPair.delete(pairKey);
    if (reason) {
      const peerSocket = session.firstSocket === session.closedSocket
        ? session.secondSocket
        : session.firstSocket;
      send(peerSocket, { type: 'session-interrupted', sessionId, reason });
    }
    return session;
  };

  const touchSession = (session) => {
    clearTimeout(session.timer);
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    session.timer = setTimeout(() => removeSession(session.sessionId), SESSION_TTL_MS);
    session.timer.unref?.();
  };

  const authorizeSession = (firstPeer, firstSocket, secondPeer, secondSocket, sessionId, initiatorId) => {
    const pairKey = makePairKey(firstPeer.id, secondPeer.id);
    const session = {
      sessionId,
      firstId: firstPeer.id,
      secondId: secondPeer.id,
      firstSocket,
      secondSocket,
      firstConnectionId: firstPeer.connectionId,
      secondConnectionId: secondPeer.connectionId,
      initiatorId,
      expiresAt: Date.now() + SESSION_TTL_MS,
      timer: null,
    };
    session.timer = setTimeout(() => removeSession(sessionId), SESSION_TTL_MS);
    session.timer.unref?.();
    sessions.set(sessionId, session);
    activeSessionsByPair.set(pairKey, sessionId);
    return session;
  };

  const expireRequest = (requestId, reason) => {
    const pending = clearRequest(requestId);
    if (!pending) return;
    const message = { type: 'request-expired', requestId, sessionId: pending.sessionId, reason };
    send(pending.fromSocket, message);
    send(pending.toSocket, message);
  };

  const removePeer = (socket, { broadcastLeave = true } = {}) => {
    const peer = peers.get(socket);
    if (!peer) return;
    peers.delete(socket);
    const isCurrentConnection = peersById.get(peer.id) === socket;
    if (isCurrentConnection) peersById.delete(peer.id);

    for (const [requestId, pending] of requests) {
      if (pending.fromSocket === socket || pending.toSocket === socket) {
        expireRequest(requestId, 'disconnected');
      }
    }
    for (const session of [...sessions.values()]) {
      if (session.firstSocket === socket || session.secondSocket === socket) {
        session.closedSocket = socket;
        removeSession(session.sessionId, 'disconnected');
      }
    }
    if (isCurrentConnection && broadcastLeave) {
      broadcastDeviceChange({ type: 'device-left', deviceId: peer.id, connectionId: peer.connectionId }, socket);
    }
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
    const messageTimes = new Map();

    socket.on('message', (buffer) => {
      const now = Date.now();
      if (buffer.byteLength > MAX_MESSAGE_LENGTH) {
        send(socket, { type: 'error', message: 'Thông điệp vượt quá giới hạn kích thước.' });
        return;
      }

      let message;
      try {
        message = JSON.parse(buffer.toString());
      } catch {
        send(socket, { type: 'error', message: 'Thông điệp không hợp lệ.' });
        return;
      }

      if (!message || typeof message !== 'object' || Array.isArray(message) || typeof message.type !== 'string') {
        send(socket, { type: 'error', message: 'Thông điệp không hợp lệ.' });
        return;
      }
      const rateLimitKey = Object.hasOwn(RATE_LIMITS, message.type) ? message.type : '__other__';
      const limit = RATE_LIMITS[rateLimitKey] || 30;
      const timestamps = (messageTimes.get(rateLimitKey) || []).filter((timestamp) => now - timestamp < 60_000);
      if (timestamps.length >= limit) {
        messageTimes.set(rateLimitKey, timestamps);
        send(socket, { type: 'error', message: 'Quá nhiều yêu cầu loại này. Vui lòng thử lại sau.' });
        return;
      }
      timestamps.push(now);
      messageTimes.set(rateLimitKey, timestamps);

      let peer = peers.get(socket);
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
        const deviceId = isValidIdentifier(message.deviceId?.trim?.())
          && message.deviceId.length <= 128
          ? message.deviceId.trim()
          : randomUUID();
        const existingSocket = peersById.get(deviceId);
        if (existingSocket && existingSocket !== socket) {
          removePeer(existingSocket, { broadcastLeave: false });
          existingSocket.close(4001, 'device connection replaced');
        }
        peer = {
          id: deviceId,
          name,
          connectionId: randomUUID(),
          protocolVersion: message.protocolVersion === 2 ? 2 : 1,
        };
        peers.set(socket, peer);
        peersById.set(peer.id, socket);
        send(socket, { type: 'registered', deviceId: peer.id, connectionId: peer.connectionId });
        sendDeviceSnapshot(socket);
        broadcastDeviceChange({
          type: 'device-upsert',
          device: { id: peer.id, name: peer.name, connectionId: peer.connectionId },
        }, socket);
        return;
      }

      if (message.type === 'request') {
        if (!isValidIdentifier(message.targetId)) {
          send(socket, { type: 'error', message: 'Thiết bị đích không hợp lệ.' });
          return;
        }
        const targetSocket = peersById.get(message.targetId);
        const target = targetSocket && peers.get(targetSocket);
        if (!target || target.id === peer.id) {
          send(socket, { type: 'error', message: 'Thiết bị đó không còn trực tuyến.' });
          return;
        }
        if (activeSessionsByPair.has(makePairKey(peer.id, target.id))) {
          send(socket, { type: 'error', message: 'Đã có phiên kết nối đang hoạt động với thiết bị này.' });
          return;
        }
        const requestId = isValidIdentifier(message.requestId) ? message.requestId : randomUUID();
        const requestedSessionId = isValidIdentifier(message.sessionId) ? message.sessionId : randomUUID();
        const existingRequest = [...requests.entries()].find(([, pending]) => (
          pending.fromId === peer.id && pending.toId === target.id
        ));
        if (existingRequest) {
          const [existingRequestId, pending] = existingRequest;
          send(socket, {
            type: 'request-sent',
            requestId: existingRequestId,
            sessionId: pending.sessionId,
            to: target,
          });
          return;
        }
        const sessionIdInUse = sessions.has(requestedSessionId)
          || [...requests.values()].some((pending) => pending.sessionId === requestedSessionId);
        if (requests.has(requestId) || sessionIdInUse) {
          send(socket, { type: 'error', message: 'Mã yêu cầu kết nối đã được sử dụng.' });
          return;
        }

        const conflict = [...requests.entries()].find(([, pending]) => (
          pending.fromId === target.id && pending.toId === peer.id
        ));
        if (conflict) {
          const [otherRequestId, otherPending] = conflict;
          clearRequest(otherRequestId);
          const sessionId = otherPending.sessionId;
          const initiatorId = peer.id.localeCompare(target.id) < 0 ? peer.id : target.id;
          authorizeSession(peer, socket, target, targetSocket, sessionId, initiatorId);
          for (const [requesterSocket, currentRequestId, remotePeer] of [
            [otherPending.fromSocket, otherRequestId, peer],
            [socket, requestId, peers.get(otherPending.fromSocket)],
          ]) {
            send(requesterSocket, {
              type: 'connection-response',
              requestId: currentRequestId,
              accepted: true,
              simultaneous: true,
              initiatorId,
              sessionId,
              from: remotePeer,
            });
          }
          return;
        }

        const pending = {
          requestId,
          fromId: peer.id,
          toId: target.id,
          fromSocket: socket,
          toSocket: targetSocket,
          fromConnectionId: peer.connectionId,
          toConnectionId: target.connectionId,
          expiresAt: now + REQUEST_TTL_MS,
          sessionId: requestedSessionId,
          timer: null,
        };
        pending.timer = setTimeout(() => expireRequest(requestId, 'timeout'), REQUEST_TTL_MS);
        pending.timer.unref?.();
        requests.set(requestId, pending);
        send(targetSocket, { type: 'connection-request', requestId, sessionId: pending.sessionId, from: peer });
        send(socket, { type: 'request-sent', requestId, sessionId: pending.sessionId, to: target });
        return;
      }

      if (message.type === 'respond') {
        if (!isValidIdentifier(message.requestId) || typeof message.accepted !== 'boolean') {
          send(socket, { type: 'error', message: 'Phản hồi yêu cầu không hợp lệ.' });
          return;
        }
        const pending = requests.get(message.requestId);
        if (
          !pending
          || pending.toSocket !== socket
          || pending.toConnectionId !== peer.connectionId
          || pending.expiresAt <= now
          || (message.sessionId !== undefined && message.sessionId !== pending.sessionId)
        ) {
          if (pending?.expiresAt <= now) expireRequest(message.requestId, 'timeout');
          send(socket, { type: 'error', message: 'Yêu cầu kết nối đã hết hạn.' });
          return;
        }
        const requesterSocket = pending.fromSocket;
        if (peers.get(requesterSocket)?.connectionId !== pending.fromConnectionId) {
          clearRequest(message.requestId);
          send(socket, { type: 'error', message: 'Thiết bị yêu cầu đã ngoại tuyến.' });
          return;
        }
        const accepted = message.accepted === true;
        clearRequest(message.requestId);
        let initiatorId = pending.fromId;
        if (accepted) {
          authorizeSession(
            peers.get(requesterSocket),
            requesterSocket,
            peer,
            socket,
            pending.sessionId,
            initiatorId,
          );
        }
        send(requesterSocket, {
          type: 'connection-response',
          requestId: message.requestId,
          accepted,
          initiatorId: accepted ? initiatorId : undefined,
          sessionId: pending.sessionId,
          from: peer,
        });
        send(socket, {
          type: 'response-sent',
          requestId: message.requestId,
          accepted,
          initiatorId: accepted ? initiatorId : undefined,
          sessionId: pending.sessionId,
          from: peers.get(requesterSocket),
        });
        return;
      }

      if (
        message.type === 'offer'
        || message.type === 'answer'
        || message.type === 'ice-candidate'
        || message.type === 'ice-restart-request'
      ) {
        const session = isValidIdentifier(message.sessionId) ? sessions.get(message.sessionId) : null;
        const senderIsFirst = session?.firstSocket === socket && session.firstConnectionId === peer.connectionId;
        const senderIsSecond = session?.secondSocket === socket && session.secondConnectionId === peer.connectionId;
        const targetSocket = senderIsFirst ? session.secondSocket : senderIsSecond ? session.firstSocket : null;
        const target = targetSocket && peers.get(targetSocket);
        const expectedTargetId = senderIsFirst ? session.secondId : senderIsSecond ? session.firstId : null;
        const validSignal = message.type === 'ice-candidate'
          ? isValidIceCandidate(message.candidate)
            && (message.usernameFragment === undefined
              || message.usernameFragment === null
              || typeof message.usernameFragment === 'string' && message.usernameFragment.length <= 256)
          : message.type === 'ice-restart-request'
            ? true
            : typeof message.signal === 'string' && message.signal.length > 0 && message.signal.length <= MAX_SIGNAL_LENGTH;
        if (
          !session
          || !target
          || !isValidIdentifier(message.targetId)
          || message.targetId !== expectedTargetId
          || session.expiresAt <= now
          || !validSignal
        ) {
          send(socket, { type: 'error', message: 'Không thể chuyển thông tin kết nối đến thiết bị.' });
          return;
        }
        if (message.type === 'offer' && session.initiatorId !== peer.id) {
          send(socket, { type: 'error', message: 'Chỉ thiết bị khởi tạo phiên được gửi Offer.' });
          return;
        }
        if (message.type === 'answer' && session.initiatorId === peer.id) {
          send(socket, { type: 'error', message: 'Offerer không được gửi Answer.' });
          return;
        }
        if (
          message.type === 'ice-restart-request'
          && (session.initiatorId === peer.id || message.targetId !== session.initiatorId)
        ) {
          send(socket, { type: 'error', message: 'Yêu cầu khởi động lại ICE không hợp lệ.' });
          return;
        }
        touchSession(session);
        send(targetSocket, {
          type: message.type,
          from: peer,
          sessionId: session.sessionId,
          ...(message.type === 'ice-candidate'
            ? { candidate: message.candidate, usernameFragment: message.usernameFragment || null }
            : {}),
          ...(message.type === 'offer' || message.type === 'answer' ? { signal: message.signal } : {}),
        });
        return;
      }

      if (message.type === 'cancel') {
        const pending = isValidIdentifier(message.requestId) ? requests.get(message.requestId) : null;
        if (!pending || pending.fromSocket !== socket || pending.sessionId !== message.sessionId) {
          send(socket, { type: 'error', message: 'Không thể hủy yêu cầu kết nối này.' });
          return;
        }
        clearRequest(message.requestId);
        const cancellation = {
          type: 'request-cancelled',
          requestId: pending.requestId,
          sessionId: pending.sessionId,
          from: peer,
        };
        send(pending.toSocket, cancellation);
        send(socket, cancellation);
        return;
      }

      if (message.type === 'disconnect') {
        const session = isValidIdentifier(message.sessionId) ? sessions.get(message.sessionId) : null;
        const ownsSession = session && (
          session.firstSocket === socket && session.firstId === peer.id
          || session.secondSocket === socket && session.secondId === peer.id
        );
        const targetId = session?.firstId === peer.id ? session.secondId : session?.firstId;
        if (!ownsSession || message.targetId !== targetId) {
          send(socket, { type: 'error', message: 'Không thể đóng phiên kết nối này.' });
          return;
        }
        removeSession(session.sessionId);
        send(session.firstSocket === socket ? session.secondSocket : session.firstSocket, {
          type: 'disconnect',
          from: peer,
          sessionId: session.sessionId,
        });
        return;
      }

      send(socket, { type: 'error', message: 'Loại thông điệp không được hỗ trợ.' });
    });

    socket.on('close', () => removePeer(socket));
    socket.on('error', () => removePeer(socket));
  });

  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const [requestId, entry] of requests) {
      if (entry.expiresAt <= now) expireRequest(requestId, 'timeout');
    }
    for (const session of sessions.values()) {
      if (session.expiresAt <= now) removeSession(session.sessionId);
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
      for (const pending of requests.values()) clearTimeout(pending.timer);
      for (const session of sessions.values()) clearTimeout(session.timer);
      requests.clear();
      sessions.clear();
      activeSessionsByPair.clear();
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
