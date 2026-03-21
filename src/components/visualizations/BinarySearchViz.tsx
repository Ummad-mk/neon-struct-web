import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'check-mid' | 'compare' | 'eliminate-left' | 'eliminate-right' | 'match' | 'not-found' | 'complete';
type ArrayType = 'random' | 'best' | 'worst' | 'not-present' | 'large' | 'head-to-head';

interface BinaryStep {
  array: number[];
  target: number;
  phase: Phase;
  low: number;
  high: number;
  mid: number;
  windowSize: number;
  comparisons: number;
  eliminated: number[];
  halvingHistory: { mid: number; midVal: number; size: number; direction: 'left' | 'right' | 'found' | 'not-found'; newSize: number }[];
  foundIndex: number | null;
  caption: string;
  comparisonText: string;
  eliminationWave: 'left' | 'right' | null;
}

const COLORS = {
  default: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  eliminated: { border: '#1a2a28', text: '#3a5a50', bg: '#0a1414' },
  windowBracket: '#2a8a80',
  middle: { border: '#e8c040', text: '#ffffff', bg: '#1a1408' },
  found: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  target: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  boundaryLeft: '#4a90d0',
  boundaryRight: '#d06080',
  waveRose: '#300a10',
  waveBlue: '#0a1030',
  bracketCollide: '#ffffff',
};

function generateSortedArray(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) arr.push(i * 3 + Math.floor(Math.random() * 5) + 5);
  return arr.sort((a, b) => a - b);
}

function generateLargeArray(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 64; i++) arr.push(i * 5 + Math.floor(Math.random() * 5) + 10);
  return arr.sort((a, b) => a - b);
}

function generateSearchSteps(arr: number[], target: number, _arrayType: ArrayType): BinaryStep[] {
  const steps: BinaryStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  let low = 0;
  let high = n - 1;
  let foundIndex: number | null = null;
  const eliminated: number[] = [];
  const halvingHistory: BinaryStep['halvingHistory'] = [];

  const addStep = (partial: Partial<BinaryStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      target,
      low,
      high,
      mid: low <= high ? Math.floor((low + high) / 2) : -1,
      windowSize: low <= high ? high - low + 1 : 0,
      comparisons,
      eliminated: [...eliminated],
      halvingHistory: [...halvingHistory],
      foundIndex,
      caption: '',
      comparisonText: '',
      eliminationWave: null,
      ...partial,
    } as BinaryStep);
  };

  addStep({
    array: [...array],
    phase: 'idle',
    low: 0,
    high: n - 1,
    mid: Math.floor((n - 1) / 2),
    windowSize: n,
    comparisons: 0,
    eliminated: [],
    halvingHistory: [],
    foundIndex: null,
    caption: `Binary search works on sorted arrays. Check the middle — if too small, eliminate left half. If too big, eliminate right half. Each check halves the remaining tiles.`,
    comparisonText: `Active window: ${n} tiles. Middle is at position ${Math.floor((n - 1) / 2) + 1}.`,
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;

    const midVal = array[mid];

    addStep({
      array: [...array],
      phase: 'check-mid',
      low,
      high,
      mid,
      windowSize: high - low + 1,
      comparisons,
      eliminated: [...eliminated],
      halvingHistory: [...halvingHistory],
      foundIndex: null,
      caption: `Checking middle: position ${mid + 1} (value ${midVal})`,
      comparisonText: `Is ${midVal} equal to ${target}?`,
    });

    addStep({
      array: [...array],
      phase: 'compare',
      low,
      high,
      mid,
      windowSize: high - low + 1,
      comparisons,
      eliminated: [...eliminated],
      halvingHistory: [...halvingHistory],
      foundIndex: null,
      caption: `Comparing ${midVal} to ${target}...`,
      comparisonText: `${midVal} ${midVal === target ? '==' : midVal < target ? '<' : '>'} ${target}`,
    });

    if (midVal === target) {
      foundIndex = mid;
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'found', newSize: 1 });

      addStep({
        array: [...array],
        phase: 'match',
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        halvingHistory: [...halvingHistory],
        foundIndex: mid,
        caption: `${midVal} equals ${target} — found it! Binary search took only ${comparisons} comparison${comparisons > 1 ? 's' : ''}.`,
        comparisonText: `${midVal} == ${target} — found!`,
        eliminationWave: null,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        low,
        high,
        mid,
        windowSize: 1,
        comparisons,
        eliminated: [...eliminated],
        halvingHistory: [...halvingHistory],
        foundIndex: mid,
        caption: `Found ${target} at position ${mid + 1} in just ${comparisons} comparisons. Binary search is incredibly fast!`,
        comparisonText: `Binary search: ${comparisons} comparisons. Linear search would need up to ${n}.`,
      });

      return steps;
    }

    if (midVal < target) {
      const newSize = high - mid;
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'right', newSize });

      addStep({
        array: [...array],
        phase: 'eliminate-right',
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        halvingHistory: [...halvingHistory],
        foundIndex: null,
        caption: `${midVal} is less than ${target} — the target must be in the right half. Removing everything up to and including ${midVal}.`,
        comparisonText: `${midVal} < ${target} — look right. Window shrinks from ${high - low + 1} to ${newSize} tiles.`,
        eliminationWave: 'right',
      });

      for (let i = low; i <= mid; i++) eliminated.push(i);
      low = mid + 1;
    } else {
      const newSize = mid - low;
      halvingHistory.push({ mid, midVal, size: high - low + 1, direction: 'left', newSize });

      addStep({
        array: [...array],
        phase: 'eliminate-left',
        low,
        high,
        mid,
        windowSize: high - low + 1,
        comparisons,
        eliminated: [...eliminated],
        halvingHistory: [...halvingHistory],
        foundIndex: null,
        caption: `${midVal} is greater than ${target} — the target must be in the left half. Removing everything from ${midVal} rightward.`,
        comparisonText: `${midVal} > ${target} — look left. Window shrinks from ${high - low + 1} to ${newSize} tiles.`,
        eliminationWave: 'left',
      });

      for (let i = mid; i <= high; i++) eliminated.push(i);
      high = mid - 1;
    }
  }

  halvingHistory.push({ mid: -1, midVal: -1, size: 0, direction: 'not-found', newSize: 0 });

  addStep({
    array: [...array],
    phase: 'not-found',
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    halvingHistory: [...halvingHistory],
    foundIndex: null,
    caption: `The search window closed completely — there is nowhere left to look. ${target} is not in the array.`,
    comparisonText: `Not found after ${comparisons} comparisons. Linear search would need ${n}.`,
    eliminationWave: null,
  });

  addStep({
    array: [...array],
    phase: 'complete',
    low,
    high,
    mid: -1,
    windowSize: 0,
    comparisons,
    eliminated: [...eliminated],
    halvingHistory: [...halvingHistory],
    foundIndex: null,
    caption: `${target} not found. Searched ${n} tiles in ${comparisons} comparisons.`,
    comparisonText: `Not found — checked ${comparisons} tiles. Linear would need ${n}.`,
  });

  return steps;
}

interface LinearStep {
  array: number[];
  target: number;
  phase: 'idle' | 'checking' | 'found' | 'not-found' | 'complete';
  currentIndex: number;
  checkedCount: number;
  tilesChecked: number[];
  comparisons: number;
  foundIndex: number | null;
  caption: string;
}

function generateLinearSteps(arr: number[], target: number): LinearStep[] {
  const steps: LinearStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  const tilesChecked: number[] = [];

  steps.push({
    array: [...array],
    target,
    phase: 'idle',
    currentIndex: 0,
    checkedCount: 0,
    tilesChecked: [],
    comparisons: 0,
    foundIndex: null,
    caption: `Linear search: checking each tile one by one...`,
  });

  for (let i = 0; i < n; i++) {
    comparisons++;
    tilesChecked.push(i);

    steps.push({
      array: [...array],
      target,
      phase: 'checking',
      currentIndex: i,
      checkedCount: i + 1,
      tilesChecked: [...tilesChecked],
      comparisons,
      foundIndex: null,
      caption: `Checking position ${i + 1}...`,
    });

    if (array[i] === target) {
      steps.push({
        array: [...array],
        target,
        phase: 'found',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: i,
        caption: `Found!`,
      });
      steps.push({
        array: [...array],
        target,
        phase: 'complete',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: i,
        caption: `Linear: ${i + 1} tiles checked`,
      });
      return steps;
    }
  }

  steps.push({
    array: [...array],
    target,
    phase: 'not-found',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
    caption: `Not found`,
  });
  steps.push({
    array: [...array],
    target,
    phase: 'complete',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
    caption: `Linear: ${n} tiles checked`,
  });

  return steps;
}

interface JumpStep {
  array: number[];
  target: number;
  phase: 'idle' | 'jump' | 'found' | 'not-found' | 'complete';
  currentIndex: number;
  jumpCount: number;
  tilesChecked: number[];
  comparisons: number;
  foundIndex: number | null;
  caption: string;
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
    target,
    phase: 'idle',
    currentIndex: 0,
    jumpCount: 0,
    tilesChecked: [],
    comparisons: 0,
    foundIndex: null,
    caption: `Jump search: jumping in steps of ${jumpSize}...`,
  });

  while (curr < n) {
    comparisons++;
    const landing = Math.min(curr, n - 1);
    tilesChecked.push(landing);

    steps.push({
      array: [...array],
      target,
      phase: 'jump',
      currentIndex: landing,
      jumpCount: Math.floor(landing / jumpSize) + 1,
      tilesChecked: [...tilesChecked],
      comparisons,
      foundIndex: null,
      caption: `Jump to position ${landing + 1}...`,
    });

    if (array[landing] === target) {
      steps.push({
        array: [...array],
        target,
        phase: 'found',
        currentIndex: landing,
        jumpCount: Math.floor(landing / jumpSize) + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: landing,
        caption: `Found!`,
      });
      steps.push({
        array: [...array],
        target,
        phase: 'complete',
        currentIndex: landing,
        jumpCount: Math.floor(landing / jumpSize) + 1,
        tilesChecked: [...tilesChecked],
        comparisons,
        foundIndex: landing,
        caption: `Jump: ${tilesChecked.length} tiles checked`,
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
            target,
            phase: 'found',
            currentIndex: j,
            jumpCount: Math.floor(landing / jumpSize) + 1,
            tilesChecked: [...tilesChecked],
            comparisons,
            foundIndex: j,
            caption: `Found!`,
          });
          steps.push({
            array: [...array],
            target,
            phase: 'complete',
            currentIndex: j,
            jumpCount: Math.floor(landing / jumpSize) + 1,
            tilesChecked: [...tilesChecked],
            comparisons,
            foundIndex: j,
            caption: `Jump: ${tilesChecked.length} tiles checked`,
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
    target,
    phase: 'not-found',
    currentIndex: n,
    jumpCount: 0,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
    caption: `Not found`,
  });
  steps.push({
    array: [...array],
    target,
    phase: 'complete',
    currentIndex: n,
    jumpCount: 0,
    tilesChecked: [...tilesChecked],
    comparisons,
    foundIndex: null,
    caption: `Jump: ${tilesChecked.length} tiles checked`,
  });

  return steps;
}

export default function BinarySearchViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateSortedArray(16));
  const [target, setTarget] = useState<number>(() => {
    const arr = generateSortedArray(16);
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [steps, setSteps] = useState<BinaryStep[]>(() => {
    const initArr = generateSortedArray(16);
    const initTarget = initArr[Math.floor(Math.random() * initArr.length)];
    return generateSearchSteps(initArr, initTarget, 'random');
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showMatchArc, setShowMatchArc] = useState(false);
  const [showWave, setShowWave] = useState<'left' | 'right' | null>(null);
  const [showBracketsColliding, setShowBracketsColliding] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [linearSteps, setLinearSteps] = useState<LinearStep[]>([]);
  const [jumpSteps, setJumpSteps] = useState<JumpStep[]>([]);
  const [linearStep, setLinearStep] = useState(0);
  const [jumpStep, setJumpStep] = useState(0);
  const [headToHeadMode, setHeadToHeadMode] = useState(false);

  const lastTimeRef = { current: 0 };

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    let newTarget: number;

    switch (type) {
      case 'best': {
        newArr = generateSortedArray(size);
        newArr[Math.floor(size / 2)] = 100;
        newTarget = 100;
        break;
      }
      case 'worst': {
        newArr = generateSortedArray(size);
        newArr[0] = 5;
        newTarget = 5;
        break;
      }
      case 'not-present': {
        newArr = generateSortedArray(size);
        let missing = newArr[0] - 5;
        while (newArr.includes(missing)) missing--;
        newTarget = missing;
        break;
      }
      case 'large': {
        newArr = generateLargeArray();
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
    setSteps(generateSearchSteps(newArr, newTarget, type));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
  }, [arrayType]);

  const regenerateTarget = useCallback(() => {
    if (array.length === 0) return;
    const newTarget = array[Math.floor(Math.random() * array.length)];
    setTarget(newTarget);
    setSteps(generateSearchSteps([...array], newTarget, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
  }, [array, arrayType]);

  const regenerateMissingTarget = useCallback(() => {
    let missing = array[0] - 5;
    while (array.includes(missing)) missing--;
    setTarget(missing);
    setSteps(generateSearchSteps([...array], missing, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
  }, [array, arrayType]);

  const searchCustomTarget = useCallback(() => {
    const val = parseInt(customTargetInput);
    if (isNaN(val)) return;
    setTarget(val);
    setSteps(generateSearchSteps([...array], val, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
  }, [array, arrayType, customTargetInput]);

  const generateRandomArray = useCallback(() => {
    const newArr = generateSortedArray(arraySize);
    const newTarget = newArr[Math.floor(Math.random() * newArr.length)];
    setArray(newArr);
    setTarget(newTarget);
    setSteps(generateSearchSteps(newArr, newTarget, 'random'));
    setCurrentStep(0);
    setPlaying(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
    setArrayType('random');
  }, [arraySize]);

  const startHeadToHead = useCallback(() => {
    const sortedArr = generateSortedArray(arraySize);
    const newTarget = sortedArr[sortedArr.length - 1];
    setArray(sortedArr);
    setTarget(newTarget);
    setLinearSteps(generateLinearSteps(sortedArr, newTarget));
    setJumpSteps(generateJumpSteps(sortedArr, newTarget));
    setSteps(generateSearchSteps(sortedArr, newTarget, 'head-to-head'));
    setCurrentStep(0);
    setLinearStep(0);
    setJumpStep(0);
    setPlaying(true);
    setHeadToHeadMode(true);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowWave(null);
    setShowBracketsColliding(false);
  }, [arraySize]);

  const handleStep = useCallback(() => {
    if (headToHeadMode) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setLinearStep(prev => Math.min(prev + 1, linearSteps.length - 1));
        setJumpStep(prev => Math.min(prev + 1, jumpSteps.length - 1));
      } else {
        setPlaying(false);
        setLinearStep(linearSteps.length - 1);
        setJumpStep(jumpSteps.length - 1);
      }
      return;
    }

    if (currentStep < steps.length - 1) {
      const next = steps[currentStep + 1];

      if (next.phase === 'match') {
        setShowMatchArc(true);
        setTimeout(() => setShowMatchArc(false), 800);
      }

      if (next.eliminationWave) {
        setShowWave(next.eliminationWave);
        setTimeout(() => setShowWave(null), 250);
      }

      if (next.phase === 'not-found') {
        setShowBracketsColliding(true);
        setTimeout(() => setShowBracketsColliding(false), 500);
      }

      setCurrentStep(prev => prev + 1);
    } else {
      setPlaying(false);
    }
  }, [currentStep, steps, headToHeadMode, linearSteps, jumpSteps]);

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
          <div className="text-cyan-400 text-lg">Loading Binary Search...</div>
        </div>
      </div>
    );
  }

  const totalWidth = tileSize * arraySize + (arraySize - 1) * 6;
  const bracketTop = -6;
  const bracketHeight = tileSize + 12;
  const maxLogComparisons = Math.ceil(Math.log2(arraySize));

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Binary Search</div>
          {headToHeadMode ? (
            <div className="text-xs text-gray-500">Head-to-Head Mode</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">Window:</div>
              <div className="text-sm text-cyan-400 font-bold font-mono">{currentStepData.windowSize}</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {headToHeadMode ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-cyan-400">Binary: {currentStepData.comparisons}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Linear: {currentLinearStep?.checkedCount || 0}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">Jump: {currentJumpStep?.tilesChecked.length || 0}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="text-gray-500">Comparisons:</div>
                <div className="text-white font-bold font-mono">{currentStepData.comparisons}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-gray-500">Eliminated:</div>
                <div className="text-gray-400 font-bold font-mono">{currentStepData.eliminated.length}</div>
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
              : 'Searching...'}
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

        {headToHeadMode && (
          <div className="flex items-center justify-center gap-2">
            <div className="text-xs text-gray-500">Target: <span className="text-cyan-400">{target}</span></div>
            <div className="text-xs text-gray-500">in sorted array of <span className="text-gray-400">{arraySize}</span> tiles</div>
          </div>
        )}

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

        {/* Window Size Counter & Halving Cascade */}
        {!headToHeadMode && currentStepData.phase !== 'idle' && currentStepData.windowSize >= 0 && (
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active window</div>
              <div
                className="font-mono font-bold text-cyan-400 transition-all duration-300"
                style={{ fontSize: Math.max(10, 14 - (arraySize - currentStepData.windowSize) * 0.4) }}
              >
                {currentStepData.windowSize} tiles
              </div>
            </div>

            {currentStepData.halvingHistory.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900/60 border border-gray-800">
                <span className="font-mono text-[10px] text-cyan-400">{arraySize}</span>
                {currentStepData.halvingHistory.map((h, i) => (
                  <span key={i} className="font-mono text-[10px]">
                    <span className="text-gray-600 mx-0.5">→</span>
                    <span className="text-gray-400">{h.newSize}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600">log₂({arraySize}) = </span>
              <span className="text-[10px] text-gray-400 font-mono">{maxLogComparisons}</span>
              <span className="text-[10px] text-gray-600">max</span>
            </div>
          </div>
        )}

        {/* Boundary Labels */}
        {!headToHeadMode && currentStepData.windowSize > 0 && (
          <div className="flex justify-center">
            <div className="relative" style={{ width: `${totalWidth}px` }}>
              <div className="absolute flex justify-between w-full">
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold" style={{ color: COLORS.boundaryLeft }}>L</div>
                  <div className="text-[9px] text-gray-500 font-mono">({currentStepData.low})</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold" style={{ color: COLORS.boundaryRight }}>R</div>
                  <div className="text-[9px] text-gray-500 font-mono">({currentStepData.high})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Strip */}
        {!headToHeadMode && currentStepData.windowSize >= 0 && (
          <div className="flex justify-center">
            <div className="flex gap-0.5 px-2 py-1 rounded bg-gray-900/40">
              {Array.from({ length: arraySize }, (_, i) => {
                const isInWindow = i >= currentStepData.low && i <= currentStepData.high;
                return (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: isInWindow ? '#2a8a80' : '#1a2a28',
                      opacity: isInWindow ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tile Row */}
        {headToHeadMode ? (
          <div className="flex flex-col gap-4 items-center">
            <div className="text-center">
              <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-2">Binary Search</div>
              <BinaryTileRow array={array} step={currentStepData} tileSize={tileSize} totalWidth={totalWidth} bracketTop={bracketTop} bracketHeight={bracketHeight} showMatchArc={showMatchArc} showWave={showWave} showBracketsColliding={showBracketsColliding} />
            </div>
            <div className="text-center">
              <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-2">Jump Search</div>
              {currentJumpStep && <JumpTileRow array={array} step={currentJumpStep} tileSize={tileSize} />}
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Linear Search</div>
              {currentLinearStep && <LinearTileRow array={array} step={currentLinearStep} tileSize={tileSize} />}
            </div>
          </div>
        ) : (
          <BinaryTileRow array={array} step={currentStepData} tileSize={tileSize} totalWidth={totalWidth} bracketTop={bracketTop} bracketHeight={bracketHeight} showMatchArc={showMatchArc} showWave={showWave} showBracketsColliding={showBracketsColliding} />
        )}

        {/* Halving History */}
        {!headToHeadMode && currentStepData.halvingHistory.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col gap-1 px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-800 max-w-2xl w-full">
              <div className="text-[9px] text-gray-600 uppercase tracking-widest">Halving History</div>
              {currentStepData.halvingHistory.filter(h => h.size > 0).map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-5 rounded bg-gray-800 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-gray-400">#{i + 1}</span>
                  </div>
                  <div className="flex-1 h-5 bg-gray-800/60 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{
                        width: `${(h.size / arraySize) * 100}%`,
                        backgroundColor: h.direction === 'left' ? '#4a1020' : h.direction === 'right' ? '#10204a' : '#0a2a2a',
                      }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 w-36">
                    Check <span className="text-gray-300">{h.midVal}</span> — {h.direction === 'left' ? 'look left' : h.direction === 'right' ? 'look right' : 'found!'}
                  </div>
                  <div className="text-[9px] text-gray-600 font-mono w-20 text-right">
                    {h.size} → {h.newSize}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Panel */}
        {!headToHeadMode && currentStepData.windowSize > 0 && currentStepData.mid >= 0 && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 mb-1">Left end</div>
                <div
                  className="rounded-lg flex items-center justify-center font-mono font-bold"
                  style={{
                    width: 48,
                    height: 48,
                    border: `3px solid ${COLORS.default.border}`,
                    backgroundColor: COLORS.default.bg,
                    color: COLORS.default.text,
                    fontSize: 16,
                  }}
                >
                  {currentStepData.low >= 0 && currentStepData.low < arraySize ? currentStepData.array[currentStepData.low] : '-'}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">
                  {currentStepData.low >= 0 ? `idx ${currentStepData.low}` : '-'}
                </div>
              </div>

              <div className="text-xl text-gray-500">&lt;</div>

              <div className="flex flex-col items-center">
                <div className="text-[9px] text-yellow-400 mb-1">Middle</div>
                <div
                  className="rounded-lg flex items-center justify-center font-mono font-bold"
                  style={{
                    width: 48,
                    height: 48,
                    border: `3px solid ${COLORS.middle.border}`,
                    backgroundColor: COLORS.middle.bg,
                    color: COLORS.middle.text,
                    fontSize: 16,
                    boxShadow: `0 0 12px #e8c04050`,
                  }}
                >
                  {currentStepData.mid >= 0 ? currentStepData.array[currentStepData.mid] : '-'}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">
                  {currentStepData.mid >= 0 ? `idx ${currentStepData.mid}` : '-'}
                </div>
              </div>

              <div className="text-xl text-gray-500">&lt;</div>

              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 mb-1">Right end</div>
                <div
                  className="rounded-lg flex items-center justify-center font-mono font-bold"
                  style={{
                    width: 48,
                    height: 48,
                    border: `3px solid ${COLORS.default.border}`,
                    backgroundColor: COLORS.default.bg,
                    color: COLORS.default.text,
                    fontSize: 16,
                  }}
                >
                  {currentStepData.high >= 0 && currentStepData.high < arraySize ? currentStepData.array[currentStepData.high] : '-'}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">
                  {currentStepData.high >= 0 ? `idx ${currentStepData.high}` : '-'}
                </div>
              </div>
            </div>

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
                  boxShadow: `0 0 8px ${COLORS.target.border}40`,
                }}
              >
                {target}
              </div>
              <div className="text-2xl font-bold">
                {currentStepData.phase === 'match'
                  ? <span className="text-green-400">=</span>
                  : currentStepData.phase === 'complete' && !currentStepData.foundIndex
                  ? <span className="text-gray-500">≠</span>
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
                {currentStepData.mid >= 0 ? currentStepData.array[currentStepData.mid] : '-'}
              </div>

              {currentStepData.phase !== 'match' && currentStepData.phase !== 'complete' && currentStepData.windowSize > 1 && (
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
                  <span className="text-cyan-400">Binary: {currentStepData.comparisons} checks</span>
                  <span className="text-gray-500 mx-2">·</span>
                  <span className="text-gray-400">Linear: {currentLinearStep?.checkedCount || 0} checked</span>
                  <span className="text-gray-500 mx-2">·</span>
                  <span className="text-gray-400">Jump: {currentJumpStep?.tilesChecked.length || 0} checked</span>
                </>
              ) : (
                'Running all three searches in parallel...'
              )
            ) : (
              currentStepData.caption
            )}
          </div>
        </div>

        {!headToHeadMode && (
          <div className="text-center px-8">
            <div className="text-xs text-gray-600">
              Binary search: O(log n) — for {arraySize} tiles at most {maxLogComparisons} comparisons.
              {currentStepData.comparisons > 0 && currentStepData.foundIndex !== null
                ? ` Found ${target} at position ${currentStepData.foundIndex + 1} in ${currentStepData.comparisons} check${currentStepData.comparisons > 1 ? 's' : ''}.`
                : currentStepData.comparisons > 0
                ? ` Checked ${currentStepData.comparisons} tile${currentStepData.comparisons > 1 ? 's' : ''}.`
                : ` Each comparison halves the remaining tiles.`}
            </div>
            {currentStepData.phase === 'complete' && (
              <div className="text-[10px] text-gray-700 mt-1">
                Binary search is one of the most powerful ideas in computer science. Doubling the array size adds only one more comparison. A billion tiles needs only 30 checks.
              </div>
            )}
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
              setShowWave(null);
              setShowBracketsColliding(false);
              setLinearStep(0);
              setJumpStep(0);
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
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(['random', 'best', 'worst', 'not-present', 'large'] as ArrayType[]).map(type => (
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
               : type === 'best' ? 'Best (Middle)'
               : type === 'worst' ? 'Worst (Edge)'
               : type === 'not-present' ? 'Not Present'
               : 'Large (64)'}
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
        @keyframes bracketPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function BinaryTileRow({ array, step, tileSize, totalWidth, bracketTop, bracketHeight, showMatchArc, showWave, showBracketsColliding }: {
  array: number[];
  step: BinaryStep;
  tileSize: number;
  totalWidth: number;
  bracketTop: number;
  bracketHeight: number;
  showMatchArc: boolean;
  showWave: 'left' | 'right' | null;
  showBracketsColliding: boolean;
}) {
  const getTileColors = (idx: number) => {
    const isFound = step.foundIndex === idx;
    const isMiddle = step.mid === idx;
    const isEliminated = step.eliminated.includes(idx);

    if (isFound) return COLORS.found;
    if (isMiddle) return COLORS.middle;
    if (isEliminated) return COLORS.eliminated;
    return COLORS.default;
  };

  const getTileOpacity = (idx: number) => {
    if (step.eliminated.includes(idx)) return 0.3;
    return 1;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Bracket Lines and Middle Pointer */}
      <div className="relative" style={{ width: `${totalWidth}px`, height: 50 }}>
        {/* Left Bracket */}
        {step.windowSize > 0 && (
          <div
            className="absolute transition-all duration-[400ms] ease-out"
            style={{
              left: step.low * (tileSize + 6) - 2,
              top: bracketTop,
              width: showBracketsColliding ? 4 : 3,
              height: bracketHeight,
              backgroundColor: showBracketsColliding ? COLORS.bracketCollide : COLORS.windowBracket,
              boxShadow: `0 0 8px ${showBracketsColliding ? '#ffffff' : COLORS.windowBracket}80`,
              borderRadius: 2,
              animation: showBracketsColliding ? 'bracketPulse 0.3s ease-in-out 2' : 'none',
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
              width: showBracketsColliding ? 4 : 3,
              height: bracketHeight,
              backgroundColor: showBracketsColliding ? COLORS.bracketCollide : COLORS.windowBracket,
              boxShadow: `0 0 8px ${showBracketsColliding ? '#ffffff' : COLORS.windowBracket}80`,
              borderRadius: 2,
              animation: showBracketsColliding ? 'bracketPulse 0.3s ease-in-out 2' : 'none',
            }}
          />
        )}

        {/* Dashed lines from middle to brackets */}
        {step.mid >= 0 && step.windowSize > 1 && step.phase !== 'complete' && (
          <>
            <div
              className="absolute h-px opacity-25"
              style={{
                left: step.low * (tileSize + 6) + tileSize + 6,
                top: 18,
                width: (step.mid - step.low) * (tileSize + 6) - 6,
                background: `repeating-linear-gradient(90deg, #2a5a50 0, #2a5a50 4px, transparent 4px, transparent 8px)`,
              }}
            />
            <div
              className="absolute h-px opacity-25"
              style={{
                left: step.mid * (tileSize + 6) + tileSize + 6,
                top: 18,
                width: (step.high - step.mid) * (tileSize + 6) - 6,
                background: `repeating-linear-gradient(90deg, #2a5a50 0, #2a5a50 4px, transparent 4px, transparent 8px)`,
              }}
            />
          </>
        )}

        {/* Middle Pointer */}
        {step.mid >= 0 && step.windowSize > 0 && step.phase !== 'complete' && (
          <div
            className="absolute transition-all duration-150"
            style={{
              left: step.mid * (tileSize + 6) + tileSize / 2 - 18,
              top: 4,
              transform: 'translateX(-50%)',
            }}
          >
            <svg width="36" height="30" viewBox="0 0 36 30" fill="none">
              <path d="M18 0 L36 24 L0 24 Z" fill="#e8c040" filter="url(#middleGlowBin)" />
              <defs>
                <filter id="middleGlowBin">
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
      </div>

      {/* Elimination Wave */}
      {showWave && step.mid >= 0 && (
        <div
          className="absolute pointer-events-none rounded-lg"
          style={{
            height: tileSize + 4,
            top: 56,
            background: showWave === 'left' ? COLORS.waveRose : COLORS.waveBlue,
            animation: 'waveFade 0.25s ease-out forwards',
            zIndex: 5,
            ...(showWave === 'left'
              ? { width: `${(step.mid - step.low + 1) * (tileSize + 6) - 6}px` }
              : { width: `${(step.high - step.mid + 1) * (tileSize + 6) - 6}px`, left: `${step.mid * (tileSize + 6)}px` }
            ),
          }}
        />
      )}

      {/* Not Found Gray Wash */}
      {step.phase === 'complete' && step.windowSize === 0 && (
        <div
          className="absolute pointer-events-none rounded-lg"
          style={{
            left: 0,
            width: totalWidth,
            height: tileSize + 4,
            top: 56,
            background: 'rgba(40, 40, 40, 0.3)',
            zIndex: 5,
          }}
        />
      )}

      {/* Tiles */}
      <div className="flex items-center gap-[6px] relative">
        {array.map((val, idx) => {
          const colors = getTileColors(idx);
          const opacity = getTileOpacity(idx);
          const isMiddle = step.mid === idx;
          const isFound = step.foundIndex === idx;

          return (
            <div
              key={idx}
              className="relative transition-all duration-200"
              style={{
                width: tileSize,
                height: tileSize,
                opacity,
                zIndex: isMiddle ? 3 : 1,
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
                    : 'none',
                  transform: isMiddle && !isFound ? 'scale(1.12)' : 'scale(1)',
                  zIndex: isMiddle ? 4 : 1,
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

function JumpTileRow({ array, step, tileSize }: {
  array: number[];
  step: JumpStep;
  tileSize: number;
}) {
  const totalWidth = tileSize * array.length + (array.length - 1) * 6;

  return (
    <div className="flex items-center gap-[6px] relative" style={{ width: `${totalWidth}px` }}>
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
      {array.map((val, idx) => {
        const isChecked = step.tilesChecked.includes(idx);
        const isFound = step.foundIndex === idx;
        return (
          <div
            key={idx}
            className="relative transition-all duration-200"
            style={{ width: tileSize, height: tileSize }}
          >
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
  );
}

function LinearTileRow({ array, step, tileSize }: {
  array: number[];
  step: LinearStep;
  tileSize: number;
}) {
  const totalWidth = tileSize * array.length + (array.length - 1) * 6;

  return (
    <div className="flex items-center gap-[6px] relative" style={{ width: `${totalWidth}px` }}>
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
      {array.map((val, idx) => {
        const isChecked = step.tilesChecked.includes(idx);
        const isFound = step.foundIndex === idx;
        return (
          <div
            key={idx}
            className="relative transition-all duration-200"
            style={{ width: tileSize, height: tileSize }}
          >
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
  );
}
