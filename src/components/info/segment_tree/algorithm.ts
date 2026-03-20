export const algorithm = {
  full: `# Segment Tree

## Idea
A Segment Tree stores aggregate information over intervals of an array.
Each node represents a segment [l..r], and stores:
- sum(l..r) OR
- min(l..r) OR
- max(l..r)

## Build
Build recursively:
- Leaf node => single element.
- Internal node => combine(left, right).

Complexity:
- Time: O(n)
- Space: O(n)

## Range Query [L..R]
At node [l..r]:
1. No overlap => return neutral value.
2. Full overlap => return node value.
3. Partial overlap => query children and combine.

Complexity:
- Time: O(log n) average / O(log n + visited nodes)
- Space: O(log n) recursion

## Point Update
Update one index:
1. Descend to leaf index.
2. Replace value.
3. Recompute all ancestors on return.

Complexity:
- Time: O(log n)
- Space: O(log n)

## Why useful
- Faster repeated range operations than brute force O(n) scanning.
- Supports dynamic updates efficiently.`,
  build: `# Build Segment Tree
Recursively split [l..r] until leaf segments, then combine child values.

Complexity:
- Time: O(n)
- Space: O(n)`,
  range_query: `# Range Query
Use overlap checks:
- no overlap => neutral
- full overlap => node value
- partial overlap => combine(left, right)

Complexity:
- Time: O(log n)
- Space: O(log n)`,
  point_update: `# Point Update
Traverse to target leaf, update it, recompute parent values on the path back.

Complexity:
- Time: O(log n)
- Space: O(log n)`
};
