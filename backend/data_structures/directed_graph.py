from .base import DataStructureBase
from typing import Dict, Any, List
from collections import defaultdict, deque

class DirectedGraph(DataStructureBase):
    def __init__(self):
        super().__init__()
        self.is_directed = True
        self.vertices = set()
        self.edges = defaultdict(list)
        self.weights = {}

    def insert(self, value: Any, position: Any = None) -> Dict:
        self.clear_steps()
        self.vertices.add(value)
        self.add_step(f"Added vertex {value}", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def add_edge(self, from_vertex: Any, to_vertex: Any, weight: int = 1) -> Dict:
        self.clear_steps()
        if from_vertex not in self.vertices:
            self.vertices.add(from_vertex)
        if to_vertex not in self.vertices:
            self.vertices.add(to_vertex)

        if to_vertex not in self.edges[from_vertex]:
            self.edges[from_vertex].append(to_vertex)
        self.weights[(from_vertex, to_vertex)] = weight

        self.add_step(f"Added directed edge from {from_vertex} to {to_vertex} with weight {weight}", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete(self, value: Any) -> Dict:
        self.clear_steps()
        if value not in self.vertices:
            return {'success': False, 'message': f'Vertex {value} not found', 'steps': self.steps}

        self.vertices.remove(value)

        for vertex in list(self.edges.keys()):
            if value in self.edges[vertex]:
                self.edges[vertex].remove(value)
                if (vertex, value) in self.weights:
                    del self.weights[(vertex, value)]
            if value in self.edges:
                if (value, vertex) in self.weights:
                    del self.weights[(value, vertex)]

        if value in self.edges:
            del self.edges[value]

        self.add_step(f"Deleted vertex {value} and all its edges", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def delete_edge(self, from_vertex: Any, to_vertex: Any) -> Dict:
        self.clear_steps()
        if from_vertex not in self.vertices or to_vertex not in self.vertices:
            return {'success': False, 'message': 'One or both vertices not found', 'steps': self.steps}

        if to_vertex in self.edges.get(from_vertex, []):
            self.edges[from_vertex].remove(to_vertex)
            if (from_vertex, to_vertex) in self.weights:
                del self.weights[(from_vertex, to_vertex)]

        self.add_step(f"Deleted edge from {from_vertex} to {to_vertex}", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        if value in self.vertices:
            self.add_step(f"Found vertex {value}", self.to_dict())
            return {'success': True, 'found': value, 'steps': self.steps, 'state': self.to_dict()}
        else:
            return {'success': False, 'message': f'Vertex {value} not found', 'steps': self.steps}

    def traverse(self, start_vertex: Any, algorithm: str = 'bfs') -> Dict:
        self.clear_steps()
        if start_vertex not in self.vertices:
            return {'success': False, 'message': f'Start vertex {start_vertex} not found', 'steps': self.steps}

        if algorithm == 'bfs':
            return self._bfs(start_vertex)
        elif algorithm == 'dfs':
            return self._dfs(start_vertex)
        else:
            return {'success': False, 'message': f'Unknown traversal algorithm: {algorithm}', 'steps': self.steps}

    def _bfs(self, start_vertex: Any) -> Dict:
        visited = set()
        queue = deque([start_vertex])
        traversal_order = []

        while queue:
            current = queue.popleft()
            if current not in visited:
                visited.add(current)
                traversal_order.append(current)
                self.add_step(f"BFS: Visiting {current}", {**self.to_dict(), 'visited': list(visited), 'order': traversal_order})

                for neighbor in self.edges[current]:
                    if neighbor not in visited:
                        queue.append(neighbor)

        return {'success': True, 'traversal': traversal_order, 'steps': self.steps, 'state': self.to_dict()}

    def _dfs(self, start_vertex: Any) -> Dict:
        visited = set()
        stack = [start_vertex]
        traversal_order = []

        while stack:
            current = stack.pop()
            if current not in visited:
                visited.add(current)
                traversal_order.append(current)
                self.add_step(f"DFS: Visiting {current}", {**self.to_dict(), 'visited': list(visited), 'order': traversal_order})

                for neighbor in reversed(self.edges[current]):
                    if neighbor not in visited:
                        stack.append(neighbor)

        return {'success': True, 'traversal': traversal_order, 'steps': self.steps, 'state': self.to_dict()}

    def shortest_path(self, start: Any, end: Any) -> Dict:
        self.clear_steps()
        if start not in self.vertices or end not in self.vertices:
            return {'success': False, 'message': 'Start or end vertex not found', 'steps': self.steps}

        # Dijkstra's algorithm
        distances = {vertex: float('infinity') for vertex in self.vertices}
        distances[start] = 0
        previous = {}
        pq = [(0, start)]

        while pq:
            current_distance, current = min(pq, key=lambda x: x[0])
            pq.remove((current_distance, current))

            if current == end:
                break

            for neighbor in self.edges[current]:
                weight = self.weights.get((current, neighbor), 1)
                distance = current_distance + weight

                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current
                    pq.append((distance, neighbor))

        # Reconstruct path
        path = []
        current = end
        while current in previous:
            path.append(current)
            current = previous[current]
        path.append(start)
        path.reverse()

        self.add_step(f"Shortest path from {start} to {end}: {path}", self.to_dict())
        return {
            'success': True, 
            'path': path, 
            'distance': distances[end], 
            'steps': self.steps, 
            'state': self.to_dict()
        }

    def find_path(self, start_vertex: Any, end_vertex: Any) -> Dict:
        self.clear_steps()
        if start_vertex not in self.vertices or end_vertex not in self.vertices:
            return {'success': False, 'message': 'Start or end vertex not found', 'steps': self.steps}

        queue = deque([(start_vertex, [start_vertex])])
        visited = {start_vertex}

        while queue:
            current, path = queue.popleft()
            self.add_step(f"Checking path: {' -> '.join(map(str, path))}", {**self.to_dict(), 'visited': path})

            if current == end_vertex:
                self.add_step(f"Found path!", {**self.to_dict(), 'visited': path, 'found': end_vertex})
                return {'success': True, 'path': path, 'steps': self.steps, 'state': self.to_dict()}

            for neighbor in self.edges[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return {'success': False, 'message': 'No path found', 'steps': self.steps}

    def topological_sort(self) -> Dict:
        self.clear_steps()
        if not self.vertices:
             return {'success': False, 'message': 'Graph is empty', 'steps': self.steps}

        in_degree = {v: 0 for v in self.vertices}
        for u in self.vertices:
            for v in self.edges[u]:
                in_degree[v] += 1
                
        queue = deque([v for v in self.vertices if in_degree[v] == 0])
        topo_order = []
        
        while queue:
            curr = queue.popleft()
            topo_order.append(curr)
            self.add_step(f"Topo Sort: Adding {curr}", {**self.to_dict(), 'visited': list(topo_order)})
            
            for neighbor in self.edges[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
                    
        if len(topo_order) != len(self.vertices):
            return {'success': False, 'message': 'Graph has at least one cycle. Topological sort not possible.', 'steps': self.steps}
            
        self.add_step(f"Topological Sort Completed: {topo_order}", {**self.to_dict(), 'visited': topo_order})
        return {'success': True, 'topo_order': topo_order, 'steps': self.steps, 'state': self.to_dict()}

    def detect_cycle(self) -> Dict:
        self.clear_steps()
        visited = set()
        rec_stack = set()
        cycle_path = None

        def dfs_cycle(vertex, path):
            nonlocal cycle_path
            visited.add(vertex)
            rec_stack.add(vertex)
            self.add_step(f"Cycle DFS: Checking {vertex}", {**self.to_dict(), 'visited': path})

            for neighbor in self.edges[vertex]:
                if neighbor not in visited:
                    if dfs_cycle(neighbor, path + [neighbor]):
                        return True
                elif neighbor in rec_stack:
                    if neighbor in path:
                        start_idx = path.index(neighbor)
                        cycle_path = path[start_idx:] + [neighbor]
                    else:
                        cycle_path = path + [neighbor]
                    return True

            rec_stack.remove(vertex)
            return False

        for vertex in self.vertices:
            if vertex not in visited:
                if dfs_cycle(vertex, [vertex]):
                    if cycle_path and len(cycle_path) >= 2:
                        if cycle_path[0] != cycle_path[-1]:
                            cycle_path.append(cycle_path[0])
                        highlighted_edges = []
                        for i in range(len(cycle_path) - 1):
                            highlighted_edges.append({'from': cycle_path[i], 'to': cycle_path[i + 1]})
                        self.add_step(
                            f"Cycle detected: {' -> '.join(map(str, cycle_path))}",
                            {**self.to_dict(), 'visited': cycle_path, 'found': cycle_path[-1], 'highlighted_edges': highlighted_edges}
                        )
                    else:
                        self.add_step(f"Cycle detected starting from vertex {vertex}", self.to_dict())
                    return {'success': True, 'has_cycle': True, 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(f"No cycles detected in graph", self.to_dict())
        return {'success': True, 'has_cycle': False, 'message': 'No cycle found', 'steps': self.steps, 'state': self.to_dict()}

    def to_dict(self) -> Dict:
        edges_list = []
        for from_v, neighbors in self.edges.items():
            for to_v in neighbors:
                weight = self.weights.get((from_v, to_v), 1)
                edges_list.append({
                    'from': from_v,
                    'to': to_v,
                    'weight': weight
                })

        return {
            'vertices': list(self.vertices),
            'edges': edges_list,
            'is_directed': self.is_directed
        }
