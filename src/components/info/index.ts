import { singly_linked_list } from './singly_linked_list';
import { graph } from './graph';
import { stack } from './stack';
import { queue } from './queue';
import { bst } from './bst';
import { directed_graph } from './directed_graph';
import { avl } from './avl';
import { trie } from './trie';
import { segment_tree } from './segment_tree';
import { priority_queue } from './priority_queue';
import { hash_table } from './hash_table';
import { quick_sort } from './quick_sort';

// Placeholder: Reuse linked list data for others until you create their folders
const placeholder = singly_linked_list;

export const DSInfo: Record<string, any> = {
  singly_linked_list,
  doubly_linked_list: placeholder,
  bst,
  avl,
  red_black_tree: avl,
  trie,
  segment_tree,
  stack,
  queue,
  priority_queue,
  deque: placeholder,
  graph,
  directed_graph,
  hash_table,
  quick_sort
};
