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

async function connectClient(url, name) {
  const socket = new WebSocket(url, { origin: 'http://localhost' });
  await once(socket, 'open');
  const registered = nextMessage(socket, (message) => message.type === 'registered');
  socket.send(JSON.stringify({ type: 'register', name }));
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
    first.socket.send(JSON.stringify({ type: 'request', targetId: second.registered.deviceId }));
    const [request, sent] = await Promise.all([connectionRequest, requestSent]);
    assert.equal(request.from.name, 'Laptop');

    const response = nextMessage(first.socket, (message) => message.type === 'connection-response');
    second.socket.send(JSON.stringify({
      type: 'respond',
      requestId: request.requestId,
      accepted: true,
    }));
    assert.equal((await response).accepted, true);

    const relayedOffer = nextMessage(second.socket, (message) => message.type === 'offer');
    first.socket.send(JSON.stringify({
      type: 'offer',
      targetId: second.registered.deviceId,
      signal: 'v1.offer:test-sdp',
    }));
    assert.equal((await relayedOffer).signal, 'v1.offer:test-sdp');
    assert.ok(sent.requestId);
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
