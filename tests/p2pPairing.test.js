import test from 'node:test';
import assert from 'node:assert/strict';

import WebRTCCore from '../src/modules/P2P/core/WebRTCCore.js';
import { canTransitionPairing } from '../src/modules/P2P/pairing/PairingState.js';

test('pairing state transitions reject stale and conflicting lifecycle changes', () => {
  assert.equal(canTransitionPairing('IDLE', 'REQUESTED'), true);
  assert.equal(canTransitionPairing('REQUESTED', 'ACCEPTED'), true);
  assert.equal(canTransitionPairing('ACCEPTED', 'NEGOTIATING'), true);
  assert.equal(canTransitionPairing('NEGOTIATING', 'CONNECTED'), true);
  assert.equal(canTransitionPairing('REQUESTED', 'EXPIRED'), true);
  assert.equal(canTransitionPairing('NEGOTIATING', 'CANCELLED'), true);
  assert.equal(canTransitionPairing('CONNECTED', 'REQUESTED'), false);
  assert.equal(canTransitionPairing('REJECTED', 'CONNECTED'), false);
});

test('repeated offer calls share one in-flight SDP negotiation', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;
  let createOfferCalls = 0;
  let setLocalDescriptionCalls = 0;

  class FakeDataChannel extends EventTarget {
    constructor(label) {
      super();
      this.label = label;
      this.readyState = 'connecting';
    }

    close() {}
  }

  class FakePeerConnection extends EventTarget {
    constructor() {
      super();
      this.signalingState = 'stable';
      this.connectionState = 'new';
      this.iceConnectionState = 'new';
      this.iceGatheringState = 'complete';
    }

    createDataChannel(label) {
      return new FakeDataChannel(label);
    }

    async createOffer() {
      createOfferCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { type: 'offer', sdp: 'single-offer' };
    }

    async setLocalDescription(description) {
      setLocalDescriptionCalls += 1;
      this.localDescription = description;
      this.signalingState = 'have-local-offer';
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore();
    const [first, second] = await Promise.all([core.createOffer(), core.createOffer()]);
    assert.equal(first, second);
    assert.equal(createOfferCalls, 1);
    assert.equal(setLocalDescriptionCalls, 1);
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});

test('ICE restart creates a restart offer and emits a fresh end-of-candidates marker', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;
  const offerOptions = [];
  const signals = [];

  class FakeDataChannel extends EventTarget {
    constructor(label) {
      super();
      this.label = label;
      this.readyState = 'connecting';
    }

    close() {}
  }

  class FakePeerConnection extends EventTarget {
    constructor() {
      super();
      this.signalingState = 'stable';
      this.connectionState = 'new';
      this.iceConnectionState = 'new';
      this.iceGatheringState = 'complete';
      this.restartCalls = 0;
    }

    createDataChannel(label) {
      return new FakeDataChannel(label);
    }

    async createOffer(options) {
      offerOptions.push(options);
      return { type: 'offer', sdp: `offer-${offerOptions.length}` };
    }

    async setLocalDescription(description) {
      this.localDescription = description;
      this.signalingState = 'have-local-offer';
    }

    async setRemoteDescription(description) {
      this.remoteDescription = description;
      this.signalingState = 'stable';
    }

    restartIce() {
      this.restartCalls += 1;
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore({ onSignal: (candidate) => signals.push(candidate) });
    await core.createOffer();
    const endOfCandidates = new Event('icecandidate');
    Object.defineProperty(endOfCandidates, 'candidate', { value: null });
    core.peerConnection.dispatchEvent(endOfCandidates);
    await core.acceptAnswer('v1.answer:answer-1');

    await core.createIceRestartOffer();
    core.peerConnection.dispatchEvent(endOfCandidates);

    assert.deepEqual(offerOptions, [undefined, { iceRestart: true }]);
    assert.equal(core.peerConnection.restartCalls, 1);
    assert.deepEqual(signals, [null, null]);
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});

test('ICE candidates are held until matching remote SDP and retired generations are ignored', async () => {
  const previousPeerConnection = globalThis.RTCPeerConnection;

  class FakePeerConnection extends EventTarget {
    constructor() {
      super();
      this.signalingState = 'stable';
      this.connectionState = 'new';
      this.iceConnectionState = 'new';
      this.addedCandidates = [];
    }

    async setRemoteDescription(description) {
      this.remoteDescription = description;
    }

    async addIceCandidate(candidate) {
      this.addedCandidates.push(candidate);
    }

    close() {}
  }

  globalThis.RTCPeerConnection = FakePeerConnection;
  try {
    const core = new WebRTCCore();
    const oldDescription = { type: 'offer', sdp: 'v=0\r\na=ice-ufrag:old\r\n' };
    const newDescription = { type: 'offer', sdp: 'v=0\r\na=ice-ufrag:new\r\n' };
    await core.setRemoteDescription(oldDescription);

    const oldCandidate = { candidate: 'candidate:old', usernameFragment: 'old' };
    const newCandidate = { candidate: 'candidate:new', usernameFragment: 'new' };
    await core.addIceCandidate(oldCandidate);
    await core.addIceCandidate(newCandidate);
    await core.addIceCandidate(null, 'new');
    await core.setRemoteDescription(newDescription);
    await core.candidateQueue;
    await core.addIceCandidate(oldCandidate);

    assert.deepEqual(core.peerConnection.addedCandidates, [oldCandidate, newCandidate, null]);
    core.close();
  } finally {
    if (previousPeerConnection === undefined) delete globalThis.RTCPeerConnection;
    else globalThis.RTCPeerConnection = previousPeerConnection;
  }
});
