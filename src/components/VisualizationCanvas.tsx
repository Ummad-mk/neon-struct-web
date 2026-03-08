import { useState, useRef, useEffect } from 'react';
import { DataStructureType } from '../types/dataStructures';
import { LinkedListViz } from './visualizations/LinkedListViz';
import { StackViz } from './visualizations/StackViz';
import { QueueViz } from './visualizations/QueueViz';
import { TreeViz } from './visualizations/TreeViz';
import { GraphViz } from './visualizations/GraphViz';
import { ANIMATION_TIMINGS } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import {
  Search, Plus, Trash2, Shuffle, RotateCcw, ZoomIn, ZoomOut, Maximize,
  SplitSquareHorizontal, CircleDot, Copy, Zap
} from 'lucide-react';

interface Props {
  dsType: DataStructureType;
  state: any;
  viewport: { x: number; y: number; scale: number };
  onViewportChange: (v: { x: number; y: number; scale: number }) => void;
  onMinimapUpdate?: (data: {
    visited: number[];
    found?: number;
    highlight?: number;
    operation: 'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null;
    insertingNode?: number;
    deletingNode?: number;
  }) => void;
  onInsert: (val: number, position?: string) => Promise<any>;
  onDelete: (val?: number | string) => Promise<any>;
  onSearch: (val: number) => Promise<any>;
  onAddRandom: () => Promise<any>;
  onAddEdge?: (u: number, v: number, w: number) => Promise<any>;
  onClear: () => void;
  onReverse?: () => Promise<any>;
  onGetMiddle?: () => Promise<any>;
  onDetectCycle?: () => Promise<any>;
  onRemoveDuplicates?: () => Promise<any>;
  onTraverse?: (type: string) => Promise<any>;
  onFindMinMax?: (type: string) => Promise<any>;
  onFindSuccessorPredecessor?: (val: number, type: string) => Promise<any>;
  onGetHeight?: () => Promise<any>;
  onCountNodes?: () => Promise<any>;
  onRangeSearch?: (min: number, max: number) => Promise<any>;
  onLowestCommonAncestor?: (val1: number, val2: number) => Promise<any>;
  onDeleteEdge?: (from: number | string, to: number | string) => Promise<any>;
  onFindPath?: (start: number | string, end: number | string) => Promise<any>;
  onShortestPath?: (start: number | string, end: number | string) => Promise<any>;
  onTopologicalSort?: () => Promise<any>;
  onMinimumSpanningTree?: () => Promise<any>;
  onKruskalsMST?: () => Promise<any>;
}

export function VisualizationCanvas({
  dsType, state, viewport, onViewportChange, onMinimapUpdate,
  onInsert, onDelete, onSearch, onAddRandom, onAddEdge, onClear,
  onReverse, onGetMiddle, onDetectCycle, onRemoveDuplicates,
  onTraverse, onFindMinMax, onFindSuccessorPredecessor, onGetHeight,
  onCountNodes, onRangeSearch, onLowestCommonAncestor,
  onDeleteEdge, onFindPath, onShortestPath, onTopologicalSort, onMinimumSpanningTree, onKruskalsMST
}: Props) {
  const { theme, animationSpeed } = useTheme();
  const isLight = theme === 'light';

  // Derive speed-scaled timings
  const T = (base: number) => Math.max(50, base / animationSpeed);

  // Input state
  const [inputValue, setInputValue] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');

  // Tree state
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [lcaNode1, setLcaNode1] = useState('');
  const [lcaNode2, setLcaNode2] = useState('');

  // Graph state
  const [graphPathStart, setGraphPathStart] = useState('');
  const [graphPathEnd, setGraphPathEnd] = useState('');

  // Animation state
  const [visited, setVisited] = useState<number[]>([]);
  const [found, setFound] = useState<number | undefined>(undefined);
  const [highlight, setHighlight] = useState<number | undefined>(undefined);
  const [operation, setOperation] = useState<'insert' | 'delete' | 'search' | 'reverse' | 'traverse' | null>(null);
  const [deletingNode, setDeletingNode] = useState<number | undefined>(undefined);
  const [deletePhase, setDeletePhase] = useState<'highlight' | 'fadeOut'>('highlight');
  const [insertingNode, setInsertingNode] = useState<number | undefined>(undefined);
  const [reversingNodes, setReversingNodes] = useState<number[]>([]);
  const [highlightedEdges, setHighlightedEdges] = useState<any[]>([]);
  const [cycleEdgesActive, setCycleEdgesActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Drag/pan
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => { clearAnimationState(); }, [dsType]);
  useEffect(() => {
    onMinimapUpdate?.({
      visited,
      found,
      highlight,
      operation,
      insertingNode,
      deletingNode,
    });
  }, [visited, found, highlight, operation, insertingNode, deletingNode, onMinimapUpdate]);

  const clearAnimationState = () => {
    setVisited([]); setFound(undefined); setHighlight(undefined);
    setOperation(null); setDeletingNode(undefined); setInsertingNode(undefined);
    setReversingNodes([]); setHighlightedEdges([]); setCycleEdgesActive(false); setIsAnimating(false); setStatusMsg('');
    setDeletePhase('highlight');
  };

  // --- Animation helpers ---

  const animateSearch = async (steps: any[], _success: boolean) => {
    setIsAnimating(true);
    setOperation('search');
    setVisited([]);
    setFound(undefined);
    setHighlight(undefined);

    if (!steps || steps.length === 0) { setIsAnimating(false); setOperation(null); return; }

    // Reconstruct a flat list of nodes to visit in order, just in case steps were batched
    const fullPath: number[] = [];
    let finalFound: number | undefined | null = undefined;

    for (const step of steps) {
      const stepVisited = step.state?.visited || step.visited || [];
      for (const cur of stepVisited) {
        if (!fullPath.includes(cur)) fullPath.push(cur);
      }
      if (step.state?.found !== undefined) finalFound = step.state.found;
    }


    // Now actively scan through the reconstructed path one by one
    setVisited([]);
    for (let i = 0; i < fullPath.length; i++) {
      // ... (this logic handles finding logic for search)
    }

    // ACTUALLY: for graph algorithms like MST or Pathfinding, we want to animate STEPS directly.
    // The current animateSearch flattens steps. Let's modify it to just play back steps as frames!
    // But to not break old search:
    let isGraphAlgo = steps.some(s => s.state?.highlighted_edges !== undefined);

    if (isGraphAlgo) {
      setVisited([]);
      for (const step of steps) {
        const sv = step.state?.visited || step.visited || [];
        setVisited(sv);
        if (step.state?.found !== undefined) setFound(step.state.found);
        if (step.state?.highlighted_edges) {
          setHighlightedEdges(step.state.highlighted_edges);
          const isCycleStep = typeof step.message === 'string' && step.message.toLowerCase().includes('cycle');
          setCycleEdgesActive(isCycleStep);
        } else {
          setCycleEdgesActive(false);
        }

        if (step.message) setStatusMsg(step.message);
        await new Promise(r => setTimeout(r, T(600))); // slower for graph
      }
      setIsAnimating(false);
      setOperation(null);
      return;
    }

    const finalFoundIdx = finalFound;
    for (let i = 0; i < fullPath.length; i++) {
      const cur = fullPath[i];

      // Is this the found node?
      if (cur === finalFoundIdx) {
        setVisited(prev => [...prev, cur]);
        setFound(finalFoundIdx);
        setHighlight(undefined);
        setStatusMsg(`✓ Found ${finalFoundIdx}!`);
        await new Promise(r => setTimeout(r, T(400))); // 400ms green pulse
        setIsAnimating(false);
        setOperation(null);
        return;
      }

      // Just scanning
      setHighlight(cur);
      setVisited(prev => [...prev, cur]);
      setStatusMsg(`Checking node [${cur}]…`);
      await new Promise(r => setTimeout(r, T(150))); // 150ms yellow scan pause
    }

    if (finalFoundIdx !== undefined && finalFoundIdx !== null) {
      setFound(finalFoundIdx);
      setHighlight(undefined);
      setStatusMsg(`✓ Found ${finalFoundIdx}!`);
      await new Promise(r => setTimeout(r, T(400)));
      setIsAnimating(false);
      setOperation(null);
      return;
    }

    setStatusMsg('✗ Not found');
    await new Promise(r => setTimeout(r, T(200)));
    setIsAnimating(false);
    setOperation(null);
  };

  const animateInsert = async (nodeIndex?: number) => {
    setIsAnimating(true);
    setOperation('insert');
    if (nodeIndex !== undefined) setInsertingNode(nodeIndex);
    setStatusMsg('Inserting…');
    await new Promise(r => setTimeout(r, T(ANIMATION_TIMINGS.insert)));
    clearAnimationState();
  };

  const animateDelete = async (nodeIndex?: number, searchPath: number[] = []) => {
    setIsAnimating(true);
    setOperation('delete');

    // 1. Scanning cursor (Search phase of delete)
    if (searchPath.length > 0) {
      setVisited([]);
      for (let i = 0; i < searchPath.length; i++) {
        const cur = searchPath[i];
        setHighlight(cur);
        setVisited(prev => [...prev, cur]);
        if (cur === nodeIndex) {
          // Target found - skip green pulse, go straight to red marking
          setStatusMsg(`Target [${nodeIndex}] located`);
          break;
        } else {
          setStatusMsg(`Checking node [${cur}]…`);
          await new Promise(r => setTimeout(r, T(150))); // 150ms yellow scan
        }
      }
    }

    // 2. Red Marker phase
    setFound(undefined);
    setHighlight(undefined);
    if (nodeIndex !== undefined) setDeletingNode(nodeIndex);
    setDeletePhase('highlight');
    setStatusMsg('Marking for deletion…');
    await new Promise(r => setTimeout(r, T(400))); // 400ms red marker pause

    // 3. Shrink + Fade phase
    setDeletePhase('fadeOut');
    setStatusMsg('Deleting…');
    await new Promise(r => setTimeout(r, T(200))); // 200ms fade duration

    // 4. Cleanup
    clearAnimationState();
  };

  // --- Handlers ---

  const handleInsert = async (position?: string) => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    setInputValue('');
    const result = await onInsert(val, position);
    if (result?.success && result.state) {
      const nodes = result.state.nodes || result.state.items || [];
      if (nodes.length > 0) await animateInsert(position === 'front' ? 0 : nodes.length - 1);
    }
  };

  const handleDelete = async (positionOrVal?: string | number) => {
    let val: number | undefined;
    if (typeof positionOrVal === 'number') {
      val = positionOrVal;
    } else if (inputValue && typeof positionOrVal !== 'string') {
      val = parseInt(inputValue);
    }

    // Clear input after taking value ONLY if we aren't passing a specific position string 
    // Wait, let's keep it simple: if there's text input and we didn't pass "front"/"rear", take input
    if (typeof positionOrVal !== 'string') {
      setInputValue('');
    }

    if (dsType === 'stack' || dsType === 'queue' || dsType === 'deque') {
      const arg = (dsType === 'deque' && typeof positionOrVal === 'string') ? positionOrVal : undefined;
      const result = await onDelete(arg);
      if (result?.success) {
        // If we removed rear from deque, animate index size-1
        const indexToAnimate = arg === 'rear' && state?.size ? state.size - 1 : 0;
        await animateDelete(indexToAnimate);
      }
      return;
    }
    if (val === undefined || isNaN(val)) return;

    let nodeIndex: number | undefined;
    let searchPath: number[] = [];
    if (state?.nodes) {
      nodeIndex = state.nodes.indexOf(val);
      if (nodeIndex !== undefined && nodeIndex >= 0) {
        for (let i = 0; i <= nodeIndex; i++) searchPath.push(i);
      }
    }

    if (nodeIndex !== undefined && nodeIndex >= 0) {
      await animateDelete(nodeIndex, searchPath);
    }

    // Actually execute the backend delete now that animation is over
    const result = await onDelete(val);

    // Fallback if node wasn't in local state prior to delete
    if (nodeIndex === undefined || nodeIndex < 0) {
      if (result?.success) await animateDelete(nodeIndex);
      else clearAnimationState();
    }
  };

  const handleSearch = async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    const result = await onSearch(val);
    if (result?.steps?.length > 0) {
      await animateSearch(result.steps, result.success);
    } else if (result?.found !== undefined) {
      setFound(result.found);
      await new Promise(r => setTimeout(r, T(ANIMATION_TIMINGS.found)));
      clearAnimationState();
    }
  };

  const handleAddEdge = async () => {
    if (!onAddEdge) return;
    const u = parseInt(edgeFrom), v = parseInt(edgeTo), w = parseInt(edgeWeight) || 1;
    if (isNaN(u) || isNaN(v)) return;
    setEdgeFrom(''); setEdgeTo(''); setEdgeWeight('1');
    await onAddEdge(u, v, w);
  };

  // Priority queue unused handlers removed

  const handleReverse = async () => {
    if (!onReverse) return;
    setOperation('reverse'); setIsAnimating(true);
    if (state?.nodes) setReversingNodes(state.nodes.map((_: any, i: number) => i));
    await onReverse();
    await new Promise(r => setTimeout(r, T(ANIMATION_TIMINGS.insert)));
    clearAnimationState();
  };

  const handleTreeTraverse = async (type: string) => {
    if (!onTraverse) return;
    setOperation('traverse'); setIsAnimating(true);
    const result = await onTraverse(type);
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeMinMax = async (type: string) => {
    if (!onFindMinMax) return;
    setOperation('search'); setIsAnimating(true);
    const result = await onFindMinMax(type);
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeSuccPred = async (type: string) => {
    if (!onFindSuccessorPredecessor) return;
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    setOperation('search'); setIsAnimating(true);
    const result = await onFindSuccessorPredecessor(val, type);
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeHeight = async () => {
    if (!onGetHeight) return;
    setOperation('traverse'); setIsAnimating(true);
    const result = await onGetHeight();
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeCount = async () => {
    if (!onCountNodes) return;
    setOperation('traverse'); setIsAnimating(true);
    const result = await onCountNodes();
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeRangeSearch = async () => {
    if (!onRangeSearch) return;
    const min = parseInt(rangeMin);
    const max = parseInt(rangeMax);
    if (isNaN(min) || isNaN(max)) return;

    setOperation('search'); setIsAnimating(true);
    const result = await onRangeSearch(min, max);
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  const handleTreeLCA = async () => {
    if (!onLowestCommonAncestor) return;
    const n1 = parseInt(lcaNode1);
    const n2 = parseInt(lcaNode2);
    if (isNaN(n1) || isNaN(n2)) return;

    setOperation('search'); setIsAnimating(true);
    const result = await onLowestCommonAncestor(n1, n2);
    if (result && result.steps) await animateSearch(result.steps, result.success);
    clearAnimationState();
  };

  // Zoom/pan
  const handleZoomIn = () => onViewportChange({ ...viewport, scale: Math.min(viewport.scale + 0.1, 3) });
  const handleZoomOut = () => onViewportChange({ ...viewport, scale: Math.max(viewport.scale - 0.1, 0.3) });
  const handleResetZoom = () => onViewportChange({ x: 0, y: 0, scale: 1 });
  const handleMouseDown = (e: React.MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x, dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    onViewportChange({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    onViewportChange({ ...viewport, scale: Math.max(0.3, Math.min(3, viewport.scale + delta)) });
  };

  // Visualization render
  const renderVisualization = () => {
    if (!state) return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className={`text-2xl mb-2 font-mono ${isLight ? 'text-gray-300' : 'text-gray-600'}`}>No Data</p>
          <p className={`text-sm ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>Use the controls below to add elements</p>
        </div>
      </div>
    );
    const normalizeValue = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '' && !isNaN(Number(trimmed))) return Number(trimmed);
      }
      return val;
    };

    const normalizeGraphData = (raw: any) => {
      const rawVertices = Array.isArray(raw?.vertices) ? raw.vertices : [];
      const vertices = rawVertices.map(normalizeValue);
      const edgesRaw = raw?.edges;
      const weightsRaw = raw?.weights || {};
      const edges: any[] = [];
      const weightCandidates = (from: any, to: any) => {
        const f = String(from);
        const t = String(to);
        return [
          `${f},${t}`,
          `${f}, ${t}`,
          `(${f},${t})`,
          `(${f}, ${t})`,
        ];
      };
      const resolveWeight = (from: any, to: any) => {
        for (const key of weightCandidates(from, to)) {
          if (weightsRaw && Object.prototype.hasOwnProperty.call(weightsRaw, key)) {
            const w = weightsRaw[key];
            return typeof w === 'number' ? w : Number(w) || 1;
          }
        }
        return 1;
      };

      if (Array.isArray(edgesRaw)) {
        edgesRaw.forEach((edge: any) => {
          if (edge && edge.from !== undefined && edge.to !== undefined) {
            edges.push({
              from: normalizeValue(edge.from),
              to: normalizeValue(edge.to),
              weight: edge.weight ?? resolveWeight(edge.from, edge.to),
            });
          } else if (Array.isArray(edge) && edge.length >= 2) {
            edges.push({
              from: normalizeValue(edge[0]),
              to: normalizeValue(edge[1]),
              weight: edge[2] ?? resolveWeight(edge[0], edge[1]),
            });
          }
        });
      } else if (edgesRaw && typeof edgesRaw === 'object') {
        Object.entries(edgesRaw).forEach(([from, tos]) => {
          if (Array.isArray(tos)) {
            tos.forEach((to: any) => {
              edges.push({
                from: normalizeValue(from),
                to: normalizeValue(to),
                weight: resolveWeight(from, to),
              });
            });
          }
        });
      }

      const derivedVertices = vertices.length
        ? vertices
        : Array.from(new Set(edges.flatMap(edge => [edge.from, edge.to])));

      return { vertices: derivedVertices, edges };
    };

    const vizProps = { data: state, visited, found, highlight };
    switch (dsType) {
      case 'singly_linked_list': return <LinkedListViz {...vizProps} type="singly" operation={operation} reversingNodes={reversingNodes} deletingNode={deletingNode} deletePhase={deletePhase} insertingNode={insertingNode} />;
      case 'doubly_linked_list': return <LinkedListViz {...vizProps} type="doubly" operation={operation} reversingNodes={reversingNodes} deletingNode={deletingNode} deletePhase={deletePhase} insertingNode={insertingNode} />;
      case 'stack': return <StackViz {...vizProps} operation={operation} />;
      case 'queue': case 'deque': return <QueueViz {...vizProps} type={dsType === 'deque' ? 'deque' : 'queue'} operation={operation} insertingNode={insertingNode} deletingNode={deletingNode} />;
      case 'priority_queue': return <QueueViz {...vizProps} type="priority_queue" operation={operation} insertingNode={insertingNode} deletingNode={deletingNode} />;
      case 'bst': case 'avl': return <TreeViz {...vizProps} operation={operation} insertingNode={insertingNode} deletingNode={deletingNode} />;
      case 'graph':
      case 'directed_graph': {
        const graphData = normalizeGraphData(state);
        return <GraphViz data={graphData as any} visited={visited} found={found} operation={operation} insertingNode={insertingNode} deletingNode={deletingNode} highlightedEdges={highlightedEdges} cycleEdgesActive={cycleEdgesActive} />;
      }
      default: return <div className="text-gray-500 text-center p-8">Visualization not available</div>;
    }
  };

  // Labels
  const labels = dsType === 'stack' ? { insert: 'Push', delete: 'Pop', search: 'Peek' }
    : dsType === 'queue' ? { insert: 'Enqueue', delete: 'Dequeue', search: 'Search' }
      : dsType === 'deque' ? { insert: 'Insert', delete: 'Remove', search: 'Search' }
        : { insert: 'Insert', delete: 'Delete', search: 'Search' };

  const inputCls = `w-28 px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors ${isLight
    ? 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400'
    : 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500'
    }`;

  const btnCls = (color: string, hoverColor: string, borderColor: string, textColor: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${color} ${borderColor} ${textColor} ${hoverColor} disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${isLight ? 'bg-[#f5f7ff]' : 'bg-[#050b14]'}`}>

      {/* Top toolbar — zoom only */}
      <div className={`border-b px-4 py-2 flex items-center justify-between z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-[#0a1120] border-gray-800'
        }`}>
        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-sm font-mono ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          {statusMsg || 'System Online. Ready for Input.'}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}><ZoomOut size={16} /></button>
          <span className={`text-xs font-mono w-12 text-center ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>{Math.round(viewport.scale * 100)}%</span>
          <button onClick={handleZoomIn} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}><ZoomIn size={16} /></button>
          <button onClick={handleResetZoom} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}><Maximize size={16} /></button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Content */}
        <div
          className="min-h-full flex items-center justify-center p-8"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: 'center center',
            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {renderVisualization()}
        </div>
      </div>

      {/* ===== Bottom Toolbar ===== */}
      <div className={`border-t px-4 py-3 flex flex-wrap items-center gap-2 z-10 ${isLight ? 'bg-white border-gray-200' : 'bg-[#0a1120] border-gray-800'
        }`}>

        {/* Value input + main ops */}
        <input
          type="number"
          placeholder="Enter value"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInsert()}
          className={inputCls}
          disabled={isAnimating}
        />

        {dsType === 'deque' ? (
          <>
            <button onClick={() => handleInsert('front')} disabled={isAnimating || !inputValue}
              className={btnCls('bg-cyan-500/10', 'hover:bg-cyan-500/20', 'border-cyan-500/50', 'text-cyan-500')}>
              <Plus size={15} />Insert Front
            </button>
            <button onClick={() => handleInsert('rear')} disabled={isAnimating || !inputValue}
              className={btnCls('bg-cyan-500/10', 'hover:bg-cyan-500/20', 'border-cyan-500/50', 'text-cyan-500')}>
              <Plus size={15} />Insert Rear
            </button>
            <button
              onClick={() => handleDelete('front')}
              disabled={isAnimating}
              className={btnCls('bg-red-500/10', 'hover:bg-red-500/20', 'border-red-500/50', 'text-red-500')}>
              <Trash2 size={15} />Remove Front
            </button>
            <button
              onClick={() => handleDelete('rear')}
              disabled={isAnimating}
              className={btnCls('bg-red-500/10', 'hover:bg-red-500/20', 'border-red-500/50', 'text-red-500')}>
              <Trash2 size={15} />Remove Rear
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleInsert()} disabled={isAnimating || !inputValue}
              className={btnCls('bg-cyan-500/10', 'hover:bg-cyan-500/20', 'border-cyan-500/50', 'text-cyan-500')}>
              <Plus size={15} />{labels.insert}
            </button>
            <button
              onClick={() => handleDelete()}
              disabled={isAnimating || (dsType !== 'stack' && dsType !== 'queue' && !inputValue)}
              className={btnCls('bg-red-500/10', 'hover:bg-red-500/20', 'border-red-500/50', 'text-red-500')}>
              <Trash2 size={15} />{labels.delete}
            </button>
          </>
        )}

        <button onClick={handleSearch} disabled={isAnimating || !inputValue}
          className={btnCls('bg-yellow-500/10', 'hover:bg-yellow-500/20', 'border-yellow-500/50', 'text-yellow-500')}>
          <Search size={15} />{labels.search}
        </button>

        <div className={`h-5 w-px ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />

        {/* Quick ops */}
        <button onClick={async () => {
          if (!onAddRandom) return;
          const result = await onAddRandom();
          if (result?.success && result.state && result.results) {
            const addedVals = result.results || [];
            for (const addedVal of addedVals) {
              const nodeIdentifier = (dsType === 'bst' || dsType === 'avl' || dsType === 'graph') ? addedVal : addedVal;
              await animateInsert(nodeIdentifier);
            }
          }
        }} disabled={isAnimating}
          className={btnCls('bg-purple-500/10', 'hover:bg-purple-500/20', 'border-purple-500/50', 'text-purple-500')}>
          <Shuffle size={15} />Random
        </button>
        <button onClick={onClear} disabled={isAnimating}
          className={btnCls(isLight ? 'bg-gray-100' : 'bg-gray-800/50', 'hover:opacity-80', isLight ? 'border-gray-200' : 'border-gray-700', isLight ? 'text-gray-600' : 'text-gray-400')}>
          <Trash2 size={15} />Clear
        </button>

        {/* Linked list specific */}
        {onReverse && (
          <button onClick={handleReverse} disabled={isAnimating}
            className={btnCls('bg-pink-500/10', 'hover:bg-pink-500/20', 'border-pink-500/50', 'text-pink-500')}>
            <RotateCcw size={15} />Reverse
          </button>
        )}
        {onGetMiddle && (
          <button onClick={onGetMiddle} disabled={isAnimating}
            className={btnCls('bg-teal-500/10', 'hover:bg-teal-500/20', 'border-teal-500/50', 'text-teal-500')}>
            <SplitSquareHorizontal size={15} />Middle
          </button>
        )}
        {onDetectCycle && dsType === 'singly_linked_list' && (
          <button onClick={onDetectCycle} disabled={isAnimating}
            className={btnCls('bg-orange-500/10', 'hover:bg-orange-500/20', 'border-orange-500/50', 'text-orange-500')}>
            <CircleDot size={15} />Cycle?
          </button>
        )}
        {onRemoveDuplicates && (
          <button onClick={onRemoveDuplicates} disabled={isAnimating}
            className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500')}>
            <Copy size={15} />Dedup
          </button>
        )}

        {/* Tree specific ops */}
        {(dsType === 'bst' || dsType === 'avl') && (
          <div className={`mt-2 pt-2 border-t w-full flex flex-wrap items-center gap-2 ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
            <button onClick={() => handleTreeTraverse('inorder')} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500')}>Inorder</button>
            <button onClick={() => handleTreeTraverse('preorder')} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500')}>Preorder</button>
            <button onClick={() => handleTreeTraverse('postorder')} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500')}>Postorder</button>
            <button onClick={() => handleTreeTraverse('levelorder')} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500')}>Levelorder</button>

            <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />

            <button onClick={() => handleTreeMinMax('min')} disabled={isAnimating} className={btnCls('bg-emerald-500/10', 'hover:bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-500')}>Min</button>
            <button onClick={() => handleTreeMinMax('max')} disabled={isAnimating} className={btnCls('bg-emerald-500/10', 'hover:bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-500')}>Max</button>
            <button onClick={() => handleTreeSuccPred('successor')} disabled={isAnimating || !inputValue} className={btnCls('bg-emerald-500/10', 'hover:bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-500')}>Successor</button>
            <button onClick={() => handleTreeSuccPred('predecessor')} disabled={isAnimating || !inputValue} className={btnCls('bg-emerald-500/10', 'hover:bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-500')}>Predecessor</button>

            <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />

            <button onClick={handleTreeHeight} disabled={isAnimating} className={btnCls('bg-sky-500/10', 'hover:bg-sky-500/20', 'border-sky-500/50', 'text-sky-500')}>Height</button>
            <button onClick={handleTreeCount} disabled={isAnimating} className={btnCls('bg-sky-500/10', 'hover:bg-sky-500/20', 'border-sky-500/50', 'text-sky-500')}>Count Nodes</button>

            <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />

            <div className="flex items-center gap-1 bg-black/10 rounded-lg p-1">
              <input type="number" placeholder="Min" value={rangeMin} onChange={e => setRangeMin(e.target.value)} className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
              <input type="number" placeholder="Max" value={rangeMax} onChange={e => setRangeMax(e.target.value)} className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
              <button onClick={handleTreeRangeSearch} disabled={isAnimating || !rangeMin || !rangeMax} className={btnCls('bg-fuchsia-500/10', 'hover:bg-fuchsia-500/20', 'border-fuchsia-500/50', 'text-fuchsia-500 !py-1 !text-xs')}>Range Search</button>
            </div>

            <div className="flex items-center gap-1 bg-black/10 rounded-lg p-1">
              <input type="number" placeholder="u" value={lcaNode1} onChange={e => setLcaNode1(e.target.value)} className={`w-12 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
              <input type="number" placeholder="v" value={lcaNode2} onChange={e => setLcaNode2(e.target.value)} className={`w-12 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
              <button onClick={handleTreeLCA} disabled={isAnimating || !lcaNode1 || !lcaNode2} className={btnCls('bg-fuchsia-500/10', 'hover:bg-fuchsia-500/20', 'border-fuchsia-500/50', 'text-fuchsia-500 !py-1 !text-xs')}>LCA</button>
            </div>
          </div>
        )}

        {/* Graph Specific Controls */}
        {(dsType === 'graph' || dsType === 'directed_graph') && (
          <div className={`mt-2 pt-2 border-t w-full flex flex-wrap items-center gap-2 ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
            {onAddEdge && (
              <>
                <input type="text" placeholder="From" value={edgeFrom} onChange={e => setEdgeFrom(e.target.value)}
                  className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900 border-gray-300' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
                <input type="text" placeholder="To" value={edgeTo} onChange={e => setEdgeTo(e.target.value)}
                  className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900 border-gray-300' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
                <input type="number" placeholder="W" value={edgeWeight} onChange={e => setEdgeWeight(e.target.value)}
                  className={`w-12 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900 border-gray-300' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
                <button onClick={handleAddEdge} disabled={isAnimating || !edgeFrom || !edgeTo}
                  className={btnCls('bg-green-500/10', 'hover:bg-green-500/20', 'border-green-500/50', 'text-green-500 !py-1 !text-xs')}>
                  <Plus size={13} />Edge
                </button>
                {onDeleteEdge && (
                  <button onClick={async () => {
                    const fromVal = parseInt(edgeFrom);
                    const toVal = parseInt(edgeTo);
                    if (isNaN(fromVal) || isNaN(toVal)) return;
                    setEdgeFrom(''); setEdgeTo(''); setEdgeWeight('1');
                    const result = await onDeleteEdge(fromVal, toVal);
                    if (result?.success) await animateDelete(undefined, []);
                  }} disabled={isAnimating || !edgeFrom || !edgeTo}
                    className={btnCls('bg-red-500/10', 'hover:bg-red-500/20', 'border-red-500/50', 'text-red-500 !py-1 !text-xs')}>
                    <Trash2 size={13} />Edge
                  </button>
                )}
                <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />
              </>
            )}

            {onTraverse && (
              <>
                <button onClick={async () => {
                  setOperation('traverse'); setIsAnimating(true);
                  const res = await onTraverse('bfs');
                  if (res?.steps) await animateSearch(res.steps, true);
                  clearAnimationState();
                }} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500 !py-1 !text-xs')}>BFS</button>
                <button onClick={async () => {
                  setOperation('traverse'); setIsAnimating(true);
                  const res = await onTraverse('dfs');
                  if (res?.steps) await animateSearch(res.steps, true);
                  clearAnimationState();
                }} disabled={isAnimating} className={btnCls('bg-indigo-500/10', 'hover:bg-indigo-500/20', 'border-indigo-500/50', 'text-indigo-500 !py-1 !text-xs')}>DFS</button>
                <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />
              </>
            )}

            {onDetectCycle && (
              <button onClick={async () => {
                setOperation('traverse'); setIsAnimating(true);
                const res = await onDetectCycle();
                if (res?.steps) await animateSearch(res.steps, res.success);
                if (res?.has_cycle) await new Promise(r => setTimeout(r, 5000));
                clearAnimationState();
              }} disabled={isAnimating} className={btnCls('bg-orange-500/10', 'hover:bg-orange-500/20', 'border-orange-500/50', 'text-orange-500 !py-1 !text-xs')}>Detect Cycle</button>
            )}

            {(onFindPath || onShortestPath) && (
              <div className="flex items-center gap-1 bg-black/10 rounded-lg p-1">
                <input type="text" placeholder="Start" value={graphPathStart} onChange={e => setGraphPathStart(e.target.value)} className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900 border-gray-300' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />
                <input type="text" placeholder="End" value={graphPathEnd} onChange={e => setGraphPathEnd(e.target.value)} className={`w-14 px-1 py-1 rounded text-xs focus:outline-none ${isLight ? 'bg-white border text-gray-900 border-gray-300' : 'bg-gray-800 border-gray-700 text-white'}`} disabled={isAnimating} />

                {onFindPath && (
                  <button onClick={async () => {
                    setOperation('search'); setIsAnimating(true);
                    const res = await onFindPath(graphPathStart, graphPathEnd);
                    if (res?.steps) await animateSearch(res.steps, res.success);
                    clearAnimationState();
                  }} disabled={isAnimating || !graphPathStart || !graphPathEnd} className={btnCls('bg-fuchsia-500/10', 'hover:bg-fuchsia-500/20', 'border-fuchsia-500/50', 'text-fuchsia-500 !py-1 !text-xs')}>Find Path</button>
                )}
                {onShortestPath && (
                  <button onClick={async () => {
                    setOperation('search'); setIsAnimating(true);
                    const res = await onShortestPath(graphPathStart, graphPathEnd);
                    if (res?.steps) await animateSearch(res.steps, res.success);
                    clearAnimationState();
                  }} disabled={isAnimating || !graphPathStart || !graphPathEnd} className={btnCls('bg-purple-500/10', 'hover:bg-purple-500/20', 'border-purple-500/50', 'text-purple-500 !py-1 !text-xs')}>Shortest Path</button>
                )}
              </div>
            )}

            <div className={`h-5 w-px mx-1 ${isLight ? 'bg-gray-200' : 'bg-gray-700'}`} />

            {onTopologicalSort && (
              <button onClick={async () => {
                setOperation('traverse'); setIsAnimating(true);
                const res = await onTopologicalSort();
                if (res?.steps) await animateSearch(res.steps, res.success);
                clearAnimationState();
              }} disabled={isAnimating} className={btnCls('bg-sky-500/10', 'hover:bg-sky-500/20', 'border-sky-500/50', 'text-sky-500 !py-1 !text-xs')}>Topological Sort</button>
            )}

            {onMinimumSpanningTree && (
              <button onClick={async () => {
                setOperation('traverse'); setIsAnimating(true);
                const res = await onMinimumSpanningTree();
                if (res?.steps) await animateSearch(res.steps, res.success);
                clearAnimationState();
              }} disabled={isAnimating} className={btnCls('bg-yellow-500/10', 'hover:bg-yellow-500/20', 'border-yellow-500/50', 'text-yellow-500 !py-1 !text-xs')}>MST (Prim's)</button>
            )}

            {onKruskalsMST && (
              <button onClick={async () => {
                setOperation('traverse'); setIsAnimating(true);
                const res = await onKruskalsMST();
                if (res?.steps) await animateSearch(res.steps, res.success);
                clearAnimationState();
              }} disabled={isAnimating} className={btnCls('bg-orange-500/10', 'hover:bg-orange-500/20', 'border-orange-500/50', 'text-orange-500 !py-1 !text-xs')}>MST (Kruskal's)</button>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Animation Speed indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${isLight ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-gray-800/60 border-gray-700 text-gray-400'
          }`}>
          <Zap size={13} className="text-cyan-500" />
          <span className="uppercase tracking-wider">Animation Speed</span>
          <span className="text-cyan-500 font-black ml-1">{animationSpeed}x</span>
        </div>

      </div>
    </div>
  );
}
