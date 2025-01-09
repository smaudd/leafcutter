// services/audioService.js

class AudioService {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.currentSource = null;
    this.isPlaying = false;
    this.onPlaybackEndCallback = null;
  }

  // Play an audio buffer
  play(buffer) {
    if (this.isPlaying) this.stop();

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.isPlaying = false;
      this.currentSource = null;
      if (this.onPlaybackEndCallback) this.onPlaybackEndCallback();
    };

    source.start(0);
    this.isPlaying = true;
    this.currentSource = source;
  }

  // Stop current playback
  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
      this.isPlaying = false;
    }
  }

  // Set a callback for when playback ends
  onPlaybackEnd(callback) {
    this.onPlaybackEndCallback = callback;
  }
}

export const audioService = new AudioService();
