import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../utils/colors';
import { TreeNode } from '../../types/dataStructures';

interface Props {
  data: any;
  visited?: number[];
  found?: number;
  highlight?: number;
  operation?: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
  insertingNode?: number;
  deletingNode?: number;
  // ── Screenshot 1: Successor swap ──────────────────────────────────────────
  // targetNode    = the node being deleted  → red dashed circle + TARGET label
  // successorNode = the inorder successor   → amber circle + SUCCESSOR label
  //                 + animated dashed arc from successor up to target
  targetNode?: number;
  successorNode?: number;
  statusBadge?: string;   // bottom-left badge e.g. "SWAP_PENDING"
  // ── Screenshot 2: Insertion comparison ───────────────────────────────────
  // comparingNodes.parent = amber node  → "Index N (Parent)" label below
  // comparingNodes.child  = cyan node   → "Index N (New)"    label below
  // A "child > parent?" badge renders between them
  comparingNodes?: { parent: number; child: number };
  comparisonText?: string;
  insertionCarrier?: { from: number; to: number; value: number };
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const TC = {
  defaultFill: 'rgba(15, 23, 42, 0.6)',
  defaultBorder: '#334155',
  defaultText: '#94a3b8',

  visitedFill: 'rgba(6, 182, 212, 0.08)',
  visitedBorder: '#22d3ee',
  visitedText: '#22d3ee',
  visitedGlow: '#22d3ee',

  foundFill: 'rgba(168, 85, 247, 0.12)',
  foundBorder: '#c026d3',
  foundText: '#c026d3',
  foundGlow: '#c026d3',

  // Insert new node — cyan (screenshot 2 "Index N (New)")
  insertFill: 'rgba(6, 182, 212, 0.10)',
  insertBorder: '#22d3ee',
  insertText: '#22d3ee',
  insertGlow: '#22d3ee',

  // Parent during heapify comparison — amber (screenshot 2 "Index N (Parent)")
  parentFill: 'rgba(245, 158, 11, 0.12)',
  parentBorder: '#f59e0b',
  parentText: '#f59e0b',
  parentGlow: '#f59e0b',

  // Delete TARGET — red dashed (screenshot 1)
  targetFill: 'rgba(239, 68, 68, 0.08)',
  targetBorder: '#ef4444',
  targetText: '#ef4444',
  targetGlow: '#ef4444',

  // Inorder SUCCESSOR — amber solid (screenshot 1)
  successorFill: 'rgba(245, 158, 11, 0.12)',
  successorBorder: '#f59e0b',
  successorText: '#f59e0b',
  successorGlow: '#f59e0b',

  swapPink: '#ec4899',
  edgeDefault: '#1e293b',
  edgeVisited: '#22d3ee',
};

// ─── Timing ───────────────────────────────────────────────────────────────────
const INSERT_DROP_MS = 600;
const INSERT_PULSE_MS = 400;
const DELETE_FADE_MS = 500;

// ─── Easing ───────────────────────────────────────────────────────────────────
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function treeDepth(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(treeDepth(node.left ?? null), treeDepth(node.right ?? null));
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TreeViz({
  data, visited = [], found, highlight, operation,
  insertingNode, deletingNode,
  targetNode, successorNode, statusBadge,
  comparingNodes,
  comparisonText,
  insertionCarrier,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const [pulse, setPulse] = useState(0);
  const [time, setTime] = useState(0);

  const insertT = useRef<number | null>(null);
  const deleteT = useRef<number | null>(null);
  const successorT = useRef<number | null>(null);
  const carrierT = useRef<number | null>(null);

  useEffect(() => {
    insertingNode !== undefined
      ? (insertT.current ??= performance.now())
      : (insertT.current = null);
  }, [insertingNode]);

  useEffect(() => {
    deletingNode !== undefined
      ? (deleteT.current ??= performance.now())
      : (deleteT.current = null);
  }, [deletingNode]);

  useEffect(() => {
    successorNode !== undefined
      ? (successorT.current ??= performance.now())
      : (successorT.current = null);
  }, [successorNode]);

  useEffect(() => {
    insertionCarrier
      ? (carrierT.current = performance.now())
      : (carrierT.current = null);
  }, [insertionCarrier]);

  useEffect(() => {
    let s = 0;
    const tick = (ts: number) => {
      if (!s) s = ts;
      setPulse(Math.sin((ts - s) / 300) * 0.5 + 0.5);
      setTime(ts - s);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Canvas draw ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !data?.tree) return;
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

    const tree = data.tree as TreeNode;
    const R = 28;
    const LH = 110;
    const startY = 70;
    const depth = treeDepth(tree);

    const getW = (n: TreeNode | null, d = 0): number => {
      if (!n) return 0;
      return Math.max(
        getW(n.left ?? null, d + 1) + getW(n.right ?? null, d + 1) + 100,
        Math.pow(2, depth - d - 1) * 70,
      );
    };
    const tW = getW(tree);
    const startX = W / 2;
    const xOff = tW / 4;

    // BFS position map
    const pos = new Map<number, { x: number; y: number; idx: number }>();
    let bfsI = 0;
    const collect = (n: TreeNode | null, x: number, y: number, off: number) => {
      if (!n) return;
      pos.set(n.value, { x, y, idx: bfsI++ });
      collect(n.left ?? null, x - off, y + LH, off / 2);
      collect(n.right ?? null, x + off, y + LH, off / 2);
    };
    collect(tree, startX, startY, xOff);

    // ── Mini helpers ───────────────────────────────────────────────────────
    const arrowTip = (tx: number, ty: number, angle: number, color: string, sz = 9) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - sz * Math.cos(angle - Math.PI / 6), ty - sz * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tx - sz * Math.cos(angle + Math.PI / 6), ty - sz * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    // Boxed badge (border + dark bg) — same style as LinkedList HEAD/prev
    const badgeBox = (text: string, cx: number, cy: number, color: string) => {
      ctx.save();
      ctx.font = 'bold 11px Inter, sans-serif';
      const tw = ctx.measureText(text).width;
      const bw = tw + 14, bh = 22;
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 4);
      ctx.fillStyle = 'rgba(15,23,42,0.90)';
      ctx.fill();
      ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy);
      ctx.restore();
    };

    const txt = (text: string, cx: number, cy: number, color: string, size = 10) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${size}px Inter, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy);
      ctx.restore();
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1. EDGES
    // ═══════════════════════════════════════════════════════════════════════
    const drawEdges = (n: TreeNode | null, x: number, y: number, off: number) => {
      if (!n) return;

      const kids = [
        n.left ? { c: n.left, cx: x - off, cy: y + LH } : null,
        n.right ? { c: n.right, cx: x + off, cy: y + LH } : null,
      ].filter(Boolean) as { c: TreeNode; cx: number; cy: number }[];

      for (const { c, cx, cy } of kids) {
        const dx = cx - x, dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const fx = x + (dx / dist) * R, fy = y + (dy / dist) * R;
        const tx2 = cx - (dx / dist) * R, ty2 = cy - (dy / dist) * R;

        const onPath = visited.includes(n.value) && visited.includes(c.value);
        const hiEdge = (highlight === n.value || highlight === c.value) && visited.includes(n.value);
        const tgtEdge = targetNode !== undefined && n.value === targetNode;
        const succEdge = successorNode !== undefined && c.value === successorNode;

        // Growing insert edge
        if (operation === 'insert' && insertingNode === c.value && insertT.current) {
          const el = performance.now() - insertT.current;
          const p = easeOut(Math.min(1, el / INSERT_DROP_MS));
          ctx.save();
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = TC.insertBorder; ctx.lineWidth = 2;
          ctx.shadowColor = TC.insertBorder; ctx.shadowBlur = 8;
          ctx.globalAlpha = p;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + (tx2 - fx) * p, fy + (ty2 - fy) * p);
          ctx.stroke();
          ctx.restore();
          continue;
        }

        ctx.save();
        if (tgtEdge) {
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = TC.targetBorder; ctx.lineWidth = 2;
          ctx.shadowColor = TC.targetBorder; ctx.shadowBlur = 6;
        } else if (succEdge) {
          ctx.setLineDash([]);
          ctx.strokeStyle = TC.successorBorder; ctx.lineWidth = 2;
          ctx.shadowColor = TC.successorBorder; ctx.shadowBlur = 6;
        } else if (onPath || hiEdge) {
          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = TC.edgeVisited; ctx.lineWidth = 2.5;
          ctx.shadowColor = TC.edgeVisited; ctx.shadowBlur = 6 + pulse * 4;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = TC.edgeDefault; ctx.lineWidth = 1.5;
        }
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx2, ty2); ctx.stroke();
        ctx.restore();
      }

      drawEdges(n.left ?? null, x - off, y + LH, off / 2);
      drawEdges(n.right ?? null, x + off, y + LH, off / 2);
    };

    drawEdges(tree, startX, startY, xOff);

    if (insertionCarrier && carrierT.current !== null) {
      const fp = pos.get(insertionCarrier.from);
      const tp = pos.get(insertionCarrier.to);
      if (fp && tp) {
        const elapsed = performance.now() - carrierT.current;
        const p = Math.min(1, elapsed / 420);
        const t = easeInOut(p);
        const cx = fp.x + (tp.x - fp.x) * t;
        const cy = fp.y + (tp.y - fp.y) * t;
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = TC.insertBorder;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = TC.insertGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = TC.insertFill;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = TC.insertBorder;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = TC.insertText;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(insertionCarrier.value), cx, cy);
        ctx.restore();
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. SUCCESSOR → TARGET animated dashed arc (screenshot 1)
    //    Marching-ant dashed curve from successor up to target node
    // ═══════════════════════════════════════════════════════════════════════
    if (successorNode !== undefined && targetNode !== undefined && successorT.current !== null) {
      const sp = pos.get(successorNode);
      const tp = pos.get(targetNode);
      if (sp && tp) {
        const el = performance.now() - successorT.current;
        const progress = Math.min(1, el / 800);

        // Bezier control point arches up between the two nodes
        const cpX = (sp.x + tp.x) / 2;
        const cpY = Math.min(sp.y, tp.y) - 70;

        ctx.save();
        ctx.setLineDash([7, 6]);
        ctx.lineDashOffset = -(el / 20) % 13; // marching ants
        ctx.strokeStyle = TC.successorBorder;
        ctx.lineWidth = 2;
        ctx.shadowColor = TC.successorBorder;
        ctx.shadowBlur = 8 + pulse * 6;
        ctx.globalAlpha = 0.9;

        // Partial quadratic Bézier — grows from successor toward target
        ctx.beginPath();
        const steps = 48;
        for (let i = 0; i <= steps * progress; i++) {
          const t = i / steps;
          const u = 1 - t;
          const qx = u * u * sp.x + 2 * u * t * cpX + t * t * tp.x;
          const qy = u * u * sp.y + 2 * u * t * cpY + t * t * tp.y;
          i === 0 ? ctx.moveTo(qx, qy) : ctx.lineTo(qx, qy);
        }
        ctx.stroke();

        // Arrow head lands on target once arc is ~90% drawn
        if (progress > 0.88) {
          const t2 = 0.97, u2 = 1 - t2;
          const ax = u2 * u2 * sp.x + 2 * u2 * t2 * cpX + t2 * t2 * tp.x;
          const ay = u2 * u2 * sp.y + 2 * u2 * t2 * cpY + t2 * t2 * tp.y;
          const ang = Math.atan2(tp.y - ay, tp.x - ax);
          ctx.setLineDash([]);
          ctx.globalAlpha = Math.min(1, (progress - 0.88) / 0.12);
          arrowTip(tp.x, tp.y - R, ang, TC.successorBorder);
        }
        ctx.restore();
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. NODES
    // ═══════════════════════════════════════════════════════════════════════
    const drawNode = (n: TreeNode | null, x: number, y: number, off: number) => {
      if (!n) return;
      drawNode(n.left ?? null, x - off, y + LH, off / 2);
      drawNode(n.right ?? null, x + off, y + LH, off / 2);

      const v = n.value;
      const isVisited = visited.includes(v);
      const isFound = found === v;
      const isHighlight = highlight === v;
      const isInserting = insertingNode === v && operation === 'insert';
      const isDeleting = deletingNode === v && operation === 'delete';
      const isTarget = targetNode === v;
      const isSuccessor = successorNode === v;
      const isParent = comparingNodes?.parent === v;
      const isNewNode = comparingNodes?.child === v;
      const isRedNode = n.color === 'red';

      let dx = x, dy = y, scale = 1, opacity = 1;
      let fill = isRedNode ? 'rgba(239, 68, 68, 0.12)' : TC.defaultFill;
      let border = isRedNode ? '#ef4444' : TC.defaultBorder;
      let textC = isRedNode ? '#fca5a5' : TC.defaultText;
      let glow = '';
      let bw = 1.5, dashed = false, pulse2 = false;

      // Priority: inserting > deleting > target > successor > parent/new >
      //           found > highlight > visited
      if (isInserting && insertT.current) {
        const el = performance.now() - insertT.current;
        if (el < INSERT_DROP_MS) {
          const p = easeOut(el / INSERT_DROP_MS);
          scale = 0.1 + p * 0.9; opacity = p; dy = y - 90 * (1 - p);
        } else {
          const p2 = easeInOut((el - INSERT_DROP_MS) / INSERT_PULSE_MS);
          scale = 1 + (1 - p2) * 0.14;
        }
        fill = TC.insertFill; border = TC.insertBorder;
        textC = TC.insertText; glow = TC.insertGlow;
        bw = 2.5; pulse2 = true;

      } else if (isDeleting && deleteT.current) {
        const p = easeInOut(Math.min(1, (performance.now() - deleteT.current) / DELETE_FADE_MS));
        scale = 1 - p * 0.85; opacity = 1 - p; dy = y + p * 40;
        fill = TC.targetFill; border = TC.targetBorder;
        textC = TC.targetText; glow = TC.targetGlow;
        bw = 2.5; pulse2 = true; dashed = true;

      } else if (isTarget) {
        // Screenshot 1: red dashed pulsing ring — TARGET label below
        fill = TC.targetFill; border = TC.targetBorder;
        textC = TC.targetText; glow = TC.targetGlow;
        bw = 2.5; pulse2 = true; dashed = true;
        scale = 1 + pulse * 0.04;

      } else if (isSuccessor) {
        // Screenshot 1: amber solid — SUCCESSOR label below
        fill = TC.successorFill; border = TC.successorBorder;
        textC = TC.successorText; glow = TC.successorGlow;
        bw = 2.5; pulse2 = true;
        scale = 1 + pulse * 0.05;

      } else if (isParent) {
        // Screenshot 2: amber — "Index N (Parent)" below
        fill = TC.parentFill; border = TC.parentBorder;
        textC = TC.parentText; glow = TC.parentGlow;
        bw = 2.5; pulse2 = true;
        scale = 1 + pulse * 0.05;

      } else if (isNewNode) {
        // Screenshot 2: cyan — "Index N (New)" below
        fill = TC.insertFill; border = TC.insertBorder;
        textC = TC.insertText; glow = TC.insertGlow;
        bw = 2.5; pulse2 = true;
        scale = 1 + pulse * 0.05;

      } else if (isFound) {
        fill = TC.foundFill; border = TC.foundBorder;
        textC = TC.foundText; glow = TC.foundGlow;
        bw = 2.5; pulse2 = true; scale = 1 + pulse * 0.08;

      } else if (isHighlight) {
        fill = TC.parentFill; border = TC.parentBorder;
        textC = TC.parentText; glow = TC.parentGlow;
        bw = 2.5; pulse2 = true; scale = 1 + pulse * 0.05;

      } else if (isVisited) {
        fill = TC.visitedFill; border = TC.visitedBorder;
        textC = TC.visitedText; glow = TC.visitedGlow;
        bw = 2; pulse2 = true;
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      if (pulse2 && glow) { ctx.shadowColor = glow; ctx.shadowBlur = 14 + pulse * 12; }
      if (dashed) ctx.setLineDash([6, 4]);

      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(dx, dy, R * scale, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = bw; ctx.stroke();
      ctx.shadowBlur = 0; ctx.setLineDash([]);

      if (opacity > 0.12) {
        ctx.fillStyle = textC;
        ctx.font = `bold ${Math.max(11, 16 * scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v.toString(), dx, dy);
      }
      ctx.restore();

      // ── Floating labels outside circle ──────────────────────────────────

      // TARGET — red plain text below (screenshot 1)
      if (isTarget && !isDeleting) {
        txt('TARGET', dx, dy + R * scale + 14, TC.targetText, 10);
      }

      // SUCCESSOR — amber plain text below (screenshot 1)
      if (isSuccessor) {
        txt('SUCCESSOR', dx, dy + R * scale + 14, TC.successorText, 10);
      }

      // "Index N (Parent)" — amber below (screenshot 2)
      if (isParent && comparingNodes && operation === 'insert') {
        const p2 = pos.get(v);
        txt(`Index ${p2?.idx ?? 0} (Parent)`, dx, dy + R * scale + 14, TC.parentText, 10);
      }

      // "Index N (New)" — cyan below (screenshot 2)
      if (isNewNode && comparingNodes && operation === 'insert') {
        const p2 = pos.get(v);
        txt(`Index ${p2?.idx ?? 0} (New)`, dx, dy + R * scale + 14, TC.insertText, 10);
      }

      // "INSERTED ✓" floats above after drop (screenshot 2 style)
      if (isInserting && insertT.current) {
        const el = performance.now() - insertT.current;
        if (el > INSERT_DROP_MS && el < INSERT_DROP_MS + INSERT_PULSE_MS) {
          const p = (el - INSERT_DROP_MS) / INSERT_PULSE_MS;
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.fillStyle = TC.insertText;
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('INSERTED ✓', dx, dy - R - 16);
          ctx.restore();
        }
      }

      // "EXTRACTING" floats above while fading
      if (isDeleting && deleteT.current) {
        const p = Math.min(1, (performance.now() - deleteT.current) / DELETE_FADE_MS);
        if (p < 0.5) {
          ctx.save();
          ctx.globalAlpha = 1 - p * 2;
          ctx.fillStyle = TC.targetText;
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('EXTRACTING', dx, dy - R - 16);
          ctx.restore();
        }
      }
    };

    drawNode(tree, startX, startY, xOff);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. COMPARISON BADGE between two nodes
    //    Screenshot 2: "85 > 98?" dark pill between parent and new node
    //    Also generic highlight comparison badge
    // ═══════════════════════════════════════════════════════════════════════
    if (comparingNodes) {
      const pp = pos.get(comparingNodes.parent);
      const cp = pos.get(comparingNodes.child);
      if (pp && cp) {
        const midX = (pp.x + cp.x) / 2;
        const midY = (pp.y + cp.y) / 2;
        badgeBox(comparisonText || `${comparingNodes.child} > ${comparingNodes.parent}?`, midX, midY, TC.parentBorder);
      }
    } else if (highlight !== undefined && visited.length > 0) {
      const hp = pos.get(highlight);
      const lv = visited[visited.length - 1];
      const vp = pos.get(lv);
      if (hp && vp && highlight !== lv && Math.abs(hp.y - vp.y) <= LH + 5) {
        const midX = (hp.x + vp.x) / 2;
        const midY = (hp.y + vp.y) / 2;
        badgeBox(`${lv} > ${highlight}?`, midX, midY, TC.parentBorder);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. STATUS BADGE — bottom-left of canvas (screenshot 1: "● SWAP_PENDING")
    // ═══════════════════════════════════════════════════════════════════════
    if (statusBadge) {
      ctx.save();
      ctx.font = 'bold 11px "Courier New", monospace';
      const label2 = '● ' + statusBadge;
      const tw = ctx.measureText(label2).width;
      const bw2 = tw + 20, bh2 = 26;
      const bx = 16, by = H - 16 - bh2;
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(bx, by, bw2, bh2, 4);
      ctx.fillStyle = 'rgba(15,23,42,0.92)'; ctx.fill();
      ctx.strokeStyle = TC.parentBorder; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = TC.parentBorder;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label2, bx + 10, by + bh2 / 2);
      ctx.restore();
    }

  }, [
    data, visited, found, highlight, pulse, time, operation,
    insertingNode, deletingNode,
    targetNode, successorNode, statusBadge,
    comparingNodes,
    comparisonText,
    insertionCarrier,
  ]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
