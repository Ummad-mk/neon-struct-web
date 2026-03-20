export const algorithm = {
  full: `# Trie (Prefix Tree)

## Overview
A Trie stores words character by character in a tree. Each edge represents one character, and each node can branch to multiple next characters.

## Core Idea
- Root is an empty start node.
- A path from root to a node marked \`isEnd\` forms a complete word.
- Shared prefixes are stored once and reused.

## Insert
1. Start at root.
2. For each character in the word:
   - If child node does not exist, create it.
   - Move to that child.
3. Mark last node as end of word.

Time Complexity: O(L)  
Space Complexity: O(L) in worst case for new nodes

## Search
1. Start at root.
2. Follow each character edge.
3. If any character edge is missing, word does not exist.
4. If all characters match and final node is end-marked, word exists.

Time Complexity: O(L)  
Space Complexity: O(1)

## Delete
1. Traverse to the target word.
2. Unmark the end-of-word flag.
3. Prune nodes bottom-up if they are no longer used by any word.

Time Complexity: O(L)  
Space Complexity: O(L) recursion stack

## Why Trie
- Very fast prefix lookups.
- Great for dictionaries, autocomplete, spell-checkers.
- Deterministic lookup time based on word length, not number of words.

## Tradeoff
- Uses more memory than hash-based sets for sparse datasets.`,
  insert: `# Trie Insert
Traverse characters and create missing nodes, then mark end-of-word.

Complexity:
- Time: O(L)
- Space: O(L) worst-case new nodes`,
  search: `# Trie Search
Traverse characters; if any edge is missing, fail.
Success only if final node is end-of-word.

Complexity:
- Time: O(L)
- Space: O(1)`,
  delete: `# Trie Delete
Unmark end-of-word, then prune unused nodes while unwinding recursion.

Complexity:
- Time: O(L)
- Space: O(L) recursion`
};
