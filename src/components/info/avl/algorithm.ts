export const algorithm = {
  full: `# AVL Tree Data Structure

## Overview
An AVL Tree is a self-balancing Binary Search Tree. After every insert or delete, it restores balance using rotations to keep height O(log n).

## AVL Property
For every node:
- Balance factor = height(left) - height(right)
- Balance factor must be -1, 0, or 1

## Operations and Complexity Analysis

### 1. INSERT Operation
**Description**: Insert value and rebalance with rotations

**Algorithm**:
1. Perform standard BST insert
2. Update height of each ancestor node
3. Compute balance factor
4. If unbalanced, perform one of:
   - LL: Right rotation
   - RR: Left rotation
   - LR: Left rotation on left child, then right rotation
   - RL: Right rotation on right child, then left rotation

**Time Complexity**: O(log n)
**Space Complexity**: O(log n) recursion

### 2. DELETE Operation
**Description**: Remove value and rebalance

**Algorithm**:
1. Perform standard BST delete
2. Update height on the way back up
3. Rebalance using the same four rotation cases

**Time Complexity**: O(log n)
**Space Complexity**: O(log n) recursion

### 3. SEARCH Operation
**Description**: Find value using BST property

**Time Complexity**: O(log n)
**Space Complexity**: O(1)

### 4. TRAVERSAL Operations
Inorder, preorder, postorder, levelorder

**Time Complexity**: O(n)
**Space Complexity**: O(n) for output + O(h) recursion

### 5. FIND_MIN / FIND_MAX
**Time Complexity**: O(log n)

### 6. GET_HEIGHT / COUNT_NODES / RANGE_SEARCH / LCA
**Time Complexity**: O(n) for full traversal based operations

## Rotations
- **Left Rotation**: fixes right-heavy imbalance
- **Right Rotation**: fixes left-heavy imbalance
- **Left-Right**: left rotation on left child, then right rotation
- **Right-Left**: right rotation on right child, then left rotation

## Advantages
- Guaranteed O(log n) for search, insert, delete
- Predictable performance regardless of insert order

## Disadvantages
- More complex than BST
- Extra rotations add overhead
`
};
