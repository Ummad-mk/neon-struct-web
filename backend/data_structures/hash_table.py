from .base import DataStructureBase
from typing import Dict, Any

class HashTable(DataStructureBase):
    def __init__(self, size=7):
        super().__init__()
        self.size = size
        self.mode = 'linear'
        self.table = [None for _ in range(self.size)]
        self.count = 0
        self.deleted_marker = '__DELETED__'

    def get_hash(self, key: int, size: int = None) -> int:
        mod_size = size if size is not None else self.size
        if mod_size <= 0:
            return 0
        return key % mod_size

    def get_secondary_hash(self, key: int) -> int:
        if self.size <= 1:
            return 1
        return 1 + (key % (self.size - 1))

    def _probe_index(self, key: int, i: int) -> int:
        base = self.get_hash(key)
        if self.mode == 'quadratic':
            return (base + (i * i)) % self.size
        if self.mode == 'double':
            step = self.get_secondary_hash(key)
            return (base + i * step) % self.size
        return (base + i) % self.size

    def _hash_formula(self) -> str:
        if self.mode == 'quadratic':
            return 'h(k, i) = (k + i²) mod m'
        if self.mode == 'double':
            return 'h(k, i) = (h1(k) + i·h2(k)) mod m'
        return 'h(k, i) = (k + i) mod m'

    def _mode_label(self) -> str:
        if self.mode == 'quadratic':
            return 'Quadratic Probing'
        if self.mode == 'double':
            return 'Double Hashing'
        return 'Linear Probing'

    def _build_state(self, extra: Dict = None) -> Dict:
        base = self.to_dict()
        if extra:
            base.update(extra)
        return base

    def _insert_without_steps(self, value: int) -> bool:
        first_deleted = None
        for i in range(self.size):
            idx = self._probe_index(value, i)
            slot = self.table[idx]
            if slot == value:
                return True
            if slot == self.deleted_marker and first_deleted is None:
                first_deleted = idx
                continue
            if slot is None:
                target = first_deleted if first_deleted is not None else idx
                self.table[target] = value
                self.count += 1
                return True
        if first_deleted is not None:
            self.table[first_deleted] = value
            self.count += 1
            return True
        return False

    def _rehash_entries(self):
        values = [v for v in self.table if isinstance(v, int)]
        self.table = [None for _ in range(self.size)]
        self.count = 0
        for v in values:
            self._insert_without_steps(v)

    def set_mode(self, mode: str) -> Dict:
        requested = (mode or 'linear').strip().lower()
        if requested not in ['linear', 'quadratic', 'double']:
            return {
                'success': False,
                'message': 'Invalid mode. Use linear, quadratic, or double',
                'steps': self.steps,
                'state': self.to_dict()
            }
        self.clear_steps()
        self.add_step(
            f"Switching collision mode to {requested}",
            self._build_state({'active_zone': 'funnel'})
        )
        self.mode = requested
        self._rehash_entries()
        self.add_step(
            f"Rehashed table with {self._mode_label()}",
            self._build_state({'active_zone': 'bucket'})
        )
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def _next_slot_label(self, key: int, i: int, idx: int) -> str:
        if self.mode == 'double':
            step = self.get_secondary_hash(key)
            return f"Probe {i}: ({key % self.size} + {i}*{step}) % {self.size} = {idx}"
        if self.mode == 'quadratic':
            return f"Probe {i}: ({key % self.size} + {i}²) % {self.size} = {idx}"
        return f"Probe {i}: ({key % self.size} + {i}) % {self.size} = {idx}"

    def _generate_memory_map(self):
        memory_map = []
        for i in range(self.size):
            slot = self.table[i]
            if isinstance(slot, int):
                memory_map.append({
                    'index': i,
                    'key': str(slot),
                    'value_hash': f"0x{slot:04X}",
                    'status': 'Occupied'
                })
            elif slot == self.deleted_marker:
                memory_map.append({
                    'index': i,
                    'key': '--',
                    'value_hash': 'null',
                    'status': 'Deleted'
                })
            else:
                memory_map.append({
                    'index': i,
                    'key': '--',
                    'value_hash': 'null',
                    'status': 'Empty'
                })
        return memory_map

    def _get_load_factor(self):
        return round(self.count / self.size, 2)

    def insert(self, value: int, position: Any = None) -> Dict:
        try:
            val = int(value)
        except ValueError:
            return {'success': False, 'message': 'Hash Table keys must be integers', 'steps': self.steps}

        self.clear_steps()
        base_bucket = self.get_hash(val)
        first_deleted = None

        self.add_step(
            f"Input key {val}",
            self._build_state({'active_zone': 'input', 'current_key': val})
        )
        self.add_step(
            f"Base hash({val}) = {val} % {self.size} = {base_bucket}",
            self._build_state({
                'active_zone': 'funnel',
                'current_key': val,
                'funnel_math': self._hash_formula(),
                'target_bucket': base_bucket
            })
        )

        for i in range(self.size):
            idx = self._probe_index(val, i)
            slot = self.table[idx]
            self.add_step(
                self._next_slot_label(val, i, idx),
                self._build_state({
                    'active_zone': 'bucket',
                    'highlight_bucket': idx,
                    'current_key': val,
                    'target_bucket': idx
                })
            )
            if slot == val:
                self.add_step(
                    f"Key {val} already exists at index {idx}",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': idx,
                        'current_key': val,
                        'target_bucket': idx,
                        'found_chain_index': 0
                    })
                )
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
            if slot == self.deleted_marker and first_deleted is None:
                first_deleted = idx
                continue
            if slot is None:
                target = first_deleted if first_deleted is not None else idx
                self.table[target] = val
                self.count += 1
                self.add_step(
                    f"Inserted {val} at index {target}",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': target,
                        'current_key': val,
                        'target_bucket': target,
                        'found_chain_index': 0
                    })
                )
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
            self.add_step(
                f"Collision at index {idx}, probing next",
                self._build_state({
                    'active_zone': 'bucket',
                    'highlight_bucket': idx,
                    'current_key': val,
                    'target_bucket': idx
                })
            )

        if first_deleted is not None:
            self.table[first_deleted] = val
            self.count += 1
            self.add_step(
                f"Inserted {val} at recycled index {first_deleted}",
                self._build_state({
                    'active_zone': 'bucket',
                    'highlight_bucket': first_deleted,
                    'current_key': val,
                    'target_bucket': first_deleted,
                    'found_chain_index': 0
                })
            )
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(
            "Table is full, insertion failed",
            self._build_state({'active_zone': 'bucket', 'current_key': val})
        )
        return {'success': False, 'message': 'Table is full', 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: int) -> Dict:
        try:
            val = int(value)
        except ValueError:
            return {'success': False, 'message': 'Hash Table keys must be integers', 'steps': self.steps}

        self.clear_steps()
        base_bucket = self.get_hash(val)

        self.add_step(
            f"Input key {val}",
            self._build_state({'active_zone': 'input', 'current_key': val})
        )
        self.add_step(
            f"Searching with {self._mode_label()}",
            self._build_state({
                'active_zone': 'funnel',
                'current_key': val,
                'funnel_math': self._hash_formula(),
                'target_bucket': base_bucket
            })
        )

        for i in range(self.size):
            idx = self._probe_index(val, i)
            slot = self.table[idx]
            self.add_step(
                self._next_slot_label(val, i, idx),
                self._build_state({
                    'active_zone': 'bucket',
                    'highlight_bucket': idx,
                    'current_key': val,
                    'target_bucket': idx
                })
            )
            if slot is None:
                self.add_step(
                    f"Stopped at empty index {idx}, key {val} not found",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': idx,
                        'current_key': val,
                        'target_bucket': idx
                    })
                )
                return {'success': False, 'message': f"Key {val} not found", 'steps': self.steps, 'state': self.to_dict()}
            if slot == self.deleted_marker:
                continue
            if slot == val:
                self.add_step(
                    f"Found key {val} at index {idx}",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': idx,
                        'current_key': val,
                        'target_bucket': idx,
                        'found_chain_index': 0
                    })
                )
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(
            f"Key {val} not found",
            self._build_state({'active_zone': 'bucket', 'current_key': val})
        )
        return {'success': False, 'message': f"Key {val} not found", 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: int) -> Dict:
        try:
            val = int(value)
        except ValueError:
            return {'success': False, 'message': 'Hash Table keys must be integers', 'steps': self.steps}

        self.clear_steps()
        base_bucket = self.get_hash(val)

        self.add_step(
            f"Input key {val}",
            self._build_state({'active_zone': 'input', 'current_key': val})
        )
        self.add_step(
            f"Deleting with {self._mode_label()}",
            self._build_state({
                'active_zone': 'funnel',
                'current_key': val,
                'funnel_math': self._hash_formula(),
                'target_bucket': base_bucket
            })
        )

        for i in range(self.size):
            idx = self._probe_index(val, i)
            slot = self.table[idx]
            self.add_step(
                self._next_slot_label(val, i, idx),
                self._build_state({
                    'active_zone': 'bucket',
                    'highlight_bucket': idx,
                    'current_key': val,
                    'target_bucket': idx
                })
            )
            if slot is None:
                self.add_step(
                    f"Stopped at empty index {idx}, key {val} not found",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': idx,
                        'current_key': val,
                        'target_bucket': idx
                    })
                )
                return {'success': False, 'message': f"Key {val} not found", 'steps': self.steps, 'state': self.to_dict()}
            if slot == self.deleted_marker:
                continue
            if slot == val:
                self.table[idx] = self.deleted_marker
                self.count -= 1
                self.add_step(
                    f"Deleted {val} from index {idx}",
                    self._build_state({
                        'active_zone': 'bucket',
                        'highlight_bucket': idx,
                        'current_key': val,
                        'target_bucket': idx,
                        'found_chain_index': 0
                    })
                )
                return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(
            f"Key {val} not found",
            self._build_state({'active_zone': 'bucket', 'current_key': val})
        )
        return {'success': False, 'message': f"Key {val} not found", 'steps': self.steps, 'state': self.to_dict()}

    def to_dict(self) -> Dict:
        buckets = [[] for _ in range(self.size)]
        for idx, slot in enumerate(self.table):
            if isinstance(slot, int):
                buckets[idx] = [slot]
        return {
            'buckets': buckets,
            'size': self.size,
            'count': self.count,
            'load_factor': self._get_load_factor(),
            'memory_map': self._generate_memory_map(),
            'probing_mode': self.mode,
            'collision_strategy': self._mode_label(),
            'hash_formula': self._hash_formula()
        }
