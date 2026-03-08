import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';

interface Props {
  data: any;
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
}

export function StackViz({ data, visited = [], found, operation }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);

  const prevSizeRef = useRef<number>(0);
  const operationStartTime = useRef<number | null>(null);
  const [lastOp, setLastOp] = useState<'push' | 'pop' | null>(null);

  useEffect(() => {
    let start = 0;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      setPulse(Math.sin(progress / 300) * 0.5 + 0.5);
      setTime(progress);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const items = data?.items || [];
    if (items.length > prevSizeRef.current) {
      setLastOp('push');
      operationStartTime.current = performance.now();
    } else if (items.length < prevSizeRef.current) {
      setLastOp('pop');
      operationStartTime.current = performance.now();
    } else if (items.length === 0 && prevSizeRef.current === 0) {
      if (operation === 'reverse') {
        setLastOp('reverse' as any);
        operationStartTime.current = performance.now();
      } else {
        setLastOp(null);
      }
    }
    prevSizeRef.current = items.length;
  }, [data, operation]);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp text
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    // ----------------------------------------

    ctx.clearRect(0, 0, rect.width, rect.height);

    const items = data.items || [];
    if (items.length === 0) return;

    const boxWidth = 300;
    const boxHeight = 60;
    const spacing = 8;
    const centerX = rect.width / 2;
    const bottomY = rect.height - 100;

    let opProgress = 1;
    let fadeOutProgress = 0;
    if (operationStartTime.current && (lastOp === 'push' || lastOp === 'pop' || lastOp === ('reverse' as any))) {
      const elapsed = performance.now() - operationStartTime.current;
      opProgress = Math.min(1, elapsed / 400); // 400ms duration
      if (lastOp === 'pop') fadeOutProgress = Math.min(1, elapsed / 400);
    }

    // Force draw the "popping" element if we are deleting and it's missing from items array
    const drawnItems = [...items];
    if (lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.push(0); // placeholder value just for the animation visual
    }

    drawnItems.forEach((value: number, idx: number) => {
      const isTop = idx === drawnItems.length - 1;

      const x = centerX - boxWidth / 2;
      let y = bottomY - idx * (boxHeight + spacing);
      let opacity = 1;
      let scale = 1;

      if (isTop && lastOp === 'push' && opProgress < 1) {
        // Drop in from top
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        y -= 200 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isTop && lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete') {
        // Drop out the bottom and fade out
        y += 100 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - (fadeOutProgress * 0.2); // slight shrink
      }

      const isVisited = visited.includes(idx);
      const isFound = found === idx;

      // Shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      ctx.globalAlpha = opacity;

      // Determine base color mapping
      let fillColor = COLORS.default;
      if (isFound) fillColor = COLORS.found;
      else if (isVisited) fillColor = COLORS.visited;

      if (isTop && lastOp === 'pop' && operation === 'delete') fillColor = '#ef4444'; // Red for popping

      ctx.fillStyle = fillColor;

      // Pulse processing (glows)
      if (isTop && lastOp === 'push' && opProgress < 1) {
        ctx.shadowColor = COLORS.inserting;
        ctx.shadowBlur = 20;
      } else if (lastOp === ('reverse' as any) && opProgress < 1) {
        // Entire stack glows during reverse
        ctx.shadowColor = COLORS.reversing;
        ctx.shadowBlur = 20 * (1 - opProgress) + pulse * 10;
        fillColor = COLORS.reversing;
        ctx.fillStyle = fillColor;
      } else if (isFound) {
        ctx.shadowColor = COLORS.found;
        ctx.shadowBlur = 20 + pulse * 10;
      } else if (isVisited) {
        ctx.shadowColor = COLORS.visited;
        ctx.shadowBlur = 10;
      }

      // Rounded Rect with scale centering
      const w = boxWidth * scale;
      const h = boxHeight * scale;
      const xOffset = x + (boxWidth - w) / 2;
      const yOffset = y + (boxHeight - h) / 2;

      roundRect(ctx, xOffset, yOffset, w, h, 8);
      ctx.fill();

      // Border
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      roundRect(ctx, xOffset, yOffset, w, h, 8);
      ctx.stroke();

      // Text (hide only during active pop animation)
      if (!(isTop && lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete')) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${24 * scale}px Inter, sans-serif`; // Larger Font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), centerX, y + boxHeight / 2);
      }
      ctx.globalAlpha = 1;
    });

    // Label
    const topY = bottomY - (items.length - 1) * (boxHeight + spacing);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Top of Stack', centerX, Math.min(topY, bottomY) - 30);

  }, [data, visited, found, time, operation]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// Helper for rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}