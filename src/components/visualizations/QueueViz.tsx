import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  data: any;
  type: 'queue' | 'deque' | 'priority_queue';
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  deletingNode?: number;
  insertingNode?: number;
  reverseSnapshot?: any[] | null;
  // Swap-based reverse animation steps from backend
  reverseSteps?: any[] | null;
  // Current swap step index being animated
  reverseSwapIndex?: number;
}

const SWAP_DURATION_MS = 1200;
const ELEMENT_DURATION_MS = 520;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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

export function QueueViz({ data, type, visited = [], found, operation, insertingNode, deletingNode, reverseSnapshot, reverseSteps, reverseSwapIndex }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const prevSizeRef = useRef<number>(0);
  const operationStartTime = useRef<number | null>(null);
  const [lastOp, setLastOp] = useState<'enqueue' | 'dequeue' | 'enqueue_front' | 'dequeue_rear' | null>(null);

  // ── Swap Reverse Animation State ──
  const swapStartTime = useRef<number | null>(null);
  const [currentSwapStep, setCurrentSwapStep] = useState<any>(null);
  const [swapProgress, setSwapProgress] = useState(0);
  const [completedSwaps, setCompletedSwaps] = useState<number[][]>([]); // Store completed [i,j] pairs
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const reverseAnimRef = useRef<number | null>(null);
  const reverseStateRef = useRef<{
    original: any[];
    buffer: any[];
    startTime: number;
    moved: number;
  } | null>(null);
  const [reverseFrame, setReverseFrame] = useState(0);

  // Bootstrap swap reverse state when reverseSteps arrive
  useEffect(() => {
    if (operation === 'reverse' && reverseSteps && reverseSteps.length > 0) {
      // Save original items for rendering
      const items = data?.items || [];
      setOriginalItems([...items]);
      setCompletedSwaps([]);
      setCurrentSwapStep(null);
      swapStartTime.current = null;
    } else if (operation !== 'reverse') {
      setOriginalItems([]);
      setCompletedSwaps([]);
      setCurrentSwapStep(null);
      swapStartTime.current = null;
    }
  }, [operation, reverseSteps]);

  // Track which swap step to animate
  useEffect(() => {
    if (operation === 'reverse' && reverseSteps && reverseSwapIndex !== undefined && reverseSwapIndex >= 0) {
      const step = reverseSteps[reverseSwapIndex];
      if (step && step.state?.subPhase === 'swap') {
        setCurrentSwapStep(step);
        swapStartTime.current = performance.now();
      }
    }
  }, [reverseSwapIndex, reverseSteps, operation]);

  useEffect(() => {
    if (operation === 'reverse' && type === 'queue' && reverseSnapshot && reverseSnapshot.length > 0) {
      if (reverseAnimRef.current !== null) {
        cancelAnimationFrame(reverseAnimRef.current);
        reverseAnimRef.current = null;
      }
      reverseStateRef.current = {
        original: [...reverseSnapshot],
        buffer: Array(reverseSnapshot.length).fill(null),
        startTime: performance.now(),
        moved: 0,
      };
    } else if (operation !== 'reverse' || type !== 'queue') {
      if (reverseAnimRef.current !== null) {
        cancelAnimationFrame(reverseAnimRef.current);
        reverseAnimRef.current = null;
      }
      reverseStateRef.current = null;
    }
  }, [operation, type, reverseSnapshot]);

  useEffect(() => {
    if (operation !== 'reverse' || type !== 'queue') return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const s = reverseStateRef.current;
      if (!s) return;
      const now = performance.now();
      const elapsed = now - s.startTime;
      const rawT = Math.min(1, elapsed / ELEMENT_DURATION_MS);
      setReverseFrame(f => f + 1);
      if (rawT >= 1) {
        if (s.original.length > 0) {
          const movedVal = s.original[0];
          s.original = s.original.slice(1);
          const targetIndex = s.buffer.length - 1 - s.moved;
          if (targetIndex >= 0) s.buffer[targetIndex] = movedVal;
          s.moved += 1;
          s.startTime = performance.now();
        }
        if (s.original.length === 0) {
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
  }, [operation, type, reverseSnapshot]);

  // Continuous animation loop
  useEffect(() => {
    let start = 0;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      setPulse(Math.sin(progress / 300) * 0.5 + 0.5);
      setTime(progress);

      // Update swap progress
      if (swapStartTime.current && operation === 'reverse') {
        const elapsed = performance.now() - swapStartTime.current;
        setSwapProgress(Math.min(1, elapsed / SWAP_DURATION_MS));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [operation]);

  useEffect(() => {
    const items = data?.items || [];
    if (items.length > prevSizeRef.current) {
      if (operation === 'insert' && insertingNode === 0) {
        setLastOp('enqueue_front');
      } else {
        setLastOp('enqueue');
      }
      operationStartTime.current = performance.now();
    } else if (items.length < prevSizeRef.current) {
      if (operation === 'delete' && deletingNode !== undefined && deletingNode > 0) {
        setLastOp('dequeue_rear');
      } else {
        setLastOp('dequeue');
      }
      operationStartTime.current = performance.now();
    } else if (items.length === 0 && prevSizeRef.current === 0) {
      setLastOp(null);
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
    if (items.length === 0 && operation !== 'reverse') return;

    // Dynamic sizing
    const padding = 60;
    const availableWidth = rect.width - padding;

    let opProgress = 1;
    let fadeOutProgress = 0;
    if (operationStartTime.current && (lastOp === 'enqueue' || lastOp === 'dequeue' || lastOp === 'enqueue_front' || lastOp === 'dequeue_rear')) {
      const elapsed = performance.now() - operationStartTime.current;
      opProgress = Math.min(1, elapsed / 400);
      if (lastOp === 'dequeue' || lastOp === 'dequeue_rear') fadeOutProgress = Math.min(1, elapsed / 400);
    }

    const drawnItems = [...items];
    if (lastOp === 'dequeue' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.unshift(0);
    } else if (lastOp === 'dequeue_rear' && fadeOutProgress < 1 && operation === 'delete') {
      drawnItems.push(0);
    }

    // Use either drawnItems or originalItems for sizing
    const renderItems = (operation === 'reverse' && originalItems.length > 0) ? originalItems : drawnItems;
    const numItems = renderItems.length;
    if (numItems === 0) return;

    const maxBoxWidth = 100;
    const minBoxWidth = 60;
    const spacingRatio = 0.15;
    const idealBoxWidth = (availableWidth + maxBoxWidth * spacingRatio) / (numItems * (1 + spacingRatio));
    const boxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, Math.floor(idealBoxWidth)));
    const spacing = Math.max(8, Math.floor(boxWidth * spacingRatio));
    const boxHeight = Math.max(55, Math.min(80, boxWidth * 0.7));

    const totalWidth = numItems * (boxWidth + spacing) - spacing;
    const startX = Math.max(padding / 2, (rect.width - totalWidth) / 2);
    const centerY = rect.height / 2;

    // Light/dark theme colors
    const cardBg = isLight ? '#ffffff' : '#0f172a';
    const cardBorder = isLight ? '#e2e8f0' : '#1e293b';
    const textColor = isLight ? '#1e293b' : '#ffffff';
    const subtleText = isLight ? '#94a3b8' : '#475569';
    const frontColor = '#06b6d4'; // cyan
    const rearColor = '#a855f7';  // purple
    const midpointColor = '#f97316'; // orange
    const swapBadgeColor = '#f97316'; // orange

    // ─── Helper: draw a card node ───
    const drawCard = (
      val: string | number,
      cx: number,
      cy: number,
      opts: {
        borderColor?: string;
        glowColor?: string;
        glowIntensity?: number;
        label?: string;
        labelColor?: string;
        labelBelow?: boolean;
        opacity?: number;
        scale?: number;
        shadow?: boolean;
      } = {}
    ) => {
      const {
        borderColor = cardBorder,
        glowColor,
        glowIntensity = 0,
        label,
        labelColor = subtleText,
        labelBelow = true,
        opacity = 1,
        scale = 1,
        shadow = isLight,
      } = opts;

      const w = boxWidth * scale;
      const h = boxHeight * scale;
      const x = cx - w / 2;
      const y = cy - h / 2;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Shadow for light theme
      if (shadow && isLight) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
      }

      // Glow for dark theme or active elements
      if (glowColor && glowIntensity > 0) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity + pulse * 8;
        ctx.shadowOffsetY = 0;
      }

      // Card background
      ctx.fillStyle = cardBg;
      roundRect(ctx, x, y, w, h, 12);
      ctx.fill();

      // Reset shadow before border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderColor === cardBorder ? 1.5 : 2.5;
      ctx.stroke();

      // Value text
      ctx.fillStyle = glowColor || textColor;
      const fontSize = Math.max(14, Math.min(28, w * 0.3));
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), cx, cy);

      // Label
      if (label) {
        ctx.fillStyle = labelColor;
        ctx.font = `bold 11px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        if (labelBelow) {
          ctx.fillText(label, cx, cy + h / 2 + 16);
        } else {
          ctx.fillText(label, cx, cy - h / 2 - 12);
        }
      }

      ctx.restore();
    };

    // ─── SWAP-BASED REVERSE MODE ───
    if (operation === 'reverse' && originalItems.length > 0 && currentSwapStep) {
      const stepState = currentSwapStep.state || {};
      const swapPair: number[] = stepState.swapPair || [];
      const swapIdx = stepState.swapIndex || 1;
      const totalSwaps = stepState.totalSwaps || 1;
      const midpointIdx = stepState.midpoint ?? -1;
      const message = currentSwapStep.message || '';

      // Build display array: apply completed swaps to original
      const displayItems = [...originalItems];
      for (const [ci, cj] of completedSwaps) {
        const tmp = displayItems[ci];
        displayItems[ci] = displayItems[cj];
        displayItems[cj] = tmp;
      }

      const [si, sj] = swapPair;
      const leftVal = displayItems[si];
      const rightVal = displayItems[sj];

      // Easing function
      const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const t = easeInOut(swapProgress);

      // Positions for each item slot
      const getSlotPos = (idx: number) => ({
        x: startX + idx * (boxWidth + spacing) + boxWidth / 2,
        y: centerY,
      });

      // Draw midpoint element first (stays in place)
      if (midpointIdx >= 0 && midpointIdx < displayItems.length) {
        const mp = getSlotPos(midpointIdx);
        const midVal = typeof displayItems[midpointIdx] === 'object' ? displayItems[midpointIdx].value : displayItems[midpointIdx];
        drawCard(midVal, mp.x, mp.y, {
          borderColor: midpointColor,
          glowColor: isLight ? undefined : midpointColor,
          glowIntensity: isLight ? 0 : 10,
          label: 'MIDPOINT',
          labelColor: midpointColor,
          labelBelow: true,
        });
      }

      // Draw non-swapping, non-midpoint elements in their positions
      for (let idx = 0; idx < displayItems.length; idx++) {
        if (swapPair.includes(idx)) continue;
        if (idx === midpointIdx) continue;

        const pos = getSlotPos(idx);
        const val = typeof displayItems[idx] === 'object' ? displayItems[idx].value : displayItems[idx];
        drawCard(val, pos.x, pos.y, {});
      }

      // Compute animated positions for swapping elements
      const leftSlot = getSlotPos(si);
      const rightSlot = getSlotPos(sj);

      // Lift offset — how far elements lift out of the row
      const liftAmount = boxHeight * 1.4;

      // Left element: starts at leftSlot, lifts up, travels to rightSlot position
      const leftStartX = leftSlot.x;
      const leftStartY = leftSlot.y;
      const leftEndX = rightSlot.x;

      // Right element: starts at rightSlot, drops down, travels to leftSlot position
      const rightStartX = rightSlot.x;
      const rightStartY = rightSlot.y;
      const rightEndX = leftSlot.x;

      // Arc paths: left goes UP then across, right goes DOWN then across
      // Phase 1 (0-0.3): lift
      // Phase 2 (0.3-0.7): cross
      // Phase 3 (0.7-1.0): land
      let leftCurX: number, leftCurY: number, rightCurX: number, rightCurY: number;

      if (t <= 0.3) {
        // Lift phase
        const liftT = t / 0.3;
        leftCurX = leftStartX;
        leftCurY = leftStartY - liftAmount * liftT;
        rightCurX = rightStartX;
        rightCurY = rightStartY + liftAmount * liftT;
      } else if (t <= 0.7) {
        // Cross phase
        const crossT = (t - 0.3) / 0.4;
        leftCurX = leftStartX + (leftEndX - leftStartX) * crossT;
        leftCurY = leftStartY - liftAmount;
        rightCurX = rightStartX + (rightEndX - rightStartX) * crossT;
        rightCurY = rightStartY + liftAmount;
      } else {
        // Land phase
        const landT = (t - 0.7) / 0.3;
        leftCurX = leftEndX;
        leftCurY = (leftStartY - liftAmount) + liftAmount * landT;
        rightCurX = rightEndX;
        rightCurY = (rightStartY + liftAmount) - liftAmount * landT;
      }

      // Draw dashed crossing lines from each element to midpoint/center
      const centerPoint = midpointIdx >= 0
        ? getSlotPos(midpointIdx)
        : { x: (leftSlot.x + rightSlot.x) / 2, y: centerY };

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isLight ? 'rgba(6, 182, 212, 0.35)' : 'rgba(6, 182, 212, 0.4)';

      // Line from left element to center
      ctx.beginPath();
      ctx.moveTo(leftCurX, leftCurY);
      ctx.lineTo(centerPoint.x, centerPoint.y);
      ctx.stroke();

      // Line from right element to center
      ctx.beginPath();
      ctx.moveTo(rightCurX, rightCurY);
      ctx.lineTo(centerPoint.x, centerPoint.y);
      ctx.stroke();

      // Also draw faint destination ghost lines
      ctx.strokeStyle = isLight ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.25)';
      ctx.beginPath();
      ctx.moveTo(leftCurX, leftCurY);
      ctx.lineTo(rightCurX, rightCurY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();

      // Draw the swapping elements
      const leftValDisplay = typeof leftVal === 'object' ? leftVal.value : leftVal;
      const rightValDisplay = typeof rightVal === 'object' ? rightVal.value : rightVal;

      drawCard(leftValDisplay, leftCurX, leftCurY, {
        borderColor: frontColor,
        glowColor: isLight ? undefined : frontColor,
        glowIntensity: isLight ? 0 : 15,
        label: si === 0 ? 'FRONT' : undefined,
        labelColor: frontColor,
        labelBelow: true,
        shadow: true,
        scale: 1.05,
      });

      drawCard(rightValDisplay, rightCurX, rightCurY, {
        borderColor: rearColor,
        glowColor: isLight ? undefined : rearColor,
        glowIntensity: isLight ? 0 : 15,
        label: sj === displayItems.length - 1 ? undefined : undefined,
        labelColor: rearColor,
        labelBelow: true,
        shadow: true,
        scale: 1.05,
      });

      // FRONT chevron label at left element
      if (si === 0) {
        ctx.save();
        ctx.fillStyle = frontColor;
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        // Draw chevron ››
        ctx.fillText('››', leftCurX, leftCurY + boxHeight * 0.55 + 16);
        ctx.restore();
      }

      // REAR chevron label at the actual rear position
      const rearPos = getSlotPos(displayItems.length - 1);
      ctx.save();
      ctx.fillStyle = rearColor;
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('REAR ‹‹', rearPos.x + boxWidth / 2 + 30, rearPos.y - boxHeight / 2 - 8);
      ctx.restore();

      // ── SWAP Badge (top-left) ──
      const badgeX = 30;
      const badgeY = 30;
      const badgeText = `SWAP ${swapIdx} OF ${totalSwaps}`;

      ctx.save();
      // Badge dot
      ctx.fillStyle = swapBadgeColor;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY + 8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Badge text
      ctx.fillStyle = swapBadgeColor;
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(badgeText, badgeX + 14, badgeY + 12);
      ctx.restore();

      // ── Status message at bottom ──
      if (message) {
        ctx.save();
        ctx.fillStyle = subtleText;
        ctx.font = `italic 13px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';

        // Wrap in quotes like the mockup
        const quotedMsg = `"${message}"`;
        ctx.fillText(quotedMsg, rect.width / 2, rect.height - 40);
        ctx.restore();
      }

      return; // Skip normal rendering
    }

    if (operation === 'reverse' && type === 'queue' && reverseSnapshot && reverseStateRef.current) {
      const s = reverseStateRef.current;
      const items = reverseSnapshot;
      const num = items.length;
      if (num === 0) return;

      const topY = centerY - boxHeight * 1.2;
      const bottomY = centerY + boxHeight * 1.2;

      const getSlotPos = (idx: number, row: 'top' | 'bottom') => ({
        x: startX + idx * (boxWidth + spacing) + boxWidth / 2,
        y: row === 'top' ? topY : bottomY,
      });

      items.forEach((item: any, idx: number) => {
        const isObject = typeof item === 'object' && item !== null;
        const value = isObject ? item.value : item;
        const isFront = idx === 0;
        const isRear = idx === items.length - 1;
        const pos = getSlotPos(idx, 'top');
        const borderColor = isFront ? frontColor : (isRear ? rearColor : cardBorder);
        const label = isFront ? 'FRONT' : (isRear ? 'REAR' : undefined);
        const labelColor = isFront ? frontColor : rearColor;
        drawCard(value, pos.x, pos.y, {
          borderColor,
          glowColor: isLight ? undefined : borderColor,
          glowIntensity: isLight ? 0 : (isFront || isRear ? 12 : 0),
          label,
          labelColor,
          labelBelow: false,
        });
      });

      for (let idx = 0; idx < s.buffer.length; idx++) {
        const bufItem = s.buffer[idx];
        const pos = getSlotPos(idx, 'bottom');
        if (bufItem !== null && bufItem !== undefined) {
          const isObject = typeof bufItem === 'object' && bufItem !== null;
          const value = isObject ? bufItem.value : bufItem;
          drawCard(value, pos.x, pos.y, {
            borderColor: rearColor,
            glowColor: isLight ? undefined : rearColor,
            glowIntensity: isLight ? 0 : 12,
            labelBelow: true,
          });
        } else {
          drawCard('', pos.x, pos.y, {
            borderColor: cardBorder,
            opacity: 0.25,
            labelBelow: true,
          });
        }
      }

      if (s.original.length > 0) {
        const movingVal = s.original[0];
        const isObject = typeof movingVal === 'object' && movingVal !== null;
        const value = isObject ? movingVal.value : movingVal;
        const source = getSlotPos(0, 'top');
        const targetIndex = s.buffer.length - 1 - s.moved;
        const target = getSlotPos(Math.max(0, targetIndex), 'bottom');
        const now = performance.now();
        const elapsed = now - s.startTime;
        const rawT = Math.min(1, elapsed / ELEMENT_DURATION_MS);
        const t = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        const cpX = (source.x + target.x) / 2;
        const cpY = Math.min(source.y, target.y) - boxHeight * 1.6;
        const pos = bezierPoint(t, source.x, source.y, cpX, cpY, target.x, target.y);

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isLight ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
        ctx.stroke();
        ctx.restore();

        drawCard(value, pos.x, pos.y, {
          borderColor: rearColor,
          glowColor: isLight ? undefined : rearColor,
          glowIntensity: isLight ? 0 : 16,
          shadow: true,
          scale: 1.05,
        });
      }

      ctx.save();
      ctx.fillStyle = subtleText;
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ORIGINAL QUEUE STATE', padding / 2, topY - boxHeight);
      ctx.fillText('REVERSED BUFFER BUILD', padding / 2, bottomY - boxHeight);
      ctx.restore();

      return;
    }

    // ────────────────────────────────────────────────
    // NORMAL MODE (push / pop / search / idle)
    // ────────────────────────────────────────────────
    drawnItems.forEach((item: any, idx: number) => {
      const isObject = typeof item === 'object' && item !== null;
      const value = isObject ? item.value : item;
      const priority = isObject ? item.priority : undefined;

      const isFront = idx === 0;
      const isRear = idx === drawnItems.length - 1;

      let x = startX + idx * (boxWidth + spacing) + boxWidth / 2;
      let y = centerY;
      let opacity = 1;
      let scale = 1;

      if (isRear && lastOp === 'enqueue' && opProgress < 1 && operation === 'insert') {
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        x += 150 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isFront && lastOp === 'enqueue_front' && opProgress < 1 && operation === 'insert') {
        const easeProgress = 1 - Math.pow(1 - opProgress, 3);
        x -= 150 * (1 - easeProgress);
        opacity = easeProgress;
      } else if (isFront && lastOp === 'dequeue' && fadeOutProgress < 1 && operation === 'delete') {
        x -= 150 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - (fadeOutProgress * 0.1);
      } else if (isRear && lastOp === 'dequeue_rear' && fadeOutProgress < 1 && operation === 'delete') {
        x += 150 * fadeOutProgress;
        opacity = 1 - fadeOutProgress;
        scale = 1 - (fadeOutProgress * 0.1);
      }

      let realIdx = idx;
      if (lastOp === 'dequeue' && operation === 'delete') realIdx = idx - 1;

      const isVisited = visited.includes(realIdx);
      const isFound = found === realIdx;

      const isAnimatingOut = (isFront && lastOp === 'dequeue' && operation === 'delete') || (isRear && lastOp === 'dequeue_rear' && operation === 'delete');
      const isAnimatingIn = (isRear && lastOp === 'enqueue' && opProgress < 1 && operation === 'insert') || (isFront && lastOp === 'enqueue_front' && opProgress < 1 && operation === 'insert');

      let borderColor = cardBorder;
      let glowColor: string | undefined;
      let glowIntensity = 0;

      if (isFound) {
        borderColor = COLORS.found;
        glowColor = COLORS.found;
        glowIntensity = 20 + pulse * 10;
      } else if (isVisited) {
        borderColor = COLORS.visited;
        glowColor = COLORS.visited;
        glowIntensity = 10;
      } else if (isAnimatingOut) {
        borderColor = '#ef4444';
        glowColor = '#ef4444';
        glowIntensity = 20;
      } else if (isAnimatingIn) {
        borderColor = COLORS.inserting;
        glowColor = COLORS.inserting;
        glowIntensity = 20;
      } else if (isFront) {
        borderColor = frontColor;
      } else if (isRear) {
        borderColor = rearColor;
      }

      const val = !isAnimatingOut && value !== undefined ? String(value) : '';
      const label = isFront ? 'FRONT' : (isRear ? 'REAR' : undefined);
      const labelColor = isFront ? frontColor : rearColor;

      drawCard(val, x, y, {
        borderColor,
        glowColor: isLight ? undefined : glowColor,
        glowIntensity: isLight ? 0 : glowIntensity,
        label,
        labelColor,
        labelBelow: type === 'queue',
        opacity,
        scale,
      });

      // Priority label for priority queue
      if (priority !== undefined && !isAnimatingOut) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const fontSize = Math.max(10, boxWidth * 0.15);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`P:${priority}`, x + boxWidth / 2 - 6, y + boxHeight / 2 - 6);
        ctx.restore();
      }
    });

  }, [data, type, visited, found, time, operation, pulse, lastOp, operationStartTime, currentSwapStep, swapProgress, completedSwaps, originalItems, reverseFrame, reverseSnapshot, isLight]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
