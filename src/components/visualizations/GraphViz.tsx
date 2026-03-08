import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';
import { GraphData } from '../../types/dataStructures';

interface Props {
  data: GraphData;
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  insertingNode?: number;
  deletingNode?: number;
  highlightedEdges?: any[];
  cycleEdgesActive?: boolean;
}

export function GraphViz({ data, visited = [], found, operation, insertingNode, deletingNode, highlightedEdges = [], cycleEdgesActive = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [pulse, setPulse] = useState(0);

  const insertStartTime = useRef<number | null>(null);
  const deleteStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (insertingNode !== undefined) {
      if (!insertStartTime.current) insertStartTime.current = performance.now();
    } else {
      insertStartTime.current = null;
    }
  }, [insertingNode]);

  useEffect(() => {
    if (deletingNode !== undefined) {
      if (!deleteStartTime.current) deleteStartTime.current = performance.now();
    } else {
      deleteStartTime.current = null;
    }
  }, [deletingNode]);

  useEffect(() => {
    let start = 0;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      setPulse(Math.sin(progress / 300) * 0.5 + 0.5);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const vertices = data.vertices || [];
    if (vertices.length === 0) return;

    // --- [DYNAMIC SIZING LOGIC] ---
    // Base size is 30. As vertices grow > 10, shrink radius down to minimum 12.
    const baseRadius = 30;
    const nodeCount = vertices.length;
    let nodeRadius = baseRadius;

    if (nodeCount > 10) {
      const reductionFactor = (nodeCount - 10) * 0.8;
      nodeRadius = Math.max(12, baseRadius - reductionFactor);
    }

    // Adjust font size dynamically too
    const fontSize = Math.max(10, Math.floor(nodeRadius * 0.6));
    // -----------------------------

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Dynamic Layout Radius (expand circle as nodes increase to avoid overlap)
    const layoutRadius = Math.min(rect.width, rect.height) / 2.5;

    const positions: { [key: number]: { x: number; y: number } } = {};

    vertices.forEach((vertex, idx) => {
      const angle = (idx * 2 * Math.PI) / vertices.length - Math.PI / 2;
      const x = centerX + layoutRadius * Math.cos(angle);
      const y = centerY + layoutRadius * Math.sin(angle);
      positions[vertex] = { x, y };
    });

    // Draw Edges first (so they are behind nodes)
    const edges = data.edges || [];
    edges.forEach((edge) => {
      const from = positions[edge.from];
      const to = positions[edge.to];

      if (!from || !to) return;

      ctx.strokeStyle = COLORS.textSecondary;
      ctx.lineWidth = nodeRadius > 15 ? 2 : 1; // Thinner lines for dense graphs
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Weight Label
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;

      // Background for weight
      ctx.fillStyle = COLORS.background;
      const tagSize = nodeRadius > 15 ? 24 : 16;
      ctx.fillRect(midX - tagSize / 2, midY - tagSize / 2, tagSize, tagSize);

      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = `${Math.max(8, fontSize - 2)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.weight.toString(), midX, midY);
    });

    // Draw Highlighted Edges over standard edges
    const isCycleHighlight = cycleEdgesActive;

    highlightedEdges.forEach((edge) => {
      const u = edge.from !== undefined ? edge.from : edge[0];
      const v = edge.to !== undefined ? edge.to : edge[1];
      const fromPos = positions[u];
      const toPos = positions[v];
      if (!fromPos || !toPos) return;

      ctx.strokeStyle = isCycleHighlight ? COLORS.error : COLORS.found;
      ctx.lineWidth = nodeRadius > 15 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();

      // Highlight weight background too
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;
      ctx.fillStyle = isCycleHighlight ? COLORS.error : COLORS.found;
      const tagSize = nodeRadius > 15 ? 24 : 16;
      ctx.fillRect(midX - tagSize / 2, midY - tagSize / 2, tagSize, tagSize);

      let displayWeight = edge.weight !== undefined ? edge.weight : '';
      if (displayWeight !== '') {
        ctx.fillStyle = COLORS.default;
        ctx.font = `bold ${Math.max(8, fontSize - 2)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayWeight.toString(), midX, midY);
      }
    });

    // Draw Nodes
    vertices.forEach((vertex) => {
      const pos = positions[vertex];
      if (!pos) return;

      const isVisited = visited.includes(vertex);
      const isFound = found === vertex;
      const isInserting = insertingNode === vertex && operation === 'insert';
      const isDeleting = deletingNode === vertex && operation === 'delete';

      let drawY = pos.y;
      let scale = 1;
      let opacity = 1;
      let shouldPulse = false;
      let glowColor = COLORS.highlight;

      if (isInserting && insertStartTime.current) {
        const elapsed = performance.now() - insertStartTime.current;
        const progress = Math.min(1, Math.max(0, elapsed / 600)); // 600ms duration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        drawY = pos.y - 100 * (1 - easeProgress); // Slide in from 100px above
        scale = 0.5 + easeProgress * 0.5;
        opacity = easeProgress;
        shouldPulse = true;
        glowColor = '#06b6d4'; // Cyan
      } else if (isDeleting && deleteStartTime.current) {
        const elapsed = performance.now() - deleteStartTime.current;

        const progress = Math.min(1, elapsed / 500);
        drawY = pos.y + progress * 50; // Drop down 50px
        opacity = 1 - progress;
        scale = 1 - progress * 0.5;
        glowColor = '#ef4444'; // Red
        shouldPulse = true;
      } else if (isFound) {
        shouldPulse = true;
        glowColor = COLORS.found;
        scale = 1 + pulse * 0.1;
      } else if (isVisited) {
        shouldPulse = true;
        glowColor = COLORS.visited;
      }

      ctx.globalAlpha = opacity;

      let fillColor = COLORS.default;
      if (isFound) fillColor = COLORS.found;
      else if (isVisited) fillColor = COLORS.visited;
      if (isDeleting) fillColor = '#ef4444';
      if (isInserting) fillColor = '#06b6d4';

      ctx.fillStyle = fillColor;

      if (shouldPulse) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = nodeRadius * 0.8 + pulse * 10;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(pos.x, drawY, nodeRadius * scale, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = nodeRadius > 15 ? 3 : 1.5;
      ctx.stroke();

      // Text
      if (!isDeleting) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fontSize * scale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex.toString(), pos.x, drawY);
      }

      ctx.globalAlpha = 1;
    });
  }, [data, visited, found, pulse, operation, insertingNode, deletingNode, highlightedEdges, cycleEdgesActive]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
