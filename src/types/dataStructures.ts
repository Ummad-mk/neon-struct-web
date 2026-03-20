export type DataStructureType =
  | 'singly_linked_list'
  | 'doubly_linked_list'
  | 'queue'
  | 'deque'
  | 'stack'
  | 'bst'
  | 'avl'
  | 'graph'
  | 'directed_graph'
  | 'hash_table'
  | 'trie'
  | 'segment_tree'
  | 'red_black_tree'
  | 'priority_queue'
  | 'quick_sort'
  | 'merge_sort'
  | 'insertion_sort'
  | 'selection_sort'
  | 'heap_sort'
  | 'bubble_sort';

export interface OperationInfo {
  name: string;
  stepCount: number;
  currentComplexity: string;
  totalComplexity: string;
}

export interface NotificationData {
  message: string;
  id: number;
}

export interface TreeNode {
  value: number;
  left?: TreeNode | null;
  right?: TreeNode | null;
  height?: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight: number;
}

export interface GraphData {
  vertices: number[];
  edges: GraphEdge[];
}

export interface ApiResponse {
  success: boolean;
  steps?: any[];
  results?: any[];
  result?: any;
  state?: any;
  complexity?: string;
  operation?: string;
  message?: string;
  found?: number;
  visited?: number[];
  cost?: number;
  highlighted_edges?: [number, number][];
}
