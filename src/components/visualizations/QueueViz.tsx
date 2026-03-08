import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';

interface Props {
  data: any;
  type: 'queue' | 'deque' | 'priority_queue';
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  deletingNode?: number; // specific index deleted (0 for front, size-1 for rear in deque)
  insertingNode?: number; // specific index inserted (0 for front, size-1 for rear in deque)
}

export function QueueViz({ data, type, visited = [], found, operation, insertingNode, deletingNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);

  const prevSizeRef = useRef<number>(0);
  const operationStartTime = useRef<number | null>(null);
  const [lastOp, setLastOp] = useState<'enqueue' | 'dequeue' | 'enqueue_front' | 'dequeue_rear' | null>(null);

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
      // It's an enqueue - check if it's insertingNode === 0 (enqueue_front)
      if (operation === 'insert' && insertingNode === 0) {
        setLastOp('enqueue_front');
      } else {
        setLastOp('enqueue'); // default rear
      }
      operationStartTime.current = performance.now();
    } else if (items.length < prevSizeRef.current) {
      // It's a dequeue - check if it's deletingNode > 0 (dequeue_rear)
      if (operation === 'delete' && deletingNode !== undefined && deletingNode > 0) {
        setLastOp('dequeue_rear');
      } else {
        setLastOp('dequeue'); // default front
      }
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
  }, [data, operation, insertingNode, deletingNode]);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const items = data.items || [];
    if (items.length === 0) return;

    // Dynamic sizing — scale boxes to always fit within canvas
    const padding = 60; // left + right padding
    const availableWidth = rect.width - padding;

    let opProgress = 1;
    let fadeOutProgress = 0;
    if (operationStartTime.current && (lastOp === 'enqueue' || lastOp === 'dequeue' || lastOp === 'enqueue_front' || lastOp === 'dequeue_rear' || lastOp === ('reverse' as any))) {
      const elapsed = performance.now() - operationStartTime.current;
      opProgress = Math.min(1, elapsed / 400); // 400ms duration
      if (lastOp === 'dequeue' || lastOp === 'dequeue_rear') fadeOutProgress = Math.min(1, elapsed / 400);
    }

    // Force draw the "dequeuing" element if we are deleting and it's missing from items array
    const drawnItems = [...items];
    if (lastOp === 'dequeue' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.unshift(0); // placeholder value just for the animation visual at the front
    } else if (lastOp === 'dequeue_rear' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.push(0); // placeholder value just for the animation visual at the rear
    }

    const numItems = drawnItems.length;
    const maxBoxWidth = 160;
    const minBoxWidth = 60;
    const spacingRatio = 0.1; // spacing = 10% of boxWidth
    // Solve: numItems * (boxWidth + spacing) - spacing <= availableWidth
    // numItems * boxWidth * (1 + spacingRatio) - boxWidth * spacingRatio <= availableWidth
    const idealBoxWidth = (availableWidth + maxBoxWidth * spacingRatio) / (numItems * (1 + spacingRatio));
    const boxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, Math.floor(idealBoxWidth)));
    const spacing = Math.max(4, Math.floor(boxWidth * spacingRatio));
    const boxHeight = Math.max(50, Math.min(80, boxWidth / 2));

    // Center the Queue horizontally based on the true rendered size
    const totalWidth = numItems * (boxWidth + spacing) - spacing;
    const startX = Math.max(padding / 2, (rect.width - totalWidth) / 2);
    const centerY = rect.height / 2;

    drawnItems.forEach((item: any, idx: number) => {
      const isObject = typeof item === 'object' && item !== null;
      const value = isObject ? item.value : item;
      const priority = isObject ? item.priority : undefined;

      const isFront = idx === 0;
      const isRear = idx === drawnItems.length - 1;

      let x = startX + idx * (boxWidth + spacing);
      let y = centerY - boxHeight / 2;
      let opacity = 1;
      let scale = 1;

      if (isRear && lastOp === 'enqueue' && opProgress < 1 && operation === 'insert') {
        // Slide in from right (rear)
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        x += 150 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isFront && lastOp === 'enqueue_front' && opProgress < 1 && operation === 'insert') {
        // Slide in from left (front)
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        x -= 150 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isFront && lastOp === 'dequeue' && fadeOutProgress < 1 && operation === 'delete') {
        // Slide out to left (front) and fade
        x -= 150 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - (fadeOutProgress * 0.2); // slight shrink
      } else if (isRear && lastOp === 'dequeue_rear' && fadeOutProgress < 1 && operation === 'delete') {
        // Slide out to right (rear) and fade
        x += 150 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - (fadeOutProgress * 0.2); // slight shrink
      }

      // We maintain the original visited mapping which refers to the real datastructure, so shift logic needed
      let realIdx = idx;
      if (lastOp === 'dequeue' && operation === 'delete') realIdx = idx - 1;
      // Note: for dequeue_rear, idx is the same since it's at the end of the array

      const isVisited = visited.includes(realIdx);
      const isFound = found === realIdx;

      const isAnimatingOut = (isFront && lastOp === 'dequeue' && operation === 'delete') || (isRear && lastOp === 'dequeue_rear' && operation === 'delete');
      const isAnimatingIn = (isRear && lastOp === 'enqueue' && opProgress < 1 && operation === 'insert') || (isFront && lastOp === 'enqueue_front' && opProgress < 1 && operation === 'insert');

      ctx.globalAlpha = opacity;

      // Determine base color mapping
      let fillColor = COLORS.default;
      if (isFound) fillColor = COLORS.found;
      else if (isVisited) fillColor = COLORS.visited;

      const isReversing = lastOp === ('reverse' as any) && opProgress < 1;

      if (isAnimatingOut) fillColor = '#ef4444'; // Red for dequeuing
      if (isAnimatingIn) fillColor = COLORS.inserting; // Cyan for enqueuing
      if (isReversing) fillColor = COLORS.reversing;

      ctx.fillStyle = fillColor;

      // Cyberpunk Glow
      if (isAnimatingOut) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
      } else if (isAnimatingIn) {
        ctx.shadowColor = COLORS.inserting;
        ctx.shadowBlur = 20;
      } else if (isReversing) {
        ctx.shadowColor = COLORS.reversing;
        ctx.shadowBlur = 20 * (1 - opProgress) + pulse * 10;
      } else if (isFound) {
        ctx.shadowColor = COLORS.found;
        ctx.shadowBlur = 20 + pulse * 10;
      } else if (isVisited) {
        ctx.shadowColor = COLORS.visited;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = 'transparent';
      }

      const w = boxWidth * scale;
      const h = boxHeight * scale;
      const xOffset = x + (boxWidth - w) / 2;
      const yOffset = y + (boxHeight - h) / 2;

      ctx.fillRect(xOffset, yOffset, w, h);

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(xOffset, yOffset, w, h);

      // Text (hide if dummy dequeue placeholder while animation active) 
      if (!isAnimatingOut && value !== undefined) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        const fontSize = Math.max(12, Math.min(24, boxWidth * 0.15)) * scale;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(value), x + boxWidth / 2, y + boxHeight / 2);

        if (priority !== undefined) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = `bold ${Math.max(10, fontSize * 0.6)}px Inter, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`P:${priority}`, x + boxWidth - 6, y + boxHeight - 6);
        }
      }
      ctx.globalAlpha = 1;
    });

    // Labels
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';

    const firstX = startX + boxWidth / 2;
    const lastX = startX + (drawnItems.length - 1) * (boxWidth + spacing) + boxWidth / 2;

    if (type === 'queue') {
      ctx.fillText('Front', firstX, centerY - boxHeight / 2 - 20);
      ctx.fillText('Rear', lastX, centerY + boxHeight / 2 + 30);
    } else {
      ctx.fillText('Front', firstX, centerY - boxHeight / 2 - 20);
      ctx.fillText('Rear', lastX, centerY - boxHeight / 2 - 20);
    }
  }, [data, type, visited, found, time, operation, pulse, lastOp, operationStartTime]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}