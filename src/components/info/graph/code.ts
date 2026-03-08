export const code = {
  full: `// Graph Implementation using Adjacency List
class Graph {
    constructor(isDirected = false) {
        this.vertices = new Set();
        this.edges = new Map(); // vertex -> array of neighbors
        this.weights = new Map(); // (vertex1, vertex2) -> weight
        this.isDirected = isDirected;
    }

    // Add vertex
    addVertex(vertex) {
        this.vertices.add(vertex);     // 1 step
        if (!this.edges.has(vertex)) {
            this.edges.set(vertex, []); // 1 step
        }
        return { success: true, steps: 2 };
    }

    // Add edge
    addEdge(from, to, weight = 1) {
        // Add vertices if they don't exist
        this.addVertex(from);
        this.addVertex(to);
        
        // Add edge
        this.edges.get(from).push(to);        // 1 step
        this.weights.set(\`\${from},\${to}\`, weight); // 1 step
        
        // Add reverse edge for undirected graph
        if (!this.isDirected) {
            this.edges.get(to).push(from);        // 1 step
            this.weights.set(\`\${to},\${from}\`, weight); // 1 step
        }
        
        return { success: true, steps: this.isDirected ? 4 : 6 };
    }

    // Delete edge
    deleteEdge(from, to) {
        if (!this.vertices.has(from) || !this.vertices.has(to)) {
            return { success: false, message: 'Vertex not found', steps: 1 };
        }
        
        let steps = 1;
        const fromEdges = this.edges.get(from);
        const fromIndex = fromEdges.indexOf(to);
        
        if (fromIndex !== -1) {
            fromEdges.splice(fromIndex, 1);        // 1 step
            this.weights.delete(\`\${from},\${to}\`); // 1 step
            steps += 2;
        }
        
        // Remove reverse edge for undirected graph
        if (!this.isDirected) {
            const toEdges = this.edges.get(to);
            const toIndex = toEdges.indexOf(from);
            
            if (toIndex !== -1) {
                toEdges.splice(toIndex, 1);        // 1 step
                this.weights.delete(\`\${to},\${from}\`); // 1 step
                steps += 2;
            }
        }
        
        return { success: true, steps: steps };
    }

    // BFS Traversal
    bfs(startVertex) {
        if (!this.vertices.has(startVertex)) {
            return { success: false, message: 'Start vertex not found', steps: 1 };
        }
        
        const visited = new Set();
        const queue = [startVertex];
        const result = [];
        let steps = 1;
        
        visited.add(startVertex); // 1 step
        
        while (queue.length > 0) {
            const current = queue.shift(); // 1 step
            result.push(current);         // 1 step
            steps += 2;
            
            const neighbors = this.edges.get(current);
            for (const neighbor of neighbors) {
                steps += 2; // check + add
                if (!visited.has(neighbor)) {
                    visited.add(neighbor); // 1 step
                    queue.push(neighbor);  // 1 step
                    steps += 2;
                }
            }
        }
        
        return { success: true, traversal: result, steps: steps };
    }

    // DFS Traversal
    dfs(startVertex) {
        if (!this.vertices.has(startVertex)) {
            return { success: false, message: 'Start vertex not found', steps: 1 };
        }
        
        const visited = new Set();
        const result = [];
        let steps = 1;
        
        const dfsHelper = (vertex) => {
            visited.add(vertex); // 1 step
            result.push(vertex); // 1 step
            steps += 2;
            
            const neighbors = this.edges.get(vertex);
            for (const neighbor of neighbors) {
                steps += 2; // check + call
                if (!visited.has(neighbor)) {
                    dfsHelper(neighbor);
                }
            }
        };
        
        dfsHelper(startVertex);
        return { success: true, traversal: result, steps: steps };
    }

    // Dijkstra's Shortest Path
    dijkstra(start, end) {
        if (!this.vertices.has(start) || !this.vertices.has(end)) {
            return { success: false, message: 'Vertex not found', steps: 1 };
        }
        
        const distances = new Map();
        const previous = new Map();
        const visited = new Set();
        const pq = new PriorityQueue();
        
        // Initialize distances
        for (const vertex of this.vertices) {
            distances.set(vertex, vertex === start ? 0 : Infinity); // 1 step per vertex
        }
        pq.enqueue(start, 0); // 1 step
        
        let steps = this.vertices.size + 1;
        
        while (!pq.isEmpty()) {
            const { vertex: current, distance: currentDist } = pq.dequeue(); // 1 step
            steps++;
            
            if (visited.has(current)) continue;
            visited.add(current); // 1 step
            steps++;
            
            if (current === end) break; // 1 step
            steps++;
            
            const neighbors = this.edges.get(current);
            for (const neighbor of neighbors) {
                const weight = this.weights.get(\`\${current},\${neighbor}\`) || 1; // 1 step
                const newDist = currentDist + weight; // 1 step
                steps += 2;
                
                if (newDist < distances.get(neighbor)) {
                    distances.set(neighbor, newDist); // 1 step
                    previous.set(neighbor, current); // 1 step
                    pq.enqueue(neighbor, newDist); // 1 step
                    steps += 3;
                }
            }
        }
        
        // Reconstruct path
        const path = [];
        let current = end;
        while (current && previous.has(current)) {
            path.unshift(current); // 1 step
            current = previous.get(current);
            steps++;
        }
        
        if (path.length > 0) path.unshift(start);
        
        return {
            success: path.length > 0,
            path: path,
            distance: distances.get(end),
            steps: steps
        };
    }

    // Prim's MST Algorithm
    primsMST() {
        if (this.vertices.size === 0) {
            return { success: false, message: 'Graph is empty', steps: 1 };
        }
        
        const mstEdges = [];
        const visited = new Set();
        const pq = new PriorityQueue();
        let totalCost = 0;
        let steps = 1;
        
        const startVertex = this.vertices.values().next().value;
        visited.add(startVertex); // 1 step
        steps++;
        
        // Add all edges from start vertex
        const startNeighbors = this.edges.get(startVertex);
        for (const neighbor of startNeighbors) {
            const weight = this.weights.get(\`\${startVertex},\${neighbor}\`) || 1; // 1 step
            pq.enqueue([startVertex, neighbor], weight); // 1 step
            steps += 2;
        }
        
        while (!pq.isEmpty() && visited.size < this.vertices.size) {
            const { element: edge, priority: weight } = pq.dequeue(); // 1 step
            const [from, to] = edge;
            steps++;
            
            if (!visited.has(to)) {
                visited.add(to); // 1 step
                mstEdges.push({ from, to, weight }); // 1 step
                totalCost += weight; // 1 step
                steps += 3;
                
                // Add new edges to priority queue
                const neighbors = this.edges.get(to);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        const edgeWeight = this.weights.get(\`\${to},\${neighbor}\`) || 1; // 1 step
                        pq.enqueue([to, neighbor], edgeWeight); // 1 step
                        steps += 2;
                    }
                }
            }
        }
        
        return {
            success: visited.size === this.vertices.size,
            mstEdges: mstEdges,
            cost: totalCost,
            steps: steps
        };
    }

    // Kruskal's MST Algorithm
    kruskalsMST() {
        if (this.vertices.size === 0) {
            return { success: false, message: 'Graph is empty', steps: 1 };
        }
        
        // Collect all edges
        const allEdges = [];
        const seen = new Set();
        let steps = 1;
        
        for (const [from, neighbors] of this.edges) {
            for (const to of neighbors) {
                const edgeKey = [from, to].sort().join('-');
                if (!seen.has(edgeKey)) {
                    seen.add(edgeKey); // 1 step
                    const weight = this.weights.get(\`\${from},\${to}\`) || 1; // 1 step
                    allEdges.push({ from, to, weight }); // 1 step
                    steps += 3;
                }
            }
        }
        
        // Sort edges by weight
        allEdges.sort((a, b) => a.weight - b.weight); // O(E log E) steps
        steps += allEdges.length * Math.log2(allEdges.length);
        
        // Union-Find structure
        const parent = new Map();
        const rank = new Map();
        
        for (const vertex of this.vertices) {
            parent.set(vertex, vertex); // 1 step
            rank.set(vertex, 0); // 1 step
            steps += 2;
        }
        
        const find = (vertex) => {
            if (parent.get(vertex) !== vertex) {
                parent.set(vertex, find(parent.get(vertex))); // 1 step + recursive
            }
            return parent.get(vertex);
        };
        
        const union = (v1, v2) => {
            const root1 = find(v1);
            const root2 = find(v2);
            
            if (root1 !== root2) {
                const rank1 = rank.get(root1);
                const rank2 = rank.get(root2);
                
                if (rank1 < rank2) {
                    parent.set(root1, root2); // 1 step
                } else if (rank1 > rank2) {
                    parent.set(root2, root1); // 1 step
                } else {
                    parent.set(root2, root1); // 1 step
                    rank.set(root1, rank1 + 1); // 1 step
                }
                steps += 2;
                return true;
            }
            return false;
        };
        
        const mstEdges = [];
        let totalCost = 0;
        
        for (const edge of allEdges) {
            if (union(edge.from, edge.to)) {
                mstEdges.push(edge); // 1 step
                totalCost += edge.weight; // 1 step
                steps += 2;
                
                if (mstEdges.length === this.vertices.size - 1) {
                    break;
                }
            }
        }
        
        return {
            success: mstEdges.length === this.vertices.size - 1,
}`,
    
    add_edge: `// Add Edge Operation
addEdge(from, to, weight = 1) {
    // Add vertices if they don't exist
    this.addVertex(from);
    this.addVertex(to);
    
    // Add edge
    this.edges.get(from).push(to);        // 1 step
    this.weights.set(\`\${from},\${to}\`, weight); // 1 step
    
    // Add reverse edge for undirected graph
    if (!this.isDirected) {
        this.edges.get(to).push(from);        // 1 step
        this.weights.set(\`\${to},\${from}\`, weight); // 1 step
    }
    
    return { success: true, steps: this.isDirected ? 4 : 6 };
}`,
    
    delete_edge: `// Delete Edge Operation
deleteEdge(from, to) {
    if (!this.vertices.has(from) || !this.vertices.has(to)) {
        return { success: false, message: 'Vertex not found', steps: 1 };
    }
    
    let steps = 1;
    const fromEdges = this.edges.get(from);
    const fromIndex = fromEdges.indexOf(to);
    
    if (fromIndex !== -1) {
        fromEdges.splice(fromIndex, 1);        // 1 step
        this.weights.delete(\`\${from},\${to}\`); // 1 step
        steps += 2;
    }
    
    // Remove reverse edge for undirected graph
    if (!this.isDirected) {
        const toEdges = this.edges.get(to);
        const toIndex = toEdges.indexOf(from);
        
        if (toIndex !== -1) {
            toEdges.splice(toIndex, 1);        // 1 step
            this.weights.delete(\`\${to},\${from}\`); // 1 step
            steps += 2;
        }
    }
    
    return { success: true, steps: steps };
}`,
    
    traverse: `// Graph Traversal Operations

// BFS Traversal
bfs(startVertex) {
    const visited = new Set();
    const queue = [startVertex];
    const result = [];
    let steps = 1;
    
    visited.add(startVertex); // 1 step
    
    while (queue.length > 0) {
        const current = queue.shift(); // 1 step
        result.push(current);         // 1 step
        steps += 2;
        
        const neighbors = this.edges.get(current);
        for (const neighbor of neighbors) {
            steps += 2; // check + add
            if (!visited.has(neighbor)) {
                visited.add(neighbor); // 1 step
                queue.push(neighbor);  // 1 step
                steps += 2;
            }
        }
    }
    
    return { success: true, traversal: result, steps: steps };
}

// DFS Traversal
dfs(startVertex) {
    const visited = new Set();
    const result = [];
    let steps = 1;
    
    const dfsHelper = (vertex) => {
        visited.add(vertex); // 1 step
        result.push(vertex); // 1 step
        steps += 2;
        
        const neighbors = this.edges.get(vertex);
        for (const neighbor of neighbors) {
            steps += 2; // check + call
            if (!visited.has(neighbor)) {
                dfsHelper(neighbor);
            }
        }
    };
    
    dfsHelper(startVertex);
    return { success: true, traversal: result, steps: steps };
}`,
    
    shortest_path: `// Dijkstra's Shortest Path Algorithm
dijkstra(start, end) {
    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    const pq = new PriorityQueue();
    
    // Initialize distances
    for (const vertex of this.vertices) {
        distances.set(vertex, vertex === start ? 0 : Infinity); // 1 step per vertex
    }
    pq.enqueue(start, 0); // 1 step
    
    let steps = this.vertices.size + 1;
    
    while (!pq.isEmpty()) {
        const { vertex: current, distance: currentDist } = pq.dequeue(); // 1 step
        steps++;
        
        if (visited.has(current)) continue;
        visited.add(current); // 1 step
        steps++;
        
        if (current === end) break; // 1 step
        steps++;
        
        const neighbors = this.edges.get(current);
        for (const neighbor of neighbors) {
            const weight = this.weights.get(\`\${current},\${neighbor}\`) || 1; // 1 step
            const newDist = currentDist + weight; // 1 step
            steps += 2;
            
            if (newDist < distances.get(neighbor)) {
                distances.set(neighbor, newDist); // 1 step
                previous.set(neighbor, current); // 1 step
                pq.enqueue(neighbor, newDist); // 1 step
                steps += 3;
            }
        }
    }
    
    // Reconstruct path
    const path = [];
    let current = end;
    while (current && previous.has(current)) {
        path.unshift(current); // 1 step
        current = previous.get(current);
        steps++;
    }
    
    if (path.length > 0) path.unshift(start);
    
    return {
        success: path.length > 0,
        path: path,
        distance: distances.get(end),
        steps: steps
    };
}`,
    
    minimum_spanning_tree: `// Prim's MST Algorithm
primsMST() {
    if (this.vertices.size === 0) {
        return { success: false, message: 'Graph is empty', steps: 1 };
    }
    
    const mstEdges = [];
    const visited = new Set();
    const pq = new PriorityQueue();
    let totalCost = 0;
    let steps = 1;
    
    const startVertex = this.vertices.values().next().value;
    visited.add(startVertex); // 1 step
    steps++;
    
    // Add all edges from start vertex
    const startNeighbors = this.edges.get(startVertex);
    for (const neighbor of startNeighbors) {
        const weight = this.weights.get(\`\${startVertex},\${neighbor}\`) || 1; // 1 step
        pq.enqueue([startVertex, neighbor], weight); // 1 step
        steps += 2;
    }
    
    while (!pq.isEmpty() && visited.size < this.vertices.size) {
        const { element: edge, priority: weight } = pq.dequeue(); // 1 step
        const [from, to] = edge;
        steps++;
        
        if (!visited.has(to)) {
            visited.add(to); // 1 step
            mstEdges.push({ from, to, weight }); // 1 step
            totalCost += weight; // 1 step
            steps += 3;
            
            // Add new edges to priority queue
            const neighbors = this.edges.get(to);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const edgeWeight = this.weights.get(\`\${to},\${neighbor}\`) || 1; // 1 step
                    pq.enqueue([to, neighbor], edgeWeight); // 1 step
                    steps += 2;
                }
            }
        }
    }
    
    return {
        success: visited.size === this.vertices.size,
        mstEdges: mstEdges,
        cost: totalCost,
        steps: steps
    };
}`,
    
    kruskals_mst: `// Kruskal's MST Algorithm
kruskalsMST() {
    // Collect all edges
    const allEdges = [];
    const seen = new Set();
    let steps = 1;
    
    for (const [from, neighbors] of this.edges) {
        for (const to of neighbors) {
            const edgeKey = [from, to].sort().join('-');
            if (!seen.has(edgeKey)) {
                seen.add(edgeKey); // 1 step
                const weight = this.weights.get(\`\${from},\${to}\`) || 1; // 1 step
                allEdges.push({ from, to, weight }); // 1 step
                steps += 3;
            }
        }
    }
    
    // Sort edges by weight
    allEdges.sort((a, b) => a.weight - b.weight); // O(E log E) steps
    steps += allEdges.length * Math.log2(allEdges.length);
    
    // Union-Find structure
    const parent = new Map();
    const rank = new Map();
    
    for (const vertex of this.vertices) {
        parent.set(vertex, vertex); // 1 step
        rank.set(vertex, 0); // 1 step
        steps += 2;
    }
    
    const find = (vertex) => {
        if (parent.get(vertex) !== vertex) {
            parent.set(vertex, find(parent.get(vertex))); // 1 step + recursive
        }
        return parent.get(vertex);
    };
    
    const union = (v1, v2) => {
        const root1 = find(v1);
        const root2 = find(v2);
        
        if (root1 !== root2) {
            const rank1 = rank.get(root1);
            const rank2 = rank.get(root2);
            
            if (rank1 < rank2) {
                parent.set(root1, root2); // 1 step
            } else if (rank1 > rank2) {
                parent.set(root2, root1); // 1 step
            } else {
                parent.set(root2, root1); // 1 step
                rank.set(root1, rank1 + 1); // 1 step
            }
            steps += 2;
            return true;
        }
        return false;
    };
    
    const mstEdges = [];
    let totalCost = 0;
    
    for (const edge of allEdges) {
        if (union(edge.from, edge.to)) {
            mstEdges.push(edge); // 1 step
            totalCost += edge.weight; // 1 step
            steps += 2;
            
            if (mstEdges.length === this.vertices.size - 1) {
                break;
            }
        }
    }
    
    return {
        success: mstEdges.length === this.vertices.size - 1,
        mstEdges: mstEdges,
        cost: totalCost,
        steps: steps
    };
}`,
    
    topological_sort: `// Topological Sort Algorithm
topologicalSort() {
    if (!this.isDirected) {
        return { success: false, message: 'Topological sort requires directed graph', steps: 1 };
    }
    
    const inDegree = new Map();
    const queue = [];
    const result = [];
    let steps = 1;
    
    // Calculate in-degrees
    for (const vertex of this.vertices) {
        inDegree.set(vertex, 0); // 1 step
        steps++;
    }
    
    for (const [from, neighbors] of this.edges) {
        for (const to of neighbors) {
            inDegree.set(to, inDegree.get(to) + 1); // 1 step
            steps++;
        }
    }
    
    // Find vertices with zero in-degree
    for (const [vertex, degree] of inDegree) {
        if (degree === 0) {
            queue.push(vertex); // 1 step
            steps++;
        }
    }
    
    // Process queue
    while (queue.length > 0) {
        const current = queue.shift(); // 1 step
        result.push(current); // 1 step
        steps += 2;
        
        const neighbors = this.edges.get(current);
        for (const neighbor of neighbors) {
            inDegree.set(neighbor, inDegree.get(neighbor) - 1); // 1 step
            steps++;
            
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor); // 1 step
                steps++;
            }
        }
    }
    
    return {
        success: result.length === this.vertices.size,
        topoOrder: result,
        steps: steps
    };
}`
};
