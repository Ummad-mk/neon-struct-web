import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'expanding' | 'found-bound' | 'binary-phase' | 'check-mid' | 'compare' | 'eliminate-left' | 'eliminate-right' | 'match' | 'not-found' | 'complete';
type ArrayType = 'random' | 'near-start' | 'near-end' | 'not-present' | 'unknown-size';

interface ExpStep {
  array: number[];
  target: number;
  phase: Phase;
  bound: number;
  boundIndex: number;
  low: number;
  high: number;
  mid: number;
  windowSize: number;
  comparisons: number;
  eliminated: number[];
  jumpsMade: number;
  jumpTrail: number[];
  halvingHistory: { mid: number; midVal: number; size: number; direction: 'left' | 'right' | 'found' | 'not-found'; newSize: number }[];
  foundIndex: number | null;
  caption: string;
  comparisonText: string;
  eliminationWave: 'left' | 'right' | null;
  isInBinaryPhase: boolean;
  nextJumpMultiplier: number;
}

const COLORS = {
  default: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  eliminated: { border: '#1a2a28', text: '#3a5a50', bg: '#0a1414' },
  windowBracket: '#2a8a80',
  middle: { border: '#e8c040', text: '#ffffff', bg: '#1a1408' },
  found: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  target: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  jumpLanding: { border: '#d4a040', text: '#ffffff', bg: '#1a1408' },
  jumpTooSmall: { border: '#6a5020', text: '#a08040', bg: '#141008' },
  jumpOvershoot: { border: '#6a2030', text: '#a05060', bg: '#140810' },
  boundaryLeft: '#4a90d0',
  boundaryRight: '#d06080',
  waveRose: '#300a10',
  waveBlue: '#0a1030',
  phaseAmber: '#1a1200',
  phaseCyan: '#00081a',
};

function generateSortedArray(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) arr.push(i * 3 + Math.floor(Math.random() * 5) + 5);
  return arr.sort((a, b) => a - b);
}

function generateExpSteps(arr: number[], target: number, _arrayType: ArrayType): ExpStep[] {
  const steps: ExpStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  let foundIndex: number | null = null;
  const eliminated: number[] = [];
  const jumpTrail: number[] = [];
  const halvingHistory: ExpStep['halvingHistory'] = [];

  const addStep = (partial: Partial<ExpStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      target,
      bound: 0,
      boundIndex: -1,
      low: 0,
      high: n - 1,
      mid: -1,
      windowSize: n,
      comparisons,
      eliminated: [...eliminated],
      jumpsMade: jumpTrail.length,
      jumpTrail: [...jumpTrail],
      halvingHistory: [...halvingHistory],
      foundIndex,
      caption: '',
      comparisonText: '',
      eliminationWave: null,
      isInBinaryPhase: false,
      nextJumpMultiplier: jumpTrail.length > 0 ? Math.pow(2, jumpTrail.length) : 1,
      ...partial,
    } as ExpStep);
  };

  addStep({
    array: [...array],
    phase: 'idle',
    bound: 0,
    boundIndex: -1,
    low: 0,
    high: n - 1,
    mid: Math.floor((n - 1) / 2),
    windowSize: n,
    comparisons: 0,
    eliminated: [],
    jumpsMade: 0,
    jumpTrail: [],
    halvingHistory: [],
    foundIndex: null,
    isInBinaryPhase: false,
    nextJumpMultiplier: 1,
    caption: `Exponential search starts at position 1 and doubles the jump each time until it overshoots. Then binary search finishes the job.`,
    comparisonText: `Starting exponential search for ${target}...`,
  });

  if (array[0] === target) {
    foundIndex = 0;
    jumpTrail.push(0);
    addStep({
      array: [...array],
      phase: 'match',
      bound: 1,
      boundIndex: 0,
      low: 0,
      high: 0,
      mid: 0,
      windowSize: 1,
      comparisons: 1,
      eliminated: [],
      jumpsMade: 1,
      jumpTrail: [...jumpTrail],
      halvingHistory: [{ mid: 0, midVal: array[0], size: n, direction: 'found', newSize: 1 }],
      foundIndex: 0,
      isInBinaryPhase: false,
      nextJumpMultiplier: 2,
      caption: `Found ${target} right on the first jump! Exponential search found it immediately.`,
      comparisonText: `Found on jump 1!`,
    });
    addStep({
      array: [...array],
      phase: 'complete',
      bound: 1,
      boundIndex: 0,
      low: 0,
      high: 0,
      mid: 0,
      windowSize: 1,
      comparisons: 1,
      eliminated: [],
      jumpsMade: 1,
      jumpTrail: [...jumpTrail],
      halvingHistory: [{ mid: 0, midVal: array[0], size: n, direction: 'found', newSize: 1 }],
      foundIndex: 0,
      isInBinaryPhase: false,
      nextJumpMultiplier: 2,
      caption: `Found ${target} at position 1 after just 1 jump. Exponential search is incredibly fast when target is near the start!`,
      comparisonText: `1 jump, 0 binary comparisons. Found!`,
    });
    return steps;
  }

  let bound = 1;
  jumpTrail.push(0);
  eliminated.push(0);
  comparisons++;

  addStep({
    array: [...array],
    phase: 'expanding',
    bound: 1,
    boundIndex: 1,
    low: 0,
    high: Math.min(1, n - 1),
    mid: Math.floor((n - 1) / 2),
    windowSize: n,
    comparisons,
    eliminated: [...eliminated],
    jumpsMade: 1,
    jumpTrail: [...jumpTrail],
    halvingHistory: [],
    foundIndex: null,
    isInBinaryPhase: false,
    nextJumpMultiplier: 2,
    caption: `Jump 1 to position 2 (value ${array[1]}). Is ${array[1]} >= ${target}?`,
    comparisonText: `Jump ×1: checking index 1...`,
  });

  if (array[1] >= target) {
    addStep({
      array: [...array],
      phase: 'found-bound',
      bound: 1,
      boundIndex: 1,
      low: 0,
      high: 1,
      mid: 0,
      windowSize: 2,
      comparisons,
      eliminated: [...eliminated],
      jumpsMade: 1,
      jumpTrail: [...jumpTrail],
      halvingHistory: [{ mid: 0, midVal: -1, size: 2, direction: 'right', newSize: 2 }],
      foundIndex: null,
      isInBinaryPhase: true,
      nextJumpMultiplier: 2,
      caption: `Overshot! Position 2's value (${array[1]}) is >= ${target}. The target is between position 1 and 2.`,
      comparisonText: `${array[1]} >= ${target}. Handoff to binary search!`,
    });
    eliminated.push(1);
  } else {
    jumpTrail.push(1);
    bound = 2;

    while (bound < n && array[bound] < target) {
      eliminated.push(bound);
      bound *= 2;
      comparisons++;
      const actualBound = Math.min(bound, n - 1);
      jumpTrail.push(actualBound);

      addStep({
        array: [...array],
        phase: 'expanding',
        bound: bound,
        boundIndex: actualBound,
        low: 0,
        high: actualBound,
        mid: Math.floor((n - 1) / 2),
        windowSize: n,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [],
        foundIndex: null,
        isInBinaryPhase: false,
        nextJumpMultiplier: Math.pow(2, jumpTrail.length),
        caption: `Jump ${jumpTrail.length} to position ${actualBound + 1} (value ${array[actualBound]}). Is ${array[actualBound]} >= ${target}?`,
        comparisonText: `Jump ×${Math.pow(2, jumpTrail.length - 1)}: checking index ${actualBound}...`,
      });

      if (bound >= n || array[actualBound] >= target) {
        break;
      }
    }

    const lastBound = jumpTrail[jumpTrail.length - 2] ?? 0;
    const actualHigh = Math.min(bound, n - 1);
    const actualLow = lastBound;

    if (array[actualHigh] >= target) {
      eliminated.push(actualHigh);
      addStep({
        array: [...array],
        phase: 'found-bound',
        bound: bound,
        boundIndex: actualHigh,
        low: actualLow,
        high: actualHigh,
        mid: Math.floor((actualLow + actualHigh) / 2),
        windowSize: actualHigh - actualLow + 1,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [{ mid: -1, midVal: -1, size: actualHigh - actualLow + 1, direction: 'right', newSize: actualHigh - actualLow + 1 }],
        foundIndex: null,
        isInBinaryPhase: true,
        nextJumpMultiplier: Math.pow(2, jumpTrail.length),
        caption: `Overshot! The target is between position ${actualLow + 1} and position ${actualHigh + 1}. Handing off to binary search.`,
        comparisonText: `${array[actualHigh]} >= ${target}. Binary search range: [${actualLow}, ${actualHigh}]`,
      });
    }
  }

  let low = 0;
  let high = n - 1;

  for (let i = 0; i < jumpTrail.length - 1; i++) {
    const prev = jumpTrail[i];
    const next = jumpTrail[i + 1];
    low = prev;
    high = next;
  }

  if (!steps[steps.length - 1].isInBinaryPhase) {
    return steps;
  }

  const finalStep = steps[steps.length - 1];
  low = finalStep.low;
  high = finalStep.high;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;

    const midVal = array[mid];

    addStep({
      array: [...array],
      phase: 'check-mid',
      bound: bound,
      boundIndex: jumpTrail[jumpTrail.length - 1],
      low,
      high,
      mid,
      windowSize: high - low + 1,
      comparisons,
      eliminated: [...eliminated],
      jumpsMade: jumpTrail.length,
      jumpTrail: [...jumpTrail],
      halvingHistory: [...halvingHistory],
      foundIndex: null,
      isInBinaryPhase: true,
      nextJumpMultiplier: 0,
      caption: `Binary search: checking position ${mid + 1} (value ${midVal})`,
      comparisonText: `Is ${midVal} == ${target}?`,
    });

    addStep({
      array: [...array],
      phase: 'compare',
      bound: bound,
      boundIndex: jumpTrail[jumpTrail.length - 1],
      low,
      high,
      mid,
      windowSize: high - low + 1,
      comparisons,
      eliminated: [...eliminated],
      jumpsMade: jumpTrail.length,
      jumpTrail: [...jumpTrail],
      halvingHistory: [...halvingHistory],
      foundIndex: null,
      isInBinaryPhase: true,
      nextJumpMultiplier: 0,
      caption: `Comparing ${midVal} to ${target}...`,
      comparisonText: `${midVal} ${midVal === target ? '==' : midVal < target ? '<' : '>'} ${target}`,
    });

    if (midVal === target) {
      foundIndex = mid;
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'found', newSize: 1 });

      addStep({
        array: [...array],
        phase: 'match',
        bound: bound,
        boundIndex: jumpTrail[jumpTrail.length - 1],
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [...halvingHistory],
        foundIndex: mid,
        isInBinaryPhase: true,
        nextJumpMultiplier: 0,
        caption: `${midVal} equals ${target} — found it! Exponential jumps found the range, binary search found the exact position.`,
        comparisonText: `${midVal} == ${target} — found!`,
        eliminationWave: null,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        bound: bound,
        boundIndex: jumpTrail[jumpTrail.length - 1],
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [...halvingHistory],
        foundIndex: mid,
        isInBinaryPhase: true,
        nextJumpMultiplier: 0,
        caption: `Found ${target} at position ${mid + 1}. ${jumpTrail.length} exponential jumps + ${comparisons - jumpTrail.length} binary comparisons = ${comparisons} total.`,
        comparisonText: `${jumpTrail.length} jumps + ${comparisons - jumpTrail.length} binary = ${comparisons} total comparisons.`,
      });

      return steps;
    }

    if (midVal < target) {
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'right', newSize: high - mid });

      addStep({
        array: [...array],
        phase: 'eliminate-right',
        bound: bound,
        boundIndex: jumpTrail[jumpTrail.length - 1],
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [...halvingHistory],
        foundIndex: null,
        isInBinaryPhase: true,
        nextJumpMultiplier: 0,
        caption: `${midVal} < ${target} — look right. Binary search narrowing...`,
        comparisonText: `${midVal} < ${target} — look right.`,
        eliminationWave: 'right',
      });

      low = mid + 1;
    } else {
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'left', newSize: mid - low });

      addStep({
        array: [...array],
        phase: 'eliminate-left',
        bound: bound,
        boundIndex: jumpTrail[jumpTrail.length - 1],
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        jumpsMade: jumpTrail.length,
        jumpTrail: [...jumpTrail],
        halvingHistory: [...halvingHistory],
        foundIndex: null,
        isInBinaryPhase: true,
        nextJumpMultiplier: 0,
        caption: `${midVal} > ${target} — look left. Binary search narrowing...`,
        comparisonText: `${midVal} > ${target} — look left.`,
        eliminationWave: 'left',
      });

      high = mid - 1;
    }
  }

  halvingHistory.push({ mid: -1, midVal: -1, size: 0, direction: 'not-found', newSize: 0 });

  addStep({
    array: [...array],
    phase: 'not-found',
    bound: bound,
    boundIndex: jumpTrail[jumpTrail.length - 1],
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    jumpsMade: jumpTrail.length,
    jumpTrail: [...jumpTrail],
    halvingHistory: [...halvingHistory],
    foundIndex: null,
    isInBinaryPhase: true,
    nextJumpMultiplier: 0,
    caption: `${target} not found. ${jumpTrail.length} jumps covered the range, binary search confirmed absence.`,
    comparisonText: `Not found after ${comparisons} comparisons.`,
    eliminationWave: null,
  });

  addStep({
    array: [...array],
    phase: 'complete',
    bound: bound,
    boundIndex: jumpTrail[jumpTrail.length - 1],
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    jumpsMade: jumpTrail.length,
    jumpTrail: [...jumpTrail],
    halvingHistory: [...halvingHistory],
    foundIndex: null,
    isInBinaryPhase: true,
    nextJumpMultiplier: 0,
    caption: `${target} not found after ${comparisons} total comparisons.`,
    comparisonText: `Not found — ${jumpTrail.length} jumps + ${comparisons - jumpTrail.length} binary comparisons.`,
  });

  return steps;
}

interface LinearStep {
  array: number[];
  phase: 'idle' | 'checking' | 'found' | 'not-found' | 'complete';
  currentIndex: number;
  checkedCount: number;
  tilesChecked: number[];
  comparisons: number;
  foundIndex: number | null;
}

interface JumpStep {
  array: number[];
  phase: 'idle' | 'jump' | 'found' | 'not-found' | 'complete';
  currentIndex: number;
  jumpCount: number;
  tilesChecked: number[];
  comparisons: number;
  foundIndex: number | null;
}

interface BinaryStep {
  array: number[];
  phase: 'idle' | 'check-mid' | 'compare' | 'eliminate-left' | 'eliminate-right' | 'match' | 'not-found' | 'complete';
  low: number;
  high: number;
  mid: number;
  windowSize: number;
  comparisons: number;
  eliminated: number[];
  foundIndex: number | null;
  found: number | null;
  visited: number[];
}

function generateLinearSteps(arr: number[], target: number): LinearStep[] {
  const steps: LinearStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  const tilesChecked: number[] = [];

  steps.push({
    array: [...array],
    phase: 'idle',
    currentIndex: 0,
    checkedCount: 0,
    tilesChecked: [],
    comparisons: 0,
    foundIndex: null,
  });

  for (let i = 0; i < n; i++) {
    comparisons++;
    tilesChecked.push(i);

    steps.push({
      array: [...array],
      phase: 'checking',
      currentIndex: i,
      checkedCount: i + 1,
      tilesChecked: [...tilesChecked],
      comparisons,
      foundIndex: null,
    });

    if (array[i] === target) {
      steps.push({
        array: [...array],
        phase: 'found',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: i,
      });
      steps.push({
        array: [...array],
        phase: 'complete',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: i,
      });
      return steps;
    }
  }

  steps.push({
    array: [...array],
    phase: 'not-found',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
  });
  steps.push({
    array: [...array],
    phase: 'complete',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
  });

  return steps;
}

function generateJumpSteps(arr: number[], target: number): JumpStep[] {
  const steps: JumpStep[] = [];
  const array = [...arr];
  const n = array.length;
  const jumpSize = Math.ceil(Math.sqrt(n));
  let comparisons = 0;
  const tilesChecked: number[] = [];
  let curr = 0;

  steps.push({
    array: [...array],
    phase: 'idle',
    currentIndex: 0,
    jumpCount: 0,
    tilesChecked: [],
    comparisons: 0,
    foundIndex: null,
  });

  while (curr < n) {
    comparisons++;
    const landing = Math.min(curr, n - 1);
    tilesChecked.push(landing);

    steps.push({
      array: [...array],
      phase: 'jump',
      currentIndex: landing,
      jumpCount: Math.floor(landing / jumpSize) + 1,
      tilesChecked: [...tilesChecked],
      comparisons,
      foundIndex: null,
    });

    if (array[landing] === target) {
      steps.push({
        array: [...array],
        phase: 'found',
        currentIndex: landing,
        jumpCount: Math.floor(landing / jumpSize) + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: landing,
      });
      steps.push({
        array: [...array],
        phase: 'complete',
        currentIndex: landing,
        jumpCount: Math.floor(landing / jumpSize) + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: landing,
      });
      return steps;
    }

    if (array[landing] > target) {
      for (let j = landing - 1; j >= (tilesChecked.length > 1 ? tilesChecked[tilesChecked.length - 2] + 1 : 0); j--) {
        comparisons++;
        tilesChecked.push(j);
        if (array[j] === target) {
          steps.push({
            array: [...array],
            phase: 'found',
            currentIndex: j,
            jumpCount: Math.floor(landing / jumpSize) + 1,
            tilesChecked: [...tilesChecked],
            comparisons,
            foundIndex: j,
          });
          steps.push({
            array: [...array],
            phase: 'complete',
            currentIndex: j,
            jumpCount: Math.floor(landing / jumpSize) + 1,
            tilesChecked: [...tilesChecked],
            comparisons,
            foundIndex: j,
          });
          return steps;
        }
      }
      break;
    }

    curr += jumpSize;
  }

  steps.push({
    array: [...array],
    phase: 'not-found',
    currentIndex: n,
    jumpCount: 0,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
  });
  steps.push({
    array: [...array],
    phase: 'complete',
    currentIndex: n,
    jumpCount: 0,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
  });

  return steps;
}

function generateBinarySteps(arr: number[], target: number): BinaryStep[] {
  const steps: BinaryStep[] = [];
  const array = [...arr];
  const n = array.length;
  let low = 0;
  let high = n - 1;
  let comparisons = 0;
  const eliminated: number[] = [];
  const visited: number[] = [];

  steps.push({
    array: [...array],
    phase: 'idle',
    low: 0,
    high: n - 1,
    mid: Math.floor((n - 1) / 2),
    windowSize: n,
    comparisons: 0,
    eliminated: [],
    foundIndex: null,
    found: null,
    visited: [],
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    visited.push(mid);

    steps.push({
      array: [...array],
      phase: 'check-mid',
      low,
      high,
      mid,
      windowSize: high - low + 1,
      comparisons,
      eliminated: [...eliminated],
      foundIndex: null,
      found: null,
      visited: [...visited],
    });

    if (array[mid] === target) {
      steps.push({
        array: [...array],
        phase: 'match',
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        foundIndex: mid,
        found: mid,
        visited: [...visited],
      });
      steps.push({
        array: [...array],
        phase: 'complete',
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        foundIndex: mid,
        found: mid,
        visited: [...visited],
      });
      return steps;
    }

    if (array[mid] < target) {
      for (let i = low; i <= mid; i++) eliminated.push(i);
      steps.push({
        array: [...array],
        phase: 'eliminate-right',
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        foundIndex: null,
        found: null,
        visited: [...visited],
      });
      low = mid + 1;
    } else {
      for (let i = mid; i <= high; i++) eliminated.push(i);
      steps.push({
        array: [...array],
        phase: 'eliminate-left',
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        foundIndex: null,
        found: null,
        visited: [...visited],
      });
      high = mid - 1;
    }
  }

  steps.push({
    array: [...array],
    phase: 'not-found',
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    foundIndex: null,
    found: null,
    visited: [...visited],
  });
  steps.push({
    array: [...array],
    phase: 'complete',
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    foundIndex: null,
    found: null,
    visited: [...visited],
  });

  return steps;
}

export default function ExponentialSearchViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateSortedArray(16));
  const [target, setTarget] = useState<number>(() => {
    const arr = generateSortedArray(16);
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [steps, setSteps] = useState<ExpStep[]>(() => {
    const initArr = generateSortedArray(16);
    const initTarget = initArr[Math.floor(Math.random() * initArr.length)];
    return generateExpSteps(initArr, initTarget, 'random');
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showMatchArc, setShowMatchArc] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [_showWave, setShowWave] = useState<'left' | 'right' | null>(null);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [linearSteps, setLinearSteps] = useState<LinearStep[]>([]);
  const [jumpSteps, setJumpSteps] = useState<JumpStep[]>([]);
  const [binarySteps, setBinarySteps] = useState<BinaryStep[]>([]);
  const [linearStep, setLinearStep] = useState(0);
  const [jumpStep, setJumpStep] = useState(0);
  const [binaryStep, setBinaryStep] = useState(0);
  const [headToHeadMode, setHeadToHeadMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const lastTimeRef = { current: 0 };

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    let newTarget: number;

    switch (type) {
      case 'near-start': {
        newArr = generateSortedArray(size);
        newArr[1] = 100;
        newTarget = 100;
        break;
      }
      case 'near-end': {
        newArr = generateSortedArray(size);
        newArr[size - 1] = 100;
        newTarget = 100;
        break;
      }
      case 'not-present': {
        newArr = generateSortedArray(size);
        let missing = newArr[0] - 5;
        while (newArr.includes(missing)) missing--;
        newTarget = missing;
        break;
      }
      case 'unknown-size': {
        newArr = generateSortedArray(size);
        newTarget = newArr[Math.floor(Math.random() * newArr.length)];
        break;
      }
      default: {
        newArr = generateSortedArray(size);
        newTarget = newArr[Math.floor(Math.random() * newArr.length)];
      }
    }

    setArray(newArr);
    setTarget(newTarget);
    setSteps(generateExpSteps(newArr, newTarget, type));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
  }, [arrayType]);

  const regenerateTarget = useCallback(() => {
    if (array.length === 0) return;
    const newTarget = array[Math.floor(Math.random() * array.length)];
    setTarget(newTarget);
    setSteps(generateExpSteps([...array], newTarget, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
  }, [array, arrayType]);

  const regenerateMissingTarget = useCallback(() => {
    let missing = array[0] - 5;
    while (array.includes(missing)) missing--;
    setTarget(missing);
    setSteps(generateExpSteps([...array], missing, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
  }, [array, arrayType]);

  const searchCustomTarget = useCallback(() => {
    const val = parseInt(customTargetInput);
    if (isNaN(val)) return;
    setTarget(val);
    setSteps(generateExpSteps([...array], val, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
  }, [array, arrayType, customTargetInput]);

  const generateRandomArray = useCallback(() => {
    const newArr = generateSortedArray(arraySize);
    const newTarget = newArr[Math.floor(Math.random() * newArr.length)];
    setArray(newArr);
    setTarget(newTarget);
    setSteps(generateExpSteps(newArr, newTarget, 'random'));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
    setArrayType('random');
  }, [arraySize]);

  const startHeadToHead = useCallback(() => {
    const sortedArr = generateSortedArray(arraySize);
    const newTarget = sortedArr[sortedArr.length - 1];
    setArray(sortedArr);
    setTarget(newTarget);
    setLinearSteps(generateLinearSteps(sortedArr, newTarget));
    setJumpSteps(generateJumpSteps(sortedArr, newTarget));
    setBinarySteps(generateBinarySteps(sortedArr, newTarget));
    setSteps(generateExpSteps(sortedArr, newTarget, 'near-end'));
    setCurrentStep(0);
    setLinearStep(0);
    setJumpStep(0);
    setBinaryStep(0);
    setPlaying(true);
    setHeadToHeadMode(true);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowHandoff(false);
    setShowWave(null);
  }, [arraySize]);

  const handleStep = useCallback(() => {
    if (headToHeadMode) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setLinearStep(prev => Math.min(prev + 1, linearSteps.length - 1));
        setJumpStep(prev => Math.min(prev + 1, jumpSteps.length - 1));
        setBinaryStep(prev => Math.min(prev + 1, binarySteps.length - 1));
      } else {
        setPlaying(false);
        setLinearStep(linearSteps.length - 1);
        setJumpStep(jumpSteps.length - 1);
        setBinaryStep(binarySteps.length - 1);
      }
      return;
    }

    if (currentStep < steps.length - 1) {
      const next = steps[currentStep + 1];

      if (next.phase === 'match') {
        setShowMatchArc(true);
        setTimeout(() => setShowMatchArc(false), 800);
      }

      if (next.phase === 'found-bound') {
        setShowHandoff(true);
        setTimeout(() => setShowHandoff(false), 500);
      }

      if (next.eliminationWave) {
        setShowWave(next.eliminationWave);
        setTimeout(() => setShowWave(null), 250);
      }

      setCurrentStep(prev => prev + 1);
    } else {
      setPlaying(false);
    }
  }, [currentStep, steps, headToHeadMode, linearSteps, jumpSteps, binarySteps]);

  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    if (playing) {
      const animate = (time: number) => {
        const delay = Math.max(10, 700 - speed * 8);
        if (time - lastTime >= delay) {
          handleStep();
          lastTime = time;
        }
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [playing, speed, handleStep]);

  const currentStepData = useMemo(() => {
    if (steps.length === 0) return null;
    return steps[currentStep] || steps[steps.length - 1];
  }, [steps, currentStep]);

  const currentLinearStep = useMemo(() => {
    if (linearSteps.length === 0) return null;
    return linearSteps[linearStep] || linearSteps[linearSteps.length - 1];
  }, [linearSteps, linearStep]);

  const currentJumpStep = useMemo(() => {
    if (jumpSteps.length === 0) return null;
    return jumpSteps[jumpStep] || jumpSteps[jumpSteps.length - 1];
  }, [jumpSteps, jumpStep]);

  const currentBinaryStep = useMemo(() => {
    if (binarySteps.length === 0) return null;
    return binarySteps[binaryStep] || binarySteps[binarySteps.length - 1];
  }, [binarySteps, binaryStep]);

  const handleReset = () => {
    generateNewArray(arraySize, arrayType);
    setHeadToHeadMode(false);
  };

  const handlePreset = (type: ArrayType) => {
    setArrayType(type);
    setHeadToHeadMode(false);
    generateNewArray(arraySize, type);
  };

  const tileSize = useMemo(() => {
    const base = Math.min(52, 680 / arraySize);
    return Math.max(36, base);
  }, [arraySize]);

  if (!currentStepData) {
    return (
      <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-cyan-400 text-lg">Loading Exponential Search...</div>
        </div>
      </div>
    );
  }

  const totalWidth = tileSize * arraySize + (arraySize - 1) * 6;
  const bracketTop = -6;
  const bracketHeight = tileSize + 12;
  const binaryComparisons = currentStepData.comparisons - currentStepData.jumpsMade;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Exponential Search</div>
          {headToHeadMode ? (
            <div className="text-xs text-gray-500">Head-to-Head Mode</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">Phase:</div>
              <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                currentStepData.isInBinaryPhase 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
              }`}>
                {currentStepData.isInBinaryPhase ? 'Binary Search' : 'Expanding'}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {headToHeadMode ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-cyan-400">Exp: {currentStepData.comparisons}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Lin: {currentLinearStep?.checkedCount || 0}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Jump: {currentJumpStep?.tilesChecked.length || 0}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Bin: {currentBinaryStep?.comparisons || 0}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="text-amber-400">Jumps:</div>
                <div className="text-white font-bold font-mono">{currentStepData.jumpsMade}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-cyan-400">Binary:</div>
                <div className="text-white font-bold font-mono">{binaryComparisons}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-gray-500">Total:</div>
                <div className="text-white font-bold font-mono">{currentStepData.comparisons}</div>
              </div>
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete' && currentStepData.foundIndex !== null
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : currentStepData.phase === 'complete'
              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete'
              ? (currentStepData.foundIndex !== null ? `Found at ${currentStepData.foundIndex + 1}` : 'Not Found')
              : currentStepData.phase === 'match' ? 'Found!'
              : currentStepData.phase === 'not-found' ? 'Not Found'
              : currentStepData.isInBinaryPhase ? 'Binary Phase' : 'Expanding...'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative p-6 flex flex-col gap-3 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Target Display */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Looking for</div>
          <div
            className="rounded-xl flex items-center justify-center font-bold font-mono"
            style={{
              width: 72,
              height: 72,
              border: `3px solid ${COLORS.target.border}`,
              backgroundColor: COLORS.target.bg,
              color: COLORS.target.text,
              fontSize: 28,
              boxShadow: `0 0 16px #40d8d060, 0 0 32px #40d8d030`,
            }}
          >
            {target}
          </div>
        </div>

        {/* Phase Indicator */}
        {!headToHeadMode && (
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: currentStepData.isInBinaryPhase ? COLORS.phaseAmber : '#1a1400' }}>
              <div className={`w-2 h-2 rounded-full ${currentStepData.isInBinaryPhase ? 'bg-amber-500/50' : 'bg-amber-400'}`} />
              <span className="text-xs text-amber-400">Phase 1: Exponential Jumps</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: currentStepData.isInBinaryPhase ? COLORS.phaseCyan : '#0a0a14' }}>
              <div className={`w-2 h-2 rounded-full ${currentStepData.isInBinaryPhase ? 'bg-cyan-400' : 'bg-cyan-500/50'}`} />
              <span className="text-xs text-cyan-400">Phase 2: Binary Search</span>
            </div>
          </div>
        )}

        {/* Jump Multiplier Display */}
        {!headToHeadMode && !currentStepData.isInBinaryPhase && (
          <div className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800">
            <span className="text-[10px] text-gray-500 mr-2">Jump:</span>
            {[1, 2, 4, 8, 16, 32].slice(0, Math.ceil(Math.log2(arraySize)) + 2).map((mult, i) => (
              <div key={mult} className="flex items-center">
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  i < currentStepData.jumpsMade 
                    ? 'bg-amber-500/30 text-amber-400' 
                    : i === currentStepData.jumpsMade 
                    ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                    : 'bg-gray-800 text-gray-600'
                }`}>
                  ×{mult}
                </div>
                {i < 5 && <span className="text-gray-600 mx-0.5">→</span>}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        {!headToHeadMode && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <input
              type="number"
              placeholder="Enter number..."
              value={customTargetInput}
              onChange={(e) => setCustomTargetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCustomTarget()}
              className="w-36 px-3 py-1.5 rounded-lg text-sm font-mono bg-gray-900 text-cyan-400 border border-cyan-500/50 placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              onClick={searchCustomTarget}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/40 transition-colors"
            >
              Search
            </button>
            <button
              onClick={generateRandomArray}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              New Array
            </button>
            <button
              onClick={regenerateTarget}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 transition-colors"
            >
              Random Target
            </button>
            <button
              onClick={regenerateMissingTarget}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 transition-colors"
            >
              Missing Target
            </button>
          </div>
        )}

        {/* Jump Trail */}
        {!headToHeadMode && currentStepData.jumpTrail.length > 0 && (
          <div className="flex justify-center">
            <div className="relative" style={{ width: `${totalWidth}px` }}>
              <div className="flex items-end gap-1 px-2 py-2">
                {currentStepData.jumpTrail.map((idx, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-sm border-2 flex items-center justify-center"
                      style={{
                        borderColor: i === currentStepData.jumpsMade - 1 && currentStepData.phase === 'expanding' 
                          ? COLORS.jumpLanding.border 
                          : '#4a4a50',
                        backgroundColor: i < currentStepData.jumpsMade - 1 
                          ? '#2a2a30' 
                          : i === currentStepData.jumpsMade - 1 && currentStepData.phase === 'expanding'
                          ? COLORS.jumpLanding.bg
                          : 'transparent',
                      }}
                    >
                      {i < currentStepData.jumpsMade && (
                        <span className="text-[8px] font-mono" style={{ color: i < currentStepData.jumpsMade - 1 ? '#6a6a70' : '#ffffff' }}>
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <div className="text-[7px] text-gray-600 mt-0.5">×{Math.pow(2, i)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Boundary Labels */}
        {!headToHeadMode && currentStepData.windowSize > 0 && (
          <div className="flex justify-center">
            <div className="relative" style={{ width: `${totalWidth}px` }}>
              <div className="absolute flex justify-between w-full">
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold" style={{ color: currentStepData.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border }}>L</div>
                  <div className="text-[9px] text-gray-500 font-mono">({currentStepData.low + 1})</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold" style={{ color: currentStepData.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border }}>R</div>
                  <div className="text-[9px] text-gray-500 font-mono">({currentStepData.high + 1})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tile Row */}
        {headToHeadMode ? (
          <div className="flex flex-col gap-3 items-center">
            <ExpTileRow array={array} step={currentStepData} tileSize={tileSize} totalWidth={totalWidth} bracketTop={bracketTop} bracketHeight={bracketHeight} showMatchArc={showMatchArc} showHandoff={showHandoff} />
            <JumpTileRow array={array} step={currentJumpStep} tileSize={tileSize} />
            <LinearTileRow array={array} step={currentLinearStep} tileSize={tileSize} />
            <BinaryTileRow array={array} step={currentBinaryStep} tileSize={tileSize} totalWidth={totalWidth} bracketTop={bracketTop} bracketHeight={bracketHeight} />
          </div>
        ) : (
          <ExpTileRow array={array} step={currentStepData} tileSize={tileSize} totalWidth={totalWidth} bracketTop={bracketTop} bracketHeight={bracketHeight} showMatchArc={showMatchArc} showHandoff={showHandoff} />
        )}

        {/* Halving History (Binary Phase) */}
        {!headToHeadMode && currentStepData.isInBinaryPhase && currentStepData.halvingHistory.filter(h => h.size > 0).length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col gap-1 px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-800 max-w-2xl w-full">
              <div className="text-[9px] text-gray-600 uppercase tracking-widest">Binary Halving History</div>
              {currentStepData.halvingHistory.filter(h => h.size > 0).map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-16 h-4 rounded bg-gray-800 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-gray-400">#{i + 1}</span>
                  </div>
                  <div className="flex-1 h-4 bg-gray-800/60 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(h.size / (currentStepData.high - currentStepData.low + 1)) * 100}%`,
                        backgroundColor: h.direction === 'left' ? '#4a1020' : h.direction === 'right' ? '#10204a' : '#0a2a2a',
                      }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 w-24">
                    Check <span className="text-gray-300">{h.midVal}</span> — {h.direction === 'left' ? 'look left' : h.direction === 'right' ? 'look right' : 'found!'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Panel */}
        {!headToHeadMode && currentStepData.isInBinaryPhase && currentStepData.mid >= 0 && (
          <div className="flex flex-col items-center gap-3" style={{ backgroundColor: COLORS.phaseCyan }}>
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  width: 48,
                  height: 48,
                  border: `3px solid ${COLORS.target.border}`,
                  backgroundColor: COLORS.target.bg,
                  color: COLORS.target.text,
                  fontSize: 16,
                }}
              >
                {target}
              </div>
              <div className="text-2xl font-bold">
                {currentStepData.phase === 'match'
                  ? <span className="text-green-400">=</span>
                  : (() => {
                      const mid = currentStepData.array[currentStepData.mid];
                      if (mid === target) return <span className="text-green-400">=</span>;
                      if (mid < target) return <span className="text-blue-400">&lt;</span>;
                      return <span className="text-rose-400">&gt;</span>;
                    })()
                }
              </div>
              <div
                className="rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  width: 48,
                  height: 48,
                  border: `3px solid ${COLORS.middle.border}`,
                  backgroundColor: COLORS.middle.bg,
                  color: COLORS.middle.text,
                  fontSize: 16,
                }}
              >
                {currentStepData.array[currentStepData.mid]}
              </div>
              {currentStepData.phase !== 'match' && currentStepData.phase !== 'complete' && (
                <div className="ml-4 px-3 py-1 rounded-lg text-sm font-medium" style={{
                  backgroundColor: currentStepData.array[currentStepData.mid] < target ? '#10204a' : '#4a1020',
                  color: currentStepData.array[currentStepData.mid] < target ? '#60a0ff' : '#ff8090',
                }}>
                  {currentStepData.array[currentStepData.mid] < target ? 'look right' : 'look left'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jump Comparison Panel */}
        {!headToHeadMode && !currentStepData.isInBinaryPhase && currentStepData.boundIndex >= 0 && (
          <div className="flex flex-col items-center gap-3" style={{ backgroundColor: COLORS.phaseAmber }}>
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  width: 48,
                  height: 48,
                  border: `3px solid ${COLORS.target.border}`,
                  backgroundColor: COLORS.target.bg,
                  color: COLORS.target.text,
                  fontSize: 16,
                }}
              >
                {target}
              </div>
              <div className="text-2xl font-bold text-amber-400">→→</div>
              <div
                className="rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  width: 48,
                  height: 48,
                  border: `3px solid ${COLORS.jumpLanding.border}`,
                  backgroundColor: COLORS.jumpLanding.bg,
                  color: COLORS.jumpLanding.text,
                  fontSize: 16,
                }}
              >
                {currentStepData.array[currentStepData.boundIndex]}
              </div>
              {currentStepData.phase === 'found-bound' && (
                <div className="ml-4 px-3 py-1 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400">
                  Handoff!
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Next jump: <span className="text-amber-400 font-mono">×{currentStepData.nextJumpMultiplier}</span>
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="text-center px-8">
          <div className={`text-sm leading-relaxed ${
            currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null) ? 'text-cyan-400'
            : currentStepData.phase === 'not-found' || (currentStepData.phase === 'complete' && !currentStepData.foundIndex) ? 'text-gray-400'
            : currentStepData.phase === 'eliminate-left' ? 'text-rose-400/90'
            : currentStepData.phase === 'eliminate-right' ? 'text-blue-400/90'
            : 'text-gray-400'
          }`}>
            {headToHeadMode ? (
              currentStepData.phase === 'complete' ? (
                <>
                  <span className="text-cyan-400">Exp: {currentStepData.comparisons}</span>
                  <span className="text-gray-500 mx-1">·</span>
                  <span className="text-gray-400">Lin: {currentLinearStep?.checkedCount || 0}</span>
                  <span className="text-gray-500 mx-1">·</span>
                  <span className="text-gray-400">Jump: {currentJumpStep?.tilesChecked.length || 0}</span>
                  <span className="text-gray-500 mx-1">·</span>
                  <span className="text-gray-400">Bin: {currentBinaryStep?.comparisons || 0}</span>
                </>
              ) : (
                'Running all four searches in parallel...'
              )
            ) : (
              currentStepData.caption
            )}
          </div>
        </div>

        {/* Footer Note */}
        {!headToHeadMode && (
          <div className="text-center px-8">
            <div className="text-xs text-gray-600">
              Exponential search: O(log n) for bounded arrays.
              {currentStepData.jumpsMade > 0 && (
                <> {currentStepData.jumpsMade} jump{currentStepData.jumpsMade > 1 ? 's' : ''} + {binaryComparisons} binary = {currentStepData.comparisons} total. </>
              )}
            </div>
            {currentStepData.phase === 'complete' && (
              <div className="text-[10px] text-gray-700 mt-1">
                Exponential search shines when the target is near the beginning or when the array size is unknown.
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {showInfo && (
          <div className="border border-gray-700 rounded-lg p-3 bg-gray-900/50 max-w-2xl mx-auto">
            <div className="text-xs text-gray-400 leading-relaxed">
              <span className="text-amber-400 font-semibold">Why not just use binary search?</span><br />
              Binary search needs to know both endpoints before it starts. Exponential search doesn't — it finds its own boundaries by jumping exponentially until it overshoots. Then binary search finishes the job. This makes it useful for searching sorted arrays of unknown or infinite size.
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setCurrentStep(0);
              setShowMatchArc(false);
              setShowHandoff(false);
              setShowWave(null);
              setLinearStep(0);
              setJumpStep(0);
              setBinaryStep(0);
              setHeadToHeadMode(false);
            }}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            Restart
          </button>
          <button
            onClick={() => { setPlaying(!playing); lastTimeRef.current = 0; }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              playing ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? 'Pause' : headToHeadMode ? 'Run All' : 'Search'}
          </button>
          <button
            onClick={handleStep}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            title="Next"
          >
            <SkipForward size={16} />
          </button>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-2 rounded-lg transition-colors ${showExplanation ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
            title="Explain"
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showInfo ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500 hover:text-gray-400'
            }`}
          >
            Why?
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(['random', 'near-start', 'near-end', 'not-present', 'unknown-size'] as ArrayType[]).map(type => (
            <button
              key={type}
              onClick={() => handlePreset(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                arrayType === type && !headToHeadMode
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {type === 'random' ? 'Random'
               : type === 'near-start' ? 'Near Start'
               : type === 'near-end' ? 'Near End'
               : type === 'not-present' ? 'Not Present'
               : 'Unknown Size'}
            </button>
          ))}
          <button
            onClick={startHeadToHead}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              headToHeadMode
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            Head to Head
          </button>
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Size:</label>
            <input
              type="range"
              min={4}
              max={64}
              value={arraySize}
              onChange={(e) => {
                const size = parseInt(e.target.value);
                setArraySize(size);
                if (!headToHeadMode) generateNewArray(size, arrayType);
              }}
              className="w-20 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 font-mono">{arraySize}</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Speed:</label>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-20 accent-cyan-500"
            />
          </div>
        </div>

        {showExplanation && currentStepData && (
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50 max-w-2xl mx-auto">
            <div className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">Explain This Step</div>
            <div className="text-sm text-gray-300 leading-relaxed">
              {currentStepData.caption}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes waveFade {
          from { opacity: 0.8; }
          to { opacity: 0; }
        }
        @keyframes handoffPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function ExpTileRow({ array, step, tileSize, totalWidth, bracketTop, bracketHeight, showMatchArc, showHandoff }: {
  array: number[];
  step: ExpStep;
  tileSize: number;
  totalWidth: number;
  bracketTop: number;
  bracketHeight: number;
  showMatchArc: boolean;
  showHandoff: boolean;
}) {
  const getTileColors = (idx: number) => {
    const isFound = step.foundIndex === idx;
    const isMiddle = step.mid === idx;
    const isEliminated = step.eliminated.includes(idx);
    const isJumpLanding = step.boundIndex === idx && step.phase === 'expanding';

    if (isFound) return COLORS.found;
    if (isMiddle) return COLORS.middle;
    if (isJumpLanding) return COLORS.jumpLanding;
    if (step.jumpTrail.includes(idx) && !isEliminated) return COLORS.jumpTooSmall;
    if (isEliminated) return COLORS.eliminated;
    return COLORS.default;
  };

  const getTileOpacity = (idx: number) => {
    if (step.eliminated.includes(idx)) return 0.3;
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Bracket Lines and Pointer */}
      <div className="relative" style={{ width: `${totalWidth}px`, height: 55 }}>
        {/* Left Bracket */}
        {step.windowSize > 0 && (
          <div
            className="absolute transition-all duration-[400ms] ease-out"
            style={{
              left: step.low * (tileSize + 6) - 2,
              top: bracketTop,
              width: 3,
              height: bracketHeight,
              backgroundColor: step.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border,
              boxShadow: `0 0 8px ${step.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border}80`,
              borderRadius: 2,
            }}
          />
        )}
        {/* Right Bracket */}
        {step.windowSize > 0 && (
          <div
            className="absolute transition-all duration-[400ms] ease-out"
            style={{
              left: step.high * (tileSize + 6) + tileSize + 3,
              top: bracketTop,
              width: 3,
              height: bracketHeight,
              backgroundColor: step.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border,
              boxShadow: `0 0 8px ${step.isInBinaryPhase ? COLORS.windowBracket : COLORS.jumpLanding.border}80`,
              borderRadius: 2,
            }}
          />
        )}

        {/* Jump Pointer (Expanding Phase) */}
        {step.boundIndex >= 0 && !step.isInBinaryPhase && step.phase !== 'complete' && (
          <div
            className="absolute transition-all duration-150"
            style={{
              left: step.boundIndex * (tileSize + 6) + tileSize / 2 - 16,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
              <path d="M16 0 L32 22 L0 22 Z" fill={COLORS.jumpLanding.border} filter="url(#jumpGlow)" />
              <defs>
                <filter id="jumpGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
            <div className="text-[8px] text-amber-400 text-center mt-0.5 font-medium">Jump</div>
          </div>
        )}

        {/* Middle Pointer (Binary Phase) */}
        {step.mid >= 0 && step.isInBinaryPhase && step.phase !== 'complete' && (
          <div
            className="absolute transition-all duration-150"
            style={{
              left: step.mid * (tileSize + 6) + tileSize / 2 - 16,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
              <path d="M16 0 L32 22 L0 22 Z" fill={COLORS.middle.border} filter="url(#midGlowExp)" />
              <defs>
                <filter id="midGlowExp">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
            <div className="text-[8px] text-yellow-400 text-center mt-0.5 font-medium">Middle</div>
          </div>
        )}

        {/* Match Arc */}
        {showMatchArc && step.foundIndex !== null && (
          <svg
            className="absolute pointer-events-none"
            style={{ top: -50, left: 0, width: totalWidth, height: 60, zIndex: 10 }}
          >
            <path
              d={`M 36 Q ${step.foundIndex * (tileSize + 6) + tileSize / 2} -40, ${step.foundIndex * (tileSize + 6) + tileSize / 2} 0`}
              stroke="#40d8d0"
              strokeWidth="3"
              fill="none"
              opacity="0.9"
            />
          </svg>
        )}

        {/* Handoff Indicator */}
        {showHandoff && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              animation: 'handoffPulse 0.5s ease-in-out',
            }}
          >
            <span className="text-xs text-cyan-400 font-bold px-2 py-1 bg-cyan-500/20 rounded border border-cyan-500/50">
              Binary Search Takes Over!
            </span>
          </div>
        )}
      </div>

      {/* Tiles */}
      <div className="flex items-center gap-[6px] relative">
        {array.map((val, idx) => {
          const colors = getTileColors(idx);
          const opacity = getTileOpacity(idx);
          const isMiddle = step.mid === idx && step.isInBinaryPhase;
          const isFound = step.foundIndex === idx;
          const isJumpLanding = step.boundIndex === idx && !step.isInBinaryPhase;

          return (
            <div
              key={idx}
              className="relative transition-all duration-200"
              style={{
                width: tileSize,
                height: tileSize,
                opacity,
                zIndex: isMiddle || isJumpLanding ? 3 : 1,
              }}
            >
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold transition-all duration-200"
                style={{
                  border: `3px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: tileSize * 0.32,
                  boxShadow: isFound
                    ? `0 0 24px ${COLORS.found.border}90, 0 0 48px ${COLORS.found.border}50`
                    : isMiddle
                    ? `0 0 20px #e8c04070, 0 0 40px #e8c04040`
                    : isJumpLanding
                    ? `0 0 20px #d4a04070, 0 0 40px #d4a04040`
                    : 'none',
                  transform: (isMiddle || isJumpLanding) && !isFound ? 'scale(1.12)' : 'scale(1)',
                  zIndex: isMiddle || isJumpLanding ? 4 : 1,
                }}
              >
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JumpTileRow({ array, step, tileSize }: { array: number[]; step: JumpStep | null; tileSize: number }) {
  if (!step) return null;
  const totalWidth = tileSize * array.length + (array.length - 1) * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Jump Search</div>
      <div className="relative" style={{ width: `${totalWidth}px`, height: 30 }}>
        {step.phase !== 'idle' && step.phase !== 'complete' && (
          <div
            className="absolute transition-all duration-150"
            style={{
              left: step.currentIndex * (tileSize + 6) + tileSize / 2 - 10,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path d="M10 0 L20 12 L0 12 Z" fill="#d4a040" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[6px]">
        {array.map((val, idx) => {
          const isChecked = step.tilesChecked.includes(idx);
          const isFound = step.foundIndex === idx;
          return (
            <div key={idx} className="relative" style={{ width: tileSize, height: tileSize }}>
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  border: `3px solid ${isFound ? '#40d8d0' : isChecked ? '#6a5020' : '#2a5a58'}`,
                  backgroundColor: isFound ? '#0a1e1e' : isChecked ? '#141008' : '#0f1e1e',
                  color: isFound ? '#ffffff' : isChecked ? '#a08040' : '#7abfb8',
                  fontSize: tileSize * 0.32,
                  opacity: isChecked && !isFound ? 0.6 : 1,
                }}
              >
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LinearTileRow({ array, step, tileSize }: { array: number[]; step: LinearStep | null; tileSize: number }) {
  if (!step) return null;
  const totalWidth = tileSize * array.length + (array.length - 1) * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Linear Search</div>
      <div className="relative" style={{ width: `${totalWidth}px`, height: 30 }}>
        {step.phase !== 'idle' && step.phase !== 'complete' && (
          <div
            className="absolute transition-all duration-150"
            style={{
              left: step.currentIndex * (tileSize + 6) + tileSize / 2 - 10,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path d="M10 0 L20 12 L0 12 Z" fill="#40d8d0" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[6px]">
        {array.map((val, idx) => {
          const isChecked = step.tilesChecked.includes(idx);
          const isFound = step.foundIndex === idx;
          return (
            <div key={idx} className="relative" style={{ width: tileSize, height: tileSize }}>
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  border: `3px solid ${isFound ? '#40d8d0' : isChecked ? '#1a3030' : '#2a5a58'}`,
                  backgroundColor: isFound ? '#0a1e1e' : isChecked ? '#0a1414' : '#0f1e1e',
                  color: isFound ? '#ffffff' : isChecked ? '#3a5a50' : '#7abfb8',
                  fontSize: tileSize * 0.32,
                  opacity: isChecked && !isFound ? 0.4 : 1,
                }}
              >
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BinaryTileRow({ array, step, tileSize, totalWidth, bracketTop, bracketHeight }: { array: number[]; step: BinaryStep | null; tileSize: number; totalWidth: number; bracketTop: number; bracketHeight: number }) {
  if (!step) return null;

  const getTileColors = (idx: number) => {
    const isFound = step.foundIndex === idx;
    const isMiddle = step.mid === idx;
    const isEliminated = step.eliminated.includes(idx);

    if (isFound) return { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' };
    if (isMiddle) return { border: '#e8c040', text: '#ffffff', bg: '#1a1408' };
    if (isEliminated) return { border: '#1a2a28', text: '#3a5a50', bg: '#0a1414' };
    return { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-1">Binary Search</div>
      <div className="relative" style={{ width: `${totalWidth}px`, height: 30 }}>
        {/* Left Bracket */}
        {step.windowSize > 0 && (
          <div
            className="absolute"
            style={{
              left: step.low * (tileSize + 6) - 2,
              top: bracketTop,
              width: 3,
              height: bracketHeight,
              backgroundColor: '#2a8a80',
              boxShadow: '0 0 8px #2a8a8080',
              borderRadius: 2,
            }}
          />
        )}
        {/* Right Bracket */}
        {step.windowSize > 0 && (
          <div
            className="absolute"
            style={{
              left: step.high * (tileSize + 6) + tileSize + 3,
              top: bracketTop,
              width: 3,
              height: bracketHeight,
              backgroundColor: '#2a8a80',
              boxShadow: '0 0 8px #2a8a8080',
              borderRadius: 2,
            }}
          />
        )}
        {/* Middle Pointer */}
        {step.mid >= 0 && step.phase !== 'complete' && (
          <div
            className="absolute"
            style={{
              left: step.mid * (tileSize + 6) + tileSize / 2 - 10,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path d="M10 0 L20 12 L0 12 Z" fill="#e8c040" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[6px]">
        {array.map((val, idx) => {
          const colors = getTileColors(idx);
          const isEliminated = step.eliminated.includes(idx);
          const isMiddle = step.mid === idx;
          const isFound = step.foundIndex === idx;

          return (
            <div key={idx} className="relative" style={{ width: tileSize, height: tileSize, opacity: isEliminated && !isFound ? 0.3 : 1 }}>
              <div
                className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold"
                style={{
                  border: `3px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: tileSize * 0.32,
                  boxShadow: isFound
                    ? '0 0 20px #40d8d070'
                    : isMiddle
                    ? '0 0 16px #e8c04050'
                    : 'none',
                  transform: isMiddle && !isFound ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {val}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
