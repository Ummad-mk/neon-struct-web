export const code = {
  full: `
# QuickSort Implementations

## JavaScript

\`\`\`javascript
function quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
    return arr;
}

function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}
\`\`\`

## Python

\`\`\`python
def quick_sort(arr, low, high):
    if low < high:
        pivot_index = partition(arr, low, high)
        quick_sort(arr, low, pivot_index - 1)
        quick_sort(arr, pivot_index + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
\`\`\`

## Java

\`\`\`java
public static void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}
\`\`\`

## C++

\`\`\`cpp
void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    
    swap(arr[i + 1], arr[high]);
    return i + 1;
}
\`\`\`
`,

  quickSort: `
# QuickSort Code

## JavaScript Implementation

\`\`\`javascript
function quickSort(arr, low = 0, high = arr.length - 1) {
    // Base case
    if (low < high) {
        // Partition and get pivot position
        const pivotPos = partition(arr, low, high);
        
        // Recursively sort left side
        quickSort(arr, low, pivotPos - 1);
        
        // Recursively sort right side
        quickSort(arr, pivotPos + 1, high);
    }
    return arr;
}
\`\`\`

## With Custom Pivot Selection

\`\`\`javascript
function quickSortMedian(arr, low, high) {
    if (low < high) {
        const mid = Math.floor((low + high) / 2);
        
        // Median-of-three pivot
        const pivot = median(arr[low], arr[mid], arr[high]);
        const pivotVal = arr[pivot];
        
        const pi = partitionWithPivot(arr, low, high, pivotVal);
        quickSortMedian(arr, low, pi - 1);
        quickSortMedian(arr, pi + 1, high);
    }
}

function median(a, b, c) {
    if ((a > b) !== (a > c)) return a;
    else if ((b > a) !== (b > c)) return b;
    else return c;
}
\`\`\`
`,

  partition: `
# Partition Code

## Lomuto Partition

\`\`\`javascript
function partition(arr, low, high) {
    // Choose last element as pivot
    const pivot = arr[high];
    
    // i tracks the boundary of elements < pivot
    let i = low - 1;
    
    // Traverse array
    for (let j = low; j < high; j++) {
        // If current element <= pivot
        if (arr[j] <= pivot) {
            // Move boundary forward
            i++;
            // Swap current element with boundary
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    // Place pivot after all smaller elements
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    
    // Return pivot's final position
    return i + 1;
}
\`\`\`

## Hoare Partition

\`\`\`javascript
function partitionHoare(arr, low, high) {
    // Choose first element as pivot
    const pivot = arr[low];
    let i = low - 1;
    let j = high + 1;
    
    while (true) {
        // Move left pointer right until element >= pivot
        do {
            i++;
        } while (arr[i] < pivot);
        
        // Move right pointer left until element <= pivot
        do {
            j--;
        } while (arr[j] > pivot);
        
        // If pointers cross, partition is done
        if (i >= j) return j;
        
        // Swap elements at crossed pointers
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}
\`\`\`
`,
};
