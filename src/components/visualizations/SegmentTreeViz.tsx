import { useEffect, useMemo, useState } from 'react';

interface Props {
  data: any;
  onBuild?: (arr: number[]) => Promise<any>;
  onRangeQuery?: (l: number, r: number, op: 'sum' | 'min' | 'max') => Promise<any>;
  onPointUpdate?: (idx: number, val: number) => Promise<any>;
  onAddRandom?: () => Promise<any>;
  onClear?: () => void;
  onViewCode?: (mode: 'full' | 'current') => void;
  onViewPseudoCode?: (mode: 'full' | 'current') => void;
  onViewAlgorithm?: (mode: 'full' | 'current') => void;
  isAnimating?: boolean;
}

export function SegmentTreeViz({
  data, onBuild, onRangeQuery, onPointUpdate, onAddRandom, onClear,
  onViewCode, onViewPseudoCode, onViewAlgorithm, isAnimating
}: Props) {
  const [docMode, setDocMode] = useState<'full' | 'current'>('full');
  const [buildText, setBuildText] = useState('10, 2, 5, 8, 3, 7, 1, 6');
  const [L, setL] = useState('1');
  const [R, setR] = useState('4');
  const [op, setOp] = useState<'sum' | 'min' | 'max'>('sum');
  const [updIdx, setUpdIdx] = useState('0');
  const [updVal, setUpdVal] = useState('0');
  const [animState, setAnimState] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const viewData = animState || data || {};
  const arr: number[] = viewData?.array || [];
  const tree: number[] = viewData?.tree || [];
  const ranges: Array<[number, number]> = viewData?.ranges || [];
  const height: number = viewData?.height || 0;
  const queryRange: [number, number] | undefined = viewData?.query_range;
  const highlightNodes: number[] = viewData?.highlight_nodes || [];
  const coverage: 'full' | 'partial' | 'none' | undefined = viewData?.coverage;
  const pulseNode: number | undefined = viewData?.pulse_node;

  const levels = useMemo(() => {
    const result: number[][] = [];
    let levelIdx = 1;
    for (let lvl = 0; lvl <= height; lvl++) {
      const count = Math.min(1 << lvl, tree.length - levelIdx + 1);
      const row: number[] = [];
      for (let i = 0; i < count; i++) {
        row.push(levelIdx + i);
      }
      result.push(row);
      levelIdx += count;
    }
    return result;
  }, [tree, height]);

  const nodePositions = useMemo(() => {
    const entries: Array<{ idx: number; x: number; y: number; parent: number | null }> = [];
    levels.forEach((row, depth) => {
      const denominator = row.length + 1;
      row.forEach((idx, i) => {
        entries.push({
          idx,
          x: ((i + 1) / denominator) * 100,
          y: depth * 112 + 48,
          parent: idx > 1 ? Math.floor(idx / 2) : null
        });
      });
    });
    return entries;
  }, [levels]);

  const positionMap = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>();
    nodePositions.forEach(n => m.set(n.idx, { x: n.x, y: n.y }));
    return m;
  }, [nodePositions]);

  const parseArrayInput = (txt: string) =>
    txt.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !Number.isNaN(n));

  useEffect(() => {
    if (!isPlaying) {
      setAnimState(null);
    }
  }, [data, isPlaying]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const playSegmentSteps = async (result: any, mode: 'query' | 'update') => {
    if (!result?.steps || !Array.isArray(result.steps) || result.steps.length === 0) return;
    setIsPlaying(true);
    for (const step of result.steps) {
      const s = step?.state || {};
      const highlighted = Array.isArray(s.highlight_nodes) ? s.highlight_nodes : [];
      setAnimState({
        ...data,
        ...s,
        pulse_node: highlighted.length ? highlighted[highlighted.length - 1] : undefined
      });
      await sleep(mode === 'query' ? 280 : 240);
    }
    setIsPlaying(false);
  };

  const handleRangeQueryAnimated = async () => {
    if (!onRangeQuery) return;
    const result = await onRangeQuery(parseInt(L), parseInt(R), op);
    await playSegmentSteps(result, 'query');
  };

  const handlePointUpdateAnimated = async () => {
    if (!onPointUpdate) return;
    const result = await onPointUpdate(parseInt(updIdx), parseInt(updVal));
    await playSegmentSteps(result, 'update');
  };

  return (
    <div className="w-[1450px] min-h-[860px] rounded-2xl overflow-hidden border border-[#2d1f16] bg-[#11100f] text-[#f0ede8]">
      <div className="h-14 px-6 border-b border-[#2b231d] flex items-center justify-between bg-[#171412]">
        <div className="flex items-center gap-3">

  
          <span className="text-xs text-[#9f9488] tracking-[0.22em] uppercase">Segment Tree</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-[#3a2a20] overflow-hidden">
            <button onClick={() => setDocMode('full')} className={`px-2 py-1 text-[10px] ${docMode === 'full' ? 'bg-[#ff6a00] text-white' : 'text-[#a49484]'}`}>Full</button>
            <button onClick={() => setDocMode('current')} className={`px-2 py-1 text-[10px] ${docMode === 'current' ? 'bg-[#ff6a00] text-white' : 'text-[#a49484]'}`}>Current</button>
          </div>
          <button onClick={() => onViewCode?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15]">Code</button>
          <button onClick={() => onViewPseudoCode?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15]">Pseudo</button>
          <button onClick={() => onViewAlgorithm?.(docMode)} className="px-2 py-1 rounded-md border border-[#3a2a20] text-[10px] text-[#d1c7bd] hover:bg-[#241b15]">Algorithm</button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] min-h-[806px]">
        <div className="p-4 border-r border-[#2b231d] bg-[radial-gradient(circle_at_center,rgba(255,106,0,0.08),transparent_58%)]">
          <div className="text-sm tracking-[0.18em] font-bold uppercase text-[#ff7b16] mb-3">Zone 1: Input Array</div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {arr.map((v, i) => {
              const inRange = queryRange && i >= queryRange[0] && i <= queryRange[1];
              return (
                <div key={i} className={`px-3 py-2 rounded-lg font-mono text-2xl border min-w-[52px] text-center ${inRange ? 'border-[#ffb347] bg-[#ff6a001f] text-[#ffc36a]' : 'border-[#4a3528] bg-[#1a1715] text-[#f2eee8]'}`}>
                  {v}
                  <div className={`text-[10px] mt-1 ${inRange ? 'text-[#ffb347]' : 'text-[#8f8378]'}`}>[{i}]</div>
                </div>
              );
            })}
          </div>

          <div className="text-sm tracking-[0.18em] font-bold uppercase text-[#ff7b16] mb-3">Zone 2: Segment Tree (Sum Query Visualization)</div>
          <div className="rounded-2xl border border-[#33261c] min-h-[430px] px-6 py-8 mb-4 bg-[#151210] relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {nodePositions.map(node => {
                if (!node.parent) return null;
                const parent = positionMap.get(node.parent);
                if (!parent) return null;
                return (
                  <line
                    key={`e-${node.parent}-${node.idx}`}
                    x1={`${parent.x}%`}
                    y1={parent.y + 24}
                    x2={`${node.x}%`}
                    y2={node.y - 24}
                    stroke={highlightNodes.includes(node.idx) || highlightNodes.includes(node.parent) ? '#f59e0b' : '#5a4638'}
                    strokeWidth={highlightNodes.includes(node.idx) || highlightNodes.includes(node.parent) ? '2.1' : '1.4'}
                    opacity="0.85"
                  />
                );
              })}
            </svg>
            {nodePositions.map(node => {
              const idx = node.idx;
              const val = tree[idx] ?? undefined;
              const [l, r] = ranges[idx] ?? [0, 0];
              const active = highlightNodes.includes(idx);
              const cov = coverage;
              const nodeTone = !active ? 'border-[#43403d] text-[#6f7a88]' : cov === 'full' ? 'border-[#f59e0b] text-[#f59e0b] shadow-[0_0_24px_rgba(245,158,11,0.5)]' : cov === 'partial' ? 'border-[#00d2ff] text-[#00d2ff] shadow-[0_0_22px_rgba(0,210,255,0.45)]' : 'border-[#6b7280] text-[#9ca3af]';
              return (
                <div
                  key={idx}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 bg-[#131211] flex flex-col items-center justify-center transition-all duration-300 ${nodeTone} ${pulseNode === idx ? 'scale-110' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}px` }}
                >
                  <div className="text-2xl font-black leading-none">{val !== undefined ? val : '-'}</div>
                  <div className="text-[10px] font-mono mt-1">[{l}-{r}]</div>
                </div>
              );
            })}
          </div>

          <div className="text-sm tracking-[0.18em] font-bold uppercase text-[#ff7b16] mb-2">Zone 3: Segment Tree</div>
          <div className="rounded-2xl border border-[#33261c] bg-[#151210] overflow-auto">
            <table className="min-w-full text-left text-sm font-mono">
              <thead>
                <tr className="text-[#b9afa4] border-b border-[#2b231d]">
                  <th className="px-3 py-2">Indices</th>
                  {tree.map((_, idx) => <th key={`h-${idx}`} className="px-3 py-2">{idx}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#2b231d]">
                  <td className="px-3 py-2 text-[#f3ede2] font-bold">Values</td>
                  {tree.map((v, idx) => <td key={`v-${idx}`} className={`px-3 py-2 font-bold ${highlightNodes.includes(idx) ? 'text-[#ffb347]' : 'text-[#f3ede2]'}`}>{v}</td>)}
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#f3ede2] font-bold">Ranges</td>
                  {tree.map((_, idx) => (
                    <td key={`r-${idx}`} className="px-3 py-2 text-[#00d2ff] text-xs">[{(ranges[idx] || [0, 0])[0]}-{(ranges[idx] || [0, 0])[1]}]</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-[#10b981]">● FULL COVER</span>
            <span className="text-[#f59e0b]">● PARTIAL</span>
            <span className="text-[#64748b]">● NO OVERLAP</span>
          </div>
        </div>

        <div className="p-4 bg-[#13100f]">
          <div className="rounded-2xl border border-[#33261c] p-4 mb-4 bg-[#171412]">
            <h3 className="text-3xl font-bold mb-1">Operation Info</h3>
            <div className="text-[#ff7b16] font-bold tracking-wide mb-3">Range Query: [{queryRange?.[0] ?? 0}, {queryRange?.[1] ?? Math.max(0, arr.length - 1)}]</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-[#3a2a20] p-2">
                <div className="text-[#9f9488] uppercase text-[10px]">Type</div>
                <div className="text-xl font-bold uppercase">{op}</div>
              </div>
              <div className="rounded-xl border border-[#264437] p-2">
                <div className="text-[#9f9488] uppercase text-[10px]">Result</div>
                <div className="text-xl font-bold text-[#00d17f]">{tree[1] ?? '-'}</div>
              </div>
              <div className="rounded-xl border border-[#3a2a20] p-2">
                <div className="text-[#9f9488] uppercase text-[10px]">Steps</div>
                <div className="text-xl font-bold">{highlightNodes.length || 0} nodes</div>
              </div>
              <div className="rounded-xl border border-[#3a2a20] p-2">
                <div className="text-[#9f9488] uppercase text-[10px]">Height</div>
                <div className="text-xl font-bold">{height} levels</div>
              </div>
            </div>
            <div className="mt-3 text-[#ff7b16] text-sm font-bold tracking-[0.14em] uppercase">Query Type</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['sum', 'min', 'max'] as const).map(k => (
                <button key={k} onClick={() => setOp(k)} className={`px-2 py-2 rounded-lg border text-sm font-bold uppercase ${op === k ? 'bg-[#ff6a00] border-[#ff6a00] text-white' : 'border-[#3a2a20] text-[#d7cfc6] hover:bg-[#241b15]'}`}>{k}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#33261c] p-4 mb-3 bg-[#171412]">
            <div className="text-[#ff7b16] text-sm font-bold tracking-[0.14em] uppercase mb-2">Build Controls</div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input value={buildText} onChange={e => setBuildText(e.target.value)} disabled={isAnimating || isPlaying}
                className="min-w-0 px-3 py-2 rounded-lg border border-[#3a2a20] bg-[#11100f] text-[#e8e1d8]" />
              <button onClick={async () => onBuild?.(parseArrayInput(buildText))} disabled={isAnimating || isPlaying}
                className="shrink-0 px-4 py-2 rounded-lg bg-[#ff6a00] hover:bg-[#ff7c24] text-white font-bold text-xl leading-none">Build</button>
            </div>
            <button onClick={onAddRandom} disabled={isAnimating || isPlaying}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#3a2a20] text-[#d7cfc6] hover:bg-[#241b15]">Random</button>
          </div>

          <div className="rounded-2xl border border-[#33261c] p-4 mb-3 bg-[#171412]">
            <div className="text-[#00d2ff] text-sm font-bold tracking-[0.14em] uppercase mb-2">Query Controls</div>
            <div className="flex items-center gap-2">
              <input value={L} onChange={e => setL(e.target.value)} placeholder="L" disabled={isAnimating}
                className="w-14 px-3 py-2 rounded-lg border border-[#3a2a20] bg-[#11100f] text-[#e8e1d8]" />
              <input value={R} onChange={e => setR(e.target.value)} placeholder="R" disabled={isAnimating}
                className="w-14 px-3 py-2 rounded-lg border border-[#3a2a20] bg-[#11100f] text-[#e8e1d8]" />
              <button onClick={handleRangeQueryAnimated} disabled={isAnimating || isPlaying}
                className="flex-1 px-3 py-2 rounded-lg bg-[#00aee6] hover:bg-[#00bffb] text-white font-bold">Range Query</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#33261c] p-4 bg-[#171412]">
            <div className="text-[#ff9d00] text-sm font-bold tracking-[0.14em] uppercase mb-2">Update Controls</div>
            <div className="flex items-center gap-2">
              <input value={updIdx} onChange={e => setUpdIdx(e.target.value)} placeholder="Idx" disabled={isAnimating}
                className="w-14 px-3 py-2 rounded-lg border border-[#3a2a20] bg-[#11100f] text-[#e8e1d8]" />
              <input value={updVal} onChange={e => setUpdVal(e.target.value)} placeholder="Val" disabled={isAnimating}
                className="w-16 px-3 py-2 rounded-lg border border-[#3a2a20] bg-[#11100f] text-[#e8e1d8]" />
              <button onClick={handlePointUpdateAnimated} disabled={isAnimating || isPlaying}
                className="flex-1 px-3 py-2 rounded-lg bg-[#ff9d00] hover:bg-[#ffad24] text-white font-bold">Point Update</button>
            </div>
            <button onClick={onClear} disabled={isAnimating || isPlaying}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#3a2a20] text-[#d7cfc6] hover:bg-[#241b15]">Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}
