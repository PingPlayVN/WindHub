import test from 'node:test';
import assert from 'node:assert/strict';

import SignalingClient from '../src/modules/P2P/pairing/SignalingClient.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) || null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

class FakeWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    super();
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  send(message) {
    this.sent.push(message);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  receive(message) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }));
  }

  close(code = 1000) {
    this.readyState = FakeWebSocket.CLOSED;
    const event = new Event('close');
    Object.defineProperty(event, 'code', { value: code });
    this.dispatchEvent(event);
  }
}

FakeWebSocket.instances = [];

test('signaling client keeps a persistent device identity and uses server connection identity', () => {
  const previousWebSocket = globalThis.WebSocket;
  const previousWindow = globalThis.window;
  globalThis.WebSocket = FakeWebSocket;
  globalThis.window = { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() };
  FakeWebSocket.instances = [];

  try {
    const first = new SignalingClient('https://signaling.example', { name: 'Laptop' });
    const second = new SignalingClient('https://signaling.example', { name: 'Laptop' });
    assert.equal(first.deviceId, second.deviceId);

    const states = [];
    first.onStateChange = (state) => states.push(state);
    first.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    assert.equal(JSON.parse(socket.sent[0]).deviceId, first.deviceId);
    socket.receive({ type: 'registered', connectionId: 'server-connection-1' });
    assert.equal(first.connectionId, 'server-connection-1');
    assert.deepEqual(states, ['connecting', 'online']);

    first.close();
    second.close();
  } finally {
    if (previousWebSocket === undefined) delete globalThis.WebSocket;
    else globalThis.WebSocket = previousWebSocket;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('signaling client ignores late callbacks after its connection is closed', () => {
  const previousWebSocket = globalThis.WebSocket;
  const previousWindow = globalThis.window;
  globalThis.WebSocket = FakeWebSocket;
  globalThis.window = { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() };
  FakeWebSocket.instances = [];

  try {
    const messages = [];
    const client = new SignalingClient('https://signaling.example', {
      name: 'Phone',
      onMessage: (message) => messages.push(message),
    });
    client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    client.close();
    socket.receive({ type: 'devices', devices: [{ id: 'stale' }] });
    assert.deepEqual(messages, []);
  } finally {
    if (previousWebSocket === undefined) delete globalThis.WebSocket;
    else globalThis.WebSocket = previousWebSocket;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('a replaced same-identity tab does not reconnect in a competing loop', () => {
  const previousWebSocket = globalThis.WebSocket;
  const previousWindow = globalThis.window;
  globalThis.WebSocket = FakeWebSocket;
  globalThis.window = { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() };
  FakeWebSocket.instances = [];

  try {
    const client = new SignalingClient('https://signaling.example', { name: 'Tablet' });
    client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: 'registered', connectionId: 'connection-1' });
    socket.close(4001);

    client.connect();
    assert.equal(client.replaced, true);
    assert.equal(FakeWebSocket.instances.length, 1);
  } finally {
    if (previousWebSocket === undefined) delete globalThis.WebSocket;
    else globalThis.WebSocket = previousWebSocket;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
