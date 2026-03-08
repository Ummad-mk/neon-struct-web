export const pseudo = {
  full: `Priority Queue Operations (Min-Heap)

1. ENQUEUE(value, priority):
   - heap.push({value, priority})
   - i ← last index
   - WHILE i > 0 AND heap[i].priority < heap[parent(i)].priority:
       SWAP heap[i], heap[parent(i)]
       i ← parent(i)

2. DEQUEUE():
   - IF heap is empty: RETURN failure
   - min ← heap[0]
   - heap[0] ← heap[last]
   - heap.pop()
   - HEAPIFY_DOWN(0)
   - RETURN min

3. PEEK():
   - IF heap is empty: RETURN failure
   - RETURN heap[0]

4. CHANGE_PRIORITY(value, newPriority):
   - FIND index i where heap[i].value = value
   - IF not found: RETURN failure
   - oldPriority ← heap[i].priority
   - heap[i].priority ← newPriority
   - IF newPriority < oldPriority: HEAPIFY_UP(i)
   - ELSE: HEAPIFY_DOWN(i)

5. SEARCH(value):
   - FOR each item in heap:
       IF item.value = value: RETURN success
   - RETURN failure
`
};
