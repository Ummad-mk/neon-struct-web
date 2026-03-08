export const algorithm = {
  full: `# Queue Data Structure

## Overview
A Queue is a linear data structure that follows the FIFO (First In, First Out) principle. Elements are added (enqueued) at the rear and removed (dequeued) from the front.

## Key Principle: FIFO
- **First In**: The earliest added element
- **First Out**: The first element to be removed
- **Real-world analogy**: Queue of people, checkout line, printer queue

## Operations and Complexity Analysis

### 1. ENQUEUE Operation
Description:

Algorithm:
1. Create new node with given value
2. If queue is empty:
   - Set both front and rear to new node
3. Else:
   - Link current rear to new node
   - Update rear to point to new node
4. Increment size

Step Count:
- Empty queue: 3 steps
- Non-empty queue: 4 steps

Time Complexity: 
Space Complexity:

### 2. DEQUEUE Operation
**Description**: Remove and return the front element

**Algorithm**:
1. Check if queue is empty
2. Store front element's value
3. Move front to next element
4. If queue becomes empty, set rear to null
5. Decrement size
6. Return stored value

**Step Count**: 4 steps (if not empty)
- \`value = front.value\` (1 step)
- \`front = front.next\` (1 step)
- \`rear = null\` if needed (1 step)
- \`size--\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 3. PEEK Operation
**Description**: Return the front element without removing it

**Algorithm**:
1. Check if queue is empty
2. Return front element's value

**Step Count**: 1 step
- \`return front.value\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 4. ISEMPTY Operation
**Description**: Check if the queue contains no elements

**Algorithm**:
1. Return whether front is null

**Step Count**: 1 step
- \`return front === null\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

## Implementation Variants

### Linked List Implementation
- **Advantages**: Dynamic size, no capacity limits
- **Memory**: O(n) for n elements
- **Operations**: All O(1) time complexity

### Circular Array Implementation
- **Advantages**: Better cache locality, fixed memory usage
- **Memory**: O(capacity) fixed size
- **Operations**: All O(1) with modulo arithmetic
- **Limitation**: Fixed maximum capacity

## Advantages of Queues
- **Fair ordering**: FIFO ensures fair processing
- **Efficient operations**: All basic operations are O(1)
- **Memory efficient**: Only stores necessary elements
- **Wide applicability**: Used in many systems

## Disadvantages of Queues
- **Limited access**: Can only access front and rear elements
- **No random access**: Cannot access middle elements directly
- **Memory overhead**: Pointer overhead in linked list implementation

## Common Applications
- **Task scheduling**: CPU process scheduling
- **Print queues**: Managing print jobs
- **Web servers**: Handling HTTP requests
- **Breadth-first search**: Level-order tree/graph traversal
- **Buffer management**: Producer-consumer scenarios
- **Message queues**: Inter-process communication

## Memory Usage Analysis
- **Linked List**: Each element stores value + next pointer (8-16 bytes overhead)
- **Circular Array**: Fixed capacity but no per-element overhead
- **Total Space**: O(n) where n is number of elements

## Performance Characteristics
- **Enqueue**: Always O(1) regardless of queue size
- **Dequeue**: Always O(1) regardless of queue size
- **Memory Access**: Sequential access pattern (good for caching)
- **Scalability**: Excellent for large datasets`,

  enqueue: `# Enqueue Operation Analysis

## Algorithm Steps
1. **Node Creation**: Allocate memory for new node
2. **Empty Check**: Determine if queue is empty
3. **Insertion**: Add node at rear (different logic for empty vs non-empty)
4. **Pointer Update**: Update rear pointer
5. **Size Update**: Increment queue size

## Step-by-Step Analysis

### Empty Queue:
- Step 1: \`front = new_node\` (1 operation)
- Step 2: \`rear = new_node\` (1 operation)
- Step 3: \`size++\` (1 operation)
- **Total**: 3 steps

### Non-Empty Queue:
- Step 1: \`rear.next = new_node\` (1 operation)
- Step 2: \`rear = new_node\` (1 operation)
- Step 3: \`size++\` (1 operation)
- **Total**: 4 steps

## Complexity Analysis
- **Time**: O(1) - constant number of operations
- **Space**: O(1) - only creates one new node
- **Best Case**: O(1) (empty queue)
- **Worst Case**: O(1) (non-empty queue)

## Key Insight
Enqueue is always constant time, making queues ideal for scenarios where elements need to be added efficiently regardless of queue size.`,

  dequeue: `# Dequeue Operation Analysis

## Algorithm Steps
1. **Empty Check**: Verify queue is not empty
2. **Value Storage**: Store front element's value
3. **Front Update**: Move front pointer to next element
4. **Rear Update**: Handle empty queue case
5. **Size Update**: Decrement queue size
6. **Return**: Return stored value

## Step-by-Step Analysis
- Step 1: \`value = front.value\` (1 operation)
- Step 2: \`front = front.next\` (1 operation)
- Step 3: \`rear = null\` if queue becomes empty (1 operation)
- Step 4: \`size--\` (1 operation)
- **Total**: 4 steps (plus empty check)

## Complexity Analysis
- **Time**: O(1) - constant number of operations
- **Space**: O(1) - no additional memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
Like enqueue, dequeue is always O(1) regardless of queue size, which is the fundamental advantage of queue data structure for FIFO scenarios.`,

  peek: `# Peek Operation Analysis

## Algorithm Steps
1. **Empty Check**: Verify queue is not empty
2. **Value Access**: Return front element's value

## Step-by-Step Analysis
- Step 1: \`return front.value\` (1 operation)
- **Total**: 1 step (plus empty check)

## Complexity Analysis
- **Time**: O(1) - single operation
- **Space**: O(1) - no memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
Peek is the simplest queue operation - it just reads the front value without modifying the queue structure, making it extremely efficient for inspection operations.`,

  is_empty: `# IsEmpty Operation Analysis

## Algorithm Steps
1. **Check**: Verify if front pointer is null

## Step-by-Step Analysis
- Step 1: \`return front === null\` (1 operation)
- **Total**: 1 step

## Complexity Analysis
- **Time**: O(1) - single comparison
- **Space**: O(1) - no memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
IsEmpty is the most fundamental queue operation - a simple null check that determines if the queue has any elements, similar to stack but using the front pointer.`
};
