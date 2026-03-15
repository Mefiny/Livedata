// PCM AudioWorklet processor for capturing 16kHz mono PCM audio
// This file must be in public/ because AudioWorklet modules are loaded by URL

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // Send a chunk every ~100ms (1600 samples at 16kHz)
    this._chunkSize = 1600;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono channel, Float32Array of 128 samples

    // Convert float32 [-1,1] to int16 [-32768,32767]
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7fff);
    }

    // When enough samples accumulated, send the chunk
    if (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.splice(0, this._chunkSize);
      const pcm16 = new Int16Array(chunk);
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true; // keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);
