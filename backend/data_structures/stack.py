from .base import DataStructureBase
from typing import Dict, Any

class Stack(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.items = []

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        self.items.append(value)
        self.add_step(f"Pushed {value} onto stack", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any = None) -> Dict:
        self.clear_steps()
        if not self.items:
            return {'success': False, 'message': 'Stack is empty', 'steps': self.steps}

        removed = self.items.pop()
        self.add_step(f"Popped {removed} from stack", self.to_dict())
        return {'success': True, 'value': removed, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        visited = []

        for idx in range(len(self.items) - 1, -1, -1):
            visited.append(idx)
            self.add_step(f"Checking position {idx}", {**self.to_dict(), 'visited': visited})
            if self.items[idx] == value:
                self.add_step(f"Found {value} at position {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def to_dict(self) -> Dict:
        return {'items': self.items, 'size': len(self.items)}

    def reverse(self) -> Dict:
        self.clear_steps()
        if not self.items or len(self.items) < 2:
            return {'success': False, 'message': 'Stack too short to reverse', 'steps': self.steps}
            
        self.add_step("Starting reverse operation", self.to_dict())
        self.items.reverse()
        self.add_step("Reversed stack", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
