import { useEffect, useMemo, useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

type Algorithm = 'bfs' | 'dfs' | 'dijkstra' | 'topo' | 'cycle' | 'scc';
type NodeState = 'default' | 'source' | 'visited' | 'active' | 'queue' | 'path' | 'cycle' | 'scc';
type EdgeState = 'default' | 'traversed' | 'tree' | 'back' | 'forward' | 'cross' | 'shortest' | 'relaxed';

interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: NodeState;
  distance?: number;
  discovery?: number;
  finish?: number;
  sccId?: number;
}

interface GraphEdge {
  from: number;
  to: number;
  weight: number;
  state: EdgeState;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface Props {
  data?: any;
  isAnimating?: boolean;
}

const ALGORITHMS: { id: Algorithm; name: string; desc: string }[] = [
  { id: 'bfs', name: 'BFS', desc: 'BFS visits all nodes one step away first, then two steps away, then three — like ripples spreading from a stone dropped in water.' },
  { id: 'dfs', name: 'DFS', desc: 'DFS goes as deep as possible along one path before trying another — like exploring a maze by always taking the first available turn.' },
  { id: 'dijkstra', name: 'Dijkstra', desc: "Dijkstra's always processes the closest unvisited node next, gradually building a map of the shortest distances from the source." },
  { id: 'topo', name: 'Topo Sort', desc: 'Topological sort finds an order where all arrows point forward — every node appears after all its prerequisites.' },
  { id: 'cycle', name: 'Cycle', desc: 'A cycle means you can follow arrows and end up back where you started — like a loop you can never escape.' },
  { id: 'scc', name: 'SCC', desc: 'A strongly connected component is a group of nodes where everyone can reach everyone else — a neighborhood with two-way streets between all members.' },
];

const PRESETS: { name: string; graph: GraphData; desc: string }[] = [
  {
    name: 'Simple DAG',
    desc: 'A directed acyclic graph — follow the arrows and you will never come back to a node you have already visited.',
    graph: {
      nodes: [
        { id: 0, label: 'A', x: 200, y: 100, vx: 0, vy: 0, state: 'default' },
        { id: 1, label: 'B', x: 100, y: 200, vx: 0, vy: 0, state: 'default' },
        { id: 2, label: 'C', x: 300, y: 200, vx: 0, vy: 0, state: 'default' },
        { id: 3, label: 'D', x: 100, y: 300, vx: 0, vy: 0, state: 'default' },
        { id: 4, label: 'E', x: 300, y: 300, vx: 0, vy: 0, state: 'default' },
        { id: 5, label: 'F', x: 200, y: 400, vx: 0, vy: 0, state: 'default' },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, state: 'default' },
        { from: 0, to: 2, weight: 1, state: 'default' },
        { from: 1, to: 3, weight: 1, state: 'default' },
        { from: 1, to: 4, weight: 1, state: 'default' },
        { from: 2, to: 4, weight: 1, state: 'default' },
        { from: 3, to: 5, weight: 1, state: 'default' },
        { from: 4, to: 5, weight: 1, state: 'default' },
      ],
    },
  },
  {
    name: 'With Cycle',
    desc: 'Can you spot the cycle before running the algorithm?',
    graph: {
      nodes: [
        { id: 0, label: 'A', x: 200, y: 80, vx: 0, vy: 0, state: 'default' },
        { id: 1, label: 'B', x: 100, y: 180, vx: 0, vy: 0, state: 'default' },
        { id: 2, label: 'C', x: 300, y: 180, vx: 0, vy: 0, state: 'default' },
        { id: 3, label: 'D', x: 100, y: 300, vx: 0, vy: 0, state: 'default' },
        { id: 4, label: 'E', x: 300, y: 300, vx: 0, vy: 0, state: 'default' },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, state: 'default' },
        { from: 0, to: 2, weight: 1, state: 'default' },
        { from: 1, to: 3, weight: 1, state: 'default' },
        { from: 2, to: 4, weight: 1, state: 'default' },
        { from: 3, to: 1, weight: 1, state: 'default' },
        { from: 4, to: 2, weight: 1, state: 'default' },
      ],
    },
  },
  {
    name: 'Complete',
    desc: 'Every node can reach every other — one strongly connected component.',
    graph: {
      nodes: [
        { id: 0, label: 'A', x: 200, y: 80, vx: 0, vy: 0, state: 'default' },
        { id: 1, label: 'B', x: 80, y: 200, vx: 0, vy: 0, state: 'default' },
        { id: 2, label: 'C', x: 320, y: 200, vx: 0, vy: 0, state: 'default' },
        { id: 3, label: 'D', x: 80, y: 320, vx: 0, vy: 0, state: 'default' },
        { id: 4, label: 'E', x: 320, y: 320, vx: 0, vy: 0, state: 'default' },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, state: 'default' },
        { from: 0, to: 2, weight: 1, state: 'default' },
        { from: 1, to: 0, weight: 1, state: 'default' },
        { from: 1, to: 3, weight: 1, state: 'default' },
        { from: 1, to: 4, weight: 1, state: 'default' },
        { from: 2, to: 0, weight: 1, state: 'default' },
        { from: 2, to: 1, weight: 1, state: 'default' },
        { from: 2, to: 4, weight: 1, state: 'default' },
        { from: 3, to: 1, weight: 1, state: 'default' },
        { from: 3, to: 2, weight: 1, state: 'default' },
        { from: 3, to: 4, weight: 1, state: 'default' },
        { from: 4, to: 1, weight: 1, state: 'default' },
        { from: 4, to: 2, weight: 1, state: 'default' },
        { from: 4, to: 3, weight: 1, state: 'default' },
      ],
    },
  },
  {
    name: 'Weighted',
    desc: 'Shortest path by total weight — not necessarily the fewest edges.',
    graph: {
      nodes: [
        { id: 0, label: 'A', x: 100, y: 150, vx: 0, vy: 0, state: 'default' },
        { id: 1, label: 'B', x: 250, y: 80, vx: 0, vy: 0, state: 'default' },
        { id: 2, label: 'C', x: 400, y: 150, vx: 0, vy: 0, state: 'default' },
        { id: 3, label: 'D', x: 100, y: 300, vx: 0, vy: 0, state: 'default' },
        { id: 4, label: 'E', x: 250, y: 250, vx: 0, vy: 0, state: 'default' },
        { id: 5, label: 'F', x: 400, y: 300, vx: 0, vy: 0, state: 'default' },
        { id: 6, label: 'G', x: 250, y: 400, vx: 0, vy: 0, state: 'default' },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, state: 'default' },
        { from: 0, to: 3, weight: 2, state: 'default' },
        { from: 1, to: 2, weight: 3, state: 'default' },
        { from: 1, to: 4, weight: 1, state: 'default' },
        { from: 2, to: 5, weight: 5, state: 'default' },
        { from: 3, to: 4, weight: 3, state: 'default' },
        { from: 4, to: 2, weight: 1, state: 'default' },
        { from: 4, to: 5, weight: 2, state: 'default' },
        { from: 4, to: 6, weight: 4, state: 'default' },
        { from: 5, to: 6, weight: 2, state: 'default' },
      ],
    },
  },
];

const SCC_COLORS = ['#3ac8a0', '#c0a030', '#a040c0', '#c06060', '#4080b0', '#80c040'];

export function DirectedGraphViz({ data, isAnimating }: Props) {
  void data;
  void isAnimating;
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [sourceNode, setSourceNode] = useState<number>(0);
  const [frames, setFrames] = useState<any[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [, setSelectedNode] = useState<number | null>(null);
  const [edgeMode, setEdgeMode] = useState<'select' | 'add-edge'>('select');
  const [edgeStart, setEdgeStart] = useState<number | null>(null);
  const [topoOrder, setTopoOrder] = useState<number[]>([]);
  const [, setSccs] = useState<number[][]>([]);
  void topoOrder;

  const nextLabel = useMemo(() => {
    const used = new Set(graph.nodes.map(n => n.label));
    const letters = 'ABCDEFGHIJKLMNOP';
    for (let i = 0; i < letters.length; i++) {
      if (!used.has(letters[i])) return letters[i];
    }
    return String(graph.nodes.length);
  }, [graph.nodes]);

  useEffect(() => {
    if (frames.length && playing) {
      const ms = 500;
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
    }
  }, [playing, frameIdx, frames]);

  const runAlgorithm = async () => {
    const steps: any[] = [];
    const nodes = [...graph.nodes];
    const edges = [...graph.edges];
    const visited = new Set<number>();
    const queue: number[] = [];
    const visitedOrder: number[] = [];
    const parentMap: Map<number, number> = new Map();
    const distance: Map<number, number> = new Map();
    const discovery: Map<number, number> = new Map();
    const finish: Map<number, number> = new Map();
    let time = 0;

    if (algorithm === 'bfs') {
      queue.push(sourceNode);
      distance.set(sourceNode, 0);
      
      steps.push({
        nodes: nodes.map(n => ({ ...n, state: n.id === sourceNode ? 'active' : 'default' })),
        edges: edges.map(e => ({ ...e })),
        queue: [...queue],
        visited: [],
        desc: `Starting BFS from node ${nodes.find(n => n.id === sourceNode)?.label}`,
      });

      while (queue.length > 0) {
        const u = queue.shift()!;
        if (visited.has(u)) continue;
        visited.add(u);
        visitedOrder.push(u);
        time++;

        const newNodes = nodes.map(n => {
          if (n.id === u) return { ...n, state: 'visited' as NodeState };
          if (queue.includes(n.id)) return { ...n, state: 'queue' as NodeState };
          return n;
        });

        const newEdges = edges.map(e => {
          if (e.from === u && !visited.has(e.to)) {
            return { ...e, state: 'traversed' as EdgeState };
          }
          return { ...e, state: e.state === 'traversed' ? 'tree' as EdgeState : e.state };
        });

        steps.push({
          nodes: newNodes,
          edges: newEdges,
          queue: [...queue],
          visited: [...visitedOrder],
          desc: `Visiting ${nodes.find(n => n.id === u)?.label}, adding unvisited neighbors to queue`,
        });

        for (const edge of edges) {
          if (edge.from === u && !visited.has(edge.to)) {
            queue.push(edge.to);
            parentMap.set(edge.to, u);
            distance.set(edge.to, (distance.get(u) || 0) + 1);
          }
        }

        steps.push({
          nodes: newNodes,
          edges: edges.map(e => ({ ...e, state: e.from === u && !visited.has((edges.find(e2 => e2.from === u && e2.to === e.to)?.to || -1)!) && parentMap.has(e.to) ? 'tree' as EdgeState : e.state })),
          queue: [...queue],
          visited: [...visitedOrder],
          desc: `Added neighbors to queue`,
        });
      }

      const reachable = visitedOrder.length;
      const unreachable = nodes.length - reachable;
      steps.push({
        nodes: nodes.map(n => ({ ...n, state: visited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState })),
        edges: edges.map(e => ({ ...e, state: parentMap.has(e.to) && parentMap.get(e.to) === e.from ? 'tree' as EdgeState : 'default' as EdgeState })),
        queue: [],
        visited: visitedOrder,
        desc: `BFS complete. ${reachable} of ${nodes.length} nodes reachable from ${nodes.find(n => n.id === sourceNode)?.label}. ${unreachable} nodes cannot be reached.`,
      });
    } else if (algorithm === 'dfs') {
      const adj = new Map<number, number[]>();
      nodes.forEach(n => adj.set(n.id, []));
      edges.forEach(e => adj.get(e.from)?.push(e.to));

      const inStack = new Set<number>();
      const dfsVisited = new Set<number>();
      const backEdges: [number, number][] = [];
      const treeEdges: [number, number][] = [];
      const forwardEdges: [number, number][] = [];
      const crossEdges: [number, number][] = [];

      const dfs = (u: number) => {
        dfsVisited.add(u);
        inStack.add(u);
        discovery.set(u, ++time);

        steps.push({
          nodes: nodes.map(n => ({
            ...n,
            state: n.id === u ? 'active' as NodeState : dfsVisited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState,
            discovery: discovery.get(n.id),
            finish: finish.get(n.id),
          })),
          edges: edges.map(e => ({ ...e })),
          desc: `Visiting ${nodes.find(n => n.id === u)?.label} (discovery: ${discovery.get(u)})`,
        });

        for (const v of (adj.get(u) || [])) {
          if (!dfsVisited.has(v)) {
            treeEdges.push([u, v]);
            steps.push({
              nodes: nodes.map(n => ({
                ...n,
                state: n.id === v ? 'active' as NodeState : n.id === u ? 'visited' as NodeState : dfsVisited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState,
                discovery: discovery.get(n.id),
                finish: finish.get(n.id),
              })),
              edges: edges.map(e => e.from === u && e.to === v ? { ...e, state: 'traversed' as EdgeState } : { ...e, state: e.from === u && treeEdges.includes([e.from, e.to]) ? 'tree' as EdgeState : e.state }),
              desc: `Tree edge ${nodes.find(n => n.id === u)?.label} → ${nodes.find(n => n.id === v)?.label}`,
            });
            dfs(v);
          } else if (inStack.has(v)) {
            backEdges.push([u, v]);
            steps.push({
              nodes: nodes.map(n => ({
                ...n,
                state: (n.id === u || n.id === v) ? 'cycle' as NodeState : dfsVisited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState,
                discovery: discovery.get(n.id),
                finish: finish.get(n.id),
              })),
              edges: edges.map(e => e.from === u && e.to === v ? { ...e, state: 'back' as EdgeState } : { ...e }),
              desc: `Back edge found — cycle detected! ${nodes.find(n => n.id === u)?.label} → ${nodes.find(n => n.id === v)?.label}`,
            });
          } else if ((discovery.get(v) || 0) < (discovery.get(u) || 0)) {
            crossEdges.push([u, v]);
          } else {
            forwardEdges.push([u, v]);
          }
        }

        inStack.delete(u);
        finish.set(u, ++time);

        steps.push({
          nodes: nodes.map(n => ({
            ...n,
            state: n.id === u ? 'visited' as NodeState : dfsVisited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState,
            discovery: discovery.get(n.id),
            finish: finish.get(n.id),
          })),
          edges: edges.map(e => ({ ...e })),
          desc: `Finished ${nodes.find(n => n.id === u)?.label} (finish: ${finish.get(u)})`,
        });
      };

      if (!dfsVisited.has(sourceNode)) {
        dfs(sourceNode);
      }

      steps.push({
        nodes: nodes.map(n => ({ ...n, state: dfsVisited.has(n.id) ? 'visited' as NodeState : 'default' as NodeState })),
        edges: edges.map(e => {
          if (treeEdges.some(([a, b]) => a === e.from && b === e.to)) return { ...e, state: 'tree' as EdgeState };
          if (backEdges.some(([a, b]) => a === e.from && b === e.to)) return { ...e, state: 'back' as EdgeState };
          if (forwardEdges.some(([a, b]) => a === e.from && b === e.to)) return { ...e, state: 'forward' as EdgeState };
          if (crossEdges.some(([a, b]) => a === e.from && b === e.to)) return { ...e, state: 'cross' as EdgeState };
          return { ...e };
        }),
        desc: `DFS complete. ${treeEdges.length} tree edges, ${backEdges.length} back edges (cycles), ${forwardEdges.length} forward edges, ${crossEdges.length} cross edges.`,
      });
    } else if (algorithm === 'dijkstra') {
      const dist: Map<number, number> = new Map();
      const prev: Map<number, number> = new Map();
      const pq: { node: number; dist: number }[] = [];

      nodes.forEach(n => dist.set(n.id, Infinity));
      dist.set(sourceNode, 0);
      pq.push({ node: sourceNode, dist: 0 });

      steps.push({
        nodes: nodes.map(n => ({
          ...n,
          state: n.id === sourceNode ? 'source' as NodeState : 'default' as NodeState,
          distance: dist.get(n.id),
        })),
        edges: edges.map(e => ({ ...e })),
        desc: `Starting Dijkstra from ${nodes.find(n => n.id === sourceNode)?.label} with distance 0`,
      });

      while (pq.length > 0) {
        pq.sort((a, b) => a.dist - b.dist);
        const { node: u } = pq.shift()!;

        if ((dist.get(u) || Infinity) === Infinity) break;

        const newNodes = nodes.map(n => ({
          ...n,
          state: n.id === u ? 'active' as NodeState : dist.get(n.id)! < Infinity ? 'queue' as NodeState : 'default' as NodeState,
          distance: dist.get(n.id),
        }));

        steps.push({
          nodes: newNodes,
          edges: edges.map(e => ({ ...e })),
          desc: `Processing ${nodes.find(n => n.id === u)?.label} with distance ${dist.get(u)}`,
        });

        for (const edge of edges) {
          if (edge.from !== u) continue;
          const v = edge.to;
          const alt = (dist.get(u) || 0) + edge.weight;

          if (alt < (dist.get(v) || Infinity)) {
            dist.set(v, alt);
            prev.set(v, u);

            const existing = pq.find(p => p.node === v);
            if (existing) existing.dist = alt;
            else pq.push({ node: v, dist: alt });

            steps.push({
              nodes: newNodes.map(n => ({
                ...n,
                state: n.id === v ? 'active' as NodeState : n.id === u ? 'visited' as NodeState : n.state,
                distance: dist.get(n.id),
              })),
              edges: edges.map(e => e.from === u && e.to === v ? { ...e, state: 'relaxed' as EdgeState } : { ...e, state: 'default' as EdgeState }),
              desc: `Relaxed ${nodes.find(n => n.id === u)?.label} → ${nodes.find(n => n.id === v)?.label}: new distance ${alt}`,
            });
          }
        }
      }

      const pathEdges: EdgeState[] = [];
      edges.forEach(e => {
        if (prev.get(e.to) === e.from) {
          pathEdges.push('shortest');
        }
      });

      steps.push({
        nodes: nodes.map(n => ({
          ...n,
          state: dist.get(n.id)! < Infinity ? 'path' as NodeState : 'default' as NodeState,
          distance: dist.get(n.id),
        })),
        edges: edges.map(e => ({
          ...e,
          state: prev.get(e.to) === e.from ? 'shortest' as EdgeState : 'default' as EdgeState,
        })),
        desc: `Shortest paths found from ${nodes.find(n => n.id === sourceNode)?.label}. Click any node to see its path.`,
      });
    } else if (algorithm === 'topo') {
      const inDegree = new Map<number, number>();
      const adj = new Map<number, number[]>();
      nodes.forEach(n => {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
      });
      edges.forEach(e => {
        inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
        adj.get(e.from)?.push(e.to);
      });

      const queue: number[] = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      const order: number[] = [];
      const tempInDegree = new Map(inDegree);

      steps.push({
        nodes: nodes.map(n => ({ ...n, state: queue.includes(n.id) ? 'queue' as NodeState : 'default' as NodeState })),
        edges: edges.map(e => ({ ...e })),
        topoOrder: [],
        desc: 'Starting topological sort — finding nodes with in-degree 0',
      });

      while (queue.length > 0) {
        const u = queue.shift()!;
        order.push(u);

        steps.push({
          nodes: nodes.map(n => ({
            ...n,
            state: n.id === u ? 'visited' as NodeState : queue.includes(n.id) ? 'queue' as NodeState : 'default' as NodeState,
          })),
          edges: edges.map(e => ({ ...e, state: e.from === u ? 'traversed' as EdgeState : e.state })),
          topoOrder: [...order],
          desc: `${nodes.find(n => n.id === u)?.label} has no more prerequisites — added to order`,
        });

        for (const v of (adj.get(u) || [])) {
          const newDeg = (tempInDegree.get(v) || 1) - 1;
          tempInDegree.set(v, newDeg);
          if (newDeg === 0) queue.push(v);
        }

        steps.push({
          nodes: nodes.map(n => ({
            ...n,
            state: queue.includes(n.id) ? 'queue' as NodeState : order.includes(n.id) ? 'visited' as NodeState : 'default' as NodeState,
          })),
          edges: edges.map(e => ({ ...e })),
          topoOrder: [...order],
          desc: `Updated in-degrees, ${queue.length} nodes ready`,
        });
      }

      if (order.length !== nodes.length) {
        steps.push({
          nodes: nodes.map(n => ({ ...n, state: 'cycle' as NodeState })),
          edges: edges.map(e => ({ ...e, state: 'back' as EdgeState })),
          topoOrder: [],
          desc: 'Cycle detected! Cannot complete topological sort — graph is not a DAG.',
        });
      } else {
        steps.push({
          nodes: nodes.map(n => ({ ...n, state: 'visited' as NodeState })),
          edges: edges.map(e => ({ ...e })),
          topoOrder: order,
          desc: `Valid topological order found: ${order.map(id => nodes.find(n => n.id === id)?.label).join(' → ')}`,
        });
      }

      setTopoOrder(order);
    } else if (algorithm === 'cycle') {
      const adj = new Map<number, number[]>();
      nodes.forEach(n => adj.set(n.id, []));
      edges.forEach(e => adj.get(e.from)?.push(e.to));

      const visited = new Set<number>();
      const recStack = new Set<number>();
      let foundCycle: number[] | null = null;

      const dfs = (u: number, path: number[] = []): boolean => {
        visited.add(u);
        recStack.add(u);
        path.push(u);

        for (const v of (adj.get(u) || [])) {
          if (!visited.has(v)) {
            if (dfs(v, path)) return true;
          } else if (recStack.has(v)) {
            const cycleStart = path.indexOf(v);
            foundCycle = path.slice(cycleStart);
            return true;
          }
        }

        path.pop();
        recStack.delete(u);
        return false;
      };

      for (const node of nodes) {
        if (!visited.has(node.id)) {
          if (dfs(node.id, [])) break;
        }
      }

      if (foundCycle && (foundCycle as number[]).length > 0) {
        const cycleNodes: number[] = foundCycle as number[];
        steps.push({
          nodes: nodes.map(n => ({
            ...n,
            state: cycleNodes.includes(n.id) ? 'cycle' as NodeState : 'default' as NodeState,
          })),
          edges: edges.map(e => ({
            ...e,
            state: cycleNodes.indexOf(e.from) !== -1 && cycleNodes[(cycleNodes.indexOf(e.from) + 1) % cycleNodes.length] === e.to ? 'back' as EdgeState : 'default' as EdgeState,
          })),
          desc: `Cycle found! These nodes form a loop: ${cycleNodes.map((id: number) => nodes.find(n => n.id === id)?.label).join(' → ')}`,
        });
      } else {
        steps.push({
          nodes: nodes.map(n => ({ ...n, state: 'visited' as NodeState })),
          edges: edges.map(e => ({ ...e })),
          desc: 'No cycles found. This graph is a DAG.',
        });
      }
    } else if (algorithm === 'scc') {
      const adj = new Map<number, number[]>();
      const revAdj = new Map<number, number[]>();
      nodes.forEach(n => {
        adj.set(n.id, []);
        revAdj.set(n.id, []);
      });
      edges.forEach(e => {
        adj.get(e.from)?.push(e.to);
        revAdj.get(e.to)?.push(e.from);
      });

      const visited = new Set<number>();
      const finishOrder: number[] = [];

      const dfs1 = (u: number) => {
        visited.add(u);
        for (const v of (adj.get(u) || [])) {
          if (!visited.has(v)) dfs1(v);
        }
        finishOrder.push(u);
      };

      steps.push({
        nodes: nodes.map(n => ({ ...n })),
        edges: edges.map(e => ({ ...e })),
        desc: 'First pass: running DFS to find finish order',
      });

      for (const node of nodes) {
        if (!visited.has(node.id)) dfs1(node.id);
      }

      steps.push({
        nodes: nodes.map(n => ({ ...n })),
        edges: edges.map(e => ({ ...e, state: 'default' as EdgeState })),
        sccs: [],
        desc: `Finish order: ${finishOrder.map(id => nodes.find(n => n.id === id)?.label).reverse().join(', ')}`,
      });

      const visited2 = new Set<number>();
      const sccResult: number[][] = [];

      const dfs2 = (u: number, component: number[]) => {
        visited2.add(u);
        component.push(u);
        for (const v of (revAdj.get(u) || [])) {
          if (!visited2.has(v)) dfs2(v, component);
        }
      };

      for (let i = finishOrder.length - 1; i >= 0; i--) {
        const node = finishOrder[i];
        if (!visited2.has(node)) {
          const component: number[] = [];
          dfs2(node, component);
          sccResult.push(component);

          steps.push({
            nodes: nodes.map(n => ({
              ...n,
              state: component.includes(n.id) ? 'scc' as NodeState : visited2.has(n.id) ? 'visited' as NodeState : 'default' as NodeState,
              sccId: component.includes(n.id) ? sccResult.length - 1 : undefined,
            })),
            edges: edges.map(e => ({ ...e })),
            sccs: [...sccResult],
            desc: `Found SCC ${sccResult.length}: ${component.map(id => nodes.find(n => n.id === id)?.label).join(', ')}`,
          });
        }
      }

      steps.push({
        nodes: nodes.map(n => ({
          ...n,
          state: 'scc' as NodeState,
          sccId: sccResult.findIndex(c => c.includes(n.id)),
        })),
        edges: edges.map(e => ({ ...e })),
        sccs: sccResult,
        desc: `Found ${sccResult.length} strongly connected components.`,
      });

      setSccs(sccResult);
    }

    setFrames(steps);
    setFrameIdx(0);
    setPlaying(steps.length > 1);
  };

  const currentFrame = frames[frameIdx];
  const displayNodes = currentFrame?.nodes || graph.nodes;
  const displayEdges = currentFrame?.edges || graph.edges;
  const displayQueue = currentFrame?.queue || [];
  const displayVisited = currentFrame?.visited || [];
  const displayTopo = currentFrame?.topoOrder || [];
  const displaySccs = currentFrame?.sccs || [];

  const addNode = (x: number, y: number) => {
    const newNode: GraphNode = {
      id: graph.nodes.length,
      label: nextLabel,
      x, y,
      vx: 0, vy: 0,
      state: 'default',
    };
    setGraph(g => ({ ...g, nodes: [...g.nodes, newNode] }));
  };

  const addEdge = (from: number, to: number, weight: number = 1) => {
    if (from === to) return;
    if (graph.edges.some(e => e.from === from && e.to === to)) return;
    setGraph(g => ({ ...g, edges: [...g.edges, { from, to, weight, state: 'default' }] }));
  };

  const deleteNode = (id: number) => {
    setGraph(g => ({
      nodes: g.nodes.filter(n => n.id !== id),
      edges: g.edges.filter(e => e.from !== id && e.to !== id),
    }));
  };

  const clearGraph = () => {
    setGraph({ nodes: [], edges: [] });
    setFrames([]);
    setFrameIdx(0);
    setPlaying(false);
    setTopoOrder([]);
    setSccs([]);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setGraph(preset.graph);
    setFrames([]);
    setFrameIdx(0);
    setPlaying(false);
    setTopoOrder([]);
    setSccs([]);
  };

  const getNodeColor = (node: GraphNode) => {
    switch (node.state) {
      case 'source': return { fill: '#0a2828', border: '#3ac8a0', text: '#80e8c0', glow: true };
      case 'visited': return { fill: '#0a1e28', border: '#2a7a98', text: '#50a8c8', glow: false };
      case 'active': return { fill: '#0a2a20', border: '#40d8d0', text: '#ffffff', glow: true };
      case 'queue': return { fill: '#141800', border: '#a09030', text: '#d4c060', glow: false };
      case 'path': return { fill: '#0a2010', border: '#40c870', text: '#60e890', glow: false };
      case 'cycle': return { fill: '#200808', border: '#c04030', text: '#e06050', glow: true };
      case 'scc': return { 
        fill: '#0f1c1a', 
        border: SCC_COLORS[(node.sccId || 0) % SCC_COLORS.length], 
        text: SCC_COLORS[(node.sccId || 0) % SCC_COLORS.length], 
        glow: false 
      };
      default: return { fill: '#0f1c1a', border: '#3a6a58', text: '#70b898', glow: false };
    }
  };

  const getEdgeColor = (edge: GraphEdge) => {
    switch (edge.state) {
      case 'traversed': return '#40d8d0';
      case 'tree': return '#3ac8a0';
      case 'back': return '#c04030';
      case 'forward': return '#4080b0';
      case 'cross': return '#8040b0';
      case 'shortest': return '#40c870';
      case 'relaxed': return '#d4a040';
      default: return '#2a5a50';
    }
  };

  return (
    <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden bg-[#0a0f0f] text-[#70b898] relative flex flex-col">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px currentColor; }
          50% { box-shadow: 0 0 20px currentColor; }
        }
      `}</style>

      {/* Header */}
      <div className="h-14 px-4 border-b border-[#1a2a25] flex items-center justify-between bg-[#0a0f0f] flex-shrink-0">
        <div className="text-sm font-black tracking-[0.16em] uppercase text-[#4a6a5a]">Directed Graph Visualizer</div>
        
        <div className="flex items-center gap-1">
          {ALGORITHMS.map(algo => (
            <button
              key={algo.id}
              onClick={() => { setAlgorithm(algo.id); setFrames([]); setFrameIdx(0); setPlaying(false); }}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${algorithm === algo.id ? 'bg-[#2a4a40] text-[#70b898]' : 'text-[#3a5a4a] hover:bg-[#1a2a25]'}`}
            >
              {algo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Source selector */}
      <div className="px-4 py-2 border-b border-[#1a2a25] flex items-center gap-3 bg-[#0a0f0f]">
        <span className="text-[10px] text-[#2a4a40] uppercase">Source:</span>
        <select 
          value={sourceNode}
          onChange={e => setSourceNode(Number(e.target.value))}
          className="px-2 py-1 rounded border border-[#2a4a40] bg-[#111c1a] text-[#70b898] text-xs"
        >
          {graph.nodes.map(n => (
            <option key={n.id} value={n.id}>{n.label}</option>
          ))}
        </select>
        <button onClick={runAlgorithm} disabled={graph.nodes.length === 0} className="px-3 py-1 rounded bg-[#2a4a40] text-[#70b898] text-xs font-bold hover:bg-[#3a5a50]">
          Run
        </button>
        <div className="flex gap-1 ml-auto">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => loadPreset(p)} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">
              {p.name}
            </button>
          ))}
          <button onClick={clearGraph} className="px-2 py-1 rounded border border-[#2a4a40] text-[9px] text-[#4a6a5a] hover:bg-[#1a2a25]">
            Clear
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative min-h-0" style={{ background: 'radial-gradient(circle at center, #0d1515 0%, #0a0f0f 100%)' }}>
        {/* Graph area */}
        <div 
          ref={canvasRef}
          className="absolute inset-0"
          onClick={e => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect && edgeMode === 'select') {
              addNode(e.clientX - rect.left, e.clientY - rect.top);
            }
          }}
        >
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {displayEdges.map((edge: GraphEdge, i: number) => {
              const fromNode = displayNodes.find((n: GraphNode) => n.id === edge.from);
              const toNode = displayNodes.find((n: GraphNode) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = dx / len;
              const ny = dy / len;

              const startX = fromNode.x + nx * 20;
              const startY = fromNode.y + ny * 20;
              const endX = toNode.x - nx * 20;
              const endY = toNode.y - ny * 20;

              const mx = (startX + endX) / 2;
              const my = (startY + endY) / 2;
              const perpX = -ny * 15;
              const perpY = nx * 15;
              const cp1x = mx + perpX;
              const cp1y = my + perpY;

              const color = getEdgeColor(edge);
              const isHighlighted = edge.state !== 'default';

              return (
                <g key={i}>
                  <path
                    d={`M ${startX} ${startY} Q ${cp1x} ${cp1y} ${endX} ${endY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.weight !== 1 && algorithm === 'dijkstra' && (
                    <text x={cp1x} y={cp1y - 8} fill={color} fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {edge.weight}
                    </text>
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#2a5a50" />
              </marker>
              <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#40d8d0" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          {displayNodes.map((node: GraphNode) => {
            const colors = getNodeColor(node);
            const isSource = node.id === sourceNode;
            
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all"
                style={{
                  left: node.x,
                  top: node.y,
                  width: 40,
                  height: 40,
                  backgroundColor: colors.fill,
                  border: `2px solid ${colors.border}`,
                  color: colors.text,
                  boxShadow: colors.glow ? `0 0 14px ${colors.border}66` : '0 2px 8px rgba(0,0,0,0.4)',
                  transform: node.state === 'active' ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%)',
                  zIndex: node.state === 'active' ? 20 : 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (edgeMode === 'add-edge') {
                    if (edgeStart === null) {
                      setEdgeStart(node.id);
                    } else {
                      addEdge(edgeStart, node.id);
                      setEdgeStart(null);
                    }
                  } else {
                    setSelectedNode(node.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  deleteNode(node.id);
                }}
              >
                <span className="font-mono font-bold text-[13px]">{node.label}</span>
                
                {isSource && (
                  <div 
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 52,
                      height: 52,
                      border: `2px solid ${colors.border}30`,
                    }}
                  />
                )}

                {node.distance !== undefined && (
                  <div className="absolute -bottom-5 text-[9px] font-mono" style={{ color: colors.text }}>
                    {node.distance === Infinity ? '∞' : node.distance}
                  </div>
                )}

                {algorithm === 'dfs' && node.discovery !== undefined && (
                  <div className="absolute -top-5 text-[8px] font-mono text-[#4a6a5a]">
                    {node.discovery}/{node.finish || '?'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div className="absolute top-2 left-4 flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] ${playing ? 'text-cyan-400' : 'text-[#2a4a40]'}`}>
            <span className={`w-2 h-2 rounded-full ${playing ? 'bg-cyan-400' : 'bg-[#2a4a40]'} ${playing ? 'animate-pulse' : ''}`}></span>
            {playing ? 'Running' : 'Idle'}
          </span>
          {currentFrame?.desc && (
            <span className="text-[10px] text-[#4a6a5a] max-w-md">{currentFrame.desc}</span>
          )}
        </div>

        {/* Mode toggle */}
        <div className="absolute top-2 right-4 flex gap-1">
          <button 
            onClick={() => { setEdgeMode('select'); setEdgeStart(null); }}
            className={`px-2 py-1 rounded text-[9px] ${edgeMode === 'select' ? 'bg-[#2a4a40] text-[#70b898]' : 'text-[#4a6a5a]'}`}
          >
            Select
          </button>
          <button 
            onClick={() => setEdgeMode('add-edge')}
            className={`px-2 py-1 rounded text-[9px] ${edgeMode === 'add-edge' ? 'bg-[#2a4a40] text-[#70b898]' : 'text-[#4a6a5a]'}`}
          >
            Add Edge
          </button>
          {edgeStart !== null && (
            <span className="text-[9px] text-amber-400 ml-2">
              Click target for {graph.nodes.find(n => n.id === edgeStart)?.label} →
            </span>
          )}
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="h-[180px] border-t border-[#1a2a25] flex flex-shrink-0">
        {/* Left - Graph Stats */}
        <div className="w-1/4 border-r border-[#1a2a25] p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">Graph Stats</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase">Nodes</div>
              <div className="text-xl font-black text-white">{graph.nodes.length}</div>
            </div>
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase">Edges</div>
              <div className="text-xl font-black text-[#40d8d0]">{graph.edges.length}</div>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-[#2a4a40]">
            Click to add node, click two nodes to add edge, right-click to delete.
          </div>
        </div>

        {/* Center - Operation Panel */}
        <div className="w-2/4 border-r border-[#1a2a25] p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">Algorithm</div>
          
          <div className="text-[10px] text-[#4a6a5a] mb-2">
            {ALGORITHMS.find(a => a.id === algorithm)?.desc}
          </div>

          {/* Playback */}
          <div className="flex items-center gap-1 mt-2">
            <button onClick={() => { setPlaying(false); setFrameIdx(Math.max(0, frameIdx - 1)); }} className="p-1 rounded bg-[#1a2a25] hover:bg-[#2a4a40] text-[#40d8d0]">
              <SkipBack size={12} />
            </button>
            <button onClick={() => setPlaying(!playing)} className="p-1 rounded bg-[#2a4a40] hover:bg-[#3a5a50] text-[#40d8d0]">
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button onClick={() => { setPlaying(false); setFrameIdx(Math.min(frames.length - 1, frameIdx + 1)); }} className="p-1 rounded bg-[#1a2a25] hover:bg-[#2a4a40] text-[#40d8d0]">
              <SkipForward size={12} />
            </button>
            <div className="ml-2 flex-1 h-1 rounded-full bg-[#1a2a25] overflow-hidden">
              <div className="h-full bg-[#40d8d0] transition-all" style={{ width: frames.length > 0 ? `${((frameIdx + 1) / frames.length) * 100}%` : '0%' }} />
            </div>
            <span className="text-[9px] text-[#2a4a40] font-mono">{frames.length > 0 ? `${frameIdx + 1}/${frames.length}` : '0/0'}</span>
          </div>

          {/* Output */}
          {(algorithm === 'bfs' || algorithm === 'dfs') && displayVisited.length > 0 && (
            <div className="mt-2 text-[10px]">
              <span className="text-[#2a4a40]">Order: </span>
              <span className="font-mono text-[#70b898]">
                {displayVisited.map((id: number) => graph.nodes.find(n => n.id === id)?.label).join(' → ')}
              </span>
            </div>
          )}

          {algorithm === 'topo' && displayTopo.length > 0 && (
            <div className="mt-2 text-[10px]">
              <span className="text-[#2a4a40]">Order: </span>
              <span className="font-mono text-[#70b898]">
                {displayTopo.map((id: number) => graph.nodes.find(n => n.id === id)?.label).join(' → ')}
              </span>
            </div>
          )}

          {algorithm === 'scc' && displaySccs.length > 0 && (
            <div className="mt-2 space-y-1">
              {displaySccs.map((scc: number[], i: number) => (
                <div key={i} className="text-[10px]">
                  <span className="text-[#2a4a40]">SCC {i + 1}: </span>
                  <span className="font-mono" style={{ color: SCC_COLORS[i % SCC_COLORS.length] }}>
                    {scc.map((id: number) => graph.nodes.find(n => n.id === id)?.label).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {algorithm === 'dfs' && (
            <div className="mt-2 flex gap-2 text-[9px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3ac8a0]"></span> Tree</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c04030]"></span> Back</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4080b0]"></span> Forward</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8040b0]"></span> Cross</span>
            </div>
          )}
        </div>

        {/* Right - Metrics */}
        <div className="w-1/4 p-3 bg-[#0a0f0f]">
          <div className="text-[9px] text-[#2a4a40] uppercase tracking-[0.15em] font-bold mb-2">Metrics</div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase">Visited</div>
              <div className="text-lg font-bold text-white">{displayVisited.length}</div>
            </div>
            <div className="rounded border border-[#1a2a25] bg-[#111c1a] p-2">
              <div className="text-[8px] text-[#2a4a40] uppercase">Queue</div>
              <div className="text-lg font-bold text-amber-400">{displayQueue.length}</div>
            </div>
          </div>

          <div className="mt-2 p-2 rounded border border-[#1a2a25] bg-[#0a1010]">
            <div className="text-[9px] text-[#2a4a40]">
              {algorithm === 'bfs' || algorithm === 'dfs' || algorithm === 'topo' || algorithm === 'cycle' || algorithm === 'scc' ? 'O(V + E)' : algorithm === 'dijkstra' ? 'O((V + E) log V)' : 'O(V + E)'}
            </div>
          </div>
        </div>
      </div>

      {/* Caption Banner */}
      <div className="py-2 px-4 border-t border-[#1a2a25] bg-[#0a0f0f] text-center flex-shrink-0">
        <p className="text-[11px] text-[#4a8a78]">
          In a directed graph, edges have direction — you can only travel the way the arrow points. This single constraint is what makes directed graph algorithms interesting.
        </p>
      </div>
    </div>
  );
}
