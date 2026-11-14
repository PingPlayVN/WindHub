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

async function connectClient(url, name, deviceId, protocolVersion = 2) {
  const socket = new WebSocket(url, { origin: 'http://localhost' });
  await once(socket, 'open');
  const registered = nextMessage(socket, (message) => message.type === 'registered');
  socket.send(JSON.stringify({
    type: 'register',
    name,
    protocolVersion,
    ...(deviceId ? { deviceId } : {}),
  }));
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
    const secondDevices = nextMessage(first.socket, (message) => (
      message.type === 'device-upsert' && message.device?.name === 'Phone'
    ));
    const second = await connectClient(url, 'Phone');
    clients.push(second.socket);
    const available = await secondDevices;
    assert.equal(available.device.name, 'Phone');

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
      sessionId: request.sessionId,
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
      sessionId: request.sessionId,
      candidate,
      usernameFragment: 'test-ufrag',
    }));
    const received = await relayedCandidate;
    assert.deepEqual(received.candidate, candidate);
    assert.equal(received.from.id, first.registered.deviceId);
    assert.equal(received.usernameFragment, 'test-ufrag');

    const relayedEndOfCandidates = nextMessage(second.socket, (message) => (
      message.type === 'ice-candidate' && message.candidate === null
    ));
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      sessionId: request.sessionId,
      candidate: null,
      usernameFragment: 'test-ufrag',
    }));
    assert.equal((await relayedEndOfCandidates).candidate, null);

    stage = 'rejecting unauthorized candidate';
    const unauthorizedError = nextMessage(third.socket, (message) => message.type === 'error');
    third.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      sessionId: request.sessionId,
      candidate,
    }));
    assert.match((await unauthorizedError).message, /Không thể chuyển/);

    stage = 'rejecting malformed candidate';
    const invalidCandidateError = nextMessage(second.socket, (message) => message.type === 'error');
    second.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: first.registered.deviceId,
      sessionId: request.sessionId,
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

test('legacy clients continue receiving full device snapshots on presence changes', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const legacy = await connectClient(url, 'Legacy', undefined, 1);
    clients.push(legacy.socket);
    const snapshot = nextMessage(
      legacy.socket,
      (message) => message.type === 'devices' && message.devices.some((device) => device.name === 'Modern'),
    );
    const modern = await connectClient(url, 'Modern');
    clients.push(modern.socket);
    assert.equal((await snapshot).devices[0].name, 'Modern');
  } finally {
    for (const socket of clients) socket.close();
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

    const incoming = nextMessage(oldClient.socket, (message) => message.type === 'connection-request');
    const requestSent = nextMessage(observer.socket, (message) => message.type === 'request-sent');
    observer.socket.send(JSON.stringify({
      type: 'request',
      targetId: persistentId,
      requestId: 'replace-active-request',
      sessionId: 'replace-active-session',
    }));
    const [activeRequest, sentRequest] = await Promise.all([incoming, requestSent]);
    const accepted = nextMessage(observer.socket, (message) => message.type === 'connection-response');
    oldClient.socket.send(JSON.stringify({
      type: 'respond',
      requestId: activeRequest.requestId,
      sessionId: activeRequest.sessionId,
      accepted: true,
    }));
    await accepted;

    const oldClientClosed = once(oldClient.socket, 'close');
    const interruptedSession = nextMessage(
      observer.socket,
      (message) => message.type === 'session-interrupted' && message.sessionId === sentRequest.sessionId,
    );
    const listedDevices = nextMessage(
      observer.socket,
      (message) => message.type === 'device-upsert' && message.device?.id === persistentId,
    );
    const replacement = await connectClient(url, 'Phone', persistentId);
    clients.push(replacement.socket);

    await Promise.all([oldClientClosed, interruptedSession]);
    assert.notEqual(oldClient.registered.connectionId, replacement.registered.connectionId);
    const connectionRequest = nextMessage(replacement.socket, (message) => message.type === 'connection-request');
    observer.socket.send(JSON.stringify({ type: 'request', targetId: persistentId }));

    const [devices, request] = await Promise.all([listedDevices, connectionRequest]);
    assert.equal(devices.device.id, persistentId);
    assert.equal(request.from.id, observer.registered.deviceId);
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('duplicate connection requests reuse the pending request instead of notifying twice', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const first = await connectClient(url, 'Laptop');
    const second = await connectClient(url, 'Phone');
    clients.push(first.socket, second.socket);

    const incoming = nextMessage(second.socket, (message) => message.type === 'connection-request');
    const firstAck = nextMessage(first.socket, (message) => message.type === 'request-sent');
    first.socket.send(JSON.stringify({
      type: 'request',
      targetId: second.registered.deviceId,
      requestId: 'request-one',
      sessionId: 'session-one',
    }));
    const [request, ack] = await Promise.all([incoming, firstAck]);
    assert.equal(request.requestId, 'request-one');
    assert.equal(ack.requestId, 'request-one');

    const duplicateAck = nextMessage(first.socket, (message) => message.type === 'request-sent');
    first.socket.send(JSON.stringify({
      type: 'request',
      targetId: second.registered.deviceId,
      requestId: 'request-two',
      sessionId: 'session-two',
    }));
    const duplicate = await duplicateAck;
    assert.equal(duplicate.requestId, 'request-one');
    assert.equal(duplicate.sessionId, 'session-one');
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('simultaneous requests converge on one authorized session and one offerer', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const first = await connectClient(url, 'Laptop');
    const second = await connectClient(url, 'Phone');
    clients.push(first.socket, second.socket);

    const firstResponse = nextMessage(first.socket, (message) => message.type === 'connection-response');
    const secondResponse = nextMessage(second.socket, (message) => message.type === 'connection-response');
    first.socket.send(JSON.stringify({
      type: 'request',
      targetId: second.registered.deviceId,
      requestId: 'first-request',
      sessionId: 'first-session',
    }));
    second.socket.send(JSON.stringify({
      type: 'request',
      targetId: first.registered.deviceId,
      requestId: 'second-request',
      sessionId: 'second-session',
    }));

    const [firstAccepted, secondAccepted] = await Promise.all([firstResponse, secondResponse]);
    assert.equal(firstAccepted.accepted, true);
    assert.equal(secondAccepted.accepted, true);
    assert.equal(firstAccepted.sessionId, secondAccepted.sessionId);
    assert.equal(firstAccepted.initiatorId, secondAccepted.initiatorId);
    assert.equal(firstAccepted.from.id, second.registered.deviceId);
    assert.equal(secondAccepted.from.id, first.registered.deviceId);

    const initiator = firstAccepted.initiatorId === first.registered.deviceId ? first : second;
    const recipient = initiator === first ? second : first;
    const offer = nextMessage(recipient.socket, (message) => message.type === 'offer');
    initiator.socket.send(JSON.stringify({
      type: 'offer',
      targetId: recipient.registered.deviceId,
      sessionId: firstAccepted.sessionId,
      signal: 'v1.offer:restart-safe-sdp',
    }));
    assert.equal((await offer).signal, 'v1.offer:restart-safe-sdp');
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});

test('request cancellation reaches both peers and stale session messages are rejected', async () => {
  const service = createSignalingServer({ port: 0, allowedOrigins: 'http://localhost' });
  const address = await service.listen();
  const url = `ws://127.0.0.1:${address.port}/p2p`;
  const clients = [];
  try {
    const first = await connectClient(url, 'Laptop');
    const second = await connectClient(url, 'Phone');
    clients.push(first.socket, second.socket);

    const incoming = nextMessage(second.socket, (message) => message.type === 'connection-request');
    const sent = nextMessage(first.socket, (message) => message.type === 'request-sent');
    first.socket.send(JSON.stringify({
      type: 'request',
      targetId: second.registered.deviceId,
      requestId: 'cancel-request',
      sessionId: 'cancel-session',
    }));
    const [request, ack] = await Promise.all([incoming, sent]);
    assert.equal(request.sessionId, ack.sessionId);

    const cancelled = nextMessage(second.socket, (message) => message.type === 'request-cancelled');
    const cancellationAck = nextMessage(first.socket, (message) => message.type === 'request-cancelled');
    first.socket.send(JSON.stringify({
      type: 'cancel',
      requestId: request.requestId,
      sessionId: request.sessionId,
    }));
    assert.equal((await cancelled).requestId, request.requestId);
    assert.equal((await cancellationAck).sessionId, request.sessionId);

    const nextIncoming = nextMessage(second.socket, (message) => message.type === 'connection-request');
    first.socket.send(JSON.stringify({
      type: 'request',
      targetId: second.registered.deviceId,
      requestId: 'fresh-request',
      sessionId: 'fresh-session',
    }));
    const freshRequest = await nextIncoming;
    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: freshRequest.requestId,
      sessionId: freshRequest.sessionId,
      accepted: true,
    }));
    await response;

    const staleError = nextMessage(first.socket, (message) => message.type === 'error');
    first.socket.send(JSON.stringify({
      type: 'ice-candidate',
      targetId: second.registered.deviceId,
      sessionId: 'old-session',
      candidate: null,
    }));
    assert.match((await staleError).message, /Không thể chuyển/);
  } finally {
    for (const socket of clients) socket.close();
    await service.close();
  }
});
