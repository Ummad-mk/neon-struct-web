export const code = {
  full: `class TrieNode {
  constructor(char = '') {
    this.char = char
    this.children = new Map()
    this.isEnd = false
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode()
    this.wordCount = 0
  }

  insert(word) {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode(ch))
      }
      node = node.children.get(ch)
    }
    if (!node.isEnd) {
      node.isEnd = true
      this.wordCount++
    }
    return { success: true }
  }

  search(word) {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) return { success: false }
      node = node.children.get(ch)
    }
    return { success: node.isEnd }
  }

  delete(word) {
    const remove = (node, depth) => {
      if (depth === word.length) {
        if (!node.isEnd) return false
        node.isEnd = false
        this.wordCount--
        return node.children.size === 0
      }
      const ch = word[depth]
      if (!node.children.has(ch)) return false
      const child = node.children.get(ch)
      const pruneChild = remove(child, depth + 1)
      if (pruneChild) node.children.delete(ch)
      return node.children.size === 0 && !node.isEnd
    }
    remove(this.root, 0)
    return { success: true }
  }
}`,
  insert: `insert(word) {
  let node = this.root
  for (const ch of word.toLowerCase()) {
    if (!node.children.has(ch)) {
      node.children.set(ch, new TrieNode(ch))
    }
    node = node.children.get(ch)
  }
  node.isEnd = true
  return { success: true }
}`,
  search: `search(word) {
  let node = this.root
  for (const ch of word.toLowerCase()) {
    if (!node.children.has(ch)) return { success: false }
    node = node.children.get(ch)
  }
  return { success: node.isEnd }
}`,
  delete: `delete(word) {
  const remove = (node, depth) => {
    if (depth === word.length) {
      if (!node.isEnd) return false
      node.isEnd = false
      return node.children.size === 0
    }
    const ch = word[depth]
    if (!node.children.has(ch)) return false
    const child = node.children.get(ch)
    const pruneChild = remove(child, depth + 1)
    if (pruneChild) node.children.delete(ch)
    return node.children.size === 0 && !node.isEnd
  }
  remove(this.root, 0)
  return { success: true }
}`
};
