from .base import DataStructureBase
from typing import Dict, Any, Optional
import random

class Node:
    def __init__(self, value: Any):
        self.value = value
        self.next = None

class DoublyNode:
    def __init__(self, value: Any):
        self.value = value
        self.next = None
        self.prev = None

class SinglyLinkedList(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.head = None
        self.size = 0

    def insert(self, value: Any, position: Optional[int] = None) -> Dict:
        self.clear_steps()
        new_node = Node(value)

        if position is None or position == 0:
            new_node.next = self.head
            self.head = new_node
            self.add_step(f"Inserting {value} at front", self.to_dict())
        else:
            current = self.head
            idx = 0
            while current and idx < position - 1:
                self.add_step(f"Traversing to position {position}", self.to_dict())
                current = current.next
                idx += 1

            if current:
                new_node.next = current.next
                current.next = new_node
                self.add_step(f"Inserted {value} at position {position}", self.to_dict())

        self.size += 1
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any) -> Dict:
        self.clear_steps()

        if not self.head:
            return {'success': False, 'message': 'List is empty', 'steps': self.steps}

        if self.head.value == value:
            self.head = self.head.next
            self.size -= 1
            self.add_step(f"Deleted {value} from front", self.to_dict())
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        current = self.head
        while current.next:
            self.add_step(f"Searching for {value}", self.to_dict())
            if current.next.value == value:
                current.next = current.next.next
                self.size -= 1
                self.add_step(f"Deleted {value}", self.to_dict())
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
            current = current.next

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        current = self.head
        idx = 0
        visited = []

        while current:
            visited.append(idx)
            self.add_step(f"Checking node at index {idx}", {**self.to_dict(), 'visited': visited})
            if current.value == value:
                self.add_step(f"Found {value} at index {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}
            current = current.next
            idx += 1

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def to_dict(self) -> Dict:
        nodes = []
        current = self.head
        while current:
            nodes.append(current.value)
            current = current.next
        return {'nodes': nodes, 'size': self.size}

    def reverse(self) -> Dict:
        self.clear_steps()
        if not self.head or not self.head.next:
            return {'success': False, 'message': 'List too short to reverse', 'steps': self.steps}
        
        prev = None
        current = self.head
        idx = 0
        original_state = self.to_dict()
        reversed_conns = []
        node0_flipped = False
        
        self.add_step("Starting reverse operation", {**original_state, 'pointers': {}, 'subPhase': 'initial', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
        
        while current:
            next_node = current.next
            pointers = {'curr': idx}
            if prev is not None: pointers['prev'] = idx - 1
            if next_node is not None: pointers['next'] = idx + 1

            # Step 1: Spotlight
            self.add_step(f"Spotlight node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'spotlight', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
            
            # Step 2: Redirect
            self.add_step(f"Redirect node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'redirect', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})

            # Step 3: Flip
            current.next = prev
            if idx == 0:
                node0_flipped = True
            else:
                reversed_conns.append(idx - 1)
            
            self.add_step(f"Flip arrow at node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'flip', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
            
            # Step 4: Step forward
            prev = current
            current = next_node
            idx += 1
            
            if current:
                next_pointers = {'curr': idx, 'prev': idx - 1}
                if current.next is not None: next_pointers['next'] = idx + 1
                self.add_step(f"Pointers step forward", {
                    **original_state, 
                    'pointers': next_pointers, 
                    'subPhase': 'step', 
                    'reversed_conns': list(reversed_conns),
                    'node0_flipped': node0_flipped,
                    'head_pos': 0
                })
        
        self.head = prev
        self.add_step("Reverse complete", {**self.to_dict(), 'pointers': {}, 'subPhase': 'complete', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': idx - 1})
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def get_middle(self) -> Dict:
        self.clear_steps()
        if not self.head:
            return {'success': False, 'message': 'List is empty', 'steps': self.steps}
        
        slow = self.head
        fast = self.head
        slow_idx = 0
        fast_idx = 0
        self.add_step("Starting middle search with two pointers", {**self.to_dict(), 'visited': [0]})
        
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            slow_idx += 1
            fast_idx += 2 if fast else 1
            visited = list(range(fast_idx + 1))
            self.add_step(f"Slow pointer at index {slow_idx}, fast at {fast_idx}", {**self.to_dict(), 'visited': visited, 'highlight': slow_idx})
        
        self.add_step(f"Middle found at index {slow_idx}: {slow.value}", {**self.to_dict(), 'found': slow_idx})
        return {'success': True, 'middle_index': slow_idx, 'middle_value': slow.value, 'steps': self.steps, 'state': self.to_dict()}

    def detect_cycle(self) -> Dict:
        self.clear_steps()
        if not self.head:
            return {'success': False, 'message': 'List is empty', 'steps': self.steps}
        
        slow = self.head
        fast = self.head
        slow_idx = 0
        fast_idx = 0
        self.add_step("Starting cycle detection", {**self.to_dict(), 'visited': [0]})
        max_iterations = self.size * 2
        iteration = 0
        
        while fast and fast.next and iteration < max_iterations:
            slow = slow.next
            fast = fast.next.next if fast.next else None
            slow_idx += 1
            fast_idx += 2 if fast and fast.next else 1
            iteration += 1
            visited = list(range(min(fast_idx + 1, self.size)))
            self.add_step(f"Checking: slow at {slow_idx}, fast at {fast_idx}", {**self.to_dict(), 'visited': visited, 'highlight': slow_idx})
            
            if slow == fast:
                self.add_step("Cycle detected!", {**self.to_dict(), 'found': slow_idx})
                return {'success': True, 'has_cycle': True, 'steps': self.steps}
        
        self.add_step("No cycle found", self.to_dict())
        return {'success': True, 'has_cycle': False, 'steps': self.steps}

    def remove_duplicates(self) -> Dict:
        self.clear_steps()
        if not self.head:
            return {'success': False, 'message': 'List is empty', 'steps': self.steps}
        
        seen = set()
        current = self.head
        prev = None
        idx = 0
        removed_count = 0
        self.add_step("Starting duplicate removal", self.to_dict())
        
        while current:
            self.add_step(f"Checking node at index {idx}: {current.value}", {**self.to_dict(), 'highlight': idx})
            if current.value in seen:
                self.add_step(f"Duplicate found: {current.value}", {**self.to_dict(), 'deleting': idx})
                if prev:
                    prev.next = current.next
                else:
                    self.head = current.next
                self.size -= 1
                removed_count += 1
                current = current.next
            else:
                seen.add(current.value)
                prev = current
                current = current.next
                idx += 1
        
        self.add_step(f"Removed {removed_count} duplicates", self.to_dict())
        return {'success': True, 'removed_count': removed_count, 'steps': self.steps, 'state': self.to_dict()}


class DoublyLinkedList(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.head = None
        self.tail = None
        self.size = 0

    def insert(self, value: Any, position: Optional[int] = None) -> Dict:
        self.clear_steps()
        new_node = DoublyNode(value)

        if not self.head:
            self.head = self.tail = new_node
            self.add_step(f"Inserting {value} as first node", self.to_dict())
        elif position is None or position == 0:
            new_node.next = self.head
            self.head.prev = new_node
            self.head = new_node
            self.add_step(f"Inserting {value} at front", self.to_dict())
        else:
            new_node.next = None
            new_node.prev = self.tail
            self.tail.next = new_node
            self.tail = new_node
            self.add_step(f"Inserting {value} at back", self.to_dict())

        self.size += 1
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any) -> Dict:
        self.clear_steps()
        if not self.head:
            return {'success': False, 'message': 'List is empty', 'steps': self.steps}

        current = self.head
        while current:
            self.add_step(f"Searching for {value}", self.to_dict())
            if current.value == value:
                if current.prev:
                    current.prev.next = current.next
                else:
                    self.head = current.next

                if current.next:
                    current.next.prev = current.prev
                else:
                    self.tail = current.prev

                self.size -= 1
                self.add_step(f"Deleted {value}", self.to_dict())
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
            current = current.next

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        current = self.head
        idx = 0
        visited = []

        while current:
            visited.append(idx)
            self.add_step(f"Checking node at index {idx}", {**self.to_dict(), 'visited': visited})
            if current.value == value:
                self.add_step(f"Found {value} at index {idx}", {**self.to_dict(), 'found': idx, 'visited': visited})
                return {'success': True, 'found': idx, 'steps': self.steps, 'state': self.to_dict()}
            current = current.next
            idx += 1

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def to_dict(self) -> Dict:
        nodes = []
        current = self.head
        while current:
            nodes.append(current.value)
            current = current.next
        return {'nodes': nodes, 'size': self.size}

    def reverse(self) -> Dict:
        self.clear_steps()
        if not self.head or not self.head.next:
            return {'success': False, 'message': 'List too short to reverse', 'steps': self.steps}
        
        current = self.head
        temp = None
        idx = 0
        original_state = self.to_dict()
        reversed_conns = []
        node0_flipped = False
        
        self.add_step("Starting reverse operation", {**original_state, 'pointers': {}, 'subPhase': 'initial', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
        
        while current:
            pointers = {'curr': idx}
            if current.prev is not None: pointers['prev'] = idx - 1
            if current.next is not None: pointers['next'] = idx + 1
            
            self.add_step(f"Spotlight node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'spotlight', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
            self.add_step(f"Redirect node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'redirect', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})

            temp = current.prev
            current.prev = current.next
            current.next = temp
            
            if idx == 0:
                node0_flipped = True
            else:
                reversed_conns.append(idx - 1)

            self.add_step(f"Flip arrow at node {idx}", {**original_state, 'pointers': pointers, 'subPhase': 'flip', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
            
            current = current.prev 
            idx += 1
            
            if current:
                next_pointers = {'curr': idx, 'prev': idx - 1}
                if current.next is not None: next_pointers['next'] = idx + 1
                self.add_step(f"Pointers step forward", {**original_state, 'pointers': next_pointers, 'subPhase': 'step', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': 0})
        
        if temp:
            self.tail = self.head
            self.head = temp.prev
        
        self.add_step("Reverse complete", {**self.to_dict(), 'pointers': {}, 'subPhase': 'complete', 'reversed_conns': list(reversed_conns), 'node0_flipped': node0_flipped, 'head_pos': idx - 1})
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}