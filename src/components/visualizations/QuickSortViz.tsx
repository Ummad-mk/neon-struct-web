import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, AlertTriangle } from 'lucide-react';

type BarState = 'default' | 'outsidePartition' | 'pivot' | 'leftPointer' | 'rightPointer' | 'pointerCross' | 'swapping' | 'sorted';
type PivotStrategy = 'first' | 'last' | 'median' | 'random';
type PartitionScheme = 'lomuto' | 'hoare';

interface PartitionStep {
  array: number[];
  pivotIndex: number;
  pivotValue: number;
  leftPointer: number | null;
  rightPointer: number | null;
  swapIndices: [number, number] | null;
  sortedIndices: number[];
  partitionRange: [number, number];
  phase: 'selecting' | 'partitioning' | 'placing' | 'complete';
  recursionStack: Array<{ low: number; high: number; active: boolean; pivotPlaced: boolean }>;
  comparisons: number;
  swaps: number;
  recursionDepth: number;
  partitionsComplete: number;
  medianIndices?: [number, number, number];
  pivotSlideTarget?: number;
}

const COLORS = {
  default: '#2a5a58',
  outsidePartition: '#1a3a38',
  pivot: '#e8c040',
  leftPointer: '#4090d0',
  rightPointer: '#d06080',
  pointerCross: 'linear-gradient(90deg, #4090d0 50%, #d06080 50%)',
  swapping: '#e07050',
  sorted: '#4a9a70',
};

const generateArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 85) + 10);
  }
  return arr;
};

const generateSortedArray = (size: number): number[] => {
  return Array.from({ length: size }, (_, i) => i + 5);
};

const generateSortSteps = (arr: number[], pivotStrategy: PivotStrategy, partitionScheme: PartitionScheme): PartitionStep[] => {
  const steps: PartitionStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sortedIndices: Set<number> = new Set();
  
  const getPivot = (low: number, high: number): { idx: number; medianIndices?: [number, number, number] } => {
    switch (pivotStrategy) {
      case 'first':
        return { idx: low };
      case 'last':
        return { idx: high };
      case 'median': {
        const mid = Math.floor((low + high) / 2);
        const candidates = [
          { idx: low, val: array[low] },
          { idx: mid, val: array[mid] },
          { idx: high, val: array[high] },
        ].sort((a, b) => a.val - b.val);
        return { idx: candidates[1].idx, medianIndices: [low, mid, high] };
      }
      case 'random':
        return { idx: Math.floor(Math.random() * (high - low + 1)) + low };
      default:
        return { idx: high };
    }
  };

  const addStep = (
    phase: PartitionStep['phase'],
    pivotIdx: number,
    leftPtr: number | null,
    rightPtr: number | null,
    swap: [number, number] | null,
    stack: PartitionStep['recursionStack'],
    comparisons: number,
    swaps: number,
    medianIndices?: [number, number, number],
    pivotSlideTarget?: number
  ) => {
    steps.push({
      array: [...array],
      pivotIndex: pivotIdx,
      pivotValue: pivotIdx >= 0 ? array[pivotIdx] : -1,
      leftPointer: leftPtr,
      rightPointer: rightPtr,
      swapIndices: swap,
      sortedIndices: Array.from(sortedIndices),
      partitionRange: [0, n - 1],
      phase,
      recursionStack: stack.map(s => ({ ...s })),
      comparisons,
      swaps,
      recursionDepth: stack.filter(s => s.active).length,
      partitionsComplete: sortedIndices.size,
      medianIndices,
      pivotSlideTarget,
    });
  };

  const partitionLomuto = (low: number, high: number, depth: number, stack: PartitionStep['recursionStack']): number => {
    if (low >= high) {
      if (low === high && !sortedIndices.has(low)) {
        sortedIndices.add(low);
        addStep('complete', low, null, null, null, stack.map(s => ({ ...s, pivotPlaced: s.low === low && s.high === high })), 
          steps.length > 0 ? steps[steps.length - 1].comparisons : 0, steps.length > 0 ? steps[steps.length - 1].swaps : 0);
      }
      return low;
    }

    const { idx: pivotIdx, medianIndices } = getPivot(low, high);
    const pivotValue = array[pivotIdx];
    
    addStep('selecting', pivotIdx, null, null, null, 
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
      steps.length > 0 ? steps[steps.length - 1].comparisons : 0,
      steps.length > 0 ? steps[steps.length - 1].swaps : 0,
      medianIndices);

    [array[low], array[pivotIdx]] = [array[pivotIdx], array[low]];
    const newPivotIdx = low;

    let i = low + 1;
    let comparisons = 0;
    let swaps = 0;

    for (let j = low + 1; j <= high; j++) {
      comparisons++;
      if (array[j] <= pivotValue) {
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          swaps++;
        }
        addStep('partitioning', newPivotIdx, j, null, i !== j ? [i, j] : null,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
          steps.length > 0 ? steps[steps.length - 1].comparisons + comparisons : comparisons,
          steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps);
        i++;
      } else {
        addStep('partitioning', newPivotIdx, j, null, null,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
          steps.length > 0 ? steps[steps.length - 1].comparisons + comparisons : comparisons,
          steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps);
      }
    }

    const pivotFinalIdx = i - 1;
    if (pivotFinalIdx !== newPivotIdx) {
      [array[newPivotIdx], array[pivotFinalIdx]] = [array[pivotFinalIdx], array[newPivotIdx]];
      swaps++;
    }
    
    sortedIndices.add(pivotFinalIdx);
    addStep('placing', pivotFinalIdx, null, null, pivotFinalIdx !== newPivotIdx ? [newPivotIdx, pivotFinalIdx] : null,
      stack.map(s => ({ ...s, pivotPlaced: s.low === low && s.high === high })),
      steps.length > 0 ? steps[steps.length - 1].comparisons : 0,
      steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps,
      undefined,
      pivotFinalIdx);

    const newStack = stack.map(s => ({ ...s, active: false }));
    newStack.push({ low, high: pivotFinalIdx - 1, active: true, pivotPlaced: false });
    newStack.push({ low: pivotFinalIdx + 1, high, active: true, pivotPlaced: false });

    if (low <= pivotFinalIdx - 1) {
      partitionLomuto(low, pivotFinalIdx - 1, depth + 1, newStack);
    }
    if (pivotFinalIdx + 1 <= high) {
      partitionLomuto(pivotFinalIdx + 1, high, depth + 1, newStack);
    }

    return pivotFinalIdx;
  };

  const partitionHoare = (low: number, high: number, depth: number, stack: PartitionStep['recursionStack']): number => {
    if (low >= high) {
      if (low === high && !sortedIndices.has(low)) {
        sortedIndices.add(low);
        addStep('complete', low, null, null, null, stack.map(s => ({ ...s, pivotPlaced: s.low === low && s.high === high })),
          steps.length > 0 ? steps[steps.length - 1].comparisons : 0, steps.length > 0 ? steps[steps.length - 1].swaps : 0);
      }
      return low;
    }

    const { idx: pivotIdx, medianIndices } = getPivot(low, high);
    const pivotValue = array[pivotIdx];
    
    addStep('selecting', pivotIdx, null, null, null,
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
      steps.length > 0 ? steps[steps.length - 1].comparisons : 0,
      steps.length > 0 ? steps[steps.length - 1].swaps : 0,
      medianIndices);

    let left = low;
    let right = high + 1;
    let comparisons = 0;
    let swaps = 0;

    while (true) {
      do {
        left++;
        comparisons++;
        addStep('partitioning', pivotIdx, left, right, null,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
          steps.length > 0 ? steps[steps.length - 1].comparisons + comparisons : comparisons,
          steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps);
      } while (left <= high && array[left] < pivotValue);

      do {
        right--;
        comparisons++;
        addStep('partitioning', pivotIdx, left, right, null,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
          steps.length > 0 ? steps[steps.length - 1].comparisons + comparisons : comparisons,
          steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps);
      } while (right >= low && array[right] > pivotValue);

      if (left >= right) break;

      [array[left], array[right]] = [array[right], array[left]];
      swaps++;
      addStep('partitioning', pivotIdx, left, right, [left, right],
        stack.map(s => ({ ...s, active: s.low === low && s.high === high })),
        steps.length > 0 ? steps[steps.length - 1].comparisons + comparisons : comparisons,
        steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps);
    }

    const pivotFinalIdx = low;
    if (pivotFinalIdx !== right) {
      [array[pivotFinalIdx], array[right]] = [array[right], array[pivotFinalIdx]];
      swaps++;
    }

    sortedIndices.add(pivotFinalIdx);
    addStep('placing', pivotFinalIdx, null, null, pivotFinalIdx !== right ? [pivotFinalIdx, right] : null,
      stack.map(s => ({ ...s, pivotPlaced: s.low === low && s.high === high })),
      steps.length > 0 ? steps[steps.length - 1].comparisons : 0,
      steps.length > 0 ? steps[steps.length - 1].swaps + swaps : swaps,
      undefined,
      right);

    const newStack = stack.map(s => ({ ...s, active: false }));
    newStack.push({ low, high: right - 1, active: true, pivotPlaced: false });
    newStack.push({ low: right + 1, high, active: true, pivotPlaced: false });

    if (low <= right - 1) {
      partitionHoare(low, right - 1, depth + 1, newStack);
    }
    if (right + 1 <= high) {
      partitionHoare(right + 1, high, depth + 1, newStack);
    }

    return right;
  };

  const initialStack = [{ low: 0, high: n - 1, active: true, pivotPlaced: false }];
  addStep('selecting', -1, null, null, null, initialStack, 0, 0);

  if (partitionScheme === 'lomuto') {
    partitionLomuto(0, n - 1, 1, initialStack);
  } else {
    partitionHoare(0, n - 1, 1, initialStack);
  }

  steps.push({
    array: [...array],
    pivotIndex: -1,
    pivotValue: -1,
    leftPointer: null,
    rightPointer: null,
    swapIndices: null,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    partitionRange: [0, n - 1],
    phase: 'complete',
    recursionStack: [],
    comparisons: steps[steps.length - 1]?.comparisons || 0,
    swaps: steps[steps.length - 1]?.swaps || 0,
    recursionDepth: 0,
    partitionsComplete: n,
  });

  return steps;
};

export function QuickSortViz() {
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(30));
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<PartitionStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showScatterSettle, setShowScatterSettle] = useState(false);
  const [scatterArray, setScatterArray] = useState<number[]>([]);
  const [pivotStrategy, setPivotStrategy] = useState<PivotStrategy>('last');
  const [partitionScheme, setPartitionScheme] = useState<PartitionScheme>('lomuto');
  const [hoveredBar, setHoveredBar] = useState<{ value: number; x: number; y: number } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [showPulse, setShowPulse] = useState(false);
  const [pulsePosition, setPulsePosition] = useState(0);
  const [processingMode, setProcessingMode] = useState<'depth-first' | 'level-order'>('depth-first');
  const [pivotSliding, setPivotSliding] = useState(false);
  const [pivotSlideFrom, setPivotSlideFrom] = useState<number | null>(null);
  const [pivotSlideTo, setPivotSlideTo] = useState<number | null>(null);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number, sorted = false) => {
    let newArr: number[];
    if (sorted) {
      newArr = generateSortedArray(size);
    } else {
      newArr = generateArray(size);
    }
    setArray(newArr);
    setOriginalArray(newArr);
    setSteps(generateSortSteps(newArr, pivotStrategy, partitionScheme));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setShowScatterSettle(false);
    setShowSummary(false);
    setShowPulse(false);
  }, [pivotStrategy, partitionScheme]);

  useEffect(() => {
    generateNewArray(arraySize);
  }, []);

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    generateNewArray(newSize);
  };

  const handleRandomize = () => {
    generateNewArray(arraySize, false);
  };

  const handleWorstCase = () => {
    setPivotStrategy('first');
    setPartitionScheme('lomuto');
    generateNewArray(arraySize, true);
  };

  const handlePivotStrategyChange = (strategy: PivotStrategy) => {
    setPivotStrategy(strategy);
    generateNewArray(arraySize);
  };

  const handlePartitionSchemeChange = (scheme: PartitionScheme) => {
    setPartitionScheme(scheme);
    generateNewArray(arraySize);
  };

  const handleReset = () => {
    setArray(originalArray);
    setSteps(generateSortSteps(originalArray, pivotStrategy, partitionScheme));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setShowScatterSettle(false);
    setShowSummary(false);
    setShowPulse(false);
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];
      if (nextStep?.phase === 'placing' && nextStep?.pivotSlideTarget !== undefined) {
        setPulsePosition(nextStep.pivotSlideTarget);
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 600);
      }
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setShowScatterSettle(true);
      const scatterArr = array.map(() => Math.floor(Math.random() * 85) + 10);
      setScatterArray(scatterArr);
      setTimeout(() => {
        setShowScatterSettle(false);
        setShowCelebration(true);
        const comparisons = steps[steps.length - 1]?.comparisons || 0;
        const maxDepth = Math.ceil(Math.log2(arraySize));
        const bestComparisons = Math.floor(arraySize * Math.log2(arraySize));
        setSummaryText(`${comparisons} comparisons in ${maxDepth} levels of recursion (ideal: ~${bestComparisons})`);
        setTimeout(() => {
          setShowCelebration(false);
          setShowSummary(true);
        }, 2000);
      }, 400);
    }
  }, [currentStep, steps, completed, arraySize, array]);

  useEffect(() => {
    if (!playing || completed) return;

    const animate = (time: number) => {
      let delay = Math.max(10, 500 - speed * 9);
      
      const currentStepData = steps[currentStep];
      if (currentStepData?.phase === 'selecting') {
        delay = Math.max(delay, 400);
      }
      
      if (time - lastTimeRef.current >= delay) {
        if (currentStep < steps.length - 1) {
          const nextStep = steps[currentStep + 1];
          if (nextStep?.phase === 'placing' && nextStep?.pivotSlideTarget !== undefined) {
            setPulsePosition(nextStep.pivotSlideTarget);
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 600);
          }
          setCurrentStep(prev => prev + 1);
        } else {
          setCompleted(true);
          setPlaying(false);
          setShowScatterSettle(true);
          const scatterArr = array.map(() => Math.floor(Math.random() * 85) + 10);
          setScatterArray(scatterArr);
          setTimeout(() => {
            setShowScatterSettle(false);
            setShowCelebration(true);
            const comparisons = steps[steps.length - 1]?.comparisons || 0;
            const levels = Math.ceil(Math.log2(arraySize));
            const bestComparisons = Math.floor(arraySize * levels);
            setSummaryText(`${comparisons} comparisons in ${levels} levels of recursion (best: ~${bestComparisons})`);
            setTimeout(() => {
              setShowCelebration(false);
              setShowSummary(true);
            }, 2000);
          }, 400);
        }
        lastTimeRef.current = time;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, speed, currentStep, steps, completed, arraySize, array]);

  const currentStepData = useMemo(() => {
    const step = steps[currentStep];
    if (step && step.phase === 'placing' && step.pivotSlideTarget !== undefined && step.pivotSlideTarget !== step.pivotIndex) {
      setPivotSliding(true);
      setPivotSlideFrom(step.pivotIndex);
      setPivotSlideTo(step.pivotSlideTarget);
    } else {
      setPivotSliding(false);
      setPivotSlideFrom(null);
      setPivotSlideTo(null);
    }
    return step || {
      array: array,
      pivotIndex: -1,
      pivotValue: -1,
      leftPointer: null,
      rightPointer: null,
      swapIndices: null,
      sortedIndices: [],
      partitionRange: [0, arraySize - 1],
      phase: 'selecting' as const,
      recursionStack: [],
      comparisons: 0,
      swaps: 0,
      recursionDepth: 1,
      partitionsComplete: 0,
    };
  }, [currentStep, steps, array, arraySize]);

  const displayArray = useMemo(() => {
    if (showScatterSettle) return scatterArray;
    return currentStepData.array;
  }, [showScatterSettle, scatterArray, currentStepData.array]);

  const metrics = useMemo(() => {
    return {
      comparisons: currentStepData.comparisons,
      swaps: currentStepData.swaps,
      recursionDepth: currentStepData.recursionDepth,
      partitionsComplete: currentStepData.partitionsComplete,
    };
  }, [currentStepData]);

  const barWidth = 100 / arraySize;
  const gap = arraySize <= 30 ? 2 : arraySize <= 50 ? 1.5 : 1;
  const actualWidth = barWidth - gap;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] p-4 overflow-auto">
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col">
          {/* Recursion Stack Brackets */}
          <div className="h-14 mb-2 rounded-lg bg-[#0d1420] border border-gray-800 p-2 overflow-hidden">
            <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
              <span>Recursion Stack</span>
              <span className="text-gray-600">Depth: {currentStepData.recursionDepth}</span>
            </div>
            <div className="relative h-8">
              {currentStepData.recursionStack.map((range, idx) => {
                const leftPercent = range.low * barWidth;
                const widthPercent = (range.high - range.low + 1) * barWidth;
                const brightness = Math.max(0.3, 1 - idx * 0.15);
                
                return (
                  <div
                    key={idx}
                    className="absolute top-1 h-6 rounded flex items-center justify-center transition-all duration-200"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: range.active 
                        ? `rgba(64, 144, 208, ${0.3 * brightness})` 
                        : `rgba(100, 100, 100, ${0.15 * brightness})`,
                      borderColor: range.active ? `rgba(64, 144, 208, ${0.6 * brightness})` : 'transparent',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      boxShadow: range.active ? `0 0 8px rgba(64, 144, 208, ${0.3 * brightness})` : 'none',
                    }}
                  >
                    <span className="text-[9px] font-mono" style={{ 
                      color: range.active ? '#60b0f0' : '#666',
                      opacity: brightness 
                    }}>
                      [{range.low}-{range.high}]
                    </span>
                  </div>
                );
              })}
              {currentStepData.recursionStack.length === 0 && (
                <div className="text-xs text-gray-600">Empty</div>
              )}
            </div>
          </div>

          {/* Main Visualization Canvas - 16:9 with three layers */}
          <div 
            className="flex-1 rounded-xl bg-[#0d1420] border border-gray-800 relative overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            {/* Layer 1: Active Partition Background Tint */}
            <div 
              className="absolute pointer-events-none"
              style={{
                bottom: '35%',
                left: `${currentStepData.partitionRange[0] * barWidth}%`,
                width: `${(currentStepData.partitionRange[1] - currentStepData.partitionRange[0] + 1) * barWidth}%`,
                height: '65%',
                backgroundColor: 'rgba(255,255,255,0.025)',
              }}
            />

            {/* Layer 2: Bars Area (65% height) */}
            <div className="absolute inset-0 p-4 pb-24 pt-2">
              <div className="relative w-full h-full">
                {displayArray.map((val, idx) => {
                  let state: BarState = 'default';
                  let color = COLORS.default;
                  
                  if (currentStepData.sortedIndices.includes(idx)) {
                    state = 'sorted';
                    color = COLORS.sorted;
                  } else if (idx < currentStepData.partitionRange[0] || idx > currentStepData.partitionRange[1]) {
                    state = 'outsidePartition';
                    color = COLORS.outsidePartition;
                  } else if (idx === currentStepData.pivotIndex) {
                    state = 'pivot';
                    color = COLORS.pivot;
                  } else if (idx === currentStepData.leftPointer && idx === currentStepData.rightPointer) {
                    state = 'pointerCross';
                    color = COLORS.pointerCross;
                  } else if (idx === currentStepData.leftPointer) {
                    state = 'leftPointer';
                    color = COLORS.leftPointer;
                  } else if (idx === currentStepData.rightPointer) {
                    state = 'rightPointer';
                    color = COLORS.rightPointer;
                  }
                  
                  if (currentStepData.swapIndices && currentStepData.swapIndices.includes(idx)) {
                    color = COLORS.swapping;
                  }

                  if (currentStepData.medianIndices && currentStepData.medianIndices.includes(idx) && currentStepData.phase === 'selecting') {
                    if (!currentStepData.sortedIndices.includes(idx)) {
                      color = COLORS.pivot;
                    }
                  }
                  
                  const isPivotPlaced = currentStepData.sortedIndices.includes(idx) && currentStepData.phase === 'placing' && idx === currentStepData.pivotIndex;
                  const isPivotSliding = pivotSliding && idx === pivotSlideFrom;
                  const isPivotTarget = pivotSliding && idx === pivotSlideTo;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute bottom-0 rounded-t transition-all duration-200"
                      style={{
                        left: `${idx * barWidth}%`,
                        width: `${actualWidth}%`,
                        height: `${val}%`,
                        background: state === 'pointerCross' ? COLORS.pointerCross : color,
                        boxShadow: state === 'pivot' || isPivotSliding
                          ? '0 0 25px #e8c040, 0 -8px 20px rgba(232, 192, 64, 0.4), 0 8px 20px rgba(232, 192, 64, 0.4)' 
                          : state === 'leftPointer' || state === 'rightPointer' 
                          ? `0 0 12px ${color}` 
                          : isPivotPlaced || isPivotTarget
                          ? '0 0 15px #4a9a70, 0 0 30px rgba(74, 154, 112, 0.3)' 
                          : 'none',
                        transform: state === 'pivot' || isPivotSliding ? 'scaleY(1.06)' : 
                                 showScatterSettle ? `scaleY(${0.8 + Math.random() * 0.4})` : 'none',
                        zIndex: state === 'pivot' ? 10 : 1,
                        opacity: showScatterSettle ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({ value: val, x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  );
                })}

                {/* Permanent Divider Lines for sorted elements */}
                {currentStepData.sortedIndices.map(idx => (
                  <div
                    key={`divider-${idx}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${idx * barWidth + actualWidth / 2}%`,
                      bottom: '0',
                      width: '1px',
                      height: '100%',
                      backgroundColor: 'rgba(74, 154, 112, 0.15)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Layer 3: Partition Boundary Markers (bottom area) */}
            <div className="absolute bottom-0 left-0 right-0 h-6">
              {/* Partition boundary lines */}
              <div 
                className="absolute bottom-0 w-px bg-gray-600/40"
                style={{ left: `${currentStepData.partitionRange[0] * barWidth}%`, height: '100%' }}
              />
              <div 
                className="absolute bottom-0 w-px bg-gray-600/40"
                style={{ left: `${(currentStepData.partitionRange[1] + 1) * barWidth}%`, height: '100%' }}
              />

              {/* Left Pointer Triangle - points right ▶ */}
              {currentStepData.leftPointer !== null && (
                <div 
                  className="absolute transition-all duration-150"
                  style={{ 
                    left: `${currentStepData.leftPointer * barWidth + actualWidth / 2}%`,
                    top: '2px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div 
                    className="text-blue-400 text-xs font-bold"
                    style={{ textShadow: `0 0 8px ${COLORS.leftPointer}` }}
                  >
                    ▶
                  </div>
                </div>
              )}

              {/* Right Pointer Triangle - points left ◀ */}
              {currentStepData.rightPointer !== null && currentStepData.rightPointer !== currentStepData.leftPointer && (
                <div 
                  className="absolute transition-all duration-150"
                  style={{ 
                    left: `${currentStepData.rightPointer * barWidth + actualWidth / 2}%`,
                    top: '2px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div 
                    className="text-rose-400 text-xs font-bold"
                    style={{ textShadow: `0 0 8px ${COLORS.rightPointer}` }}
                  >
                    ◀
                  </div>
                </div>
              )}

              {/* Indices labels */}
              <div className="absolute bottom-0 left-2 text-[9px] text-gray-600 font-mono">
                {currentStepData.partitionRange[0]}
              </div>
              <div className="absolute bottom-0 right-2 text-[9px] text-gray-600 font-mono">
                {currentStepData.partitionRange[1]}
              </div>
            </div>

            {/* Pivot Placement Pulse Effect */}
            {showPulse && (
              <div
                className="absolute pointer-events-none animate-pulse-ring"
                style={{
                  left: `${pulsePosition * barWidth + actualWidth / 2}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-8 h-8 rounded-full bg-green-400/30 animate-ping" />
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredBar && !showScatterSettle && (
              <div 
                className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-20"
                style={{
                  left: hoveredBar.x,
                  top: hoveredBar.y - 30,
                  transform: 'translateX(-50%)',
                }}
              >
                Value: {hoveredBar.value} | Index: {Math.round((hoveredBar.x - hoveredBar.x % barWidth) / barWidth)}
              </div>
            )}

            {/* Phase Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentStepData.phase === 'selecting'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : currentStepData.phase === 'placing'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : currentStepData.phase === 'complete'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              }`}>
                {currentStepData.phase === 'selecting' ? 'PIVOT SELECT' : 
                 currentStepData.phase === 'placing' ? 'PIVOT PLACE' :
                 currentStepData.phase === 'complete' ? 'COMPLETE' : 'PARTITION'}
              </div>
              <div className="px-2 py-1 rounded-full text-[10px] font-mono bg-gray-800/50 text-gray-400">
                {partitionScheme === 'lomuto' ? 'LOMUTO' : 'HOARE'}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-2 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.pivot }} />
                <span className="text-gray-500">Pivot</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.leftPointer }} />
                <span className="text-gray-500">Left</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.rightPointer }} />
                <span className="text-gray-500">Right</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.swapping }} />
                <span className="text-gray-500">Swap</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.sorted }} />
                <span className="text-gray-500">Sorted</span>
              </div>
            </div>

            {/* Summary Popup */}
            {showSummary && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#0d1420] border border-green-500/50 rounded-xl px-8 py-6 text-center animate-scale-in shadow-2xl">
                  <div className="text-3xl font-bold text-white mb-2">Sorted!</div>
                  <div className="text-lg text-green-400 font-mono">{summaryText}</div>
                  <div className="mt-3 flex items-center justify-center gap-6 text-sm">
                    <div className="text-gray-400">
                      <span className="text-green-500">Best:</span> O(n log n) with good pivots
                    </div>
                    <div className="text-gray-400">
                      <span className="text-red-500">Worst:</span> O(n²) with bad pivots
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scatter-then-Settle Overlay */}
            {showScatterSettle && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-xl font-bold text-gray-400 animate-pulse">
                  Settling...
                </div>
              </div>
            )}

            {/* Celebration */}
            {showCelebration && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-4xl font-bold text-green-400 animate-celebration">
                  ✓ Complete
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recursion Stack Sidebar */}
        <div className="w-44 rounded-xl bg-[#0d1420] border border-gray-800 p-2 overflow-hidden flex flex-col">
          <div className="text-xs text-gray-500 text-center mb-2">Call Stack</div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1">
            {currentStepData.recursionStack.slice().reverse().map((range, idx) => {
              const size = range.high - range.low + 1;
              const isSmall = size <= 3;
              const isMedium = size > 3 && size <= arraySize / 4;
              
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-all ${
                    range.active 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                      : range.pivotPlaced
                      ? 'bg-green-500/10 text-green-400/60 border border-green-500/20'
                      : 'bg-gray-800/50 text-gray-500'
                  }`}
                >
                  <span className="font-mono">[{range.low}-{range.high}]</span>
                  <span className={`text-[10px] ${
                    isSmall ? 'text-yellow-400' : 
                    isMedium ? 'text-gray-400' : 
                    'text-gray-500'
                  }`}>
                    {size}el
                  </span>
                </div>
              );
            })}
            {currentStepData.recursionStack.length === 0 && (
              <div className="text-xs text-green-400/60 text-center mt-4">
                ✓ All sorted
              </div>
            )}
          </div>
          
          {/* Worst case indicator */}
          {metrics.recursionDepth > Math.ceil(Math.log2(arraySize)) && (
            <div className="mt-2 px-2 py-1 bg-red-500/10 rounded text-[10px] text-red-400 text-center">
              ⚠ Deep recursion
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-4 gap-3 min-h-[80px]">
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Comparisons</div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.comparisons}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Swaps</div>
          <div className="text-2xl font-bold text-[#e07050] font-mono">{metrics.swaps}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Recursion Depth</div>
          <div className="text-2xl font-bold text-purple-400 font-mono">{metrics.recursionDepth}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Partitions Done</div>
          <div className="text-2xl font-bold text-[#4a9a70] font-mono">{metrics.partitionsComplete}</div>
        </div>
      </div>

      {/* Educational Labels */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="bg-green-500/5 rounded-lg px-3 py-2 border border-green-500/20 text-center">
          <span className="text-[10px] text-green-400">Best: O(n log n)</span>
          <span className="text-[10px] text-gray-500 ml-2">with good pivots</span>
        </div>
        <div className="bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/20 text-center">
          <span className="text-[10px] text-red-400">Worst: O(n²)</span>
          <span className="text-[10px] text-gray-500 ml-2">with bad pivots</span>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Size</span>
            <input
              type="range"
              min="10"
              max="50"
              value={arraySize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-20 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 w-8 font-mono">{arraySize}</span>
          </div>
          
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <Shuffle size={14} />
            Randomize
          </button>

          <button
            onClick={handleWorstCase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 border border-red-500/30 transition-colors"
          >
            <AlertTriangle size={14} />
            Worst Case
          </button>

          {/* Pivot Strategy */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">Pivot:</span>
            {(['first', 'last', 'median', 'random'] as PivotStrategy[]).map(strategy => (
              <button
                key={strategy}
                onClick={() => handlePivotStrategyChange(strategy)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  pivotStrategy === strategy
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {strategy === 'median' ? 'Med3' : strategy.charAt(0).toUpperCase() + strategy.slice(1)}
              </button>
            ))}
          </div>

          {/* Partition Scheme */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 ml-2 mr-1">Scheme:</span>
            {(['lomuto', 'hoare'] as PartitionScheme[]).map(scheme => (
              <button
                key={scheme}
                onClick={() => handlePartitionSchemeChange(scheme)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  partitionScheme === scheme
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
              </button>
            ))}
          </div>

          {/* Processing Mode */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 ml-2 mr-1">Mode:</span>
            <button
              onClick={() => setProcessingMode('depth-first')}
              className={`px-2 py-1 rounded text-xs transition-all ${
                processingMode === 'depth-first'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Process left subarray completely before right"
            >
              Depth-First
            </button>
            <button
              onClick={() => setProcessingMode('level-order')}
              className={`px-2 py-1 rounded text-xs transition-all ${
                processingMode === 'level-order'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Process all subproblems at same depth simultaneously"
            >
              Level-Order
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          
          <button
            onClick={() => setPlaying(!playing)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              playing 
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={handleStep}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            title="Step"
          >
            <SkipForward size={16} />
            Step
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500">Speed</span>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 w-10 font-mono">{speed}%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        @keyframes celebration {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-celebration {
          animation: celebration 0.5s ease-out forwards;
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        .animate-pulse-ring > div {
          animation: pulse-ring 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}


