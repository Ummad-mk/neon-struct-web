import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    data: any;
    operation?: string | null;
}

export function HeapViz({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // State for animations
    const animationFrameRef = useRef<number>();
    const [pulse, setPulse] = useState(0);

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

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let foundIndex: number | null = null;

        // Check tree nodes
        for (const { i, cx, cy, radius } of nodePositionsRef.current) {
            if (Math.hypot(cx - x, cy - y) <= radius) {
                foundIndex = i;
                break;
            }
        }

        // Check array nodes
        if (foundIndex === null) {
            for (const { i, ax, ay, aw, ah } of arrayPositionsRef.current) {
                if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
                    foundIndex = i;
                    break;
                }
            }
        }

        setHoveredIndex(foundIndex);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    // We store positions during render so mouse events can use them
    const nodePositionsRef = useRef<Array<{ i: number; cx: number; cy: number; radius: number }>>([]);
    const arrayPositionsRef = useRef<Array<{ i: number; ax: number; ay: number; aw: number; ah: number }>>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, rect.width, rect.height);

        const heapArray = data.heap_array || [];
        if (heapArray.length === 0) return;

        // ----- Colors configuration -----
        const textColor = isLight ? '#1e293b' : '#f8fafc';
        const subtleText = isLight ? '#94a3b8' : '#64748b';
        const edgeColor = isLight ? '#cbd5e1' : '#334155';

        const nodeDefaultFill = isLight ? '#1e293b' : '#334155';
        const nodeDefaultText = '#ffffff';
        const nodeActiveFill = '#f59e0b'; // Orange
        const nodeChildFill = isLight ? '#fed7aa' : '#b45309'; // Light orange/Peach
        const nodeParentFill = '#ea580c'; // Darker orange

        const arrayBoxBorder = isLight ? '#e2e8f0' : '#1e293b';
        const arrayBoxFill = isLight ? '#ffffff' : '#1e293b';

        // Layout config
        const treeHeightRatio = 0.6;
        const treeViewHeight = rect.height * treeHeightRatio;

        // --- 1. Draw Logical Structure (Binary Tree) ---

        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Logical Structure: Binary Tree', 30, 20);

        // Legend
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';

        // Child legend
        const legendX = rect.width - 30;
        ctx.fillStyle = subtleText;
        ctx.fillText('Child', legendX, 22);
        ctx.fillStyle = nodeChildFill;
        ctx.beginPath(); ctx.arc(legendX - 45, 28, 6, 0, Math.PI * 2); ctx.fill();

        // Parent legend
        ctx.fillStyle = subtleText;
        ctx.fillText('Parent', legendX - 70, 22);
        ctx.fillStyle = nodeParentFill;
        ctx.beginPath(); ctx.arc(legendX - 120, 28, 6, 0, Math.PI * 2); ctx.fill();

        const nodeRadius = 24;
        const levelHeight = 70;
        const n = heapArray.length;

        nodePositionsRef.current = [];

        const drawTreeNode = (i: number, x: number, y: number, xOffset: number) => {
            if (i >= n) return;

            const leftChildIdx = 2 * i + 1;
            const rightChildIdx = 2 * i + 2;

            const hasLeft = leftChildIdx < n;
            const hasRight = rightChildIdx < n;

            let isHovered = hoveredIndex === i;
            let isParentOfHovered = hoveredIndex !== null && (Math.floor((hoveredIndex - 1) / 2) === i);
            let isChildOfHovered = hoveredIndex !== null && (leftChildIdx === hoveredIndex || rightChildIdx === hoveredIndex);

            // Draw edges
            if (hasLeft) {
                const childX = x - xOffset;
                const childY = y + levelHeight;

                ctx.strokeStyle = edgeColor;
                ctx.lineWidth = 1.5;
                if (isHovered || isChildOfHovered && hoveredIndex === leftChildIdx) {
                    ctx.strokeStyle = nodeChildFill;
                    ctx.lineWidth = 2.5;
                } else if (isHovered || isParentOfHovered && hoveredIndex === leftChildIdx) {
                    ctx.strokeStyle = nodeParentFill;
                }

                ctx.beginPath();
                // Curved edge
                ctx.moveTo(x, y + nodeRadius);
                ctx.quadraticCurveTo(x, childY - nodeRadius - 20, childX, childY - nodeRadius);
                ctx.stroke();

                drawTreeNode(leftChildIdx, childX, childY, xOffset / 2);
            }

            if (hasRight) {
                const childX = x + xOffset;
                const childY = y + levelHeight;

                ctx.strokeStyle = edgeColor;
                ctx.lineWidth = 1.5;
                if (isHovered || isChildOfHovered && hoveredIndex === rightChildIdx) {
                    ctx.strokeStyle = nodeChildFill;
                    ctx.lineWidth = 2.5;
                }

                ctx.beginPath();
                ctx.moveTo(x, y + nodeRadius);
                ctx.quadraticCurveTo(x, childY - nodeRadius - 20, childX, childY - nodeRadius);
                ctx.stroke();

                drawTreeNode(rightChildIdx, childX, childY, xOffset / 2);
            }

            // Draw ghost nodes for complete binary tree visualization
            if (isHovered && (!hasLeft || !hasRight)) {
                if (!hasLeft && leftChildIdx < n + 2) { // just show immediate next empty spots
                    const cx = x - xOffset; const cy = y + levelHeight;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeStyle = edgeColor;
                    ctx.beginPath(); ctx.moveTo(x, y + nodeRadius); ctx.lineTo(cx, cy - nodeRadius); ctx.stroke();

                    ctx.beginPath(); ctx.arc(cx, cy, nodeRadius, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = subtleText;
                    ctx.font = 'italic 12px Inter, sans-serif';
                    ctx.fillText('nil', cx, cy);
                }
            }

            // Draw node
            nodePositionsRef.current.push({ i, cx: x, cy: y, radius: nodeRadius });

            let fillColor = nodeDefaultFill;
            let nodeBorderColor = 'transparent';
            let borderW = 0;

            if (isHovered) {
                fillColor = nodeActiveFill;
                nodeBorderColor = isLight ? '#fed7aa' : '#b45309';
                borderW = 4;
            } else if (isParentOfHovered) {
                fillColor = nodeParentFill;
            } else if (isChildOfHovered) {
                fillColor = nodeChildFill;
            }

            // Glow
            if (isHovered) {
                ctx.shadowColor = nodeActiveFill;
                ctx.shadowBlur = 10 + pulse * 10;
            }

            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fill();

            if (borderW > 0) {
                ctx.strokeStyle = nodeBorderColor;
                ctx.lineWidth = borderW;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            ctx.fillStyle = nodeDefaultText;
            ctx.font = 'bold 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const val = typeof heapArray[i] === 'object' ? heapArray[i].value : heapArray[i];
            ctx.fillText(String(val), x, y);

            // Index below
            ctx.fillStyle = subtleText;
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.fillText(`Index ${i}`, x, y + nodeRadius + 14);
        };

        const startX = rect.width / 2;
        const startY = 80;
        const initialOffset = Math.max(120, (rect.width - 100) / 4);

        drawTreeNode(0, startX, startY, initialOffset);

        // --- 2. Draw Physical Storage (Array Representation) ---
        const arrayStartY = treeViewHeight;

        // Separator line
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, arrayStartY);
        ctx.lineTo(rect.width - 30, arrayStartY);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Physical Storage: Array Representation', 30, arrayStartY + 30);

        const boxW = Math.min(60, (rect.width - 160) / (n + 1));
        const boxH = 60;
        const arrayStartX = 120; // Room for "INDICES / VALUES" labels
        const arrayBoxesY = arrayStartY + 80;

        // Row labels
        ctx.fillStyle = subtleText;
        ctx.font = 'bold 10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('INDICES', 100, arrayBoxesY - 10);
        ctx.fillText('VALUES', 100, arrayBoxesY + boxH / 2);
        ctx.fillText('LOGIC (i)', 100, arrayBoxesY + boxH + 20);

        arrayPositionsRef.current = [];

        for (let i = 0; i <= n; i++) {
            const x = arrayStartX + i * boxW;
            const y = arrayBoxesY;

            if (i === n) {
                // Draw empty slot indicator at the end
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = edgeColor;
                ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 4); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = subtleText;
                ctx.textAlign = 'center';
                ctx.fillText('-', x + boxW / 2, y + boxH / 2);
                continue;
            }

            arrayPositionsRef.current.push({ i, ax: x, ay: y, aw: boxW, ah: boxH });

            let bgColor = arrayBoxFill;
            let bColor = arrayBoxBorder;
            let tColor = textColor;
            let logicText = '';
            let logicColor = subtleText;

            const isHovered = hoveredIndex === i;
            const isParentOfHovered = hoveredIndex !== null && (Math.floor((hoveredIndex - 1) / 2) === i);
            const isChildOfHovered = hoveredIndex !== null && ((2 * hoveredIndex + 1 === i) || (2 * hoveredIndex + 2 === i));

            if (isHovered) {
                bgColor = nodeActiveFill;
                bColor = nodeActiveFill;
                tColor = '#ffffff';
                logicText = 'You are here';
                logicColor = nodeActiveFill;
            } else if (isParentOfHovered) {
                bgColor = nodeDefaultFill;
                tColor = '#ffffff';
                logicText = `Parent: ${i}`;
                logicColor = nodeParentFill;
            } else if (isChildOfHovered) {
                bgColor = nodeDefaultFill;
                tColor = '#ffffff';
                logicText = (2 * hoveredIndex + 1 === i) ? `Left Child: ${i}` : `Right Child: ${i}`;
                logicColor = nodeChildFill;
            } else {
                logicText = '-';
            }

            // Draw box
            ctx.fillStyle = bgColor;
            ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 4); ctx.fill();
            ctx.strokeStyle = bColor;
            ctx.lineWidth = 1; ctx.stroke();

            // Index
            ctx.fillStyle = subtleText;
            ctx.textAlign = 'center';
            ctx.fillText(String(i), x + boxW / 2, y - 10);

            // Value
            const val = typeof heapArray[i] === 'object' ? heapArray[i].value : heapArray[i];
            ctx.fillStyle = tColor;
            ctx.font = 'bold 20px Inter, system-ui, sans-serif';
            ctx.fillText(String(val), x + boxW / 2, y + boxH / 2);

            // Logic notation
            ctx.fillStyle = logicColor;
            ctx.font = 'bold 9px Inter, system-ui, sans-serif';

            // Handle text wrap for logic if needed, but it's usually short
            const words = logicText.split(': ');
            if (words.length > 1) {
                ctx.fillText(words[0] + ':', x + boxW / 2, y + boxH + 15);
                ctx.fillText(words[1], x + boxW / 2, y + boxH + 28);
            } else {
                ctx.fillText(logicText, x + boxW / 2, y + boxH + 20);
            }
        }

        // Instructions
        ctx.fillStyle = subtleText;
        ctx.font = 'italic 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('* Hover over a node to see its relationship calculations', 30, rect.height - 20);

    }, [data, hoveredIndex, isLight, pulse]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        />
    );
}
