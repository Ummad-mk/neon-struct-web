export const COLORS = {
  // Base node colors (Cursor Scan Blueprint)
  default: '#3b82f6',        // Blue - default untouched node
  visited: '#fbbf24',        // Yellow - visited, not target
  found: '#a6e3a1',          // Bright green - found/target node
  error: '#ef4444',          // Red - error state
  inactive: '#6b7280',       // Gray - inactive node

  // UI colors
  background: '#1e293b',     // Dark background
  panel: '#0f172a',          // Panel background
  highlight: '#3b82f6',      // Highlight color
  border: '#334155',         // Border color
  text: '#e2e8f0',           // Text color
  textSecondary: '#94a3b8',  // Secondary text

  // Operation-specific colors (for enhanced animations)
  current: '#f9e2af',        // Bright yellow
  deleting: '#f38ba8',       // Bright red - being deleted
  inserting: '#06b6d4',      // Cyan - being inserted
  reversing: '#ec4899',      // Pink - being reversed
  swapping: '#a855f7',       // Purple - swapping nodes

  // Search animation colors
  visiting: '#f9e2af',       // Bright yellow - currently visiting/examining
  visitedTrail: '#fbbf24',   // Yellow - visited trail
  searchActive: '#f9e2af',   // Bright yellow

  // Connection colors
  connection: '#64748b',     // Gray - normal connection
  activeConnection: '#3b82f6', // Blue - active connection
  reversingConnection: '#ec4899', // Pink - reversing connection
};

export const getNodeColor = (
  isVisited: boolean,
  isFound: boolean,
  isDefault: boolean = true
): string => {
  if (isFound) return COLORS.found;
  if (isVisited) return COLORS.visited;
  if (isDefault) return COLORS.default;
  return COLORS.inactive;
};

// Animation timing constants
export const ANIMATION_TIMINGS = {
  insert: 250,      // ms for insert animation
  delete: 250,      // ms for delete animation
  search: 150,      // ms per node during search
  found: 800,       // ms to highlight found node
  pulse: 150,       // ms for pulse cycle
  transition: 100,  // ms for color transitions
};

// Get animation color based on operation type
export const getOperationColor = (operation: string): string => {
  const opMap: { [key: string]: string } = {
    'insert': COLORS.inserting,
    'delete': COLORS.deleting,
    'search': COLORS.searchActive,
    'reverse': COLORS.reversing,
    'traverse': COLORS.visiting,
    'found': COLORS.found,
    'visiting': COLORS.visiting,
    'visited': COLORS.visitedTrail,
  };

  return opMap[operation] || COLORS.highlight;
};