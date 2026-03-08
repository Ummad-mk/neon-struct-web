import { useEffect, useMemo, useRef, useState } from 'react';
import { OperationInfo, DataStructureType } from '../types/dataStructures';
import { Code, FileText, BookOpen, ChevronLeft, ChevronRight, Map as MapIcon, Crosshair, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DSInfo } from './info';
import { COLORS } from '../utils/colors';

interface Props {
  operationInfo: OperationInfo;
  activeDS: DataStructureType | 'singly_linked_list';
  viewport?: { x: number; y: number; scale: number };
  onViewportChange: (v: { x: number; y: number; scale: number }) => void;
  visualizationData: any;
  minimapMeta: {
    visited: number[];
    found?: number;
    highlight?: number;
    operation: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
    insertingNode?: number;
    deletingNode?: number;
  };
  onViewCode: (mode: 'full' | 'current') => void;
  onViewPseudoCode: (mode: 'full' | 'current') => void;
  onViewAlgorithm: (mode: 'full' | 'current') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const getOpKey = (name: string): string | null => {
  const n = name.toLowerCase();
  if (n.includes('insert') || (n.includes('add') && !n.includes('edge')) || n.includes('push') || n.includes('enqueue') || n.includes('random')) return 'insert';
  if ((n.includes('delet') || n.includes('remove')) && n.includes('edge')) return 'delete_edge';
  if (n.includes('delet') || n.includes('remove') || n.includes('pop') || n.includes('dequeue')) return 'delete';
  if (n.includes('shortest') && n.includes('path')) return 'shortest_path';
  if (n.includes('path')) return 'find_path';
  if ((n.includes('search') || n.includes('find')) && !n.includes('path')) return 'search';
  if (n.includes('peek')) return 'peek';
  if (n.includes('priority')) return 'change_priority';
  if (n.includes('traverse') || n.includes('bfs') || n.includes('dfs') || n.includes('inorder') || n.includes('preorder') || n.includes('postorder') || n.includes('levelorder')) return 'traverse';
  if (n.includes('mst') && n.includes('prim')) return 'minimum_spanning_tree';
  if (n.includes('mst') && n.includes('kruskal')) return 'kruskals_mst';
  if (n.includes('topological')) return 'topological_sort';
  if (n.includes('add') && n.includes('edge')) return 'add_edge';
  return null;
};

export function OperationPanel({
  operationInfo, activeDS, viewport = { x: 0, y: 0, scale: 1 },
  onViewportChange, visualizationData, minimapMeta,
  onViewCode, onViewPseudoCode, onViewAlgorithm,
  isCollapsed, onToggleCollapse,
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const border = isLight ? 'border-gray-200' : 'border-gray-800';
  const panelBg = isLight ? 'bg-white' : 'bg-[#0a1120]';
  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-gray-400';
  const rowBg = isLight ? 'bg-gray-50 border-gray-200' : 'bg-gray-900/40 border-gray-800';

  const minimapRef = useRef<HTMLDivElement>(null);
  const [minimapCollapsed, setMinimapCollapsed] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const [isLensDragging, setIsLensDragging] = useState(false);

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
  const panFactor = 0.025;
  const lensCenterX = clamp(50 - viewport.x * panFactor, 0, 100);
  const lensCenterY = clamp(50 - viewport.y * panFactor, 0, 100);
  const lensWidth = clamp(12, 28 / viewport.scale, 40);
  const lensHeight = clamp(10, 20 / viewport.scale, 34);

  const opKey = getOpKey(operationInfo.name);
  const dsInfo = DSInfo[activeDS];
  const liveCode = opKey && dsInfo?.code && typeof dsInfo.code === 'object'
    ? (dsInfo.code as any)[opKey]
    : null;

  const opColor = minimapMeta.found !== undefined
    ? '#22c55e'
    : minimapMeta.operation === 'insert'
      ? '#06b6d4'
      : minimapMeta.operation === 'delete'
        ? '#ef4444'
        : isLight ? '#e2e8f0' : '#334155';

  const zoomLabel = viewport.scale >= 1
    ? `${viewport.scale.toFixed(2)}x`
    : `${Math.round(viewport.scale * 100)}%`;

  const getPercentFromClient = (clientX: number, clientY: number) => {
    const rect = minimapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    return { px, py };
  };

  const updateViewportFromPercent = (px: number, py: number) => {
    const x = (50 - px) / panFactor;
    const y = (50 - py) / panFactor;
    onViewportChange({ x, y, scale: viewport.scale });
  };

  useEffect(() => {
    if (!isLensDragging) return;
    const handleMove = (e: MouseEvent) => {
      const pos = getPercentFromClient(e.clientX, e.clientY);
      if (!pos) return;
      updateViewportFromPercent(pos.px, pos.py);
    };
    const handleUp = () => setIsLensDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isLensDragging, viewport.scale]);

  const minimapNodes = useMemo(() => {
    const data = visualizationData;
    if (!data) return [];
    const nodes: { id: string; x: number; y: number; stateKey: number }[] = [];

    if (activeDS === 'singly_linked_list' || activeDS === 'doubly_linked_list') {
      const list = data.nodes || [];
      const count = list.length;
      list.forEach((_val: number, idx: number) => {
        const x = count <= 1 ? 50 : 10 + (idx / (count - 1)) * 80;
        nodes.push({ id: `${idx}`, x, y: 55, stateKey: idx });
      });
    } else if (activeDS === 'queue' || activeDS === 'deque' || activeDS === 'priority_queue') {
      const items = data.items || [];
      const count = items.length;
      items.forEach((_val: number, idx: number) => {
        const x = count <= 1 ? 50 : 10 + (idx / (count - 1)) * 80;
        nodes.push({ id: `${idx}`, x, y: 60, stateKey: idx });
      });
    } else if (activeDS === 'stack') {
      const items = data.items || [];
      const count = items.length;
      items.forEach((_val: number, idx: number) => {
        const y = count <= 1 ? 60 : 85 - (idx / (count - 1)) * 60;
        nodes.push({ id: `${idx}`, x: 50, y, stateKey: idx });
      });
    } else if (activeDS === 'bst' || activeDS === 'avl') {
      const tree = data.tree;
      if (tree) {
        const order: { value: number; depth: number }[] = [];
        const walk = (node: any, depth: number) => {
          if (!node) return;
          walk(node.left || null, depth + 1);
          order.push({ value: node.value, depth });
          walk(node.right || null, depth + 1);
        };
        walk(tree, 0);
        const maxDepth = Math.max(1, ...order.map(n => n.depth));
        const count = order.length;
        order.forEach((node, idx) => {
          const x = count <= 1 ? 50 : 10 + (idx / (count - 1)) * 80;
          const y = 15 + (node.depth / maxDepth) * 70;
          nodes.push({ id: `${node.value}-${idx}`, x, y, stateKey: node.value });
        });
      }
    } else if (activeDS === 'graph' || activeDS === 'directed_graph') {
      const verts = data.vertices || [];
      const count = verts.length;
      verts.forEach((v: number, idx: number) => {
        const angle = (idx * 2 * Math.PI) / Math.max(1, count) - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 35;
        const y = 50 + Math.sin(angle) * 35;
        nodes.push({ id: `${v}`, x, y, stateKey: v });
      });
    }

    const visitedSet = new Set(minimapMeta.visited || []);
    return nodes.map(node => {
      let color = COLORS.default;
      if (minimapMeta.operation === 'delete' && minimapMeta.deletingNode === node.stateKey) color = COLORS.deleting;
      else if (minimapMeta.operation === 'insert' && minimapMeta.insertingNode === node.stateKey) color = COLORS.inserting;
      else if (minimapMeta.found === node.stateKey) color = COLORS.found;
      else if (minimapMeta.highlight === node.stateKey) color = COLORS.visiting;
      else if (visitedSet.has(node.stateKey)) color = COLORS.visited;

      const pulse = minimapMeta.highlight === node.stateKey && (minimapMeta.operation === 'search' || minimapMeta.operation === 'traverse');
      const glow = minimapMeta.found === node.stateKey;
      return { ...node, color, pulse, glow };
    });
  }, [visualizationData, activeDS, minimapMeta]);

  const handleMinimapClick = (e: any) => {
    const pos = getPercentFromClient(e.clientX, e.clientY);
    if (!pos) return;
    updateViewportFromPercent(pos.px, pos.py);
  };

  const handleMinimapMove = (e: any) => {
    const pos = getPercentFromClient(e.clientX, e.clientY);
    if (!pos) return;
    const x = Math.round((50 - pos.px) / panFactor);
    const y = Math.round((50 - pos.py) / panFactor);
    setHoverPoint({ x, y, px: pos.px, py: pos.py });
  };

  const handleMinimapLeave = () => setHoverPoint(null);

  const handleLensDown = (e: any) => {
    e.stopPropagation();
    setIsLensDragging(true);
    const pos = getPercentFromClient(e.clientX, e.clientY);
    if (pos) updateViewportFromPercent(pos.px, pos.py);
  };

  const handleResetView = () => onViewportChange({ x: 0, y: 0, scale: 1 });

  const handleFitAll = () => {
    const viewportWidth = window.innerWidth * 0.55;
    const viewportHeight = window.innerHeight * 0.7;
    let targetScale = 1;
    if (activeDS === 'singly_linked_list' || activeDS === 'doubly_linked_list') {
      const count = (visualizationData?.nodes || []).length;
      const totalWidth = 100 + Math.max(0, count - 1) * 160 + 80 + 100;
      targetScale = clamp(viewportWidth / Math.max(1, totalWidth), 0.4, 1);
    } else if (activeDS === 'queue' || activeDS === 'deque' || activeDS === 'priority_queue') {
      const count = (visualizationData?.items || []).length;
      const totalWidth = 120 + Math.max(0, count - 1) * 120 + 120;
      targetScale = clamp(viewportWidth / Math.max(1, totalWidth), 0.45, 1);
    } else if (activeDS === 'stack') {
      const count = (visualizationData?.items || []).length;
      const totalHeight = 200 + Math.max(0, count - 1) * 68 + 80;
      targetScale = clamp(viewportHeight / Math.max(1, totalHeight), 0.45, 1);
    } else if (activeDS === 'bst' || activeDS === 'avl') {
      const depthWalk = (node: any): number => node ? 1 + Math.max(depthWalk(node.left || null), depthWalk(node.right || null)) : 0;
      const depth = depthWalk(visualizationData?.tree || null);
      const totalHeight = 100 + depth * 80;
      const totalWidth = Math.pow(2, Math.max(1, depth - 1)) * 60;
      targetScale = clamp(Math.min(viewportWidth / Math.max(1, totalWidth), viewportHeight / Math.max(1, totalHeight)), 0.4, 1);
    } else if (activeDS === 'graph' || activeDS === 'directed_graph') {
      const count = (visualizationData?.vertices || []).length;
      targetScale = count > 18 ? 0.7 : count > 10 ? 0.85 : 1;
    }
    onViewportChange({ x: 0, y: 0, scale: targetScale });
  };

  return (
    <div className={`${panelBg} border-l ${border} transition-all duration-300 ${isCollapsed ? 'w-14' : 'w-72'} flex flex-col`}>

      {/* Header */}
      <div className={`px-3 py-3 border-b ${border} flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <h2 className={`text-xs font-bold tracking-widest uppercase ${textMuted}`}>Operation Info</h2>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-gray-800'}`}
        >
          {isCollapsed ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          {/* Current Operation */}
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${textMuted}`}>Current Operation</p>
            <div className={`px-3 py-2 rounded-lg border text-sm font-semibold ${operationInfo.name === 'Ready'
                ? `${rowBg} ${textMuted}`
                : isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
              {operationInfo.name === 'Ready' ? '— Idle —' : operationInfo.name.toUpperCase()}
            </div>
          </div>

          {/* Stats row */}
          <div className={`flex gap-2`}>
            <div className={`flex-1 px-3 py-2.5 rounded-lg border text-center ${rowBg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${textMuted}`}>Steps</p>
              <p className={`text-lg font-black font-mono ${textPrimary}`}>{operationInfo.stepCount}</p>
            </div>
            <div className={`flex-1 px-3 py-2.5 rounded-lg border text-center ${rowBg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${textMuted}`}>Time</p>
              <p className={`text-sm font-bold font-mono ${operationInfo.currentComplexity === '-' ? textMuted : 'text-cyan-500'}`}>
                {operationInfo.currentComplexity}
              </p>
            </div>
            <div className={`flex-1 px-3 py-2.5 rounded-lg border text-center ${rowBg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${textMuted}`}>Space</p>
              <p className={`text-sm font-bold font-mono ${operationInfo.spaceComplexity ? 'text-blue-500' : textMuted}`}>
                {operationInfo.spaceComplexity ?? '-'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`} />

          {/* Documentation buttons */}
          <div className="space-y-1.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>View Docs</p>
            <DocButton label="Algorithm" icon={<BookOpen size={14} />} onFull={() => onViewAlgorithm('full')} onCurrent={() => onViewAlgorithm('current')} isLight={isLight} />
            <DocButton label="Code" icon={<Code size={14} />} onFull={() => onViewCode('full')} onCurrent={() => onViewCode('current')} isLight={isLight} />
            <DocButton label="Pseudocode" icon={<FileText size={14} />} onFull={() => onViewPseudoCode('full')} onCurrent={() => onViewPseudoCode('current')} isLight={isLight} />
          </div>

          {/* Live Code snippet */}
          {liveCode && (
            <>
              <div className={`h-px ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textMuted}`}>Live Code</p>
                <div className="rounded-lg overflow-hidden border border-gray-800">
                  <div className="bg-[#111827] px-3 py-1.5 flex items-center gap-1.5 border-b border-gray-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-1 text-[10px] text-gray-500 font-mono">{opKey}.cpp</span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-blue-300 bg-[#0a0f1a] leading-relaxed overflow-auto max-h-40 whitespace-pre-wrap">
                    {liveCode}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mini Map */}
          <div>
            <div className={`flex items-center justify-between mb-2 ${textMuted}`}>
              <div className="flex items-center gap-2">
                <MapIcon size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Mini Map</span>
              </div>
              <button
                onClick={() => setMinimapCollapsed(!minimapCollapsed)}
                className={`p-1 rounded-md transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-gray-800 text-gray-500'}`}
              >
                {minimapCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            {!minimapCollapsed && (
              <>
                <div
                  ref={minimapRef}
                  className={`group w-full h-36 rounded-xl border relative overflow-hidden ${rowBg} ${isLight ? 'bg-white/60' : 'bg-[#0b1424]/60'} backdrop-blur-md minimap-float transition-transform duration-200 hover:scale-[1.01]`}
                  style={{ borderColor: opColor, boxShadow: `0 0 0 1px ${opColor}, 0 0 12px ${opColor}55` }}
                  onClick={handleMinimapClick}
                  onMouseMove={handleMinimapMove}
                  onMouseLeave={handleMinimapLeave}
                >
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'linear-gradient(#1e293b 1px,transparent 1px),linear-gradient(90deg,#1e293b 1px,transparent 1px)', backgroundSize: '8px 8px' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 minimap-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-500/40 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                  </div>
                  {minimapNodes.map(node => (
                    <div key={node.id} className="absolute" style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%,-50%)' }}>
                      {node.pulse && (
                        <span className="absolute inline-flex h-3 w-3 rounded-full animate-ping" style={{ backgroundColor: node.color, opacity: 0.6 }} />
                      )}
                      <span
                        className="block w-1.5 h-1.5 rounded-full minimap-dot transition-transform duration-200 group-hover:scale-125"
                        style={{ backgroundColor: node.color, boxShadow: node.glow ? `0 0 6px ${node.color}` : 'none' }}
                      />
                    </div>
                  ))}
                  {hoverPoint && (
                    <div
                      className={`absolute pointer-events-none px-2 py-1 rounded-md text-[10px] font-mono border ${isLight ? 'bg-white text-gray-700 border-gray-200' : 'bg-[#0a1120] text-gray-200 border-gray-700'}`}
                      style={{ left: `${hoverPoint.px}%`, top: `${hoverPoint.py}%`, transform: 'translate(-50%, -120%)' }}
                    >
                      x: {hoverPoint.x}, y: {hoverPoint.y}
                    </div>
                  )}
                  <div
                    className="absolute border rounded transition-all duration-75 minimap-lens"
                    style={{
                      top: `${lensCenterY}%`,
                      left: `${lensCenterX}%`,
                      width: `${lensWidth}%`,
                      height: `${lensHeight}%`,
                      transform: 'translate(-50%,-50%)',
                      borderColor: opColor,
                      backgroundColor: `${opColor}22`,
                    }}
                    onMouseDown={handleLensDown}
                  >
                    <Crosshair size={9} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70" />
                  </div>
                </div>
                <div className={`mt-2 flex items-center justify-between text-[10px] ${textMuted}`}>
                  <span className="font-mono">{zoomLabel}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleFitAll}
                      className={`px-2 py-1 rounded border transition-colors ${isLight ? 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300' : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:border-blue-500/50'}`}
                    >
                      Fit All
                    </button>
                    <button
                      onClick={handleResetView}
                      className={`px-2 py-1 rounded border transition-colors ${isLight ? 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300' : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:border-blue-500/50'}`}
                    >
                      Reset View
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

function DocButton({ label, icon, onFull, onCurrent, isLight }: {
  label: string; icon: any; onFull: () => void; onCurrent: () => void; isLight: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${isLight
            ? `bg-gray-50 border-gray-200 text-gray-700 hover:border-cyan-300 ${open ? 'ring-1 ring-cyan-300' : ''}`
            : `bg-gray-800/40 border-gray-700 text-gray-300 hover:border-blue-500/50 ${open ? 'ring-1 ring-blue-500/50' : ''}`
          }`}
      >
        <div className="flex items-center gap-2">{icon}<span className="font-medium">{label}</span></div>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-30 overflow-hidden ${isLight ? 'bg-white border-gray-200' : 'bg-[#1e293b] border-gray-700'
          }`}>
          <button onClick={() => { onFull(); setOpen(false); }} className={`w-full text-left px-3 py-2 text-xs border-b transition-colors ${isLight ? 'hover:bg-gray-50 text-gray-600 border-gray-100' : 'hover:bg-gray-700/50 text-gray-300 border-gray-700/50'
            }`}>
            Full {label}
          </button>
          <button onClick={() => { onCurrent(); setOpen(false); }} className={`w-full text-left px-3 py-2 text-xs text-cyan-500 transition-colors ${isLight ? 'hover:bg-cyan-50' : 'hover:bg-cyan-500/10'
            }`}>
            Current Step Only
          </button>
        </div>
      )}
    </div>
  );
}
