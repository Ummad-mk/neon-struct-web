from .base import DataStructureBase
from typing import Dict, Any, Optional
import heapq

class PriorityQueue(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.heap = []
        self.counter = 0

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        priority = position if position is not None else value
        if isinstance(priority, str) and priority.strip().lstrip('-').isdigit():
            priority = int(priority)
        entry = (priority, self.counter, value)
        heapq.heappush(self.heap, entry)
        self.counter += 1
        self.add_step(f"Enqueued {value} with priority {priority}", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any = None) -> Dict:
        self.clear_steps()
        if not self.heap:
            return {'success': False, 'message': 'Priority queue is empty', 'steps': self.steps}

        if value is None:
            priority, _, removed = heapq.heappop(self.heap)
            self.add_step(f"Dequeued {removed} with priority {priority}", self.to_dict())
            return {'success': True, 'value': removed, 'priority': priority, 'steps': self.steps, 'state': self.to_dict()}

        index = None
        for i, item in enumerate(self.heap):
            if item[2] == value:
                index = i
                break
        if index is None:
            return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

        priority, _, removed = self.heap.pop(index)
        heapq.heapify(self.heap)
        self.add_step(f"Removed {removed} with priority {priority}", self.to_dict())
        return {'success': True, 'value': removed, 'priority': priority, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        visited = []
        items = self._sorted_items()

        for idx, item in enumerate(items):
            visited.append(idx)
            self.add_step(f"Checking position {idx}", {**self.to_dict(), 'visited': visited})
            if item['value'] == value:
                self.add_step(f"Found {value} at position {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def peek(self) -> Dict:
        self.clear_steps()
        if not self.heap:
            return {'success': False, 'message': 'Priority queue is empty', 'steps': self.steps}
        priority, _, value = self.heap[0]
        self.add_step(f"Peeked {value} with priority {priority}", self.to_dict())
        return {'success': True, 'value': value, 'priority': priority, 'steps': self.steps, 'state': self.to_dict()}

    def change_priority(self, value: Any, priority: Any) -> Dict:
        self.clear_steps()
        if isinstance(priority, str) and priority.strip().lstrip('-').isdigit():
            priority = int(priority)
        index = None
        for i, item in enumerate(self.heap):
            if item[2] == value:
                index = i
                break
        if index is None:
            return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

        _, order, stored_value = self.heap[index]
        self.heap[index] = (priority, order, stored_value)
        heapq.heapify(self.heap)
        self.add_step(f"Changed priority of {stored_value} to {priority}", self.to_dict())
        return {'success': True, 'value': stored_value, 'priority': priority, 'steps': self.steps, 'state': self.to_dict()}

    def _sorted_items(self):
        return [{'value': value, 'priority': priority} for priority, _, value in sorted(self.heap)]

    def to_dict(self) -> Dict:
        return {'items': self._sorted_items(), 'size': len(self.heap)}
