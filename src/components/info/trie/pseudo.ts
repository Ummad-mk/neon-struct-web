export const pseudo = {
  full: `TRIE OPERATIONS

INSERT(word):
  node ← root
  FOR each character ch in word:
    IF ch not in node.children:
      node.children[ch] ← new TrieNode(ch)
    node ← node.children[ch]
  node.isEnd ← true
  RETURN success

SEARCH(word):
  node ← root
  FOR each character ch in word:
    IF ch not in node.children:
      RETURN not_found
    node ← node.children[ch]
  IF node.isEnd = true:
    RETURN found
  RETURN not_found

DELETE(word):
  DELETE_RECURSIVE(node, depth):
    IF depth = len(word):
      IF node.isEnd = false:
        RETURN false
      node.isEnd ← false
      RETURN node has no children
    ch ← word[depth]
    IF ch not in node.children:
      RETURN false
    shouldPrune ← DELETE_RECURSIVE(node.children[ch], depth + 1)
    IF shouldPrune:
      remove node.children[ch]
    RETURN node has no children AND node.isEnd = false

  DELETE_RECURSIVE(root, 0)
  RETURN success

TIME COMPLEXITY:
- Insert: O(L)
- Search: O(L)
- Delete: O(L)
where L is word length

SPACE COMPLEXITY:
- O(total characters stored)`,
  insert: `INSERT(word):
  node ← root
  FOR each character ch in word:
    IF ch not in node.children:
      node.children[ch] ← new TrieNode(ch)
    node ← node.children[ch]
  node.isEnd ← true
  RETURN success`,
  search: `SEARCH(word):
  node ← root
  FOR each character ch in word:
    IF ch not in node.children:
      RETURN not_found
    node ← node.children[ch]
  RETURN node.isEnd`,
  delete: `DELETE(word):
  DELETE_RECURSIVE(node, depth):
    IF depth = len(word):
      IF node.isEnd = false:
        RETURN false
      node.isEnd ← false
      RETURN node has no children
    ch ← word[depth]
    IF ch not in node.children:
      RETURN false
    shouldPrune ← DELETE_RECURSIVE(node.children[ch], depth + 1)
    IF shouldPrune:
      remove node.children[ch]
    RETURN node has no children AND node.isEnd = false

  DELETE_RECURSIVE(root, 0)
  RETURN success`
};
