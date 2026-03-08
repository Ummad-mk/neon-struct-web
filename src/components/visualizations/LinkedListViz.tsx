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
    if (nodes.length === 0) return;

    // Calculate required dimensions
    const nodeRadius = 40;
    const spacing = 160;
    const startX = 100;
    const endPadding = 100;

    const totalWidth = startX + (nodes.length - 1) * spacing + nodeRadius * 2 + endPadding;
    const totalHeight = 400;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    const centerY = totalHeight / 2;

    // Helper function to draw arrow with animation
    const drawArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      curved: boolean = false,
      curveOffset: number = 0,
      animated: boolean = false
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = animated ? 3 + pulse * 2 : 3;

      if (animated) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 + pulse * 10;
      }

      ctx.beginPath();

      if (curved) {
        const controlY = fromY + curveOffset;
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo((fromX + toX) / 2, controlY, toX, toY);
      } else {
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Arrow head
      const angle = curved
        ? Math.atan2(toY - (fromY + curveOffset), toX - (fromX + toX) / 2)
        : Math.atan2(toY - fromY, toX - fromX);
      const arrowSize = 8;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    };

    // Draw animated flow particles on connections (for reverse operation)
    const drawFlowParticles = (fromX: number, fromY: number, toX: number, toY: number, reverse: boolean) => {
      const particleCount = 3;
      const particleSize = 4;

      for (let i = 0; i < particleCount; i++) {
        const offset = (time / 1000 + i / particleCount) % 1;
        const t = reverse ? 1 - offset : offset;

        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t;

        ctx.fillStyle = ENHANCED_COLORS.reversingConnection;
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Draw connections first (so they appear behind nodes)
    nodes.forEach((_value: number, idx: number) => {
      const x = startX + idx * spacing;
      const y = centerY;

      if (idx < nodes.length - 1) {
        const nextX = startX + (idx + 1) * spacing;

        // Determine connection color and animation based on state
        let connectionColor = ENHANCED_COLORS.connection;
        let isAnimated = false;
        let showParticles = false;

        // If both nodes are in visited trail (search path visualization)
        if (visited.includes(idx) && visited.includes(idx + 1)) {
          connectionColor = ENHANCED_COLORS.visitedTrail;
          isAnimated = false; // Already visited, no animation
        }

        // If current node is being visited (highlight)
        if (highlight === idx || highlight === idx + 1) {
          connectionColor = ENHANCED_COLORS.visiting;
          isAnimated = true; // Active visiting animation
        }

        // If in reversing mode
        if (reversingNodes.includes(idx) && reversingNodes.includes(idx + 1)) {
          connectionColor = ENHANCED_COLORS.reversingConnection;
          isAnimated = true;
          showParticles = true;
        }

        // If found, highlight path to found node
        if (found !== undefined && idx <= found && visited.includes(idx)) {
          connectionColor = ENHANCED_COLORS.found;
          isAnimated = false;
        }

        // Draw flow particles for reverse operation
        if (showParticles && operation === 'reverse') {
          const startParticleX = x + nodeRadius;
          const endParticleX = nextX - nodeRadius;
          drawFlowParticles(startParticleX, y, endParticleX, y, true);
        }

        // Forward arrow
        if (type === 'doubly') {
          drawArrow(x + nodeRadius, y, nextX - nodeRadius, y, connectionColor, true, -30, isAnimated);
        } else {
          drawArrow(x + nodeRadius, y, nextX - nodeRadius, y, connectionColor, true, 0, isAnimated);
        }

        // Backward arrow for doubly linked list
        if (type === 'doubly') {
          const backColor = (reversingNodes.includes(idx) && reversingNodes.includes(idx + 1))
            ? ENHANCED_COLORS.reversingConnection
            : connectionColor;
          drawArrow(nextX - nodeRadius, y, x + nodeRadius, y, backColor, true, 30, isAnimated);
        }
      }
    });

    // Draw circular links for Doubly Linked List if there are at least 2 nodes
    if (type === 'doubly' && nodes.length > 1) {
      const firstX = startX;
      const lastX = startX + (nodes.length - 1) * spacing;

      // Top arch (Tail -> Head)
      drawArrow(lastX, centerY - nodeRadius, firstX, centerY - nodeRadius, ENHANCED_COLORS.connection, true, -180, false);

      // Bottom arch (Head -> Tail)
      drawArrow(firstX, centerY + nodeRadius, lastX, centerY + nodeRadius, ENHANCED_COLORS.connection, true, 180, false);
    }

    // Draw nodes with enhanced effects
    nodes.forEach((value: number, idx: number) => {
      let x = startX + idx * spacing;
      let y = centerY;

      // Determine node state and visual properties
      let nodeColor = ENHANCED_COLORS.default;
      let shouldPulse = false;
      let glowIntensity = 0;
      let label = '';
      let scale = 1;
      let opacity = 1;

      // Head and tail labels
      if (idx === 0) {
        label = 'HEAD';
      }
      if (idx === nodes.length - 1 && nodes.length > 1) {
        label = label ? 'HEAD/TAIL' : 'TAIL';
      }

      // State-based coloring with priority (higher priority = later in list)
      if (deletingNode === idx) {
        nodeColor = ENHANCED_COLORS.deleting;
        if (deletePhase === 'fadeOut' && deleteStartTime.current) {
          const elapsed = performance.now() - deleteStartTime.current;
          const progress = Math.min(1, elapsed / 400); // 400ms shrink & fade out
          scale = Math.max(0, 1 - progress);
          opacity = Math.max(0, 1 - progress);

          // Slide OUT to the left if it's head, right if it's tail, down if it's middle
          if (idx === 0) x -= progress * 100;
          else if (idx === nodes.length - 1) x += progress * 100;
          else y += progress * 80;

          shouldPulse = false;
        } else {
          shouldPulse = true;
          glowIntensity = 35; // Hard, intense red glow
          scale = 1 + pulse * 0.05; // Quick alarm shake/pulse
        }
      } else if (insertingNode === idx) {
        nodeColor = ENHANCED_COLORS.inserting;
        shouldPulse = true;
        glowIntensity = 20;

        if (insertStartTime.current) {
          const elapsed = performance.now() - insertStartTime.current;
          const progress = Math.min(1, elapsed / 600); // 600ms slide & grow

          // Easing function (easeOutBack equivalent for bounce)
          const MathPow = Math.pow(1 - progress, 3);
          const easeProgress = 1 - MathPow;

          scale = 0.5 + easeProgress * 0.5 + pulse * 0.1;

          // Slide IN from the left if it's head, right if it's tail, down if it's middle
          if (idx === 0) x -= 100 * (1 - easeProgress);
          else if (idx === nodes.length - 1 && nodes.length > 1) x += 100 * (1 - easeProgress);
          else y -= 80 * (1 - easeProgress);

          opacity = easeProgress;
        } else {
          scale = 0.5 + pulse * 0.5; // Fallback
        }
      } else if (swappingNodes.includes(idx)) {
        nodeColor = ENHANCED_COLORS.swapping;
        shouldPulse = true;
        glowIntensity = 15;
      } else if (reversingNodes.includes(idx)) {
        nodeColor = ENHANCED_COLORS.reversing;
        shouldPulse = true;
        glowIntensity = 15;
      } else if (found === idx) {
        // FOUND - brightest green with soft strong glow pulse
        nodeColor = ENHANCED_COLORS.found;
        shouldPulse = true;
        glowIntensity = 25;
        scale = 1 + pulse * 0.15; // Slightly larger when found
      } else if (highlight === idx) {
        // CURRENTLY VISITING - bright yellow/orange with soft glow
        nodeColor = ENHANCED_COLORS.visiting;
        shouldPulse = true;
        glowIntensity = 20;
        scale = 1 + pulse * 0.1; // Microanimation: slight bounce when scanning
      } else if (visited.includes(idx)) {
        // VISITED TRAIL - dim amber, no pulse, subtle glow remaining
        nodeColor = ENHANCED_COLORS.visitedTrail;
        glowIntensity = 8;
        shouldPulse = false;
      }

      ctx.globalAlpha = opacity;

      // Apply glow effect
      if (shouldPulse) {
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = glowIntensity + pulse * 10;
      } else if (glowIntensity > 0) {
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = glowIntensity;
      }

      // Draw outer ring for special states (soft outer glow)
      if (shouldPulse && nodeColor !== ENHANCED_COLORS.deleting) {
        const ringRadius = nodeRadius * scale + 5 + pulse * 5;
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = opacity * Math.max(0, 0.3 + pulse * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = opacity;
      }

      // Draw main node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius * scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw node border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Draw value text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${20 * scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), x, y);

      // Draw label (HEAD/TAIL)
      if (label) {
        ctx.fillStyle = ENHANCED_COLORS.textSecondary;
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(label, x, y - nodeRadius - 20);
      }

      // Draw operation indicator
      if (deletingNode === idx) {
        ctx.fillStyle = ENHANCED_COLORS.deleting;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('DELETING', x, y + nodeRadius + 20);
      } else if (insertingNode === idx) {
        ctx.fillStyle = ENHANCED_COLORS.inserting;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('INSERTING', x, y + nodeRadius + 20);
      } else if (reversingNodes.includes(idx)) {
        ctx.fillStyle = ENHANCED_COLORS.reversing;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('REVERSING', x, y + nodeRadius + 20);
      }

      // Draw index number
      ctx.fillStyle = ENHANCED_COLORS.textSecondary;
      ctx.font = '10px monospace';
      ctx.fillText(`[${idx}]`, x, y + nodeRadius + 35);

      ctx.globalAlpha = 1; // Reset opacity for next node
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

  }, [data, type, visited, found, highlight, pulse, operation, reversingNodes, deletingNode, insertingNode, swappingNodes, time]);

  return <canvas ref={canvasRef} className="block" />;
}