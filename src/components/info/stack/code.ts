export const code = {
  full: `// Stack Implementation using Linked List
class StackNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class Stack {
    constructor() {
        this.top = null;
        this.size = 0;
    }

    // Push operation - Add element to top
    push(value) {
        const newNode = new StackNode(value);
        newNode.next = this.top;    // 1 step
        this.top = newNode;         // 1 step
        this.size++;               // 1 step
        return { success: true, steps: 3 };
    }

    // Pop operation - Remove and return top element
    pop() {
        if (this.isEmpty()) {
            return { success: false, message: 'Stack is empty', steps: 1 };
        }
        
        const value = this.top.value;  // 1 step
        this.top = this.top.next;      // 1 step
        this.size--;                  // 1 step
        return { success: true, value, steps: 3 };
    }

    // Peek operation - Return top element without removing
    peek() {
        if (this.isEmpty()) {
            return { success: false, message: 'Stack is empty', steps: 1 };
        }
        
        return { success: true, value: this.top.value, steps: 1 };
    }

    // Check if stack is empty
    isEmpty() {
        return this.top === null;  // 1 step
    }

    // Get current size
    getSize() {
        return this.size;  // 1 step
    }

    // Clear all elements
    clear() {
        this.top = null;   // 1 step
        this.size = 0;    // 1 step
        return { success: true, steps: 2 };
    }
}

// Stack Implementation using Array
class ArrayStack {
    constructor() {
        this.items = [];
        this.size = 0;
    }

    push(value) {
        this.items.push(value);  // 1 step
        this.size++;            // 1 step
        return { success: true, steps: 2 };
    }

    pop() {
        if (this.isEmpty()) {
            return { success: false, message: 'Stack is empty', steps: 1 };
        }
        
        const value = this.items.pop();  // 1 step
        this.size--;                   // 1 step
        return { success: true, value, steps: 2 };
    }

    peek() {
        if (this.isEmpty()) {
            return { success: false, message: 'Stack is empty', steps: 1 };
        }
        
        return { success: true, value: this.items[this.items.length - 1], steps: 1 };
    }

    isEmpty() {
        return this.items.length === 0;  // 1 step
    }

    getSize() {
        return this.size;  // 1 step
    }

    clear() {
        this.items = [];  // 1 step
        this.size = 0;   // 1 step
        return { success: true, steps: 2 };
    }
}`,

  push: `// Push Operation - Add element to top of stack
push(value) {
    const newNode = new StackNode(value);
    newNode.next = this.top;    // 1 step: Point new node to current top
    this.top = newNode;         // 1 step: Update top to new node
    this.size++;               // 1 step: Increment size
    return { success: true, steps: 3 };
}

// Array Implementation
push(value) {
    this.items.push(value);  // 1 step: Add to end of array
    this.size++;            // 1 step: Increment size
    return { success: true, steps: 2 };
}`,

  pop: `// Pop Operation - Remove and return top element
pop() {
    if (this.isEmpty()) {
        return { success: false, message: 'Stack is empty', steps: 1 };
    }
    
    const value = this.top.value;  // 1 step: Store top value
    this.top = this.top.next;      // 1 step: Move top to next node
    this.size--;                  // 1 step: Decrement size
    return { success: true, value, steps: 3 };
}

// Array Implementation
pop() {
    if (this.isEmpty()) {
        return { success: false, message: 'Stack is empty', steps: 1 };
    }
    
    const value = this.items.pop();  // 1 step: Remove last element
    this.size--;                   // 1 step: Decrement size
    return { success: true, value, steps: 2 };
}`,

  peek: `// Peek Operation - Return top element without removing
peek() {
    if (this.isEmpty()) {
        return { success: false, message: 'Stack is empty', steps: 1 };
    }
    
    return { success: true, value: this.top.value, steps: 1 };
}

// Array Implementation
peek() {
    if (this.isEmpty()) {
        return { success: false, message: 'Stack is empty', steps: 1 };
    }
    
    return { success: true, value: this.items[this.items.length - 1], steps: 1 };
}`,

  is_empty: `// isEmpty Operation - Check if stack has no elements
isEmpty() {
    return this.top === null;  // 1 step: Check if top is null
}

// Array Implementation
isEmpty() {
    return this.items.length === 0;  // 1 step: Check array length
}`
};
