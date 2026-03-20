export const pseudo = {
  full: `SEGMENT TREE (RANGE QUERY + POINT UPDATE)

BUILD(node, l, r):
  if l == r:
    tree[node] = arr[l]
    return
  mid = (l + r) // 2
  BUILD(left(node), l, mid)
  BUILD(right(node), mid + 1, r)
  tree[node] = COMBINE(tree[left(node)], tree[right(node)])

RANGE_QUERY(node, l, r, ql, qr):
  if qr < l OR r < ql:
    return NEUTRAL
  if ql <= l AND r <= qr:
    return tree[node]
  mid = (l + r) // 2
  leftRes = RANGE_QUERY(left(node), l, mid, ql, qr)
  rightRes = RANGE_QUERY(right(node), mid + 1, r, ql, qr)
  return COMBINE(leftRes, rightRes)

POINT_UPDATE(node, l, r, idx, val):
  if l == r:
    tree[node] = val
    arr[idx] = val
    return
  mid = (l + r) // 2
  if idx <= mid:
    POINT_UPDATE(left(node), l, mid, idx, val)
  else:
    POINT_UPDATE(right(node), mid + 1, r, idx, val)
  tree[node] = COMBINE(tree[left(node)], tree[right(node)])

COMPLEXITY:
- Build: O(n)
- Range Query: O(log n)
- Point Update: O(log n)
- Space: O(4n)`,
  build: `BUILD(node, l, r):
  if l == r:
    tree[node] = arr[l]
    return
  mid = (l + r) // 2
  BUILD(left(node), l, mid)
  BUILD(right(node), mid + 1, r)
  tree[node] = COMBINE(tree[left(node)], tree[right(node)])`,
  range_query: `RANGE_QUERY(node, l, r, ql, qr):
  if qr < l OR r < ql:
    return NEUTRAL
  if ql <= l AND r <= qr:
    return tree[node]
  mid = (l + r) // 2
  leftRes = RANGE_QUERY(left(node), l, mid, ql, qr)
  rightRes = RANGE_QUERY(right(node), mid + 1, r, ql, qr)
  return COMBINE(leftRes, rightRes)`,
  point_update: `POINT_UPDATE(node, l, r, idx, val):
  if l == r:
    tree[node] = val
    arr[idx] = val
    return
  mid = (l + r) // 2
  if idx <= mid:
    POINT_UPDATE(left(node), l, mid, idx, val)
  else:
    POINT_UPDATE(right(node), mid + 1, r, idx, val)
  tree[node] = COMBINE(tree[left(node)], tree[right(node)])`
};
