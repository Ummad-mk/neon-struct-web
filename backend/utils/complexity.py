class ComplexityTracker:
    COMPLEXITIES = {
        'linked_list': {
            'insert_front': 'O(1)',
            'insert_back': 'O(n)',
            'insert_at': 'O(n)',
            'insert': 'O(n)',
            'delete_front': 'O(1)',
            'delete_back': 'O(n)',
            'delete_value': 'O(n)',
            'delete': 'O(n)',
            'search': 'O(n)',
            'reverse': 'O(n)',
            'traverse': 'O(n)'
        },
        'singly_linked_list': {
            'insert_front': 'O(1)',
            'insert_back': 'O(n)',
            'insert_at': 'O(n)',
            'insert': 'O(n)',
            'delete_front': 'O(1)',
            'delete_back': 'O(n)',
            'delete_value': 'O(n)',
            'delete': 'O(n)',
            'search': 'O(n)',
            'reverse': 'O(n)',
            'traverse': 'O(n)'
        },
        'doubly_linked_list': {
            'insert_front': 'O(1)',
            'insert_back': 'O(1)',
            'insert_at': 'O(n)',
            'insert': 'O(1)',
            'delete_front': 'O(1)',
            'delete_back': 'O(1)',
            'delete_value': 'O(n)',
            'delete': 'O(n)',
            'search': 'O(n)',
            'reverse': 'O(n)',
            'traverse': 'O(n)'
        },
        'stack': {
            'push': 'O(1)',
            'pop': 'O(1)',
            'insert': 'O(1)',
            'delete': 'O(1)',
            'search': 'O(n)'
        },
        'queue': {
            'enqueue': 'O(1)',
            'dequeue': 'O(1)',
            'insert': 'O(1)',
            'delete': 'O(1)',
            'search': 'O(n)'
        },
        'priority_queue': {
            'insert': 'O(log n)',
            'delete': 'O(log n)',
            'search': 'O(n)',
            'change_priority': 'O(n)',
            'peek': 'O(1)'
        },
        'deque': {
            'insert_front': 'O(1)',
            'insert_back': 'O(1)',
            'insert': 'O(1)',
            'delete_front': 'O(1)',
            'delete_back': 'O(1)',
            'delete': 'O(1)',
            'search': 'O(n)'
        },
        'bst': {
            'insert': 'O(log n)',
            'delete': 'O(log n)',
            'search': 'O(log n)'
        },
        'avl': {
            'insert': 'O(log n)',
            'delete': 'O(log n)',
            'search': 'O(log n)'
        },
        'red_black_tree': {
            'insert': 'O(log n)',
            'delete': 'O(log n)',
            'search': 'O(log n)'
        },
        'graph': {
            'add_vertex': 'O(1)',
            'add_edge': 'O(1)',
            'insert': 'O(1)',
            'search': 'O(V + E)'
        },
        'trie': {
            'insert': 'O(L)',
            'delete': 'O(L)',
            'search': 'O(L)'
        },
        'segment_tree': {
            'build': 'O(n)',
            'range_query': 'O(log n)',
            'point_update': 'O(log n)'
        }
    }

    @staticmethod
    def get_complexity(ds_type, operation):
        return ComplexityTracker.COMPLEXITIES.get(ds_type, {}).get(operation, 'O(1)')
