from .base import DataStructureBase
from typing import Dict, Any, List, Tuple


class SegmentTree(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.arr: List[int] = []
        self.n: int = 0
        self.size: int = 0
        self.tree: List[int] = []
        self.ranges: List[Tuple[int, int]] = []
        self.height: int = 0
        self.op: str = 'sum'  # 'sum' | 'min' | 'max'

    # ----- helpers -----
    def _neutral(self) -> int:
        if self.op == 'sum':
            return 0
        if self.op == 'min':
            return 10**9
        return -10**9

    def _combine(self, a: int, b: int) -> int:
        if self.op == 'sum':
            return a + b
        if self.op == 'min':
            return min(a, b)
        return max(a, b)

    def _build_ranges(self, idx: int, l: int, r: int):
        if idx >= self.size:
            return
        self.ranges[idx] = (l, r)
        if l == r:
            return
        m = (l + r) // 2
        self._build_ranges(idx * 2, l, m)
        self._build_ranges(idx * 2 + 1, m + 1, r)

    def _build_tree(self, idx: int, l: int, r: int):
        if l == r:
            self.tree[idx] = self.arr[l]
            self.add_step(f"Leaf [{l}] ← {self.arr[l]}", {**self.to_dict(), 'highlight_nodes': [idx], 'active_zone': 'segment'})
            return
        m = (l + r) // 2
        self._build_tree(idx * 2, l, m)
        self._build_tree(idx * 2 + 1, m + 1, r)
        self.tree[idx] = self._combine(self.tree[idx * 2], self.tree[idx * 2 + 1])
        self.add_step(f"Build node [{l}..{r}] ← combine", {**self.to_dict(), 'highlight_nodes': [idx], 'active_zone': 'segment'})

    def _query(self, idx: int, l: int, r: int, ql: int, qr: int, visited: List[int]) -> int:
        # coverage: none
        if qr < l or ql > r:
            self.add_step(f"No overlap for [{l}..{r}]", {**self.to_dict(), 'highlight_nodes': [idx], 'coverage': 'none', 'query_range': [ql, qr], 'active_zone': 'segment'})
            return self._neutral()
        # coverage: full
        if ql <= l and r <= qr:
            self.add_step(f"Full cover [{l}..{r}] → {self.tree[idx]}", {**self.to_dict(), 'highlight_nodes': [idx], 'coverage': 'full', 'query_range': [ql, qr], 'active_zone': 'segment'})
            visited.append(idx)
            return self.tree[idx]
        # coverage: partial
        self.add_step(f"Partial overlap at [{l}..{r}]", {**self.to_dict(), 'highlight_nodes': [idx], 'coverage': 'partial', 'query_range': [ql, qr], 'active_zone': 'segment'})
        m = (l + r) // 2
        left = self._query(idx * 2, l, m, ql, qr, visited)
        right = self._query(idx * 2 + 1, m + 1, r, ql, qr, visited)
        return self._combine(left, right)

    def _update(self, idx: int, l: int, r: int, pos: int, val: int, path: List[int]):
        path.append(idx)
        if l == r:
            self.tree[idx] = val
            self.arr[pos] = val
            self.add_step(f"Update leaf [{pos}] → {val}", {**self.to_dict(), 'highlight_nodes': list(path), 'active_zone': 'segment'})
            return
        m = (l + r) // 2
        if pos <= m:
            self._update(idx * 2, l, m, pos, val, path)
        else:
            self._update(idx * 2 + 1, m + 1, r, pos, val, path)
        self.tree[idx] = self._combine(self.tree[idx * 2], self.tree[idx * 2 + 1])
        self.add_step(f"Recompute node [{l}..{r}] → {self.tree[idx]}", {**self.to_dict(), 'highlight_nodes': list(path), 'active_zone': 'segment'})

    # ----- public ops -----
    def set_op(self, op: str) -> Dict:
        op = (op or 'sum').strip().lower()
        if op not in ['sum', 'min', 'max']:
            return {'success': False, 'message': 'Invalid op', 'steps': self.steps, 'state': self.to_dict()}
        self.op = op
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def build(self, array: List[int]) -> Dict:
        self.clear_steps()
        try:
            self.arr = [int(x) for x in array]
        except Exception:
            return {'success': False, 'message': 'Array must be integers'}
        self.n = len(self.arr)
        if self.n == 0:
            self.size = 0
            self.tree = []
            self.ranges = []
            self.height = 0
            self.add_step("Empty array provided", {**self.to_dict(), 'active_zone': 'segment'})
            return {'success': False, 'message': 'Array cannot be empty', 'steps': self.steps, 'state': self.to_dict()}
        self.size = 1
        while self.size < self.n * 2:
            self.size *= 2
        self.tree = [self._neutral() for _ in range(self.size)]
        self.ranges = [(0, 0) for _ in range(self.size)]
        self.height = 0
        t = 1
        while t < self.n:
            self.height += 1
            t *= 2
        self.add_step("Start build", {**self.to_dict(), 'active_zone': 'segment'})
        self._build_ranges(1, 0, self.n - 1)
        self._build_tree(1, 0, self.n - 1)
        self.add_step("Build complete", {**self.to_dict(), 'active_zone': 'segment'})
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def range_query(self, l: int, r: int, op: str = None) -> Dict:
        self.clear_steps()
        if op:
            self.op = op
        l = max(0, int(l)); r = min(self.n - 1, int(r))
        if l > r or self.n == 0:
            return {'success': False, 'message': 'Invalid range', 'steps': self.steps, 'state': self.to_dict()}
        visited: List[int] = []
        self.add_step(f"Query [{l}..{r}] type={self.op}", {**self.to_dict(), 'query_range': [l, r], 'active_zone': 'segment'})
        res = self._query(1, 0, self.n - 1, l, r, visited)
        self.add_step(f"Result = {res}", {**self.to_dict(), 'query_range': [l, r], 'active_zone': 'segment'})
        return {'success': True, 'result': res, 'steps': self.steps, 'state': self.to_dict()}

    def point_update(self, idx: int, val: int) -> Dict:
        self.clear_steps()
        idx = int(idx); val = int(val)
        if idx < 0 or idx >= self.n:
            return {'success': False, 'message': 'Index out of bounds', 'steps': self.steps, 'state': self.to_dict()}
        path: List[int] = []
        self.add_step(f"Update idx={idx} → {val}", {**self.to_dict(), 'active_zone': 'segment'})
        self._update(1, 0, self.n - 1, idx, val, path)
        self.add_step("Update complete", {**self.to_dict(), 'active_zone': 'segment'})
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def add_random(self, count: int = 8) -> Dict:
        import random
        arr = [random.randint(1, 10) for _ in range(count)]
        return self.build(arr)

    # Compatibility with base interface
    def insert(self, value: Any, position: Any = None) -> Dict:
        if isinstance(value, list):
            return self.build(value)
        return {'success': False, 'message': 'Use build(array) for segment tree', 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        if isinstance(value, dict):
            l = value.get('l', 0)
            r = value.get('r', 0)
            op = value.get('op', self.op)
            return self.range_query(l, r, op)
        return {'success': False, 'message': 'Use range_query(l, r, op) for segment tree', 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any) -> Dict:
        if isinstance(value, dict):
            idx = value.get('idx')
            val = value.get('val')
            if idx is None or val is None:
                return {'success': False, 'message': 'delete expects {idx, val} for segment tree', 'steps': self.steps, 'state': self.to_dict()}
            return self.point_update(idx, val)
        return {'success': False, 'message': 'Use point_update(idx, val) for segment tree', 'steps': self.steps, 'state': self.to_dict()}

    def to_dict(self) -> Dict:
        return {
            'array': self.arr,
            'tree': self.tree,
            'ranges': self.ranges,
            'n': self.n,
            'size': self.size,
            'height': self.height,
            'op': self.op
        }
