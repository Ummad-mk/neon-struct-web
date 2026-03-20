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
   search: search,
   reverse: `Reverse (Three-Pointer Technique):
   1. Initialize three pointers: prev = null, current = head, next = null.
   2. While current is not null:
      a. Store current.next in next.
      b. Set current.next = prev (reverse the link).
      c. Move prev = current.
      d. Move current = next.
   3. Set head = prev.
   4. Complexity: O(n) time, O(1) space`,
   get_middle: `Get Middle Element (Tortoise and Hare):
   1. Initialize two pointers: slow = head, fast = head.
   2. While fast is not null AND fast.next is not null:
      a. Move slow one step: slow = slow.next
      b. Move fast two steps: fast = fast.next.next
   3. When fast reaches the end, slow is at the middle.
   4. Return slow.value.
   5. Complexity: O(n) time, O(1) space`,
   detect_cycle: `Detect Cycle (Floyd's Cycle Detection):
   1. Initialize two pointers: slow = head, fast = head.
   2. While fast is not null AND fast.next is not null:
      a. Move slow one step: slow = slow.next
      b. Move fast two steps: fast = fast.next.next
      c. If slow === fast → cycle detected, return true.
   3. If loop ends normally → no cycle, return false.
   4. Complexity: O(n) time, O(1) space`,
   remove_duplicates: `Remove Duplicates (Hash Set Method):
   1. Create an empty hash set 'seen'.
   2. Initialize current = head, prev = null.
   3. While current is not null:
      a. If current.value is in 'seen':
         - Remove current: prev.next = current.next
         - Decrement size
      b. Else:
         - Add current.value to 'seen'
         - prev = current
      c. current = current.next
   4. Complexity: O(n) time, O(n) space`
};