const insert = `Insertion (at Head):
   1. Create a new node with the given value.
   2. Set the new node's 'Next' pointer to the current Head.
   3. Update the Head pointer to point to this new node.
   4. Complexity: O(1)`;

const del = `Deletion (by Value):
   1. If Head holds the value, move Head to Next.
   2. Otherwise, traverse the list to find the node.
   3. Maintain pointers to 'Current' and 'Previous' (or look ahead).
   4. If found, set Previous.Next to Current.Next.
   5. Delete the Current node.
   6. Complexity: O(n)`;

const search = `Search:
   1. Start at Head.
   2. Traverse sequentially (Next, Next...)
   3. If Value matches, return Found.
   4. If End (Null) is reached, return Not Found.
   5. Complexity: O(n)`;

export const algorithm = {
  full: `Singly Linked List Algorithm Overview:\n\n${insert}\n\n${del}\n\n${search}`,
  insert: insert,
  delete: del,
  search: search
};