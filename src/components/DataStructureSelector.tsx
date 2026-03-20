import { useState } from 'react';
import { DataStructureType } from '../types/dataStructures';
import {
  Link2, Repeat, Layers, List, ArrowLeftRight, Binary, Network, GitFork, ArrowDownUp,
  BarChart3, Search,
  ChevronLeft, ChevronRight, LayoutDashboard, Undo2, Redo2, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SettingsModal } from './SettingsModal';

interface Props {
  selected: DataStructureType;
  isDashboard?: boolean;
  onSelect: (type: DataStructureType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDashboardClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const DATA_STRUCTURE_GROUPS = [
  {
    category: 'Linked Lists',
    items: [
      { type: 'singly_linked_list', label: 'Singly Linked', icon: Link2 },
      { type: 'doubly_linked_list', label: 'Doubly Linked', icon: Repeat },
    ]
  },
  {
    category: 'Stacks & Queues',
    items: [
      { type: 'stack', label: 'Stack', icon: Layers },
      { type: 'queue', label: 'Queue', icon: List },
      { type: 'deque', label: 'Deque (Double Ended)', icon: ArrowLeftRight },
      { type: 'priority_queue', label: 'Priority Queue', icon: ArrowDownUp },
    ]
  },
  {
    category: 'Trees',
    items: [
      { type: 'bst', label: 'BST Tree', icon: Binary },
      { type: 'avl', label: 'AVL Tree', icon: Binary },
      { type: 'red_black_tree', label: 'Red-Black Tree', icon: Binary },
      { type: 'trie', label: 'Trie', icon: Binary },
      { type: 'segment_tree', label: 'Segment Tree', icon: Binary },
    ]
  },
  {
    category: 'Hash Tables',
    items: [
      { type: 'hash_table', label: 'Hash Table', icon: Layers }, // Or Database icon if available, Layers is safe
    ]
  },
  {
    category: 'Graphs',
    items: [
      { type: 'graph', label: 'Graph', icon: Network },
      { type: 'directed_graph', label: 'Directed Graph', icon: GitFork },
    ]
  }
];

const ALGORITHM_GROUPS = [
  {
    category: 'Sorting',
    items: [
      { type: 'quick_sort', label: 'Quick Sort', icon: BarChart3 },
      { type: 'merge_sort', label: 'Merge Sort', icon: BarChart3 },
      { type: 'insertion_sort', label: 'Insertion Sort', icon: BarChart3 },
      { type: 'selection_sort', label: 'Selection Sort', icon: BarChart3 },
      { type: 'heap_sort', label: 'Heap Sort', icon: BarChart3 },
      { type: 'bubble_sort', label: 'Bubble Sort', icon: BarChart3 },
    ]
  }
];

const SEARCHING_GROUPS = [
  {
    category: 'Searching',
    items: [
      { type: 'linear_search', label: 'Linear Search', icon: Search },
    ]
  }
];

export function DataStructureSelector({
  selected, isDashboard = false, onSelect, isCollapsed, onToggleCollapse, onDashboardClick, onUndo, onRedo
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Track open state for each category. Default to all closed.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Linked Lists': false,
    'Stacks & Queues': false,
    'Trees': false,
    'Hash Tables': false,
    'Graphs': false,
    'Sorting': false,
    'Searching': false,
    'Pathfinding': false,
  });

  const toggleGroup = (category: string) => {
    setOpenGroups(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const bg = isLight ? 'bg-white border-gray-200' : 'bg-[#0a1120] border-gray-800';
  const headerBorder = isLight ? 'border-gray-200' : 'border-gray-800';
  const textMuted = isLight ? 'text-gray-500' : 'text-gray-500';
  const labelStyle = `text-[10px] font-bold uppercase tracking-widest mb-2 px-2 ${textMuted}`;
  const activeStyle = isLight
    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold'
    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
  const inactiveStyle = isLight
    ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200';
  const dashActiveStyle = isLight
    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold'
    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';

  return (
    <>
      <div className={`${bg} border-r transition-all duration-300 flex flex-col z-10 ${isCollapsed ? 'w-16' : 'w-56'}`}>

        {/* Header */}
        <div className={`p-3 border-b ${headerBorder} flex justify-between items-center relative h-14`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <img src="/neon-struct-fav.png" alt="Logo" className="w-5 h-5 object-contain" />
              <span className={`text-sm font-black italic tracking-tight ${isLight ? 'text-gray-900' : 'text-cyan-400'}`}>
                NEONSTRUCT
              </span>
            </div>
          ) : (
            <img src="/neon-struct-fav.png" alt="Logo" className="w-5 h-5 object-contain mx-auto" />
          )}
          <button
            onClick={onToggleCollapse}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'
              }`}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">

          {/* Dashboard Button */}
          <button
            onClick={onDashboardClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${isDashboard ? dashActiveStyle : inactiveStyle
              }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* Undo / Redo — slim pill row */}
          {!isCollapsed ? (
            <div className={`flex items-center rounded-lg overflow-hidden border my-2 text-xs font-medium ${isLight ? 'border-gray-200 bg-gray-50' : 'border-gray-700/60 bg-gray-800/30'
              }`}>
              <button
                onClick={onUndo}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-all ${isLight ? 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50' : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
              >
                <Undo2 size={13} /> Undo
              </button>
              <div className={`w-px h-3.5 shrink-0 ${isLight ? 'bg-gray-300' : 'bg-gray-700'}`} />
              <button
                onClick={onRedo}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-all ${isLight ? 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50' : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
              >
                <Redo2 size={13} /> Redo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 my-2">
              <button onClick={onUndo} className={`flex items-center justify-center p-2 rounded-lg transition-all ${isLight ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-gray-800'}`}><Undo2 size={14} /></button>
              <button onClick={onRedo} className={`flex items-center justify-center p-2 rounded-lg transition-all ${isLight ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-gray-800'}`}><Redo2 size={14} /></button>
            </div>
          )}

          {/* Divider */}
          <div className={`h-px my-3 mx-1 ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`} />

          {/* DATA STRUCTURES GROUPS */}
          {!isCollapsed && <p className={labelStyle}>Data Structures</p>}

          {DATA_STRUCTURE_GROUPS.map((group) => {
            const isOpen = openGroups[group.category];

            return (
              <div key={group.category} className="mb-2">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.category)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 mb-1 rounded-md transition-colors ${isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800/80'
                      }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">{group.category}</span>
                    {isOpen ? <ChevronUp size={14} className="opacity-50" /> : <ChevronDown size={14} className="opacity-50" />}
                  </button>
                )}

                {/* Render items if: 1) it's not collapsed and group is open OR 2) sidebar is entirely collapsed (just show icons) */}
                <div className={`space-y-0.5 ${(!isOpen && !isCollapsed) ? 'hidden' : 'block'} ${!isCollapsed ? 'ml-1 border-l pl-1 ' + (isLight ? 'border-gray-200' : 'border-gray-800') : ''}`}>
                  {group.items.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => onSelect(type as DataStructureType)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${!isDashboard && selected === type ? activeStyle : inactiveStyle
                        }`}
                      title={label}
                    >
                      <Icon size={17} className="shrink-0" />
                      {!isCollapsed && <span>{label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* ALGORITHM GROUPS */}
          {!isCollapsed && <p className={labelStyle}>Algorithms</p>}
          {[...ALGORITHM_GROUPS, ...SEARCHING_GROUPS].map((group) => {
            const isOpen = openGroups[group.category] ?? true;
            return (
              <div key={group.category} className="mb-2">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.category)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 mb-1 rounded-md transition-colors ${isLight ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800/80'}`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">{group.category}</span>
                    {isOpen ? <ChevronUp size={14} className="opacity-50" /> : <ChevronDown size={14} className="opacity-50" />}
                  </button>
                )}
                <div className={`space-y-0.5 ${!isOpen && !isCollapsed ? 'hidden' : 'block'} ${!isCollapsed ? 'ml-1 border-l pl-1 ' + (isLight ? 'border-gray-200' : 'border-gray-800') : ''}`}>
                  {group.items.map(({ type, label, icon: Icon }) => {
                    const isActive = !isDashboard && selected === type;
                    const isAvailable = true;
                    const cls = isAvailable
                      ? `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${isActive ? activeStyle : inactiveStyle}`
                      : `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm opacity-50 cursor-not-allowed ${inactiveStyle}`;
                    return (
                      <button
                        key={type}
                        onClick={isAvailable ? () => onSelect(type as DataStructureType) : undefined}
                        className={cls}
                        title={isAvailable ? label : 'Coming soon'}
                      >
                        <Icon size={17} className="shrink-0" />
                        {!isCollapsed && <span>{label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Settings at bottom */}
        <div className={`p-2 border-t ${headerBorder}`}>
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${inactiveStyle}`}
          >
            <Settings size={17} className="shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
