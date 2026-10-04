import { ICE_SERVERS } from '../config/iceServers.js';

const MAX_SIGNAL_SIZE = 1024 * 1024;
const ICE_GATHERING_TIMEOUT_MS = 30000;
const LOW_WATERMARK = 128 * 1024;

function parseSignal(signal, expectedType) {
  if (typeof signal !== 'string' || signal.length > MAX_SIGNAL_SIZE) {
    throw new Error('Mã kết nối không hợp lệ hoặc vượt quá giới hạn kích thước.');
  }

  let description;
  try {
    description = JSON.parse(signal);
  } catch {
    throw new Error('Không đọc được mã kết nối. Hãy dán nguyên văn Offer hoặc Answer.');
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
  constructor({ onStateChange = () => {}, onMessage = () => {}, iceServers = ICE_SERVERS } = {}) {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt này không hỗ trợ WebRTC.');
    }

    this.onStateChange = onStateChange;
    this.messageListeners = new Set([onMessage]);
    this.state = 'idle';
    this.closed = false;
    this.controlChannel = null;
    this.fileChannel = null;
    this.peerConnection = new RTCPeerConnection({ iceServers });
    this.peerConnection.addEventListener('connectionstatechange', () => this.updateConnectionState());
    this.peerConnection.addEventListener('iceconnectionstatechange', () => this.updateConnectionState());
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

  updateConnectionState() {
    if (this.closed) return;
    const { connectionState, iceConnectionState } = this.peerConnection;
    if (connectionState === 'connected' || iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      if (this.controlChannel?.readyState === 'open' || this.fileChannel?.readyState === 'open') this.setState('connected');
      else this.setState('connecting');
    } else if (connectionState === 'failed' || iceConnectionState === 'failed') {
      this.setState('failed');
    } else if (connectionState === 'disconnected' || iceConnectionState === 'disconnected') {
      this.setState('disconnected');
    } else if (connectionState === 'connecting' || iceConnectionState === 'checking') {
      this.setState('connecting');
    }
  }

  createDataChannels() {
    if (!this.controlChannel) {
      this.attachChannel(this.peerConnection.createDataChannel('windhub-control', { ordered: true, maxRetransmits: 0 }));
    }
    if (!this.fileChannel) {
      this.attachChannel(this.peerConnection.createDataChannel('windhub-file', { ordered: true, maxRetransmits: 0 }));
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
      if (!this.closed) this.setState('connected');
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

  async waitForIceGathering() {
    if (this.peerConnection.iceGatheringState === 'complete') return;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Thu thập ICE quá thời gian. Hãy kiểm tra kết nối mạng và thử lại.'));
      }, ICE_GATHERING_TIMEOUT_MS);

      const onGatheringStateChange = () => {
        if (this.peerConnection.iceGatheringState === 'complete') {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        this.peerConnection.removeEventListener('icegatheringstatechange', onGatheringStateChange);
      };

      this.peerConnection.addEventListener('icegatheringstatechange', onGatheringStateChange);
      onGatheringStateChange();
    });
  }

  async createOffer() {
    this.ensureOpen();
    this.setState('creating');
    try {
      this.createDataChannels();
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      await this.waitForIceGathering();
      this.setState('waiting');
      return JSON.stringify({ version: 1, type: 'offer', sdp: this.peerConnection.localDescription.sdp });
    } catch (error) {
      this.setState('failed');
      throw error;
    }
  }

  async createAnswer(offerText) {
    this.ensureOpen();
    const offer = parseSignal(offerText, 'offer');
    this.setState('creating');
    try {
      await this.peerConnection.setRemoteDescription(offer);
      this.createDataChannels();
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      await this.waitForIceGathering();
      this.setState('connecting');
      return JSON.stringify({ version: 1, type: 'answer', sdp: this.peerConnection.localDescription.sdp });
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
      await this.peerConnection.setRemoteDescription(answer);
      this.setState('connecting');
    } catch (error) {
      this.setState('failed');
      throw new Error('Không thể áp dụng Answer. Hãy kiểm tra mã có thuộc Offer hiện tại không.');
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
    this.controlChannel?.close();
    this.fileChannel?.close();
    this.peerConnection.close();
    this.setState('closed');
  }
}
