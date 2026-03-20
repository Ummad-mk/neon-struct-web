import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';

interface Props {
  data: any;
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  /** Pre-reverse snapshot — populated by VisualizationCanvas just before calling onReverse().
   *  This gives StackViz the original ordering to animate from, even after the backend mutates state. */
  reverseSnapshot?: number[] | null;
}

// ─── Timing constants ────────────────────────────────────────────────────────
const ELEMENT_DURATION_MS = 520; // Total ms for one element to lift → arc → drop
// Elements move SEQUENTIALLY: each element waits for the previous to finish
// before starting. So element i begins at i * ELEMENT_DURATION_MS.
// This is NOT "no delay between elements" — it IS the delay (equal to duration).

// ─── Bezier helper ───────────────────────────────────────────────────────────
function bezierPoint(
  t: number,
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number,
) {
  const u = 1 - t;
  return {
    x: u * u * p0x + 2 * u * t * p1x + t * t * p2x,
    y: u * u * p0y + 2 * u * t * p1y + t * t * p2y,
  };
}

// ─── roundRect helper ────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
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

// ─── Draw a single stack column ──────────────────────────────────────────────
function drawStack(
  ctx: CanvasRenderingContext2D,
  items: number[],
  centerX: number,
  bottomY: number,
  boxW: number,
  boxH: number,
  gap: number,
  color: string,
  label: string,
  dpr: number,
  opacity = 1,
) {
  ctx.globalAlpha = opacity;

  // Draw boxes bottom → top (index 0 = bottom)
  items.forEach((value, idx) => {
    const x = centerX - boxW / 2;
    const y = bottomY - idx * (boxH + gap);

    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = color;
    roundRect(ctx, x, y, boxW, boxH, 8);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, boxW, boxH, 8);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(20 * (dpr / dpr))}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(String(value), centerX, y + boxH / 2);
  });

  // Column label
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = COLORS.textSecondary ?? '#94a3b8';
  ctx.font = `12px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 0;
  ctx.fillText(label, centerX, bottomY + boxH + 10);

  ctx.globalAlpha = 1;
}

// ─── Draw a flying element box ────────────────────────────────────────────────
function drawFlyingBox(
  ctx: CanvasRenderingContext2D,
  value: number,
  cx: number,
  cy: number,
  boxW: number,
  boxH: number,
  glowColor: string,
) {
  const x = cx - boxW / 2;
  const y = cy - boxH / 2;

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 28;
  ctx.fillStyle = glowColor;
  roundRect(ctx, x, y, boxW, boxH, 8);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, boxW, boxH, 8);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold 20px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), cx, cy);
}

// ─── Draw the dashed arc guide between stacks ─────────────────────────────────
function drawArcGuide(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  cpY: number,
  color: string,
) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) / 2, cpY, toX, toY);
  ctx.stroke();
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────
export function StackViz({ data, visited = [], found, operation, reverseSnapshot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Normal-mode animation state ──
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);
  const prevSizeRef = useRef<number>(0);
  const operationStartTime = useRef<number | null>(null);
  const [lastOp, setLastOp] = useState<'push' | 'pop' | null>(null);

  // ── Reverse-mode animation state ──
  //    reverseSnapshot is provided by the parent (VisualizationCanvas) BEFORE the backend
  //    mutates state. This guarantees we have the original ordering regardless of re-renders.
  const reverseAnimRef = useRef<number | null>(null); // rAF handle — cancel on cleanup / re-trigger
  const reverseStateRef = useRef<{
    originalLeft: number[];   // items still to be moved (top = last index)
    reversedRight: number[];  // items that have already landed on the right stack
    startTime: number;        // when did the current element's animation start
  } | null>(null);
  const [reverseFrame, setReverseFrame] = useState(0); // incremented each rAF to force canvas redraw

  // ── Bootstrap / tear-down reverse state when snapshot appears or disappears ──
  useEffect(() => {
    if (operation === 'reverse' && reverseSnapshot && reverseSnapshot.length > 0) {
      // Cancel any prior running loop (guard against double-trigger)
      if (reverseAnimRef.current !== null) {
        cancelAnimationFrame(reverseAnimRef.current);
        reverseAnimRef.current = null;
      }
      // Bootstrap fresh state from the parent-provided snapshot
      reverseStateRef.current = {
        originalLeft: [...reverseSnapshot], // bottom-to-top; last element = stack top
        reversedRight: [],
        startTime: performance.now(),
      };
    } else if (operation !== 'reverse') {
      // operation left 'reverse' — stop animation loop
      if (reverseAnimRef.current !== null) {
        cancelAnimationFrame(reverseAnimRef.current);
        reverseAnimRef.current = null;
      }
      reverseStateRef.current = null;
    }
  }, [operation, reverseSnapshot]);

  // ── Reverse animation loop ──
  useEffect(() => {
    if (operation !== 'reverse') return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const s = reverseStateRef.current;
      if (!s) return;

      const now = performance.now();
      const elapsed = now - s.startTime;
      // progress within [0,1] for the current element
      const rawT = Math.min(1, elapsed / ELEMENT_DURATION_MS);

      setReverseFrame(f => f + 1); // trigger canvas redraw

      if (rawT >= 1) {
        // This element has fully landed — move to next
        // Pop from top of originalLeft (last index = top of stack)
        const landed = s.originalLeft[s.originalLeft.length - 1];
        s.originalLeft = s.originalLeft.slice(0, -1);
        s.reversedRight = [...s.reversedRight, landed]; // append, so first landed stays at visual bottom
        s.startTime = performance.now();

        if (s.originalLeft.length === 0) {
          // All elements transferred — animation complete; let parent's clearAnimationState kick in
          setReverseFrame(f => f + 1);
          return;
        }
      }

      reverseAnimRef.current = requestAnimationFrame(tick);
    };

    reverseAnimRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (reverseAnimRef.current !== null) {
        cancelAnimationFrame(reverseAnimRef.current);
        reverseAnimRef.current = null;
      }
    };
  }, [operation, reverseSnapshot]);

  // ── Normal-mode pulse loop ──
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

  // ── Normal-mode op detection ──
  useEffect(() => {
    const items = data?.items || [];
    if (items.length > prevSizeRef.current) {
      setLastOp('push');
      operationStartTime.current = performance.now();
    } else if (items.length < prevSizeRef.current) {
      setLastOp('pop');
      operationStartTime.current = performance.now();
    } else {
      setLastOp(null);
    }
    prevSizeRef.current = items.length;
  }, [data, operation]);

  // ── Canvas draw ──
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
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    // ────────────────────────────────────────────────
    // REVERSE MODE
    // ────────────────────────────────────────────────
    if (operation === 'reverse' && reverseStateRef.current) {
      const s = reverseStateRef.current;
      const snapshot = reverseSnapshot ?? [];
      if (snapshot.length === 0) return;

      const boxW = Math.min(200, W * 0.28);
      const boxH = 50;
      const gap = 7;
      const bottomY = H - 90;

      const leftCX = W * 0.27;
      const rightCX = W * 0.73;

      // Draw dashed arc guide between the two tops
      const leftTopY = bottomY - (s.originalLeft.length - 1) * (boxH + gap);
      const rightTopY = s.reversedRight.length === 0
        ? bottomY
        : bottomY - (s.reversedRight.length - 1) * (boxH + gap);
      const arcCpY = Math.min(leftTopY, rightTopY) - 80;
      drawArcGuide(ctx, leftCX, leftTopY, rightCX, rightTopY, arcCpY, COLORS.reversing);

      // Draw left stack — EXCLUDING the top element, which is currently flying.
      // Drawing it here too would ghost the element in two places simultaneously.
      const leftStackWithoutFlying = s.originalLeft.length > 0
        ? s.originalLeft.slice(0, -1)
        : [];
      drawStack(ctx, leftStackWithoutFlying, leftCX, bottomY, boxW, boxH, gap, COLORS.default, 'Original', dpr);

      // Draw right stack (items that have landed)
      if (s.reversedRight.length > 0) {
        drawStack(ctx, s.reversedRight, rightCX, bottomY, boxW, boxH, gap, COLORS.reversing, 'Reversed', dpr);
      }

      // Draw the currently flying element
      if (s.originalLeft.length > 0) {
        const flyingValue = s.originalLeft[s.originalLeft.length - 1];
        const now = performance.now();
        const elapsed = now - s.startTime;
        const rawT = Math.min(1, elapsed / ELEMENT_DURATION_MS);

        // Ease in-out cubic
        const t = rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        // Source: top of left stack
        const srcX = leftCX;
        const srcY = leftTopY; // aligns with top box centre
        // Destination: top of right stack (where the next box will land)
        const dstX = rightCX;
        const dstY = s.reversedRight.length === 0
          ? bottomY + boxH / 2
          : bottomY - (s.reversedRight.length) * (boxH + gap) + boxH / 2;

        // Bezier control point: high arc
        const cpX = (srcX + dstX) / 2;
        const cpY = Math.min(srcY, dstY) - 120;

        // 3-phase breakdown within t [0,1]:
        //   Phase 1 – Lift  : t in [0, 0.3] → moves from srcY upwards to cpY region
        //   Phase 2 – Arc   : t in [0.3, 0.7] → traverses the Bézier curve mid-section
        //   Phase 3 – Drop  : t in [0.7, 1.0] → descends to dstY
        // All three are handled naturally by the quadratic Bézier — the control point
        // placement above both endpoints creates the lift-arc-drop shape automatically.
        const pos = bezierPoint(t, srcX, srcY + boxH / 2, cpX, cpY, dstX, dstY);

        // Scale slightly during arc for a "weightless" 3D feel
        const scaleBoost = 1 + 0.08 * Math.sin(Math.PI * t);
        const fw = boxW * scaleBoost;
        const fh = boxH * scaleBoost;

        ctx.save();
        drawFlyingBox(ctx, flyingValue, pos.x, pos.y, fw, fh, COLORS.reversing);
        ctx.restore();

        // Draw "Top" label on original stack
        ctx.fillStyle = COLORS.textSecondary ?? '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;
        ctx.fillText('← Top', leftCX, bottomY - (s.originalLeft.length - 1) * (boxH + gap) - 22);
        ctx.globalAlpha = 1;
      }

      // Column header labels (top of canvas)
      ctx.fillStyle = COLORS.textSecondary ?? '#94a3b8';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.85;
      ctx.fillText('ORIGINAL', leftCX, 24);
      ctx.fillText('REVERSED', rightCX, 24);
      ctx.globalAlpha = 1;

      return; // Skip normal rendering
    }

    // ────────────────────────────────────────────────
    // NORMAL MODE (push / pop / search / idle)
    // ────────────────────────────────────────────────
    const items = data.items || [];
    if (items.length === 0) return;

    const boxWidth = 300;
    const boxHeight = 60;
    const spacing = 8;
    const centerX = W / 2;
    const bottomY = H - 100;

    let opProgress = 1;
    let fadeOutProgress = 0;
    if (operationStartTime.current && (lastOp === 'push' || lastOp === 'pop')) {
      const elapsed = performance.now() - operationStartTime.current;
      opProgress = Math.min(1, elapsed / 400);
      if (lastOp === 'pop') fadeOutProgress = Math.min(1, elapsed / 400);
    }

    const drawnItems = [...items];
    if (lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.push(0);
    }

    drawnItems.forEach((value: number, idx: number) => {
      const isTop = idx === drawnItems.length - 1;
      const x = centerX - boxWidth / 2;
      let y = bottomY - idx * (boxHeight + spacing);
      let opacity = 1;
      let scale = 1;

      if (isTop && lastOp === 'push' && opProgress < 1) {
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        y -= 200 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isTop && lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete') {
        y += 100 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - fadeOutProgress * 0.2;
      }

      const isVisited = visited.includes(idx);
      const isFound = found === idx;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.globalAlpha = opacity;

      let fillColor = COLORS.default;
      if (isFound) fillColor = COLORS.found;
      else if (isVisited) fillColor = COLORS.visited;
      if (isTop && lastOp === 'pop' && operation === 'delete') fillColor = '#ef4444';

      ctx.fillStyle = fillColor;

      if (isTop && lastOp === 'push' && opProgress < 1) {
        ctx.shadowColor = COLORS.inserting;
        ctx.shadowBlur = 20;
      } else if (isFound) {
        ctx.shadowColor = COLORS.found;
        ctx.shadowBlur = 20 + pulse * 10;
      } else if (isVisited) {
        ctx.shadowColor = COLORS.visited;
        ctx.shadowBlur = 10;
      }

      const w = boxWidth * scale;
      const h = boxHeight * scale;
      const xOffset = x + (boxWidth - w) / 2;
      const yOffset = y + (boxHeight - h) / 2;

      roundRect(ctx, xOffset, yOffset, w, h, 8);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      roundRect(ctx, xOffset, yOffset, w, h, 8);
      ctx.stroke();

      if (!(isTop && lastOp === 'pop' && fadeOutProgress < 1 && operation === 'delete')) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${24 * scale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), centerX, y + boxHeight / 2);
      }
      ctx.globalAlpha = 1;
    });

    // "Top of Stack" label
    const topY = bottomY - (items.length - 1) * (boxHeight + spacing);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Top of Stack', centerX, Math.min(topY, bottomY) - 30);

  }, [data, visited, found, time, operation, reverseFrame, reverseSnapshot]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
