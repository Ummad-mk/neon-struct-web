export const algorithm = {
  full: `# Priority Queue Data Structure

## Overview
A Priority Queue stores elements with priorities and always removes the element with the highest priority (min or max depending on variant). This implementation is a min-priority queue.

## Key Property
- The element with the smallest priority value is removed first.
- If priorities tie, earlier inserted elements are removed first.

## Operations and Complexity Analysis

### 1. ENQUEUE (INSERT)
**Description**: Insert an element with a priority

**Algorithm**:
1. Add new item to heap
2. Bubble up while priority is smaller than parent

**Time Complexity**: O(log n)
**Space Complexity**: O(1)

### 2. DEQUEUE (DELETE MIN)
**Description**: Remove the element with smallest priority

**Algorithm**:
1. Remove root (min)
2. Move last element to root
3. Bubble down to restore heap order

**Time Complexity**: O(log n)
**Space Complexity**: O(1)

### 3. PEEK
**Description**: Return min element without removing

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 4. CHANGE PRIORITY
**Description**: Update priority for a value

**Algorithm**:
1. Find the item
2. Update its priority
3. Heapify or bubble up/down

**Time Complexity**: O(n) to find + O(log n) to rebalance
**Space Complexity**: O(1)

### 5. SEARCH
**Description**: Find a value in the queue

**Time Complexity**: O(n)
**Space Complexity**: O(1)

## Advantages
- Fast access to the highest-priority item
- Efficient for scheduling and shortest path algorithms

## Disadvantages
- Search and arbitrary updates are linear without extra indexing
- More complex than a simple queue
`,

  insert: `# Enqueue Operation Analysis

## Algorithm Steps
1. Insert item at the end of the heap
2. Bubble up until heap property holds

## Complexity Analysis
- Time: O(log n)
- Space: O(1)
`,

  delete: `# Dequeue Operation Analysis

## Algorithm Steps
1. Remove root
2. Replace root with last item
3. Bubble down to restore heap property

## Complexity Analysis
- Time: O(log n)
- Space: O(1)
`,

  peek: `# Peek Operation Analysis

## Algorithm Steps
1. Return root element

## Complexity Analysis
- Time: O(1)
- Space: O(1)
`,

  change_priority: `# Change Priority Operation Analysis

## Algorithm Steps
1. Find item
2. Update priority
3. Rebalance heap

## Complexity Analysis
- Time: O(n + log n)
- Space: O(1)
`,

  search: `# Search Operation Analysis

## Algorithm Steps
1. Scan items linearly

## Complexity Analysis
- Time: O(n)
- Space: O(1)
`
};
