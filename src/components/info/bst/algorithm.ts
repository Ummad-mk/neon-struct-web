export const algorithm = {
  full: `# Binary Search Tree (BST) Data Structure

## Overview
A Binary Search Tree is a hierarchical data structure where each node has at most two children (left and right), and follows the BST property: left child values are less than parent, right child values are greater than parent.

## BST Property
For any node N:
- All values in N's left subtree < N's value
- All values in N's right subtree > N's value
- No duplicate values (typically)

## Operations and Complexity Analysis

### 1. INSERT Operation
**Description**: Add a new value while maintaining BST property

**Algorithm**:
1. Create new node with given value
2. If tree is empty, set root to new node
3. Otherwise, traverse from root:
   - Compare value with current node
   - If less, go left; if greater, go right
   - Continue until reaching null position
4. Insert new node at found position

Step Count:
- Each level: 2 steps (comparison + move)
- Final insertion: 2 steps

Time Complexity: 
- Average: O(log n) - balanced tree
- Worst: O(n) - degenerate tree (linked list)

Space Complexity: 

### 2. SEARCH Operation
**Description**: Find a value in the tree

**Algorithm**:
1. Start from root
2. At each node:
   - If value matches, return success
   - If less, go left; if greater, go right
   - If null reached, return failure

**Step Count**: 2h + 1 steps
- Each level: 2 steps (comparison + move)
- Final comparison: 1 step

**Time Complexity**: 
- Average: O(log n)
- Worst: O(n)

**Space Complexity**: O(1)

### 3. DELETE Operation
**Description**: Remove a value while maintaining BST property

**Algorithm**: Three cases for node to delete:
1. **Leaf node**: Simply remove
2. **One child**: Replace node with its child
3. **Two children**: Replace with inorder successor (minimum in right subtree)

**Step Count**: O(h) for search + O(h) for successor finding

**Time Complexity**: 
- Average: O(log n)
- Worst: O(n)

**Space Complexity**: O(1)

### 4. TRAVERSAL Operations

#### Inorder Traversal (Left, Root, Right)
- **Result**: Sorted order of all values
- **Step Count**: 3n steps (visit each node once)
- **Time Complexity**: O(n)

#### Preorder Traversal (Root, Left, Right)
- **Result**: Root before subtrees
- **Step Count**: 3n steps
- **Time Complexity**: O(n)

#### Postorder Traversal (Left, Right, Root)
- **Result**: Children before parent
- **Step Count**: 3n steps
- **Time Complexity**: O(n)

### 5. FIND_MIN Operation
**Description**: Find minimum value in tree

**Algorithm**: Follow left children from root

**Step Count**: h + 1 steps
- Each level: 1 step (move left)
- Final access: 1 step

**Time Complexity**: O(h) - O(log n) average, O(n) worst

### 6. FIND_MAX Operation
**Description**: Find maximum value in tree

**Algorithm**: Follow right children from root

**Step Count**: h + 1 steps

**Time Complexity**: O(h) - O(log n) average, O(n) worst

### 7. GET_HEIGHT Operation
**Description**: Calculate height of tree

**Algorithm**: Recursively calculate max depth

**Step Count**: 3n steps (each node visited once)

**Time Complexity**: O(n)

**Space Complexity**: O(h) - recursion stack

### 8. COUNT_NODES Operation
**Description**: Count total nodes in tree

**Algorithm**: Recursively count all nodes

**Step Count**: 3n steps

**Time Complexity**: O(n)

**Space Complexity**: O(h) - recursion stack

## Tree Balance and Performance

### Balanced Tree
- Height: O(log n)
- All operations: O(log n)
- Example: AVL tree, Red-Black tree

### Unbalanced Tree
- Height: O(n)
- Operations degrade to O(n)
- Example: Insert sorted data

## Advantages of BST
- **Efficient search**: O(log n) average case
- **Ordered data**: Inorder traversal gives sorted data
- **Dynamic**: Easy insertion and deletion
- **Flexible**: Can implement various data structures

## Disadvantages of BST
- **Balance dependency**: Performance depends on tree shape
- **Worst case**: Can degrade to O(n)
- **Memory overhead**: Two pointers per node
- **Complexity**: More complex than arrays for simple operations

## Common Applications
- **Dictionaries**: Key-value storage
- **Sets**: Efficient membership testing
- **Priority queues**: With modifications
- **Database indexes**: Fast data retrieval
- **Symbol tables**: Compiler implementation

## Memory Usage Analysis
- **Node structure**: value + left pointer + right pointer
- **Memory overhead**: 16-24 bytes per node (pointers)
- **Total space**: O(n) where n is number of nodes`,

  insert: `# Insert Operation Analysis

## Algorithm Steps
1. **Node Creation**: Create new node with value
2. **Empty Check**: Handle empty tree case
3. **Traversal**: Find appropriate insertion position
4. **Insertion**: Place new node at found position
5. **Size Update**: Increment tree size

## Step-by-Step Analysis
For each tree level visited:
- Step 1: \`value < current.value\` (1 comparison)
- Step 2: \`current = current.left/right\` (1 assignment)

Final insertion:
- Step 3: \`current.left/right = new_node\` (1 assignment)
- Step 4: \`size++\` (1 increment)

## Complexity Analysis
Best Case: 
Average Case: 
Worst Case: 
- **Space**: O(1) - only creates one node

## Key Insight
Insert performance directly depends on tree height. Balanced trees give logarithmic performance, while unbalanced trees degrade to linear performance.`,

  delete: `# Delete Operation Analysis

## Algorithm Steps - Three Cases

### Case 1: Leaf Node
- Simple removal: Set parent's child pointer to null
- **Steps**: 1 assignment

### Case 2: One Child
- Replace node with its child
- **Steps**: 1 assignment

### Case 3: Two Children
- Find inorder successor (minimum in right subtree)
- Replace node's value with successor's value
- Delete successor node (which will be case 1 or 2)
- **Steps**: O(h) for finding successor + O(h) for deletion

## Complexity Analysis
- **Search**: O(h) to find node
- **Successor**: O(h) to find minimum in right subtree
- **Total**: O(h) where h is tree height
- **Average**: O(log n)
- **Worst**: O(n)

## Key Insight
Delete is the most complex BST operation due to the need to maintain the BST property when removing nodes with two children.`,

  search: `# Search Operation Analysis

## Algorithm Steps
1. **Initialization**: Start from root
2. **Comparison**: Compare target with current node
3. **Navigation**: Move left or right based on comparison
4. **Termination**: Found or reached null

## Step-by-Step Analysis
For each tree level:
- Step 1: \`value == current.value\` (1 comparison)
- Step 2: \`value < current.value ? current.left : current.right\` (1 assignment)
- Step 3: Move to next level

## Complexity Analysis
- **Best Case**: O(1) - found at root
- **Average Case**: O(log n) - balanced tree
- **Worst Case**: O(n) - completely unbalanced
- **Space**: O(1)

## Key Insight
Search efficiency depends entirely on tree height. The BST property allows eliminating half the remaining tree at each comparison in balanced trees.`,

  traverse: `# Traversal Operations Analysis

## Inorder Traversal (Left, Root, Right)
- **Order**: Visits nodes in sorted order
- **Applications**: Getting sorted data, range queries
- **Steps**: 3 operations per node (left visit, root visit, right visit)

## Preorder Traversal (Root, Left, Right)
- **Order**: Visits root before subtrees
- **Applications**: Tree copying, prefix notation
- **Steps**: 3 operations per node

## Postorder Traversal (Left, Right, Root)
- **Order**: Visits children before parent
- **Applications**: Tree deletion, postfix notation
- **Steps**: 3 operations per node

## Complexity Analysis
- **Time**: O(n) - visits each node exactly once
- **Space**: O(h) - recursion stack depth
- **Memory**: O(n) for storing traversal result

## Key Insight
All traversals visit every node exactly once, giving linear time complexity. The order of visits determines the traversal type and its specific applications.`,

  find_min_max: `# Find Min/Max Operations Analysis

## Find Minimum Algorithm
1. Start at root
2. Follow left children until reaching null
3. Return last non-null node's value

## Find Maximum Algorithm
1. Start at root
2. Follow right children until reaching null
3. Return last non-null node's value

## Step-by-Step Analysis
For Find Minimum:
- Each level: \`current = current.left\` (1 assignment)
- Final: \`return current.value\` (1 access)

## Complexity Analysis
- **Time**: O(h) where h is tree height
- **Average**: O(log n) for balanced tree
- **Worst**: O(n) for unbalanced tree
- **Space**: O(1)

## Key Insight
Due to BST property, minimum is always the leftmost node and maximum is always the rightmost node, making these operations very efficient.`,

  get_height: `# Get Height Operation Analysis

## Algorithm Steps
1. **Base Case**: If node is null, return 0
2. **Recursive Case**: 
   - Calculate height of left subtree
   - Calculate height of right subtree
   - Return max of both + 1

## Step-by-Step Analysis
For each node:
- Step 1: \`leftHeight = calculateHeight(node.left)\` (1 call)
- Step 2: \`rightHeight = calculateHeight(node.right)\` (1 call)
- Step 3: \`return Math.max(leftHeight, rightHeight) + 1\` (1 operation)

## Complexity Analysis
- **Time**: O(n) - visits each node once
- **Space**: O(h) - recursion stack depth
- **Best**: O(log n) for balanced tree
- **Worst**: O(n) for unbalanced tree

## Key Insight
Height calculation requires visiting every node, making it inherently linear in the number of nodes. The recursion depth depends on tree balance.`,

  count_nodes: `# Count Nodes Operation Analysis

## Algorithm Steps
1. **Base Case**: If node is null, return 0
2. **Recursive Case**: 
   - Count nodes in left subtree
   - Count nodes in right subtree
   - Return 1 + leftCount + rightCount

## Step-by-Step Analysis
For each node:
- Step 1: \`leftCount = countNodes(node.left)\` (1 call)
- Step 2: \`rightCount = countNodes(node.right)\` (1 call)
- Step 3: \`return 1 + leftCount + rightCount\` (1 operation)

## Complexity Analysis
- **Time**: O(n) - visits each node once
- **Space**: O(h) - recursion stack depth
- **Memory**: O(1) additional space

## Key Insight
Like height calculation, counting nodes requires a complete tree traversal. The recursive approach naturally accumulates the count while visiting each node exactly once.`,

  find_successor_predecessor: `# Successor & Predecessor Operation Analysis

## Successor Algorithm
1. Locate the node with the given value
2. If right subtree exists, successor is the minimum in right subtree
3. Otherwise, walk from root and track the last node greater than value

## Predecessor Algorithm
1. Locate the node with the given value
2. If left subtree exists, predecessor is the maximum in left subtree
3. Otherwise, walk from root and track the last node less than value

## Complexity Analysis
- **Time**: O(h) where h is tree height
- **Average**: O(log n) balanced
- **Worst**: O(n) unbalanced
- **Space**: O(1)

## Key Insight
Successor and predecessor rely on BST ordering to skip entire subtrees while searching.`,

  range_search: `# Range Search Operation Analysis

## Algorithm Steps
1. Traverse the tree in-order
2. Skip left subtree when node value < min
3. Skip right subtree when node value > max
4. Collect values that fall inside the range

## Complexity Analysis
- **Time**: O(n) in worst case
- **Space**: O(h) recursion stack
- **Output**: O(k) for k values in range

## Key Insight
In-order traversal preserves sorted order, so range results are naturally ordered.`,

  lca: `# Lowest Common Ancestor (LCA) Operation Analysis

## Algorithm Steps
1. Start at root
2. If both values are less than current, go left
3. If both values are greater than current, go right
4. Otherwise current node is the LCA

## Complexity Analysis
- **Time**: O(h) where h is tree height
- **Average**: O(log n) balanced
- **Worst**: O(n) unbalanced
- **Space**: O(1)

## Key Insight
BST ordering lets us converge to the split point without exploring both subtrees.`
};
