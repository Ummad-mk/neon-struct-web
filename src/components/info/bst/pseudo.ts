export const pseudo = {
  full: `Binary Search Tree Operations

1. INSERT Operation:
   - CREATE new node with given value
   - IF root = null:
       * root ← new_node
   - ELSE:
       * current ← root
       * WHILE current ≠ null:
           - IF value < current.value:
               * IF current.left = null:
                   current.left ← new_node
                   BREAK
               * ELSE:
                   current ← current.left
           - ELSE IF value > current.value:
               * IF current.right = null:
                   current.right ← new_node
                   BREAK
               * ELSE:
                   current ← current.right
           - ELSE:
               RETURN failure (duplicate)
   - size ← size + 1
   - RETURN success

2. SEARCH Operation:
   - current ← root
   - position ← 0
   - WHILE current ≠ null:
       - IF value = current.value:
           RETURN success, position
       - ELSE IF value < current.value:
           current ← current.left
       - ELSE:
           current ← current.right
       - position ← position + 1
   - RETURN failure (not found)

3. DELETE Operation:
   - DELETE_NODE(root, value)
   
   DELETE_NODE(node, value):
   - IF node = null:
       RETURN failure
   - IF value < node.value:
       * result ← DELETE_NODE(node.left, value)
       * IF result.success:
           node.left ← result.newRoot
           RETURN success, node
   - ELSE IF value > node.value:
       * result ← DELETE_NODE(node.right, value)
       * IF result.success:
           node.right ← result.newRoot
           RETURN success, node
   - ELSE: // Node to delete found
       * IF node.left = null AND node.right = null:
           RETURN success, null (leaf)
       * IF node.left = null:
           RETURN success, node.right (right child only)
       * IF node.right = null:
           RETURN success, node.left (left child only)
       * ELSE: // Two children
           minNode ← FIND_MIN(node.right)
           node.value ← minNode.value
           result ← DELETE_NODE(node.right, minNode.value)
           RETURN success, node

4. TRAVERSAL Operations:
   
   INORDER(node):
   - IF node ≠ null:
       * INORDER(node.left)
       * VISIT(node.value)
       * INORDER(node.right)
   
   PREORDER(node):
   - IF node ≠ null:
       * VISIT(node.value)
       * PREORDER(node.left)
       * PREORDER(node.right)
   
   POSTORDER(node):
   - IF node ≠ null:
       * POSTORDER(node.left)
       * POSTORDER(node.right)
       * VISIT(node.value)

5. FIND_MIN Operation:
   - IF root = null:
       RETURN failure
   - current ← root
   - WHILE current.left ≠ null:
       current ← current.left
   - RETURN success, current.value

6. FIND_MAX Operation:
   - IF root = null:
       RETURN failure
   - current ← root
   - WHILE current.right ≠ null:
       current ← current.right
   - RETURN success, current.value

7. GET_HEIGHT Operation:
   - GET_HEIGHT_HELPER(root)
   
   GET_HEIGHT_HELPER(node):
   - IF node = null:
       RETURN 0
   - leftHeight ← GET_HEIGHT_HELPER(node.left)
   - rightHeight ← GET_HEIGHT_HELPER(node.right)
   - RETURN MAX(leftHeight, rightHeight) + 1

8. COUNT_NODES Operation:
   - COUNT_NODES_HELPER(root)
   
   COUNT_NODES_HELPER(node):
   - IF node = null:
       RETURN 0
   - RETURN 1 + COUNT_NODES_HELPER(node.left) + COUNT_NODES_HELPER(node.right)

Time Complexity:
- Insert: O(h) where h is tree height (O(log n) average, O(n) worst)
- Search: O(h) where h is tree height (O(log n) average, O(n) worst)
- Delete: O(h) where h is tree height (O(log n) average, O(n) worst)
- Traversal: O(n) - visits every node
- Find Min/Max: O(h) (O(log n) average, O(n) worst)
- Get Height: O(n) - visits every node
- Count Nodes: O(n) - visits every node

Space Complexity:
- Recursive operations: O(h) call stack (O(log n) average, O(n) worst)
- Tree storage: O(n)`,

  insert: `INSERT Operation Pseudocode

INSERT(value):
    new_node ← CREATE_NODE(value)
    
    IF root = null:
        root ← new_node        // 1 step
        size ← size + 1        // 1 step
        RETURN success, steps: 2
    
    current ← root
    steps ← 2
    
    WHILE current ≠ null:
        steps ← steps + 2  // comparison + move
        
        IF value < current.value:
            IF current.left = null:
                current.left ← new_node  // 1 step
                size ← size + 1            // 1 step
                RETURN success, steps: steps + 2
            current ← current.left
        ELSE IF value > current.value:
            IF current.right = null:
                current.right ← new_node // 1 step
                size ← size + 1            // 1 step
                RETURN success, steps: steps + 2
            current ← current.right
        ELSE:
            RETURN failure, message: "Duplicate", steps: steps
    END WHILE`,

  delete: `DELETE Operation Pseudocode

DELETE_NODE(node, value):
    IF node = null:
        RETURN failure, steps: 1
    
    steps ← 1
    
    IF value < node.value:
        result ← DELETE_NODE(node.left, value)
        IF result.success:
            node.left ← result.newRoot  // 1 step
            RETURN success, node, result.newSize, steps + result.steps
        RETURN result
    
    ELSE IF value > node.value:
        result ← DELETE_NODE(node.right, value)
        IF result.success:
            node.right ← result.newRoot // 1 step
            RETURN success, node, result.newSize, steps + result.steps
        RETURN result
    
    ELSE: // Node to delete found
        IF node.left = null AND node.right = null:
            RETURN success, null, 0, steps  // Leaf node
        
        IF node.left = null:
            RETURN success, node.right, 1, steps  // Right child only
        
        IF node.right = null:
            RETURN success, node.left, 1, steps   // Left child only
        
        // Two children case
        minNode ← FIND_MIN(node.right)  // O(h) steps
        node.value ← minNode.value       // 1 step
        result ← DELETE_NODE(node.right, minNode.value)
        RETURN success, node, result.newSize + 1, steps + result.steps`,

  search: `SEARCH Operation Pseudocode

SEARCH(value):
    current ← root
    position ← 0
    steps ← 0
    
    WHILE current ≠ null:
        steps ← steps + 2  // comparison + move
        
        IF value = current.value:
            RETURN success, value, position, steps + 1
        
        IF value < current.value:
            current ← current.left
        ELSE:
            current ← current.right
        
        position ← position + 1
    END WHILE
    
    RETURN failure, message: "Not found", steps`,

  traverse: `TRAVERSAL Operations Pseudocode

// Inorder Traversal (Left, Root, Right) - Sorted order
INORDER(node):
    IF node ≠ null:
        INORDER(node.left)           // 1 step + recursive
        VISIT(node.value)            // 1 step
        INORDER(node.right)          // 1 step + recursive

// Preorder Traversal (Root, Left, Right)
PREORDER(node):
    IF node ≠ null:
        VISIT(node.value)            // 1 step
        PREORDER(node.left)           // 1 step + recursive
        PREORDER(node.right)          // 1 step + recursive

// Postorder Traversal (Left, Right, Root)
POSTORDER(node):
    IF node ≠ null:
        POSTORDER(node.left)          // 1 step + recursive
        POSTORDER(node.right)         // 1 step + recursive
        VISIT(node.value)            // 1 step`,

  find_min_max: `FIND_MIN and FIND_MAX Operations

FIND_MIN():
    IF root = null:
        RETURN failure, steps: 1
    
    current ← root
    steps ← 1
    
    WHILE current.left ≠ null:
        current ← current.left  // 1 step
        steps ← steps + 1
    
    RETURN success, current.value, steps

FIND_MAX():
    IF root = null:
        RETURN failure, steps: 1
    
    current ← root
    steps ← 1
    
    WHILE current.right ≠ null:
        current ← current.right // 1 step
        steps ← steps + 1
    
    RETURN success, current.value, steps`,

  get_height: `GET_HEIGHT Operation Pseudocode

GET_HEIGHT(node):
    IF node = null:
        RETURN 0  // 1 step
    
    leftHeight ← GET_HEIGHT(node.left)   // 1 step + recursive
    rightHeight ← GET_HEIGHT(node.right) // 1 step + recursive
    RETURN MAX(leftHeight, rightHeight) + 1  // 1 step`,

  count_nodes: `COUNT_NODES Operation Pseudocode

COUNT_NODES(node):
    IF node = null:
        RETURN 0  // 1 step
    
    leftCount ← COUNT_NODES(node.left)   // 1 step + recursive
    rightCount ← COUNT_NODES(node.right) // 1 step + recursive
    RETURN 1 + leftCount + rightCount  // 1 step`,

  find_successor_predecessor: `SUCCESSOR and PREDECESSOR Operations

FIND_NODE(value):
    current ← root
    WHILE current ≠ null AND current.value ≠ value:
        IF value < current.value:
            current ← current.left
        ELSE:
            current ← current.right
    RETURN current

SUCCESSOR(value):
    node ← FIND_NODE(value)
    IF node = null: RETURN failure
    IF node.right ≠ null:
        RETURN FIND_MIN(node.right)
    ancestor ← root
    successor ← null
    WHILE ancestor ≠ node:
        IF value < ancestor.value:
            successor ← ancestor
            ancestor ← ancestor.left
        ELSE:
            ancestor ← ancestor.right
    RETURN successor

PREDECESSOR(value):
    node ← FIND_NODE(value)
    IF node = null: RETURN failure
    IF node.left ≠ null:
        RETURN FIND_MAX(node.left)
    ancestor ← root
    predecessor ← null
    WHILE ancestor ≠ node:
        IF value > ancestor.value:
            predecessor ← ancestor
            ancestor ← ancestor.right
        ELSE:
            ancestor ← ancestor.left
    RETURN predecessor`,

  range_search: `RANGE_SEARCH Operation

RANGE_SEARCH(node, min, max, result):
    IF node = null: RETURN
    IF node.value > min:
        RANGE_SEARCH(node.left, min, max, result)
    IF min ≤ node.value ≤ max:
        result ← result ∪ {node.value}
    IF node.value < max:
        RANGE_SEARCH(node.right, min, max, result)

CALL: RANGE_SEARCH(root, min, max, result)
RETURN result`,

  lca: `LOWEST_COMMON_ANCESTOR Operation

LCA(root, value1, value2):
    current ← root
    WHILE current ≠ null:
        IF value1 < current.value AND value2 < current.value:
            current ← current.left
        ELSE IF value1 > current.value AND value2 > current.value:
            current ← current.right
        ELSE:
            RETURN current
    RETURN failure`
};
