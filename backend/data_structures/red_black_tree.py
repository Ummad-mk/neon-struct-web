from .base import DataStructureBase
from typing import Dict, Any, Optional, List


class RBNode:
    def __init__(self, value: Any, color: str = 'red'):
        self.value = value
        self.color = color
        self.left: 'RBNode' = None  # type: ignore
        self.right: 'RBNode' = None  # type: ignore
        self.parent: 'RBNode' = None  # type: ignore


class RedBlackTree(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.NIL = RBNode(None, 'black')
        self.NIL.left = self.NIL
        self.NIL.right = self.NIL
        self.NIL.parent = self.NIL
        self.root: RBNode = self.NIL

    def _coerce_value(self, value: Any) -> Optional[int]:
        if value is None:
            return None
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str):
            text = value.strip()
            if text == '':
                return None
            try:
                return int(text)
            except ValueError:
                return None
        try:
            return int(value)
        except Exception:
            return None

    def _height(self, node: RBNode) -> int:
        if node == self.NIL:
            return 0
        return 1 + max(self._height(node.left), self._height(node.right))

    def _black_height_counts(self, node: RBNode, blacks: int, out: List[int]):
        if node == self.NIL:
            out.append(blacks + 1)
            return
        next_blacks = blacks + (1 if node.color == 'black' else 0)
        self._black_height_counts(node.left, next_blacks, out)
        self._black_height_counts(node.right, next_blacks, out)

    def _has_red_red_violation(self, node: RBNode) -> bool:
        if node == self.NIL:
            return False
        if node.color == 'red':
            if node.left != self.NIL and node.left.color == 'red':
                return True
            if node.right != self.NIL and node.right.color == 'red':
                return True
        return self._has_red_red_violation(node.left) or self._has_red_red_violation(node.right)

    def _properties(self) -> Dict:
        if self.root == self.NIL:
            return {
                'root_black': True,
                'no_red_red': True,
                'black_height_uniform': True
            }
        black_counts: List[int] = []
        self._black_height_counts(self.root, 0, black_counts)
        return {
            'root_black': self.root.color == 'black',
            'no_red_red': not self._has_red_red_violation(self.root),
            'black_height_uniform': len(set(black_counts)) <= 1
        }

    def _focus(self, node: RBNode) -> Optional[int]:
        if node is None or node == self.NIL:
            return None
        return node.value

    def _state(self, highlight: Any = None, visited: Optional[List[Any]] = None, found: Any = None, extra: Optional[Dict] = None) -> Dict:
        payload = self.to_dict()
        if highlight is not None:
            payload['highlight'] = highlight
        if visited is not None:
            payload['visited'] = visited
        if found is not None:
            payload['found'] = found
        payload['rb_properties'] = self._properties()
        payload['rb_stats'] = {
            'left_height': self._height(self.root.left) if self.root != self.NIL else 0,
            'right_height': self._height(self.root.right) if self.root != self.NIL else 0
        }
        if extra:
            payload.update(extra)
        return payload

    def _serialize(self, node: RBNode) -> Optional[Dict]:
        if node == self.NIL:
            return None
        return {
            'value': node.value,
            'color': node.color,
            'left': self._serialize(node.left),
            'right': self._serialize(node.right)
        }

    def to_dict(self) -> Dict:
        return {'tree': self._serialize(self.root)}

    def _left_rotate(self, x: RBNode):
        y = x.right
        if y == self.NIL:
            return
        x.right = y.left
        if y.left != self.NIL:
            y.left.parent = x
        y.parent = x.parent
        if x.parent == self.NIL:
            self.root = y
        elif x == x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y
        self.add_step(f"Left rotation at {x.value}", self._state(highlight=y.value))

    def _right_rotate(self, y: RBNode):
        x = y.left
        if x == self.NIL:
            return
        y.left = x.right
        if x.right != self.NIL:
            x.right.parent = y
        x.parent = y.parent
        if y.parent == self.NIL:
            self.root = x
        elif y == y.parent.left:
            y.parent.left = x
        else:
            y.parent.right = x
        x.right = y
        y.parent = x
        self.add_step(f"Right rotation at {y.value}", self._state(highlight=x.value))

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        v = self._coerce_value(value)
        if v is None:
            return {'success': False, 'message': 'Invalid value', 'steps': self.steps, 'state': self.to_dict()}

        node = RBNode(v, 'red')
        node.left = self.NIL
        node.right = self.NIL
        node.parent = self.NIL

        y = self.NIL
        x = self.root
        visited: List[Any] = []

        while x != self.NIL:
            y = x
            visited.append(x.value)
            self.add_step(f"Visiting {x.value}", self._state(highlight=x.value, visited=list(visited)))
            if node.value < x.value:
                x = x.left
            elif node.value > x.value:
                x = x.right
            else:
                self.add_step(f"Value {node.value} already exists", self._state(highlight=x.value, visited=list(visited)))
                return {'success': False, 'message': 'Value already exists', 'steps': self.steps, 'state': self.to_dict()}

        node.parent = y
        if y == self.NIL:
            self.root = node
        elif node.value < y.value:
            y.left = node
        else:
            y.right = node

        self.add_step(
            f"Inserted {node.value} as red node",
            self._state(
                highlight=node.value,
                visited=list(visited) + [node.value],
                found=node.value,
                extra={
                    'current_operation': {'type': 'insert', 'value': node.value},
                    'current_case': 'Insert: Initial placement',
                    'focus_nodes': {
                        'new_node': self._focus(node),
                        'parent': self._focus(node.parent),
                        'grandparent': self._focus(node.parent.parent if node.parent != self.NIL else self.NIL),
                        'uncle': None
                    }
                }
            )
        )
        self._insert_fixup(node, node.value)
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _insert_fixup(self, z: RBNode, inserted_value: int):
        while z.parent.color == 'red':
            if z.parent == z.parent.parent.left:
                y = z.parent.parent.right
                if y.color == 'red':
                    z.parent.color = 'black'
                    y.color = 'black'
                    z.parent.parent.color = 'red'
                    self.add_step(
                        "Case 1: Uncle red — recolor parent, uncle, grandparent",
                        self._state(
                            highlight=z.parent.parent.value,
                            extra={
                                'current_operation': {'type': 'insert', 'value': inserted_value},
                                'current_case': 'Case 1: Recolor',
                                'case_detail': 'Parent is red, uncle is red, rotate not required',
                                'focus_nodes': {
                                    'new_node': self._focus(z),
                                    'parent': self._focus(z.parent),
                                    'grandparent': self._focus(z.parent.parent),
                                    'uncle': self._focus(y)
                                }
                            }
                        )
                    )
                    z = z.parent.parent
                else:
                    if z == z.parent.right:
                        self.add_step(
                            "Case 2: Triangle shape — rotate parent left",
                            self._state(
                                highlight=z.parent.value,
                                extra={
                                    'current_operation': {'type': 'insert', 'value': inserted_value},
                                    'current_case': 'Case 2: Triangle shape',
                                    'case_detail': 'Parent is red, uncle is black, rotate parent left',
                                    'focus_nodes': {
                                        'new_node': self._focus(z),
                                        'parent': self._focus(z.parent),
                                        'grandparent': self._focus(z.parent.parent),
                                        'uncle': self._focus(y)
                                    }
                                }
                            )
                        )
                        z = z.parent
                        self._left_rotate(z)
                    z.parent.color = 'black'
                    z.parent.parent.color = 'red'
                    self.add_step(
                        "Case 3: Line shape — rotate grandparent right",
                        self._state(
                            highlight=z.parent.parent.value,
                            extra={
                                'current_operation': {'type': 'insert', 'value': inserted_value},
                                'current_case': 'Case 3: Line shape',
                                'case_detail': 'Parent is red, uncle is black, rotate grandparent right',
                                'focus_nodes': {
                                    'new_node': self._focus(z),
                                    'parent': self._focus(z.parent),
                                    'grandparent': self._focus(z.parent.parent),
                                    'uncle': self._focus(y)
                                }
                            }
                        )
                    )
                    self._right_rotate(z.parent.parent)
            else:
                y = z.parent.parent.left
                if y.color == 'red':
                    z.parent.color = 'black'
                    y.color = 'black'
                    z.parent.parent.color = 'red'
                    self.add_step(
                        "Case 1: Uncle red — recolor parent, uncle, grandparent",
                        self._state(
                            highlight=z.parent.parent.value,
                            extra={
                                'current_operation': {'type': 'insert', 'value': inserted_value},
                                'current_case': 'Case 1: Recolor',
                                'case_detail': 'Parent is red, uncle is red, rotate not required',
                                'focus_nodes': {
                                    'new_node': self._focus(z),
                                    'parent': self._focus(z.parent),
                                    'grandparent': self._focus(z.parent.parent),
                                    'uncle': self._focus(y)
                                }
                            }
                        )
                    )
                    z = z.parent.parent
                else:
                    if z == z.parent.left:
                        self.add_step(
                            "Case 2: Triangle shape — rotate parent right",
                            self._state(
                                highlight=z.parent.value,
                                extra={
                                    'current_operation': {'type': 'insert', 'value': inserted_value},
                                    'current_case': 'Case 2: Triangle shape',
                                    'case_detail': 'Parent is red, uncle is black, rotate parent right',
                                    'focus_nodes': {
                                        'new_node': self._focus(z),
                                        'parent': self._focus(z.parent),
                                        'grandparent': self._focus(z.parent.parent),
                                        'uncle': self._focus(y)
                                    }
                                }
                            )
                        )
                        z = z.parent
                        self._right_rotate(z)
                    z.parent.color = 'black'
                    z.parent.parent.color = 'red'
                    self.add_step(
                        "Case 3: Line shape — rotate grandparent left",
                        self._state(
                            highlight=z.parent.parent.value,
                            extra={
                                'current_operation': {'type': 'insert', 'value': inserted_value},
                                'current_case': 'Case 3: Line shape',
                                'case_detail': 'Parent is red, uncle is black, rotate grandparent left',
                                'focus_nodes': {
                                    'new_node': self._focus(z),
                                    'parent': self._focus(z.parent),
                                    'grandparent': self._focus(z.parent.parent),
                                    'uncle': self._focus(y)
                                }
                            }
                        )
                    )
                    self._left_rotate(z.parent.parent)
        self.root.color = 'black'
        if self.root != self.NIL:
            self.add_step(
                "Ensured root is black",
                self._state(
                    highlight=self.root.value,
                    extra={
                        'current_operation': {'type': 'insert', 'value': inserted_value},
                        'current_case': 'Fix complete',
                        'case_detail': 'Red-Black properties restored',
                        'focus_nodes': {
                            'new_node': self._focus(z),
                            'parent': self._focus(z.parent),
                            'grandparent': self._focus(z.parent.parent if z.parent != self.NIL else self.NIL),
                            'uncle': None
                        }
                    }
                )
            )

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        target = self._coerce_value(value)
        if target is None:
            return {'success': False, 'message': 'Invalid value', 'steps': self.steps, 'state': self.to_dict()}

        current = self.root
        visited: List[Any] = []
        while current != self.NIL:
            visited.append(current.value)
            self.add_step(f"Visiting {current.value}", self._state(highlight=current.value, visited=list(visited)))
            if target == current.value:
                self.add_step(f"Found {target}", self._state(highlight=current.value, visited=list(visited), found=current.value))
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
            if target < current.value:
                current = current.left
            else:
                current = current.right

        self.add_step(f"Value {target} not found", self._state(visited=list(visited)))
        return {'success': False, 'message': 'Value not found', 'steps': self.steps, 'state': self.to_dict()}

    def _minimum(self, node: RBNode) -> RBNode:
        current = node
        while current.left != self.NIL:
            current = current.left
        return current

    def _transplant(self, u: RBNode, v: RBNode):
        if u.parent == self.NIL:
            self.root = v
        elif u == u.parent.left:
            u.parent.left = v
        else:
            u.parent.right = v
        v.parent = u.parent

    def _find_node(self, value: int, visited: Optional[List[Any]] = None) -> RBNode:
        current = self.root
        while current != self.NIL:
            if visited is not None:
                visited.append(current.value)
                self.add_step(f"Visiting {current.value}", self._state(highlight=current.value, visited=list(visited)))
            if value == current.value:
                return current
            if value < current.value:
                current = current.left
            else:
                current = current.right
        return self.NIL

    def delete(self, value: Any) -> Dict:
        self.clear_steps()
        target = self._coerce_value(value)
        if target is None:
            return {'success': False, 'message': 'Invalid value', 'steps': self.steps, 'state': self.to_dict()}

        visited: List[Any] = []
        z = self._find_node(target, visited)
        if z == self.NIL:
            self.add_step(f"Value {target} not found", self._state(visited=list(visited)))
            return {'success': False, 'message': 'Value not found', 'steps': self.steps, 'state': self.to_dict()}

        y = z
        y_original_color = y.color
        if z.left == self.NIL:
            x = z.right
            self._transplant(z, z.right)
        elif z.right == self.NIL:
            x = z.left
            self._transplant(z, z.left)
        else:
            y = self._minimum(z.right)
            y_original_color = y.color
            x = y.right
            self.add_step(f"Replaced {z.value} with successor {y.value}", self._state(highlight=z.value, found=z.value, visited=list(visited)))
            if y.parent == z:
                x.parent = y
            else:
                self._transplant(y, y.right)
                y.right = z.right
                y.right.parent = y
            self._transplant(z, y)
            y.left = z.left
            y.left.parent = y
            y.color = z.color

        self.add_step(
            f"Deleting node {target}",
            self._state(
                highlight=target,
                found=target,
                visited=list(visited),
                extra={
                    'current_operation': {'type': 'delete', 'value': target},
                    'current_case': 'Delete operation'
                }
            )
        )
        if y_original_color == 'black':
            self._delete_fixup(x)
        if self.root != self.NIL:
            self.root.color = 'black'
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _delete_fixup(self, x: RBNode):
        while x != self.root and x.color == 'black':
            if x == x.parent.left:
                w = x.parent.right
                if w.color == 'red':
                    w.color = 'black'
                    x.parent.color = 'red'
                    self._left_rotate(x.parent)
                    w = x.parent.right
                if w.left.color == 'black' and w.right.color == 'black':
                    w.color = 'red'
                    if x.parent != self.NIL:
                        self.add_step("Recoloring sibling to red", self._state(highlight=x.parent.value))
                    x = x.parent
                else:
                    if w.right.color == 'black':
                        w.left.color = 'black'
                        w.color = 'red'
                        self._right_rotate(w)
                        w = x.parent.right
                    w.color = x.parent.color
                    x.parent.color = 'black'
                    w.right.color = 'black'
                    self._left_rotate(x.parent)
                    x = self.root
            else:
                w = x.parent.left
                if w.color == 'red':
                    w.color = 'black'
                    x.parent.color = 'red'
                    self._right_rotate(x.parent)
                    w = x.parent.left
                if w.right.color == 'black' and w.left.color == 'black':
                    w.color = 'red'
                    if x.parent != self.NIL:
                        self.add_step("Recoloring sibling to red", self._state(highlight=x.parent.value))
                    x = x.parent
                else:
                    if w.left.color == 'black':
                        w.right.color = 'black'
                        w.color = 'red'
                        self._left_rotate(w)
                        w = x.parent.left
                    w.color = x.parent.color
                    x.parent.color = 'black'
                    w.left.color = 'black'
                    self._right_rotate(x.parent)
                    x = self.root
        x.color = 'black'
        if x != self.NIL:
            self.add_step("Rebalanced after deletion", self._state(highlight=x.value))
