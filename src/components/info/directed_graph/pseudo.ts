export const pseudo = {
  full: `Directed Graph Operations

1. ADD_VERTEX Operation:
   - vertices ← vertices ∪ {vertex}
   - IF vertex ∉ edges:
       * edges[vertex] ← empty array
   - RETURN success

2. ADD_EDGE Operation (Directed):
   - ADD_VERTEX(from_vertex)
   - ADD_VERTEX(to_vertex)
   - edges[from_vertex] ← edges[from_vertex] ∪ {to_vertex}
   - weights[(from_vertex,to_vertex)] ← weight
   - RETURN success

3. DELETE_EDGE Operation:
   - IF from_vertex ∉ vertices OR to_vertex ∉ vertices:
       RETURN failure
   - from_edges ← edges[from_vertex]
   - index ← from_edges.indexOf(to_vertex)
   - IF index ≠ -1:
       * from_edges.splice(index, 1)
       * DELETE weights[(from_vertex,to_vertex)]
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

7. TOPOLOGICAL_SORT Operation:
   - IF vertices = empty:
       RETURN failure
   - in_degree ← map with vertex → 0
   - queue ← empty queue
   - result ← empty list
   
   - FOR each vertex IN vertices:
       * in_degree[vertex] ← 0
   
   - FOR each (from, neighbors) IN edges:
       * FOR each to IN neighbors:
           - in_degree[to] ← in_degree[to] + 1
   
   - FOR each (vertex, degree) IN in_degree:
       * IF degree = 0:
           queue ← queue ∪ [vertex]
   
   - WHILE queue ≠ empty:
       * current ← queue.shift()
       * result ← result ∪ [current]
       * FOR each neighbor IN edges[current]:
           - in_degree[neighbor] ← in_degree[neighbor] - 1
           - IF in_degree[neighbor] = 0:
               queue ← queue ∪ [neighbor]
   
   - IF result.length = vertices.length:
       RETURN success, result
   - ELSE:
       RETURN failure (cycle exists)

8. DETECT_CYCLE Operation:
   - visited ← empty set
   - rec_stack ← empty set
   
   - DFS_CYCLE(vertex):
       * visited ← visited ∪ {vertex}
       * rec_stack ← rec_stack ∪ {vertex}
       * FOR each neighbor IN edges[vertex]:
           - IF neighbor ∉ visited:
               - IF DFS_CYCLE(neighbor): RETURN true
           - ELSE IF neighbor ∈ rec_stack:
               - RETURN true (cycle detected)
       * rec_stack ← rec_stack \\ {vertex}
       * RETURN false
   
   - FOR each vertex IN vertices:
       * IF vertex ∉ visited:
           - IF DFS_CYCLE(vertex): RETURN success, has_cycle
   
   - RETURN success, no_cycle

Time Complexity:
- Add Vertex: O(1)
- Add Edge: O(1)
- Delete Edge: O(E) where E is edges from vertex
- BFS Traversal: O(V + E)
- DFS Traversal: O(V + E)
- Dijkstra: O((V + E) log V)
- Topological Sort: O(V + E)
- Detect Cycle: O(V + E)

Space Complexity:
- Graph storage: O(V + E)
- BFS/DFS: O(V) for visited + queue/stack
- Dijkstra: O(V) for priority queue + maps
- Topological Sort: O(V) for queue + in-degree map`,

  add_edge: `ADD_EDGE Operation Pseudocode (Directed)

ADD_EDGE(from, to, weight):
    ADD_VERTEX(from)        // Ensure from vertex exists
    ADD_VERTEX(to)          // Ensure to vertex exists
    
    edges[from] ← edges[from] ∪ {to}        // 1 step
    weights[(from,to)] ← weight                // 1 step
    
    RETURN success, steps: 4`,

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
    ELSE:
        RETURN success, steps: 1`,

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

  topological_sort: `TOPOLOGICAL_SORT Operation

TOPOLOGICAL_SORT():
    IF vertices = empty:
        RETURN failure, steps: 1
    
    in_degree ← map with vertex → 0
    queue ← empty queue
    result ← empty list
    
    // Calculate in-degrees: O(V + E) steps
    FOR each vertex IN vertices:
        in_degree[vertex] ← 0
    
    FOR each (from, neighbors) IN edges:
        FOR each to IN neighbors:
            in_degree[to] ← in_degree[to] + 1
    
    // Find zero in-degree vertices: O(V) steps
    FOR each (vertex, degree) IN in_degree:
        IF degree = 0:
            queue ← queue ∪ [vertex]
    
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
        RETURN failure (cycle exists)`,

  detect_cycle: `DETECT_CYCLE Operation

DETECT_CYCLE():
    visited ← empty set
    rec_stack ← empty set
    
    DFS_CYCLE(vertex):
        visited ← visited ∪ {vertex}        // 1 step
        rec_stack ← rec_stack ∪ {vertex}    // 1 step
        
        FOR each neighbor IN edges[vertex]:
            IF neighbor ∉ visited:            // 1 check
                IF DFS_CYCLE(neighbor):        // 1 call
                    RETURN true
            ELSE IF neighbor ∈ rec_stack:       // 1 check
                RETURN true (cycle detected)
        
        rec_stack ← rec_stack \\ {vertex}    // 1 step
        RETURN false
    
    FOR each vertex IN vertices:
        IF vertex ∉ visited:                // 1 check
            IF DFS_CYCLE(vertex):
                RETURN success, has_cycle
    
    RETURN success, no_cycle`
};
