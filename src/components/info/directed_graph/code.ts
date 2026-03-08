export const code = {
  full: `// Directed Graph Implementation using Adjacency List
class DirectedGraph {
    constructor() {
        this.vertices = new Set();
        this.edges = new Map(); // vertex -> array of neighbors
        this.weights = new Map(); // (vertex1, vertex2) -> weight
        this.isDirected = true;
    }

    // Add vertex
    addVertex(vertex) {
        this.vertices.add(vertex);     // 1 step
        if (!this.edges.has(vertex)) {
            this.edges.set(vertex, []); // 1 step
        }
        return { success: true, steps: 2 };
    }

    // Add directed edge
    addEdge(from, to, weight = 1) {
        // Add vertices if they don't exist
        this.addVertex(from);
        this.addVertex(to);
        
        // Add directed edge (only one direction)
        this.edges.get(from).push(to);        // 1 step
        this.weights.set(\`\${from},\${to}\`, weight); // 1 step
        
        return { success: true, steps: 4 };
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

    // Topological Sort
    topologicalSort() {
        if (this.vertices.size === 0) {
            return { success: false, message: 'Graph is empty', steps: 1 };
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
    }

    // Detect Cycle
    detectCycle() {
        const visited = new Set();
        const recStack = new Set();
        let steps = 0;
        
        const dfsCycle = (vertex) => {
            visited.add(vertex);     // 1 step
            recStack.add(vertex);    // 1 step
            steps += 2;
            
            for (const neighbor of this.edges.get(vertex)) {
                steps += 2; // check + call
                if (!visited.has(neighbor)) {
                    if (dfsCycle(neighbor)) {
                        return true;
                    }
                } else if (recStack.has(neighbor)) {
                    return true; // Cycle detected
                }
            }
            
            recStack.delete(vertex); // 1 step
            steps++;
            return false;
        };
        
        for (const vertex of this.vertices) {
            if (!visited.has(vertex)) {
                if (dfsCycle(vertex)) {
                    return { success: true, has_cycle: true, steps: steps };
                }
            }
        }
        
        return { success: true, has_cycle: false, steps: steps };
    }
}

// Priority Queue for Dijkstra's algorithm
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
}`,

  add_edge: `// Add Directed Edge Operation
addEdge(from, to, weight = 1) {
    // Add vertices if they don't exist
    this.addVertex(from);
    this.addVertex(to);
    
    // Add directed edge (only one direction)
    this.edges.get(from).push(to);        // 1 step
    this.weights.set(\`\${from},\${to}\`, weight); // 1 step
    
    return { success: true, steps: 4 };
}`,

  delete_edge: `// Delete Directed Edge Operation
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
    
    return {
        success: distances.get(end) !== Infinity,
        distance: distances.get(end),
        steps: steps
    };
}`,

  topological_sort: `// Topological Sort Algorithm
topologicalSort() {
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
}`,

  detect_cycle: `// Detect Cycle in Directed Graph
detectCycle() {
    const visited = new Set();
    const recStack = new Set();
    let steps = 0;
    
    const dfsCycle = (vertex) => {
        visited.add(vertex);     // 1 step
        recStack.add(vertex);    // 1 step
        steps += 2;
        
        for (const neighbor of this.edges.get(vertex)) {
            steps += 2; // check + call
            if (!visited.has(neighbor)) {
                if (dfsCycle(neighbor)) {
                    return true;
                }
            } else if (recStack.has(neighbor)) {
                return true; // Cycle detected
            }
        }
        
        recStack.delete(vertex); // 1 step
        steps++;
        return false;
    };
    
    for (const vertex of this.vertices) {
        if (!visited.has(vertex)) {
            if (dfsCycle(vertex)) {
                return { success: true, has_cycle: true, steps: steps };
            }
        }
    }
    
    return { success: true, has_cycle: false, steps: steps };
}`
};
