export const code = {
  full: `// Binary Search Tree Implementation
class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1; // For AVL trees
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
        this.size = 0;
    }

    // Insert operation
    insert(value) {
        const newNode = new TreeNode(value);
        if (!this.root) {
            this.root = newNode;    // 1 step
            this.size++;            // 1 step
            return { success: true, steps: 2 };
        }
        
        let current = this.root;
        let steps = 2;
        
        while (true) {
            steps += 2; // comparison and move
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;  // 1 step
                    this.size++;              // 1 step
                    return { success: true, steps: steps + 2 };
                }
                current = current.left;
            } else if (value > current.value) {
                if (!current.right) {
                    current.right = newNode; // 1 step
                    this.size++;              // 1 step
                    return { success: true, steps: steps + 2 };
                }
                current = current.right;
            } else {
                return { success: false, message: 'Duplicate value', steps: steps };
            }
        }
    }

    // Search operation
    search(value) {
        let current = this.root;
        let steps = 0;
        let position = 0;
        
        while (current) {
            steps += 2; // comparison and move
            if (value === current.value) {
                return { success: true, found: value, position, steps: steps + 1 };
            }
            
            current = value < current.value ? current.left : current.right;
            position++;
        }
        
        return { success: false, message: 'Value not found', steps: steps };
    }

    // Delete operation
    delete(value) {
        const result = this.deleteNode(this.root, value);
        if (result.success) {
            this.root = result.newRoot;
            this.size = result.newSize;
        }
        return result;
    }

    deleteNode(node, value) {
        if (!node) {
            return { success: false, message: 'Value not found', steps: 1 };
        }
        
        let steps = 1;
        
        if (value < node.value) {
            const leftResult = this.deleteNode(node.left, value);
            if (leftResult.success) {
                node.left = leftResult.newRoot;
                return { success: true, newRoot: node, newSize: leftResult.newSize, steps: steps + leftResult.steps };
            }
            return leftResult;
        } else if (value > node.value) {
            const rightResult = this.deleteNode(node.right, value);
            if (rightResult.success) {
                node.right = rightResult.newRoot;
                return { success: true, newRoot: node, newSize: rightResult.newSize, steps: steps + rightResult.steps };
            }
            return rightResult;
        } else {
            // Node to delete found
            if (!node.left && !node.right) {
                return { success: true, newRoot: null, newSize: 0, steps: steps };
            } else if (!node.left) {
                return { success: true, newRoot: node.right, newSize: 1, steps: steps };
            } else if (!node.right) {
                return { success: true, newRoot: node.left, newSize: 1, steps: steps };
            } else {
                // Node has two children
                const minRight = this.findMin(node.right);
                node.value = minRight.value;
                const rightResult = this.deleteNode(node.right, minRight.value);
                return { success: true, newRoot: node, newSize: rightResult.newSize + 1, steps: steps + rightResult.steps };
            }
        }
    }

    findMin(node) {
        while (node.left) {
            node = node.left;
        }
        return node;
    }

    // Traversal operations
    inorderTraversal() {
        const result = [];
        this.inorderHelper(this.root, result);
        return { success: true, traversal: result };
    }

    inorderHelper(node, result) {
        if (node) {
            this.inorderHelper(node.left, result);   // 1 step
            result.push(node.value);                  // 1 step
            this.inorderHelper(node.right, result);  // 1 step
        }
    }

    preorderTraversal() {
        const result = [];
        this.preorderHelper(this.root, result);
        return { success: true, traversal: result };
    }

    preorderHelper(node, result) {
        if (node) {
            result.push(node.value);                  // 1 step
            this.preorderHelper(node.left, result);   // 1 step
            this.preorderHelper(node.right, result);  // 1 step
        }
    }

    postorderTraversal() {
        const result = [];
        this.postorderHelper(this.root, result);
        return { success: true, traversal: result };
    }

    postorderHelper(node, result) {
        if (node) {
            this.postorderHelper(node.left, result);   // 1 step
            this.postorderHelper(node.right, result);  // 1 step
            result.push(node.value);                   // 1 step
        }
    }

    // Find minimum and maximum
    findMin() {
        if (!this.root) {
            return { success: false, message: 'Tree is empty' };
        }
        
        let current = this.root;
        let steps = 1;
        
        while (current.left) {
            current = current.left;  // 1 step
            steps++;
        }
        
        return { success: true, min: current.value, steps: steps };
    }

    findMax() {
        if (!this.root) {
            return { success: false, message: 'Tree is empty' };
        }
        
        let current = this.root;
        let steps = 1;
        
        while (current.right) {
            current = current.right; // 1 step
            steps++;
        }
        
        return { success: true, max: current.value, steps: steps };
    }

    // Get tree height
    getHeight() {
        return this.calculateHeight(this.root);
    }

    calculateHeight(node) {
        if (!node) {
            return 0;  // 1 step
        }
        
        const leftHeight = this.calculateHeight(node.left);   // 1 step + recursive
        const rightHeight = this.calculateHeight(node.right); // 1 step + recursive
        return Math.max(leftHeight, rightHeight) + 1;      // 1 step
    }

    // Count nodes
    countNodes() {
        return this.countNodesHelper(this.root);
    }

    countNodesHelper(node) {
        if (!node) {
            return 0;  // 1 step
        }
        
        return 1 + this.countNodesHelper(node.left) + this.countNodesHelper(node.right); // 3 steps + recursive
    }
}`,

  insert: `// Insert Operation - Add value to BST
insert(value) {
    const newNode = new TreeNode(value);
    
    if (!this.root) {
        this.root = newNode;    // 1 step
        this.size++;            // 1 step
        return { success: true, steps: 2 };
    }
    
    let current = this.root;
    let steps = 2;
    
    while (true) {
        steps += 2; // comparison and traversal
        if (value < current.value) {
            if (!current.left) {
                current.left = newNode;  // 1 step
                this.size++;              // 1 step
                return { success: true, steps: steps + 2 };
            }
            current = current.left;
        } else if (value > current.value) {
            if (!current.right) {
                current.right = newNode; // 1 step
                this.size++;              // 1 step
                return { success: true, steps: steps + 2 };
            }
            current = current.right;
        } else {
            return { success: false, message: 'Duplicate value', steps: steps };
        }
    }
}`,

  delete: `// Delete Operation - Remove value from BST
deleteNode(node, value) {
    if (!node) {
        return { success: false, message: 'Value not found', steps: 1 };
    }
    
    let steps = 1;
    
    if (value < node.value) {
        const leftResult = this.deleteNode(node.left, value);
        if (leftResult.success) {
            node.left = leftResult.newRoot;  // 1 step
            return { success: true, newRoot: node, newSize: leftResult.newSize, steps: steps + leftResult.steps };
        }
        return leftResult;
    } else if (value > node.value) {
        const rightResult = this.deleteNode(node.right, value);
        if (rightResult.success) {
            node.right = rightResult.newRoot; // 1 step
            return { success: true, newRoot: node, newSize: rightResult.newSize, steps: steps + rightResult.steps };
        }
        return rightResult;
    } else {
        // Node found - handle three cases
        if (!node.left && !node.right) {
            return { success: true, newRoot: null, newSize: 0, steps: steps }; // Leaf node
        } else if (!node.left) {
            return { success: true, newRoot: node.right, newSize: 1, steps: steps }; // Right child only
        } else if (!node.right) {
            return { success: true, newRoot: node.left, newSize: 1, steps: steps }; // Left child only
        } else {
            // Two children - find inorder successor
            const minRight = this.findMin(node.right); // O(h) steps
            node.value = minRight.value;             // 1 step
            const rightResult = this.deleteNode(node.right, minRight.value);
            return { success: true, newRoot: node, newSize: rightResult.newSize + 1, steps: steps + rightResult.steps };
        }
    }
}`,

  search: `// Search Operation - Find value in BST
search(value) {
    let current = this.root;
    let steps = 0;
    let position = 0;
    
    while (current) {
        steps += 2; // comparison and move
        if (value === current.value) {
            return { success: true, found: value, position, steps: steps + 1 };
        }
        
        current = value < current.value ? current.left : current.right;
        position++;
    }
    
    return { success: false, message: 'Value not found', steps: steps };
}`,

  traverse: `// Traversal Operations

// Inorder Traversal (Left, Root, Right)
inorderHelper(node, result) {
    if (node) {
        this.inorderHelper(node.left, result);   // 1 step + recursive
        result.push(node.value);                  // 1 step
        this.inorderHelper(node.right, result);  // 1 step + recursive
    }
}

// Preorder Traversal (Root, Left, Right)
preorderHelper(node, result) {
    if (node) {
        result.push(node.value);                  // 1 step
        this.preorderHelper(node.left, result);   // 1 step + recursive
        this.preorderHelper(node.right, result);  // 1 step + recursive
    }
}

// Postorder Traversal (Left, Right, Root)
postorderHelper(node, result) {
    if (node) {
        this.postorderHelper(node.left, result);   // 1 step + recursive
        this.postorderHelper(node.right, result);  // 1 step + recursive
        result.push(node.value);                   // 1 step
    }
}`,

  find_min_max: `// Find Minimum Value
findMin() {
    if (!this.root) {
        return { success: false, message: 'Tree is empty', steps: 1 };
    }
    
    let current = this.root;
    let steps = 1;
    
    while (current.left) {
        current = current.left;  // 1 step
        steps++;
    }
    
    return { success: true, min: current.value, steps: steps };
}

// Find Maximum Value
findMax() {
    if (!this.root) {
        return { success: false, message: 'Tree is empty', steps: 1 };
    }
    
    let current = this.root;
    let steps = 1;
    
    while (current.right) {
        current = current.right; // 1 step
        steps++;
    }
    
    return { success: true, max: current.value, steps: steps };
}`,

  get_height: `// Get Tree Height
calculateHeight(node) {
    if (!node) {
        return 0;  // 1 step
    }
    
    const leftHeight = this.calculateHeight(node.left);   // 1 step + recursive
    const rightHeight = this.calculateHeight(node.right); // 1 step + recursive
    return Math.max(leftHeight, rightHeight) + 1;      // 1 step
}`,

  count_nodes: `// Count Total Nodes
countNodesHelper(node) {
    if (!node) {
        return 0;  // 1 step
    }
    
    return 1 + this.countNodesHelper(node.left) + this.countNodesHelper(node.right); // 3 steps + recursive
}`,

  find_successor_predecessor: `// Find Successor and Predecessor
findNode(value) {
    let current = this.root;
    while (current && current.value !== value) {
        current = value < current.value ? current.left : current.right;
    }
    return current;
}

findSuccessor(value) {
    const node = this.findNode(value);
    if (!node) return { success: false, message: 'Value not found' };
    if (node.right) {
        const min = this.findMin(node.right);
        return { success: true, result: min.value };
    }
    let current = this.root;
    let successor = null;
    while (current && current.value !== value) {
        if (value < current.value) {
            successor = current;
            current = current.left;
        } else {
            current = current.right;
        }
    }
    return successor ? { success: true, result: successor.value } : { success: false, message: 'No successor' };
}

findPredecessor(value) {
    const node = this.findNode(value);
    if (!node) return { success: false, message: 'Value not found' };
    if (node.left) {
        const max = this.findMax(node.left);
        return { success: true, result: max.value };
    }
    let current = this.root;
    let predecessor = null;
    while (current && current.value !== value) {
        if (value > current.value) {
            predecessor = current;
            current = current.right;
        } else {
            current = current.left;
        }
    }
    return predecessor ? { success: true, result: predecessor.value } : { success: false, message: 'No predecessor' };
}`,

  range_search: `// Range Search
rangeSearch(min, max) {
    const result = [];
    const walk = (node) => {
        if (!node) return;
        if (node.value > min) walk(node.left);
        if (node.value >= min && node.value <= max) result.push(node.value);
        if (node.value < max) walk(node.right);
    };
    walk(this.root);
    return { success: true, result };
}`,

  lca: `// Lowest Common Ancestor
lowestCommonAncestor(val1, val2) {
    let current = this.root;
    while (current) {
        if (val1 < current.value && val2 < current.value) {
            current = current.left;
        } else if (val1 > current.value && val2 > current.value) {
            current = current.right;
        } else {
            return { success: true, result: current.value };
        }
    }
    return { success: false, message: 'LCA not found' };
}`
};
