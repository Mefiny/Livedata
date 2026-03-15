import { useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export function useAudioSession(wsRef: React.RefObject<WebSocket | null>) {
  const captureContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const { setIsMicActive, setAgentStatus } = useAppStore();

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
      captureContextRef.current = audioCtx;

      await audioCtx.audioWorklet.addModule('/pcm-processor.js');

      const source = audioCtx.createMediaStreamSource(stream);

      // Create AnalyserNode for waveform visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent) => {
        const pcmBuffer: ArrayBuffer = event.data;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const bytes = new Uint8Array(pcmBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            data: base64,
          }));
        }
      };

      analyser.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      setIsMicActive(true);
      setAgentStatus('listening');
    } catch (err) {
      console.error('Failed to start audio capture:', err);
      setIsMicActive(false);
    }
  }, [wsRef, setIsMicActive, setAgentStatus]);

  const stopCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    analyserRef.current = null;

    captureContextRef.current?.close();
    captureContextRef.current = null;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio_stop' }));
    }

    setIsMicActive(false);
    setAgentStatus('idle');
  }, [wsRef, setIsMicActive, setAgentStatus]);

  const playAudioChunk = useCallback((base64Pcm: string) => {
    const binaryString = atob(base64Pcm);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }

    const ctx = playbackContextRef.current;
    const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    setAgentStatus('speaking');

    source.onended = () => {
      if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
        setAgentStatus('listening');
      }
    };
  }, [setAgentStatus]);

  const stopPlayback = useCallback(() => {
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    nextPlayTimeRef.current = 0;
  }, []);

  return { startCapture, stopCapture, playAudioChunk, stopPlayback, analyserRef };
}
