export const code = {
  full: `// Priority Queue (Min-Heap) Implementation
class PriorityQueue {
    constructor() {
        this.heap = [];
        this.counter = 0;
    }

    enqueue(value, priority) {
        const item = { value, priority, order: this.counter++ };
        this.heap.push(item);
        this._heapifyUp(this.heap.length - 1);
        return { success: true };
    }

    dequeue() {
        if (this.heap.length === 0) {
            return { success: false, message: 'Priority queue is empty' };
        }
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._heapifyDown(0);
        }
        return { success: true, value: min.value, priority: min.priority };
    }

    peek() {
        if (this.heap.length === 0) {
            return { success: false, message: 'Priority queue is empty' };
        }
        const min = this.heap[0];
        return { success: true, value: min.value, priority: min.priority };
    }

    changePriority(value, newPriority) {
        const idx = this.heap.findIndex(item => item.value === value);
        if (idx === -1) return { success: false, message: 'Not found' };
        const oldPriority = this.heap[idx].priority;
        this.heap[idx].priority = newPriority;
        if (newPriority < oldPriority) this._heapifyUp(idx);
        else this._heapifyDown(idx);
        return { success: true };
    }

    _heapifyUp(i) {
        while (i > 0) {
            const p = Math.floor((i - 1) / 2);
            if (this._compare(this.heap[i], this.heap[p]) < 0) {
                [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
                i = p;
            } else break;
        }
    }

    _heapifyDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1;
            const r = 2 * i + 2;
            if (l < n && this._compare(this.heap[l], this.heap[smallest]) < 0) smallest = l;
            if (r < n && this._compare(this.heap[r], this.heap[smallest]) < 0) smallest = r;
            if (smallest !== i) {
                [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
                i = smallest;
            } else break;
        }
    }

    _compare(a, b) {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.order - b.order;
    }
}`,

  insert: `// Enqueue (Insert) Operation
enqueue(value, priority) {
    const item = { value, priority };
    heap.push(item);
    heapifyUp();
    return success;
}`,

  delete: `// Dequeue (Remove Min) Operation
dequeue() {
    if (heap is empty) return failure;
    min = heap[0];
    move last to root;
    heapifyDown();
    return min;
}`,

  peek: `// Peek Operation
peek() {
    if (heap is empty) return failure;
    return heap[0];
}`,

  change_priority: `// Change Priority Operation
changePriority(value, newPriority) {
    find value;
    update priority;
    heapifyUp or heapifyDown;
}`,

  search: `// Search Operation
search(value) {
    scan heap for value;
}`
};
