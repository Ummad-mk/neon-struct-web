export const code = {
  full: `// Queue Implementation using Linked List
class QueueNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class Queue {
    constructor() {
        this.front = null;
        this.rear = null;
        this.size = 0;
    }

    // Enqueue operation - Add element to rear
    enqueue(value) {
        const newNode = new QueueNode(value);
        
        if (this.isEmpty()) {
            this.front = newNode;    // 1 step
            this.rear = newNode;     // 1 step
        } else {
            this.rear.next = newNode; // 1 step
            this.rear = newNode;     // 1 step
        }
        
        this.size++;               // 1 step
        return { success: true, steps: this.isEmpty() ? 3 : 4 };
    }

    // Dequeue operation - Remove and return front element
    dequeue() {
        if (this.isEmpty()) {
            return { success: false, message: 'Queue is empty', steps: 1 };
        }
        
        const value = this.front.value;  // 1 step
        this.front = this.front.next;    // 1 step
        
        if (this.front === null) {
            this.rear = null;           // 1 step (queue becomes empty)
        }
        
        this.size--;                    // 1 step
        return { success: true, value, steps: 4 };
    }

    // Peek operation - Return front element without removing
    peek() {
        if (this.isEmpty()) {
            return { success: false, message: 'Queue is empty', steps: 1 };
        }
        
        return { success: true, value: this.front.value, steps: 1 };
    }

    // Check if queue is empty
    isEmpty() {
        return this.front === null;  // 1 step
    }

    // Get current size
    getSize() {
        return this.size;  // 1 step
    }

    // Clear all elements
    clear() {
        this.front = null;  // 1 step
        this.rear = null;   // 1 step
        this.size = 0;     // 1 step
        return { success: true, steps: 3 };
    }
}

// Queue Implementation using Array (Circular Queue)
class CircularQueue {
    constructor(capacity) {
        this.items = new Array(capacity);
        this.capacity = capacity;
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    enqueue(value) {
        if (this.isFull()) {
            return { success: false, message: 'Queue is full', steps: 1 };
        }
        
        this.rear = (this.rear + 1) % this.capacity;  // 1 step
        this.items[this.rear] = value;                // 1 step
        this.size++;                                  // 1 step
        return { success: true, steps: 3 };
    }

    dequeue() {
        if (this.isEmpty()) {
            return { success: false, message: 'Queue is empty', steps: 1 };
        }
        
        const value = this.items[this.front];           // 1 step
        this.front = (this.front + 1) % this.capacity; // 1 step
        this.size--;                                  // 1 step
        return { success: true, value, steps: 3 };
    }

    peek() {
        if (this.isEmpty()) {
            return { success: false, message: 'Queue is empty', steps: 1 };
        }
        
        return { success: true, value: this.items[this.front], steps: 1 };
    }

    isEmpty() {
        return this.size === 0;  // 1 step
    }

    isFull() {
        return this.size === this.capacity;  // 1 step
    }
}`,

  enqueue: `// Enqueue Operation - Add element to rear of queue
enqueue(value) {
    const newNode = new QueueNode(value);
    
    if (this.isEmpty()) {
        this.front = newNode;    // 1 step: First element
        this.rear = newNode;     // 1 step: Both front and rear point to new node
    } else {
        this.rear.next = newNode; // 1 step: Link current rear to new node
        this.rear = newNode;     // 1 step: Update rear to new node
    }
    
    this.size++;               // 1 step: Increment size
    return { success: true, steps: this.isEmpty() ? 3 : 4 };
}

// Circular Array Implementation
enqueue(value) {
    if (this.isFull()) {
        return { success: false, message: 'Queue is full', steps: 1 };
    }
    
    this.rear = (this.rear + 1) % this.capacity;  // 1 step: Circular increment
    this.items[this.rear] = value;                // 1 step: Insert at rear
    this.size++;                                  // 1 step: Increment size
    return { success: true, steps: 3 };
}`,

  dequeue: `// Dequeue Operation - Remove and return front element
dequeue() {
    if (this.isEmpty()) {
        return { success: false, message: 'Queue is empty', steps: 1 };
    }
    
    const value = this.front.value;  // 1 step: Store front value
    this.front = this.front.next;    // 1 step: Move front to next
    
    if (this.front === null) {
        this.rear = null;           // 1 step: Queue becomes empty
    }
    
    this.size--;                    // 1 step: Decrement size
    return { success: true, value, steps: 4 };
}

// Circular Array Implementation
dequeue() {
    if (this.isEmpty()) {
        return { success: false, message: 'Queue is empty', steps: 1 };
    }
    
    const value = this.items[this.front];           // 1 step: Get front value
    this.front = (this.front + 1) % this.capacity; // 1 step: Circular increment
    this.size--;                                  // 1 step: Decrement size
    return { success: true, value, steps: 3 };
}`,

  peek: `// Peek Operation - Return front element without removing
peek() {
    if (this.isEmpty()) {
        return { success: false, message: 'Queue is empty', steps: 1 };
    }
    
    return { success: true, value: this.front.value, steps: 1 };
}

// Circular Array Implementation
peek() {
    if (this.isEmpty()) {
        return { success: false, message: 'Queue is empty', steps: 1 };
    }
    
    return { success: true, value: this.items[this.front], steps: 1 };
}`,

  is_empty: `// isEmpty Operation - Check if queue has no elements
isEmpty() {
    return this.front === null;  // 1 step: Check if front is null
}

// Circular Array Implementation
isEmpty() {
    return this.size === 0;  // 1 step: Check size counter`
};
