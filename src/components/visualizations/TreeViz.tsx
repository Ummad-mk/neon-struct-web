import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';
import { TreeNode } from '../../types/dataStructures';

interface Props {
  data: any;
  visited?: number[];
  found?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  insertingNode?: number;
  deletingNode?: number;
}

export function TreeViz({ data, visited = [], found, operation, insertingNode, deletingNode }: Props) {
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
    if (!canvasRef.current || !data || !data.tree) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use offsetWidth/Height to get the real display size
    // This ensures accurate centering regardless of screen size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tree = data.tree;
    const nodeRadius = 30.5;
    const levelHeight = 125;
    const startY = 50;

    const getTreeDepth = (node: TreeNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(getTreeDepth(node.left || null), getTreeDepth(node.right || null));
    };

    const treeDepth = getTreeDepth(tree);
    const requiredHeight = startY + (treeDepth * levelHeight) + nodeRadius * 2;

    // Ensure canvas is tall enough for the tree
    if (requiredHeight > canvas.height) {
      canvas.height = requiredHeight;
    }

    const getTreeWidth = (node: TreeNode | null, depth: number = 0): number => {
      if (!node) return 0;
      const leftWidth = getTreeWidth(node.left || null, depth + 1);
      const rightWidth = getTreeWidth(node.right || null, depth + 1);
      // Give each leaf node plenty of horizontal space at the bottom level
      return Math.max(leftWidth + rightWidth + 100, Math.pow(2, treeDepth - depth - 1) * 70);
    };

    const treeWidth = getTreeWidth(tree);

    const drawNode = (
      node: TreeNode | null,
      x: number,
      y: number,
      xOffset: number,
      depth: number
    ) => {
      if (!node) return;

      if (node.left) {
        const childX = x - xOffset;
        let childY = y + levelHeight;

        // Prevent drawing lines to a node that is currently sliding from way up top.
        // It looks better if the line is just attached to its target destination, or fading in.
        ctx.strokeStyle = COLORS.textSecondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + nodeRadius);
        ctx.lineTo(childX, childY - nodeRadius);
        ctx.stroke();

        drawNode(node.left, childX, childY, xOffset / 2, depth + 1);
      }

      if (node.right) {
        const childX = x + xOffset;
        let childY = y + levelHeight;

        ctx.strokeStyle = COLORS.textSecondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + nodeRadius);
        ctx.lineTo(childX, childY - nodeRadius);
        ctx.stroke();

        drawNode(node.right, childX, childY, xOffset / 2, depth + 1);
      }

      const isVisited = visited.includes(node.value);
      const isFound = found === node.value;
      const isInserting = insertingNode === node.value && operation === 'insert';
      const isDeleting = deletingNode === node.value && operation === 'delete';

      let drawY = y;
      let scale = 1;
      let opacity = 1;
      let shouldPulse = false;
      let glowColor = COLORS.highlight;

      if (isInserting && insertStartTime.current) {
        const elapsed = performance.now() - insertStartTime.current;
        const progress = Math.min(1, Math.max(0, elapsed / 600)); // 600ms duration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        drawY = y - 100 * (1 - easeProgress); // Slide in from 100px above
        scale = 0.5 + easeProgress * 0.5;
        opacity = easeProgress;
        shouldPulse = true;
        glowColor = '#06b6d4'; // Cyan
      } else if (isDeleting && deleteStartTime.current) {
        const elapsed = performance.now() - deleteStartTime.current;

        // 1st phase is just red glowing. 2nd phase (after 500ms equivalent, we'll just check if it's past 1500 but our timing is from start)
        // For a simpler generic fallback without precise phase piping:
        // Assuming a 400ms fadeout at the end of the operation.
        const progress = Math.min(1, elapsed / 500);
        drawY = y + progress * 50; // Drop down 50px
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
        ctx.shadowBlur = 15 + pulse * 10;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(x, drawY, nodeRadius * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (!isDeleting) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.text;
        ctx.font = `bold ${14 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value.toString(), x, drawY);
      }

      ctx.globalAlpha = 1;
    };

    const startX = canvas.width / 2;

    drawNode(tree, startX, startY, treeWidth / 4, 0);
  }, [data, visited, found, pulse, operation, insertingNode, deletingNode]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
