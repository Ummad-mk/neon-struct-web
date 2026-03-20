import { useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TrieNodeState {
  id: string;
  char: string;
  is_end: boolean;
  children: TrieNodeState[];
}

interface TrieState {
  trie: TrieNodeState;
  words: string[];
  status: string;
  node_count: number;
  word_count: number;
  highlight_path: string[];
  found_word: string;
}

interface Props {
  data?: Partial<TrieState>;
  onInsert?: (word: string) => Promise<unknown>;
  onSearch?: (word: string) => Promise<unknown>;
  onDelete?: (word: string) => Promise<unknown>;
  onClear?: () => void;
  onViewCode?: (mode: 'full' | 'current') => void;
  onViewPseudoCode?: (mode: 'full' | 'current') => void;
  onViewAlgorithm?: (mode: 'full' | 'current') => void;
  isAnimating?: boolean;
}

interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isEnd: boolean;
  depth: number;
}

interface PositionedEdge {
  from: string;
  to: string;
}

const WIDTH = 980;
const HEIGHT = 560;
const LEVEL_GAP = 98;
const PADDING_X = 40;
const EMPTY_TRIE_NODE: TrieNodeState = { id: 'root', char: '', is_end: false, children: [] };

export function TrieViz({ data, onInsert, onSearch, onDelete, onClear, onViewCode, onViewPseudoCode, onViewAlgorithm, isAnimating }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [wordInput, setWordInput] = useState('');

  const trie = useMemo<TrieNodeState>(() => data?.trie ?? EMPTY_TRIE_NODE, [data?.trie]);
  const words: string[] = data?.words || [];
  const status: string = data?.status || 'READY';
  const nodeCount: number = data?.node_count ?? 1;
  const wordCount: number = data?.word_count ?? 0;
  const highlightPath: string[] = data?.highlight_path || [];
  const foundWord: string = data?.found_word || '';
  const [docMode, setDocMode] = useState<'full' | 'current'>('full');

  const graph = useMemo(() => {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];

    const walk = (node: TrieNodeState, depth: number, left: number, right: number) => {
      const x = (left + right) / 2;
      const y = 72 + depth * LEVEL_GAP;
      nodes.push({
        id: node.id,
        label: node.id === 'root' ? 'ROOT' : node.char.toUpperCase(),
        x,
        y,
        isEnd: !!node.is_end,
        depth
      });

      const children = [...(node.children || [])].sort((a, b) => a.char.localeCompare(b.char));
      if (!children.length) return;

      const span = right - left;
      const childBand = span / children.length;
      children.forEach((child, i) => {
        const childLeft = left + i * childBand;
        const childRight = childLeft + childBand;
        edges.push({ from: node.id, to: child.id });
        walk(child, depth + 1, childLeft, childRight);
      });
    };

    walk(trie, 0, PADDING_X, WIDTH - PADDING_X);
    return { nodes, edges };
  }, [trie]);

  const nodeById = useMemo(() => {
    const m = new Map<string, PositionedNode>();
    graph.nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [graph.nodes]);

  const performWordAction = async (action?: (word: string) => Promise<unknown>) => {
    const normalized = wordInput.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!normalized) return;
    await action?.(normalized);
    setWordInput('');
  };

  return (
    <div className="w-full h-full min-h-[760px] flex flex-col rounded-xl border border-gray-800 overflow-hidden bg-[#0a1220]">
      <div className="h-12 px-4 border-b border-gray-800 flex items-center justify-between bg-[#0d1624]">
        <div className="flex items-center gap-3 text-xs tracking-[0.28em] uppercase text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/90" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/90" />
            <span className="w-3 h-3 rounded-full bg-green-500/90" />
          </div>
          <span>Prefix Tree Visualizer</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest">
          <div className="flex items-center rounded-md border border-gray-700 overflow-hidden">
            <button onClick={() => setDocMode('full')} className={`px-2 py-1 text-[10px] ${docMode === 'full' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400'}`}>Full</button>
            <button onClick={() => setDocMode('current')} className={`px-2 py-1 text-[10px] ${docMode === 'current' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400'}`}>Current</button>
          </div>
          <button onClick={() => onViewCode?.(docMode)} className="px-2 py-1 rounded-md border border-gray-700 text-[10px] text-gray-300 hover:bg-gray-800">Code</button>
          <button onClick={() => onViewPseudoCode?.(docMode)} className="px-2 py-1 rounded-md border border-gray-700 text-[10px] text-gray-300 hover:bg-gray-800">Pseudo</button>
          <button onClick={() => onViewAlgorithm?.(docMode)} className="px-2 py-1 rounded-md border border-gray-700 text-[10px] text-gray-300 hover:bg-gray-800">Algorithm</button>
          <span className="text-cyan-300">{status}</span>
          <span className="text-gray-400">Nodes: <span className="text-white">{nodeCount}</span></span>
          <span className="text-gray-400">Words: <span className="text-white">{wordCount}</span></span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 border-r border-gray-800 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_60%)] relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
            {graph.edges.map((edge, idx) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const active = highlightPath.includes(edge.to);
              return (
                <line
                  key={`${edge.from}-${edge.to}-${idx}`}
                  x1={from.x}
                  y1={from.y + 20}
                  x2={to.x}
                  y2={to.y - 20}
                  stroke={active ? '#38bdf8' : '#334155'}
                  strokeWidth={active ? 2.4 : 1.4}
                  opacity={active ? 1 : 0.8}
                />
              );
            })}

            {graph.nodes.map(node => {
              const active = highlightPath.includes(node.id);
              const isFoundPath = foundWord && highlightPath.includes(node.id);
              const radius = node.id === 'root' ? 30 : 26;
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={active ? 'rgba(6,182,212,0.18)' : 'rgba(15,23,42,0.82)'}
                    stroke={isFoundPath ? '#f97316' : active ? '#38bdf8' : '#334155'}
                    strokeWidth={isFoundPath ? 2.8 : 2}
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize={node.id === 'root' ? 16 : 18}
                    fontWeight={800}
                    fill={isFoundPath ? '#f97316' : active ? '#e0f2fe' : '#94a3b8'}
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' }}
                  >
                    {node.label}
                  </text>
                  {node.isEnd && node.id !== 'root' && (
                    <circle cx={node.x + radius - 5} cy={node.y - radius + 5} r={5} fill="#f97316" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="w-[320px] bg-[#0d1522] flex flex-col">
          <div className="h-12 px-4 flex items-center border-b border-gray-800 text-[#f97316] text-sm font-bold tracking-[0.22em] uppercase">
            Words in Trie
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {words.length === 0 ? (
              <div className="text-xs text-gray-500 font-mono px-2 py-2">No words yet</div>
            ) : (
              words.map(word => {
                const isFound = foundWord === word;
                return (
                  <div
                    key={word}
                    className={`w-full rounded-lg border px-3 py-2 text-lg font-mono uppercase tracking-widest flex items-center justify-between ${isFound ? 'border-orange-400 bg-orange-500/10 text-orange-300' : 'border-gray-700 bg-[#0f1a2b] text-gray-300'
                      }`}
                  >
                    <span>{word}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isFound ? 'bg-orange-400' : 'bg-gray-500'}`} />
                  </div>
                );
              })
            )}
          </div>
          <div className="h-16 border-t border-gray-800 px-4 grid grid-cols-2 text-[10px] uppercase tracking-[0.24em] font-mono">
            <div className="flex items-center gap-2 text-gray-500">Nodes <span className="text-3xl text-gray-200 leading-none">{nodeCount}</span></div>
            <div className="flex items-center justify-end gap-2 text-gray-500">Words <span className="text-3xl text-gray-200 leading-none">{wordCount}</span></div>
          </div>
        </div>
      </div>

      <div className="h-20 border-t border-gray-800 px-5 flex items-center gap-3 bg-[#0b1220]">
        <input
          type="text"
          value={wordInput}
          onChange={e => setWordInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && performWordAction(onInsert)}
          placeholder="Enter word..."
          disabled={isAnimating}
          className={`flex-1 px-4 py-3 rounded-xl border font-mono text-lg focus:outline-none ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#101a2a] border-gray-700 text-gray-100'}`}
        />
        <button
          onClick={() => performWordAction(onInsert)}
          disabled={isAnimating || !wordInput.trim()}
          className="min-w-[160px] px-4 py-3 rounded-xl border border-gray-600 text-gray-100 text-3xl leading-none font-mono hover:bg-cyan-500/10 disabled:opacity-50"
        >
          + INSERT
        </button>
        <button
          onClick={() => performWordAction(onSearch)}
          disabled={isAnimating || !wordInput.trim()}
          className="min-w-[140px] px-4 py-3 rounded-xl border border-gray-600 text-gray-100 text-3xl leading-none font-mono hover:bg-yellow-500/10 disabled:opacity-50"
        >
          SEARCH
        </button>
        <button
          onClick={() => performWordAction(onDelete)}
          disabled={isAnimating || !wordInput.trim()}
          className="min-w-[140px] px-4 py-3 rounded-xl border border-gray-600 text-gray-100 text-3xl leading-none font-mono hover:bg-red-500/10 disabled:opacity-50"
        >
          DELETE
        </button>
        <button
          onClick={onClear}
          disabled={isAnimating}
          className="min-w-[120px] px-4 py-3 rounded-xl border border-gray-600 text-gray-100 text-3xl leading-none font-mono hover:bg-red-500/10 disabled:opacity-50"
        >
          CLEAR
        </button>
      </div>
    </div>
  );
}
