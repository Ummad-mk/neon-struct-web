import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Pause, Play, Search, SkipBack, SkipForward, Trash2, XCircle, RotateCw } from 'lucide-react';

interface Props {
  data: any;
  onInsert?: (val: number) => Promise<any>;
  onDelete?: (val?: number | string) => Promise<any>;
  onSearch?: (val: number) => Promise<any>;
  onAddRandom?: () => Promise<any>;
  onClear?: () => void;
  onViewCode?: (mode: 'full' | 'current') => void;
  onViewPseudoCode?: (mode: 'full' | 'current') => void;
  onViewAlgorithm?: (mode: 'full' | 'current') => void;
  isAnimating?: boolean;
}

type RBNode = {
  value: number;
  color?: 'red' | 'black';
  left?: RBNode | null;
  right?: RBNode | null;
};

type PositionedNode = {
  value: number;
  color: 'red' | 'black';
  x: number;
  y: number;
  depth: number;
  parent?: number;
};

export function RedBlackTreeViz({
  data,
  onInsert,
  onDelete,
  onSearch,
  onAddRandom,
  onClear,
  onViewCode,
  onViewPseudoCode,
  onViewAlgorithm,
  isAnimating
}: Props) {
  const [valueText, setValueText] = useState('');
  const [speed, setSpeed] = useState(0.5);
  const [docMode, setDocMode] = useState<'full' | 'current'>('current');
  const [frames, setFrames] = useState<any[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [manualState, setManualState] = useState<any | null>(null);

  const frame = frames.length ? frames[Math.min(frameIdx, frames.length - 1)] : null;
  const frameState = frame?.state || null;
  const view = manualState || frameState || data || {};
  const tree: RBNode | null = (view?.tree as RBNode | null) ?? null;
  const focus = view?.focus_nodes || {};
  const propsState = view?.rb_properties || { root_black: true, no_red_red: true, black_height_uniform: true };
  const stats = view?.rb_stats || { left_height: 0, right_height: 0 };
  const opState = view?.current_operation || {};
  const opType = (opState?.type || 'insertion').toString().toUpperCase();
  const opValue = opState?.value ?? (typeof view?.found === 'number' ? view.found : '-');
  const opKind = (opState?.type || '').toString().toLowerCase();
  const highlightValue = typeof view?.highlight === 'number' ? view.highlight : undefined;
  const currentCase = view?.current_case || 'Waiting for operation';
  const caseDetail = view?.case_detail || (frame?.state?.description || '');

  // Animation playback
  useEffect(() => {
    if (!frames.length || !playing) return;
    const ms = Math.max(140, 840 - Math.round(speed * 900));
    const t = setTimeout(() => {
      setFrameIdx(prev => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);
    return () => clearTimeout(t);
  }, [playing, frameIdx, frames, speed]);

  useEffect(() => {
    if (!playing) setManualState(null);
  }, [playing]);

  const maxDepth = useMemo(() => {
    const depth = (node: RBNode | null | undefined): number => {
      if (!node) return 0;
      return 1 + Math.max(depth(node.left || null), depth(node.right || null));
    };
    return Math.max(0, depth(tree) - 1);
  }, [tree]);

  const levelGap = maxDepth >= 5 ? 102 : maxDepth >= 4 ? 110 : 124;
  const initialOffset = maxDepth >= 5 ? 15 : 18;
  const treeScale = maxDepth <= 3 ? 1 : maxDepth === 4 ? 0.9 : maxDepth === 5 ? 0.8 : 0.72;
  const treeTranslateY = maxDepth <= 3 ? 0 : -(maxDepth - 3) * 26;

  const positioned = useMemo(() => {
    const nodes: PositionedNode[] = [];
    const walk = (node: RBNode | null | undefined, x: number, y: number, offset: number, depth: number, parent?: number) => {
      if (!node) return;
      nodes.push({ value: node.value, color: node.color === 'red' ? 'red' : 'black', x, y, depth, parent });
      walk(node.left || null, x - offset, y + levelGap, offset * 0.58, depth + 1, node.value);
      walk(node.right || null, x + offset, y + levelGap, offset * 0.58, depth + 1, node.value);
    };
    walk(tree, 50, 90, initialOffset, 0);
    return nodes;
  }, [tree, levelGap, initialOffset]);

  const nodeByValue = useMemo(() => {
    const m = new Map<number, PositionedNode>();
    positioned.forEach(n => m.set(n.value, n));
    return m;
  }, [positioned]);

  const nilBadges = useMemo(() => {
    if (!tree) return [] as Array<{ x: number; y: number }>;
    const out: Array<{ x: number; y: number }> = [];
    const addNil = (node: RBNode | null | undefined, x: number, y: number, offset: number) => {
      if (!node) return;
      const isFocus = node.value === focus?.new_node || node.value === focus?.parent || node.value === focus?.uncle || node.value === focus?.grandparent;
      if (isFocus) {
        if (!node.left) out.push({ x: x - Math.max(5, offset * 0.44), y: y + 74 });
        if (!node.right) out.push({ x: x + Math.max(5, offset * 0.44), y: y + 74 });
      }
      addNil(node.left || null, x - offset, y + levelGap, offset * 0.58);
      addNil(node.right || null, x + offset, y + levelGap, offset * 0.58);
    };
    addNil(tree, 50, 90, initialOffset);
    return out;
  }, [tree, focus, levelGap, initialOffset]);

  const runWithFrames = async (fn: () => Promise<any>) => {
    const result = await fn();
    const steps = Array.isArray(result?.steps) ? result.steps : [];
    if (steps.length) {
      setFrames(steps);
      setFrameIdx(0);
      setManualState(steps[0]?.state || null);
      setPlaying(true);
    } else {
      setFrames([]);
      setFrameIdx(0);
      setManualState(result?.state || null);
      setPlaying(false);
    }
  };

  const parseValue = () => {
    const n = parseInt(valueText.trim(), 10);
    if (Number.isNaN(n)) return null;
    return n;
  };

  const onInsertClick = async () => {
    if (!onInsert) return;
    const n = parseValue();
    if (n === null) return;
    await runWithFrames(() => onInsert(n));
  };

  const onDeleteClick = async () => {
    if (!onDelete) return;
    const n = parseValue();
    if (n === null) return;
    await runWithFrames(() => onDelete(n));
  };

  const onSearchClick = async () => {
    if (!onSearch) return;
    const n = parseValue();
    if (n === null) return;
    await runWithFrames(() => onSearch(n));
  };

  const activeSet = new Set<number>([focus?.new_node, focus?.parent, focus?.uncle, focus?.grandparent].filter((v: any) => typeof v === 'number'));

  return (
    <div className="w-full h-full min-h-[720px] rounded-2xl overflow-hidden border border-[#2d1f16] bg-[#12100e] text-[#f3efe9] relative">
      {/* Animations CSS */}
      <style>{`
        /* Node Animations */
        @keyframes nodeInsert {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          70% { transform: translate(-50%, -50%) scale(0.95); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes nodeSearch {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(255, 196, 94, 0.5); }
          50% { transform: translate(-50%, -50%) scale(1.08); box-shadow: 0 0 0 12px rgba(255, 196, 94, 0); }
        }
        @keyframes nodeDelete {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          25% { transform: translate(-50%, -50%) scale(1.1) rotate(-5deg); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.05) rotate(5deg); opacity: 0.8; }
          75% { transform: translate(-50%, -50%) scale(0.95) rotate(-3deg); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(0.8) rotate(0deg); opacity: 0.3; }
        }
        @keyframes nodeRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          30% { transform: translate(-50%, -50%) rotate(-15deg) scale(1.05); }
          60% { transform: translate(-50%, -50%) rotate(10deg) scale(1.02); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        }
        @keyframes colorFlip {
          0% { filter: brightness(1); }
          30% { filter: brightness(2) saturate(1.5); }
          60% { filter: brightness(0.8); }
          100% { filter: brightness(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px currentColor, 0 0 30px currentColor; opacity: 1; }
          50% { box-shadow: 0 0 25px currentColor, 0 0 50px currentColor; opacity: 0.8; }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; border-width: 2px; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div className="h-12 px-4 border-b border-[#2a211a] flex items-center justify-between bg-[#171310]">
        <div className="text-sm font-black tracking-[0.16em] uppercase text-[#a79a8b]">Red-Black Tree</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-[#3a2a20] overflow-hidden">
            <button onClick={() => setDocMode('full')} className={`px-2 py-1 text-[10px] transition-colors ${docMode === 'full' ? 'bg-[#ff6a00] text-white' : 'text-[#a49484] hover:bg-[#2a1f18]'}`}>Full</button>
            <button onClick={() => setDocMode('current')} className={`px-2 py-1 text-[10px] transition-colors ${docMode === 'current' ? 'bg-[#ff6a00] text-white' : 'text-[#a49484] hover:bg-[#2a1f18]'}`}>Current</button>
          </div>
          <button onClick={() => onViewAlgorithm?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15] transition-colors">Algorithm</button>
          <button onClick={() => onViewCode?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15] transition-colors">Code</button>
          <button onClick={() => onViewPseudoCode?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15] transition-colors">Pseudo</button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] min-h-[668px] h-[calc(100%-3rem)]">
        {/* Main Visualization Area */}
        <div className="relative border-r border-[#2a211a] bg-gradient-to-b from-[#141210] via-[#12100e] to-[#0f0d0b]">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle, #ff6a00 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }} />

          {/* Title */}
          <div className="absolute left-6 top-6 text-[42px] font-black text-white tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Red-Black Tree Visualizer
          </div>

          {/* Status */}
          <div className="absolute left-6 top-[88px] text-sm tracking-wide text-[#b8ada0] flex items-center gap-3">
            <span className={`flex items-center gap-1.5 transition-colors ${playing ? 'text-orange-400' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${playing ? 'bg-orange-400' : 'bg-gray-500'} ${playing ? 'animate-pulse' : ''}`}></span>
              {playing ? 'Animation in progress' : 'Idle'}
            </span>
            {playing && (
              <span className="text-orange-400 font-bold">
                {opType}: {opValue}
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="absolute top-[120px] left-6 flex gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1a1a1a] border-2 border-[#e34f45] shadow-[0_0_6px_rgba(227,79,69,0.5)]"></span>
              <span className="text-gray-400">Red Node</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1a1a1a] border-2 border-[#8a8a8a]"></span>
              <span className="text-gray-400">Black Node</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
              <span className="text-orange-400">Current</span>
            </div>
          </div>

          {/* Tree Container */}
          <div className="absolute inset-0 top-[140px] px-4 pb-32">
            <div 
              className="absolute inset-0" 
              style={{ 
                transform: `translateY(${treeTranslateY}px) scale(${treeScale})`, 
                transformOrigin: 'top center' 
              }}
            >
              {/* SVG Edges */}
              <svg className="w-full h-full" style={{ zIndex: 1 }}>
                <defs>
                  <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {positioned.map(node => {
                  if (typeof node.parent !== 'number') return null;
                  const p = nodeByValue.get(node.parent);
                  if (!p) return null;
                  const isHighlight = activeSet.has(node.value) || activeSet.has(node.parent);
                  
                  return (
                    <g key={`edge-${node.parent}-${node.value}`}>
                      <line
                        x1={`${p.x}%`}
                        y1={p.y + 32}
                        x2={`${node.x}%`}
                        y2={node.y - 32}
                        stroke={isHighlight ? '#ff7b16' : '#3e3027'}
                        strokeWidth={isHighlight ? 2.5 : 1.5}
                        opacity={isHighlight ? 1 : 0.7}
                        filter={isHighlight ? 'url(#edgeGlow)' : undefined}
                      />
                      {isHighlight && (
                        <line
                          x1={`${p.x}%`}
                          y1={p.y + 32}
                          x2={`${node.x}%`}
                          y2={node.y - 32}
                          stroke="#ff7b16"
                          strokeWidth={4}
                          opacity={0.2}
                          strokeDasharray="6 4"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              {positioned.map(node => {
                const isNewNode = focus?.new_node === node.value;
                const isParent = focus?.parent === node.value;
                const isUncle = focus?.uncle === node.value;
                const isGrandparent = focus?.grandparent === node.value;
                const isHighlight = activeSet.has(node.value);
                
                const isSearchNode = playing && opKind === 'search' && node.value === highlightValue;
                const isDeleteNode = playing && opKind === 'delete' && node.value === highlightValue;
                const isInsertNode = playing && opKind === 'insert' && isNewNode;
                const isRotating = focus?.rotation_node === node.value;
                const isColorFlipping = focus?.color_flip_nodes?.includes(node.value);

                const role = isNewNode ? 'NEW NODE' : isParent ? 'PARENT' : isUncle ? 'UNCLE' : isGrandparent ? 'GRANDPARENT' : node.depth === 0 ? 'ROOT' : '';

                // Determine border color and glow
                let borderColor = node.color === 'red' ? '#e34f45' : '#8a8a8a';
                let glowColor = '';
                
                if (isHighlight) {
                  borderColor = '#ff7b16';
                  glowColor = node.color === 'red' 
                    ? '0 0 20px rgba(255,59,48,0.6), 0 0 40px rgba(255,59,48,0.3)' 
                    : '0 0 20px rgba(255,123,22,0.6), 0 0 40px rgba(255,123,22,0.3)';
                }

                // Determine animation
                let animation = '';
                if (isInsertNode) animation = 'nodeInsert 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                else if (isSearchNode) animation = 'nodeSearch 0.8s ease-in-out infinite';
                else if (isDeleteNode) animation = 'nodeDelete 1s ease-out forwards';
                else if (isRotating) animation = 'nodeRotate 0.8s ease-in-out';
                else if (isColorFlipping) animation = 'colorFlip 0.6s ease-in-out';
                else if (isNewNode && !playing) animation = 'float 2s ease-in-out infinite';

                return (
                  <div 
                    key={`node-${node.value}`} 
                    className="absolute" 
                    style={{ 
                      left: `${node.x}%`, 
                      top: `${node.y}px`, 
                      zIndex: isHighlight ? 20 : 10 
                    }}
                  >
                    {/* Ripple effect for highlighted nodes */}
                    {isHighlight && playing && (
                      <>
                        <div 
                          className="absolute w-20 h-20 rounded-full border-2 border-orange-400 pointer-events-none"
                          style={{ left: '50%', top: '50%', animation: 'ripple 1.2s ease-out infinite' }}
                        />
                        <div 
                          className="absolute w-20 h-20 rounded-full border-2 border-orange-400 pointer-events-none"
                          style={{ left: '50%', top: '50%', animation: 'ripple 1.2s ease-out infinite 0.4s' }}
                        />
                      </>
                    )}

                    {/* Node circle */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-[72px] h-[72px] flex items-center justify-center font-black text-[28px] text-white cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                        border: `2.5px solid ${borderColor}`,
                        boxShadow: glowColor || '0 4px 12px rgba(0,0,0,0.4)',
                        animation: animation || undefined,
                      }}
                    >
                      <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{node.value}</span>
                      
                      {/* Color indicator dot */}
                      <div 
                        className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white/20 ${node.color === 'red' ? 'bg-[#e34f45]' : 'bg-[#3a3a3a]'}`}
                        style={{ 
                          boxShadow: node.color === 'red' ? '0 0 6px rgba(227,79,69,0.6)' : 'none' 
                        }}
                      />
                    </div>

                    {/* Role label */}
                    {role && (
                      <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded ${
                          isNewNode ? 'text-cyan-400' :
                          isParent ? 'text-red-400' :
                          isUncle ? 'text-purple-400' :
                          isGrandparent ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          {role}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* NIL badges */}
              {nilBadges.map((n, i) => (
                <div 
                  key={`nil-${i}`} 
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#3a4a5a] bg-[#1a1f25] text-[#7a8a9a]"
                  style={{ left: `${n.x}%`, top: `${n.y}px` }}
                >
                  NIL
                </div>
              ))}
            </div>
          </div>

          {/* Control Bar */}
          <div className="absolute left-0 right-0 bottom-0 border-t border-[#2a211a] bg-gradient-to-t from-[#0d0a08] to-[#13100e] px-4 py-3 flex items-center gap-2 flex-wrap">
            <input
              value={valueText}
              onChange={e => setValueText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onInsertClick();
              }}
              placeholder="Value..."
              disabled={isAnimating}
              className="w-36 px-3 py-2.5 rounded-lg border border-[#3a2a20] bg-[#16120f] text-[#f2ebe3] outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00]/30 transition-all text-sm"
            />
            
            <button onClick={onInsertClick} disabled={isAnimating} className="px-6 py-2.5 rounded-lg bg-[#ff6a00] hover:bg-[#ff7d1e] text-white font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-sm">
              <span className="text-lg leading-none">+</span> Insert
            </button>
            
            <button onClick={onDeleteClick} disabled={isAnimating} className="px-5 py-2.5 rounded-lg border border-[#3a2a20] hover:bg-[#201812] text-[#f4eee8] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-sm">
              <Trash2 size={14} /> Delete
            </button>
            
            <button onClick={onSearchClick} disabled={isAnimating} className="px-5 py-2.5 rounded-lg border border-[#3a2a20] hover:bg-[#201812] text-[#f4eee8] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-sm">
              <Search size={14} /> Search
            </button>
            
            <button onClick={() => { setPlaying(false); setFrames([]); setFrameIdx(0); setManualState(null); onClear?.(); }} className="px-4 py-2.5 rounded-lg border border-[#3a2a20] hover:bg-[#201812] text-[#c8b8a8] text-sm active:scale-95 transition-all">
              Clear
            </button>
            
            <button onClick={async () => { if (onAddRandom) await runWithFrames(() => onAddRandom()); }} className="px-4 py-2.5 rounded-lg border border-[#3a2a20] hover:bg-[#201812] text-[#c8b8a8] text-sm active:scale-95 transition-all">
              Random
            </button>

            <div className="ml-3 flex items-center gap-2">
              <span className="text-xs text-[#8094ab] uppercase tracking-wider">Speed</span>
              <input 
                className="w-20 h-1.5 rounded-full appearance-none bg-[#2a1d14] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff6a00] [&::-webkit-slider-thumb]:shadow-lg" 
                type="range" min={0.1} max={1} step={0.05} value={speed} onChange={e => setSpeed(Number(e.target.value))} 
              />
              <span className="text-[#ff7b16] text-sm font-bold w-8">{speed.toFixed(1)}x</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => { setPlaying(false); const newIdx = Math.max(0, frameIdx - 1); setFrameIdx(newIdx); setManualState(frames[newIdx]?.state || null); }} className="p-2.5 rounded-lg bg-[#2a1d14] hover:bg-[#3a2619] text-[#ff9c48] active:scale-90 transition-all">
                <SkipBack size={14} />
              </button>
              
              <button onClick={() => setPlaying(p => !p)} className="p-2.5 rounded-lg bg-[#ff6a00] hover:bg-[#ff7d1e] text-white active:scale-90 transition-all">
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>
              
              <button onClick={() => { setPlaying(false); const newIdx = Math.min(frames.length - 1, frameIdx + 1); setFrameIdx(newIdx); setManualState(frames[newIdx]?.state || null); }} className="p-2.5 rounded-lg bg-[#2a1d14] hover:bg-[#3a2619] text-[#ff9c48] active:scale-90 transition-all">
                <SkipForward size={14} />
              </button>

              {frames.length > 0 && (
                <div className="ml-2 flex items-center gap-1.5">
                  <div className="w-24 h-1 rounded-full bg-[#2a1d14] overflow-hidden">
                    <div className="h-full bg-[#ff6a00] rounded-full transition-all" style={{ width: `${((frameIdx + 1) / frames.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{frameIdx + 1}/{frames.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-4 bg-gradient-to-b from-[#15110f] to-[#0d0a08] flex flex-col min-h-0 overflow-y-auto">
          {/* Current Operation */}
          <div className="text-[#6f85a0] text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5">Current Operation</div>
          <div className="rounded-xl border border-[#3a2a20] bg-gradient-to-b from-[#1b1511] to-[#130f0c] p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-[#d3c8bc] font-semibold">{opType}</div>
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${playing ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'}`}>
                {playing ? 'LIVE' : 'IDLE'}
              </div>
            </div>
            <div className="mt-2 text-4xl font-black text-[#ff9f4a]">[ {opValue} ]</div>
            {frames.length > 0 && (
              <div className="mt-2 text-[10px] text-gray-500 font-mono">
                Step {frameIdx + 1} of {frames.length}
              </div>
            )}
          </div>

          {/* Case Triggered */}
          <div className="text-[#6f85a0] text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5">Case Triggered</div>
          <div className="rounded-xl border border-[#4b2f1f] bg-gradient-to-b from-[#24170f] to-[#1a110c] p-3 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-[#ff7b16] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <div className="text-base font-bold text-[#ffd6b3]">{currentCase || 'No case'}</div>
                <div className="text-xs text-[#d9c9bb] mt-0.5">{caseDetail || 'Waiting for operation.'}</div>
              </div>
            </div>
            
            {currentCase.toLowerCase().includes('left') && (
              <div className="mt-2 flex items-center gap-1.5 text-orange-400 text-xs font-semibold">
                <RotateCw size={12} className="animate-spin" style={{ animationDuration: '2s' }} />
                Left Rotation
              </div>
            )}
            {currentCase.toLowerCase().includes('right') && (
              <div className="mt-2 flex items-center gap-1.5 text-orange-400 text-xs font-semibold">
                <RotateCw size={12} className="animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                Right Rotation
              </div>
            )}
            {currentCase.toLowerCase().includes('color') && (
              <div className="mt-2 flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-gray-600 animate-pulse" />
                Color Flip
              </div>
            )}
          </div>

          {/* RBT Properties */}
          <div className="text-[#6f85a0] text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5">RBT Properties</div>
          <div className="rounded-xl border border-[#3a2a20] bg-gradient-to-b from-[#1b1511] to-[#130f0c] p-3 mb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Root is black</span>
              {propsState.root_black ? <CheckCircle2 className="text-green-500" size={16} /> : <XCircle className="text-red-500" size={16} />}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>No red-red violation</span>
              {propsState.no_red_red ? <CheckCircle2 className="text-green-500" size={16} /> : <XCircle className="text-red-500" size={16} />}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Black height uniform</span>
              {propsState.black_height_uniform ? <CheckCircle2 className="text-green-500" size={16} /> : <XCircle className="text-red-500" size={16} />}
            </div>
            <div className="rounded-lg border border-[#3a2a20] bg-[#20160f] px-2.5 py-1.5 text-[#ff8a2a] text-xs font-medium flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
              Checking...
            </div>
          </div>

          {/* Stats */}
          <div className="mt-auto">
            <div className="text-[#6f85a0] text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5">Stats</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#2f2722] bg-gradient-to-b from-[#1f1915] to-[#16120f] p-2.5">
                <div className="text-[9px] text-[#8f8172] uppercase tracking-wide">Left Height</div>
                <div className="text-3xl font-black text-[#ff9f4a]">{stats.left_height ?? 0}</div>
              </div>
              <div className="rounded-lg border border-[#2f2722] bg-gradient-to-b from-[#1f1915] to-[#16120f] p-2.5">
                <div className="text-[9px] text-[#8f8172] uppercase tracking-wide">Right Height</div>
                <div className="text-3xl font-black text-[#ff9f4a]">{stats.right_height ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}