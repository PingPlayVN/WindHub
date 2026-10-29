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
    iceServers = ICE_SERVERS,
  } = {}) {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt này không hỗ trợ WebRTC.');
    }

    this.onStateChange = onStateChange;
    this.onSignal = onSignal;
    this.onError = onError;
    this.onTiming = onTiming;
    this.messageListeners = new Set([onMessage]);
    this.state = 'idle';
    this.closed = false;
    this.remoteDescriptionReady = false;
    this.pendingCandidates = [];
    this.candidateQueue = Promise.resolve();
    this.remoteCandidateSignatures = new Set();
    this.firstCandidateReported = false;
    this.endOfCandidatesSent = false;
    this.recoveryTimer = null;
    this.iceRestartRetries = 0;
    this.maxIceRestartRetries = 3;
    this.controlChannel = null;
    this.fileChannel = null;
    this.peerConnection = new RTCPeerConnection({ iceServers });
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (this.closed) return;
      if (!event.candidate) {
        if (this.endOfCandidatesSent) return;
        this.endOfCandidatesSent = true;
        try {
          this.onSignal(null);
        } catch (error) {
          if (!this.closed) this.onError(error);
        }
        return;
      }
      if (!this.firstCandidateReported) {
        this.firstCandidateReported = true;
        this.onTiming('First ICE candidate');
      }
      try {
        this.onSignal(event.candidate.toJSON());
      } catch (error) {
        if (!this.closed) this.onError(error);
      }
    });
    this.peerConnection.addEventListener('connectionstatechange', () => {
      if (this.peerConnection.connectionState === 'connecting' || this.peerConnection.connectionState === 'connected') {
        this.onTiming(`connectionState = ${this.peerConnection.connectionState}`);
      }
      this.updateConnectionState();
    });
    this.peerConnection.addEventListener('iceconnectionstatechange', () => {
      this.updateConnectionState();
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

  getCandidateSignature(candidate) {
    if (candidate === null) return 'end-of-candidates';
    if (!candidate || typeof candidate !== 'object') return JSON.stringify(candidate);
    const candidateText = typeof candidate.candidate === 'string' ? candidate.candidate : '';
    return `${candidateText}|${candidate.sdpMid ?? ''}|${candidate.sdpMLineIndex ?? ''}|${candidate.usernameFragment ?? ''}`;
  }

  scheduleRecovery() {
    if (this.closed || this.recoveryTimer) return;
    const { connectionState, iceConnectionState } = this.peerConnection;
    if (this.controlChannel?.readyState === 'open' && this.fileChannel?.readyState === 'open') return;
    if (connectionState === 'connected' || iceConnectionState === 'connected' || iceConnectionState === 'completed') return;
    const delayMs = Math.min(500 + this.iceRestartRetries * 500, 4000);
    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = null;
      if (this.closed) return;
      const nextConnectionState = this.peerConnection.connectionState;
      const nextIceState = this.peerConnection.iceConnectionState;
      if (nextConnectionState === 'connected' || nextConnectionState === 'completed' || nextIceState === 'connected' || nextIceState === 'completed') return;
      if (typeof this.peerConnection.restartIce === 'function' && this.iceRestartRetries < this.maxIceRestartRetries) {
        this.iceRestartRetries += 1;
        try {
          this.peerConnection.restartIce();
        } catch (error) {
          if (!this.closed) this.onError(error);
        }
      }
    }, delayMs);
  }

  updateConnectionState() {
    if (this.closed) return;
    const { connectionState, iceConnectionState } = this.peerConnection;
    if (this.controlChannel?.readyState === 'open' && this.fileChannel?.readyState === 'open') {
      this.iceRestartRetries = 0;
      this.setState('connected');
      return;
    }
    if (connectionState === 'connected' || iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      this.iceRestartRetries = 0;
      this.setState('connecting');
    } else if (connectionState === 'failed' || iceConnectionState === 'failed') {
      this.setState('failed');
      this.scheduleRecovery();
    } else if (connectionState === 'disconnected' || iceConnectionState === 'disconnected') {
      this.setState('disconnected');
      this.scheduleRecovery();
    } else if (connectionState === 'connecting' || iceConnectionState === 'checking') {
      this.setState('connecting');
    }
  }

  addIceCandidate(candidate) {
    if (candidate === undefined || this.closed) return Promise.resolve();
    if (this.remoteDescriptionReady) {
      const signature = this.getCandidateSignature(candidate);
      if (candidate !== null && this.remoteCandidateSignatures.has(signature)) {
        return Promise.resolve();
      }
      if (candidate !== null) {
        this.remoteCandidateSignatures.add(signature);
      }
    }
    if (!this.remoteDescriptionReady) {
      this.pendingCandidates.push(candidate);
      return Promise.resolve();
    }
    return this.enqueueIceCandidate(candidate);
  }

  enqueueIceCandidate(candidate) {
    const operation = this.candidateQueue.then(() => {
      if (this.closed) return undefined;
      try {
        return this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        if (!this.closed) this.onError(error);
        return undefined;
      }
    });
    this.candidateQueue = operation.catch((error) => {
      if (!this.closed) this.onError(error);
    });
    return this.candidateQueue;
  }

  async setRemoteDescription(description) {
    await this.peerConnection.setRemoteDescription(description);
    if (this.closed) return;
    this.remoteDescriptionReady = true;
    const queuedCandidates = this.pendingCandidates.splice(0);
    for (const candidate of queuedCandidates) {
      if (candidate === undefined || candidate === null) {
        this.enqueueIceCandidate(candidate);
        continue;
      }
      this.addIceCandidate(candidate);
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
    this.onTiming('createOffer start');
    this.setState('creating');
    try {
      this.createDataChannels();
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.setState('waiting');
      return encodeSignalToken({
        version: 1,
        type: 'offer',
        sdp: this.peerConnection.localDescription.sdp,
      });
    } catch (error) {
      this.setState('failed');
      throw error;
    }
  }

  async createAnswer(offerText) {
    this.ensureOpen();
    this.onTiming('createAnswer start');
    const offer = parseSignal(offerText, 'offer');
    this.setState('creating');
    try {
      await this.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.setState('connecting');
      return encodeSignalToken({
        version: 1,
        type: 'answer',
        sdp: this.peerConnection.localDescription.sdp,
      });
    } catch (error) {
      this.setState('failed');
      throw error;
    }
  }

  async acceptAnswer(answerText) {
    this.ensureOpen();
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      throw new Error('Hãy tạo Offer trước khi nhập Answer.');
    }

    const answer = parseSignal(answerText, 'answer');
    try {
      await this.setRemoteDescription(answer);
      this.setState('connecting');
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
    this.remoteCandidateSignatures.clear();
    this.controlChannel?.close();
    this.fileChannel?.close();
    this.peerConnection.close();
    this.setState('closed');
  }
}
