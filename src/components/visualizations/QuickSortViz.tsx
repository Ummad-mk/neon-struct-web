import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'selecting' | 'scanning' | 'crossing' | 'placing' | 'splitting' | 'complete';
type ArrayType = 'random' | 'sorted' | 'reverse' | 'best';

interface SortStep {
  array: number[];
  phase: Phase;
  activeLow: number;
  activeHigh: number;
  pivotIndex: number;
  pivotValue: number;
  leftPointer: number | null;
  rightPointer: number | null;
  smallerZoneEnd: number;
  largerZoneStart: number;
  leftStopped: boolean;
  rightStopped: boolean;
  comparisons: number;
  swaps: number;
  pivotsPlaced: number;
  recursionDepth: number;
  caption: string;
  comparisonText: string;
  sortedIndices: number[];
  leftSubActive: boolean;
  rightSubActive: boolean;
  showPivotPulse: boolean;
  pivotFinalIndex: number | null;
  leftSubLow: number;
  leftSubHigh: number;
  rightSubLow: number;
  rightSubHigh: number;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  dimmed: { border: '#1a3030', text: '#3a6a60', bg: '#0a1414' },
  pivot: { border: '#e8c040', text: '#ffffff', bg: '#1a1408' },
  leftPointer: { border: '#4a90d0', text: '#a0d0ff', bg: '#0a1420' },
  rightPointer: { border: '#d06080', text: '#f0a0b0', bg: '#1a0a10' },
  swapping: { border: '#e07050', text: '#ffffff', bg: '#1a0e08' },
  confirmed: { border: '#4ad880', text: '#ffffff', bg: '#0a1a0e' },
  victory: { border: '#4ad880', text: '#ffffff', bg: '#0a1a0e' },
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i + 15);
}

function generateReverseArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i + 14);
}

function generateBestCaseArray(size: number): number[] {
  const arr: number[] = [];
  const mid = Math.floor(size / 2);
  for (let i = 0; i < size; i++) {
    if (i < mid) arr.push(i * 2);
    else arr.push((i - mid) * 2 + 1);
  }
  return arr;
}

function generateSortSteps(arr: number[], _arrayType: ArrayType): SortStep[] {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;

  const getIdealDepth = () => Math.ceil(Math.log2(n));

  const addStep = (partial: Partial<SortStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      activeLow: -1,
      activeHigh: -1,
      pivotIndex: -1,
      pivotValue: -1,
      leftPointer: null,
      rightPointer: null,
      smallerZoneEnd: -1,
      largerZoneStart: n,
      leftStopped: false,
      rightStopped: false,
      comparisons: 0,
      swaps: 0,
      pivotsPlaced: 0,
      recursionDepth: 1,
      caption: '',
      comparisonText: '',
      sortedIndices: [],
      leftSubActive: false,
      rightSubActive: false,
      showPivotPulse: false,
      pivotFinalIndex: null,
      leftSubLow: -1,
      leftSubHigh: -1,
      rightSubLow: -1,
      rightSubHigh: -1,
      ...partial,
    });
  };

  addStep({
    array: [...array],
    phase: 'idle',
    sortedIndices: [],
    caption: `Quicksort picks one number as the pivot. Everything smaller goes to its left, everything larger goes to its right. Then the same thing happens on each side.`,
    comparisonText: '',
  });

  let comparisons = 0;
  let swaps = 0;
  let pivotsPlaced = 0;
  const sortedIndices = new Set<number>();

  const partition = (low: number, high: number, depth: number): void => {
    if (low >= high) {
      if (low === high && !sortedIndices.has(low)) {
        sortedIndices.add(low);
        pivotsPlaced++;
        addStep({
          array: [...array],
          phase: 'complete',
          activeLow: low,
          activeHigh: high,
          pivotIndex: low,
          pivotValue: array[low],
          leftPointer: null,
          rightPointer: null,
          smallerZoneEnd: low - 1,
          largerZoneStart: high + 1,
          leftStopped: false,
          rightStopped: false,
          comparisons,
          swaps,
          pivotsPlaced,
          recursionDepth: depth,
          caption: `Single element ${array[low]} is already in place.`,
          comparisonText: `${array[low]} is confirmed.`,
          sortedIndices: Array.from(sortedIndices),
          showPivotPulse: false,
          pivotFinalIndex: low,
        });
      }
      return;
    }

    const pivotIdx = low;
    const pivotVal = array[pivotIdx];
    const idealDepth = getIdealDepth();

    addStep({
      array: [...array],
      phase: 'selecting',
      activeLow: low,
      activeHigh: high,
      pivotIndex: pivotIdx,
      pivotValue: pivotVal,
      leftPointer: low + 1,
      rightPointer: high,
      smallerZoneEnd: low,
      largerZoneStart: high + 1,
      leftStopped: false,
      rightStopped: false,
      comparisons,
      swaps,
      pivotsPlaced,
      recursionDepth: depth,
      caption: `Picked ${pivotVal} as the pivot. Everything smaller than ${pivotVal} goes to its left. Everything larger goes to its right.`,
      comparisonText: `Pivot selected: ${pivotVal}`,
      sortedIndices: Array.from(sortedIndices),
      leftSubActive: false,
      rightSubActive: false,
      leftSubLow: low,
      leftSubHigh: high,
      rightSubLow: low,
      rightSubHigh: high,
    });

    let left = low + 1;
    let right = high;

    while (left <= right) {
      while (left <= right) {
        comparisons++;
        if (array[left] > pivotVal) {
          addStep({
            array: [...array],
            phase: 'scanning',
            activeLow: low,
            activeHigh: high,
            pivotIndex: pivotIdx,
            pivotValue: pivotVal,
            leftPointer: left,
            rightPointer: right,
            smallerZoneEnd: left - 1,
            largerZoneStart: right + 1,
            leftStopped: true,
            rightStopped: false,
            comparisons,
            swaps,
            pivotsPlaced,
            recursionDepth: depth,
            caption: `Left pointer found ${array[left]} — it's bigger than ${pivotVal}. Stopping here.`,
            comparisonText: `Is ${array[left]} bigger than pivot ${pivotVal}? Yes — left pointer stops.`,
            sortedIndices: Array.from(sortedIndices),
            leftSubActive: false,
            rightSubActive: false,
            leftSubLow: low,
            leftSubHigh: high,
            rightSubLow: low,
            rightSubHigh: high,
          });
          break;
        } else {
          addStep({
            array: [...array],
            phase: 'scanning',
            activeLow: low,
            activeHigh: high,
            pivotIndex: pivotIdx,
            pivotValue: pivotVal,
            leftPointer: left,
            rightPointer: right,
            smallerZoneEnd: left,
            largerZoneStart: right + 1,
            leftStopped: false,
            rightStopped: false,
            comparisons,
            swaps,
            pivotsPlaced,
            recursionDepth: depth,
            caption: `Left pointer checking ${array[left]} — smaller than ${pivotVal}, skipping...`,
            comparisonText: `Is ${array[left]} bigger than pivot ${pivotVal}? No — keeps going.`,
            sortedIndices: Array.from(sortedIndices),
            leftSubActive: false,
            rightSubActive: false,
            leftSubLow: low,
            leftSubHigh: high,
            rightSubLow: low,
            rightSubHigh: high,
          });
          left++;
        }
      }

      while (left <= right) {
        comparisons++;
        if (array[right] < pivotVal) {
          addStep({
            array: [...array],
            phase: 'scanning',
            activeLow: low,
            activeHigh: high,
            pivotIndex: pivotIdx,
            pivotValue: pivotVal,
            leftPointer: left,
            rightPointer: right,
            smallerZoneEnd: left - 1,
            largerZoneStart: right + 1,
            leftStopped: left <= right,
            rightStopped: true,
            comparisons,
            swaps,
            pivotsPlaced,
            recursionDepth: depth,
            caption: `Right pointer found ${array[right]} — it's smaller than ${pivotVal}. Stopping here.`,
            comparisonText: `Is ${array[right]} smaller than pivot ${pivotVal}? Yes — right pointer stops.`,
            sortedIndices: Array.from(sortedIndices),
            leftSubActive: false,
            rightSubActive: false,
            leftSubLow: low,
            leftSubHigh: high,
            rightSubLow: low,
            rightSubHigh: high,
          });
          break;
        } else {
          addStep({
            array: [...array],
            phase: 'scanning',
            activeLow: low,
            activeHigh: high,
            pivotIndex: pivotIdx,
            pivotValue: pivotVal,
            leftPointer: left,
            rightPointer: right,
            smallerZoneEnd: left - 1,
            largerZoneStart: right,
            leftStopped: false,
            rightStopped: false,
            comparisons,
            swaps,
            pivotsPlaced,
            recursionDepth: depth,
            caption: `Right pointer checking ${array[right]} — larger than ${pivotVal}, skipping...`,
            comparisonText: `Is ${array[right]} smaller than pivot ${pivotVal}? No — keeps going.`,
            sortedIndices: Array.from(sortedIndices),
            leftSubActive: false,
            rightSubActive: false,
            leftSubLow: low,
            leftSubHigh: high,
            rightSubLow: low,
            rightSubHigh: high,
          });
          right--;
        }
      }

      if (left < right) {
        swaps++;
        [array[left], array[right]] = [array[right], array[left]];

        addStep({
          array: [...array],
          phase: 'crossing',
          activeLow: low,
          activeHigh: high,
          pivotIndex: pivotIdx,
          pivotValue: pivotVal,
          leftPointer: left,
          rightPointer: right,
          smallerZoneEnd: left - 1,
          largerZoneStart: right + 1,
          leftStopped: false,
          rightStopped: false,
          comparisons,
          swaps,
          pivotsPlaced,
          recursionDepth: depth,
          caption: `${array[right]} is bigger than ${pivotVal} and ${array[left]} is smaller — they swap sides.`,
          comparisonText: `${array[right]} is bigger than ${pivotVal} and ${array[left]} is smaller than ${pivotVal} — swapping.`,
          sortedIndices: Array.from(sortedIndices),
          leftSubActive: false,
          rightSubActive: false,
          leftSubLow: low,
          leftSubHigh: high,
          rightSubLow: low,
          rightSubHigh: high,
        });

        left++;
        right--;
      } else if (left === right) {
        addStep({
          array: [...array],
          phase: 'crossing',
          activeLow: low,
          activeHigh: high,
          pivotIndex: pivotIdx,
          pivotValue: pivotVal,
          leftPointer: left,
          rightPointer: right,
          smallerZoneEnd: left - 1,
          largerZoneStart: right + 1,
          leftStopped: false,
          rightStopped: false,
          comparisons,
          swaps,
          pivotsPlaced,
          recursionDepth: depth,
          caption: `The pointers have crossed — partition complete. Now ${pivotVal} goes to its correct position.`,
          comparisonText: `Pointers crossed — partition complete.`,
          sortedIndices: Array.from(sortedIndices),
          leftSubActive: false,
          rightSubActive: false,
          leftSubLow: low,
          leftSubHigh: high,
          rightSubLow: low,
          rightSubHigh: high,
        });
        left++;
        right--;
      }
    }

    const pivotFinalIdx = right;
    if (pivotFinalIdx !== pivotIdx) {
      swaps++;
      [array[pivotIdx], array[pivotFinalIdx]] = [array[pivotFinalIdx], array[pivotIdx]];
    }
    sortedIndices.add(pivotFinalIdx);
    pivotsPlaced++;

    addStep({
      array: [...array],
      phase: 'placing',
      activeLow: low,
      activeHigh: high,
      pivotIndex: pivotIdx,
      pivotValue: pivotVal,
      leftPointer: null,
      rightPointer: null,
      smallerZoneEnd: pivotFinalIdx - 1,
      largerZoneStart: pivotFinalIdx + 1,
      leftStopped: false,
      rightStopped: false,
      comparisons,
      swaps,
      pivotsPlaced,
      recursionDepth: depth,
      caption: `${pivotVal} drops into its final position — everything to its left is smaller, everything to its right is larger. ${pivotVal} will never move again.`,
      comparisonText: `${pivotVal} goes between the smaller numbers and the larger numbers — this is its permanent home.`,
      sortedIndices: Array.from(sortedIndices),
      showPivotPulse: true,
      pivotFinalIndex: pivotFinalIdx,
      leftSubActive: false,
      rightSubActive: false,
      leftSubLow: low,
      leftSubHigh: high,
      rightSubLow: low,
      rightSubHigh: high,
    });

    if (depth > idealDepth * 2) {
      addStep({
        array: [...array],
        phase: 'splitting',
        activeLow: low,
        activeHigh: high,
        pivotIndex: pivotIdx,
        pivotValue: pivotVal,
        leftPointer: null,
        rightPointer: null,
        smallerZoneEnd: pivotFinalIdx - 1,
        largerZoneStart: pivotFinalIdx + 1,
        leftStopped: false,
        rightStopped: false,
        comparisons,
        swaps,
        pivotsPlaced,
        recursionDepth: depth,
        caption: `The recursion is going deeper than expected — the pivot choices are unbalanced.`,
        comparisonText: `Depth: ${depth} (ideal: ${idealDepth})`,
        sortedIndices: Array.from(sortedIndices),
        showPivotPulse: false,
        pivotFinalIndex: pivotFinalIdx,
        leftSubActive: true,
        rightSubActive: true,
        leftSubLow: low,
        leftSubHigh: pivotFinalIdx - 1,
        rightSubLow: pivotFinalIdx + 1,
        rightSubHigh: high,
      });
    } else {
      addStep({
        array: [...array],
        phase: 'splitting',
        activeLow: low,
        activeHigh: high,
        pivotIndex: pivotIdx,
        pivotValue: pivotVal,
        leftPointer: null,
        rightPointer: null,
        smallerZoneEnd: pivotFinalIdx - 1,
        largerZoneStart: pivotFinalIdx + 1,
        leftStopped: false,
        rightStopped: false,
        comparisons,
        swaps,
        pivotsPlaced,
        recursionDepth: depth,
        caption: `Now quicksort does the same thing on the left side and the right side.`,
        comparisonText: `Dividing left and right subarrays...`,
        sortedIndices: Array.from(sortedIndices),
        showPivotPulse: false,
        pivotFinalIndex: pivotFinalIdx,
        leftSubActive: true,
        rightSubActive: true,
        leftSubLow: low,
        leftSubHigh: pivotFinalIdx - 1,
        rightSubLow: pivotFinalIdx + 1,
        rightSubHigh: high,
      });
    }

    if (pivotFinalIdx - 1 > low) {
      partition(low, pivotFinalIdx - 1, depth + 1);
    }
    if (pivotFinalIdx + 1 < high) {
      partition(pivotFinalIdx + 1, high, depth + 1);
    }
  };

  partition(0, n - 1, 1);

  steps.push({
    array: [...array],
    phase: 'complete',
    activeLow: 0,
    activeHigh: n - 1,
    pivotIndex: -1,
    pivotValue: -1,
    leftPointer: null,
    rightPointer: null,
    smallerZoneEnd: -1,
    largerZoneStart: n,
    leftStopped: false,
    rightStopped: false,
    comparisons,
    swaps,
    pivotsPlaced,
    recursionDepth: 0,
    caption: `Done! Every number found its place through pivoting and partitioning.`,
    comparisonText: `Sorted ${n} numbers with ${comparisons} comparisons and ${swaps} swaps. ${pivotsPlaced} pivots each found their permanent home.`,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    showPivotPulse: false,
    pivotFinalIndex: null,
    leftSubActive: false,
    rightSubActive: false,
    leftSubLow: -1,
    leftSubHigh: -1,
    rightSubLow: -1,
    rightSubHigh: -1,
  });

  return steps;
}

export default function QuickSortViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateArray(16));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 120);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    switch (type) {
      case 'sorted': newArr = generateSortedArray(size); break;
      case 'reverse': newArr = generateReverseArray(size); break;
      case 'best': newArr = generateBestCaseArray(size); break;
      default: newArr = generateArray(size);
    }
    setArray(newArr);
    setSteps(generateSortSteps(newArr, type));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
  }, [arrayType]);

  useEffect(() => {
    generateNewArray(arraySize, arrayType);
  }, []);

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setPlaying(false);
      setShowSummary(true);
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    if (!playing) return;

    const animate = (time: number) => {
      const delay = Math.max(10, 700 - speed * 8);
      if (time - lastTimeRef.current >= delay) {
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setPlaying(false);
          setShowSummary(true);
        }
        lastTimeRef.current = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [playing, speed, currentStep, steps.length]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      array: array,
      phase: 'idle' as Phase,
      activeLow: 0,
      activeHigh: arraySize - 1,
      pivotIndex: -1,
      pivotValue: -1,
      leftPointer: null,
      rightPointer: null,
      smallerZoneEnd: -1,
      largerZoneStart: arraySize,
      leftStopped: false,
      rightStopped: false,
      comparisons: 0,
      swaps: 0,
      pivotsPlaced: 0,
      recursionDepth: 1,
      caption: 'Ready to start',
      comparisonText: '',
      sortedIndices: [],
      showPivotPulse: false,
      pivotFinalIndex: null,
      leftSubActive: false,
      rightSubActive: false,
      leftSubLow: -1,
      leftSubHigh: -1,
      rightSubLow: -1,
      rightSubHigh: -1,
    };
  }, [currentStep, steps, array, arraySize]);

  const getTileSize = () => {
    if (arraySize <= 10) return 52;
    if (arraySize <= 14) return 44;
    if (arraySize <= 18) return 36;
    return 30;
  };

  const getFontSize = () => {
    if (arraySize <= 10) return 18;
    if (arraySize <= 14) return 15;
    if (arraySize <= 18) return 12;
    return 10;
  };

  const tileSize = getTileSize();
  const fontSize = getFontSize();
  const idealDepth = Math.ceil(Math.log2(arraySize));
  const isDepthWarning = currentStepData.recursionDepth > idealDepth * 2;

  const getTileColor = (idx: number) => {
    const { phase, activeLow, activeHigh, pivotIndex, leftPointer, rightPointer, sortedIndices, smallerZoneEnd, largerZoneStart } = currentStepData;

    if (phase === 'complete') {
      return COLORS.victory;
    }

    if (sortedIndices.includes(idx)) {
      return COLORS.confirmed;
    }

    if (idx < activeLow || idx > activeHigh) {
      return COLORS.dimmed;
    }

    if (phase === 'selecting' && idx === pivotIndex) {
      return COLORS.pivot;
    }

    if (phase === 'crossing') {
      if (idx === leftPointer || idx === rightPointer) {
        return COLORS.swapping;
      }
    }

    if (phase === 'scanning') {
      if (idx === pivotIndex) {
        return COLORS.pivot;
      }
      if (idx === leftPointer) {
        return COLORS.leftPointer;
      }
      if (idx === rightPointer) {
        return COLORS.rightPointer;
      }
    }

    if (phase === 'placing' && idx === pivotIndex) {
      return COLORS.pivot;
    }

    if (idx >= activeLow && idx <= activeHigh) {
      if (idx >= activeLow && idx <= smallerZoneEnd) {
        return COLORS.leftPointer;
      }
      if (idx >= largerZoneStart && idx <= activeHigh) {
        return COLORS.rightPointer;
      }
    }

    return COLORS.unsorted;
  };

  const isPivotElevated = () => {
    const { phase, pivotIndex } = currentStepData;
    return (phase === 'selecting' || phase === 'scanning' || phase === 'crossing' || phase === 'placing') && pivotIndex >= 0;
  };

  const getScale = (idx: number) => {
    const { phase, pivotIndex } = currentStepData;
    if (phase === 'complete') return 1;
    if (phase === 'crossing' && (idx === currentStepData.leftPointer || idx === currentStepData.rightPointer)) {
      return 1.1;
    }
    if (phase === 'placing' && currentStepData.showPivotPulse && idx === pivotIndex) {
      return 1.12;
    }
    return 1;
  };

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'idle') {
      return 'Quicksort picks a pivot number and partitions everything else around it — smaller numbers go left, larger numbers go right. Then it repeats on each side recursively.';
    }
    if (step.phase === 'selecting') {
      return `The pivot is selected! ${step.pivotValue} will be the reference point. Everything smaller will go left, everything larger will go right. The pivot lifts above the row and waits.`;
    }
    if (step.phase === 'scanning') {
      if (step.leftStopped && step.rightStopped) {
        return `Both pointers found tiles on the wrong sides! ${step.array[step.leftPointer!]} is bigger than ${step.pivotValue} and ${step.array[step.rightPointer!]} is smaller. They will swap.`;
      }
      if (step.leftStopped) {
        return `Left pointer found ${step.array[step.leftPointer!]} — it's bigger than ${step.pivotValue}. Now the right pointer needs to find a smaller number.`;
      }
      if (step.rightStopped) {
        return `Right pointer found ${step.array[step.rightPointer!]} — it's smaller than ${step.pivotValue}. Now the left pointer needs to find a bigger number.`;
      }
      return `The two pointers are scanning — left pointer looking for numbers bigger than ${step.pivotValue}, right pointer looking for numbers smaller.`;
    }
    if (step.phase === 'crossing') {
      return `The pointers have crossed or met — the partition is complete. The pivot will now drop into its final position between the smaller and larger groups.`;
    }
    if (step.phase === 'placing') {
      return `${step.pivotValue} has found its permanent home! Everything to its left is smaller and everything to its right is larger. It will never move again.`;
    }
    if (step.phase === 'splitting') {
      return `The algorithm now recursively sorts the left subarray and right subarray separately. This divide-and-conquer approach is what makes quicksort fast.`;
    }
    if (step.phase === 'complete') {
      return `All ${arraySize} numbers are sorted! ${step.comparisons} comparisons and ${step.swaps} swaps. ${step.pivotsPlaced} pivots found their permanent homes. Quicksort is usually the fastest sort — but bad pivot choices on sorted data can make it as slow as bubble sort.`;
    }
    return 'Quicksort divides and conquers the array.';
  };

  const maxComparisons = arraySize * arraySize;
  const maxSwaps = arraySize * arraySize;
  const sortedCount = currentStepData.sortedIndices.length;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Quick Sort</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Sorted:</div>
            <div className="text-sm text-green-400 font-bold">{sortedCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Comparisons:</div>
              <div className="text-white font-bold font-mono">{currentStepData.comparisons}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Swaps:</div>
              <div className="text-amber-400 font-bold font-mono">{currentStepData.swaps}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Pivots:</div>
              <div className="text-teal-400 font-bold font-mono">{currentStepData.pivotsPlaced}</div>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${isDepthWarning ? 'bg-amber-500/20' : 'bg-gray-800/50'}`}>
              <div className="text-gray-500">Depth:</div>
              <div className={`font-bold font-mono ${isDepthWarning ? 'text-amber-400' : 'text-purple-400'}`}>
                {currentStepData.recursionDepth}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete' ? '✓ Complete' : currentStepData.phase.charAt(0).toUpperCase() + currentStepData.phase.slice(1)}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col gap-4" style={{ minHeight: 0 }}>
        {/* Progress Bars */}
        <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto w-full">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 mb-1 text-center">Comparisons</div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-300"
                style={{ width: `${(currentStepData.comparisons / maxComparisons) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 mb-1 text-center">Swaps</div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400/80 rounded-full transition-all duration-300"
                style={{ width: `${(currentStepData.swaps / maxSwaps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Crown + Pivot Row */}
        {isPivotElevated() && currentStepData.pivotValue >= 0 && (
          <div className="flex flex-col items-center">
            <div
              className="text-lg font-bold"
              style={{
                color: COLORS.pivot.border,
                textShadow: `0 0 10px ${COLORS.pivot.border}`,
                fontFamily: 'serif',
              }}
            >
              ♛
            </div>
            <div
              className="rounded-lg flex items-center justify-center font-bold"
              style={{
                width: '52px',
                height: '52px',
                border: `3px solid ${COLORS.pivot.border}`,
                backgroundColor: COLORS.pivot.bg,
                color: COLORS.pivot.text,
                fontSize: '18px',
                boxShadow: `0 0 16px ${COLORS.pivot.border}60`,
              }}
            >
              {currentStepData.pivotValue}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">pivot</div>
          </div>
        )}

        {/* Zone Labels */}
        {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && (
          <div className="flex justify-center gap-[50%]">
            <div className="text-sm font-medium" style={{ color: COLORS.leftPointer.border }}>
              smaller than {currentStepData.pivotValue}
            </div>
            <div className="text-sm font-medium" style={{ color: COLORS.rightPointer.border }}>
              larger than {currentStepData.pivotValue}
            </div>
          </div>
        )}

        {/* Main Tiles Row */}
        <div className="flex items-center justify-center">
          <div className="relative flex gap-2">
            {currentStepData.array.map((val, idx) => {
              const colors = getTileColor(idx);
              const scale = getScale(idx);
              const phase = currentStepData.phase;
              const pivotIsLifted = (phase === 'selecting' || phase === 'scanning' || phase === 'crossing' || phase === 'placing') && idx === currentStepData.pivotIndex && currentStepData.pivotIndex >= 0;
              const isSorted = currentStepData.sortedIndices.includes(idx);
              const isComplete = phase === 'complete';

              return (
                <div
                  key={idx}
                  className="rounded-lg flex items-center justify-center font-bold transition-all duration-200 relative"
                  style={{
                    width: `${tileSize}px`,
                    height: `${tileSize}px`,
                    border: `2px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontSize: `${fontSize}px`,
                    transform: pivotIsLifted
                      ? `translateY(-24px) scale(1.1)`
                      : `scale(${scale})`,
                    boxShadow: scale > 1
                      ? `0 0 16px ${colors.border}40`
                      : pivotIsLifted
                        ? `0 0 20px ${COLORS.pivot.border}60, 0 8px 24px rgba(0,0,0,0.4)`
                        : '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: pivotIsLifted || scale > 1 ? 10 : 1,
                  }}
                >
                  {val}
                  {/* Lock dot */}
                  {isSorted && !isComplete && (
                    <div
                      className="absolute rounded-full transition-all duration-300"
                      style={{
                        width: '5px',
                        height: '5px',
                        backgroundColor: '#4ad880',
                        bottom: '3px',
                        right: '3px',
                        boxShadow: isComplete
                          ? `0 0 ${4 + Math.sin(pulsePhase * 0.15) * 2}px #ffffff`
                          : '0 0 4px #4ad880',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pointer Row */}
        {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && (
          <div className="flex justify-center">
            <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 8}px`, height: '20px' }}>
              {/* Left pointer triangle */}
              {currentStepData.leftPointer !== null && (
                <div
                  className="absolute transition-all duration-150"
                  style={{
                    left: currentStepData.leftPointer * (tileSize + 8) + tileSize / 2 - 4,
                    top: 0,
                  }}
                >
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: `8px solid ${COLORS.leftPointer.border}`,
                    }}
                  />
                </div>
              )}
              {/* Right pointer triangle */}
              {currentStepData.rightPointer !== null && (
                <div
                  className="absolute transition-all duration-150"
                  style={{
                    left: currentStepData.rightPointer * (tileSize + 8) + tileSize / 2 - 4,
                    top: 0,
                  }}
                >
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `8px solid ${COLORS.rightPointer.border}`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Partition Zone Lines */}
        {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && (
          <div className="flex justify-center">
            <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 8}px` }}>
              {/* Smaller zone line */}
              {currentStepData.smallerZoneEnd >= currentStepData.activeLow && (
                <div
                  className="h-0.5 rounded-full transition-all duration-300"
                  style={{
                    position: 'absolute',
                    left: currentStepData.activeLow * (tileSize + 8) + tileSize / 2,
                    width: `${(currentStepData.smallerZoneEnd - currentStepData.activeLow + 1) * (tileSize + 8) - tileSize}`,
                    backgroundColor: `${COLORS.leftPointer.border}60`,
                    top: 0,
                  }}
                />
              )}
              {/* Larger zone line */}
              {currentStepData.largerZoneStart <= currentStepData.activeHigh && (
                <div
                  className="h-0.5 rounded-full transition-all duration-300"
                  style={{
                    position: 'absolute',
                    left: currentStepData.largerZoneStart * (tileSize + 8) + tileSize / 2,
                    width: `${(currentStepData.activeHigh - currentStepData.largerZoneStart + 1) * (tileSize + 8) - tileSize}`,
                    backgroundColor: `${COLORS.rightPointer.border}60`,
                    top: 0,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Comparison Panel */}
        {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Comparison</div>
            <div className="flex items-center gap-4">
              {/* Pivot */}
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.pivot.border}`,
                  backgroundColor: COLORS.pivot.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[10px] text-gray-500">Pivot</div>
                <div className="text-lg font-bold" style={{ color: COLORS.pivot.text }}>
                  {currentStepData.pivotValue}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">vs</div>
              {/* Examined tile */}
              {currentStepData.phase === 'scanning' && (
                <>
                  {currentStepData.leftStopped && (
                    <div
                      className="rounded-lg flex flex-col items-center justify-center"
                      style={{
                        width: '48px',
                        border: `2px solid ${COLORS.leftPointer.border}`,
                        backgroundColor: COLORS.leftPointer.bg,
                        padding: '6px',
                      }}
                    >
                      <div className="text-[10px] text-gray-500">Left found</div>
                      <div className="text-lg font-bold" style={{ color: COLORS.leftPointer.text }}>
                        {currentStepData.array[currentStepData.leftPointer!]}
                      </div>
                    </div>
                  )}
                  {currentStepData.rightStopped && (
                    <div
                      className="rounded-lg flex flex-col items-center justify-center"
                      style={{
                        width: '48px',
                        border: `2px solid ${COLORS.rightPointer.border}`,
                        backgroundColor: COLORS.rightPointer.bg,
                        padding: '6px',
                      }}
                    >
                      <div className="text-[10px] text-gray-500">Right found</div>
                      <div className="text-lg font-bold" style={{ color: COLORS.rightPointer.text }}>
                        {currentStepData.array[currentStepData.rightPointer!]}
                      </div>
                    </div>
                  )}
                  {!currentStepData.leftStopped && !currentStepData.rightStopped && (
                    <div
                      className="rounded-lg flex flex-col items-center justify-center bg-gray-800/50"
                      style={{ width: '48px', padding: '6px' }}
                    >
                      <div className="text-[10px] text-gray-500">Scanning...</div>
                    </div>
                  )}
                </>
              )}
              {currentStepData.phase === 'crossing' && (
                <div
                  className="rounded-lg flex flex-col items-center justify-center"
                  style={{
                    width: '48px',
                    border: `2px solid ${COLORS.swapping.border}`,
                    backgroundColor: COLORS.swapping.bg,
                    padding: '6px',
                  }}
                >
                  <div className="text-[10px] text-gray-500">Swapping</div>
                  <div className="text-lg font-bold" style={{ color: COLORS.swapping.text }}>
                    ↔
                  </div>
                </div>
              )}
              {currentStepData.phase === 'placing' && (
                <div
                  className="rounded-lg flex flex-col items-center justify-center"
                  style={{
                    width: '48px',
                    border: `2px solid ${COLORS.confirmed.border}`,
                    backgroundColor: COLORS.confirmed.bg,
                    padding: '6px',
                  }}
                >
                  <div className="text-[10px] text-gray-500">Confirmed</div>
                  <div className="text-lg font-bold" style={{ color: COLORS.confirmed.text }}>
                    ✓
                  </div>
                </div>
              )}
              {currentStepData.phase === 'splitting' && (
                <div
                  className="rounded-lg flex flex-col items-center justify-center bg-gray-800/50"
                  style={{ width: '48px', padding: '6px' }}
                >
                  <div className="text-[10px] text-gray-500">Dividing...</div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.comparisonText}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm text-gray-300 bg-[#0d1420]/90 rounded-lg px-4 py-2 border border-gray-700">
            {currentStepData.caption}
          </div>
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80" onClick={() => setShowSummary(false)}>
            <div className="bg-[#0d1420] border border-green-500/50 rounded-2xl px-12 py-8 text-center max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="text-3xl font-bold text-white mb-4">Sorted!</div>
              <div className="text-gray-300 mb-6">
                Read the numbers left to right — smallest to largest.
              </div>
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{currentStepData.comparisons}</div>
                  <div className="text-xs text-gray-500 uppercase">Comparisons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">{currentStepData.swaps}</div>
                  <div className="text-xs text-gray-500 uppercase">Swaps</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-400">{currentStepData.pivotsPlaced}</div>
                  <div className="text-xs text-gray-500 uppercase">Pivots Placed</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-4">
                {arrayType === 'sorted' || arrayType === 'reverse'
                  ? 'The first element was always the smallest/largest — every partition was completely unbalanced. This is quicksort\'s O(n²) nightmare.'
                  : arrayType === 'best'
                    ? 'Perfect pivot choices every time — quicksort at its best. Balanced partitions mean minimal recursion depth.'
                    : 'Quicksort is usually the fastest sort in practice — but its speed depends heavily on choosing good pivots.'
                }
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Best case: O(n log n) — balanced splits every time
                <br />
                Worst case: O(n²) — pivot is always smallest or largest
                <br />
                Space: O(log n) for recursion stack
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Explanation Modal */}
        {showExplanation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70" onClick={() => setShowExplanation(false)}>
            <div className="bg-[#0d1420] border border-cyan-500/50 rounded-xl px-8 py-6 max-w-md" onClick={e => e.stopPropagation()}>
              <div className="text-lg font-bold text-cyan-400 mb-3">What's happening?</div>
              <div className="text-gray-300 leading-relaxed mb-4">
                {getExplanation(currentStepData)}
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-[#0a1120] border-t border-gray-800 p-4">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(sortedCount / arraySize) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Size</span>
              <input
                type="range"
                min="5"
                max="20"
                value={arraySize}
                onChange={e => {
                  setArraySize(Number(e.target.value));
                  generateNewArray(Number(e.target.value));
                }}
                className="w-20 accent-cyan-500"
              />
              <span className="text-xs text-gray-400 font-mono w-6">{arraySize}</span>
            </div>

            {/* Array Type Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-500 mr-1">Array:</span>
              {(['random', 'sorted', 'reverse', 'best'] as ArrayType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setArrayType(type);
                    generateNewArray(arraySize, type);
                  }}
                  className={`px-2 py-1 rounded text-xs ${
                    arrayType === type
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type === 'sorted' ? 'Sorted' : type === 'reverse' ? 'Reverse' : type === 'best' ? 'Best' : 'Random'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateNewArray(arraySize)}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setShowExplanation(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-xs text-purple-400"
            >
              <HelpCircle size={14} />Explain
            </button>

            <button
              onClick={handleStep}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 font-medium"
            >
              <SkipForward size={14} />Step
            </button>

            <button
              onClick={() => setPlaying(!playing)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium ${
                playing ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">Speed</span>
              <input
                type="range"
                min="10"
                max="100"
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-20 accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#0d1420] border-t border-gray-800 px-4 py-2 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.unsorted.border, backgroundColor: COLORS.unsorted.bg }} />
          <span className="text-gray-500">Unsorted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.dimmed.border, backgroundColor: COLORS.dimmed.bg }} />
          <span className="text-gray-500">Outside</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.pivot.border, backgroundColor: COLORS.pivot.bg }} />
          <span className="text-gray-500">Pivot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.leftPointer.border, backgroundColor: COLORS.leftPointer.bg }} />
          <span className="text-gray-500">Smaller</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.rightPointer.border, backgroundColor: COLORS.rightPointer.bg }} />
          <span className="text-gray-500">Larger</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.confirmed.border, backgroundColor: COLORS.confirmed.bg }} />
          <span className="text-gray-500">Confirmed</span>
        </div>
      </div>
    </div>
  );
}
