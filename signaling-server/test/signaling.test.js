import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';

import { createSignalingServer } from '../src/index.js';

function nextMessage(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeListener('message', onMessage);
      reject(new Error('Timed out waiting for signaling message.'));
    }, 2000);
    const onMessage = (buffer) => {
      const message = JSON.parse(buffer.toString());
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.removeListener('message', onMessage);
      resolve(message);
    };
    socket.on('message', onMessage);
  });
}

async function connectClient(url, name, deviceId) {
  const socket = new WebSocket(url, { origin: 'http://localhost' });
  await once(socket, 'open');
  const registered = nextMessage(socket, (message) => message.type === 'registered');
  socket.send(JSON.stringify({ type: 'register', name, ...(deviceId ? { deviceId } : {}) }));
  return { socket, registered: await registered };
}

test('signaling server lists online peers and relays accepted SDP only', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const first = await connectClient(url, 'Laptop');
    clients.push(first.socket);
    const secondDevices = nextMessage(first.socket, (message) => message.type === 'devices' && message.devices.length === 1);
    const second = await connectClient(url, 'Phone');
    clients.push(second.socket);
    const available = await secondDevices;
    assert.equal(available.devices[0].name, 'Phone');

    const connectionRequest = nextMessage(second.socket, (message) => message.type === 'connection-request');
    const requestSent = nextMessage(first.socket, (message) => message.type === 'request-sent');
    const sessionId = 'test-session-id';
    first.socket.send(JSON.stringify({ type: 'request', targetId: second.registered.deviceId, sessionId }));
    const [request, sent] = await Promise.all([connectionRequest, requestSent]);
    assert.equal(request.from.name, 'Laptop');
    assert.equal(request.sessionId, sessionId);
    assert.equal(sent.sessionId, sessionId);

    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: request.requestId,
      accepted: true,
      sessionId: request.sessionId,
    }));
    const connectionResponse = await response;
    assert.equal(connectionResponse.accepted, true);
    assert.equal(connectionResponse.sessionId, sessionId);

    const relayedOffer = nextMessage(second.socket, (message) => message.type === 'offer');
    first.socket.send(JSON.stringify({
      type: 'offer',
      targetId: second.registered.deviceId,
      sessionId,
      signal: 'v1.offer:test-sdp',
    }));
    const receivedOffer = await relayedOffer;
    assert.equal(receivedOffer.signal, 'v1.offer:test-sdp');
    assert.equal(receivedOffer.sessionId, sessionId);
    assert.ok(sent.requestId);
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('signaling server relays ICE candidates only between authorized peers', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  let stage = 'registering peers';
  try {
    const first = await connectClient(url, 'Laptop');
    const second = await connectClient(url, 'Phone');
    const third = await connectClient(url, 'Tablet');
    clients.push(first.socket, second.socket, third.socket);

    const connectionRequest = nextMessage(second.socket, (message) => message.type === 'connection-request');
    first.socket.send(JSON.stringify({ type: 'request', targetId: second.registered.deviceId }));
    const request = await connectionRequest;
    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: request.requestId,
      accepted: true,
    }));
    await response;

    const candidate = {
      candidate: 'candidate:1 1 udp 2122260223 192.0.2.1 50000 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0,
      usernameFragment: 'test-ufrag',
    };
    stage = 'relaying authorized candidate';
    const relayedCandidate = nextMessage(second.socket, (message) => message.type === 'ice-candidate');
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate,
    }));
    const received = await relayedCandidate;
    assert.deepEqual(received.candidate, candidate);
    assert.equal(received.from.id, first.registered.deviceId);

    const relayedEndOfCandidates = nextMessage(second.socket, (message) => (
      message.type === 'ice-candidate' && message.candidate === null
    ));
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate: null,
    }));
    assert.equal((await relayedEndOfCandidates).candidate, null);

    stage = 'rejecting unauthorized candidate';
    const unauthorizedError = nextMessage(third.socket, (message) => message.type === 'error');
    third.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      candidate,
    }));
    assert.match((await unauthorizedError).message, /Không thể chuyển/);

    stage = 'rejecting malformed candidate';
    const invalidCandidateError = nextMessage(second.socket, (message) => message.type === 'error');
    second.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: first.registered.deviceId,
      candidate: { candidate: 'x'.repeat(4097), sdpMid: '0', sdpMLineIndex: 0 },
    }));
    assert.match((await invalidCandidateError).message, /Không thể chuyển/);
  } catch (error) {
    error.message = `${stage}: ${error.message}`;
    throw error;
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('signaling server exposes a health endpoint', async () => {
  const service = createSignalingServer({ port: 0 });
  const address = await service.listen();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    await service.close();
  }
});

test('re-registering a persistent device replaces its socket without duplicate presence', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const observer = await connectClient(url, 'Observer');
    clients.push(observer.socket);
    const persistentId = '9f9d6c2c-9eff-4c7a-aa0d-a09397c3842f';
    const oldClient = await connectClient(url, 'Phone', persistentId);
    clients.push(oldClient.socket);
    const oldClientClosed = once(oldClient.socket, 'close');
    const listedDevices = nextMessage(
      observer.socket,
      (message) => message.type === 'devices' && message.devices.some((device) => device.id === persistentId),
    );
    const replacement = await connectClient(url, 'Phone', persistentId);
    clients.push(replacement.socket);

    await oldClientClosed;
    const connectionRequest = nextMessage(replacement.socket, (message) => message.type === 'connection-request');
    observer.socket.send(JSON.stringify({ type: 'request', targetId: persistentId }));

    const [devices, request] = await Promise.all([listedDevices, connectionRequest]);
    assert.equal(devices.devices.filter((device) => device.id === persistentId).length, 1);
    assert.equal(request.from.id, observer.registered.deviceId);
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});
