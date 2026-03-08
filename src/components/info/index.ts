import { singly_linked_list } from './singly_linked_list';
import { graph } from './graph';
import { stack } from './stack';
import { queue } from './queue';
import { bst } from './bst';
import { directed_graph } from './directed_graph';
import { avl } from './avl';
import { priority_queue } from './priority_queue';

// Placeholder: Reuse linked list data for others until you create their folders
const placeholder = singly_linked_list;

export const DSInfo: Record<string, any> = {
  singly_linked_list,
  doubly_linked_list: placeholder, 
  bst,
  avl,
  stack,
  queue,
  priority_queue,
  deque: placeholder,
  graph,
  directed_graph
};
