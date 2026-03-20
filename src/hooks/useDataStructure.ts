import { useState, useCallback } from 'react';
import { DataStructureType, ApiResponse } from '../types/dataStructures';

// src/hooks/useDataStructure.ts
const API_URL = '/api'; // Uses Vite proxy

export const useDataStructure = (type: DataStructureType) => {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dsId = 'main';

  const performOperation = useCallback(
    async (endpoint: string, data?: any): Promise<ApiResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/ds/${type}/${dsId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data || {}),
        });

        const text = await response.text();

        if (!response.ok) {
          throw new Error(`Server Error (${response.status}): ${text}`);
        }
        if (!text) throw new Error('Empty response');

        const result = JSON.parse(text);

        if (result.state) {
          setState(result.state);
        }

        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Operation Failed:', errorMessage);
        setError(errorMessage);
        setLoading(false);
        return { success: false, message: errorMessage };
      }
    },
    [type, dsId]
  );

  const insert = useCallback((value: number, position?: any) => performOperation('insert', { value, position }), [performOperation]);
  const deleteValue = useCallback((value?: number) => performOperation('delete', { value }), [performOperation]);
  const search = useCallback((value: number) => performOperation('search', { value }), [performOperation]);
  const addRandom = useCallback((count: number = 7) => performOperation('add_random', { count }), [performOperation]);
  const addEdge = useCallback((from: number, to: number, weight: number = 1) => performOperation('add_edge', { from, to, weight }), [performOperation]);
  const setHashMode = useCallback((mode: 'linear' | 'quadratic' | 'double') => performOperation('set_mode', { mode }), [performOperation]);
  const buildSegment = useCallback((array: number[]) => performOperation('build', { array }), [performOperation]);
  const rangeQuerySegment = useCallback((l: number, r: number, op: 'sum' | 'min' | 'max' = 'sum') => performOperation('range_query', { l, r, op }), [performOperation]);
  const pointUpdateSegment = useCallback((idx: number, val: number) => performOperation('point_update', { idx, val }), [performOperation]);

  const clear = useCallback(async () => {
    performOperation('clear').then(() => setState(null));
  }, [performOperation]);

  const getState = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/ds/${type}/${dsId}/state`);
      const result = await response.json();
      if (result.state) setState(result.state);
    } catch (err) {
      console.error(err);
    }
  }, [type, dsId]);

  // --- NEW Undo/Redo ---
  const undo = useCallback(() => performOperation('undo'), [performOperation]);
  const redo = useCallback(() => performOperation('redo'), [performOperation]);

  // --- Linked List Operations ---
  const reverse = useCallback(() => performOperation('reverse'), [performOperation]);
  const getMiddle = useCallback(() => performOperation('get_middle'), [performOperation]);
  const detectCycle = useCallback(() => performOperation('detect_cycle'), [performOperation]);
  const removeDuplicates = useCallback(() => performOperation('remove_duplicates'), [performOperation]);

  const peek = useCallback(() => performOperation('peek'), [performOperation]);
  const changePriority = useCallback((value: number, priority: number) => performOperation('change_priority', { value, priority }), [performOperation]);

  // --- Tree Specific Operations ---
  const traverse = useCallback((type: string) => performOperation('traverse', { type }), [performOperation]);
  const findMinMax = useCallback((type: string) => performOperation('find_min_max', { type }), [performOperation]);
  const findSuccessorPredecessor = useCallback((value: number, type: string) => performOperation('find_successor_predecessor', { value, type }), [performOperation]);
  const getHeight = useCallback(() => performOperation('get_height'), [performOperation]);
  const countNodes = useCallback(() => performOperation('count_nodes'), [performOperation]);
  const rangeSearch = useCallback((min: number, max: number) => performOperation('range_search', { min, max }), [performOperation]);
  const lowestCommonAncestor = useCallback((val1: number, val2: number) => performOperation('lca', { val1, val2 }), [performOperation]);

  // --- Graph Specific Operations ---
  const deleteEdge = useCallback((from: number | string, to: number | string) => performOperation('delete_edge', { from, to }), [performOperation]);
  const findPath = useCallback((start: number | string, end: number | string) => performOperation('find_path', { start, end }), [performOperation]);
  const shortestPath = useCallback((start: number | string, end: number | string) => performOperation('shortest_path', { start, end }), [performOperation]);
  const topologicalSort = useCallback(() => performOperation('topological_sort'), [performOperation]);
  const minimumSpanningTree = useCallback(() => performOperation('minimum_spanning_tree'), [performOperation]);
  const kruskalsMST = useCallback(() => performOperation('kruskals_mst'), [performOperation]);

  return {
    state, loading, error,
    insert, deleteValue, search, addRandom, addEdge, clear, getState,
    setHashMode,
    buildSegment, rangeQuerySegment, pointUpdateSegment,
    undo, redo, // Undo/Redo
    reverse, getMiddle, detectCycle, removeDuplicates, // Linked List operations
    peek, changePriority,
    traverse, findMinMax, findSuccessorPredecessor, getHeight, countNodes, rangeSearch, lowestCommonAncestor, // Tree operations
    deleteEdge, findPath, shortestPath, topologicalSort, minimumSpanningTree, kruskalsMST // Graph operations
  };
};
