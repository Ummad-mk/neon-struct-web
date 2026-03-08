export const algorithm = {
  full: `# Directed Graph Data Structure

## Overview
A directed graph is a collection of vertices connected by edges, where edges have a specific direction. Unlike undirected graphs, edges in directed graphs are one-way streets.

## Key Properties
- **Vertices**: Nodes or points in the graph
- **Directed Edges**: Connections with specific direction (from → to)
- **Weights**: Optional values associated with edges
- **No bidirectional edges**: Each edge is explicitly one-way

## Operations and Complexity Analysis

### 1. ADD_VERTEX Operation
Description:

Algorithm:
1. Add vertex to vertices set
2. Initialize empty adjacency list if vertex doesn't exist

Step Count:
- \`vertices.add(vertex)\` (1 step)
- \`edges.set(vertex, [])\` if needed (1 step)

Time Complexity: 
Space Complexity:

### 2. ADD_EDGE Operation
**Description**: Add a directed edge from one vertex to another

**Algorithm**:
1. Ensure both vertices exist
2. Add to-vertex to from-vertex's adjacency list
3. Store edge weight

**Step Count**: 4 steps
- Add vertices if needed (2 steps)
- \`edges[from].push(to)\` (1 step)
- \`weights.set((from,to), weight)\` (1 step)

**Time Complexity**: O(1)
**Space Complexity**: O(1)

### 3. DELETE_EDGE Operation
**Description**: Remove a directed edge between two vertices

**Algorithm**:
1. Verify both vertices exist
2. Find edge in adjacency list
3. Remove edge from adjacency list
4. Remove weight from weights map

**Step Count**: 3-4 steps
- Vertex validation (1 step)
- Find and remove from adjacency list (1-2 steps)
- Remove from weights map (1 step)

**Time Complexity**: O(E) where E is edges from source vertex
**Space Complexity**: O(1)

### 4. BFS_TRAVERSAL Operation
**Description**: Breadth-First Search exploring neighbors level by level

**Algorithm**:
1. Initialize visited set and queue with start vertex
2. While queue not empty:
   - Dequeue current vertex
   - Add to result
   - Enqueue all unvisited neighbors

**Step Count**: 2V + 2E steps
- Each vertex: dequeue + add to result (2 steps)
- Each edge: check + potentially enqueue (2 steps)

**Time Complexity**: O(V + E)
**Space Complexity**: O(V) for visited set and queue

### 5. DFS_TRAVERSAL Operation
**Description**: Depth-First Search exploring as far as possible along branches

**Algorithm**:
1. Initialize visited set and result list
2. Recursive helper:
   - Mark vertex as visited
   - Add to result
   - Recursively visit unvisited neighbors

**Step Count**: 2V + 2E steps
- Each vertex: mark visited + add to result (2 steps)
- Each edge: check + potentially recurse (2 steps)

**Time Complexity**: O(V + E)
**Space Complexity**: O(V) for visited set and recursion stack

### 6. DIJKSTRA_SHORTEST_PATH Operation
**Description**: Find shortest path from start to end using Dijkstra's algorithm

**Algorithm**:
1. Initialize distances map (∞ for all except start: 0)
2. Initialize priority queue with (start, 0)
3. While queue not empty:
   - Extract vertex with minimum distance
   - If already visited, skip
   - For each neighbor:
     - Calculate new distance
     - Update if shorter than current
     - Add to priority queue

**Step Count**: O(V²) in worst case
- Initialization: O(V) steps
- Main loop: O(V log V + E log V) steps
- Each edge relaxation: 3-4 steps

**Time Complexity**: O((V + E) log V)
**Space Complexity**: O(V) for distances, previous, and priority queue

### 7. TOPOLOGICAL_SORT Operation
**Description**: Linear ordering of vertices respecting edge directions

**Algorithm** (Kahn's Algorithm):
1. Calculate in-degree for all vertices
2. Queue vertices with zero in-degree
3. While queue not empty:
   - Remove vertex from queue
   - Add to result
   - Decrement in-degree of neighbors
   - Queue neighbors that reach zero in-degree

**Step Count**: 2V + 2E steps
- Calculate in-degrees: O(V + E) steps
- Process queue: O(V + E) steps

**Time Complexity**: O(V + E)
**Space Complexity**: O(V) for in-degree map and queue

### 8. DETECT_CYCLE Operation
**Description**: Check if directed graph contains cycles

**Algorithm** (DFS with recursion stack):
1. Track visited vertices and current recursion stack
2. For each unvisited vertex:
   - DFS with cycle detection
   - If neighbor in recursion stack: cycle found
   - If DFS returns true: propagate cycle detection

**Step Count**: 2V + 2E steps
- Each vertex: visited check + stack operations (2 steps)
- Each edge: check + recursive call (2 steps)

**Time Complexity**: O(V + E)
**Space Complexity**: O(V) for visited set and recursion stack

## Advantages of Directed Graphs
- **Directional relationships**: Model one-way relationships
- **Topological ordering**: Enable dependency resolution
- **Path analysis**: Find directed paths and cycles
- **Real-world modeling**: Better for many real-world scenarios

## Disadvantages of Directed Graphs
- **Complexity**: More complex than undirected graphs
- **Memory**: Higher memory usage for same connections
- **Algorithms**: Some algorithms more complex
- **Connectivity**: More complex connectivity concepts

## Common Applications
- **Dependency graphs**: Package dependencies, task scheduling
- **Social networks**: Follower relationships
- **Transportation**: One-way streets, flight routes
- **Computer networks**: Network routing, data flow
- **Compiler design**: Symbol dependencies
- **Project management**: Task dependencies and critical paths

## Memory Usage Analysis
- **Vertices storage**: O(V)
- **Edges storage**: O(E)
- **Weights storage**: O(E)
- **Total space**: O(V + E)
- **Additional**: O(V) for most algorithms

## Special Properties
- **Strongly connected**: Every vertex reachable from every other
- **DAG (Directed Acyclic Graph)**: No cycles, allows topological sort
- **In-degree/Out-degree**: Important for many algorithms
- **Reachability**: Can determine if path exists between vertices`,

  add_edge: `# Add Directed Edge Operation Analysis

## Algorithm Steps
1. **Vertex Validation**: Ensure both vertices exist
2. **Edge Creation**: Add directed edge from source to target
3. **Weight Storage**: Store edge weight in weights map

## Step-by-Step Analysis
- Step 1: \`addVertex(from)\` (2 steps if new)
- Step 2: \`addVertex(to)\` (2 steps if new)
- Step 3: \`edges[from].push(to)\` (1 step)
- Step 4: \`weights.set((from,to), weight)\` (1 step)

## Complexity Analysis
- **Time**: O(1) - constant time operations
- **Space**: O(1) - only adds one edge
Best Case: 
Worst Case: 

## Key Insight
Directed edge addition is always constant time, but requires careful management of directionality. Unlike undirected graphs, we only add one direction.`,

  delete_edge: `# Delete Directed Edge Operation Analysis

## Algorithm Steps
1. **Vertex Validation**: Verify both vertices exist
2. **Edge Location**: Find edge in source adjacency list
3. **Edge Removal**: Remove from adjacency list
4. **Weight Cleanup**: Remove from weights map

## Step-by-Step Analysis
- Step 1: Vertex existence check (1 step)
- Step 2: \`indexOf(to)\` operation (O(E) where E is edges from from)
- Step 3: \`splice(index, 1)\` if found (1 step)
- Step 4: \`weights.delete((from,to))\` if found (1 step)

## Complexity Analysis
- **Time**: O(E) where E is edges from source vertex
- **Space**: O(1) - only removes one edge
- **Best Case**: O(1) - edge at beginning of list
- **Worst Case**: O(E) - edge at end or not found

## Key Insight
Edge deletion requires searching the adjacency list of the source vertex. Performance depends on the degree of the source vertex.`,

  traverse: `# Graph Traversal Operations Analysis

## BFS Traversal
### Algorithm Steps
1. **Initialization**: Queue with start vertex, visited set
2. **Level Processing**: Process vertices level by level
3. **Neighbor Exploration**: Add unvisited neighbors to queue

### Step Count Analysis
- Each vertex: dequeue (1) + add to result (1) = 2 steps
- Each edge: visited check (1) + enqueue (1) = 2 steps
- **Total**: 2V + 2E steps

### Complexity
- **Time**: O(V + E)
- **Space**: O(V) for queue and visited set

## DFS Traversal
### Algorithm Steps
1. **Initialization**: Visited set, result list
2. **Recursive Exploration**: Deep dive along branches
3. **Backtracking**: Return and explore other branches

### Step Count Analysis
- Each vertex: mark visited (1) + add to result (1) = 2 steps
- Each edge: visited check (1) + recursive call (1) = 2 steps
- **Total**: 2V + 2E steps

### Complexity
- **Time**: O(V + E)
- **Space**: O(V) for visited set and recursion stack

## Key Insight
Both BFS and DFS visit every vertex and edge exactly once, giving linear time complexity. The choice depends on whether you need level-by-level (BFS) or deep exploration (DFS).`,

  shortest_path: `# Dijkstra's Shortest Path Analysis

## Algorithm Steps
1. **Initialization**: Set distances (∞ except start: 0), empty visited
2. **Priority Queue**: Start with (source, 0)
3. **Main Loop**: Extract minimum distance vertex
4. **Relaxation**: Update neighbor distances if shorter path found
5. **Path Reconstruction**: Build path from previous pointers

## Step-by-Step Analysis
### Initialization Phase
- Distance map setup: O(V) steps (1 per vertex)
- Priority queue initialization: 1 step

### Main Loop Phase
- Each extraction: 1 step
- Each visited check: 1 step
- Each edge relaxation: 3-4 steps (weight + new_dist + comparison + updates)

### Complexity Analysis
- **Time**: O((V + E) log V)
  - V extractions from priority queue: O(V log V)
  - E edge relaxations: O(E log V)
- **Space**: O(V) for distances, previous, and priority queue

## Key Insight
Dijkstra's algorithm efficiently finds shortest paths by always expanding the currently known shortest unvisited vertex. The priority queue ensures we always process the optimal next vertex.`,

  topological_sort: `# Topological Sort Analysis

## Algorithm Steps (Kahn's Algorithm)
1. **In-degree Calculation**: Count incoming edges for each vertex
2. **Zero Degree Queue**: Initialize queue with vertices having zero in-degree
3. **Processing**: Remove vertices and update neighbor in-degrees
4. **Cycle Detection**: Check if all vertices were processed

## Step-by-Step Analysis
### In-degree Calculation
- Initialize all in-degrees to 0: O(V) steps
- Process each edge: O(E) steps
- **Total**: O(V + E) steps

### Queue Processing
- Each vertex: dequeue (1) + add to result (1) = 2 steps
- Each edge: decrement in-degree (1) + potentially enqueue (1) = 2 steps
- **Total**: O(V + E) steps

## Complexity Analysis
- **Time**: O(V + E) - linear in vertices and edges
- **Space**: O(V) for in-degree map and queue

## Key Insight
Topological sort works by repeatedly removing vertices with no incoming edges. If a cycle exists, some vertices will never reach zero in-degree, making cycle detection inherent to the algorithm.`,

  detect_cycle: `# Cycle Detection Analysis

## Algorithm Steps (DFS with Recursion Stack)
1. **Initialization**: Empty visited set and recursion stack
2. **DFS Traversal**: Depth-first search with stack tracking
3. **Cycle Detection**: Check if current vertex is in recursion stack
4. **Backtracking**: Remove vertex from recursion stack when returning

## Step-by-Step Analysis
- Each vertex: visited check (1) + stack operations (2) = 3 steps
- Each edge: visited check (1) + recursive call (1) = 2 steps
- **Total**: 3V + 2E steps approximately

## Complexity Analysis
- **Time**: O(V + E) - visits each vertex and edge once
- **Space**: O(V) for visited set and recursion stack

## Key Insight
Cycle detection in directed graphs requires tracking the current recursion path. If we encounter a vertex already in the current path, we've found a cycle. This is more complex than undirected graph cycle detection.`
};
