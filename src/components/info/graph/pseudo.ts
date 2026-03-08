export const pseudo = {
  full: `Graph Operations

1. ADD_VERTEX Operation:
   - vertices ← vertices ∪ {vertex}
   - IF vertex ∉ edges:
       * edges[vertex] ← empty array
   - RETURN success

2. ADD_EDGE Operation:
   - ADD_VERTEX(from_vertex)
   - ADD_VERTEX(to_vertex)
   - edges[from_vertex] ← edges[from_vertex] ∪ {to_vertex}
   - weights[(from_vertex,to_vertex)] ← weight
   - IF NOT directed:
       * edges[to_vertex] ← edges[to_vertex] ∪ {from_vertex}
       * weights[(to_vertex,from_vertex)] ← weight
   - RETURN success

3. DELETE_EDGE Operation:
   - IF from_vertex ∉ vertices OR to_vertex ∉ vertices:
       RETURN failure
   - from_edges ← edges[from_vertex]
   - index ← from_edges.indexOf(to_vertex)
   - IF index ≠ -1:
       * from_edges.splice(index, 1)
       * DELETE weights[(from_vertex,to_vertex)]
   - IF NOT directed:
       * to_edges ← edges[to_vertex]
       * index ← to_edges.indexOf(from_vertex)
       * IF index ≠ -1:
           - to_edges.splice(index, 1)
           - DELETE weights[(to_vertex,from_vertex)]
   - RETURN success

4. BFS_TRAVERSAL Operation:
   - IF start_vertex ∉ vertices:
       RETURN failure
   - visited ← empty set
   - queue ← [start_vertex]
   - result ← empty list
   - visited ← visited ∪ {start_vertex}
   
   - WHILE queue ≠ empty:
       * current ← queue.shift()
       * result ← result ∪ [current]
       * FOR each neighbor IN edges[current]:
           - IF neighbor ∉ visited:
               visited ← visited ∪ {neighbor}
               queue ← queue ∪ [neighbor]
   - RETURN success, result

5. DFS_TRAVERSAL Operation:
   - IF start_vertex ∉ vertices:
       RETURN failure
   - visited ← empty set
   - result ← empty list
   
   - DFS_HELPER(start_vertex):
       * visited ← visited ∪ {vertex}
       * result ← result ∪ [vertex]
       * FOR each neighbor IN edges[vertex]:
           - IF neighbor ∉ visited:
               DFS_HELPER(neighbor)
   
   - DFS_HELPER(start_vertex)
   - RETURN success, result

6. DIJKSTRA_SHORTEST_PATH Operation:
   - IF start ∉ vertices OR end ∉ vertices:
       RETURN failure
   - distances ← map with vertex → ∞, except start → 0
   - previous ← empty map
   - visited ← empty set
   - pq ← priority queue with (start, 0)
   
   - WHILE pq ≠ empty:
       * (current, current_dist) ← pq.dequeue()
       * IF current ∈ visited: CONTINUE
       * visited ← visited ∪ {current}
       * IF current = end: BREAK
       * FOR each neighbor IN edges[current]:
           - weight ← weights[(current,neighbor)] OR 1
           - new_dist ← current_dist + weight
           - IF new_dist < distances[neighbor]:
               distances[neighbor] ← new_dist
               previous[neighbor] ← current
               pq.enqueue((neighbor, new_dist))
   
   - RECONSTRUCT_PATH using previous map
   - RETURN success, path, distance

7. PRIMS_MST Operation:
   - IF vertices = empty:
       RETURN failure
   - mst_edges ← empty list
   - visited ← empty set
   - pq ← priority queue
   - total_cost ← 0
   - start_vertex ← any vertex from vertices
   - visited ← visited ∪ {start_vertex}
   
   - Add all edges from start_vertex:
   - FOR each neighbor IN edges[start_vertex]:
       - weight ← weights[(start_vertex,neighbor)] OR 1
       - pq.enqueue([start_vertex, neighbor], weight)
   
   - WHILE pq ≠ empty AND visited.size < vertices.size:
       * (edge, weight) ← pq.dequeue()
       * [from, to] ← edge
       * IF to ∉ visited:
           - visited ← visited ∪ {to}
           - mst_edges ← mst_edges ∪ {from, to, weight}
           - total_cost ← total_cost + weight
           - FOR each neighbor IN edges[to]:
               - IF neighbor ∉ visited:
                   - edge_weight ← weights[(to,neighbor)] OR 1
                   - pq.enqueue([to, neighbor], edge_weight)
   
   - RETURN success, mst_edges, total_cost

8. KRUSKALS_MST Operation:
   - IF vertices = empty:
       RETURN failure
   - all_edges ← empty list
   - seen ← empty set
   
   - Collect all edges:
   - FOR each (from, neighbors) IN edges:
       - FOR each to IN neighbors:
           - edge_key ← sorted([from, to]).join('-')
           - IF edge_key ∉ seen:
               - seen ← seen ∪ {edge_key}
               - weight ← weights[(from,to)] OR 1
               - all_edges ← all_edges ∪ {from, to, weight}
   
   - Sort edges by weight
   - all_edges.sort((a, b) => a.weight - b.weight)
   
   - Union-Find structure:
   - parent ← map with vertex → vertex
   - rank ← map with vertex → 0
   
   - FOR each vertex IN vertices:
       - parent[vertex] ← vertex
       - rank[vertex] ← 0
   
   - FIND(vertex):
       - IF parent[vertex] ≠ vertex:
           - parent[vertex] ← FIND(parent[vertex])
       - RETURN parent[vertex]
   
   - UNION(v1, v2):
       - root1 ← FIND(v1)
       - root2 ← FIND(v2)
       - IF root1 ≠ root2:
           - rank1 ← rank[root1]
           - rank2 ← rank[root2]
           - IF rank1 < rank2:
               - parent[root1] ← root2
           - ELSE IF rank1 > rank2:
               - parent[root2] ← root1
           - ELSE:
               - parent[root2] ← root1
               - rank[root1] ← rank1 + 1
   
   - mst_edges ← empty list
   - total_cost ← 0
   
   - FOR each edge IN all_edges:
       - IF UNION(edge.from, edge.to):
           - mst_edges ← mst_edges ∪ {edge}
           - total_cost ← total_cost + edge.weight
           - IF mst_edges.length = vertices.size - 1: BREAK
   
   - RETURN success, mst_edges, total_cost

Time Complexity:
- Add Vertex: O(1)
- Add Edge: O(1)
- Delete Edge: O(E) where E is edges from vertex
- BFS Traversal: O(V + E)
- DFS Traversal: O(V + E)
- Dijkstra: O((V + E) log V)
- Prim's MST: O(E log V)
- Kruskal's MST: O(E log E)
- Topological Sort: O(V + E)

Space Complexity:
- Graph storage: O(V + E)
- BFS/DFS: O(V) for visited + queue/stack
- Dijkstra: O(V) for priority queue + maps
- MST: O(V) for priority queue + visited set
- Topological Sort: O(V) for queue + in-degree map`,

  add_vertex: `ADD_VERTEX Operation

ADD_VERTEX(vertex):
    vertices ← vertices ∪ {vertex}
    IF vertex ∉ edges:
        edges[vertex] ← empty array
    RETURN success`,

  add_edge: `ADD_EDGE Operation Pseudocode

ADD_EDGE(from, to, weight):
    ADD_VERTEX(from)        // Ensure from vertex exists
    ADD_VERTEX(to)          // Ensure to vertex exists
    
    edges[from] ← edges[from] ∪ {to}        // 1 step
    weights[(from,to)] ← weight                // 1 step
    
    IF NOT directed:
        edges[to] ← edges[to] ∪ {from}        // 1 step
        weights[(to,from)] ← weight                // 1 step
    
    RETURN success, steps: directed ? 4 : 6`,

  delete_edge: `DELETE_EDGE Operation Pseudocode

DELETE_EDGE(from, to):
    IF from ∉ vertices OR to ∉ vertices:
        RETURN failure, steps: 1
    
    from_edges ← edges[from]
    index ← from_edges.indexOf(to)    // 1 step
    
    IF index ≠ -1:
        from_edges.splice(index, 1)        // 1 step
        DELETE weights[(from,to)]            // 1 step
        RETURN success, steps: 4
    
    IF NOT directed:
        to_edges ← edges[to]
        index ← to_edges.indexOf(from)    // 1 step
        
        IF index ≠ -1:
            to_edges.splice(index, 1)        // 1 step
            DELETE weights[(to,from)]            // 1 step
            RETURN success, steps: 6
    
    RETURN success, steps: 2`,

  traverse: `GRAPH TRAVERSAL Operations

BFS_TRAVERSAL(start):
    IF start ∉ vertices:
        RETURN failure, steps: 1
    
    visited ← empty set
    queue ← [start]
    result ← empty list
    visited ← visited ∪ {start}    // 1 step
    
    WHILE queue ≠ empty:
        current ← queue.shift()        // 1 step
        result ← result ∪ [current]   // 1 step
        
        FOR each neighbor IN edges[current]:
            IF neighbor ∉ visited:    // 1 check
                visited ← visited ∪ {neighbor}  // 1 step
                queue ← queue ∪ [neighbor]      // 1 step
    
    RETURN success, result

DFS_TRAVERSAL(start):
    IF start ∉ vertices:
        RETURN failure, steps: 1
    
    visited ← empty set
    result ← empty list
    
    DFS_HELPER(vertex):
        visited ← visited ∪ {vertex}    // 1 step
        result ← result ∪ [vertex]       // 1 step
        
        FOR each neighbor IN edges[vertex]:
            IF neighbor ∉ visited:        // 1 check
                DFS_HELPER(neighbor)        // 1 call
    
    DFS_HELPER(start)
    RETURN success, result`,

  shortest_path: `DIJKSTRA_SHORTEST_PATH Operation

DIJKSTRA(start, end):
    IF start ∉ vertices OR end ∉ vertices:
        RETURN failure, steps: 1
    
    distances ← map with vertex → ∞, except start → 0
    previous ← empty map
    visited ← empty set
    pq ← priority queue with (start, 0)
    
    // Initialize: O(V) steps
    FOR each vertex IN vertices:
        distances[vertex] ← (vertex = start ? 0 : ∞)
    
    pq.enqueue(start, 0)    // 1 step
    
    WHILE pq ≠ empty:
        (current, current_dist) ← pq.dequeue()    // 1 step
        
        IF current ∈ visited: CONTINUE
        visited ← visited ∪ {current}             // 1 step
        
        IF current = end: BREAK                   // 1 step
        
        FOR each neighbor IN edges[current]:
            weight ← weights[(current,neighbor)] OR 1    // 1 step
            new_dist ← current_dist + weight               // 1 step
            
            IF new_dist < distances[neighbor]:             // 1 comparison
                distances[neighbor] ← new_dist            // 1 step
                previous[neighbor] ← current              // 1 step
                pq.enqueue((neighbor, new_dist))          // 1 step
    
    RECONSTRUCT_PATH using previous map
    RETURN success, path, distance`,

  minimum_spanning_tree: `PRIMS_MST Operation

PRIMS_MST():
    IF vertices = empty:
        RETURN failure, steps: 1
    
    mst_edges ← empty list
    visited ← empty set
    pq ← priority queue
    total_cost ← 0
    start_vertex ← any vertex from vertices
    visited ← visited ∪ {start_vertex}    // 1 step
    
    // Add all edges from start vertex: O(degree) steps
    FOR each neighbor IN edges[start_vertex]:
        weight ← weights[(start_vertex,neighbor)] OR 1    // 1 step
        pq.enqueue([start_vertex, neighbor], weight)          // 1 step
    
    // Process queue: O(E log V) steps
    WHILE pq ≠ empty AND visited.size < vertices.size:
        (edge, weight) ← pq.dequeue()        // 1 step
        [from, to] ← edge
        
        IF to ∉ visited:
            visited ← visited ∪ {to}            // 1 step
            mst_edges ← mst_edges ∪ {from, to, weight} // 1 step
            total_cost ← total_cost + weight      // 1 step
            
            // Add new edges to priority queue
            FOR each neighbor IN edges[to]:
                IF neighbor ∉ visited:
                    edge_weight ← weights[(to,neighbor)] OR 1    // 1 step
                    pq.enqueue([to, neighbor], edge_weight)          // 1 step
    
    RETURN success, mst_edges, total_cost`,

  kruskals_mst: `KRUSKALS_MST Operation

KRUSKALS_MST():
    IF vertices = empty:
        RETURN failure, steps: 1
    
    // Collect all edges: O(E) steps
    all_edges ← empty list
    seen ← empty set
    
    FOR each (from, neighbors) IN edges:
        FOR each to IN neighbors:
            edge_key ← sorted([from, to]).join('-')
            IF edge_key ∉ seen:
                seen ← seen ∪ {edge_key}        // 1 step
                weight ← weights[(from,to)] OR 1    // 1 step
                all_edges ← all_edges ∪ {from, to, weight} // 1 step
    
    // Sort edges by weight: O(E log E) steps
    all_edges.sort((a, b) => a.weight - b.weight)
    
    // Union-Find structure: O(V) steps
    parent ← map with vertex → vertex
    rank ← map with vertex → 0
    
    FOR each vertex IN vertices:
        parent[vertex] ← vertex    // 1 step
        rank[vertex] ← 0           // 1 step
    
    // Process edges: O(E α(V)) steps
    mst_edges ← empty list
    total_cost ← 0
    
    FOR each edge IN all_edges:
        IF UNION(edge.from, edge.to):
            mst_edges ← mst_edges ∪ {edge}    // 1 step
            total_cost ← total_cost + edge.weight // 1 step
            
            IF mst_edges.length = vertices.size - 1: BREAK
    
    RETURN success, mst_edges, total_cost`,

  topological_sort: `TOPOLOGICAL_SORT Operation

TOPOLOGICAL_SORT():
    IF NOT directed:
        RETURN failure, message: 'Topological sort requires directed graph', steps: 1
    
    IF vertices = empty:
        RETURN failure, steps: 1
    
    in_degree ← map with vertex → 0
    queue ← empty queue
    result ← empty list
    
    // Calculate in-degrees: O(V + E) steps
    FOR each vertex IN vertices:
        in_degree[vertex] ← 0    // 1 step
    
    FOR each (from, neighbors) IN edges:
        FOR each to IN neighbors:
            in_degree[to] ← in_degree[to] + 1    // 1 step
    
    // Find zero in-degree vertices: O(V) steps
    FOR each (vertex, degree) IN in_degree:
        IF degree = 0:
            queue ← queue ∪ [vertex]    // 1 step
    
    // Process queue: O(V + E) steps
    WHILE queue ≠ empty:
        current ← queue.shift()        // 1 step
        result ← result ∪ [current]   // 1 step
        
        FOR each neighbor IN edges[current]:
            in_degree[neighbor] ← in_degree[neighbor] - 1    // 1 step
            
            IF in_degree[neighbor] = 0:
                queue ← queue ∪ [neighbor]                  // 1 step
    
    IF result.length = vertices.length:
        RETURN success, result
    ELSE:
        RETURN failure (cycle exists)`
};
