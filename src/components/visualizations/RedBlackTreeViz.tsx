import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Search, SkipBack, SkipForward, Trash2, RotateCw } from 'lucide-react';

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
  isNull?: boolean;
};

const RULES = [
  { id: 1, text: 'Root is always black', key: 'root_black' },
  { id: 2, text: 'Red nodes have black children', key: 'no_red_red' },
  { id: 3, text: 'All paths have equal black height', key: 'black_height_uniform' },
  { id: 4, text: 'New nodes start red', key: 'new_node_red' },
  { id: 5, text: 'No consecutive red nodes', key: 'no_consecutive_red' },
];

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
  void onViewCode;
  void onViewPseudoCode;
  void onViewAlgorithm;
  const [valueText, setValueText] = useState('');
  const [speed, setSpeed] = useState(0.5);
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
  const stats = view?.rb_stats || { left_height: 0, right_height: 0, black_height: 0, total_nodes: 0, rotations: 0, recolorings: 0 };
  const opState = view?.current_operation || {};
  const opType = (opState?.type || 'insertion').toString().toUpperCase();
  const opValue = opState?.value ?? (typeof view?.found === 'number' ? view.found : '-');
  const opKind = (opState?.type || '').toString().toLowerCase();
  const highlightValue = typeof view?.highlight === 'number' ? view.highlight : undefined;
  const currentCase = view?.current_case || 'Waiting for operation';
  const caseDetail = view?.case_detail || (frame?.state?.description || '');

  const maxDepth = useMemo(() => {
    const depth = (node: RBNode | null | undefined): number => {
      if (!node) return 0;
      return 1 + Math.max(depth(node.left || null), depth(node.right || null));
    };
    return Math.max(0, depth(tree) - 1);
  }, [tree]);

  const levelGap = maxDepth >= 5 ? 50 : maxDepth >= 4 ? 60 : 70;
  const initialOffset = maxDepth >= 5 ? 8 : maxDepth >= 4 ? 10 : 14;
  const treeScale = maxDepth <= 3 ? 1 : maxDepth === 4 ? 0.85 : maxDepth === 5 ? 0.75 : 0.65;
  const treeTranslateY = maxDepth <= 3 ? 0 : -(maxDepth - 3) * 20;

  const positioned = useMemo(() => {
    const nodes: PositionedNode[] = [];
    const walk = (node: RBNode | null | undefined, x: number, y: number, offset: number, depth: number, parent?: number) => {
      if (!node) return;
      nodes.push({ value: node.value, color: node.color === 'red' ? 'red' : 'black', x, y, depth, parent });
      walk(node.left || null, x - offset, y + levelGap, offset * 0.55, depth + 1, node.value);
      walk(node.right || null, x + offset, y + levelGap, offset * 0.55, depth + 1, node.value);
    };
    walk(tree, 50, 60, initialOffset, 0);
    return nodes;
  }, [tree, levelGap, initialOffset]);

  const nodeByValue = useMemo(() => {
    const m = new Map<number, PositionedNode>();
    positioned.forEach(n => m.set(n.value, n));
    return m;
  }, [positioned]);

  const nullNodes = useMemo(() => {
    if (!tree) return [] as PositionedNode[];
    const out: PositionedNode[] = [];
    const addNulls = (node: RBNode | null | undefined, x: number, y: number, offset: number, depth: number) => {
      if (!node) return;
      const nextY = y + levelGap;
      const nextOffset = offset * 0.55;
      
      if (!node.left) {
        out.push({ value: -1, color: 'black', x: x - offset, y: nextY, depth: depth + 1, parent: node.value, isNull: true });
      } else {
        addNulls(node.left || null, x - offset, nextY, nextOffset, depth + 1);
      }
      
      if (!node.right) {
        out.push({ value: -1, color: 'black', x: x + offset, y: nextY, depth: depth + 1, parent: node.value, isNull: true });
      } else {
        addNulls(node.right || null, x + offset, nextY, nextOffset, depth + 1);
      }
    };
    addNulls(tree, 50, 60, initialOffset, 0);
    return out;
  }, [tree, levelGap, initialOffset]);

  const activeSet = new Set<number>([focus?.new_node, focus?.parent, focus?.uncle, focus?.grandparent].filter((v: any) => typeof v === 'number'));

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

  const getRuleStatus = (key: string): 'green' | 'amber' | 'red' | 'gray' => {
    if (!playing) return propsState[key] ? 'green' : 'red';
    
    if (key === 'root_black' && focus?.checking_root) return 'amber';
    if (key === 'no_red_red' && focus?.checking_red_red) return 'amber';
    if (key === 'black_height_uniform' && focus?.checking_black_height) return 'amber';
    
    return propsState[key] ? 'green' : 'red';
  };

  const treeHeight = maxDepth;
  const maxTheoreticalHeight = Math.floor(2 * Math.log2((stats.total_nodes || 1) + 1));

  const runPreset = async (preset: string) => {
    if (!onInsert || !onClear) return;
    onClear();
    setFrames([]);
    setFrameIdx(0);
    setManualState(null);
    
    if (preset === 'sorted') {
      for (let i = 1; i <= 8; i++) {
        await runWithFrames(() => onInsert(i));
      }
    } else if (preset === 'cascade') {
      const seq = [7, 3, 18, 10, 22, 8, 11];
      for (const v of seq) {
        await runWithFrames(() => onInsert(v));
      }
    } else if (preset === 'rotation') {
      const seq = [10, 20, 30, 40, 50, 25];
      for (const v of seq) {
        await runWithFrames(() => onInsert(v));
      }
    } else if (preset === 'delete' && onDelete) {
      const seq = [10, 20, 30, 40, 50, 15, 25, 35, 45];
      for (const v of seq) {
        await runWithFrames(() => onInsert(v));
      }
      await runWithFrames(() => onDelete(40));
      await runWithFrames(() => onDelete(30));
      await runWithFrames(() => onDelete(20));
    }
  };

  return (
    <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden bg-[#0a0f0f] text-[#70b898] relative flex flex-col">
      <style>{`
        @keyframes nodeInsert {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes rippleOut {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes recolorToRed {
          0% { filter: none; }
          40% { filter: brightness(1.8) saturate(1.5); }
          100% { filter: none; }
        }
        @keyframes recolorToBlack {
          0% { filter: none; }
          40% { filter: brightness(0.6); }
          100% { filter: none; }
        }
        @keyframes rotatePulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.5); }
        }
        @keyframes nodeSearch {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes nodeDelete {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0) rotate(180deg); opacity: 0; }
        }
        @keyframes rootCrown {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -20px) scale(1.2); }
          70% { opacity: 1; transform: translate(-50%, -25px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -30px) scale(0.8); }
        }
        @keyframes redNodePulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes violationPulse {
          0%, 100% { filter: none; }
          50% { filter: brightness(1.3); }
        }
        .red-node-pulse {
          animation: redNodePulse 3s ease-in-out infinite;
        }
        .node-ins { animation: nodeInsert 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .node-ripple { animation: rippleOut 0.3s ease-out forwards; }
        .recolor-red { animation: recolorToRed 0.3s ease-in-out; }
        .recolor-black { animation: recolorToBlack 0.3s ease-in-out; }
        .rotate-pulse { animation: rotatePulse 0.5s ease-in-out; }
        .node-search { animation: nodeSearch 0.3s ease-in-out; }
        .node-delete { animation: nodeDelete 0.3s ease-out forwards; }
        .root-crown { animation: rootCrown 0.6s ease-out forwards; }
        .violation-pulse { animation: violationPulse 0.5s ease-in-out infinite; }
      `}</style>

      {/* Zone 1 - Top Controls */}
      <div className="h-[60px] px-4 border-b border-[#1a2a25] flex items-center gap-3 bg-[#0a0f0f] flex-shrink-0">
        <input
          value={valueText}
          onChange={e => setValueText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onInsertClick(); }}
          placeholder="Value..."
          disabled={isAnimating}
          className="w-28 px-3 py-2 rounded-lg border border-[#2a4a40] bg-[#111c1a] text-[#70b898] outline-none focus:border-[#40d8d0] transition-all text-sm font-mono"
        />
        
        <button onClick={onInsertClick} disabled={isAnimating} className="px-4 py-2 rounded-lg bg-[#2a4a40] hover:bg-[#3a5a50] text-[#70b898] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-xs">
          <span className="text-lg leading-none">+</span> Insert
        </button>
        
        <button onClick={onDeleteClick} disabled={isAnimating} className="px-3 py-2 rounded-lg border border-[#2a4a40] hover:bg-[#1a2a25] text-[#70b898] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-xs">
          <Trash2 size={12} /> Delete
        </button>
        
        <button onClick={onSearchClick} disabled={isAnimating} className="px-3 py-2 rounded-lg border border-[#2a4a40] hover:bg-[#1a2a25] text-[#70b898] font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 text-xs">
          <Search size={12} /> Search
        </button>

        <button onClick={() => { setPlaying(false); setFrames([]); setFrameIdx(0); setManualState(null); onClear?.(); }} className="px-3 py-2 rounded-lg border border-[#2a4a40] hover:bg-[#1a2a25] text-[#4a6a5a] text-xs active:scale-95 transition-all">
          Clear
        </button>
        
        <button onClick={async () => { if (onAddRandom) await runWithFrames(() => onAddRandom()); }} className="px-3 py-2 rounded-lg border border-[#2a4a40] hover:bg-[#1a2a25] text-[#4a6a5a] text-xs active:scale-95 transition-all">
          Random
        </button>

        <div className="ml-2 flex items-center gap-2">
          <span className="text-[9px] text-[#2a4a40] uppercase tracking-wider">Speed</span>
          <input 
            className="w-16 h-1 rounded-full appearance-none bg-[#1a2a25] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#40d8d0]" 
            type="range" min={0.1} max={1} step={0.05} value={speed} onChange={e => setSpeed(Number(e.target.value))} 
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => { setPlaying(false); const newIdx = Math.max(0, frameIdx - 1); setFrameIdx(newIdx); setManualState(frames[newIdx]?.state || null); }} className="p-1.5 rounded-lg bg-[#1a2a25] hover:bg-[#2a4a40] text-[#40d8d0] active:scale-90 transition-all">
            <SkipBack size={12} />
          </button>
          
          <button onClick={() => setPlaying(p => !p)} className="p-1.5 rounded-lg bg-[#2a4a40] hover:bg-[#3a5a50] text-[#40d8d0] active:scale-90 transition-all">
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>
          
          <button onClick={() => { setPlaying(false); const newIdx = Math.min(frames.length - 1, frameIdx + 1); setFrameIdx(newIdx); setManualState(frames[newIdx]?.state || null); }} className="p-1.5 rounded-lg bg-[#1a2a25] hover:bg-[#2a4a40] text-[#40d8d0] active:scale-90 transition-all">
            <SkipForward size={12} />
          </button>

          {frames.length > 0 && (
            <div className="ml-2 flex items-center gap-1.5">
              <div className="w-16 h-1 rounded-full bg-[#1a2a25] overflow-hidden">
                <div className="h-full bg-[#40d8d0] rounded-full transition-all" style={{ width: `${((frameIdx + 1) / frames.length) * 100}%` }} />
              </div>
              <span className="text-[9px] text-[#2a4a40] font-mono">{frameIdx + 1}/{frames.length}</span>
            </div>
          )}
        </div>

        <div className="ml-4 flex items-center gap-1">
          <button onClick={() => runPreset('sorted')} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">Sorted</button>
          <button onClick={() => runPreset('cascade')} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">Cascade</button>
          <button onClick={() => runPreset('rotation')} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">Rotation</button>
          <button onClick={() => runPreset('delete')} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">Delete</button>
        </div>
      </div>

      {/* Zone 2 - Main Canvas */}
      <div className="relative flex-1 min-h-0" style={{ height: '55%' }}>
        {/* Background grid dots */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #ffffff04 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />

        {/* Level lines and labels */}
        {Array.from({ length: maxDepth + 1 }).map((_, level) => (
          <div key={level}>
            <div className="absolute left-4 text-[9px] font-mono text-[#2a4a40]" style={{ top: `${60 + level * levelGap}px` }}>
              L{level}
            </div>
            <div 
              className="absolute left-12 right-4 h-px" 
              style={{ top: `${60 + level * levelGap}px`, backgroundColor: '#ffffff05' }} 
            />
          </div>
        ))}

        {/* Tree */}
        <div 
          className="absolute inset-0" 
          style={{ 
            transform: `translateY(${treeTranslateY}px) scale(${treeScale})`, 
            transformOrigin: 'top center' 
          }}
        >
          {/* SVG Edges */}
          <svg className="w-full h-full absolute inset-0" style={{ zIndex: 1 }}>
            <defs>
              <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="violationGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#e04030" floodOpacity="0.8" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {positioned.map(node => {
              if (typeof node.parent !== 'number') return null;
              const p = nodeByValue.get(node.parent);
              if (!p) return null;
              const isHighlight = activeSet.has(node.value) || activeSet.has(node.parent);
              const isViolating = propsState.no_red_red === false && node.color === 'red' && p.color === 'red';
              
              let edgeColor = '#2a4a3a';
              let edgeWidth = 1.5;
              let filter = undefined;

              if (isViolating && playing) {
                edgeColor = '#e04030';
                edgeWidth = 2.5;
                filter = 'url(#violationGlow)';
              } else if (isHighlight && playing) {
                edgeColor = '#40d8d0';
                edgeWidth = 2;
                filter = 'url(#edgeGlow)';
              }

              return (
                <line
                  key={`edge-${node.parent}-${node.value}`}
                  x1={`${p.x}%`}
                  y1={p.y + 22}
                  x2={`${node.x}%`}
                  y2={node.y - 22}
                  stroke={edgeColor}
                  strokeWidth={edgeWidth}
                  filter={filter}
                  opacity={isHighlight ? 1 : 0.7}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {positioned.map(node => {
            const isNewNode = focus?.new_node === node.value;
            const isHighlight = activeSet.has(node.value);
            
            const isSearchNode = playing && opKind === 'search' && node.value === highlightValue;
            const isDeleteNode = playing && opKind === 'delete' && node.value === highlightValue;
            const isInsertNode = playing && opKind === 'insert' && isNewNode;
            const isRotating = focus?.rotation_node === node.value;
            const isColorFlipping = focus?.color_flip_nodes?.includes(node.value);
            const isRoot = node.depth === 0;

            const isRed = node.color === 'red';
            const fillColor = isRed ? '#1a0808' : '#111c1a';
            const borderColor = isRed ? '#c04030' : '#3a7a60';
            const textColor = isRed ? '#e87060' : '#70b898';

            let animation = '';
            if (isInsertNode) animation = 'nodeInsert 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            else if (isSearchNode) animation = 'nodeSearch 0.3s ease-in-out';
            else if (isDeleteNode) animation = 'nodeDelete 0.3s ease-out forwards';
            else if (isRotating) animation = 'rotatePulse 0.5s ease-in-out';
            else if (isColorFlipping && isRed) animation = 'recolor-red 0.3s ease-in-out';
            else if (isColorFlipping && !isRed) animation = 'recolor-black 0.3s ease-in-out';
            else if (isRed && !playing) animation = 'redNodePulse 3s ease-in-out infinite';

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
                {isInsertNode && playing && (
                  <div className="absolute w-12 h-12 rounded-full border-2 border-red-500 pointer-events-none" style={{ left: '50%', top: '50%', animation: 'rippleOut 0.3s ease-out forwards' }} />
                )}

                {isRoot && !playing && (
                  <div className="absolute text-[8px] text-amber-400 pointer-events-none" style={{ left: '50%', top: '0', transform: 'translate(-50%, -100%)', animation: 'rootCrown 0.6s ease-out forwards' }}>
                    ♛
                  </div>
                )}

                <div
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-mono font-bold text-[14px] ${isRed ? 'red-node-pulse' : ''}`}
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: fillColor,
                    border: '2.5px solid',
                    borderColor: isHighlight && playing ? '#40d8d0' : borderColor,
                    color: isHighlight && playing ? '#40d8d0' : textColor,
                    boxShadow: isHighlight && playing ? '0 0 15px #40d8d080' : '0 2px 8px rgba(0,0,0,0.4)',
                    animation: animation || undefined,
                    transition: 'border-color 0.3s, color 0.3s',
                  }}
                >
                  {node.value}
                </div>

                {isRoot && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{
                      width: '50px',
                      height: '50px',
                      border: '2px solid #3a7a60',
                      opacity: 0,
                      animation: !playing && isRoot ? 'fadeIn 0.4s ease-out 0.3s forwards' : undefined,
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Null leaf nodes */}
          {nullNodes.map((node, i) => (
            <div
              key={`null-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${node.x}%`,
                top: `${node.y}px`,
                width: '10px',
                height: '10px',
                backgroundColor: '#141e1c',
                border: '1px solid #1e3028',
              }}
            />
          ))}
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 right-4 flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] ${playing ? 'text-cyan-400' : 'text-[#2a4a40]'}`}>
            <span className={`w-2 h-2 rounded-full ${playing ? 'bg-cyan-400' : 'bg-[#2a4a40]'} ${playing ? 'animate-pulse' : ''}`}></span>
            {playing ? 'Operating' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Zone 3 - Bottom Panel (3 columns) */}
      <div className="h-[45%] min-h-[200px] border-t border-[#1a2a25] flex flex-shrink-0">
        {/* Left Column - Rules */}
        <div className="w-1/4 border-r border-[#1a2a25] p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">RBT Rules</div>
          <div className="space-y-1.5">
            {RULES.map(rule => {
              const status = getRuleStatus(rule.key);
              const dotColor = status === 'green' ? '#4ad880' : status === 'amber' ? '#d4a040' : status === 'red' ? '#e04030' : '#2a4a40';
              const bgTint = status === 'red' ? 'bg-[#2a0808]' : status === 'amber' ? 'bg-[#1a1400]' : status === 'green' ? 'bg-[#082808]' : '';
              
              return (
                <div key={rule.id} className={`flex items-center gap-2 px-2 py-1 rounded ${bgTint}`}>
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: dotColor, boxShadow: status !== 'gray' ? `0 0 6px ${dotColor}` : 'none' }}
                  />
                  <span className="text-[9px] font-mono font-bold text-[#3a5a50]" style={{ color: status === 'red' ? '#e87060' : status === 'amber' ? '#d4a040' : status === 'green' ? '#70b898' : '#3a5a50' }}>
                    {rule.id}
                  </span>
                  <span className="text-[10px] text-[#4a6a5a] truncate">{rule.text}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-[#1a2a25]">
            <p className="text-[9px] text-[#2a4a40] italic">All rules must hold between operations.</p>
          </div>
        </div>

        {/* Center Column - Operation Panel */}
        <div className="w-2/4 border-r border-[#1a2a25] p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">Current Operation</div>
          
          {playing ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-white font-semibold">{opType}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">LIVE</span>
              </div>
              <div className="text-2xl font-black text-[#40d8d0]">[ {opValue} ]</div>
              
              {frames.length > 0 && (
                <>
                  <div className="text-[10px] text-[#4a6a5a]">
                    Step {frameIdx + 1} of {frames.length} — {currentCase}
                  </div>
                  <div className="w-full h-1 rounded-full bg-[#1a2a25] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all" 
                      style={{ width: `${((frameIdx + 1) / frames.length) * 100}%` }} 
                    />
                  </div>
                </>
              )}

              {(currentCase?.toLowerCase().includes('left') || currentCase?.toLowerCase().includes('right')) && (
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-[10px] font-semibold">
                  <RotateCw size={12} className={currentCase?.toLowerCase().includes('right') ? '' : 'rotate-180'} />
                  {currentCase?.toLowerCase().includes('right') ? 'Right Rotation' : 'Left Rotation'}
                </div>
              )}

              {caseDetail && (
                <div className="mt-2 text-[10px] text-[#4a6a5a] leading-relaxed">{caseDetail}</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1a2a25] text-[#4a6a5a]">IDLE</span>
              {stats.total_nodes > 0 && (
                <div className="text-[11px] text-[#3a5a50]">
                  Tree ready — {stats.total_nodes} nodes, height {treeHeight}
                </div>
              )}
              <div className="text-[9px] text-[#2a4a40] italic">
                Searching is read-only — no rebalancing occurs.
              </div>
            </div>
          )}

          {/* Rotation mini-diagram placeholder */}
          {(currentCase?.toLowerCase().includes('rotation') || currentCase?.toLowerCase().includes('case')) && playing && (
            <div className="mt-3 p-2 rounded border border-[#2a4a40] bg-[#111c1a]">
              <div className="text-[9px] text-[#2a4a40] mb-1">Rotation Preview</div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-[#1a0808] border border-red-500 flex items-center justify-center text-[8px] text-red-400">GP</div>
                  <div className="w-6 h-6 rounded-full bg-[#111c1a] border border-cyan-500 flex items-center justify-center text-[8px] text-cyan-400">P</div>
                </div>
                <RotateCw size={12} className="text-amber-400" />
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-[#111c1a] border border-cyan-500 flex items-center justify-center text-[8px] text-cyan-400">P</div>
                  <div className="w-6 h-6 rounded-full bg-[#1a0808] border border-red-500 flex items-center justify-center text-[8px] text-red-400">GP</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Metrics */}
        <div className="w-1/4 p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">Metrics</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase tracking-wide">Tree Height</div>
              <div className="text-xl font-black text-white">{treeHeight}</div>
              <div className="text-[8px] text-[#2a4a40]">Max: {maxTheoreticalHeight || '-'}</div>
            </div>
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase tracking-wide">Black Height</div>
              <div className="text-xl font-black text-[#40d8d0]">{stats.black_height || '-'}</div>
            </div>
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase tracking-wide">Total Nodes</div>
              <div className="text-xl font-black text-white">{stats.total_nodes || 0}</div>
            </div>
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase tracking-wide">Operations</div>
              <div className="flex gap-2">
                <span className="text-sm font-bold text-amber-400">{stats.rotations || 0}R</span>
                <span className="text-sm font-bold text-coral-400">{stats.recolorings || 0}C</span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[8px] text-[#2a4a40]">
            <div className="uppercase tracking-wide mb-1">Recent</div>
            <div className="space-y-0.5 font-mono">
              <div className="text-[9px] text-[#3a5a50]">Insert 7 — 1 rot, 2 recolor</div>
              <div className="text-[9px] text-[#3a5a50]">Insert 3 — no repairs</div>
              <div className="text-[9px] text-[#3a5a50]">Insert 18 — 1 recolor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee Banner */}
      <div className="h-auto py-2 px-4 border-t border-[#1a2a25] bg-[#0a0f0f] text-center flex-shrink-0">
        <p className="text-[12px] text-[#4a8a78] leading-relaxed">
          A red-black tree guarantees <span className="text-[#70b898]">O(log n)</span> for every insert, delete, and search — no matter what order the data arrives in.
        </p>
        <p className="text-[11px] text-[#3a6a58]">
          It achieves this by automatically rebalancing itself after every operation using rotations and recolorings.
        </p>
      </div>
    </div>
  );
}
