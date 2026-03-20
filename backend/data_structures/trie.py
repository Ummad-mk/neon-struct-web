from .base import DataStructureBase
from typing import Dict, Any, List
import random
import string


class TrieNode:
    def __init__(self, char: str = '', node_id: str = 'root'):
        self.char = char
        self.id = node_id
        self.children: Dict[str, "TrieNode"] = {}
        self.is_end = False


class Trie(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.root = TrieNode()
        self.words = set()
        self.node_count = 1
        self.highlight_path: List[str] = []
        self.found_word = ''
        self.status = 'READY'

    def _normalize_word(self, value: Any) -> str:
        if value is None:
            return ''
        raw = str(value).strip().lower()
        filtered = ''.join(ch for ch in raw if ch in string.ascii_lowercase)
        return filtered

    def _make_node_id(self, parent_id: str, char: str, idx: int) -> str:
        if parent_id == 'root':
            return f"{char}:{idx}"
        return f"{parent_id}/{char}:{idx}"

    def _serialize_node(self, node: TrieNode) -> Dict:
        children = sorted(node.children.values(), key=lambda n: n.char)
        return {
            'id': node.id,
            'char': node.char,
            'is_end': node.is_end,
            'children': [self._serialize_node(child) for child in children]
        }

    def _build_state(self, extra: Dict = None) -> Dict:
        base = self.to_dict()
        if extra:
            base.update(extra)
        return base

    def insert(self, value: Any, position: Any = None) -> Dict:
        word = self._normalize_word(value)
        self.clear_steps()
        self.highlight_path = ['root']
        self.found_word = ''

        if not word:
            self.status = 'INVALID INPUT'
            self.add_step("Please enter a valid alphabetic word", self._build_state())
            return {'success': False, 'message': 'Word must contain alphabetic characters', 'steps': self.steps, 'state': self.to_dict()}

        current = self.root
        self.add_step(f"Inserting word '{word}'", self._build_state({'active_word': word}))

        for i, ch in enumerate(word):
            if ch not in current.children:
                child_id = self._make_node_id(current.id, ch, i)
                current.children[ch] = TrieNode(ch, child_id)
                self.node_count += 1
                self.add_step(
                    f"Created node '{ch}'",
                    self._build_state({
                        'active_word': word,
                        'highlight_path': self.highlight_path + [child_id]
                    })
                )
            current = current.children[ch]
            self.highlight_path.append(current.id)
            self.add_step(
                f"Moved to '{ch}'",
                self._build_state({
                    'active_word': word,
                    'highlight_path': list(self.highlight_path)
                })
            )

        if current.is_end:
            self.status = 'EXISTS'
            self.found_word = word
            self.add_step(
                f"Word '{word}' already exists",
                self._build_state({'active_word': word, 'found_word': word})
            )
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        current.is_end = True
        self.words.add(word)
        self.status = f"INSERTED {word.upper()}"
        self.found_word = word
        self.add_step(
            f"Marked end of word '{word}'",
            self._build_state({'active_word': word, 'found_word': word})
        )
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        word = self._normalize_word(value)
        self.clear_steps()
        self.highlight_path = ['root']
        self.found_word = ''

        if not word:
            self.status = 'INVALID INPUT'
            self.add_step("Please enter a valid alphabetic word", self._build_state())
            return {'success': False, 'message': 'Word must contain alphabetic characters', 'steps': self.steps, 'state': self.to_dict()}

        current = self.root
        self.add_step(f"Searching for '{word}'", self._build_state({'active_word': word}))

        for ch in word:
            if ch not in current.children:
                self.status = 'NOT FOUND'
                self.add_step(
                    f"Character '{ch}' not found, search failed",
                    self._build_state({'active_word': word, 'highlight_path': list(self.highlight_path)})
                )
                return {'success': False, 'message': f"'{word}' not found", 'steps': self.steps, 'state': self.to_dict()}
            current = current.children[ch]
            self.highlight_path.append(current.id)
            self.add_step(
                f"Matched '{ch}'",
                self._build_state({'active_word': word, 'highlight_path': list(self.highlight_path)})
            )

        if current.is_end:
            self.status = f"FOUND {word.upper()}"
            self.found_word = word
            self.add_step(
                f"Word '{word}' found",
                self._build_state({'active_word': word, 'found_word': word})
            )
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        self.status = 'PREFIX ONLY'
        self.add_step(
            f"'{word}' is a prefix but not a complete word",
            self._build_state({'active_word': word})
        )
        return {'success': False, 'message': f"'{word}' is not a complete word", 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any) -> Dict:
        word = self._normalize_word(value)
        self.clear_steps()
        self.highlight_path = ['root']
        self.found_word = ''

        if not word:
            self.status = 'INVALID INPUT'
            self.add_step("Please enter a valid alphabetic word", self._build_state())
            return {'success': False, 'message': 'Word must contain alphabetic characters', 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(f"Deleting '{word}'", self._build_state({'active_word': word}))
        deleted, _ = self._delete_recursive(self.root, word, 0, ['root'])
        if deleted:
            if word in self.words:
                self.words.remove(word)
            self.status = f"DELETED {word.upper()}"
            self.add_step(
                f"Word '{word}' deleted",
                self._build_state({'active_word': word})
            )
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

        self.status = 'NOT FOUND'
        self.add_step(
            f"Word '{word}' not found",
            self._build_state({'active_word': word})
        )
        return {'success': False, 'message': f"'{word}' not found", 'steps': self.steps, 'state': self.to_dict()}

    def _delete_recursive(self, node: TrieNode, word: str, depth: int, path: List[str]):
        if depth == len(word):
            if not node.is_end:
                return False, False
            node.is_end = False
            self.add_step(
                f"Unmarked end node for '{word}'",
                self._build_state({'highlight_path': list(path), 'active_word': word})
            )
            return True, len(node.children) == 0

        ch = word[depth]
        child = node.children.get(ch)
        if child is None:
            return False, False

        next_path = path + [child.id]
        self.add_step(
            f"Traversing '{ch}'",
            self._build_state({'highlight_path': list(next_path), 'active_word': word})
        )

        deleted, should_prune = self._delete_recursive(child, word, depth + 1, next_path)
        if not deleted:
            return False, False

        if should_prune:
            del node.children[ch]
            self.node_count -= 1
            self.add_step(
                f"Pruned node '{ch}'",
                self._build_state({'highlight_path': list(path), 'active_word': word})
            )
        can_prune = (len(node.children) == 0 and not node.is_end and node.id != 'root')
        return True, can_prune

    def add_random(self, count: int = 5) -> Dict:
        self.clear_steps()
        count = max(1, int(count))
        sample_pool = ['cat', 'car', 'card', 'care', 'cart', 'dog', 'dot', 'dove', 'deal', 'dear', 'tree', 'trie', 'trip']
        random.shuffle(sample_pool)
        words = sample_pool[:count]
        for word in words:
            self.insert(word)
        self.status = f"ADDED {len(words)} WORDS"
        return {'success': True, 'results': words, 'steps': self.steps, 'state': self.to_dict()}

    def to_dict(self) -> Dict:
        return {
            'trie': self._serialize_node(self.root),
            'words': sorted(self.words),
            'node_count': self.node_count,
            'word_count': len(self.words),
            'highlight_path': list(self.highlight_path),
            'found_word': self.found_word,
            'status': self.status
        }
