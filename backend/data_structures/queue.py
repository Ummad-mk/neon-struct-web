from .base import DataStructureBase
from typing import Dict, Any
from collections import deque as Deque

class Queue(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.items = []

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        self.items.append(value)
        self.add_step(f"Enqueued {value} at rear", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any = None) -> Dict:
        self.clear_steps()
        if not self.items:
            return {'success': False, 'message': 'Queue is empty', 'steps': self.steps}

        removed = self.items.pop(0)
        self.add_step(f"Dequeued {removed} from front", self.to_dict())
        return {'success': True, 'value': removed, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        visited = []

        for idx, item in enumerate(self.items):
            visited.append(idx)
            self.add_step(f"Checking position {idx}", {**self.to_dict(), 'visited': visited})
            if item == value:
                self.add_step(f"Found {value} at position {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def to_dict(self) -> Dict:
        return {'items': self.items, 'size': len(self.items)}

    def reverse(self) -> Dict:
        self.clear_steps()
        if not self.items or len(self.items) < 2:
            return {'success': False, 'message': 'Queue too short to reverse', 'steps': self.steps}
            
        self.add_step("Starting reverse operation", self.to_dict())
        self.items.reverse()
        self.add_step("Reversed queue", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

class DoubleEndedQueue(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.items = Deque()

    def insert(self, value: Any, position: str = 'rear') -> Dict:
        self.clear_steps()
        if position == 'front':
            self.items.appendleft(value)
            self.add_step(f"Inserted {value} at front", self.to_dict())
        else:
            self.items.append(value)
            self.add_step(f"Inserted {value} at rear", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any = None) -> Dict:
        self.clear_steps()
        if not self.items:
            return {'success': False, 'message': 'Deque is empty', 'steps': self.steps}

        # If value is a string position ('front' or 'rear'), use it as position
        # Otherwise default to removing from front
        position = 'front'
        if isinstance(value, str) and value in ('front', 'rear'):
            position = value

        if position == 'front':
            removed = self.items.popleft()
            self.add_step(f"Removed {removed} from front", self.to_dict())
        else:
            removed = self.items.pop()
            self.add_step(f"Removed {removed} from rear", self.to_dict())

        return {'success': True, 'value': removed, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        visited = []
        items_list = list(self.items)

        for idx, item in enumerate(items_list):
            visited.append(idx)
            self.add_step(f"Checking position {idx}", {**self.to_dict(), 'visited': visited})
            if item == value:
                self.add_step(f"Found {value} at position {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def to_dict(self) -> Dict:
        return {'items': list(self.items), 'size': len(self.items)}

    def reverse(self) -> Dict:
        self.clear_steps()
        if not self.items or len(self.items) < 2:
            return {'success': False, 'message': 'Deque too short to reverse', 'steps': self.steps}
            
        self.add_step("Starting reverse operation", self.to_dict())
        self.items.reverse()
        self.add_step("Reversed deque", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
