export const code = {
  full: `// Singly Linked List Implementation
class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class SinglyLinkedList {
    constructor() {
        this.head = null;
        this.size = 0;
    }

    // Insert at beginning
    insert(value, position = 'beginning') {
        const newNode = new Node(value);
        
        if (position === 'beginning') {
            newNode.next = this.head;
            this.head = newNode;
        } else if (position === 'end') {
            if (!this.head) {
                this.head = newNode;
            } else {
                let current = this.head;
                while (current.next) {
                    current = current.next;
                }
                current.next = newNode;
            }
        }
        
        this.size++;
        return { success: true, steps: 1 };
    }

    // Delete by value
    delete(value) {
        if (!this.head) return { success: false, message: 'List is empty' };
        
        if (this.head.value === value) {
            this.head = this.head.next;
            this.size--;
            return { success: true, steps: 1 };
        }
        
        let current = this.head;
        while (current.next && current.next.value !== value) {
            current = current.next;
        }
        
        if (current.next) {
            current.next = current.next.next;
            this.size--;
            return { success: true, steps: 2 };
        }
        
        return { success: false, message: 'Value not found' };
    }

    // Search for value
    search(value) {
        let current = this.head;
        let position = 0;
        
        while (current) {
            if (current.value === value) {
                return { success: true, found: value, position, steps: position + 1 };
            }
            current = current.next;
            position++;
        }
        
        return { success: false, message: 'Value not found', steps: position };
    }

    // Reverse the list
    reverse() {
        let prev = null;
        let current = this.head;
        let next = null;
        let steps = 0;
        
        while (current) {
            next = current.next;
            current.next = prev;
            prev = current;
            current = next;
            steps++;
        }
        
        this.head = prev;
        return { success: true, steps };
    }

    // Find middle element
    getMiddle() {
        if (!this.head) return { success: false, message: 'List is empty' };
        
        let slow = this.head;
        let fast = this.head;
        let steps = 0;
        
        while (fast && fast.next) {
            slow = slow.next;
            fast = fast.next.next;
            steps++;
        }
        
        return { success: true, middle_value: slow.value, steps };
    }

    // Detect cycle using Floyd's algorithm
    detectCycle() {
        if (!this.head) return { success: true, has_cycle: false };
        
        let slow = this.head;
        let fast = this.head;
        let steps = 0;
        
        while (fast && fast.next) {
            slow = slow.next;
            fast = fast.next.next;
            steps++;
            
            if (slow === fast) {
                return { success: true, has_cycle: true, steps };
            }
        }
        
        return { success: true, has_cycle: false, steps };
    }

    // Remove duplicates
    removeDuplicates() {
        if (!this.head) return { success: true, removed_count: 0 };
        
        const seen = new Set();
        let current = this.head;
        let prev = null;
        let removedCount = 0;
        let steps = 0;
        
        while (current) {
            steps++;
            if (seen.has(current.value)) {
                prev.next = current.next;
                removedCount++;
                this.size--;
            } else {
                seen.add(current.value);
                prev = current;
            }
            current = current.next;
        }
        
        return { success: true, removed_count: removedCount, steps };
    }
}`,
  insert: `// Insert Operation - Beginning of List
insertAtBeginning(value) {
    const newNode = new Node(value);
    newNode.next = this.head;  // 1 step
    this.head = newNode;        // 1 step
    this.size++;                // 1 step
    return { success: true, steps: 3 };
}

// Insert Operation - End of List
insertAtEnd(value) {
    const newNode = new Node(value);
    
    if (!this.head) {
        this.head = newNode;    // 1 step
    } else {
        let current = this.head;
        while (current.next) {  // n steps
            current = current.next;
        }
        current.next = newNode; // 1 step
    }
    
    this.size++;                // 1 step
    return { success: true, steps: n + 2 };
}`,
  delete: `// Delete Operation - By Value
deleteByValue(value) {
    if (!this.head) return { success: false };
    
    // Case 1: Delete head
    if (this.head.value === value) {
        this.head = this.head.next;  // 1 step
        this.size--;
        return { success: true, steps: 1 };
    }
    
    // Case 2: Delete middle or end
    let current = this.head;
    while (current.next && current.next.value !== value) {
        current = current.next;      // Up to n steps
    }
    
    if (current.next) {
        current.next = current.next.next;  // 1 step
        this.size--;
        return { success: true, steps: n };
    }
    
    return { success: false };
}`,
  search: `// Search Operation - Linear Search
search(value) {
    let current = this.head;
    let position = 0;
    
    while (current) {
        if (current.value === value) {  // 1 comparison per step
            return { success: true, position, steps: position + 1 };
        }
        current = current.next;        // 1 step
        position++;
    }
    
    return { success: false, steps: position };
}`,
  reverse: `// Reverse Operation - Three Pointer Method
reverseList() {
    let prev = null;
    let current = this.head;
    let next = null;
    let steps = 0;
    
    while (current) {
        next = current.next;      // 1 step
        current.next = prev;      // 1 step
        prev = current;           // 1 step
        current = next;           // 1 step
        steps += 4;
    }
    
    this.head = prev;             // 1 step
    return { success: true, steps: steps + 1 };
}`,
  get_middle: `// Get Middle Element - Tortoise and Hare Algorithm
getMiddleElement() {
    if (!this.head) return { success: false };
    
    let slow = this.head;        // 1 step
    let fast = this.head;        // 1 step
    let steps = 2;
    
    while (fast && fast.next) {
        slow = slow.next;        // 1 step
        fast = fast.next.next;   // 2 steps
        steps += 3;
    }
    
    return { success: true, middle_value: slow.value, steps };
}`,
  detect_cycle: `// Detect Cycle - Floyd's Cycle Detection Algorithm
detectCycle() {
    if (!this.head) return { success: true, has_cycle: false };
    
    let slow = this.head;        // 1 step
    let fast = this.head;        // 1 step
    let steps = 2;
    
    while (fast && fast.next) {
        slow = slow.next;        // 1 step
        fast = fast.next.next;   // 2 steps
        steps += 3;
        
        if (slow === fast) {     // 1 comparison
            return { success: true, has_cycle: true, steps };
        }
    }
    
    return { success: true, has_cycle: false, steps };
}`,
  remove_duplicates: `// Remove Duplicates - Using Hash Set
removeDuplicates() {
    if (!this.head) return { success: true };
    
    const seen = new Set();      // 1 step
    let current = this.head;     // 1 step
    let prev = null;             // 1 step
    let removedCount = 0;
    let steps = 3;
    
    while (current) {
        if (seen.has(current.value)) {
            prev.next = current.next;  // 1 step
            removedCount++;
            this.size--;
        } else {
            seen.add(current.value);    // 1 step
            prev = current;             // 1 step
        }
        current = current.next;        // 1 step
        steps += 3;
    }
    
    return { success: true, removed_count: removedCount, steps };
}`
};