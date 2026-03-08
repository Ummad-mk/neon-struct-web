export const pseudo = {
  full: `AVL Tree Operations

1. INSERT Operation:
   - root ← INSERT_AVL(root, value)

   INSERT_AVL(node, value):
   - IF node = null:
       RETURN new node(value)
   - IF value < node.value:
       node.left ← INSERT_AVL(node.left, value)
   - ELSE IF value > node.value:
       node.right ← INSERT_AVL(node.right, value)
   - ELSE:
       RETURN node (duplicate)
   - UPDATE node.height
   - balance ← HEIGHT(node.left) - HEIGHT(node.right)
   - IF balance > 1 AND value < node.left.value:
       RETURN RIGHT_ROTATE(node)          // LL
   - IF balance < -1 AND value > node.right.value:
       RETURN LEFT_ROTATE(node)           // RR
   - IF balance > 1 AND value > node.left.value:
       node.left ← LEFT_ROTATE(node.left) // LR
       RETURN RIGHT_ROTATE(node)
   - IF balance < -1 AND value < node.right.value:
       node.right ← RIGHT_ROTATE(node.right) // RL
       RETURN LEFT_ROTATE(node)
   - RETURN node

2. DELETE Operation:
   - root ← DELETE_AVL(root, value)

   DELETE_AVL(node, value):
   - IF node = null: RETURN null
   - IF value < node.value:
       node.left ← DELETE_AVL(node.left, value)
   - ELSE IF value > node.value:
       node.right ← DELETE_AVL(node.right, value)
   - ELSE:
       IF node has 0 or 1 child:
           node ← child or null
       ELSE:
           successor ← MIN(node.right)
           node.value ← successor.value
           node.right ← DELETE_AVL(node.right, successor.value)
   - IF node = null: RETURN null
   - UPDATE node.height
   - balance ← HEIGHT(node.left) - HEIGHT(node.right)
   - IF balance > 1 AND BALANCE(node.left) ≥ 0:
       RETURN RIGHT_ROTATE(node)         // LL
   - IF balance > 1 AND BALANCE(node.left) < 0:
       node.left ← LEFT_ROTATE(node.left) // LR
       RETURN RIGHT_ROTATE(node)
   - IF balance < -1 AND BALANCE(node.right) ≤ 0:
       RETURN LEFT_ROTATE(node)          // RR
   - IF balance < -1 AND BALANCE(node.right) > 0:
       node.right ← RIGHT_ROTATE(node.right) // RL
       RETURN LEFT_ROTATE(node)
   - RETURN node

3. SEARCH Operation:
   - Same as BST using comparisons

4. TRAVERSAL Operations:
   - INORDER, PREORDER, POSTORDER, LEVELORDER
`
};
