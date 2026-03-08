from .base import DataStructureBase
from typing import Dict, Any, Optional, List

class TreeNode:
    def __init__(self, value: Any):
        self.value = value
        self.left = None
        self.right = None
        self.height = 1

class BinarySearchTree(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.root = None

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        self.root = self._insert_recursive(self.root, value, [])
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _insert_recursive(self, node: Optional[TreeNode], value: Any, path: List) -> TreeNode:
        if node is None:
            new_node = TreeNode(value)
            self.add_step(f"Found empty spot. Inserting {value}", {
                **self.to_dict(), 
                'highlight': value, 
                'visited': path + [value]
            })
            return new_node

        path.append(node.value)
        
        if value < node.value:
            self.add_step(f"{value} < {node.value}. Moving Left.", {
                **self.to_dict(), 
                'highlight': node.value, 
                'visited': list(path)
            })
            node.left = self._insert_recursive(node.left, value, path)
        elif value > node.value:
            self.add_step(f"{value} > {node.value}. Moving Right.", {
                **self.to_dict(), 
                'highlight': node.value, 
                'visited': list(path)
            })
            node.right = self._insert_recursive(node.right, value, path)
        else:
            self.add_step(f"{value} already exists.", {
                **self.to_dict(), 
                'highlight': node.value, 
                'visited': list(path)
            })

        return node

    def delete(self, value: Any) -> Dict:
        self.clear_steps()
        self.root = self._delete_recursive(self.root, value, [])
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _delete_recursive(self, node: Optional[TreeNode], value: Any, path: List) -> Optional[TreeNode]:
        if node is None:
            self.add_step(f"Reached null. Value {value} not found.", {**self.to_dict(), 'visited': path})
            return None

        path.append(node.value)
        self.add_step(f"Visiting {node.value}...", {**self.to_dict(), 'highlight': node.value, 'visited': list(path)})

        if value < node.value:
            node.left = self._delete_recursive(node.left, value, path)
        elif value > node.value:
            node.right = self._delete_recursive(node.right, value, path)
        else:
            self.add_step(f"Found {value}. Deleting node.", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(path)})
            
            if node.left is None:
                return node.right
            elif node.right is None:
                return node.left

            min_node = self._find_min(node.right)
            self.add_step(f"Replaced {value} with successor {min_node.value}", {**self.to_dict(), 'highlight': node.value})
            node.value = min_node.value
            node.right = self._delete_recursive(node.right, min_node.value, list(path))

        return node

    def _find_min(self, node: TreeNode) -> TreeNode:
        while node.left:
            node = node.left
        return node

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        self._search_recursive(self.root, value, [])
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _search_recursive(self, node: Optional[TreeNode], value: Any, visited: List) -> bool:
        if node is None:
            self.add_step(f"Value {value} not found", {**self.to_dict(), 'visited': visited})
            return False

        visited.append(node.value)
        self.add_step(f"Checking {node.value}...", {**self.to_dict(), 'highlight': node.value, 'visited': list(visited)})

        if value == node.value:
            self.add_step(f"Found {value}!", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(visited)})
            return True
        elif value < node.value:
            return self._search_recursive(node.left, value, visited)
        else:
            return self._search_recursive(node.right, value, visited)

    def to_dict(self) -> Dict:
        return {'tree': self._serialize(self.root)}

    def _serialize(self, node: Optional[TreeNode]) -> Optional[Dict]:
        if node is None:
            return None
        return {
            'value': node.value,
            'left': self._serialize(node.left),
            'right': self._serialize(node.right)
        }

    # --- ADVANCED OPERATIONS ---

    def traverse(self, traversal_type: str) -> Dict:
        self.clear_steps()
        result = []
        if not self.root:
            self.add_step("Tree is empty", self.to_dict())
            return {'success': False, 'message': 'Tree is empty', 'steps': self.steps}

        self.add_step(f"Starting {traversal_type} traversal", self.to_dict())
        
        if traversal_type == 'inorder':
            self._inorder(self.root, result)
        elif traversal_type == 'preorder':
            self._preorder(self.root, result)
        elif traversal_type == 'postorder':
            self._postorder(self.root, result)
        elif traversal_type == 'levelorder':
            self._levelorder(self.root, result)
        else:
            return {'success': False, 'message': 'Invalid traversal type', 'steps': self.steps}
            
        self.add_step(f"Traversal complete: {result}", {**self.to_dict(), 'visited': result})
        return {'success': True, 'result': result, 'steps': self.steps, 'state': self.to_dict()}

    def _inorder(self, node: Optional[TreeNode], result: List):
        if node:
            self.add_step(f"Visiting left child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._inorder(node.left, result)
            
            result.append(node.value)
            self.add_step(f"Processing {node.value}", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(result)})
            
            self.add_step(f"Visiting right child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._inorder(node.right, result)

    def _preorder(self, node: Optional[TreeNode], result: List):
        if node:
            result.append(node.value)
            self.add_step(f"Processing {node.value}", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(result)})
            
            self.add_step(f"Visiting left child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._preorder(node.left, result)
            
            self.add_step(f"Visiting right child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._preorder(node.right, result)

    def _postorder(self, node: Optional[TreeNode], result: List):
        if node:
            self.add_step(f"Visiting left child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._postorder(node.left, result)
            
            self.add_step(f"Visiting right child of {node.value}", {**self.to_dict(), 'highlight': node.value, 'visited': list(result)})
            self._postorder(node.right, result)
            
            result.append(node.value)
            self.add_step(f"Processing {node.value}", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(result)})

    def _levelorder(self, root: Optional[TreeNode], result: List):
        if not root: return
        queue = [root]
        while queue:
            node = queue.pop(0)
            result.append(node.value)
            self.add_step(f"Processing {node.value} at current level", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(result)})
            
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

    def find_min_max(self, find_type: str) -> Dict:
        self.clear_steps()
        if not self.root:
            return {'success': False, 'message': 'Tree is empty', 'steps': self.steps}

        current = self.root
        visited = []
        self.add_step(f"Starting search for {find_type}", self.to_dict())

        if find_type == 'min':
            while current.left:
                visited.append(current.value)
                self.add_step(f"Moving left from {current.value}", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                current = current.left
        elif find_type == 'max':
            while current.right:
                visited.append(current.value)
                self.add_step(f"Moving right from {current.value}", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                current = current.right
        else:
             return {'success': False, 'message': 'Invalid type'}

        visited.append(current.value)
        self.add_step(f"Found {find_type}: {current.value}", {**self.to_dict(), 'highlight': current.value, 'found': current.value, 'visited': visited})
        return {'success': True, 'result': current.value, 'steps': self.steps, 'state': self.to_dict()}

    def find_successor_predecessor(self, value: Any, find_type: str) -> Dict:
        self.clear_steps()
        if not self.root:
            return {'success': False, 'message': 'Tree is empty', 'steps': self.steps}

        self.add_step(f"Searching for {find_type} of {value}", self.to_dict())
        current = self.root
        target_node = None
        visited = []

        # Step 1: Find the node and track the path
        while current:
            visited.append(current.value)
            self.add_step(f"Searching for {value}, currently at {current.value}", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
            if current.value == value:
                target_node = current
                break
            elif value < current.value:
                current = current.left
            else:
                current = current.right

        if not target_node:
            self.add_step(f"Value {value} not found in tree", {**self.to_dict(), 'visited': list(visited)})
            return {'success': False, 'message': 'Value not found', 'steps': self.steps}

        self.add_step(f"Found {value}, now finding {find_type}", {**self.to_dict(), 'highlight': value, 'found': value, 'visited': list(visited)})
        
        # Step 2: Find Successor or Predecessor
        ans = None
        current = self.root
        while current:
            if find_type == 'successor':
                if current.value > value:
                    ans = current
                    current = current.left
                    if current: self.add_step(f"Potential successor {ans.value}, moving left to find smaller...", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                else:
                    current = current.right
                    if current: self.add_step(f"Value too small or equal, moving right...", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
            elif find_type == 'predecessor':
                if current.value < value:
                    ans = current
                    current = current.right
                    if current: self.add_step(f"Potential predecessor {ans.value}, moving right to find larger...", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                else:
                    current = current.left
                    if current: self.add_step(f"Value too large or equal, moving left...", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})

        if ans:
             self.add_step(f"Found {find_type}: {ans.value}", {**self.to_dict(), 'highlight': ans.value, 'found': ans.value, 'visited': list(visited) + [ans.value]})
             return {'success': True, 'result': ans.value, 'steps': self.steps, 'state': self.to_dict()}
        else:
             self.add_step(f"No {find_type} exists for {value}", {**self.to_dict(), 'visited': list(visited)})
             return {'success': False, 'message': f'No {find_type} exists', 'steps': self.steps}

    def get_height(self) -> Dict:
        self.clear_steps()
        if not self.root:
            self.add_step("Tree is empty, height is 0", self.to_dict())
            return {'success': True, 'result': 0, 'steps': self.steps}

        self.add_step("Starting height calculation (DFS)", self.to_dict())
        height = self._height_recursive(self.root, 0)
        self.add_step(f"Tree height is {height}", self.to_dict())
        return {'success': True, 'result': height, 'steps': self.steps}

    def _height_recursive(self, node: Optional[TreeNode], depth: int) -> int:
        if not node:
            return 0
        self.add_step(f"Measuring height at {node.value} (depth {depth})", {**self.to_dict(), 'highlight': node.value})
        left_height = self._height_recursive(node.left, depth + 1)
        right_height = self._height_recursive(node.right, depth + 1)
        current_height = max(left_height, right_height) + 1
        return current_height

    def count_nodes(self) -> Dict:
        self.clear_steps()
        self.add_step("Starting node count", self.to_dict())
        count = self._count_recursive(self.root)
        self.add_step(f"Total nodes: {count}", self.to_dict())
        return {'success': True, 'result': count, 'steps': self.steps}

    def _count_recursive(self, node: Optional[TreeNode]) -> int:
        if not node: return 0
        self.add_step(f"Counting node {node.value}", {**self.to_dict(), 'highlight': node.value})
        return 1 + self._count_recursive(node.left) + self._count_recursive(node.right)

    def range_search(self, min_val: Any, max_val: Any) -> Dict:
        self.clear_steps()
        result = []
        visited = []
        self.add_step(f"Starting range search between {min_val} and {max_val}", self.to_dict())
        self._range_search_recursive(self.root, min_val, max_val, result, visited)
        self.add_step(f"Range search complete. Found: {result}", {**self.to_dict(), 'visited': result, 'found': result[-1] if result else None})
        return {'success': True, 'result': result, 'steps': self.steps, 'state': self.to_dict()}

    def _range_search_recursive(self, node: Optional[TreeNode], min_val: Any, max_val: Any, result: List, visited: List):
        if not node: return
        
        visited.append(node.value)
        self.add_step(f"Checking {node.value} (Range: {min_val}-{max_val})", {**self.to_dict(), 'highlight': node.value, 'visited': list(visited)})

        if min_val < node.value:
            self._range_search_recursive(node.left, min_val, max_val, result, visited)
        
        if min_val <= node.value <= max_val:
            result.append(node.value)
            self.add_step(f"{node.value} is in range!", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(visited)})

        if max_val > node.value:
            self._range_search_recursive(node.right, min_val, max_val, result, visited)

    def lowest_common_ancestor(self, val1: Any, val2: Any) -> Dict:
        self.clear_steps()
        if not self.root:
            return {'success': False, 'message': 'Tree is empty', 'steps': self.steps}

        self.add_step(f"Starting LCA search for {val1} and {val2}", self.to_dict())
        current = self.root
        visited = []

        while current:
            visited.append(current.value)
            self.add_step(f"Checking {current.value}", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
            
            if current.value > val1 and current.value > val2:
                self.add_step(f"Both values are smaller than {current.value}. Moving left.", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                current = current.left
            elif current.value < val1 and current.value < val2:
                self.add_step(f"Both values are larger than {current.value}. Moving right.", {**self.to_dict(), 'highlight': current.value, 'visited': list(visited)})
                current = current.right
            else:
                self.add_step(f"Found LCA: {current.value}", {**self.to_dict(), 'highlight': current.value, 'found': current.value, 'visited': list(visited)})
                return {'success': True, 'result': current.value, 'steps': self.steps, 'state': self.to_dict()}

        return {'success': False, 'message': 'Values not found or error calculating LCA', 'steps': self.steps}

# --- THIS CLASS WAS MISSING ---
class AVLTree(BinarySearchTree):
    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        self.root = self._insert_recursive(self.root, value, [])
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _insert_recursive(self, node: Optional[TreeNode], value: Any, path: List) -> TreeNode:
        if node is None:
            new_node = TreeNode(value)
            self.add_step(f"Found empty spot. Inserting {value}", {
                **self.to_dict(),
                'highlight': value,
                'visited': path + [value]
            })
            return new_node

        path.append(node.value)
        if value < node.value:
            self.add_step(f"{value} < {node.value}. Moving Left.", {
                **self.to_dict(),
                'highlight': node.value,
                'visited': list(path)
            })
            node.left = self._insert_recursive(node.left, value, path)
        elif value > node.value:
            self.add_step(f"{value} > {node.value}. Moving Right.", {
                **self.to_dict(),
                'highlight': node.value,
                'visited': list(path)
            })
            node.right = self._insert_recursive(node.right, value, path)
        else:
            self.add_step(f"{value} already exists.", {
                **self.to_dict(),
                'highlight': node.value,
                'visited': list(path)
            })
            return node

        if node is None:
            return None

        node.height = 1 + max(self._get_height(node.left), self._get_height(node.right))
        balance = self._get_balance(node)

        if balance > 1 and value < (node.left.value if node.left else value):
            return self._right_rotate(node, f"Right rotation at {node.value} (LL case)")
        if balance < -1 and value > (node.right.value if node.right else value):
            return self._left_rotate(node, f"Left rotation at {node.value} (RR case)")
        if balance > 1 and value > (node.left.value if node.left else value):
            node.left = self._left_rotate(node.left, f"Left rotation at {node.left.value} (LR case)") if node.left else node.left
            return self._right_rotate(node, f"Right rotation at {node.value} (LR case)")
        if balance < -1 and value < (node.right.value if node.right else value):
            node.right = self._right_rotate(node.right, f"Right rotation at {node.right.value} (RL case)") if node.right else node.right
            return self._left_rotate(node, f"Left rotation at {node.value} (RL case)")

        return node

    def delete(self, value: Any) -> Dict:
        self.clear_steps()
        self.root = self._delete_recursive(self.root, value, [])
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _delete_recursive(self, node: Optional[TreeNode], value: Any, path: List) -> Optional[TreeNode]:
        if node is None:
            self.add_step(f"Reached null. Value {value} not found.", {**self.to_dict(), 'visited': path})
            return None

        path.append(node.value)
        self.add_step(f"Visiting {node.value}...", {**self.to_dict(), 'highlight': node.value, 'visited': list(path)})

        if value < node.value:
            node.left = self._delete_recursive(node.left, value, path)
        elif value > node.value:
            node.right = self._delete_recursive(node.right, value, path)
        else:
            self.add_step(f"Found {value}. Deleting node.", {**self.to_dict(), 'highlight': node.value, 'found': node.value, 'visited': list(path)})
            if node.left is None:
                return node.right
            if node.right is None:
                return node.left

            successor = self._min_value_node(node.right)
            self.add_step(f"Replaced {value} with successor {successor.value}", {**self.to_dict(), 'highlight': node.value})
            node.value = successor.value
            node.right = self._delete_recursive(node.right, successor.value, list(path))

        node.height = 1 + max(self._get_height(node.left), self._get_height(node.right))
        balance = self._get_balance(node)

        if balance > 1 and self._get_balance(node.left) >= 0:
            return self._right_rotate(node, f"Right rotation at {node.value} (LL case)")
        if balance > 1 and self._get_balance(node.left) < 0:
            node.left = self._left_rotate(node.left, f"Left rotation at {node.left.value} (LR case)") if node.left else node.left
            return self._right_rotate(node, f"Right rotation at {node.value} (LR case)")
        if balance < -1 and self._get_balance(node.right) <= 0:
            return self._left_rotate(node, f"Left rotation at {node.value} (RR case)")
        if balance < -1 and self._get_balance(node.right) > 0:
            node.right = self._right_rotate(node.right, f"Right rotation at {node.right.value} (RL case)") if node.right else node.right
            return self._left_rotate(node, f"Left rotation at {node.value} (RL case)")

        return node

    def _get_height(self, node: Optional[TreeNode]) -> int:
        return node.height if node else 0

    def _get_balance(self, node: Optional[TreeNode]) -> int:
        if not node:
            return 0
        return self._get_height(node.left) - self._get_height(node.right)

    def _right_rotate(self, y: TreeNode, message: str) -> TreeNode:
        x = y.left
        if x is None:
            return y
        t2 = x.right

        x.right = y
        y.left = t2

        y.height = 1 + max(self._get_height(y.left), self._get_height(y.right))
        x.height = 1 + max(self._get_height(x.left), self._get_height(x.right))

        self.add_step(message, {**self.to_dict(), 'highlight': x.value})
        return x

    def _left_rotate(self, x: TreeNode, message: str) -> TreeNode:
        y = x.right
        if y is None:
            return x
        t2 = y.left

        y.left = x
        x.right = t2

        x.height = 1 + max(self._get_height(x.left), self._get_height(x.right))
        y.height = 1 + max(self._get_height(y.left), self._get_height(y.right))

        self.add_step(message, {**self.to_dict(), 'highlight': y.value})
        return y

    def _min_value_node(self, node: TreeNode) -> TreeNode:
        current = node
        while current.left:
            current = current.left
        return current
