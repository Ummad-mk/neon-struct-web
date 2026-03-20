import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

type AlgorithmType = 'dijkstra' | 'astar' | 'bfs';
type TerrainType = 'wall' | 'flat' | 'hill' | 'mtn' | 'start_end' | 'end_place';

interface Cell {
  row: number;
  col: number;
  type: 'start' | 'end' | 'wall' | 'flat' | 'hill' | 'mtn';
  weight: number;
}

interface Frame {
  visited: Set<string>;
  path: Set<string>;
  frontier: Set<string>;
  current: string | null;
  costs: Record<string, number>;
  operation: 'exploring' | 'found' | 'reconstructing' | 'complete';
  description: string;
}

interface Metrics {
  visitedCount: number;
  pathLength: number;
  totalCost: number;
  frontierSize: number;
}

const ROWS = 20;
const COLS = 20;

const keyOf = (r: number, c: number) => `${r},${c}`;
const parseKey = (k: string) => { const [r, c] = k.split(',').map(Number); return { r, c }; };
const heuristic = (a: string, b: string) => {
  const pa = parseKey(a), pb = parseKey(b);
  return Math.abs(pa.r - pb.r) + Math.abs(pa.c - pb.c);
};
const neighborsOf = (r: number, c: number) =>
  [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
    .filter(({ r: nr, c: nc }) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);

function createInitialGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) row.push({ row: r, col: c, type: 'flat', weight: 1 });
    grid.push(row);
  }
  grid[2][2] = { row: 2, col: 2, type: 'start', weight: 1 };
  grid[17][17] = { row: 17, col: 17, type: 'end', weight: 1 };
  return grid;
}

function reconstructPath(cameFrom: Record<string, string | undefined>, start: string, end: string): string[] {
  if (!cameFrom[end] && start !== end) return [];
  const path: string[] = [end];
  let cur = end;
  while (cur !== start) {
    const prev = cameFrom[cur];
    if (!prev) return [];
    cur = prev;
    path.push(cur);
  }
  return path.reverse();
}

const TIPS: Record<AlgorithmType, string> = {
  dijkstra: 'Expands like a water wave from start, always visiting the lowest-cost node next. Guarantees the shortest weighted path for non-negative edge weights.',
  astar: 'Uses Manhattan distance heuristic to guide search toward the goal. Faster than Dijkstra on open grids while still guaranteeing optimality.',
  bfs: 'Explores all neighbors equally layer by layer. Finds the shortest path by number of steps, ignoring terrain weights.',
};

const ALGO_NAMES: Record<AlgorithmType, string> = {
  dijkstra: "Dijkstra's Algorithm",
  astar: 'A* Search',
  bfs: 'Breadth-First Search',
};

export function PathfindingViz() {
  const [grid, setGrid] = useState<Cell[][]>(createInitialGrid);
  const [algo, setAlgo] = useState<AlgorithmType>('dijkstra');
  const [tool, setTool] = useState<TerrainType>('wall');
  const [speed, setSpeed] = useState(0.5);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ visitedCount: 0, pathLength: 0, totalCost: 0, frontierSize: 0 });
  const mouseDown = useRef(false);

  const startPos = useMemo(() => {
    for (const row of grid) for (const c of row) if (c.type === 'start') return keyOf(c.row, c.col);
    return keyOf(2, 2);
  }, [grid]);

  const endPos = useMemo(() => {
    for (const row of grid) for (const c of row) if (c.type === 'end') return keyOf(c.row, c.col);
    return keyOf(17, 17);
  }, [grid]);

  const cellMap = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const row of grid) for (const c of row) m.set(keyOf(c.row, c.col), c);
    return m;
  }, [grid]);

  const cf = frames.length ? frames[Math.min(frameIdx, frames.length - 1)] : null;

  useEffect(() => {
    if (!playing || !frames.length) return;
    const ms = Math.max(20, 300 - Math.round(speed * 280));
    const t = setTimeout(() => {
      setFrameIdx(prev => {
        if (prev >= frames.length - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, ms);
    return () => clearTimeout(t);
  }, [playing, frames, frameIdx, speed]);

  const runPathfinding = useCallback(() => {
    const resultFrames: Frame[] = [];
    const visitedOrder: string[] = [];
    const visitedSet = new Set<string>();
    const frontierSet = new Set<string>();
    const cameFrom: Record<string, string | undefined> = {};
    const gScore: Record<string, number> = {};
    const frontier: Array<{ key: string; priority: number }> = [];

    for (const k of cellMap.keys()) gScore[k] = Infinity;
    gScore[startPos] = 0;
    frontier.push({ key: startPos, priority: 0 });
    frontierSet.add(startPos);

    resultFrames.push({
      visited: new Set<string>(),
      path: new Set<string>(),
      frontier: new Set(frontierSet),
      current: startPos,
      costs: { [startPos]: 0 },
      operation: 'exploring',
      description: 'Starting — added to priority queue',
    });

    let found = false;
    let steps = 0;

    while (frontier.length > 0 && steps < 2000) {
      steps++;
      frontier.sort((a, b) => a.priority - b.priority);
      const cur = frontier.shift();
      if (!cur) break;
      frontierSet.delete(cur.key);
      if (visitedSet.has(cur.key)) continue;
      visitedSet.add(cur.key);
      visitedOrder.push(cur.key);

      const cc: Record<string, number> = {};
      for (const k of visitedSet) cc[k] = gScore[k] ?? Infinity;

      resultFrames.push({
        visited: new Set(visitedOrder),
        path: new Set<string>(),
        frontier: new Set(frontierSet),
        current: cur.key,
        costs: { ...cc },
        operation: 'exploring',
        description: `Visiting node · cost ${(gScore[cur.key] || 0).toFixed(0)}`,
      });

      if (cur.key === endPos) {
        found = true;
        resultFrames.push({
          visited: new Set(visitedOrder),
          path: new Set<string>(),
          frontier: new Set(frontierSet),
          current: cur.key,
          costs: cc,
          operation: 'found',
          description: `✓ Goal reached! Cost: ${(gScore[cur.key] || 0).toFixed(0)}`,
        });
        break;
      }

      const { r, c } = parseKey(cur.key);
      for (const n of neighborsOf(r, c)) {
        const nk = keyOf(n.r, n.c);
        const cell = cellMap.get(nk);
        if (!cell || cell.type === 'wall' || visitedSet.has(nk)) continue;
        const stepCost = algo === 'bfs' ? 1 : cell.weight;
        const tentative = gScore[cur.key] + stepCost;
        if (tentative < gScore[nk]) {
          cameFrom[nk] = cur.key;
          gScore[nk] = tentative;
          const priority = algo === 'astar' ? tentative + heuristic(nk, endPos) : tentative;
          frontier.push({ key: nk, priority });
          frontierSet.add(nk);
          const uc = { ...cc };
          uc[nk] = tentative;
          resultFrames.push({
            visited: new Set(visitedOrder),
            path: new Set<string>(),
            frontier: new Set(frontierSet),
            current: cur.key,
            costs: uc,
            operation: 'exploring',
            description: `Relax: → ${nk} (cost ${tentative.toFixed(0)}, w:${cell.weight})`,
          });
        }
      }
    }

    if (!found && visitedOrder.length > 0) {
      resultFrames.push({
        visited: new Set(visitedOrder),
        path: new Set<string>(),
        frontier: new Set(),
        current: null,
        costs: {},
        operation: 'complete',
        description: 'No path found — destination unreachable',
      });
    }

    const path = reconstructPath(cameFrom, startPos, endPos);
    const pathSet = new Set<string>();
    let totalCost = 0;

    if (path.length > 0) {
      for (let i = 0; i < path.length; i++) {
        const k = path[i];
        pathSet.add(k);
        if (i > 0) { const cell = cellMap.get(k); totalCost += Math.max(1, cell?.weight ?? 1); }
        resultFrames.push({
          visited: new Set(visitedOrder),
          path: new Set(pathSet),
          frontier: new Set(),
          current: k,
          costs: {},
          operation: i === path.length - 1 ? 'complete' : 'reconstructing',
          description: i === path.length - 1
            ? `Path complete! Steps: ${path.length - 1}, Cost: ${totalCost}`
            : `Tracing path… step ${i}`,
        });
      }
    }

    setMetrics({ visitedCount: visitedOrder.length, pathLength: Math.max(0, path.length - 1), totalCost, frontierSize: frontierSet.size });
    setFrames(resultFrames);
    setFrameIdx(0);
    setPlaying(true);
  }, [cellMap, startPos, endPos, algo]);

  const resetPath = useCallback(() => {
    setPlaying(false);
    setFrames([]);
    setFrameIdx(0);
    setMetrics({ visitedCount: 0, pathLength: 0, totalCost: 0, frontierSize: 0 });
  }, []);

  const paintCell = useCallback((r: number, c: number) => {
    if (playing) return;
    setGrid(prev => {
      const clone = prev.map(row => row.map(cell => ({ ...cell })));
      const cur = clone[r][c];
      if (!cur) return prev;
      if (tool === 'start_end') {
        if (cur.type === 'end') return prev;
        for (const row of clone) for (const cell of row) if (cell.type === 'start') { cell.type = 'flat'; cell.weight = 1; }
        cur.type = 'start'; cur.weight = 1;
      } else if (tool === 'end_place') {
        if (cur.type === 'start') return prev;
        for (const row of clone) for (const cell of row) if (cell.type === 'end') { cell.type = 'flat'; cell.weight = 1; }
        cur.type = 'end'; cur.weight = 1;
      } else if (tool === 'wall') {
        if (cur.type === 'start' || cur.type === 'end') return prev;
        cur.type = 'wall'; cur.weight = Infinity;
      } else if (tool === 'flat') {
        if (cur.type === 'start' || cur.type === 'end') return prev;
        cur.type = 'flat'; cur.weight = 1;
      } else if (tool === 'hill') {
        if (cur.type === 'start' || cur.type === 'end') return prev;
        cur.type = 'hill'; cur.weight = 3;
      } else if (tool === 'mtn') {
        if (cur.type === 'start' || cur.type === 'end') return prev;
        cur.type = 'mtn'; cur.weight = 5;
      }
      return clone;
    });
    resetPath();
  }, [tool, playing, resetPath]);

  const visitedNow = cf?.visited ?? new Set<string>();
  const pathNow = cf?.path ?? new Set<string>();
  const frontierNow = cf?.frontier ?? new Set<string>();
  const currentNow = cf?.current;
  const isComplete = cf?.operation === 'complete';
  const isRecon = cf?.operation === 'reconstructing';
  const progress = frames.length ? Math.round((frameIdx / Math.max(1, frames.length - 1)) * 100) : 0;

  const getCellStyle = useCallback((cell: Cell): string => {
    const k = keyOf(cell.row, cell.col);
    if (cell.type === 'start') return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.7)] z-10 scale-105';
    if (cell.type === 'end') return 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,.7)] z-10 scale-105';
    if (pathNow.has(k)) return 'bg-gradient-to-r from-teal-300 via-cyan-400 to-sky-500 shadow-[0_0_10px_rgba(34,211,238,.9)] animate-pulse z-5';
    if (currentNow === k) return 'bg-teal-400 shadow-[0_0_16px_rgba(45,212,191,1)] animate-pulse z-10 scale-110';
    if (frontierNow.has(k)) return 'bg-teal-400/50 animate-pulse';
    if (visitedNow.has(k)) return 'bg-teal-900/80';
    if (cell.type === 'wall') return 'bg-zinc-700';
    if (cell.type === 'hill') return 'bg-slate-600';
    if (cell.type === 'mtn') return 'bg-slate-700';
    return 'bg-cyan-950/40';
  }, [visitedNow, pathNow, frontierNow, currentNow]);

  const opLabel: Record<string, string> = {
    exploring: '⬡ EXPLORING',
    found: '✓ FOUND',
    reconstructing: '⟶ TRACING PATH',
    complete: '■ COMPLETE',
  };

  const drawTools: Array<{ id: TerrainType; label: string; color: string }> = [
    { id: 'wall',      label: 'Wall',       color: '#0f172a' },
    { id: 'flat',      label: 'Flat (1)',   color: '#083344' },
    { id: 'hill',      label: 'Hill (3)',   color: '#475569' },
    { id: 'mtn',       label: 'Mtn (5)',    color: '#334155' },
    { id: 'start_end', label: 'Move Start', color: '#22d3ee' },
    { id: 'end_place', label: 'Move End',   color: '#0ea5e9' },
  ];

  const legendItems = [
    { color: 'bg-cyan-400',   label: 'Start'    },
    { color: 'bg-sky-500',    label: 'End'      },
    { color: 'bg-teal-900',   label: 'Visited'  },
    { color: 'bg-teal-400/50', label: 'Frontier' },
    { color: 'bg-teal-400',   label: 'Current'  },
    { color: 'bg-teal-300',   label: 'Path'     },
    { color: 'bg-zinc-800',   label: 'Wall'     },
    { color: 'bg-slate-600',  label: 'Hill ×3'  },
    { color: 'bg-slate-700',  label: 'Mtn ×5'   },
  ];

  return (
    <div className="flex-1 p-3 bg-[#0a0f0f] overflow-auto">
      <div className="min-w-[960px] rounded-2xl border border-[#1a2e2e] bg-[#0d1a1a] p-3">

        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight font-mono">
              {ALGO_NAMES[algo]}
            </h1>
            <p className="text-[#6aa8a0] text-xs mt-0.5">
              Weighted pathfinding with real-time cost visualization
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[#1a2e2e] bg-[#101e1e] p-1">
            {(['dijkstra', 'astar', 'bfs'] as AlgorithmType[]).map(a => (
              <button
                key={a}
                onClick={() => { setAlgo(a); resetPath(); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  algo === a ? 'bg-teal-500 text-white' : 'text-[#5a9a90] hover:text-white'
                }`}
              >
                {a === 'dijkstra' ? 'Dijkstra' : a === 'astar' ? 'A*' : 'BFS'}
              </button>
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-[1fr_230px] gap-2">

          {/* Grid */}
          <div className="rounded-xl border border-[#1a2e2e] bg-[#0b1515] p-2">
            <div
              className="grid rounded-lg overflow-hidden"
              style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))', gap: '1px' }}
              onMouseLeave={() => { mouseDown.current = false; }}
            >
              {grid.flat().map(cell => {
                const k = keyOf(cell.row, cell.col);
                return (
                  <button
                    key={k}
                    className={`aspect-square rounded-[2px] relative transition-all duration-75 ${getCellStyle(cell)}`}
                    onMouseDown={e => { e.preventDefault(); mouseDown.current = true; paintCell(cell.row, cell.col); }}
                    onMouseEnter={() => { if (mouseDown.current) paintCell(cell.row, cell.col); }}
                    onMouseUp={() => { mouseDown.current = false; }}
                  >
                    {(cell.type === 'start' || cell.type === 'end') && (
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white pointer-events-none">
                        {cell.type === 'start' ? 'S' : 'E'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-[#1a2e2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-100 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-2">

            {/* Status */}
            <div className={`rounded-lg border px-3 py-2 text-center transition-colors ${
              isComplete
                ? 'border-teal-500/40 bg-teal-500/8'
                : 'border-teal-500/30 bg-teal-500/5'
            }`}>
              <div className={`text-[9px] tracking-[.15em] font-bold font-mono ${isComplete ? 'text-teal-400' : 'text-teal-400'}`}>
                {cf ? (opLabel[cf.operation] ?? 'READY') : 'READY'}
              </div>
              <div className={`text-xs font-semibold mt-1 leading-snug ${isComplete ? 'text-teal-300' : 'text-teal-300'}`}>
                {cf?.description || 'Click ▶ to start'}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Visited',     value: visitedNow.size,                                                                          color: 'text-white'      },
                { label: 'Frontier',    value: frontierNow.size,                                                                         color: 'text-teal-400'   },
                { label: 'Path Steps',  value: Math.max(0, pathNow.size - 1),                                                            color: 'text-cyan-400' },
                { label: 'Total Cost',  value: (isRecon || isComplete) ? metrics.totalCost : (cf?.costs[currentNow ?? ''] ?? 0),         color: 'text-teal-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border border-[#1e3232] bg-[#101f1f] p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5a9a8a]">{label}</div>
                  <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="rounded-lg border border-[#1e3232] bg-[#101f1f] p-2 flex-1">
              <div className="text-[9px] uppercase tracking-wider text-[#4a8a80] mb-1.5">How it works</div>
              <p className="text-[10px] text-[#5a9a90] leading-relaxed">{TIPS[algo]}</p>
            </div>

            {/* Legend */}
            <div className="rounded-lg bg-[#0f1e1e] p-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {legendItems.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-sm ${color}`} />
                    <span className="text-[8px] text-[#5a9a8a]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-2 rounded-xl border border-[#1a2e2e] bg-[#0d1a1a] px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[9px] tracking-[.15em] text-[#4a8a80] font-bold uppercase">Draw:</span>
          {drawTools.map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all ${
                tool === id
                  ? 'border-teal-500/60 text-white bg-teal-500/10'
                  : 'border-[#1e3232] text-[#6aa8a0] hover:bg-[#101f1f]'
              }`}
            >
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
              {label}
            </button>
          ))}

          <button
            onClick={() => {
              setGrid(createInitialGrid());
              resetPath();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-[10px] transition-all"
          >
            ✕ Clear All
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                if (frames.length === 0 || frameIdx >= frames.length - 1) runPathfinding();
                else setPlaying(v => !v);
              }}
              className="w-7 h-7 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center text-sm transition-colors"
            >
              {playing ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => { if (frames.length && frameIdx < frames.length - 1) setFrameIdx(v => v + 1); }}
              className="w-7 h-7 rounded-full border border-[#1e3232] text-[#5a9a90] flex items-center justify-center hover:bg-[#101f1f] transition-colors"
            >
              ›
            </button>
            <button
              onClick={resetPath}
              className="w-7 h-7 rounded-full border border-[#1e3232] text-[#5a9a90] flex items-center justify-center hover:bg-[#101f1f] transition-colors"
            >
              ↺
            </button>
            <span className="text-[9px] text-[#4a8a80] uppercase tracking-wider ml-1">Speed</span>
            <input
              type="range" min={0.1} max={1} step={0.05} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-16 h-1 accent-teal-500"
            />
            <span className="text-teal-400 text-xs font-bold font-mono w-8">
              {Math.round(speed * 100)}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}