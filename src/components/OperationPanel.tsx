import { useState } from 'react';
import { OperationInfo, DataStructureType } from '../types/dataStructures';
import { Code, FileText, BookOpen, ChevronLeft, ChevronRight, Map as MapIcon, Crosshair, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DSInfo } from './info';

interface Props {
  operationInfo: OperationInfo;
  activeDS: DataStructureType | 'singly_linked_list';
  viewport?: { x: number; y: number; scale: number };
  onViewCode: (mode: 'full' | 'current') => void;
  onViewPseudoCode: (mode: 'full' | 'current') => void;
  onViewAlgorithm: (mode: 'full' | 'current') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const getOpKey = (name: string): 'insert' | 'delete' | 'search' | 'traverse' | 'minimum_spanning_tree' | 'kruskals_mst' | 'topological_sort' | null => {
  const n = name.toLowerCase();
  if (n.includes('insert') || n.includes('add') || n.includes('push') || n.includes('enqueue') || n.includes('random')) return 'insert';
  if (n.includes('delet') || n.includes('remove') || n.includes('pop') || n.includes('dequeue')) return 'delete';
  if (n.includes('search') || n.includes('find')) return 'search';
  if (n.includes('traverse') || n.includes('bfs') || n.includes('dfs')) return 'traverse';
  if (n.includes('mst') && n.includes('prim')) return 'minimum_spanning_tree';
  if (n.includes('mst') && n.includes('kruskal')) return 'kruskals_mst';
  if (n.includes('topological')) return 'topological_sort';
  return null;
};

export function OperationPanel({
  operationInfo, activeDS, viewport = { x: 0, y: 0, scale: 1 },
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

  // Minimap lens position
  const lensLeft = Math.max(0, Math.min(80, 50 - viewport.x * 0.025));
  const lensTop = Math.max(0, Math.min(80, 50 - viewport.y * 0.025));

  // Current operation's live code
  const opKey = getOpKey(operationInfo.name);
  const dsInfo = DSInfo[activeDS];
  const liveCode = opKey && dsInfo?.code && typeof dsInfo.code === 'object'
    ? (dsInfo.code as any)[opKey]
    : null;

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
              <p className="text-sm font-bold font-mono text-blue-500">O(n)</p>
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
            <div className={`flex items-center gap-2 mb-2 ${textMuted}`}>
              <MapIcon size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mini Map</span>
            </div>
            <div className={`w-full h-24 rounded-xl border relative overflow-hidden ${rowBg}`}>
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(#1e293b 1px,transparent 1px),linear-gradient(90deg,#1e293b 1px,transparent 1px)', backgroundSize: '8px 8px' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
              <div
                className="absolute w-14 h-9 border border-blue-500/60 bg-blue-500/10 rounded transition-all duration-75"
                style={{ top: `${lensTop}%`, left: `${lensLeft}%`, transform: 'translate(-50%,-50%)' }}
              >
                <Crosshair size={9} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300/80" />
              </div>
            </div>
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