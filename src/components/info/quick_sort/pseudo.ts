export const pseudo = {
  full: `
# QuickSort Pseudocode

## Main QuickSort Function

\`\`\`
function quickSort(arr, low, high):
    if low < high:
        pivotIndex = partition(arr, low, high)
        quickSort(arr, low, pivotIndex - 1)
        quickSort(arr, pivotIndex + 1, high)
\`\`\`

## Lomuto Partition

\`\`\`
function partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j = low to high - 1:
        if arr[j] <= pivot:
            i = i + 1
            swap(arr[i], arr[j])
    
    swap(arr[i + 1], arr[high])
    return i + 1
\`\`\`

## Hoare Partition

\`\`\`
function partitionHoare(arr, low, high):
    pivot = arr[low]
    i = low - 1
    j = high + 1
    
    loop:
        do i = i + 1 while arr[i] < pivot
        do j = j - 1 while arr[j] > pivot
        
        if i >= j:
            return j
        
        swap(arr[i], arr[j])
\`\`\`

## QuickSort with Hoare

\`\`\`
function quickSortHoare(arr, low, high):
    if low < high:
        p = partitionHoare(arr, low, high)
        quickSortHoare(arr, low, p)
        quickSortHoare(arr, p + 1, high)
\`\`\`
`,

  quickSort: `
# QuickSort Pseudocode

## Basic Structure

\`\`\`
quickSort(arr, low, high):
    if low < high:
        pivot = partition(arr, low, high)
        quickSort(arr, low, pivot - 1)  // Left subarray
        quickSort(arr, pivot + 1, high) // Right subarray
\`\`\`

## Choosing Pivot

\`\`\`
choosePivot(arr, low, high, strategy):
    switch strategy:
        case "first":
            return low
        case "last":
            return high
        case "median":
            mid = (low + high) / 2
            return medianOfThree(arr[low], arr[mid], arr[high])
        case "random":
            return random(low, high)
\`\`\`
`,

  partition: `
# Partition Pseudocode

## Lomuto Scheme

\`\`\`
partitionLomuto(arr, low, high):
    pivot = arr[high]          // Choose last element as pivot
    i = low - 1                // Index of smaller element
    
    for j = low to high - 1:   // Traverse array
        if arr[j] <= pivot:    // If current element <= pivot
            i = i + 1          // Increment index of smaller element
            swap(arr[i], arr[j])  // Swap
    
    swap(arr[i + 1], arr[high])  // Place pivot in correct position
    return i + 1               // Return pivot position
\`\`\`

## Hoare Scheme

\`\`\`
partitionHoare(arr, low, high):
    pivot = arr[low]           // Choose first element as pivot
    i = low - 1                // Left pointer
    j = high + 1              // Right pointer
    
    loop:
        do i = i + 1 while arr[i] < pivot   // Move left pointer right
        do j = j - 1 while arr[j] > pivot   // Move right pointer left
        
        if i >= j:                        // Pointers crossed
            return j                      // Return partition index
        
        swap(arr[i], arr[j])               // Swap elements
\`\`\`
`,
};
