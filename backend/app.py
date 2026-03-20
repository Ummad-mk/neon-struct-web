from flask import Flask, request, jsonify
from flask_cors import CORS
from data_structures import (
    SinglyLinkedList, DoublyLinkedList, Queue, DoubleEndedQueue, PriorityQueue,
    Stack, BinarySearchTree, AVLTree, Graph, DirectedGraph, HashTable, Trie, SegmentTree, RedBlackTree
)
from utils import ComplexityTracker
import random
import copy

app = Flask(__name__)
CORS(app)

data_structures = {}
history_store = {}  # Stores undo/redo stacks: { 'key': { 'undo': [], 'redo': [] } }

def get_ds_instance(ds_type, ds_id):
    key = f"{ds_type}_{ds_id}"
    if key not in data_structures:
        ds_map = {
            'singly_linked_list': lambda: SinglyLinkedList(),
            'doubly_linked_list': lambda: DoublyLinkedList(),
            'queue': lambda: Queue(),
            'deque': lambda: DoubleEndedQueue(),
            'stack': lambda: Stack(),
            'bst': lambda: BinarySearchTree(),
            'avl': lambda: AVLTree(),
            'priority_queue': lambda: PriorityQueue(),
            'graph': lambda: Graph(),
            'directed_graph': lambda: DirectedGraph(),
            'hash_table': lambda: HashTable(),
            'trie': lambda: Trie()
            ,
            'segment_tree': lambda: SegmentTree(),
            'red_black_tree': lambda: RedBlackTree()
        }
        data_structures[key] = ds_map[ds_type]()
    return data_structures[key]

def save_state_for_undo(ds_type, ds_id):
    """Saves the current state to the undo stack before mutation."""
    key = f"{ds_type}_{ds_id}"
    ds = get_ds_instance(ds_type, ds_id)
    
    if key not in history_store:
        history_store[key] = {'undo': [], 'redo': []}
    
    # Deep copy the current object state
    try:
        state_copy = copy.deepcopy(ds)
        history_store[key]['undo'].append(state_copy)
        
        # Clear redo stack because a new path is taken
        history_store[key]['redo'].clear()
        
        # Optional: Limit stack size to prevent memory issues (e.g., 50 steps)
        if len(history_store[key]['undo']) > 50:
            history_store[key]['undo'].pop(0)
            
    except Exception as e:
        print(f"Error saving state: {e}")

# --- Operations ---

@app.route('/api/ds/<ds_type>/<ds_id>/insert', methods=['POST'])
def insert(ds_type, ds_id):
    save_state_for_undo(ds_type, ds_id) # Save State
    
    data = request.json
    value = data.get('value')
    position = data.get('position')

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.insert(value, position)

    operation = 'insert' if 'insert' in dir(ds) else 'push' if ds_type == 'stack' else 'enqueue'
    complexity = ComplexityTracker.get_complexity(ds_type, operation)

    result['complexity'] = complexity
    result['operation'] = f"Inserting {value}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/delete', methods=['POST'])
def delete(ds_type, ds_id):
    save_state_for_undo(ds_type, ds_id) # Save State

    data = request.json
    value = data.get('value')

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.delete(value)

    operation = 'delete' if 'delete' in dir(ds) else 'pop' if ds_type == 'stack' else 'dequeue'
    complexity = ComplexityTracker.get_complexity(ds_type, operation)

    result['complexity'] = complexity
    result['operation'] = f"Deleting {value}" if value else "Deleting"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/search', methods=['POST'])
def search(ds_type, ds_id):
    # Search doesn't mutate state, no undo needed
    data = request.json
    value = data.get('value')

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.search(value)

    complexity = ComplexityTracker.get_complexity(ds_type, 'search')

    result['complexity'] = complexity
    result['operation'] = f"Searching for {value}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/set_mode', methods=['POST'])
def set_mode(ds_type, ds_id):
    if ds_type != 'hash_table':
        return jsonify({'success': False, 'message': 'Mode switching is only available for hash table'}), 400

    save_state_for_undo(ds_type, ds_id)
    data = request.json or {}
    mode = data.get('mode', 'linear')

    ds = get_ds_instance(ds_type, ds_id)
    if not hasattr(ds, 'set_mode'):
        return jsonify({'success': False, 'message': 'Mode switching not supported'}), 400

    result = ds.set_mode(mode)
    result['complexity'] = 'O(n)'
    result['operation'] = f"Switch mode to {mode}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/peek', methods=['POST'])
def peek(ds_type, ds_id):
    if ds_type != 'priority_queue':
        return jsonify({'success': False, 'message': 'Peek only available for priority queue'}), 400

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.peek()
    result['complexity'] = "O(1)"
    result['operation'] = "Peek"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/change_priority', methods=['POST'])
def change_priority(ds_type, ds_id):
    if ds_type != 'priority_queue':
        return jsonify({'success': False, 'message': 'Change priority only available for priority queue'}), 400

    save_state_for_undo(ds_type, ds_id)
    data = request.json
    value = data.get('value')
    priority = data.get('priority')

    if value is None or priority is None:
        return jsonify({'success': False, 'message': 'value and priority are required'}), 400

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.change_priority(value, priority)
    result['complexity'] = "O(n)"
    result['operation'] = f"Change Priority of {value} to {priority}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/add_random', methods=['POST'])
def add_random(ds_type, ds_id):
    # Fix the missing tree.py import first (AVLTree)
    
    data = request.json
    count = data.get('count', 7)

    ds = get_ds_instance(ds_type, ds_id)
    results = []

    # --- SMART RANDOM GENERATION ---
    if ds_type == 'bst' or ds_type == 'avl' or ds_type == 'red_black_tree':
        # Generate a "balanced-like" sequence
        # E.g., Start with middle, then quarters, etc.
        # This prevents the "skewed line" look
        if count == 7:
            # Perfect set for a 3-level tree
            values = [50, 25, 75, 10, 30, 60, 90]
            # Add small random noise so it looks unique each time
            noise = random.randint(-5, 5)
            values = [v + noise for v in values]
        else:
             values = random.sample(range(1, 100), count)
    elif ds_type == 'priority_queue':
        values = random.sample(range(1, 100), count)
    elif ds_type == 'trie':
        words_pool = ['cat', 'car', 'card', 'care', 'cart', 'dog', 'dot', 'dove', 'deal', 'dear', 'tree', 'trie', 'trip']
        random.shuffle(words_pool)
        values = words_pool[:count]
    elif ds_type == 'segment_tree':
        ds = get_ds_instance(ds_type, ds_id)
        result = ds.add_random(count)
        operation = 'build'
        complexity = ComplexityTracker.get_complexity(ds_type, operation)
        return jsonify({'success': True, 'results': result.get('results'), 'complexity': complexity, 'operation': f'Build random {count}', 'state': ds.to_dict()})
    else:
        values = [random.randint(1, 100) for _ in range(count)]
    
    # Insert the values
    for idx, value in enumerate(values):
        if ds_type == 'graph':
             if value in ds.vertices: continue
        if ds_type == 'priority_queue':
            priority = random.randint(1, 10)
            result = ds.insert(value, priority)
        else:
            result = ds.insert(value)
        results.append(result)

    # Graph extra edge logic (kept same as before)
    if ds_type in ['graph', 'directed_graph']:
         all_vertices = list(ds.vertices)
         if len(all_vertices) >= 2:
            for v in values:
                 if v in all_vertices:
                    target = random.choice(all_vertices)
                    if target != v:
                        weight = random.randint(1, 10)
                        ds.add_edge(v, target, weight)

    operation = 'insert'
    complexity = ComplexityTracker.get_complexity(ds_type, operation)

    return jsonify({
        'success': True,
        'results': results,
        'complexity': complexity,
        'operation': f"Added {len(values)} random values",
        'state': ds.to_dict()
    })

# --- Segment Tree specific ---
@app.route('/api/ds/<ds_type>/<ds_id>/build', methods=['POST'])
def build_segment(ds_type, ds_id):
    if ds_type != 'segment_tree':
        return jsonify({'success': False, 'message': 'Build only available for segment_tree'}), 400
    save_state_for_undo(ds_type, ds_id)
    data = request.json or {}
    array = data.get('array', [])
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.build(array)
    result['complexity'] = ComplexityTracker.get_complexity(ds_type, 'build')
    result['operation'] = 'Build Segment Tree'
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/range_query', methods=['POST'])
def range_query(ds_type, ds_id):
    if ds_type != 'segment_tree':
        return jsonify({'success': False, 'message': 'Range query only available for segment_tree'}), 400
    data = request.json or {}
    l = data.get('l', 0)
    r = data.get('r', 0)
    op = data.get('op', 'sum')
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.range_query(l, r, op)
    result['complexity'] = ComplexityTracker.get_complexity(ds_type, 'range_query')
    result['operation'] = f"Range Query [{l}..{r}] ({op})"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/point_update', methods=['POST'])
def point_update(ds_type, ds_id):
    if ds_type != 'segment_tree':
        return jsonify({'success': False, 'message': 'Point update only available for segment_tree'}), 400
    save_state_for_undo(ds_type, ds_id)
    data = request.json or {}
    idx = data.get('idx', 0)
    val = data.get('val', 0)
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.point_update(idx, val)
    result['complexity'] = ComplexityTracker.get_complexity(ds_type, 'point_update')
    result['operation'] = f"Point Update idx={idx} → {val}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/add_edge', methods=['POST'])
def add_edge(ds_type, ds_id):
    if ds_type not in ['graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Only graphs support edges'}), 400
    
    save_state_for_undo(ds_type, ds_id) # Save State

    data = request.json
    from_vertex = data.get('from')
    to_vertex = data.get('to')
    if isinstance(from_vertex, str) and from_vertex.strip().lstrip('-').isdigit():
        from_vertex = int(from_vertex)
    if isinstance(to_vertex, str) and to_vertex.strip().lstrip('-').isdigit():
        to_vertex = int(to_vertex)
    weight = data.get('weight', 1)

    ds = get_ds_instance(ds_type, ds_id)
    result = ds.add_edge(from_vertex, to_vertex, weight)

    complexity = ComplexityTracker.get_complexity(ds_type, 'add_edge')
    result['complexity'] = complexity
    result['operation'] = f"Adding edge {from_vertex}-{to_vertex}"

    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/clear', methods=['POST'])
def clear(ds_type, ds_id):
    save_state_for_undo(ds_type, ds_id) # Save State
    
    key = f"{ds_type}_{ds_id}"
    if key in data_structures:
        # Instead of deleting, we reset it (so we can keep the instance ref if needed, or just replace)
        # Here we just remove it, get_ds_instance will create a fresh one next time
        del data_structures[key]
        
    return jsonify({'success': True, 'message': 'Data structure cleared'})

# --- Undo / Redo Endpoints ---

@app.route('/api/ds/<ds_type>/<ds_id>/undo', methods=['POST'])
def undo(ds_type, ds_id):
    key = f"{ds_type}_{ds_id}"
    
    if key not in history_store or not history_store[key]['undo']:
        return jsonify({'success': False, 'message': 'Nothing to undo'})
    
    # Push current state to Redo stack
    current_ds = get_ds_instance(ds_type, ds_id)
    history_store[key]['redo'].append(copy.deepcopy(current_ds))
    
    # Pop from Undo stack and restore
    previous_state = history_store[key]['undo'].pop()
    data_structures[key] = previous_state
    
    return jsonify({'success': True, 'operation': 'Undo', 'state': previous_state.to_dict()})

@app.route('/api/ds/<ds_type>/<ds_id>/redo', methods=['POST'])
def redo(ds_type, ds_id):
    key = f"{ds_type}_{ds_id}"
    
    if key not in history_store or not history_store[key]['redo']:
        return jsonify({'success': False, 'message': 'Nothing to redo'})
    
    # Push current state to Undo stack
    current_ds = get_ds_instance(ds_type, ds_id)
    history_store[key]['undo'].append(copy.deepcopy(current_ds))
    
    # Pop from Redo stack and restore
    next_state = history_store[key]['redo'].pop()
    data_structures[key] = next_state
    
    return jsonify({'success': True, 'operation': 'Redo', 'state': next_state.to_dict()})

@app.route('/api/ds/<ds_type>/<ds_id>/state', methods=['GET'])
def get_state(ds_type, ds_id):
    ds = get_ds_instance(ds_type, ds_id)
    return jsonify({
        'success': True,
        'state': ds.to_dict()
    })

# --- Linked List Specific Operations ---

@app.route('/api/ds/<ds_type>/<ds_id>/reverse', methods=['POST'])
def reverse_list(ds_type, ds_id):
    if ds_type not in ['singly_linked_list', 'doubly_linked_list', 'stack', 'queue', 'deque']:
        return jsonify({'success': False, 'message': 'Reverse only available for designated structures'}), 400
    
    save_state_for_undo(ds_type, ds_id)  # Save State
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.reverse()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'reverse')
    result['complexity'] = complexity
    result['operation'] = 'Reversing list'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/get_middle', methods=['POST'])
def get_middle(ds_type, ds_id):
    if ds_type != 'singly_linked_list':
        return jsonify({'success': False, 'message': 'Get middle only available for singly linked list'}), 400
    
    # No save state needed - read-only operation
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.get_middle()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'traverse')
    result['complexity'] = complexity
    result['operation'] = 'Finding middle node'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/detect_cycle', methods=['POST'])
def detect_cycle(ds_type, ds_id):
    if ds_type not in ['singly_linked_list', 'graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Cycle detection only available for linked list and graphs'}), 400
    
    # No save state needed - read-only operation
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.detect_cycle()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'traverse')
    result['complexity'] = complexity
    result['operation'] = 'Detecting cycle'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/remove_duplicates', methods=['POST'])
def remove_duplicates(ds_type, ds_id):
    if ds_type != 'singly_linked_list':
        return jsonify({'success': False, 'message': 'Remove duplicates only available for singly linked list'}), 400
    
    save_state_for_undo(ds_type, ds_id)  # Save State
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.remove_duplicates()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'delete')
    result['complexity'] = complexity
    result['operation'] = 'Removing duplicates'
    
    return jsonify(result)

# --- Tree Specific Operations ---

@app.route('/api/ds/<ds_type>/<ds_id>/traverse', methods=['POST'])
def traverse_ds(ds_type, ds_id):
    if ds_type not in ['bst', 'avl', 'graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Traversal only available for trees and graphs'}), 400
    
    data = request.json
    traversal_type = data.get('type', 'inorder') # inorder, preorder, postorder, levelorder, bfs, dfs
    start_vertex = data.get('start_vertex')
    
    ds = get_ds_instance(ds_type, ds_id)
    if ds_type in ['graph', 'directed_graph']:
        if not start_vertex and ds.vertices:
            start_vertex = next(iter(ds.vertices))
        result = ds.traverse(traversal_type, start_vertex)
    else:
        result = ds.traverse(traversal_type)
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'traverse')
    result['complexity'] = complexity
    result['operation'] = f'{traversal_type.capitalize()} Traversal'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/find_min_max', methods=['POST'])
def find_min_max(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'Min/Max only available for trees'}), 400
    
    data = request.json
    find_type = data.get('type', 'min') # min, max
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.find_min_max(find_type)
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'search')
    result['complexity'] = complexity
    result['operation'] = f'Find {find_type.capitalize()}'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/find_successor_predecessor', methods=['POST'])
def find_successor_predecessor(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'Successor/Predecessor only available for trees'}), 400
    
    data = request.json
    value = data.get('value')
    find_type = data.get('type', 'successor') # successor, predecessor
    
    if value is None:
        return jsonify({'success': False, 'message': 'Value is required'}), 400
        
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.find_successor_predecessor(value, find_type)
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'search')
    result['complexity'] = complexity
    result['operation'] = f'Find {find_type.capitalize()} of {value}'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/get_height', methods=['GET', 'POST'])
def get_height(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'Height only available for trees'}), 400
        
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.get_height()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'traverse')
    result['complexity'] = complexity
    result['operation'] = 'Get Height'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/count_nodes', methods=['GET', 'POST'])
def count_nodes(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'Count only available for trees'}), 400
        
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.count_nodes()
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'traverse')
    result['complexity'] = complexity
    result['operation'] = 'Count Nodes'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/range_search', methods=['POST'])
def range_search(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'Range search only available for trees'}), 400
    
    data = request.json
    min_val = data.get('min')
    max_val = data.get('max')
    
    if min_val is None or max_val is None:
         return jsonify({'success': False, 'message': 'min and max values are required'}), 400
        
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.range_search(min_val, max_val)
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'search')
    result['complexity'] = complexity
    result['operation'] = f'Range Search [{min_val}, {max_val}]'
    
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/lca', methods=['POST'])
def lowest_common_ancestor(ds_type, ds_id):
    if ds_type not in ['bst', 'avl']:
        return jsonify({'success': False, 'message': 'LCA only available for trees'}), 400
    
    data = request.json
    val1 = data.get('val1')
    val2 = data.get('val2')
    
    if val1 is None or val2 is None:
         return jsonify({'success': False, 'message': 'val1 and val2 are required'}), 400
         
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.lowest_common_ancestor(val1, val2)
    
    complexity = ComplexityTracker.get_complexity(ds_type, 'search')
    result['complexity'] = complexity
    result['operation'] = f'LCA of {val1} and {val2}'
    
    return jsonify(result)

# --- Graph Specific Operations ---

@app.route('/api/ds/<ds_type>/<ds_id>/delete_edge', methods=['POST'])
def delete_edge(ds_type, ds_id):
    if ds_type not in ['graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Only graphs support deleting edges'}), 400
    
    save_state_for_undo(ds_type, ds_id)
    data = request.json
    from_vertex = data.get('from')
    to_vertex = data.get('to')
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.delete_edge(from_vertex, to_vertex)
    
    result['complexity'] = "O(E)"
    result['operation'] = f"Deleting edge {from_vertex}-{to_vertex}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/find_path', methods=['POST'])
def find_path(ds_type, ds_id):
    if ds_type not in ['graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Path finding only available for graph'}), 400
    
    data = request.json
    start = data.get('start')
    end = data.get('end')
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.find_path(start, end)
    
    result['complexity'] = "O(V+E)"
    result['operation'] = f"Finding path {start} to {end}"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/shortest_path', methods=['POST'])
def shortest_path(ds_type, ds_id):
    if ds_type not in ['graph', 'directed_graph']:
        return jsonify({'success': False, 'message': 'Shortest path only available for graph'}), 400
    
    data = request.json
    start = data.get('start')
    end = data.get('end')
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.shortest_path(start, end)
    
    result['complexity'] = "O((V+E)logV)"
    result['operation'] = f"Shortest path {start} to {end} (Dijkstra)"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/topological_sort', methods=['POST'])
def topological_sort(ds_type, ds_id):
    if ds_type != 'directed_graph':
        return jsonify({'success': False, 'message': 'Topological sort only available for directed graph'}), 400
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.topological_sort()
    
    result['complexity'] = "O(V+E)"
    result['operation'] = "Topological Sort"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/minimum_spanning_tree', methods=['POST'])
def minimum_spanning_tree(ds_type, ds_id):
    if ds_type != 'graph':
        return jsonify({'success': False, 'message': 'MST only available for graph'}), 400
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.minimum_spanning_tree()
    
    result['complexity'] = "O(E log V)"
    result['operation'] = "Minimum Spanning Tree (Prim's)"
    return jsonify(result)

@app.route('/api/ds/<ds_type>/<ds_id>/kruskals_mst', methods=['POST'])
def kruskals_mst(ds_type, ds_id):
    if ds_type != 'graph':
        return jsonify({'success': False, 'message': 'Kruskal\'s MST only available for graph'}), 400
    
    ds = get_ds_instance(ds_type, ds_id)
    result = ds.kruskals_algorithm()
    
    result['complexity'] = "O(E log E)"
    result['operation'] = "Minimum Spanning Tree (Kruskal's)"
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Change host to '0.0.0.0' to ensure it's accessible
    app.run(debug=True, host='0.0.0.0', port=5000)
