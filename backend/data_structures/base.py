from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DataStructureBase(ABC):
    def __init__(self):
        self.steps = []
        self.step_count = 0

    @abstractmethod
    def insert(self, value: Any, position: Any = None) -> Dict:
        pass

    @abstractmethod
    def delete(self, value: Any) -> Dict:
        pass

    @abstractmethod
    def search(self, value: Any) -> Dict:
        pass

    @abstractmethod
    def to_dict(self) -> Dict:
        pass

    def add_step(self, description: str, state: Dict):
        self.step_count += 1
        self.steps.append({
            'step': self.step_count,
            'description': description,
            'state': state
        })

    def clear_steps(self):
        self.steps = []
        self.step_count = 0
