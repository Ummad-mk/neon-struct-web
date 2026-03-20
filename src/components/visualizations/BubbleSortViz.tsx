import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'pass-start' | 'comparing' | 'swapping' | 'pass-complete' | 'early-terminate' | 'complete';
type ArrayType = 'random' | 'nearly' | 'reverse' | 'sorted';

interface SwapHistory {
  pass: number;
  swaps: number;
}

interface SortStep {
  array: number[];
  phase: Phase;
  pass: number;
  sortedCount: number;
  comparingIdx: number;
  bubbleIdx: number;
  bubbleTravelCount: number;
  swapCount: number;
  comparisons: number;
  swaps: number;
  swapsThisPass: number;
  totalSwapsThisPass: number;
  passSwapsSoFar: number;
  caption: string;
  comparisonText: string;
  swapHistory: SwapHistory[];
  earlyTerminate: boolean;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  sorted: { border: '#3a8a60', text: '#80c8a0', bg: '#0a1a14' },
  compareLeft: { border: '#4a90d0', text: '#a0d0ff', bg: '#0a1420' },
  compareRight: { border: '#d06080', text: '#f0a0b0', bg: '#1a0a10' },
  swapping: { border: '#e07050', text: '#ffffff', bg: '#1a0e08' },
  bubble: { border: '#d4a040', text: '#f0d070', bg: '#1a1408' },
  landing: { border: '#3a8a60', text: '#80c8a0', bg: '#0a1a14' },
  victory: { border: '#4ad880', text: '#ffffff', bg: '#0a1e14' },
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateNearlySortedArray(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 15);
  const swaps = Math.max(2, Math.floor(size / 5));
  for (let i = 0; i < swaps; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }
  return arr;
}

function generateReverseArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i + 14);
}

function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i + 15);
}

function generateSortSteps(arr: number[], _arrayType: ArrayType): SortStep[] {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;
  const swapHistory: SwapHistory[] = [];

  let comparisons = 0;
  let swaps = 0;

  const addStep = (partial: Partial<SortStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      pass: 0,
      sortedCount: 0,
      comparingIdx: -1,
      bubbleIdx: -1,
      bubbleTravelCount: 0,
      swapCount: 0,
      comparisons: 0,
      swaps: 0,
      swapsThisPass: 0,
      totalSwapsThisPass: 0,
      passSwapsSoFar: 0,
      caption: '',
      comparisonText: '',
      swapHistory: [],
      earlyTerminate: false,
      ...partial,
    } as SortStep);
  };

  addStep({
    array: [...array],
    phase: 'idle',
    sortedCount: 0,
    caption: `Bubble sort compares neighboring numbers and swaps them if they are in the wrong order. The largest number gets pushed all the way to the right each pass.`,
    comparisonText: '',
    comparisons,
    swaps,
    swapHistory: [],
  });

  const passStart = (passNum: number, unsortedEnd: number) => {
    const largestIdx = array.slice(0, unsortedEnd + 1).reduce((maxIdx, val, idx) => val > array[maxIdx] ? idx : maxIdx, 0);

    addStep({
      array: [...array],
      phase: 'pass-start',
      pass: passNum,
      sortedCount: n - unsortedEnd - 1,
      comparingIdx: 0,
      bubbleIdx: largestIdx,
      bubbleTravelCount: 0,
      comparisons,
      swaps,
      swapsThisPass: 0,
      passSwapsSoFar: 0,
      totalSwapsThisPass: 0,
      swapHistory: [...swapHistory],
      caption: `Pass ${passNum}: pushing the largest remaining number all the way to position ${unsortedEnd}.`,
      comparisonText: `Bubble ${array[largestIdx]} is the largest — watch it travel right!`,
    });
  };

  for (let pass = 1, unsortedEnd = n - 1; unsortedEnd > 0; pass++, unsortedEnd--) {
    passStart(pass, unsortedEnd);

    let swapped = false;
    let passSwaps = 0;
    let bubbleIdx = array.slice(0, unsortedEnd + 1).reduce((maxIdx, val, idx) => val > array[maxIdx] ? idx : maxIdx, 0);
    let bubbleTravel = 0;

    for (let j = 0; j < unsortedEnd; j++) {
      comparisons++;

      addStep({
        array: [...array],
        phase: 'comparing',
        pass,
        sortedCount: n - unsortedEnd - 1,
        comparingIdx: j,
        bubbleIdx,
        bubbleTravelCount: bubbleTravel,
        comparisons,
        swaps,
        swapsThisPass: passSwaps,
        passSwapsSoFar: passSwaps,
        totalSwapsThisPass: 0,
        swapHistory: [...swapHistory],
        caption: `Comparing ${array[j]} and ${array[j + 1]}...`,
        comparisonText: `Is ${array[j + 1]} bigger than ${array[j]}?`,
      });

      if (array[j] > array[j + 1]) {
        swapped = true;
        passSwaps++;
        [array[j], array[j + 1]] = [array[j + 1], array[j]];

        if (j + 1 === bubbleIdx) {
          bubbleIdx = j;
        } else if (j === bubbleIdx) {
          bubbleIdx = j + 1;
        }
        bubbleTravel++;

        addStep({
          array: [...array],
          phase: 'swapping',
          pass,
          sortedCount: n - unsortedEnd - 1,
          comparingIdx: j,
          bubbleIdx,
          bubbleTravelCount: bubbleTravel,
          comparisons,
          swaps,
          swapsThisPass: passSwaps,
          passSwapsSoFar: passSwaps,
          totalSwapsThisPass: 0,
          swapHistory: [...swapHistory],
          caption: `${array[j + 1]} moves right, ${array[j]} moves left. ${array[j + 1]} is ${bubbleTravel} step${bubbleTravel > 1 ? 's' : ''} closer to position ${unsortedEnd}.`,
          comparisonText: `Yes — ${array[j + 1]} is bigger. Swapping! ${array[j + 1]} moved ${bubbleTravel} position${bubbleTravel > 1 ? 's' : ''} so far.`,
        });
      } else {
        addStep({
          array: [...array],
          phase: 'comparing',
          pass,
          sortedCount: n - unsortedEnd - 1,
          comparingIdx: j,
          bubbleIdx,
          bubbleTravelCount: bubbleTravel,
          comparisons,
          swaps,
          swapsThisPass: passSwaps,
          passSwapsSoFar: passSwaps,
          totalSwapsThisPass: 0,
          swapHistory: [...swapHistory],
          caption: `No — ${array[j]} and ${array[j + 1]} are in order. Moving on.`,
          comparisonText: `No — already in order. Moving on.`,
        });
      }
    }

    if (!swapped) {
      addStep({
        array: [...array],
        phase: 'early-terminate',
        pass,
        sortedCount: n - unsortedEnd,
        comparingIdx: -1,
        bubbleIdx: -1,
        bubbleTravelCount: 0,
        comparisons,
        swaps,
        swapsThisPass: 0,
        passSwapsSoFar: 0,
        totalSwapsThisPass: 0,
        swapHistory: [...swapHistory],
        earlyTerminate: true,
        caption: `No swaps this pass — the array is already sorted! Stopping early.`,
        comparisonText: `Zero swaps — array is sorted! Stopping.`,
      });
      break;
    }

    swapHistory.push({ pass, swaps: passSwaps });
    swaps += passSwaps;

    addStep({
      array: [...array],
      phase: 'pass-complete',
      pass,
      sortedCount: n - unsortedEnd,
      comparingIdx: -1,
      bubbleIdx: unsortedEnd,
      bubbleTravelCount: 0,
      comparisons,
      swaps,
      swapsThisPass: passSwaps,
      passSwapsSoFar: 0,
      totalSwapsThisPass: passSwaps,
      swapHistory: [...swapHistory],
      caption: `${array[unsortedEnd]} made it to position ${unsortedEnd}! It will never move again. Pass ${pass} complete: ${passSwaps} swap${passSwaps !== 1 ? 's' : ''}.`,
      comparisonText: `Pass ${pass} complete: ${passSwaps} swaps made.`,
    });
  }

  addStep({
    array: [...array],
    phase: 'complete',
    pass: 0,
    sortedCount: n,
    comparingIdx: -1,
    bubbleIdx: -1,
    bubbleTravelCount: 0,
    comparisons,
    swaps,
    swapsThisPass: 0,
    passSwapsSoFar: 0,
    totalSwapsThisPass: 0,
    swapHistory: [...swapHistory],
    earlyTerminate: false,
    caption: `Done! The largest numbers bubbled rightward pass by pass until everything was in order.`,
    comparisonText: `Sorted ${n} numbers with ${comparisons} comparisons and ${swaps} swaps.`,
  });

  return steps;
}

export default function BubbleSortViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateArray(16));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const maxPossibleComparisons = useMemo(() => {
    return arraySize * (arraySize - 1) / 2;
  }, [arraySize]);

  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => (p + 1) % 120), 50);
    return () => clearInterval(interval);
  }, []);

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    switch (type) {
      case 'nearly': newArr = generateNearlySortedArray(size); break;
      case 'reverse': newArr = generateReverseArray(size); break;
      case 'sorted': newArr = generateSortedArray(size); break;
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
      const delay = Math.max(10, 600 - speed * 8);
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
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [playing, speed, currentStep, steps.length]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      array: array,
      phase: 'idle' as Phase,
      pass: 0,
      sortedCount: 0,
      comparingIdx: -1,
      bubbleIdx: -1,
      bubbleTravelCount: 0,
      comparisons: 0,
      swaps: 0,
      swapsThisPass: 0,
      passSwapsSoFar: 0,
      totalSwapsThisPass: 0,
      caption: 'Ready',
      comparisonText: '',
      swapHistory: [],
      earlyTerminate: false,
    };
  }, [currentStep, steps, array]);

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
  const sortedCount = currentStepData.sortedCount;
  const unsortedCount = arraySize - sortedCount;

  const getTileColor = (idx: number) => {
    const { phase, sortedCount: sc, comparingIdx, bubbleIdx } = currentStepData;

    if (phase === 'complete') return COLORS.victory;

    if (idx >= arraySize - sc) return COLORS.sorted;

    if (phase === 'swapping' && (idx === comparingIdx || idx === comparingIdx + 1)) {
      return COLORS.swapping;
    }

    if (phase === 'comparing') {
      if (idx === comparingIdx) return COLORS.compareLeft;
      if (idx === comparingIdx + 1) return COLORS.compareRight;
    }

    if (idx === bubbleIdx && bubbleIdx >= 0) return COLORS.bubble;

    return COLORS.unsorted;
  };

  const getBubbleRingOpacity = (idx: number) => {
    const { phase, bubbleIdx, bubbleTravelCount } = currentStepData;
    if (idx !== bubbleIdx || bubbleIdx < 0) return 0;
    if (phase === 'pass-complete') return 1;
    const base = 0.2;
    const increment = 0.15;
    return Math.min(1, base + bubbleTravelCount * increment);
  };

  const getScale = (idx: number) => {
    const { phase, comparingIdx } = currentStepData;
    if (phase === 'swapping' && (idx === comparingIdx || idx === comparingIdx + 1)) return 1.06;
    if (phase === 'pass-complete' && idx === currentStepData.sortedCount - 1) return 1.12;
    return 1;
  };

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'idle') {
      return 'Bubble sort compares neighboring numbers and swaps them if the left one is bigger. The largest unsorted number "bubbles up" to the right end of the array each pass. Watch one number travel all the way right — that\'s the bubble!';
    }
    if (step.phase === 'pass-start') {
      return `Pass ${step.pass} is starting! The largest unsorted number will travel rightward to its final position. The amber ring marks the bubble — watch it move step by step.`;
    }
    if (step.phase === 'comparing') {
      if (step.comparisonText.includes('No —')) {
        return `These two numbers are already in order — the larger one on the right. The comparison window moves one step right.`;
      }
      return `A swap! The larger number moves right one step. The smaller number moves left. This is how bubble sort pushes the biggest numbers to the right edge.`;
    }
    if (step.phase === 'swapping') {
      return `A swap happened! The bubble moved one step closer to its destination. Watch it accumulate steps as it travels right across the array.`;
    }
    if (step.phase === 'pass-complete') {
      return `${step.array[step.sortedCount - 1]} has reached its final position. It will never move again. The sorted region on the right just grew by one.`;
    }
    if (step.phase === 'early-terminate') {
      return `Zero swaps in this pass! The array was already sorted — bubble sort noticed and stopped early. This is bubble sort\'s best trick — detecting sorted data without checking everything.`;
    }
    if (step.phase === 'complete') {
      const history = step.swapHistory;
      return `All ${arraySize} numbers sorted! ${step.comparisons} comparisons and ${step.swaps} swaps. ${history.length < arraySize - 1 ? `Stopped ${arraySize - 1 - history.length} pass${arraySize - 1 - history.length > 1 ? 'es' : ''} early thanks to zero-swap detection.` : ''} Bubble sort is simple but slow — O(n²) worst case. Its one advantage is detecting already-sorted data faster than selection sort.`;
    }
    return 'Bubble sort pushes larger numbers rightward, one step at a time.';
  };

  const maxSwapCount = useMemo(() => {
    const history = currentStepData.swapHistory;
    if (history.length === 0) return 1;
    return Math.max(...history.map(h => h.swaps), 1);
  }, [currentStepData.swapHistory]);

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Bubble Sort</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Sorted:</div>
            <div className="text-sm text-green-400 font-bold">{sortedCount}</div>
            <div className="text-xs text-gray-500 ml-2">Unsorted:</div>
            <div className="text-sm text-teal-400 font-bold">{unsortedCount}</div>
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
              <div className="text-gray-500">Pass:</div>
              <div className="text-teal-400 font-bold font-mono">{currentStepData.pass}</div>
            </div>
            {currentStepData.swapsThisPass > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="text-gray-500">This pass:</div>
                <div className="text-amber-400 font-bold font-mono">{currentStepData.swapsThisPass}</div>
              </div>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : currentStepData.phase === 'early-terminate'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete' ? '✓ Complete' : currentStepData.phase === 'early-terminate' ? '✓ Early Stop' : `Pass ${currentStepData.pass}`}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {/* Progress Bars */}
        <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto w-full">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 mb-1 text-center">Comparisons</div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentStepData.comparisons / maxPossibleComparisons) * 100)}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 mb-1 text-center">Swaps</div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400/80 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (currentStepData.swaps / maxPossibleComparisons) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Landing Zone Marker + Labels */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 6}px` }}>
            {/* Landing zone arrow */}
            {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && unsortedCount > 0 && (
              <div
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{
                  left: (arraySize - unsortedCount) * (tileSize + 6) + unsortedCount * (tileSize + 6) / 2 - 10,
                  top: -28,
                }}
              >
                <div
                  className="text-lg transition-all duration-300"
                  style={{
                    color: COLORS.landing.border,
                    textShadow: `0 0 ${6 + Math.sin(pulsePhase * 0.1) * 3}px ${COLORS.landing.border}60`,
                  }}
                >
                  →
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">largest here</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Tiles Row */}
        <div className="flex items-center justify-center">
          <div className="relative flex gap-1">
            {currentStepData.array.map((val, idx) => {
              const colors = getTileColor(idx);
              const scale = getScale(idx);
              const bubbleOpacity = getBubbleRingOpacity(idx);
              const isSorted = idx >= arraySize - sortedCount;
              const isPassComplete = currentStepData.phase === 'pass-complete' && idx === currentStepData.sortedCount - 1;
              const isLanding = currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && unsortedCount > 0 && idx === arraySize - unsortedCount;

              return (
                <div
                  key={idx}
                  className="rounded-lg flex items-center justify-center font-bold transition-all duration-200 relative"
                  style={{
                    width: `${tileSize}px`,
                    height: `${tileSize}px`,
                    border: isLanding ? `2px dashed ${COLORS.landing.border}` : `2px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontSize: `${fontSize}px`,
                    transform: `scale(${scale})`,
                    boxShadow: scale > 1
                      ? `0 0 16px ${colors.border}40`
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: scale > 1 || bubbleOpacity > 0 ? 10 : 1,
                  }}
                >
                  {/* Bubble ring */}
                  {bubbleOpacity > 0 && (
                    <div
                      className="absolute rounded-lg pointer-events-none transition-all duration-200"
                      style={{
                        inset: '-4px',
                        border: `2px solid ${currentStepData.phase === 'pass-complete' ? '#e8c040' : COLORS.bubble.border}`,
                        opacity: bubbleOpacity,
                        boxShadow: `0 0 ${6 + bubbleOpacity * 10}px ${COLORS.bubble.border}${Math.floor(bubbleOpacity * 80).toString(16).padStart(2, '0')}`,
                      }}
                    />
                  )}
                  {val}
                  {/* Lock dot */}
                  {isSorted && currentStepData.phase !== 'complete' && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '5px',
                        height: '5px',
                        backgroundColor: '#4ad880',
                        bottom: '3px',
                        right: '3px',
                        boxShadow: isPassComplete
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

        {/* Ripple Track */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 6}px` }}>
            {/* Sorted line */}
            <div
              className="absolute h-0.5 rounded-full bg-green-500/40 transition-all duration-300"
              style={{
                left: '0',
                width: `${(sortedCount / arraySize) * 100}%`,
                top: '50%',
              }}
            />
            {/* Ripple */}
            {currentStepData.phase === 'comparing' && currentStepData.comparingIdx >= 0 && (
              <div
                className="absolute h-2 rounded-full bg-blue-400/40 transition-all duration-150"
                style={{
                  left: `${(currentStepData.comparingIdx / arraySize) * 100}%`,
                  width: `${(2 / arraySize) * 100}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )}
            {/* Labels */}
            <div className="flex justify-between text-xs mt-1">
              <div className="text-green-400">Sorted ({sortedCount})</div>
              <div className="text-teal-400/60">Unsorted ({unsortedCount})</div>
            </div>
          </div>
        </div>

        {/* Swap History Bars */}
        {currentStepData.swapHistory.length > 0 && (
          <div className="flex items-center justify-center gap-2">
            <div className="text-[10px] text-gray-500 mr-1">Passes:</div>
            {currentStepData.swapHistory.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-3 bg-amber-400/60 rounded-t transition-all duration-200"
                  style={{ height: `${Math.max(2, (h.swaps / maxSwapCount) * 24)}px` }}
                />
                <div className="text-[8px] text-gray-600">{h.pass}</div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison Panel */}
        {currentStepData.phase === 'comparing' && currentStepData.comparingIdx >= 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Comparing</div>
            <div className="flex items-center gap-4">
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.compareLeft.border}`,
                  backgroundColor: COLORS.compareLeft.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[10px] text-gray-500">Left</div>
                <div className="text-lg font-bold" style={{ color: COLORS.compareLeft.text }}>
                  {currentStepData.array[currentStepData.comparingIdx]}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">vs</div>
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.compareRight.border}`,
                  backgroundColor: COLORS.compareRight.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[10px] text-gray-500">Right</div>
                <div className="text-lg font-bold" style={{ color: COLORS.compareRight.text }}>
                  {currentStepData.array[currentStepData.comparingIdx + 1]}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.comparisonText}
              {currentStepData.bubbleTravelCount > 0 && (
                <span className="ml-2 text-amber-400 text-xs">
                  ({currentStepData.array[currentStepData.bubbleIdx]} moved {currentStepData.bubbleTravelCount} step{currentStepData.bubbleTravelCount > 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Swap Panel */}
        {currentStepData.phase === 'swapping' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Swapping</div>
            <div className="flex items-center gap-4">
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.swapping.border}`,
                  backgroundColor: COLORS.swapping.bg,
                  padding: '6px',
                  boxShadow: `0 0 12px ${COLORS.swapping.border}40`,
                }}
              >
                <div className="text-[10px] text-gray-500">Left</div>
                <div className="text-lg font-bold" style={{ color: COLORS.swapping.text }}>
                  {currentStepData.array[currentStepData.comparingIdx + 1]}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">↔</div>
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.swapping.border}`,
                  backgroundColor: COLORS.swapping.bg,
                  padding: '6px',
                  boxShadow: `0 0 12px ${COLORS.swapping.border}40`,
                }}
              >
                <div className="text-[10px] text-gray-500">Right</div>
                <div className="text-lg font-bold" style={{ color: COLORS.swapping.text }}>
                  {currentStepData.array[currentStepData.comparingIdx]}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.array[currentStepData.comparingIdx + 1]} moves right, {currentStepData.array[currentStepData.comparingIdx]} moves left.
            </div>
          </div>
        )}

        {/* Pass Complete Panel */}
        {currentStepData.phase === 'pass-complete' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Pass Complete</div>
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.bubble.border}`,
                  backgroundColor: COLORS.bubble.bg,
                  padding: '6px',
                  boxShadow: `0 0 12px ${COLORS.bubble.border}40`,
                }}
              >
                <div className="text-[10px] text-gray-500">Bubble</div>
                <div className="text-lg font-bold" style={{ color: COLORS.bubble.text }}>
                  {currentStepData.totalSwapsThisPass > 0 ? currentStepData.array[sortedCount] : '—'}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">→</div>
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.sorted.border}`,
                  backgroundColor: COLORS.sorted.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[10px] text-gray-500">Pos {sortedCount - 1}</div>
                <div className="text-lg font-bold" style={{ color: COLORS.sorted.text }}>
                  {currentStepData.array[sortedCount - 1]}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.totalSwapsThisPass} swap{currentStepData.totalSwapsThisPass !== 1 ? 's' : ''} this pass.
            </div>
          </div>
        )}

        {/* Early Terminate */}
        {currentStepData.phase === 'early-terminate' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-amber-400 font-medium">
              ✓ No swaps this pass — array is already sorted!
            </div>
            <div className="text-xs text-gray-500">
              Bubble sort detected sorted data and stopped early.
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
                  <div className="text-3xl font-bold text-teal-400">{currentStepData.swapHistory.length || 1}</div>
                  <div className="text-xs text-gray-500 uppercase">Passes</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-4">
                {arrayType === 'nearly'
                  ? 'Only a little disorder means only a few passes needed. Bubble sort stopped as soon as it noticed nothing was moving.'
                  : arrayType === 'reverse'
                    ? 'Everything is backwards — every pair needs to swap. Bubble sort at its hardest.'
                    : arrayType === 'sorted'
                      ? 'Already sorted! Bubble sort checked every pair, found nothing to swap, and stopped after one pass.'
                      : 'Bubble sort is simple and easy to understand but slow on large arrays — O(n²) in the worst case. Its one advantage is detecting already-sorted data faster than selection sort.'
                }
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Best case: O(n) — already sorted (early termination)
                <br />
                Worst case: O(n²) — reverse sorted
                <br />
                Space: O(1)
              </div>
              <button onClick={() => setShowSummary(false)} className="px-6 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
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
              <button onClick={() => setShowExplanation(false)} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30">
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
          <div className="h-full bg-gradient-to-r from-cyan-600 to-green-500 rounded-full transition-all duration-300" style={{ width: `${(sortedCount / arraySize) * 100}%` }} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Size</span>
              <input type="range" min="5" max="20" value={arraySize} onChange={e => { setArraySize(Number(e.target.value)); generateNewArray(Number(e.target.value)); }} className="w-20 accent-cyan-500" />
              <span className="text-xs text-gray-400 font-mono w-6">{arraySize}</span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-500 mr-1">Array:</span>
              {(['random', 'nearly', 'reverse', 'sorted'] as ArrayType[]).map(type => (
                <button key={type} onClick={() => { setArrayType(type); generateNewArray(arraySize, type); }} className={`px-2 py-1 rounded text-xs ${arrayType === type ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {type === 'nearly' ? 'Nearly' : type === 'reverse' ? 'Reverse' : type === 'sorted' ? 'Sorted' : 'Random'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => generateNewArray(arraySize)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300" title="Reset">
              <RotateCcw size={16} />
            </button>

            <button onClick={() => setShowExplanation(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-xs text-purple-400">
              <HelpCircle size={14} />Explain
            </button>

            <button onClick={handleStep} className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 font-medium">
              <SkipForward size={14} />Step
            </button>

            <button onClick={() => setPlaying(!playing)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium ${playing ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">Speed</span>
              <input type="range" min="10" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-20 accent-cyan-500" />
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
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.sorted.border, backgroundColor: COLORS.sorted.bg }} />
          <span className="text-gray-500">Sorted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.compareLeft.border, backgroundColor: COLORS.compareLeft.bg }} />
          <span className="text-gray-500">Comparing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.bubble.border, backgroundColor: COLORS.bubble.bg }} />
          <span className="text-gray-500">Bubble</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.swapping.border, backgroundColor: COLORS.swapping.bg }} />
          <span className="text-gray-500">Swapping</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4ad880' }} />
          <span className="text-gray-500">Lock dot</span>
        </div>
      </div>
    </div>
  );
}
