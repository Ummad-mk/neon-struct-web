import { useState, useEffect } from 'react';
import { DataStructureType, OperationInfo } from './types/dataStructures';
import { DataStructureSelector } from './components/DataStructureSelector';
import { VisualizationCanvas } from './components/VisualizationCanvas';
import { OperationPanel } from './components/OperationPanel';
import { NotificationBar } from './components/NotificationBar';
import { Dashboard } from './components/Dashboard';
import { InfoModal } from './components/InfoModal';
import { DSInfo } from './components/info';
import { useDataStructure } from './hooks/useDataStructure';
import { useNotification } from './hooks/useNotification';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import QuickSortViz from './components/visualizations/QuickSortViz';
import MergeSortViz from './components/visualizations/MergeSortViz';
import InsertionSortViz from './components/visualizations/InsertionSortViz';
import SelectionSortViz from './components/visualizations/SelectionSortViz';
import HeapSortViz from './components/visualizations/HeapSortViz';
import BubbleSortViz from './components/visualizations/BubbleSortViz';
import LinearSearchViz from './components/visualizations/LinearSearchViz';
import JumpSearchViz from './components/visualizations/JumpSearchViz';

function App() {
  // --- View & Layout State ---
  const [currentView, setCurrentView] = useState<'dashboard' | DataStructureType>('dashboard');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });

  // --- Modal State (Tracks open status, type, and viewing mode) ---
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'code' | 'pseudo' | 'algorithm' | null;
    mode: 'full' | 'current';
  }>({ isOpen: false, type: null, mode: 'full' });

  // --- Visualization & Operation State ---
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [operationInfo, setOperationInfo] = useState<OperationInfo>({
    name: 'Ready',
    stepCount: 0,
    currentComplexity: '-',
    totalComplexity: '-',
  });

  // --- Custom Hooks ---
  // Default to linked list if on dashboard so hook doesn't break
  const activeDS = currentView === 'dashboard' ? 'singly_linked_list' : currentView;
  const ds = useDataStructure(activeDS);
  const { notification, addNotification, removeNotification } = useNotification();

  // --- Effects ---

  // 1. Reset state when switching Data Structures
  useEffect(() => {
    if (currentView !== 'dashboard') {
      setVisualizationData(null);
      setOperationInfo({ name: 'Ready', stepCount: 0, currentComplexity: '-', totalComplexity: '-' });
      setViewport({ x: 0, y: 0, scale: 1 }); // Reset zoom/pan
      ds.clear();
      ds.getState(); // Fetch fresh state from backend
    }
  }, [currentView]);

  // 2. Sync state when backend updates
  useEffect(() => {
    if (currentView !== 'dashboard' && ds.state) {
      setVisualizationData(ds.state);
    }
  }, [ds.state, currentView]);

  // --- Specific Operation Wrappers (UPDATED FOR ANIMATION) ---
  // These now return the response so VisualizationCanvas can animate the steps

  const handleInsert = async (val: number, position?: string) => {
    try {
      const result = await ds.insert(val, position);

      if (result.success) {
        addNotification(`Insert ${val} Complete`, 'success');
        if (result.state) {
          setVisualizationData(result.state);
        }
        setOperationInfo({
          name: `Insert ${val}`,
          stepCount: (result.steps?.length ?? 0) || 1,
          currentComplexity: result.complexity || 'O(1)',
          totalComplexity: result.complexity || 'O(1)',
        });
      } else {
        addNotification(result.message || 'Insert failed', 'error');
      }

      // Return result for animation
      return result;
    } catch (error) {
      console.error(error);
      addNotification('Insert error occurred', 'error');
      return null;
    }
  };

  const handleDelete = async (val?: number | string) => {
    try {
      // Cast down since useDataStructure.deleteValue technically accepts number
      // but the backend accepts anything. We'll pass it anyway.
      const result = await ds.deleteValue(val as any);

      if (result.success) {
        addNotification(`Delete ${val !== undefined ? val : ''} Complete`, 'success');
        if (result.state) {
          setVisualizationData(result.state);
        }
        setOperationInfo({
          name: `Delete${val !== undefined ? ' ' + val : ''}`,
          stepCount: (result.steps?.length ?? 0) || 1,
          currentComplexity: result.complexity || 'O(n)',
          totalComplexity: result.complexity || 'O(n)',
        });
      } else {
        addNotification(result.message || 'Delete failed', 'error');
      }

      // Return result for animation
      return result;
    } catch (error) {
      console.error(error);
      addNotification('Delete error occurred', 'error');
      return null;
    }
  };

  const handleSearch = async (val: number) => {
    try {
      const result = await ds.search(val);

      if (result.success) {
        addNotification(`Found ${val}!`, 'success');
      } else {
        addNotification(result.message || `${val} not found`, 'error');
      }

      setOperationInfo({
        name: `Search ${val}`,
        stepCount: result.steps?.length ?? 0,
        currentComplexity: result.complexity || 'O(n)',
        totalComplexity: result.complexity || 'O(n)',
      });

      return result;
    } catch (error) {
      console.error('❌ Search error:', error);
      addNotification('Search error occurred', 'error');
      return null;
    }
  };

  const handleAddRandom = async () => {
    try {
      const result = await ds.addRandom(5);

      if (result.success) {
        addNotification('Random values added', 'success');
        if (result.state) {
          setVisualizationData(result.state);
        }
        setOperationInfo({
          name: 'Insert (Random)',
          stepCount: result.results?.length ?? 5,
          currentComplexity: result.complexity || 'O(1)',
          totalComplexity: result.complexity || 'O(1)',
        });
      }

      return result;
    } catch (error) {
      console.error(error);
      addNotification('Random add failed', 'error');
      return null;
    }
  };

  const handleAddEdge = async (u: number, v: number, w: number) => {
    try {
      const result = await ds.addEdge(u, v, w);

      if (result.success) {
        addNotification(`Edge ${u}-${v} added`, 'success');
        if (result.state) {
          setVisualizationData(result.state);
        }
      }

      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // For linked list specific operations
  const handleReverse = async () => {
    try {
      // Check if method exists on the hook
      if ('reverse' in ds && typeof ds.reverse === 'function') {
        const result = await ds.reverse();

        if (result.success) {
          addNotification('List reversed', 'success');
          if (result.state) {
            setVisualizationData(result.state);
          }
        }

        return result;
      } else {
        addNotification('Reverse not available for this data structure', 'error');
        return { success: false, message: 'Method not available' };
      }
    } catch (error) {
      console.error(error);
      addNotification('Reverse failed', 'error');
      return null;
    }
  };

  const handleGetMiddle = async () => {
    try {
      // Check if method exists on the hook
      if ('getMiddle' in ds && typeof ds.getMiddle === 'function') {
        const result = await ds.getMiddle();

        if (result.success) {
          // Type assertion for optional property
          const middleValue = (result as any).middle_value;
          addNotification(`Middle found: ${middleValue}`, 'success');
        }

        return result;
      } else {
        addNotification('Get middle not available', 'error');
        return { success: false, message: 'Method not available' };
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleDetectCycle = async () => {
    try {
      // Check if method exists on the hook
      if ('detectCycle' in ds && typeof ds.detectCycle === 'function') {
        const result = await ds.detectCycle();

        if (result.success) {
          // Type assertion for optional property
          const hasCycle = (result as any).has_cycle;
          const message = hasCycle ? 'Cycle detected!' : 'No cycle found';
          addNotification(message, hasCycle ? 'error' : 'success');
        }

        return result;
      } else {
        addNotification('Cycle detection not available', 'error');
        return { success: false, message: 'Method not available' };
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      // Check if method exists on the hook
      if ('removeDuplicates' in ds && typeof ds.removeDuplicates === 'function') {
        const result = await ds.removeDuplicates();

        if (result.success) {
          // Type assertion for optional property
          const removedCount = (result as any).removed_count || 0;
          addNotification(`Removed ${removedCount} duplicates`, 'success');
          if (result.state) {
            setVisualizationData(result.state);
          }
        }

        return result;
      } else {
        addNotification('Remove duplicates not available', 'error');
        return { success: false, message: 'Method not available' };
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // --- Tree Specific Operations ---

  const handleTraverse = async (type: string) => {
    try {
      if ('traverse' in ds && typeof ds.traverse === 'function') {
        const result = await ds.traverse(type);
        if (result.success) addNotification(`Completed ${type} traversal`, 'success');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleFindMinMax = async (type: string) => {
    try {
      if ('findMinMax' in ds && typeof ds.findMinMax === 'function') {
        const result = await ds.findMinMax(type);
        if (result.success) addNotification(`Found ${type}: ${result.result}`, 'success');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleFindSuccessorPredecessor = async (val: number, type: string) => {
    try {
      if ('findSuccessorPredecessor' in ds && typeof ds.findSuccessorPredecessor === 'function') {
        const result = await ds.findSuccessorPredecessor(val, type);
        if (result.success) addNotification(`Found ${type}: ${result.result}`, 'success');
        else addNotification(result.message || 'Not found', 'error');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleGetHeight = async () => {
    try {
      if ('getHeight' in ds && typeof ds.getHeight === 'function') {
        const result = await ds.getHeight();
        if (result.success) addNotification(`Tree height: ${result.result}`, 'success');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleCountNodes = async () => {
    try {
      if ('countNodes' in ds && typeof ds.countNodes === 'function') {
        const result = await ds.countNodes();
        if (result.success) addNotification(`Total nodes: ${result.result}`, 'success');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleRangeSearch = async (min: number, max: number) => {
    try {
      if ('rangeSearch' in ds && typeof ds.rangeSearch === 'function') {
        const result = await ds.rangeSearch(min, max);
        if (result.success) addNotification(`Found ${result.result?.length || 0} nodes in range`, 'success');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  const handleLowestCommonAncestor = async (val1: number, val2: number) => {
    try {
      if ('lowestCommonAncestor' in ds && typeof ds.lowestCommonAncestor === 'function') {
        const result = await ds.lowestCommonAncestor(val1, val2);
        if (result.success) addNotification(`Found LCA: ${result.result}`, 'success');
        else addNotification(result.message || 'LCA not found', 'error');
        return result;
      }
    } catch (error) { console.error(error); return null; }
  };

  // --- Graph Specific Operations ---
  const handleDeleteEdge = async (from: string | number, to: string | number) => {
    try {
      if ('deleteEdge' in ds && typeof ds.deleteEdge === 'function') {
        const result = await ds.deleteEdge(from, to);
        if (result.success) {
          addNotification(`Edge ${from}-${to} deleted`, 'success');
          if (result.state) setVisualizationData(result.state);
        }
        else addNotification(result.message || 'Delete failed', 'error');
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleFindPath = async (start: string | number, end: string | number) => {
    try {
      if ('findPath' in ds && typeof ds.findPath === 'function') {
        const result = await ds.findPath(start, end);
        if (result.success) addNotification(`Path found`, 'success');
        else addNotification(result.message || 'No path found', 'error');
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleShortestPath = async (start: string | number, end: string | number) => {
    try {
      if ('shortestPath' in ds && typeof ds.shortestPath === 'function') {
        const result = await ds.shortestPath(start, end);
        if (result.success) addNotification(`Shortest path found (cost: ${result.cost})`, 'success');
        else addNotification(result.message || 'No path found', 'error');
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleTopologicalSort = async () => {
    try {
      if ('topologicalSort' in ds && typeof ds.topologicalSort === 'function') {
        const result = await ds.topologicalSort();
        if (result.success) {
          addNotification(`Topological sort complete`, 'success');
          setOperationInfo({
            name: 'Topological Sort',
            stepCount: Array.isArray(result.steps) ? result.steps.length : (result.steps || 0),
            currentComplexity: result.complexity || 'O(V + E)',
            totalComplexity: result.complexity || 'O(V + E)'
          });
        } else {
          addNotification(result.message || 'Sort failed', 'error');
        }
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleMinimumSpanningTree = async () => {
    try {
      if ('minimumSpanningTree' in ds && typeof ds.minimumSpanningTree === 'function') {
        const result = await ds.minimumSpanningTree();
        if (result.success) {
          addNotification(`MST found (Prim's)`, 'success');
          setOperationInfo({
            name: 'Finding MST (Prim\'s)',
            stepCount: Array.isArray(result.steps) ? result.steps.length : (result.steps || 0),
            currentComplexity: result.complexity || 'O(E log V)',
            totalComplexity: result.complexity || 'O(E log V)'
          });
        } else {
          addNotification(result.message || 'MST failed', 'error');
        }
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleKruskalsMST = async () => {
    try {
      if ('kruskalsMST' in ds && typeof ds.kruskalsMST === 'function') {
        const result = await ds.kruskalsMST();
        if (result.success) {
          addNotification(`MST found (Kruskal's)`, 'success');
          setOperationInfo({
            name: 'Finding MST (Kruskal\'s)',
            stepCount: Array.isArray(result.steps) ? result.steps.length : (result.steps || 0),
            currentComplexity: result.complexity || 'O(E log E)',
            totalComplexity: result.complexity || 'O(E log E)'
          });
        } else {
          addNotification(result.message || 'Kruskal\'s MST failed', 'error');
        }
        return result;
      }
    } catch (e) { console.error(e); return null; }
  };

  const handleClear = () => {
    ds.clear();
    setVisualizationData(null);
    setOperationInfo({ name: 'Ready', stepCount: 0, currentComplexity: '-', totalComplexity: '-' });
    addNotification('Canvas Cleared', 'info');
  };

  const handleUndo = () => {
    ds.undo();
    setOperationInfo(prev => ({ ...prev, name: 'Undo' }));
    addNotification('Undo', 'info');
  };

  const handleRedo = () => {
    ds.redo();
    setOperationInfo(prev => ({ ...prev, name: 'Redo' }));
    addNotification('Redo', 'info');
  };

  // --- Modal Logic (View Code / Algo) ---

  // Helper: Detect if we are currently Inserting, Deleting, or Searching
  const getCurrentOperationKey = () => {
    const opName = operationInfo.name.toLowerCase();
    if (opName.includes('insert') || opName.includes('add') || opName.includes('push') || opName.includes('enqueue')) return 'insert';
    if (opName.includes('delet') || opName.includes('remove') || opName.includes('pop') || opName.includes('dequeue')) return 'delete';
    if (opName.includes('search') || opName.includes('find') || opName.includes('check')) return 'search';
    return null;
  };

  // Helper: Fetch the correct text from DSInfo based on mode (Full vs Current)
  const getModalContent = () => {
    const info = DSInfo[activeDS];
    if (!info) return { title: 'Coming Soon', content: 'Documentation for this structure is being written.' };

    const opKey = getCurrentOperationKey();

    // If mode is 'current' AND we have a valid running operation, use specific key. Else default to 'full'.
    const keyToUse = (modalState.mode === 'current' && opKey) ? opKey : 'full';

    // Generate dynamic title
    const modeTitle = modalState.mode === 'current'
      ? (opKey ? `Current Operation: ${opKey.charAt(0).toUpperCase() + opKey.slice(1)}` : 'No Active Operation (Showing Full)')
      : 'Full Documentation';

    // Retrieve Data safely
    const category = modalState.type || 'code'; // 'code' | 'pseudo' | 'algorithm'
    const dataObj = info[category];

    let content = "Content not available.";

    // Support both legacy (string) and new (object) data formats
    if (typeof dataObj === 'string') {
      content = dataObj;
    } else if (typeof dataObj === 'object') {
      content = dataObj[keyToUse] || dataObj.full || "Content not available.";
    }

    return {
      title: `${modeTitle} - ${category.toUpperCase()}`,
      content
    };
  };

  const { theme } = useTheme();
  const isLight = theme === 'light';
  const modalData = getModalContent();

  // --- Render ---
  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden ${isLight ? 'bg-[#f5f5ff] text-gray-900' : 'bg-[#050b14] text-gray-100'
      }`}>
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <DataStructureSelector
          selected={currentView === 'dashboard' ? 'singly_linked_list' : currentView}
          isDashboard={currentView === 'dashboard'}
          onSelect={(type) => setCurrentView(type)}
          isCollapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          onDashboardClick={() => setCurrentView('dashboard')}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Main Content */}
        <main className="flex-1 flex relative min-w-0">
          {currentView === 'dashboard' ? (
            <Dashboard onStart={() => setCurrentView('singly_linked_list')} />
          ) : currentView === 'quick_sort' ? (
            <QuickSortViz />
          ) : currentView === 'merge_sort' ? (
            <MergeSortViz />
          ) : currentView === 'insertion_sort' ? (
            <InsertionSortViz />
          ) : currentView === 'selection_sort' ? (
            <SelectionSortViz />
          ) : currentView === 'heap_sort' ? (
            <HeapSortViz />
          ) : currentView === 'bubble_sort' ? (
            <BubbleSortViz />
          ) : currentView === 'linear_search' ? (
            <LinearSearchViz />
          ) : currentView === 'jump_search' ? (
            <JumpSearchViz />
          ) : (
            <>
              <VisualizationCanvas
                dsType={currentView}
                state={visualizationData}
                viewport={viewport}
                onViewportChange={setViewport}
                onInsert={handleInsert}
                onDelete={handleDelete}
                onSearch={handleSearch}
                onAddRandom={handleAddRandom}
                onAddEdge={currentView === 'graph' ? handleAddEdge : undefined}
                onClear={handleClear}
                onReverse={(currentView === 'singly_linked_list' || currentView === 'doubly_linked_list' || currentView === 'stack' || currentView === 'queue' || currentView === 'deque') ? handleReverse : undefined}
                onGetMiddle={currentView === 'singly_linked_list' ? handleGetMiddle : undefined}
                onDetectCycle={(currentView === 'singly_linked_list' || currentView === 'graph') ? handleDetectCycle : undefined}
                onRemoveDuplicates={currentView === 'singly_linked_list' ? handleRemoveDuplicates : undefined}
                onTraverse={(currentView === 'bst' || currentView === 'avl' || currentView === 'graph') ? handleTraverse : undefined}
                onFindMinMax={(currentView === 'bst' || currentView === 'avl') ? handleFindMinMax : undefined}
                onFindSuccessorPredecessor={(currentView === 'bst' || currentView === 'avl') ? handleFindSuccessorPredecessor : undefined}
                onGetHeight={(currentView === 'bst' || currentView === 'avl') ? handleGetHeight : undefined}
                onCountNodes={(currentView === 'bst' || currentView === 'avl') ? handleCountNodes : undefined}
                onRangeSearch={(currentView === 'bst' || currentView === 'avl') ? handleRangeSearch : undefined}
                onLowestCommonAncestor={(currentView === 'bst' || currentView === 'avl') ? handleLowestCommonAncestor : undefined}
                onDeleteEdge={(currentView === 'graph' || currentView === 'directed_graph') ? handleDeleteEdge : undefined}
                onFindPath={(currentView === 'graph' || currentView === 'directed_graph') ? handleFindPath : undefined}
                onShortestPath={(currentView === 'graph' || currentView === 'directed_graph') ? handleShortestPath : undefined}
                onTopologicalSort={currentView === 'directed_graph' ? handleTopologicalSort : undefined}
                onMinimumSpanningTree={currentView === 'graph' ? handleMinimumSpanningTree : undefined}
                onKruskalsMST={currentView === 'graph' ? handleKruskalsMST : undefined}
              />

              <OperationPanel
                operationInfo={operationInfo}
                activeDS={activeDS}
                viewport={viewport}
                onViewCode={(mode) => setModalState({ isOpen: true, type: 'code', mode })}
                onViewPseudoCode={(mode) => setModalState({ isOpen: true, type: 'pseudo', mode })}
                onViewAlgorithm={(mode) => setModalState({ isOpen: true, type: 'algorithm', mode })}
                isCollapsed={rightCollapsed}
                onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
              />
            </>
          )}
        </main>
      </div>

      {/* Global Notifications */}
      <NotificationBar notification={notification} onRemove={removeNotification} />

      {/* Info Modal (Code/Algo Viewer) */}
      <InfoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalData.title}
        content={modalData.content}
        type={modalState.type}
      />
    </div>
  );
}

export default function AppWithProvider() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}