import { ICE_SERVERS } from '../config/iceServers.js';
import { LOW_WATERMARK, MAX_CHUNK_SIZE, MAX_FRAME_HEADER_BYTES, MIN_CHUNK_SIZE } from '../transfers/protocol.js';

const MAX_SIGNAL_SIZE = 64 * 1024;
export function encodeSignalToken(description) {
  if (!description || typeof description.sdp !== 'string' || !description.type) {
    throw new Error('Mã ghép nối không hợp lệ.');
  }
  return `v1.${description.type}:${description.sdp}`;
}

export function decodeSignalToken(token) {
  if (typeof token !== 'string' || !token.startsWith('v1.')) {
    return token;
  }

  const compactValue = token.slice(3);
  if (!compactValue) {
    throw new Error('Mã ghép nối trống.');
  }

  const separatorIndex = compactValue.indexOf(':');
  if (separatorIndex <= 0) {
    throw new Error('Mã ghép nối không hợp lệ.');
  }

  const type = compactValue.slice(0, separatorIndex);
  const sdp = compactValue.slice(separatorIndex + 1);
  if (type !== 'offer' && type !== 'answer') {
    throw new Error('Mã ghép nối không hợp lệ.');
  }

  return { version: 1, type, sdp };
}

export function parseSignal(signal, expectedType) {
  if (typeof signal !== 'string' || signal.length > MAX_SIGNAL_SIZE) {
    throw new Error('Mã kết nối không hợp lệ hoặc vượt quá giới hạn kích thước.');
  }

  let description;
  try {
    description = JSON.parse(signal);
  } catch {
    try {
      description = decodeSignalToken(signal);
    } catch {
      throw new Error('Không đọc được mã kết nối. Hãy dán nguyên văn Offer hoặc Answer.');
    }
  }

  if (
    description?.version !== 1
    || description?.type !== expectedType
    || typeof description?.sdp !== 'string'
    || !description.sdp.trim()
    || description.sdp.length > MAX_SIGNAL_SIZE
  ) {
    throw new Error(`Mã ${expectedType === 'offer' ? 'Offer' : 'Answer'} không hợp lệ.`);
  }

  return { type: description.type, sdp: description.sdp };
}

export default class WebRTCCore {
  constructor({
    onStateChange = () => {},
    onMessage = () => {},
    onSignal = () => {},
    onError = () => {},
    onTiming = () => {},
    onIceRestartRequest = () => {},
    iceServers = ICE_SERVERS,
  } = {}) {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt này không hỗ trợ WebRTC.');
    }

    this.onStateChange = onStateChange;
    this.onSignal = onSignal;
    this.onError = onError;
    this.onTiming = onTiming;
    this.onIceRestartRequest = onIceRestartRequest;
    this.messageListeners = new Set([onMessage]);
    this.state = 'idle';
    this.closed = false;
    this.remoteDescriptionReady = false;
    this.pendingCandidates = [];
    this.candidateQueue = Promise.resolve();
    this.remoteCandidateSignatures = new Set();
    this.retiredRemoteIceUfrags = new Set();
    this.remoteDescriptionPromise = null;
    this.offerPromise = null;
    this.answerPromise = null;
    this.answerOfferKey = null;
    this.answerToken = null;
    this.offerToken = null;
    this.acceptedAnswerKey = null;
    this.firstCandidateReported = false;
    this.endOfCandidatesSent = false;
    this.recoveryTimer = null;
    this.iceRestartRetries = 0;
    this.maxIceRestartRetries = 3;
    this.iceRestartInProgress = false;
    this.iceGatheringStartedAt = null;
    this.iceCheckingStartedAt = null;
    this.negotiationStartedAt = null;
    this.controlChannel = null;
    this.fileChannel = null;
    this.peerConnection = new RTCPeerConnection({ iceServers });
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (this.closed) return;
      if (!event.candidate) {
        if (this.endOfCandidatesSent) return;
        this.endOfCandidatesSent = true;
        try {
          this.onSignal(null, this.getIceUsernameFragment(this.peerConnection.localDescription?.sdp));
        } catch (error) {
          if (!this.closed) this.onError(error);
        }
        return;
      }
      if (!this.firstCandidateReported) {
        this.firstCandidateReported = true;
        if (this.negotiationStartedAt !== null) {
          this.onTiming('first-ice-candidate', performance.now() - this.negotiationStartedAt);
        }
      }
      try {
        const candidate = event.candidate.toJSON();
        this.onSignal(candidate, candidate.usernameFragment || this.getIceUsernameFragment(this.peerConnection.localDescription?.sdp));
      } catch (error) {
        if (!this.closed) this.onError(error);
      }
    });
    this.peerConnection.addEventListener('connectionstatechange', () => {
      this.updateConnectionState();
    });
    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      if (this.peerConnection.iceConnectionState === 'checking' && this.iceCheckingStartedAt === null) {
        this.iceCheckingStartedAt = performance.now();
      }
      if (['connected', 'completed'].includes(this.peerConnection.iceConnectionState) && this.iceCheckingStartedAt !== null) {
        this.onTiming('ice-connection', performance.now() - this.iceCheckingStartedAt);
        this.iceCheckingStartedAt = null;
      }
      this.updateConnectionState();
    });
    this.peerConnection.addEventListener('icegatheringstatechange', () => {
      if (this.peerConnection.iceGatheringState === 'gathering' && this.iceGatheringStartedAt === null) {
        this.iceGatheringStartedAt = performance.now();
      }
      if (this.peerConnection.iceGatheringState === 'complete' && this.iceGatheringStartedAt !== null) {
        this.onTiming('ice-gathering', performance.now() - this.iceGatheringStartedAt);
        this.iceGatheringStartedAt = null;
      }
    });
    this.peerConnection.addEventListener('datachannel', (event) => this.attachChannel(event.channel));
    this.peerConnection.addEventListener('signalingstatechange', () => {
      if (this.peerConnection.signalingState === 'closed') this.setState('closed');
    });
  }

  setState(state) {
    if (this.closed && state !== 'closed') return;
    this.state = state;
    this.onStateChange(state);
  }

  get channel() {
    return this.controlChannel;
  }

  getMaxFileChunkSize() {
    const negotiatedMax = this.peerConnection.sctp?.maxMessageSize;
    if (!Number.isFinite(negotiatedMax) || negotiatedMax === 0) return MAX_CHUNK_SIZE;
    const maxPayload = negotiatedMax - MAX_FRAME_HEADER_BYTES;
    if (maxPayload < MIN_CHUNK_SIZE) return 0;
    return Math.min(MAX_CHUNK_SIZE, maxPayload);
  }

  async getConnectionStats() {
    const stats = await this.peerConnection.getStats();
    const reports = [...stats.values()];
    const transport = reports.find((report) => report.type === 'transport' && report.selectedCandidatePairId);
    const pair = (transport && stats.get(transport.selectedCandidatePairId))
      || reports.find((report) => report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated);
    if (!pair) return null;

    const localCandidate = stats.get(pair.localCandidateId);
    const remoteCandidate = stats.get(pair.remoteCandidateId);
    const isRelay = localCandidate?.candidateType === 'relay' || remoteCandidate?.candidateType === 'relay';
    return {
      path: isRelay ? 'relay' : 'direct',
      protocol: localCandidate?.protocol || remoteCandidate?.protocol || '',
      localCandidateType: localCandidate?.candidateType || '',
      remoteCandidateType: remoteCandidate?.candidateType || '',
      bytesSent: pair.bytesSent || 0,
      bytesReceived: pair.bytesReceived || 0,
      packetsSent: pair.packetsSent || 0,
      packetsReceived: pair.packetsReceived || 0,
      retransmittedPacketsSent: pair.retransmittedPacketsSent || 0,
      roundTripTime: pair.currentRoundTripTime || 0,
      availableOutgoingBitrate: pair.availableOutgoingBitrate || null,
    };
  }

  getIceUsernameFragment(sdp) {
    return typeof sdp === 'string' ? sdp.match(/^a=ice-ufrag:(.+)$/m)?.[1]?.trim() || null : null;
  }

  getCandidateSignature(candidate, usernameFragment = null) {
    if (candidate === null) return `end-of-candidates:${usernameFragment || ''}`;
    if (!candidate || typeof candidate !== 'object') return JSON.stringify(candidate);
    const candidateText = typeof candidate.candidate === 'string' ? candidate.candidate : '';
    return `${candidateText}|${candidate.sdpMid ?? ''}|${candidate.sdpMLineIndex ?? ''}|${candidate.usernameFragment ?? usernameFragment ?? ''}`;
  }

  rememberRemoteCandidate(signature) {
    if (this.remoteCandidateSignatures.has(signature)) return false;
    this.remoteCandidateSignatures.add(signature);
    if (this.remoteCandidateSignatures.size > 1024) {
      this.remoteCandidateSignatures.delete(this.remoteCandidateSignatures.values().next().value);
    }
    return true;
  }

  scheduleRecovery() {
    if (this.closed || this.recoveryTimer || this.iceRestartInProgress) return;
    const { connectionState, iceConnectionState } = this.peerConnection;
    if (iceConnectionState !== 'failed' && connectionState !== 'failed') return;
    if (this.iceRestartRetries >= this.maxIceRestartRetries) return;
    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = null;
      if (this.closed) return;
      const nextConnectionState = this.peerConnection.connectionState;
      const nextIceState = this.peerConnection.iceConnectionState;
      if (nextConnectionState !== 'failed' && nextIceState !== 'failed') return;
      this.iceRestartRetries += 1;
      this.iceRestartInProgress = true;
      try {
        this.peerConnection.restartIce?.();
        Promise.resolve(this.onIceRestartRequest()).catch((error) => {
          this.iceRestartInProgress = false;
          if (!this.closed) this.onError(error);
        });
      } catch (error) {
        this.iceRestartInProgress = false;
        if (!this.closed) this.onError(error);
      }
    }, 0);
  }

  updateConnectionState() {
    if (this.closed) return;
    const { connectionState, iceConnectionState } = this.peerConnection;
    if (connectionState === 'failed' || iceConnectionState === 'failed') {
      this.setState('failed');
      this.scheduleRecovery();
      return;
    }
    if (
      this.iceRestartInProgress
      && this.peerConnection.signalingState !== 'stable'
      && this.controlChannel?.readyState === 'open'
      && this.fileChannel?.readyState === 'open'
    ) {
      this.setState('connecting');
      return;
    }
    if (this.controlChannel?.readyState === 'open' && this.fileChannel?.readyState === 'open') {
      this.iceRestartRetries = 0;
      this.iceRestartInProgress = false;
      if (this.negotiationStartedAt !== null) {
        this.onTiming('data-channel-open', performance.now() - this.negotiationStartedAt);
        this.negotiationStartedAt = null;
      }
      this.setState('connected');
      return;
    }
    if (connectionState === 'connected' || iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      this.iceRestartRetries = 0;
      this.setState('connecting');
    } else if (connectionState === 'disconnected' || iceConnectionState === 'disconnected') {
      this.setState('disconnected');
    } else if (connectionState === 'connecting' || iceConnectionState === 'checking') {
      this.setState('connecting');
    }
  }

  addIceCandidate(candidate, usernameFragment = null) {
    if (candidate === undefined || this.closed) return Promise.resolve();
    const candidateUfrag = candidate?.usernameFragment || usernameFragment;
    if (candidateUfrag && this.retiredRemoteIceUfrags.has(candidateUfrag)) return Promise.resolve();
    const remoteUfrag = this.getIceUsernameFragment(this.peerConnection.remoteDescription?.sdp);
    const signature = this.getCandidateSignature(candidate, candidateUfrag);
    if (!this.rememberRemoteCandidate(signature)) return Promise.resolve();
    if (
      !this.remoteDescriptionReady
      || this.remoteDescriptionPromise
      || (candidateUfrag && remoteUfrag && candidateUfrag !== remoteUfrag)
    ) {
      if (this.pendingCandidates.length >= 512) {
        const error = new Error('Quá nhiều ICE candidate đang chờ áp dụng.');
        this.onError(error);
        return Promise.reject(error);
      }
      this.pendingCandidates.push({ candidate, usernameFragment: candidateUfrag });
      return Promise.resolve();
    }
    return this.enqueueIceCandidate(candidate);
  }

  enqueueIceCandidate(candidate) {
    const operation = this.candidateQueue.then(() => {
      if (this.closed) return undefined;
      return this.peerConnection.addIceCandidate(candidate);
    });
    this.candidateQueue = operation.catch((error) => {
      if (!this.closed) this.onError(error);
    });
    return operation;
  }

  async setRemoteDescription(description) {
    if (
      this.remoteDescriptionReady
      && this.peerConnection.remoteDescription?.type === description.type
      && this.peerConnection.remoteDescription?.sdp === description.sdp
    ) return;
    if (this.remoteDescriptionPromise) {
      await this.remoteDescriptionPromise;
      if (
        this.remoteDescriptionReady
        && this.peerConnection.remoteDescription?.type === description.type
        && this.peerConnection.remoteDescription?.sdp === description.sdp
      ) return;
    }
    this.remoteDescriptionPromise = (async () => {
      const previousUfrag = this.getIceUsernameFragment(this.peerConnection.remoteDescription?.sdp);
      await this.peerConnection.setRemoteDescription(description);
      if (this.closed) return;
      this.remoteDescriptionReady = true;
      const remoteUfrag = this.getIceUsernameFragment(description.sdp);
      if (previousUfrag && remoteUfrag && previousUfrag !== remoteUfrag) {
        this.retiredRemoteIceUfrags.add(previousUfrag);
        if (this.retiredRemoteIceUfrags.size > 16) {
          this.retiredRemoteIceUfrags.delete(this.retiredRemoteIceUfrags.values().next().value);
        }
        this.remoteCandidateSignatures.delete(`end-of-candidates:${previousUfrag}`);
      }
      const queuedCandidates = this.pendingCandidates.splice(0);
      for (const queued of queuedCandidates) {
        if (!queued.usernameFragment || !remoteUfrag || queued.usernameFragment === remoteUfrag) {
          this.enqueueIceCandidate(queued.candidate);
        }
      }
      await this.candidateQueue;
    })();
    try {
      await this.remoteDescriptionPromise;
    } finally {
      this.remoteDescriptionPromise = null;
    }
  }

  createDataChannels() {
    if (!this.controlChannel) {
      this.attachChannel(this.peerConnection.createDataChannel('windhub-control', { ordered: true }));
    }
    if (!this.fileChannel) {
      this.attachChannel(this.peerConnection.createDataChannel('windhub-file', { ordered: true }));
    }
  }

  attachChannel(channel) {
    const isFileChannel = channel.label === 'windhub-file';
    if (isFileChannel) {
      if (this.fileChannel && this.fileChannel !== channel) {
        channel.close();
        return;
      }
      this.fileChannel = channel;
    } else {
      if (this.controlChannel && this.controlChannel !== channel) {
        channel.close();
        return;
      }
      this.controlChannel = channel;
    }

    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = LOW_WATERMARK;
    channel.addEventListener('open', () => {
      if (!this.closed) {
        this.onTiming(`DataChannel open (${channel.label})`);
        this.updateConnectionState();
      }
    });
    channel.addEventListener('close', () => {
      if (!this.closed) this.setState('disconnected');
    });
    channel.addEventListener('error', () => {
      if (!this.closed) this.setState('failed');
    });
    channel.addEventListener('message', (event) => {
      for (const listener of this.messageListeners) listener(event.data, channel.label);
    });
    this.updateConnectionState();
  }

  onMessage(listener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  async createOffer() {
    this.ensureOpen();
    if (this.offerPromise) return this.offerPromise;
    if (this.answerPromise) throw new Error('WebRTC negotiation is already in progress.');
    if (this.peerConnection.signalingState === 'have-local-offer' && this.offerToken) return this.offerToken;
    if (this.peerConnection.signalingState !== 'stable') throw new Error('WebRTC negotiation is already in progress.');
    const startedAt = performance.now();
    this.acceptedAnswerKey = null;
    this.setState('creating');
    this.negotiationStartedAt = startedAt;
    this.offerPromise = (async () => {
      try {
        this.createDataChannels();
        const offer = await this.peerConnection.createOffer();
        this.iceGatheringStartedAt = performance.now();
        await this.peerConnection.setLocalDescription(offer);
        if (this.closed) throw new Error('Kết nối đã đóng trong khi tạo Offer.');
        this.offerToken = encodeSignalToken({
          version: 1,
          type: 'offer',
          sdp: this.peerConnection.localDescription.sdp,
        });
        this.onTiming('offer-creation', performance.now() - startedAt);
        this.setState('waiting');
        return this.offerToken;
      } catch (error) {
        this.setState('failed');
        throw error;
      } finally {
        this.offerPromise = null;
      }
    })();
    return this.offerPromise;
  }

  async createIceRestartOffer() {
    this.ensureOpen();
    if (this.answerPromise || this.offerPromise || this.peerConnection.signalingState !== 'stable') {
      throw new Error('WebRTC negotiation is already in progress.');
    }
    this.peerConnection.restartIce?.();
    this.offerToken = null;
    this.endOfCandidatesSent = false;
    this.firstCandidateReported = false;
    this.acceptedAnswerKey = null;
    const startedAt = performance.now();
    this.setState('creating');
    this.negotiationStartedAt = startedAt;
    this.offerPromise = (async () => {
      try {
        const offer = await this.peerConnection.createOffer({ iceRestart: true });
        this.iceGatheringStartedAt = performance.now();
        await this.peerConnection.setLocalDescription(offer);
        if (this.closed) throw new Error('Kết nối đã đóng trong khi khởi động lại ICE.');
        this.offerToken = encodeSignalToken({
          version: 1,
          type: 'offer',
          sdp: this.peerConnection.localDescription.sdp,
        });
        this.onTiming('offer-creation', performance.now() - startedAt);
        this.setState('waiting');
        return this.offerToken;
      } catch (error) {
        this.setState('failed');
        throw error;
      } finally {
        this.offerPromise = null;
      }
    })();
    return this.offerPromise;
  }

  async createAnswer(offerText) {
    this.ensureOpen();
    const offer = parseSignal(offerText, 'offer');
    const offerKey = `${offer.type}:${offer.sdp}`;
    if (this.answerPromise && this.answerOfferKey === offerKey) return this.answerPromise;
    if (this.answerOfferKey === offerKey && this.answerToken) return this.answerToken;
    if (this.offerPromise || this.answerPromise) throw new Error('WebRTC negotiation is already in progress.');
    if (!['stable', 'have-remote-offer'].includes(this.peerConnection.signalingState)) {
      throw new Error('WebRTC negotiation is already in progress.');
    }
    const startedAt = performance.now();
    this.answerOfferKey = offerKey;
    this.setState('creating');
    this.negotiationStartedAt = startedAt;
    this.answerPromise = (async () => {
      try {
        await this.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        this.iceGatheringStartedAt = performance.now();
        await this.peerConnection.setLocalDescription(answer);
        if (this.closed) throw new Error('Kết nối đã đóng trong khi tạo Answer.');
        this.answerToken = encodeSignalToken({
          version: 1,
          type: 'answer',
          sdp: this.peerConnection.localDescription.sdp,
        });
        this.onTiming('answer-creation', performance.now() - startedAt);
        this.setState('connecting');
        this.updateConnectionState();
        return this.answerToken;
      } catch (error) {
        this.answerOfferKey = null;
        this.setState('failed');
        throw error;
      } finally {
        this.answerPromise = null;
      }
    })();
    return this.answerPromise;
  }

  async acceptAnswer(answerText) {
    this.ensureOpen();
    if (this.answerPromise || this.offerPromise) throw new Error('WebRTC negotiation is already in progress.');
    const answer = parseSignal(answerText, 'answer');
    const answerKey = `${answer.type}:${answer.sdp}`;
    if (
      this.acceptedAnswerKey === answerKey
      && this.peerConnection.remoteDescription?.type === answer.type
      && this.peerConnection.remoteDescription?.sdp === answer.sdp
    ) return;
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      throw new Error('Hãy tạo Offer trước khi nhập Answer.');
    }

    try {
      await this.setRemoteDescription(answer);
      this.acceptedAnswerKey = answerKey;
      this.offerToken = null;
      this.answerToken = null;
      this.answerOfferKey = null;
      this.iceRestartInProgress = false;
      this.setState('connecting');
      this.updateConnectionState();
    } catch (error) {
      this.setState('failed');
      throw new Error('Không thể áp dụng Answer. Hãy kiểm tra mã có thuộc Offer hiện tại không.', { cause: error });
    }
  }

  send(data) {
    this.ensureOpen();
    if (!this.controlChannel || this.controlChannel.readyState !== 'open') {
      throw new Error('DataChannel điều khiển chưa kết nối.');
    }
    this.controlChannel.send(data);
  }

  sendFile(data) {
    this.ensureOpen();
    if (!this.fileChannel || this.fileChannel.readyState !== 'open') {
      throw new Error('DataChannel file chưa kết nối.');
    }
    this.fileChannel.send(data);
  }

  ensureOpen() {
    if (this.closed) throw new Error('Kết nối đã đóng. Hãy tạo phiên mới.');
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.recoveryTimer);
    this.recoveryTimer = null;
    this.pendingCandidates.length = 0;
    this.remoteDescriptionReady = false;
    this.remoteDescriptionPromise = null;
    this.offerPromise = null;
    this.answerPromise = null;
    this.remoteCandidateSignatures.clear();
    this.retiredRemoteIceUfrags.clear();
    this.controlChannel?.close();
    this.fileChannel?.close();
    this.peerConnection.close();
    this.setState('closed');
  }
}
