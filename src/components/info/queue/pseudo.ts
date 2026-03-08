export const pseudo = {
  full: `Queue Operations - FIFO (First In, First Out)

1. ENQUEUE Operation:
   - Create new node with given value
   - IF front = null (empty queue):
       * front ← new_node
       * rear ← new_node
   - ELSE:
       * rear.next ← new_node
       * rear ← new_node
   - size ← size + 1
   - RETURN success

2. DEQUEUE Operation:
   - IF front = null:
       RETURN failure (queue empty)
   - value ← front.value
   - front ← front.next
   - IF front = null:
       * rear ← null (queue becomes empty)
   - size ← size - 1
   - RETURN success, value

3. PEEK Operation:
   - IF front = null:
       RETURN failure (queue empty)
   - RETURN success, front.value

4. ISEMPTY Operation:
   - RETURN (front = null)

5. CLEAR Operation:
   - front ← null
   - rear ← null
   - size ← 0
   - RETURN success

Time Complexity:
- Enqueue: O(1)
- Dequeue: O(1)
- Peek: O(1)
- isEmpty: O(1)
- Clear: O(1)

Space Complexity:
- All operations: O(1) additional space
- Queue storage: O(n) where n is number of elements

Circular Array Implementation:
- Enqueue: O(1) with modulo arithmetic
- Dequeue: O(1) with modulo arithmetic
- Space: O(capacity) fixed size`,

  enqueue: `ENQUEUE Operation Pseudocode

ENQUEUE(value):
    new_node ← CREATE_NODE(value)
    
    IF front = null:
        front ← new_node        // 1 step
        rear ← new_node         // 1 step
    ELSE:
        rear.next ← new_node   // 1 step
        rear ← new_node        // 1 step
    END IF
    
    size ← size + 1            // 1 step
    RETURN success, steps: 3-4

// Circular Array Implementation
ENQUEUE(value):
    IF size = capacity:
        RETURN failure, steps: 1
    
    rear ← (rear + 1) MOD capacity  // 1 step
    array[rear] ← value              // 1 step
    size ← size + 1                 // 1 step
    RETURN success, steps: 3`,

  dequeue: `DEQUEUE Operation Pseudocode

DEQUEUE():
    IF front = null:
        RETURN failure, steps: 1
    
    value ← front.value          // 1 step
    front ← front.next          // 1 step
    
    IF front = null:
        rear ← null             // 1 step
    END IF
    
    size ← size - 1            // 1 step
    RETURN success, value, steps: 4

// Circular Array Implementation
DEQUEUE():
    IF size = 0:
        RETURN failure, steps: 1
    
    value ← array[front]                // 1 step
    front ← (front + 1) MOD capacity   // 1 step
    size ← size - 1                    // 1 step
    RETURN success, value, steps: 3`,

  peek: `PEEK Operation Pseudocode

PEEK():
    IF front = null:
        RETURN failure, steps: 1
    
    RETURN success, front.value, steps: 1

// Circular Array Implementation
PEEK():
    IF size = 0:
        RETURN failure, steps: 1
    
    RETURN success, array[front], steps: 1`,

  is_empty: `ISEMPTY Operation Pseudocode

ISEMPTY():
    RETURN (front = null)  // 1 step

// Circular Array Implementation
ISEMPTY():
    RETURN (size = 0)  // 1 step`
};
