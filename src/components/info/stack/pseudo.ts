export const pseudo = {
  full: `Stack Operations - LIFO (Last In, First Out)

1. PUSH Operation:
   - Create new node with given value
   - Set new_node.next ← top
   - top ← new_node
   - size ← size + 1
   - RETURN success

2. POP Operation:
   - IF top = null:
       RETURN failure (stack empty)
   - value ← top.value
   - top ← top.next
   - size ← size - 1
   - RETURN success, value

3. PEEK Operation:
   - IF top = null:
       RETURN failure (stack empty)
   - RETURN success, top.value

4. ISEMPTY Operation:
   - RETURN (top = null)

5. CLEAR Operation:
   - top ← null
   - size ← 0
   - RETURN success

Time Complexity:
- Push: O(1)
- Pop: O(1)
- Peek: O(1)
- isEmpty: O(1)
- Clear: O(1)

Space Complexity:
- All operations: O(1) additional space
- Stack storage: O(n) where n is number of elements`,

  push: `PUSH Operation Pseudocode

PUSH(value):
    new_node ← CREATE_NODE(value)
    new_node.next ← top        // 1 step
    top ← new_node             // 1 step
    size ← size + 1            // 1 step
    RETURN success

// Array Implementation
PUSH(value):
    array.ADD(value)            // 1 step
    size ← size + 1            // 1 step
    RETURN success`,

  pop: `POP Operation Pseudocode

POP():
    IF top = null:
        RETURN failure, steps: 1
    
    value ← top.value          // 1 step
    top ← top.next            // 1 step
    size ← size - 1          // 1 step
    RETURN success, value, steps: 3

// Array Implementation
POP():
    IF array.length = 0:
        RETURN failure, steps: 1
    
    value ← array.REMOVE_LAST() // 1 step
    size ← size - 1            // 1 step
    RETURN success, value, steps: 2`,

  peek: `PEEK Operation Pseudocode

PEEK():
    IF top = null:
        RETURN failure, steps: 1
    
    RETURN success, top.value, steps: 1

// Array Implementation
PEEK():
    IF array.length = 0:
        RETURN failure, steps: 1
    
    value ← array[array.length - 1] // 1 step
    RETURN success, value, steps: 1`,

  is_empty: `ISEMPTY Operation Pseudocode

ISEMPTY():
    RETURN (top = null)  // 1 step

// Array Implementation
ISEMPTY():
    RETURN (array.length = 0)  // 1 step`
};
