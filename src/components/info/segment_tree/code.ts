export const code = {
  full: `class SegmentTree {
  constructor(arr, op = 'sum') {
    this.arr = [...arr]
    this.n = arr.length
    this.tree = Array(4 * this.n).fill(0)
    this.op = op
    this.build(1, 0, this.n - 1)
  }

  combine(a, b) {
    if (this.op === 'sum') return a + b
    if (this.op === 'min') return Math.min(a, b)
    return Math.max(a, b)
  }

  build(i, l, r) {
    if (l === r) {
      this.tree[i] = this.arr[l]
      return
    }
    const m = (l + r) >> 1
    this.build(i << 1, l, m)
    this.build(i << 1 | 1, m + 1, r)
    this.tree[i] = this.combine(this.tree[i << 1], this.tree[i << 1 | 1])
  }

  rangeQuery(i, l, r, ql, qr) {
    if (qr < l || r < ql) return this.op === 'sum' ? 0 : this.op === 'min' ? Infinity : -Infinity
    if (ql <= l && r <= qr) return this.tree[i]
    const m = (l + r) >> 1
    const left = this.rangeQuery(i << 1, l, m, ql, qr)
    const right = this.rangeQuery(i << 1 | 1, m + 1, r, ql, qr)
    return this.combine(left, right)
  }

  pointUpdate(i, l, r, idx, val) {
    if (l === r) {
      this.tree[i] = val
      this.arr[idx] = val
      return
    }
    const m = (l + r) >> 1
    if (idx <= m) this.pointUpdate(i << 1, l, m, idx, val)
    else this.pointUpdate(i << 1 | 1, m + 1, r, idx, val)
    this.tree[i] = this.combine(this.tree[i << 1], this.tree[i << 1 | 1])
  }
}`,
  build: `build(i, l, r) {
  if (l === r) {
    tree[i] = arr[l]
    return
  }
  const m = (l + r) >> 1
  build(i << 1, l, m)
  build(i << 1 | 1, m + 1, r)
  tree[i] = combine(tree[i << 1], tree[i << 1 | 1])
}`,
  range_query: `rangeQuery(i, l, r, ql, qr) {
  if (qr < l || r < ql) return NEUTRAL
  if (ql <= l && r <= qr) return tree[i]
  const m = (l + r) >> 1
  const left = rangeQuery(i << 1, l, m, ql, qr)
  const right = rangeQuery(i << 1 | 1, m + 1, r, ql, qr)
  return combine(left, right)
}`,
  point_update: `pointUpdate(i, l, r, idx, val) {
  if (l === r) {
    tree[i] = val
    arr[idx] = val
    return
  }
  const m = (l + r) >> 1
  if (idx <= m) pointUpdate(i << 1, l, m, idx, val)
  else pointUpdate(i << 1 | 1, m + 1, r, idx, val)
  tree[i] = combine(tree[i << 1], tree[i << 1 | 1])
}`
};
