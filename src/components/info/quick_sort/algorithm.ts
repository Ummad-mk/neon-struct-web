export const algorithm = {
  full: `
# QuickSort Algorithm

## Overview
QuickSort is a highly efficient, divide-and-conquer sorting algorithm that works by selecting a 'pivot' element and partitioning the array around it.

## How It Works

### 1. Pivot Selection
Choose an element from the array to be the pivot. Common strategies:
- **First element**: Always pick the first element
- **Last element**: Always pick the last element  
- **Median-of-three**: Pick median of first, middle, and last
- **Random**: Pick a random element

### 2. Partitioning
Rearrange the array so that:
- Elements smaller than pivot are on the left
- Elements greater than pivot are on the right
- The pivot is in its final sorted position

### 3. Recursion
Recursively apply QuickSort to the left and right subarrays.

## Time Complexity

| Case | Time | Description |
|------|------|-------------|
| Best | O(n log n) | Pivot always lands in middle |
| Average | O(n log n) | Random data distribution |
| Worst | O(n²) | Pivot always at extreme (sorted data + first/last pivot) |

## Space Complexity
- **O(log n)** for the recursion stack (best/average case)
- **O(n)** for worst case (deep recursion)

## Partition Schemes

### Lomuto Partition
- Uses one pointer scanning left to right
- Simpler to understand
- More swaps on average

### Hoare Partition  
- Uses two pointers approaching from both ends
- Fewer swaps
- Original QuickSort scheme

## Key Advantages
- In-place sorting (no extra array needed)
- Excellent average-case performance
- Cache-friendly due to sequential memory access
- Naturally recursive

## Key Disadvantages
- Worst-case O(n²) with bad pivot choices
- Not stable (equal elements may change relative order)
- Performance depends heavily on pivot selection
`,

  quickSort: `
# QuickSort

## Algorithm Steps

1. **Base Case**: If array has 0 or 1 elements, it's already sorted
2. **Select Pivot**: Choose an element from the array
3. **Partition**: Rearrange so elements < pivot are left, elements > pivot are right
4. **Recurse**: Apply QuickSort to left and right subarrays

## Partition Process (Lomuto)

\`\`\`
partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j = low to high-1:
        if arr[j] <= pivot:
            i = i + 1
            swap(arr[i], arr[j])
    
    swap(arr[i+1], arr[high])
    return i + 1
\`\`\`

## Partition Process (Hoare)

\`\`\`
partition(arr, low, high):
    pivot = arr[low]
    i = low - 1
    j = high + 1
    
    while True:
        do i = i + 1 while arr[i] < pivot
        do j = j - 1 while arr[j] > pivot
        
        if i >= j:
            return j
        
        swap(arr[i], arr[j])
\`\`\`
`,

  partition: `
# Partition Operation

## Purpose
Partition rearranges elements around the pivot, placing it in its final sorted position.

## Lomuto Scheme
- Easier to implement
- Pivot goes to the end of the left partition
- Good for small arrays

## Hoare Scheme  
- Fewer swaps than Lomuto
- Pivot may not end up at its final position immediately
- Better for large arrays

## Example (Lomuto)

Array: [7, 2, 1, 6, 8, 5, 3, 4], Pivot = 4

Step 1: Move pivot to end (swap with last)
Array: [7, 2, 1, 6, 8, 5, 3, **4**]

Step 2: Scan and partition
- i = -1 (tracks boundary)
- Traverse array, moving elements <= pivot left

Final: [2, 1, 3, **4**, 8, 5, 6, 7]

Step 3: Place pivot in correct position
Array: [2, 1, 3, **4**, 8, 5, 6, 7]
`,
};
