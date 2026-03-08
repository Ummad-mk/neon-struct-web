export const algorithm = {
  full: `# Stack Data Structure

## Overview
A Stack is a linear data structure that follows the LIFO (Last In, First Out) principle. Elements can only be added (pushed) to and removed (popped) from the top of the stack.

## Key Principle: LIFO
- **Last In**: The most recently added element
- **First Out**: The first element to be removed
- **Real-world analogy**: Stack of plates, pile of books

## Operations and Complexity Analysis

### 1. PUSH Operation
**Description**: Add an element to the top of the stack

**Algorithm**:
1. Create new node with given value
2. Point new node's next to current top
3. Update top to point to new node
4. Increment size

**Step Count**: 3 steps
- \`new_node.next = top\` (1 step)
- \`top = new_node\` (1 step)
- \`size++\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 2. POP Operation
**Description**: Remove and return the top element

**Algorithm**:
1. Check if stack is empty
2. Store top's value
3. Move top to next node
4. Decrement size
5. Return stored value

**Step Count**: 3 steps (if not empty)
- \`value = top.value\` (1 step)
- \`top = top.next\` (1 step)
- \`size--\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 3. PEEK Operation
**Description**: Return the top element without removing it

**Algorithm**:
1. Check if stack is empty
2. Return top's value

**Step Count**: 1 step
- \`return top.value\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 4. ISEMPTY Operation
**Description**: Check if the stack contains no elements

**Algorithm**:
1. Return whether top is null

**Step Count**: 1 step
- \`return top === null\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

## Implementation Variants

### Linked List Implementation
- **Advantages**: Dynamic size, no capacity limits
- **Memory**: O(n) for n elements
- **Operations**: All O(1) time complexity

### Array Implementation
- **Advantages**: Better cache locality, simpler code
- **Memory**: O(n) but may have unused capacity
- **Operations**: All O(1) time complexity

## Advantages of Stacks
- **Simple operations**: All basic operations are O(1)
- **Memory efficient**: Only stores necessary elements
- **Predictable behavior**: LIFO principle is intuitive
- **Wide applicability**: Used in many algorithms

## Disadvantages of Stacks
- **Limited access**: Can only access top element
- **No random access**: Cannot access middle elements directly
- **Memory overhead**: Pointer overhead in linked list implementation

## Common Applications
- **Function call stack**: Managing function calls and returns
- **Expression evaluation**: Converting infix to postfix notation
- **Undo functionality**: Storing previous states
- **Backtracking algorithms**: Exploring paths and backtracking
- **Memory management**: Stack-based memory allocation

## Memory Usage Analysis
- **Linked List**: Each element stores value + pointer (8-16 bytes overhead)
- **Array**: May have unused capacity but no per-element overhead
- **Total Space**: O(n) where n is number of elements`,

  push: `# Push Operation Analysis

## Algorithm Steps
1. **Node Creation**: Allocate memory for new node
2. **Link Update**: Connect new node to current top
3. **Top Update**: Update top pointer to new node
4. **Size Update**: Increment stack size

## Step-by-Step Analysis
- Step 1: \`new_node.next = top\` (1 operation)
- Step 2: \`top = new_node\` (1 operation)
- Step 3: \`size++\` (1 operation)
- **Total**: 3 steps

## Complexity Analysis
- **Time**: O(1) - constant number of operations
- **Space**: O(1) - only creates one new node
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
Push operation is always constant time regardless of stack size, which is the primary advantage of stack data structure.`,

  pop: `# Pop Operation Analysis

## Algorithm Steps
1. **Empty Check**: Verify stack is not empty
2. **Value Storage**: Store top element's value
3. **Top Update**: Move top pointer to next element
4. **Size Update**: Decrement stack size
5. **Return**: Return stored value

## Step-by-Step Analysis
- Step 1: \`value = top.value\` (1 operation)
- Step 2: \`top = top.next\` (1 operation)
- Step 3: \`size--\` (1 operation)
- **Total**: 3 steps (plus empty check)

## Complexity Analysis
- **Time**: O(1) - constant number of operations
- **Space**: O(1) - no additional memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
Like push, pop is always O(1) regardless of stack size, making stacks ideal for LIFO scenarios where efficiency is critical.`,

  peek: `# Peek Operation Analysis

## Algorithm Steps
1. **Empty Check**: Verify stack is not empty
2. **Value Access**: Return top element's value

## Step-by-Step Analysis
- Step 1: \`return top.value\` (1 operation)
- **Total**: 1 step (plus empty check)

## Complexity Analysis
- **Time**: O(1) - single operation
- **Space**: O(1) - no memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
Peek is the simplest stack operation - it just reads the top value without modifying the stack structure, making it extremely efficient.`,

  is_empty: `# IsEmpty Operation Analysis

## Algorithm Steps
1. **Check**: Verify if top pointer is null

## Step-by-Step Analysis
- Step 1: \`return top === null\` (1 operation)
- **Total**: 1 step

## Complexity Analysis
- **Time**: O(1) - single comparison
- **Space**: O(1) - no memory allocation
- **Best Case**: O(1)
- **Worst Case**: O(1)

## Key Insight
IsEmpty is the most fundamental stack operation - a simple null check that determines if the stack has any elements.`
};
