export const algorithm = {
  full: `# Kruskal's Algorithm for Minimum Spanning Tree

## Overview
Kruskal's algorithm is a greedy algorithm that finds a Minimum Spanning Tree (MST) for a connected, weighted, undirected graph. It works by sorting all edges by weight and adding them to the MST if they don't create a cycle.

## Algorithm Steps

### 1. Initialization
- Create an empty list to store MST edges
- Initialize Union-Find (Disjoint Set Union) data structure
- Each vertex starts as its own separate set
- Collect all edges from the graph

### 2. Edge Sorting
- Sort all edges in ascending order by their weights
- This ensures we always consider the cheapest available edge first

### 3. MST Construction
For each edge in sorted order:
- Check if adding the edge would create a cycle using Union-Find
- If no cycle is formed, add the edge to the MST
- Merge the sets of the two vertices using Union operation
- Continue until we have (V-1) edges or run out of edges

### 4. Termination
- Success: MST has (V-1) edges (all vertices connected)
- Failure: Fewer than (V-1) edges (graph is disconnected)

## Key Data Structures

### Union-Find (Disjoint Set Union)
Find(x):
Union(x, y):
Path Compression:
- **Union by Rank**: Optimizes Union operation

## Time and Space Complexity

### Time Complexity: O(E log E)
- Sorting edges: O(E log E)
- Union-Find operations: O(E α(V)) ≈ O(E)
- α(V) is the inverse Ackermann function (very small constant)

### Space Complexity: O(V + E)
- Parent and rank arrays: O(V)
- Edge storage: O(E)
- MST edges: O(V)

## Correctness Proof (Sketch)

### Lemma 1: Cut Property
For any cut in the graph, the minimum-weight edge crossing the cut belongs to some MST.

### Lemma 2: Cycle Property
For any cycle in the graph, the maximum-weight edge in the cycle cannot belong to any MST.

### Theorem: Kruskal's algorithm produces an MST
By the cut property, each edge added by Kruskal's is safe (belongs to some MST). Since we add exactly (V-1) edges and never create cycles, the result is a spanning tree with minimum total weight.

## Advantages
- Simple to understand and implement
- Works well for sparse graphs
- Easy to parallelize the sorting step
- Guaranteed to find the global optimum

## Disadvantages
- Requires sorting all edges (expensive for dense graphs)
- Needs Union-Find data structure
- Less efficient than Prim's for dense graphs

## Comparison with Prim's Algorithm
- **Kruskal's**: Edge-based, good for sparse graphs
- **Prim's**: Vertex-based, good for dense graphs
- Both have same theoretical complexity but different practical performance`,

  insert: `# Kruskal's Algorithm: Edge Addition Process

## Safe Edge Selection
Kruskal's algorithm adds edges one by one, always choosing the cheapest edge that doesn't create a cycle. This is ensured by the Union-Find data structure.

## Union-Find Check
For each edge (u, v):
1. Find the root of u's set: find(u)
2. Find the root of v's set: find(v)
3. If roots are different, edge is safe to add
4. Union the two sets to maintain connectivity

## Cycle Detection
An edge (u, v) creates a cycle if and only if u and v are already in the same set (find(u) == find(v)).

## MST Growth
The MST grows incrementally:
- Start with empty edge set
- Each safe edge connects two previously disconnected components
- After (V-1) additions, we have a complete MST`,

  delete: `# Kruskal's Algorithm: Edge Processing Strategy

## Edge Processing Order
Edges are processed in non-decreasing order of weight:
1. Collect all graph edges
2. Sort by weight (ascending)
3. Process sequentially

## Edge Acceptance Criteria
An edge is accepted if:
- It connects two different components
- It doesn't create a cycle
- It's the cheapest available option

## Edge Rejection
An edge is rejected if:
- Both vertices are already connected
- Adding it would create a cycle
- Even if it's cheap, it's not needed

## Termination Conditions
Processing stops when:
- Success: MST has (V-1) edges
- Failure: No more edges available (disconnected graph)`,

  search: `# Kruskal's Algorithm: Union-Find Operations

## Find Operation
The find operation locates the root representative of a vertex's set:
- Implements path compression for optimization
- Future find operations become faster
- Nearly constant time amortized

## Union Operation
The union operation merges two disjoint sets:
- Uses union by rank for optimization
- Always attaches smaller tree to larger tree
- Maintains balanced tree structure

## Cycle Detection Logic
Two vertices are connected if they share the same root:
- find(u) == find(v) → same component → cycle if connected
- find(u) != find(v) → different components → safe to connect

## Optimization Techniques
1. **Path Compression**: Flatten trees during find
2. **Union by Rank**: Keep trees shallow
3. **Initial Setup**: Each vertex starts as singleton set`,

  minimum_spanning_tree: `# Prim's Algorithm for Minimum Spanning Tree

## Overview
Prim's algorithm is a greedy algorithm that grows the MST from a single starting vertex. At each step, it adds the minimum-weight edge that connects a vertex in the MST to a vertex outside it.

## Algorithm Steps

### 1. Initialization
- Pick any vertex as start
- Add start to visited set
- Add all edges from start to priority queue (min-heap by weight)

### 2. MST Construction
While priority queue not empty and visited < V:
- Extract minimum-weight edge (u, v)
- If v not visited:
  - Add (u, v) to MST
  - Add v to visited
  - Add all edges from v to unvisited neighbors to priority queue

### 3. Termination
- Success: MST has (V-1) edges
- Failure: Graph disconnected

## Time and Space Complexity

### Time: O(E log V)
- Each edge added to PQ once: O(E log E) = O(E log V)
- Each vertex extracted once: O(V log V)
- Total: O((V + E) log V)

### Space: O(V)
- Priority queue: O(E) worst case, typically O(V)
- Visited set: O(V)
- MST edges: O(V)`,

  kruskals_mst: `# Kruskal's Algorithm for Minimum Spanning Tree

## Overview
Kruskal's algorithm sorts all edges by weight and adds them greedily if they don't create a cycle. Uses Union-Find for cycle detection.

## Algorithm Steps

### 1. Collect and Sort
- Gather all edges
- Sort by weight (ascending)

### 2. Greedy Selection
For each edge (u, v) in sorted order:
- If find(u) ≠ find(v): add edge, union(u, v)
- Else: skip (would create cycle)

### 3. Termination
Stop when (V-1) edges added or no more edges.

## Time and Space Complexity

### Time: O(E log E)
- Sorting: O(E log E)
- Union-Find: O(E α(V)) ≈ O(E)

### Space: O(V + E)
- Parent/rank arrays: O(V)
- Sorted edge list: O(E)`,

  traverse: `# BFS and DFS Graph Traversal

## BFS (Breadth-First Search)
- Explores level by level
- Uses a queue
- Time: O(V + E), Space: O(V)

## DFS (Depth-First Search)
- Explores as deep as possible
- Uses recursion or stack
- Time: O(V + E), Space: O(V) for recursion stack

## Step Count
- Each vertex: visited once
- Each edge: examined once`,

  shortest_path: `# Dijkstra's Shortest Path Algorithm

## Overview
Finds shortest path from source to all vertices in a weighted graph with non-negative edge weights.

## Algorithm Steps
1. Initialize distances: source=0, others=∞
2. Use min-priority queue
3. Extract min vertex, relax its neighbors
4. Repeat until queue empty or target found

## Time: O((V + E) log V)
## Space: O(V)`
};
