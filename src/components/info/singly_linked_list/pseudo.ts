const insert = `INSERT Operation Pseudocode

INSERT_AT_BEGINNING(value):
    new_node ← CREATE_NODE(value)
    new_node.next ← head        // 1 step
    head ← new_node             // 1 step
    size ← size + 1            // 1 step
    RETURN success

INSERT_AT_END(value):
    new_node ← CREATE_NODE(value)
    
    IF head = null:
        head ← new_node        // 1 step
    ELSE:
        current ← head
        WHILE current.next ≠ null:  // n steps
            current ← current.next
        current.next ← new_node    // 1 step
    END IF
    
    size ← size + 1            // 1 step
    RETURN success`;

const del = `DELETE Operation Pseudocode

DELETE_BY_VALUE(value):
    IF head = null:
        RETURN failure
    
    // Case 1: Delete head
    IF head.value = value:
        head ← head.next        // 1 step
        size ← size - 1
        RETURN success
    
    // Case 2: Delete middle or end
    current ← head
    WHILE current.next ≠ null AND current.next.value ≠ value:
        current ← current.next  // Up to n steps
    
    IF current.next ≠ null:
        current.next ← current.next.next  // 1 step
        size ← size - 1
        RETURN success
    
    RETURN failure`;

const search = `SEARCH Operation Pseudocode

LINEAR_SEARCH(value):
    current ← head
    position ← 0
    steps ← 0
    
    WHILE current ≠ null:
        steps ← steps + 1
        IF current.value = value:    // 1 comparison
            RETURN success, position, steps
        END IF
        current ← current.next        // 1 step
        position ← position + 1
    END WHILE
    
    RETURN failure, steps`;

const reverse = `REVERSE Operation Pseudocode

REVERSE_LIST():
    prev ← null
    current ← head
    next ← null
    steps ← 0
    
    WHILE current ≠ null:
        next ← current.next        // 1 step
        current.next ← prev        // 1 step
        prev ← current             // 1 step
        current ← next            // 1 step
        steps ← steps + 4
    END WHILE
    
    head ← prev                    // 1 step
    RETURN success, steps + 1`;

const get_middle = `GET MIDDLE Operation Pseudocode

GET_MIDDLE_ELEMENT():
    IF head = null:
        RETURN failure
    
    slow ← head                   // 1 step
    fast ← head                   // 1 step
    steps ← 2
    
    WHILE fast ≠ null AND fast.next ≠ null:
        slow ← slow.next          // 1 step
        fast ← fast.next.next     // 2 steps
        steps ← steps + 3
    END WHILE
    
    RETURN success, slow.value, steps`;

const detect_cycle = `DETECT CYCLE Operation Pseudocode

FLOYD_CYCLE_DETECTION():
    IF head = null:
        RETURN success, no_cycle
    
    slow ← head                   // 1 step
    fast ← head                   // 1 step
    steps ← 2
    
    WHILE fast ≠ null AND fast.next ≠ null:
        slow ← slow.next          // 1 step
        fast ← fast.next.next     // 2 steps
        steps ← steps + 3
        
        IF slow = fast:          // 1 comparison
            RETURN success, cycle_detected, steps
        END IF
    END WHILE
    
    RETURN success, no_cycle, steps`;

const remove_duplicates = `REMOVE DUPLICATES Operation Pseudocode

REMOVE_DUPLICATES():
    IF head = null:
        RETURN success
    
    seen ← empty hash set         // 1 step
    current ← head                // 1 step
    prev ← null                   // 1 step
    removed_count ← 0
    steps ← 3
    
    WHILE current ≠ null:
        IF current.value IN seen:
            prev.next ← current.next    // 1 step
            removed_count ← removed_count + 1
            size ← size - 1
        ELSE:
            ADD current.value TO seen   // 1 step
            prev ← current             // 1 step
        END IF
        current ← current.next          // 1 step
        steps ← steps + 3
    END WHILE
    
    RETURN success, removed_count, steps`;

export const pseudo = {
  full: `Singly Linked List Operations

1. INSERT Operation:
   - Create new node with given value
   - IF position = beginning:
       * new_node.next ← head
       * head ← new_node
   - ELSE IF position = end:
       * IF head = null:
           head ← new_node
       * ELSE:
           current ← head
           WHILE current.next ≠ null:
               current ← current.next
           current.next ← new_node
   - size ← size + 1
   - RETURN success

2. DELETE Operation:
   - IF head = null:
       RETURN failure (list empty)
   - IF head.value = target:
       head ← head.next
       size ← size - 1
       RETURN success
   - current ← head
   - WHILE current.next ≠ null AND current.next.value ≠ target:
       current ← current.next
   - IF current.next ≠ null:
       current.next ← current.next.next
       size ← size - 1
       RETURN success
   - ELSE:
       RETURN failure (value not found)

3. SEARCH Operation:
   - current ← head
   - position ← 0
   - WHILE current ≠ null:
       - IF current.value = target:
           RETURN success, position
       - current ← current.next
       - position ← position + 1
   - RETURN failure (not found)

4. REVERSE Operation:
   - prev ← null
   - current ← head
   - next ← null
   - WHILE current ≠ null:
       - next ← current.next
       - current.next ← prev
       - prev ← current
       - current ← next
   - head ← prev
   - RETURN success

5. GET MIDDLE Element:
   - IF head = null:
       RETURN failure
   - slow ← head
   - fast ← head
   - WHILE fast ≠ null AND fast.next ≠ null:
       - slow ← slow.next
       - fast ← fast.next.next
   - RETURN success, slow.value

6. DETECT CYCLE:
   - IF head = null:
       RETURN success, no_cycle
   - slow ← head
   - fast ← head
   - WHILE fast ≠ null AND fast.next ≠ null:
       - slow ← slow.next
       - fast ← fast.next.next
       - IF slow = fast:
           RETURN success, cycle_detected
   - RETURN success, no_cycle

7. REMOVE DUPLICATES:
   - IF head = null:
       RETURN success
   - seen ← empty hash set
   - current ← head
   - prev ← null
   - removed_count ← 0
   - WHILE current ≠ null:
       - IF current.value IN seen:
           prev.next ← current.next
           removed_count ← removed_count + 1
           size ← size - 1
       - ELSE:
           ADD current.value TO seen
           prev ← current
       - current ← current.next
   - RETURN success, removed_count

Time Complexity:
- Insert (beginning): O(1)
- Insert (end): O(n)
- Delete: O(n)
- Search: O(n)
- Reverse: O(n)
- Get Middle: O(n)
- Detect Cycle: O(n)
- Remove Duplicates: O(n)

Space Complexity:
- All operations: O(1) additional space
- Remove Duplicates: O(n) for hash set`,
  insert,
  delete: del,
  search,
  reverse,
  get_middle,
  detect_cycle,
  remove_duplicates
};