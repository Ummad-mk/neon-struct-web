import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';

// Enhanced color scheme for different operations - extends base COLORS
const ENHANCED_COLORS: { [key: string]: string } = {
  ...COLORS,
  // Operation-specific colors
  current: '#f9e2af',        // Bright yellow
  deleting: '#f38ba8',       // Bright red - hard glow
  inserting: '#06b6d4',      // Cyan - being inserted
  reversing: '#ec4899',      // Pink - being reversed
  swapping: '#a855f7',       // Purple - swapping nodes
  head: '#f9e2af',           // Yellow
  tail: '#14b8a6',           // Teal
  search: '#a6e3a1',         // Pink -> Green
  traverse: '#8b5cf6',       // Purple

  // Connection colors
  connection: '#64748b',     // Gray
  activeConnection: '#3b82f6', // Blue
  reversingConnection: '#ec4899', // Pink

  // Cursor Scan states
  visiting: '#f9e2af',       // Bright yellow - examining
  visitedTrail: '#7a6a3a',   // Dim amber - visited trail
};

// Doubly linked list colors
const DLL_COLORS = {
  nodeBackground: '#1a0f0a',   // Very dark brown
  nodeBorder: '#ea580c',       // Orange border
  nodeBorderDefault: '#4a2c1a', // Subtle brown border (idle)
  nodeText: '#ffffff',
  nullBorder: '#4a3728',       // Dashed null border
  nullText: '#6b5744',         // Dim null text
  nextArrow: '#22d3ee',        // Cyan - NEXT
  prevArrow: '#a855f7',        // Purple - PREV
  headBadge: '#06b6d4',        // Cyan badge
  tailBadge: '#a855f7',        // Purple badge
  swappingGlow: '#ea580c',     // Orange glow
  swappingLabel: '#22d3ee',    // Cyan label
};

interface Props {
  data: any;
  type: 'singly' | 'doubly';
  visited?: number[];
  found?: number;
  highlight?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  reversingNodes?: number[]; // Nodes currently being reversed
  deletingNode?: number;     // Node being deleted
  deletePhase?: 'highlight' | 'fadeOut'; // Animation phase for deletion
  insertingNode?: number;    // Node being inserted
  swappingNodes?: number[];  // Nodes being swapped
}

export function LinkedListViz({
  data,
  type,
  visited = [],
  found,
  highlight,
  operation = null,
  reversingNodes = [],
  deletingNode,
  deletePhase,
  insertingNode,
  swappingNodes = []
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);
  const deleteStartTime = useRef<number | null>(null);
  const insertStartTime = useRef<number | null>(null);
  const stepStartTime = useRef<number | null>(null);
  const prevPointersCurr = useRef<number | null>(null);

  useEffect(() => {
    if (deletingNode !== undefined && deletePhase === 'fadeOut') {
      if (!deleteStartTime.current) deleteStartTime.current = performance.now();
    } else {
      deleteStartTime.current = null;
    }
  }, [deletingNode, deletePhase]);

  useEffect(() => {
    if (insertingNode !== undefined) {
      if (!insertStartTime.current) insertStartTime.current = performance.now();
    } else {
      insertStartTime.current = null;
    }
  }, [insertingNode]);

  // Continuous animation for pulse effects
  useEffect(() => {
    let start = 0;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      setPulse(Math.sin(progress / 300) * 0.5 + 0.5); // Oscillate between 0 and 1
      setTime(progress);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = data.nodes || [];
    const pointers = data.pointers || {};
    const subPhase = data.subPhase || '';
    const reversedConns = data.reversedConns || data.reversed_conns || [];
    const node0Flipped = data.node0Flipped || data.node0_flipped || false;
    const headPos = data.headPos !== undefined ? data.headPos : (data.head_pos !== undefined ? data.head_pos : 0);

    if (nodes.length === 0) return;

    // Track step changes for arrow animation
    if (operation === 'reverse' && subPhase === 'flip' && pointers.curr !== prevPointersCurr.current) {
      stepStartTime.current = performance.now();
      prevPointersCurr.current = pointers.curr;
    } else if (subPhase !== 'flip') {
      prevPointersCurr.current = null;
    }

    // Dynamic step progress
    let stepProgress = 1;
    if (operation === 'reverse' && subPhase === 'flip' && stepStartTime.current) {
      const elapsed = performance.now() - stepStartTime.current;
      stepProgress = Math.min(1, Math.max(0, elapsed / 800));
    }

    // Calculate required dimensions — use rectangles for doubly, circles for singly
    const isDoubly = type === 'doubly';
    const nodeRadius = isDoubly ? 0 : 45; // only used for singly
    const nodeWidth = isDoubly ? 90 : 0;
    const nodeHeight = isDoubly ? 90 : 0;
    const nodeCornerRadius = isDoubly ? 14 : 0;
    const nullWidth = isDoubly ? 65 : 0;
    const nullHeight = isDoubly ? 65 : 0;
    const spacing = isDoubly ? 160 : 180;
    const nullSpacing = isDoubly ? 100 : 0;
    const startX = isDoubly ? (nullWidth + nullSpacing + 40) : 120;
    const endPadding = isDoubly ? (nullWidth + nullSpacing + 80) : 120;

    const totalWidth = startX + (nodes.length - 1) * spacing + (isDoubly ? nodeWidth : nodeRadius * 2) + endPadding;
    const totalHeight = 400;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    const centerY = totalHeight / 2;

    // ═══════════════════════════════════════════════
    // DOUBLY LINKED LIST RENDERING
    // ═══════════════════════════════════════════════
    if (isDoubly) {
      // Helper: draw a rounded rectangle
      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
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
      };

      // Helper: draw arrow head
      const drawArrowHead = (tipX: number, tipY: number, angle: number, size: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
          tipX - size * Math.cos(angle - Math.PI / 6),
          tipY - size * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          tipX - size * Math.cos(angle + Math.PI / 6),
          tipY - size * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      };

      // Helper: draw a double arrow (NEXT + PREV) between two node centers
      const drawDoubleArrow = (x1: number, x2: number, y: number, animated: boolean = false) => {
        const gap = 8; // vertical gap between the two arrows
        const arrowPadding = nodeWidth / 2 + 12;
        const fromX = x1 + arrowPadding;
        const toX = x2 - arrowPadding;
        const midX = (fromX + toX) / 2;

        if (fromX >= toX) return; // Too close

        // NEXT arrow (cyan, top, pointing right →)
        const nextY = y - gap;
        ctx.strokeStyle = DLL_COLORS.nextArrow;
        ctx.lineWidth = animated ? 3 + pulse * 1 : 2.5;
        if (animated) {
          ctx.shadowColor = DLL_COLORS.nextArrow;
          ctx.shadowBlur = 6 + pulse * 4;
        }
        ctx.beginPath();
        ctx.moveTo(fromX, nextY);
        ctx.lineTo(toX, nextY);
        ctx.stroke();
        drawArrowHead(toX, nextY, 0, 8, DLL_COLORS.nextArrow);
        ctx.shadowBlur = 0;

        // "NEXT" label
        ctx.fillStyle = DLL_COLORS.nextArrow;
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('NEXT', midX, nextY - 4);

        // Double-chevron on the NEXT arrow (>>)
        const chevronX = midX + 12;
        ctx.fillStyle = DLL_COLORS.nextArrow;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⇒', chevronX, nextY);

        // PREV arrow (purple, bottom, pointing left ←)
        const prevY = y + gap;
        ctx.strokeStyle = DLL_COLORS.prevArrow;
        ctx.lineWidth = animated ? 3 + pulse * 1 : 2.5;
        if (animated) {
          ctx.shadowColor = DLL_COLORS.prevArrow;
          ctx.shadowBlur = 6 + pulse * 4;
        }
        ctx.beginPath();
        ctx.moveTo(toX, prevY);
        ctx.lineTo(fromX, prevY);
        ctx.stroke();
        drawArrowHead(fromX, prevY, Math.PI, 8, DLL_COLORS.prevArrow);
        ctx.shadowBlur = 0;

        // "PREV" label
        ctx.fillStyle = DLL_COLORS.prevArrow;
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('PREV', midX, prevY + 4);

        // Double-chevron on the PREV arrow (<<)
        ctx.fillStyle = DLL_COLORS.prevArrow;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⇐', midX - 12, prevY);
      };

      // Helper: draw a NULL sentinel node
      const drawNullNode = (cx: number, cy: number) => {
        const x = cx - nullWidth / 2;
        const y = cy - nullHeight / 2;

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = DLL_COLORS.nullBorder;
        ctx.lineWidth = 1.5;
        drawRoundedRect(x, y, nullWidth, nullHeight, 10);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = DLL_COLORS.nullText;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL', cx, cy);
        ctx.restore();
      };

      // Draw NULL sentinels at both ends
      const firstNodeX = startX;
      const lastNodeX = startX + (nodes.length - 1) * spacing;
      const leftNullX = firstNodeX - nullSpacing;
      const rightNullX = lastNodeX + nullSpacing + nodeWidth / 2;

      drawNullNode(leftNullX, centerY);
      drawNullNode(rightNullX, centerY);

      // Draw connections (double arrows) between nodes
      for (let idx = 0; idx < nodes.length - 1; idx++) {
        const x1 = startX + idx * spacing;
        const x2 = startX + (idx + 1) * spacing;

        let animated = false;

        // Check if connection is animated (search/traverse)
        if (visited.includes(idx) && visited.includes(idx + 1)) {
          animated = false;
        }
        if (highlight === idx || highlight === idx + 1) {
          animated = true;
        }

        // For reverse operation - handle differently
        if (operation === 'reverse' && Object.keys(pointers).length > 0) {
          // During reverse, draw connections in reverse state
          if (reversedConns.includes(idx)) {
            // Reversed connection — draw single reversed arrow
            const arrowPadding = nodeWidth / 2 + 12;
            const fromX = x2 + nodeWidth / 2 - arrowPadding;
            const toX = x1 + nodeWidth / 2 + arrowPadding;
            const isFlipping = (subPhase === 'flip' && idx === pointers.curr - 1);
            const progress = isFlipping ? stepProgress : 1;

            const currentToX = fromX + (toX - fromX) * progress;

            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = isFlipping ? 4 + pulse * 1.5 : 3;
            if (isFlipping) { ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 8 + pulse * 6; }
            ctx.beginPath();
            ctx.moveTo(fromX, centerY);
            ctx.lineTo(currentToX, centerY);
            ctx.stroke();
            if (progress > 0.1) {
              drawArrowHead(currentToX, centerY, Math.PI, 10, '#ec4899');
            }
            ctx.shadowBlur = 0;
            continue;
          } else if (idx === pointers.curr && subPhase === 'redirect') {
            // Redirecting — show spinning icon
            const arrowPadding = nodeWidth / 2 + 12;
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x1 + nodeWidth / 2 + arrowPadding, centerY);
            ctx.lineTo(x2 + nodeWidth / 2 - arrowPadding, centerY);
            ctx.stroke();
            drawArrowHead(x2 + nodeWidth / 2 - arrowPadding, centerY, 0, 8, '#475569');

            const midX = (x1 + x2 + nodeWidth) / 2;
            ctx.fillStyle = '#ea580c';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('REDIRECTING', midX, centerY + 25);
            ctx.save();
            ctx.translate(midX, centerY - 5);
            ctx.rotate(time / 200);
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 0, 10, 0.2, Math.PI - 0.2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI + 0.2, Math.PI * 2 - 0.2); ctx.stroke();
            ctx.fillStyle = '#ea580c';
            ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(13, -3); ctx.lineTo(3, -3); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-13, 3); ctx.lineTo(-3, 3); ctx.fill();
            ctx.restore();
            continue;
          } else {
            // Normal forward arrow during reverse
            const arrowPadding = nodeWidth / 2 + 12;
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x1 + nodeWidth / 2 + arrowPadding, centerY);
            ctx.lineTo(x2 + nodeWidth / 2 - arrowPadding, centerY);
            ctx.stroke();
            drawArrowHead(x2 + nodeWidth / 2 - arrowPadding, centerY, 0, 8, '#475569');
            continue;
          }
        }

        drawDoubleArrow(x1 + nodeWidth / 2, x2 + nodeWidth / 2, centerY, animated);
      }

      // Draw nodes
      nodes.forEach((value: number, idx: number) => {
        let x = startX + idx * spacing;
        let y = centerY;

        let borderColor = DLL_COLORS.nodeBorder;
        let bgColor = DLL_COLORS.nodeBackground;
        let textCol = DLL_COLORS.nodeText;
        let shouldPulse = false;
        let glowIntensity = 0;
        let glowColor = borderColor;
        let scale = 1;
        let opacity = 1;
        let statusLabel = '';

        // HEAD / TAIL badges
        const isHead = idx === headPos;
        const isTail = idx === nodes.length - 1;

        // Reverse pointers
        if (operation === 'reverse' && Object.keys(pointers).length > 0 && subPhase !== 'complete') {
          if (idx === pointers.curr) {
            borderColor = '#22d3ee';
            glowColor = '#22d3ee';
            shouldPulse = true;
            glowIntensity = 30;
            statusLabel = 'CURR';
          } else if (idx === pointers.next) {
            statusLabel = 'NEXT';
          }
        }

        // State-based coloring
        if (deletingNode === idx) {
          borderColor = ENHANCED_COLORS.deleting;
          glowColor = ENHANCED_COLORS.deleting;
          if (deletePhase === 'fadeOut' && deleteStartTime.current) {
            const elapsed = performance.now() - deleteStartTime.current;
            const progress = Math.min(1, elapsed / 400);
            scale = Math.max(0, 1 - progress);
            opacity = Math.max(0, 1 - progress);
            if (idx === 0) x -= progress * 100;
            else if (idx === nodes.length - 1) x += progress * 100;
            else y += progress * 80;
            shouldPulse = false;
          } else {
            shouldPulse = true;
            glowIntensity = 35;
            scale = 1 + pulse * 0.05;
            statusLabel = 'DELETING';
          }
        } else if (insertingNode === idx) {
          borderColor = ENHANCED_COLORS.inserting;
          glowColor = ENHANCED_COLORS.inserting;
          shouldPulse = true;
          glowIntensity = 20;
          if (insertStartTime.current) {
            const elapsed = performance.now() - insertStartTime.current;
            const progress = Math.min(1, elapsed / 600);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            scale = 0.5 + easeProgress * 0.5 + pulse * 0.1;
            if (idx === 0) x -= 100 * (1 - easeProgress);
            else if (idx === nodes.length - 1 && nodes.length > 1) x += 100 * (1 - easeProgress);
            else y -= 80 * (1 - easeProgress);
            opacity = easeProgress;
          } else {
            scale = 0.5 + pulse * 0.5;
          }
          statusLabel = 'INSERTING';
        } else if (swappingNodes.includes(idx)) {
          borderColor = DLL_COLORS.swappingGlow;
          glowColor = DLL_COLORS.swappingGlow;
          shouldPulse = true;
          glowIntensity = 25;
          scale = 1.15; // Larger when swapping
          statusLabel = 'SWAPPING...';
        } else if (found === idx) {
          borderColor = ENHANCED_COLORS.found;
          glowColor = ENHANCED_COLORS.found;
          shouldPulse = true;
          glowIntensity = 25;
          scale = 1 + pulse * 0.15;
        } else if (highlight === idx && operation !== 'reverse') {
          borderColor = ENHANCED_COLORS.visiting;
          glowColor = ENHANCED_COLORS.visiting;
          shouldPulse = true;
          glowIntensity = 20;
          scale = 1 + pulse * 0.1;
        } else if (visited.includes(idx) && operation !== 'reverse') {
          borderColor = ENHANCED_COLORS.visitedTrail;
          glowColor = ENHANCED_COLORS.visitedTrail;
          glowIntensity = 8;
          shouldPulse = false;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        const w = nodeWidth * scale;
        const h = nodeHeight * scale;
        const nx = x - w / 2 + nodeWidth / 2;
        const ny = y - h / 2;

        // Glow effect
        if (shouldPulse) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowIntensity + pulse * 15;
        } else if (glowIntensity > 0) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowIntensity;
        }

        // Node background
        ctx.fillStyle = bgColor;
        drawRoundedRect(nx, ny, w, h, nodeCornerRadius * scale);
        ctx.fill();

        // Node border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = swappingNodes.includes(idx) ? 3 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Node value
        ctx.fillStyle = textCol;
        ctx.font = `900 ${Math.max(18, 28 * scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x + nodeWidth / 2, y);

        // HEAD badge
        if (isHead) {
          const badgeText = 'HEAD';
          ctx.font = 'bold 10px Inter, sans-serif';
          const tw = ctx.measureText(badgeText).width + 12;
          const bh = 20;
          const bx = x + nodeWidth / 2 - tw / 2;
          const by = ny - bh - 10;

          drawRoundedRect(bx, by, tw, bh, 4);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fill();
          ctx.strokeStyle = DLL_COLORS.headBadge;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = DLL_COLORS.headBadge;
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, x + nodeWidth / 2, by + bh / 2);
        }

        // TAIL badge
        if (isTail && nodes.length > 1) {
          const badgeText = 'TAIL';
          ctx.font = 'bold 10px Inter, sans-serif';
          const tw = ctx.measureText(badgeText).width + 12;
          const bh = 20;
          const bx = x + nodeWidth / 2 - tw / 2;
          const by = ny - bh - 10;

          drawRoundedRect(bx, by, tw, bh, 4);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
          ctx.fill();
          ctx.strokeStyle = DLL_COLORS.tailBadge;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = DLL_COLORS.tailBadge;
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, x + nodeWidth / 2, by + bh / 2);
        }

        // Status label (SWAPPING..., CURR, etc.)
        if (statusLabel) {
          const labelColor = statusLabel === 'SWAPPING...' ? DLL_COLORS.swappingLabel
            : statusLabel === 'CURR' ? '#22d3ee'
              : statusLabel === 'NEXT' ? '#64748b'
                : statusLabel === 'DELETING' ? ENHANCED_COLORS.deleting
                  : statusLabel === 'INSERTING' ? ENHANCED_COLORS.inserting
                    : '#64748b';

          ctx.fillStyle = labelColor;
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(statusLabel, x + nodeWidth / 2, ny - 4);
        }

        // Reverse pointer badges (below node)
        if (operation === 'reverse' && Object.keys(pointers).length > 0 && subPhase !== 'complete') {
          if (idx === pointers.curr) {
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CURR', x + nodeWidth / 2, ny + h + 25);
          } else if (idx === pointers.next) {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NEXT', x + nodeWidth / 2, ny + h + 25);
          }
        }

        ctx.restore();
      });

      // Draw NULL to the left of the first node if it has been reversed (node0Flipped)
      if (operation === 'reverse' && node0Flipped) {
        const nullX = startX - 120;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL', nullX, centerY);

        const isFlipping = (subPhase === 'flip' && pointers.curr === 0);
        const progress = isFlipping ? stepProgress : 1;

        const fromX = startX + nodeWidth / 2 - nodeWidth / 2 - 12;
        const toX = nullX + 35;
        const currentToX = fromX + (toX - fromX) * progress;

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = isFlipping ? 4 + pulse * 1.5 : 3;
        if (isFlipping) { ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 8 + pulse * 6; }
        ctx.beginPath();
        ctx.moveTo(fromX, centerY);
        ctx.lineTo(currentToX, centerY);
        ctx.stroke();
        if (progress > 0.1) {
          const angle = Math.PI;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.moveTo(currentToX, centerY);
          ctx.lineTo(currentToX - 10 * Math.cos(angle - Math.PI / 6), centerY - 10 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(currentToX - 10 * Math.cos(angle + Math.PI / 6), centerY - 10 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw operation info banner
      if (operation) {
        const bannerY = 30;
        const bannerText = operation.toUpperCase() + ' OPERATION';

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(20, bannerY - 15, 200, 30);

        ctx.fillStyle = ENHANCED_COLORS[operation] || ENHANCED_COLORS.highlight;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bannerText, 30, bannerY + 5);
      }

      return; // Done with doubly rendering
    }

    // ═══════════════════════════════════════════════
    // SINGLY LINKED LIST RENDERING (original)
    // ═══════════════════════════════════════════════

    // Helper function to draw arrow with animation
    const drawArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      curved: boolean = false,
      curveOffset: number = 0,
      animated: boolean = false,
      growProgress: number = 1
    ) => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const currentToX = fromX + dx * growProgress;
      const currentToY = fromY + dy * growProgress;

      ctx.strokeStyle = color;
      ctx.lineWidth = animated ? 4 + pulse * 1.5 : 4;

      if (animated) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 + pulse * 6;
      }

      ctx.beginPath();

      if (curved) {
        const controlY = fromY + curveOffset;
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo((fromX + currentToX) / 2, controlY, currentToX, currentToY);
      } else {
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(currentToX, currentToY);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      if (growProgress > 0.1) {
        const angle = curved
          ? Math.atan2(currentToY - (fromY + curveOffset), currentToX - (fromX + currentToX) / 2)
          : Math.atan2(currentToY - fromY, currentToX - fromX);
        const arrowSize = 12;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(currentToX, currentToY);
        ctx.lineTo(
          currentToX - arrowSize * Math.cos(angle - Math.PI / 6),
          currentToY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          currentToX - arrowSize * Math.cos(angle + Math.PI / 6),
          currentToY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    };

    // Draw connections first (so they appear behind nodes)
    nodes.forEach((_value: number, idx: number) => {
      const x = startX + idx * spacing;
      const y = centerY;

      if (idx < nodes.length - 1) {
        const nextX = startX + (idx + 1) * spacing;

        // Custom Reverse Connection Drawing
        if (operation === 'reverse' && Object.keys(pointers).length > 0) {
          const arrowPadding = 20;

          if (reversedConns.includes(idx)) {
            const isFlipping = (subPhase === 'flip' && idx === pointers.curr - 1);
            const progress = isFlipping ? stepProgress : 1;
            drawArrow(nextX - nodeRadius - arrowPadding, y, x + nodeRadius + arrowPadding, y, '#ec4899', false, 0, isFlipping, progress);
            return;
          } else if (idx === pointers.curr && subPhase === 'redirect') {
            drawArrow(x + nodeRadius + arrowPadding, y, nextX - nodeRadius - arrowPadding, y, '#475569', false, 0, false);
            const midX = x + nodeRadius + 40;
            ctx.fillStyle = '#ea580c';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('REDIRECTING', midX, y + 25);
            ctx.save();
            ctx.translate(midX, y - 5);
            ctx.rotate(time / 200);
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(0, 0, 10, 0.2, Math.PI - 0.2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI + 0.2, Math.PI * 2 - 0.2); ctx.stroke();
            ctx.fillStyle = '#ea580c';
            ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(13, -3); ctx.lineTo(3, -3); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-13, 3); ctx.lineTo(-3, 3); ctx.fill();
            ctx.restore();
            return;
          } else {
            drawArrow(x + nodeRadius + arrowPadding, y, nextX - nodeRadius - arrowPadding, y, '#475569', false, 0, false);
            return;
          }
        }

        // Determine connection color and animation based on state
        let connectionColor = ENHANCED_COLORS.connection;
        let isAnimated = false;

        if (visited.includes(idx) && visited.includes(idx + 1)) {
          connectionColor = ENHANCED_COLORS.visitedTrail;
          isAnimated = false;
        }

        if (highlight === idx || highlight === idx + 1) {
          connectionColor = ENHANCED_COLORS.visiting;
          isAnimated = true;
        }

        if (found !== undefined && idx <= found && visited.includes(idx)) {
          connectionColor = ENHANCED_COLORS.found;
          isAnimated = false;
        }

        const arrowPadding = 20;
        drawArrow(x + nodeRadius + arrowPadding, y, nextX - nodeRadius - arrowPadding, y, connectionColor, true, 0, isAnimated);
      }
    });

    // Draw nodes with enhanced effects
    nodes.forEach((value: number, idx: number) => {
      let x = startX + idx * spacing;
      let y = centerY;

      let nodeColor = '#1e293b';
      let borderColor = '#334155';
      let shouldPulse = false;
      let glowIntensity = 0;
      let glowColor = borderColor;
      let label = '';
      let scale = 1;
      let opacity = 1;

      // Draw NULL to the left of the first node if it has been processed
      if (operation === 'reverse' && idx === 0 && node0Flipped) {
        const nullX = x - 120;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL', nullX, y);

        const isFlipping = (subPhase === 'flip' && pointers.curr === 0);
        const progress = isFlipping ? stepProgress : 1;
        drawArrow(x - nodeRadius - 20, y, nullX + 35, y, '#ec4899', false, 0, isFlipping, progress);
      }

      // Badges
      let topBadgeText = '';
      let topBadgeColor = '';
      let bottomBadgeText = '';
      let bottomBadgeColor = '';

      if (idx === headPos) {
        if (operation === 'reverse') {
          topBadgeText = 'HEAD';
          topBadgeColor = '#ec4899';
        } else {
          label = 'HEAD';
        }
      }

      if (idx === nodes.length - 1 && nodes.length > 1 && operation !== 'reverse') {
        label = label ? 'HEAD/TAIL' : 'TAIL';
      }

      if (operation === 'reverse' && Object.keys(pointers).length > 0 && subPhase !== 'complete') {
        if (idx === pointers.curr) {
          nodeColor = '#0f172a';
          borderColor = '#22d3ee';
          glowColor = '#22d3ee';
          shouldPulse = true;
          glowIntensity = 30;
          bottomBadgeText = 'CURR';
          bottomBadgeColor = '#22d3ee';
        } else if (idx === pointers.next) {
          topBadgeText = 'prev';
          topBadgeColor = '#0d9488';
          bottomBadgeText = 'NEXT';
          bottomBadgeColor = '#64748b';
        }
      }

      // State-based coloring with priority
      if (deletingNode === idx) {
        borderColor = ENHANCED_COLORS.deleting;
        glowColor = ENHANCED_COLORS.deleting;
        if (deletePhase === 'fadeOut' && deleteStartTime.current) {
          const elapsed = performance.now() - deleteStartTime.current;
          const progress = Math.min(1, elapsed / 400);
          scale = Math.max(0, 1 - progress);
          opacity = Math.max(0, 1 - progress);
          if (idx === 0) x -= progress * 100;
          else if (idx === nodes.length - 1) x += progress * 100;
          else y += progress * 80;
          shouldPulse = false;
        } else {
          shouldPulse = true;
          glowIntensity = 35;
          scale = 1 + pulse * 0.05;
        }
      } else if (insertingNode === idx) {
        borderColor = ENHANCED_COLORS.inserting;
        glowColor = ENHANCED_COLORS.inserting;
        shouldPulse = true;
        glowIntensity = 20;
        if (insertStartTime.current) {
          const elapsed = performance.now() - insertStartTime.current;
          const progress = Math.min(1, elapsed / 600);
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          scale = 0.5 + easeProgress * 0.5 + pulse * 0.1;
          if (idx === 0) x -= 100 * (1 - easeProgress);
          else if (idx === nodes.length - 1 && nodes.length > 1) x += 100 * (1 - easeProgress);
          else y -= 80 * (1 - easeProgress);
          opacity = easeProgress;
        } else {
          scale = 0.5 + pulse * 0.5;
        }
      } else if (swappingNodes.includes(idx)) {
        borderColor = ENHANCED_COLORS.swapping; glowColor = borderColor;
        shouldPulse = true; glowIntensity = 15;
      } else if (found === idx) {
        borderColor = ENHANCED_COLORS.found; glowColor = borderColor;
        shouldPulse = true; glowIntensity = 25; scale = 1 + pulse * 0.15;
      } else if (highlight === idx && operation !== 'reverse') {
        borderColor = ENHANCED_COLORS.visiting; glowColor = borderColor;
        shouldPulse = true; glowIntensity = 20; scale = 1 + pulse * 0.1;
      } else if (visited.includes(idx) && operation !== 'reverse') {
        borderColor = ENHANCED_COLORS.visitedTrail; glowColor = borderColor;
        glowIntensity = 8; shouldPulse = false;
      }

      ctx.globalAlpha = opacity;

      // Apply glow effect
      if (shouldPulse) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity + pulse * 15;
      } else if (glowIntensity > 0) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity;
      }

      // Outer ring for current node
      if (operation === 'reverse' && idx === pointers.curr) {
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 4;
        ctx.globalAlpha = opacity * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius * scale + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = opacity;
      }

      // Main node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius * scale, 0, Math.PI * 2);
      ctx.fill();

      // Node border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = (operation === 'reverse' && idx === pointers.curr) ? 3 : 1;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Node value
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${24 * scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), x, y);

      // Label (HEAD/TAIL)
      if (label) {
        ctx.fillStyle = ENHANCED_COLORS.textSecondary;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(label, x, y - nodeRadius - 20);
      }

      // Draw Top Badge
      if (topBadgeText) {
        ctx.font = 'bold 12px Inter, sans-serif';
        const metrics = ctx.measureText(topBadgeText);
        const bw = metrics.width + 16; const bh = 24;
        const bx = x - bw / 2;
        const by = y - nodeRadius - 40;

        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.strokeStyle = topBadgeColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(15,23,42,0.8)';
        ctx.fill();

        ctx.shadowColor = topBadgeColor;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = topBadgeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(topBadgeText, x, by + bh / 2 + 1);
      }

      // Draw Bottom Badge
      if (bottomBadgeText) {
        ctx.fillStyle = bottomBadgeColor;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bottomBadgeText, x, y + nodeRadius + 30);
      }

      // Operation indicator
      if (deletingNode === idx) {
        ctx.fillStyle = ENHANCED_COLORS.deleting;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('DELETING', x, y + nodeRadius + 45);
      } else if (insertingNode === idx) {
        ctx.fillStyle = ENHANCED_COLORS.inserting;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('INSERTING', x, y + nodeRadius + 45);
      }

      ctx.globalAlpha = 1;
    });

    // Draw operation info banner
    if (operation) {
      const bannerY = 30;
      const bannerText = operation.toUpperCase() + ' OPERATION';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(20, bannerY - 15, 200, 30);

      ctx.fillStyle = ENHANCED_COLORS[operation] || ENHANCED_COLORS.highlight;
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(bannerText, 30, bannerY + 5);
    }

    // Depend on `pulse` and `time` to constantly re-render the canvas for animations
  }, [data, type, visited, found, highlight, pulse, time, operation, reversingNodes, deletingNode, insertingNode, swappingNodes]);

  return <canvas ref={canvasRef} className="block" />;
}