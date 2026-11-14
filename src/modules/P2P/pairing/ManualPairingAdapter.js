export default class ManualPairingAdapter {
  constructor(core) {
    this.core = core;
  }

  createOffer() {
    return this.core.createOffer();
  }

  createAnswer(offer) {
    return this.core.createAnswer(offer);
  }

  acceptAnswer(answer) {
    return this.core.acceptAnswer(answer);
  }

  addIceCandidate(candidate, usernameFragment) {
    return this.core.addIceCandidate(candidate, usernameFragment);
  }

  close() {
    this.core.close();
  }
}
