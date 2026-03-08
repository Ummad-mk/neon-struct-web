from .base import DataStructureBase
from typing import Dict, Any, List
from collections import defaultdict, deque

class Graph(DataStructureBase):
    def __init__(self, is_directed: bool = False):
        super().__init__()
        self.is_directed = is_directed
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

        if not self.is_directed:
            if from_vertex not in self.edges[to_vertex]:
                self.edges[to_vertex].append(from_vertex)
            self.weights[(to_vertex, from_vertex)] = weight

        self.add_step(f"Added {'directed ' if self.is_directed else ''}edge between {from_vertex} and {to_vertex} with weight {weight}", self.to_dict())
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
                if (value, vertex) in self.weights:
                    del self.weights[(value, vertex)]

        if value in self.edges:
            del self.edges[value]

        self.add_step(f"Deleted vertex {value} and its edges", self.to_dict())
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

    def search(self, value: Any) -> Dict:
        self.clear_steps()
        if not self.vertices:
            return {'success': False, 'message': 'Graph is empty', 'steps': self.steps}

        start = next(iter(self.vertices))
        visited = set()
        queue = deque([start])
        visited.add(start)

        while queue:
            current = queue.popleft()
            visited_list = list(visited)
            self.add_step(f"Visiting vertex {current}", {**self.to_dict(), 'visited': visited_list})

            if current == value:
                self.add_step(f"Found {value}", {**self.to_dict(), 'found': value, 'visited': visited_list})
                return {'success': True, 'found': value, 'steps': self.steps, 'state': self.to_dict()}

            for neighbor in self.edges[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return {'success': False, 'message': f'{value} not found', 'steps': self.steps}

    def delete_edge(self, from_vertex: Any, to_vertex: Any) -> Dict:
        self.clear_steps()
        if from_vertex not in self.vertices or to_vertex not in self.vertices:
            return {'success': False, 'message': 'One or both vertices not found', 'steps': self.steps}
        
        updated = False
        if to_vertex in self.edges.get(from_vertex, []):
            self.edges[from_vertex].remove(to_vertex)
            if (from_vertex, to_vertex) in self.weights:
                del self.weights[(from_vertex, to_vertex)]
            updated = True
            
        if not self.is_directed:
            if from_vertex in self.edges.get(to_vertex, []):
                self.edges[to_vertex].remove(from_vertex)
                if (to_vertex, from_vertex) in self.weights:
                    del self.weights[(to_vertex, from_vertex)]
                updated = True
            
        if updated:
            self.add_step(f"Deleted edge between {from_vertex} and {to_vertex}", self.to_dict())
            return {'success': True, 'steps': self.steps, 'state': self.to_dict()}
        return {'success': False, 'message': 'Edge not found', 'steps': self.steps}

    def traverse(self, traversal_type: str, start_vertex: Any) -> Dict:
        self.clear_steps()
        if start_vertex not in self.vertices:
            return {'success': False, 'message': f'Vertex {start_vertex} not found', 'steps': self.steps}
            
        visited = []
        if traversal_type == 'bfs':
            queue = deque([start_vertex])
            visited_set = {start_vertex}
            while queue:
                current = queue.popleft()
                visited.append(current)
                self.add_step(f"BFS: Visiting {current}", {**self.to_dict(), 'visited': list(visited)})
                for neighbor in sorted(self.edges[current], key=lambda x: str(x)): # Sort for deterministic output
                    if neighbor not in visited_set:
                        visited_set.add(neighbor)
                        queue.append(neighbor)
                        
        elif traversal_type == 'dfs':
            visited_set = set()
            def dfs(node):
                visited_set.add(node)
                visited.append(node)
                self.add_step(f"DFS: Visiting {node}", {**self.to_dict(), 'visited': list(visited)})
                for neighbor in sorted(self.edges[node], key=lambda x: str(x)):
                    if neighbor not in visited_set:
                        dfs(neighbor)
            dfs(start_vertex)
            
        else:
            return {'success': False, 'message': f'Unknown traversal type {traversal_type}', 'steps': self.steps}
            
        return {'success': True, 'steps': self.steps, 'state': self.to_dict()}

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
                
            for neighbor in sorted(self.edges[current], key=lambda x: str(x)):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
                    
        return {'success': False, 'message': 'No path found', 'steps': self.steps}

    def shortest_path(self, start_vertex: Any, end_vertex: Any) -> Dict:
        # Dijkstra's Algorithm
        self.clear_steps()
        if start_vertex not in self.vertices or end_vertex not in self.vertices:
            return {'success': False, 'message': 'Start or end vertex not found', 'steps': self.steps}

        import heapq
        distances = {v: float('infinity') for v in self.vertices}
        distances[start_vertex] = 0
        pq = [(0, start_vertex)]
        previous = {v: None for v in self.vertices}
        visited = set()

        while pq:
            current_dist, current = heapq.heappop(pq)
            if current in visited:
                continue
            
            visited.add(current)
            path_so_far = []
            curr = current
            while curr is not None:
                path_so_far.insert(0, curr)
                curr = previous[curr]
                
            self.add_step(f"Dijkstra: Popped {current} (dist: {current_dist})", {**self.to_dict(), 'visited': path_so_far})

            if current == end_vertex:
                self.add_step(f"Found shortest path! Total cost: {current_dist}", {**self.to_dict(), 'visited': path_so_far, 'found': end_vertex})
                return {'success': True, 'path': path_so_far, 'cost': current_dist, 'steps': self.steps, 'state': self.to_dict()}

            for neighbor in self.edges[current]:
                if neighbor in visited:
                    continue
                weight = self.weights.get((current, neighbor), 1)
                distance = current_dist + weight

                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current
                    heapq.heappush(pq, (distance, neighbor))

        return {'success': False, 'message': 'No path found', 'steps': self.steps}

    def detect_cycle(self) -> Dict:
        self.clear_steps()
        if not self.vertices:
             return {'success': False, 'message': 'Graph is empty', 'steps': self.steps}
             
        visited = set()
        
        if self.is_directed:
            rec_stack = set()
            cycle_path = None

            def dfs(curr, path):
                nonlocal cycle_path
                visited.add(curr)
                rec_stack.add(curr)
                self.add_step(f"Cycle DFS: Checking {curr}", {**self.to_dict(), 'visited': path})

                for neighbor in self.edges[curr]:
                    if neighbor not in visited:
                        if dfs(neighbor, path + [neighbor]):
                            return True
                    elif neighbor in rec_stack:
                        if neighbor in path:
                            start_idx = path.index(neighbor)
                            cycle_path = path[start_idx:] + [neighbor]
                        else:
                            cycle_path = path + [neighbor]
                        if cycle_path:
                            highlighted_edges = []
                            for i in range(len(cycle_path) - 1):
                                highlighted_edges.append({'from': cycle_path[i], 'to': cycle_path[i + 1]})
                            self.add_step(
                                f"Cycle Detected at {neighbor}!",
                                {**self.to_dict(), 'visited': cycle_path, 'found': neighbor, 'highlighted_edges': highlighted_edges}
                            )
                        return True
                
                rec_stack.remove(curr)
                return False

            for start_vertex in self.vertices:
                if start_vertex not in visited:
                    if dfs(start_vertex, [start_vertex]):
                        return {'success': True, 'has_cycle': True, 'message': 'Cycle detected', 'steps': self.steps, 'state': self.to_dict()}

        else:
            for start_vertex in self.vertices:
                if start_vertex in visited:
                    continue
                    
                queue = deque([(start_vertex, None, [start_vertex])]) # current, parent, path
                comp_visited = {start_vertex}
                
                while queue:
                    current, parent, path = queue.popleft()
                    visited.add(current)
                    self.add_step(f"Cycle DFS: Checking {current}", {**self.to_dict(), 'visited': path})
                    
                    for neighbor in self.edges[current]:
                        if neighbor not in comp_visited:
                            comp_visited.add(neighbor)
                            queue.append((neighbor, current, path + [neighbor]))
                        elif neighbor != parent:
                            cycle_path = path + [neighbor]
                            if cycle_path[0] != cycle_path[-1]:
                                cycle_path.append(cycle_path[0])
                            highlighted_edges = []
                            for i in range(len(cycle_path) - 1):
                                highlighted_edges.append({'from': cycle_path[i], 'to': cycle_path[i + 1]})
                            self.add_step(
                                f"Cycle Detected at {neighbor}!",
                                {**self.to_dict(), 'visited': cycle_path, 'found': neighbor, 'highlighted_edges': highlighted_edges}
                            )
                            return {'success': True, 'has_cycle': True, 'cycle': cycle_path, 'message': 'Cycle detected', 'steps': self.steps, 'state': self.to_dict()}

        self.add_step(f"No cycles detected in the graph", self.to_dict())
        return {'success': True, 'has_cycle': False, 'message': 'No cycle found', 'steps': self.steps, 'state': self.to_dict()}

    
    def minimum_spanning_tree(self) -> Dict:
        # Prim's Algorithm
        self.clear_steps()
        if not self.vertices:
             return {'success': False, 'message': 'Graph is empty', 'steps': self.steps}

        if self.is_directed:
            return {'success': False, 'message': 'Prim\'s algorithm requires an undirected graph. For directed graphs, Minimum Spanning Arborescence algorithms (like Edmonds\') are needed.', 'steps': self.steps}

        import heapq
        start_vertex = next(iter(self.vertices))
        visited = set([start_vertex])
        mst_edges = []
        pq = []
        total_cost = 0
        
        # Add all edges from start_vertex to pq
        for neighbor in self.edges[start_vertex]:
            weight = self.weights.get((start_vertex, neighbor), 1)
            heapq.heappush(pq, (weight, start_vertex, neighbor))
            
        self.add_step(f"MST (Prim's): Started at {start_vertex}", self.to_dict())

        while pq and len(visited) < len(self.vertices):
            weight, u, v = heapq.heappop(pq)
            if v in visited:
                continue
                
            visited.add(v)
            mst_edges.append((u, v, weight))
            total_cost += weight
            
            # Highlight Current MST
            formatted_mst = [{'from': frm, 'to': to, 'weight': w} for frm, to, w in mst_edges]
            self.add_step(f"Added edge {u}-{v} (weight {weight}) to MST. Cost so far: {total_cost}", {**self.to_dict(), 'highlighted_edges': formatted_mst, 'visited': list(visited)})
            
            for neighbor in self.edges[v]:
                if neighbor not in visited:
                    w = self.weights.get((v, neighbor), 1)
                    heapq.heappush(pq, (w, v, neighbor))
                    
        if len(visited) != len(self.vertices):
            return {'success': False, 'message': 'Graph is disconnected; MST spans only one component.', 'cost': total_cost, 'mst_edges': mst_edges, 'steps': self.steps, 'state': self.to_dict()}
            
        return {'success': True, 'cost': total_cost, 'mst_edges': mst_edges, 'steps': self.steps, 'state': self.to_dict()}

    def kruskals_algorithm(self) -> Dict:
        # Kruskal's Algorithm
        self.clear_steps()
        if not self.vertices:
             return {'success': False, 'message': 'Graph is empty', 'steps': self.steps}

        if self.is_directed:
            return {'success': False, 'message': 'Kruskal\'s algorithm requires an undirected graph.', 'steps': self.steps}

        # Collect all edges with weights
        all_edges = []
        seen = set()
        for from_v, neighbors in self.edges.items():
            for to_v in neighbors:
                edge_key = tuple(sorted([from_v, to_v]))
                if edge_key not in seen:
                    seen.add(edge_key)
                    weight = self.weights.get((from_v, to_v), 1)
                    all_edges.append((from_v, to_v, weight))
        
        # Sort edges by weight (ascending)
        all_edges.sort(key=lambda x: x[2])
        
        # Union-Find (Disjoint Set Union) data structure
        parent = {}
        rank = {}
        
        def find(vertex):
            if parent[vertex] != vertex:
                parent[vertex] = find(parent[vertex])
            return parent[vertex]
        
        def union(vertex1, vertex2):
            root1 = find(vertex1)
            root2 = find(vertex2)
            
            if root1 != root2:
                if rank[root1] < rank[root2]:
                    parent[root1] = root2
                elif rank[root1] > rank[root2]:
                    parent[root2] = root1
                else:
                    parent[root2] = root1
                    rank[root1] += 1
                return True
            return False
        
        # Initialize Union-Find
        for vertex in self.vertices:
            parent[vertex] = vertex
            rank[vertex] = 0
        
        mst_edges = []
        total_cost = 0
        
        self.add_step(f"Kruskal's: Starting with {len(all_edges)} edges, sorted by weight", self.to_dict())
        
        for i, (u, v, weight) in enumerate(all_edges):
            # Check if adding this edge creates a cycle
            if union(u, v):
                mst_edges.append((u, v, weight))
                total_cost += weight
                
                # Highlight Current MST
                formatted_mst = [{'from': frm, 'to': to, 'weight': w} for frm, to, w in mst_edges]
                self.add_step(f"Added edge {u}-{v} (weight {weight}) to MST. Cost so far: {total_cost}", {**self.to_dict(), 'highlighted_edges': formatted_mst})
                
                # Stop when we have V-1 edges (MST is complete)
                if len(mst_edges) == len(self.vertices) - 1:
                    break
            else:
                self.add_step(f"Skipped edge {u}-{v} (weight {weight}) - would create a cycle", self.to_dict())
        
        if len(mst_edges) != len(self.vertices) - 1:
            return {'success': False, 'message': 'Graph is disconnected; MST cannot be formed.', 'cost': total_cost, 'mst_edges': mst_edges, 'steps': self.steps, 'state': self.to_dict()}
            
        self.add_step(f"Kruskal's completed! MST cost: {total_cost}", {**self.to_dict(), 'highlighted_edges': [{'from': frm, 'to': to, 'weight': w} for frm, to, w in mst_edges]})
        return {'success': True, 'cost': total_cost, 'mst_edges': mst_edges, 'steps': self.steps, 'state': self.to_dict()}

    def to_dict(self) -> Dict:
        edges_list = []
        seen = set()

        for from_v, neighbors in self.edges.items():
            for to_v in neighbors:
                edge_key = tuple(sorted([from_v, to_v]))
                if edge_key not in seen:
                    seen.add(edge_key)
                    weight = self.weights.get((from_v, to_v), 1)
                    edges_list.append({
                        'from': from_v,
                        'to': to_v,
                        'weight': weight
                    })

        return {
            'vertices': list(self.vertices),
            'edges': edges_list
        }
