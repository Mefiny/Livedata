import { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
}

export function AudioVisualizer({ analyserNode }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!analyserNode) {
        // Static flat line when no analyser
        ctx.strokeStyle = '#1E3A2E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.strokeStyle = '#00D67E';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00D67E';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(draw);
    };

    // Set canvas resolution to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    // Reset logical dimensions for drawing
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]"
      style={{ height: '40px' }}
    />
  );
}
