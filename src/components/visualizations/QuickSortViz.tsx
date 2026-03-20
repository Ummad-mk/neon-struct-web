import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, AlertTriangle } from 'lucide-react';

type PivotStrategy = 'first' | 'last' | 'median' | 'random';
type PartitionScheme = 'lomuto' | 'hoare';

interface SortStep {
  array: number[];
  pivotIndex: number;
  leftPointer: number | null;
  rightPointer: number | null;
  swapping: [number, number] | null;
  sortedIndices: number[];
  activeRange: [number, number];
  phase: 'idle' | 'selecting' | 'partitioning' | 'placing' | 'complete';
  comparisons: number;
  swaps: number;
  recursionDepth: number;
  partitionsComplete: number;
  medianHighlight?: [number, number, number];
  pivotTarget?: number;
  recursionStack: Array<{ low: number; high: number; active: boolean }>;
}

const COLORS = {
  default: '#2a5a58',
  outside: '#1a3a38',
  pivot: '#e8c040',
  leftPointer: '#4090d0',
  rightPointer: '#d06080',
  swapping: '#e07050',
  sorted: '#4a9a70',
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i + 15);
}

function generateSortSteps(
  arr: number[],
  pivotStrategy: PivotStrategy,
  partitionScheme: PartitionScheme
): SortStep[] {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sortedIndices: Set<number> = new Set();

  const getPivot = (low: number, high: number) => {
    switch (pivotStrategy) {
      case 'first':
        return { idx: low };
      case 'last':
        return { idx: high };
      case 'median': {
        const mid = Math.floor((low + high) / 2);
        const a = array[low], b = array[mid], c = array[high];
        const median = a < b ? (b < c ? mid : a < c ? high : low)
          : (b > c ? mid : a > c ? high : low);
        return { idx: median, highlight: [low, mid, high] as [number, number, number] };
      }
      case 'random':
        return { idx: Math.floor(Math.random() * (high - low + 1)) + low };
      default:
        return { idx: high };
    }
  };

  const addStep = (
    phase: SortStep['phase'],
    pivotIdx: number,
    leftPtr: number | null,
    rightPtr: number | null,
    swapping: [number, number] | null,
    activeRange: [number, number],
    comparisons: number,
    swaps: number,
    recursionDepth: number,
    recursionStack: SortStep['recursionStack'],
    medianHighlight?: [number, number, number],
    pivotTarget?: number
  ) => {
    steps.push({
      array: [...array],
      pivotIndex: pivotIdx,
      leftPointer: leftPtr,
      rightPointer: rightPtr,
      swapping,
      sortedIndices: Array.from(sortedIndices),
      activeRange,
      phase,
      comparisons,
      swaps,
      recursionDepth,
      partitionsComplete: sortedIndices.size,
      medianHighlight,
      pivotTarget,
      recursionStack: recursionStack.map(s => ({ ...s })),
    });
  };

  const partitionLomuto = (low: number, high: number, depth: number, comps: number, swps: number, stack: SortStep['recursionStack']) => {
    if (low >= high) {
      if (low === high && !sortedIndices.has(low)) {
        sortedIndices.add(low);
        addStep('complete', low, null, null, null, [low, high], comps, swps, depth, stack);
      }
      return;
    }

    const { idx: pivotIdx, highlight } = getPivot(low, high);
    addStep('selecting', pivotIdx, null, null, null, [low, high], comps, swps, depth, 
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })), highlight);

    [array[low], array[pivotIdx]] = [array[pivotIdx], array[low]];
    const newPivotIdx = low;
    let i = low + 1;

    for (let j = low + 1; j <= high; j++) {
      comps++;
      if (array[j] <= array[newPivotIdx]) {
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          swps++;
        }
        addStep('partitioning', newPivotIdx, j, null, i !== j ? [i, j] : null, [low, high], comps, swps, depth,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })));
        i++;
      } else {
        addStep('partitioning', newPivotIdx, j, null, null, [low, high], comps, swps, depth,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })));
      }
    }

    const pivotFinalIdx = i - 1;
    if (pivotFinalIdx !== newPivotIdx) {
      [array[newPivotIdx], array[pivotFinalIdx]] = [array[pivotFinalIdx], array[newPivotIdx]];
      swps++;
    }

    sortedIndices.add(pivotFinalIdx);
    addStep('placing', pivotFinalIdx, null, null, null, [low, high], comps, swps, depth,
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })), undefined, pivotFinalIdx);

    const newStack = stack.map(s => ({ ...s, active: false }));
    if (pivotFinalIdx - 1 > low) {
      newStack.push({ low, high: pivotFinalIdx - 1, active: true });
    }
    if (pivotFinalIdx + 1 < high) {
      newStack.push({ low: pivotFinalIdx + 1, high, active: true });
    }

    if (pivotFinalIdx - 1 > low) {
      partitionLomuto(low, pivotFinalIdx - 1, depth + 1, comps, swps, newStack);
    }
    if (pivotFinalIdx + 1 < high) {
      partitionLomuto(pivotFinalIdx + 1, high, depth + 1, comps, swps, newStack);
    }
  };

  const partitionHoare = (low: number, high: number, depth: number, comps: number, swps: number, stack: SortStep['recursionStack']) => {
    if (low >= high) {
      if (low === high && !sortedIndices.has(low)) {
        sortedIndices.add(low);
        addStep('complete', low, null, null, null, [low, high], comps, swps, depth, stack);
      }
      return;
    }

    const { idx: pivotIdx, highlight } = getPivot(low, high);
    addStep('selecting', pivotIdx, null, null, null, [low, high], comps, swps, depth,
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })), highlight);

    let left = low - 1;
    let right = high + 1;

    while (true) {
      do {
        left++;
        comps++;
        addStep('partitioning', pivotIdx, left, right, null, [low, high], comps, swps, depth,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })));
      } while (left <= high && array[left] < array[pivotIdx]);

      do {
        right--;
        comps++;
        addStep('partitioning', pivotIdx, left, right, null, [low, high], comps, swps, depth,
          stack.map(s => ({ ...s, active: s.low === low && s.high === high })));
      } while (right >= low && array[right] > array[pivotIdx]);

      if (left >= right) break;

      [array[left], array[right]] = [array[right], array[left]];
      swps++;
      addStep('partitioning', pivotIdx, left, right, [left, right], [low, high], comps, swps, depth,
        stack.map(s => ({ ...s, active: s.low === low && s.high === high })));
    }

    sortedIndices.add(low);
    addStep('placing', low, null, null, null, [low, high], comps, swps, depth,
      stack.map(s => ({ ...s, active: s.low === low && s.high === high })), undefined, right);

    const newStack = stack.map(s => ({ ...s, active: false }));
    if (low < right) {
      newStack.push({ low, high: right, active: true });
    }
    if (right + 1 < high) {
      newStack.push({ low: right + 1, high, active: true });
    }

    if (low < right) {
      partitionHoare(low, right, depth + 1, comps, swps, newStack);
    }
    if (right + 1 < high) {
      partitionHoare(right + 1, high, depth + 1, comps, swps, newStack);
    }
  };

  const initialStack = [{ low: 0, high: n - 1, active: true }];
  addStep('idle', -1, null, null, null, [0, n - 1], 0, 0, 1, initialStack);

  if (partitionScheme === 'lomuto') {
    partitionLomuto(0, n - 1, 1, 0, 0, initialStack);
  } else {
    partitionHoare(0, n - 1, 1, 0, 0, initialStack);
  }

  steps.push({
    array: [...array],
    pivotIndex: -1,
    leftPointer: null,
    rightPointer: null,
    swapping: null,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    activeRange: [0, n - 1],
    phase: 'complete',
    comparisons: steps[steps.length - 1]?.comparisons || 0,
    swaps: steps[steps.length - 1]?.swaps || 0,
    recursionDepth: 0,
    partitionsComplete: n,
    recursionStack: [],
  });

  return steps;
}

export default function QuickSortViz() {
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(30));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pivotStrategy, setPivotStrategy] = useState<PivotStrategy>('last');
  const [partitionScheme, setPartitionScheme] = useState<PartitionScheme>('lomuto');
  const [showPulse, setShowPulse] = useState(false);
  const [pulsePosition, setPulsePosition] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [scatterHeights, setScatterHeights] = useState<number[]>([]);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number, sorted = false) => {
    const newArr = sorted ? generateSortedArray(size) : generateArray(size);
    setArray(newArr);
    setSteps(generateSortSteps(newArr, pivotStrategy, partitionScheme));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowSummary(false);
    setShowPulse(false);
    setScatterHeights([]);
  }, [pivotStrategy, partitionScheme]);

  useEffect(() => {
    generateNewArray(arraySize);
  }, []);

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const next = steps[currentStep + 1];
      if (next?.phase === 'placing' && next?.pivotTarget !== undefined) {
        setPulsePosition(next.pivotTarget);
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 600);
      }
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setPlaying(false);
      const scatter = array.map(() => Math.floor(Math.random() * 80) + 15);
      setScatterHeights(scatter);
      setTimeout(() => {
        setScatterHeights([]);
        const comps = steps[steps.length - 1]?.comparisons || 0;
        const depth = Math.ceil(Math.log2(arraySize));
        setSummaryText(`${comps} comparisons in ${depth} levels (ideal: ~${Math.floor(arraySize * Math.log2(arraySize))})`);
        setShowSummary(true);
      }, 500);
    }
  }, [currentStep, steps, completed, arraySize, array]);

  useEffect(() => {
    if (!playing || completed) return;

    const animate = (time: number) => {
      const delay = Math.max(10, 500 - speed * 9);
      const stepData = steps[currentStep];
      const adjustedDelay = stepData?.phase === 'selecting' ? Math.max(delay, 400) : delay;

      if (time - lastTimeRef.current >= adjustedDelay) {
        if (currentStep < steps.length - 1) {
          const next = steps[currentStep + 1];
          if (next?.phase === 'placing' && next?.pivotTarget !== undefined) {
            setPulsePosition(next.pivotTarget);
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 600);
          }
          setCurrentStep(prev => prev + 1);
        } else {
          setCompleted(true);
          setPlaying(false);
          const scatter = array.map(() => Math.floor(Math.random() * 80) + 15);
          setScatterHeights(scatter);
          setTimeout(() => {
            setScatterHeights([]);
            const comps = steps[steps.length - 1]?.comparisons || 0;
            const depth = Math.ceil(Math.log2(arraySize));
            setSummaryText(`${comps} comparisons in ${depth} levels (ideal: ~${Math.floor(arraySize * Math.log2(arraySize))})`);
            setShowSummary(true);
          }, 500);
        }
        lastTimeRef.current = time;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [playing, speed, currentStep, steps, completed, arraySize, array]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      array,
      pivotIndex: -1,
      leftPointer: null,
      rightPointer: null,
      swapping: null,
      sortedIndices: [],
      activeRange: [0, arraySize - 1],
      phase: 'idle' as const,
      comparisons: 0,
      swaps: 0,
      recursionDepth: 1,
      partitionsComplete: 0,
      recursionStack: [{ low: 0, high: arraySize - 1, active: true }],
    };
  }, [currentStep, steps, array, arraySize]);

  const displayArray = scatterHeights.length > 0 ? scatterHeights : currentStepData.array;

  const barWidth = 100 / arraySize;
  const barGap = Math.max(0.5, 1 - arraySize / 100);
  const actualWidth = barWidth - barGap;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Main Visualization Area */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {/* Recursion Stack Display */}
        <div className="h-12 px-4 py-1 bg-[#0d1420] border-b border-gray-800">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase">Recursion Stack</span>
              <span className="text-[10px] text-gray-600 font-mono">Depth: {currentStepData.recursionDepth}</span>
            </div>
            <div className="flex-1 flex items-center gap-1 h-6 mx-4">
              {currentStepData.recursionStack.map((range, idx) => {
                const leftPercent = range.low * barWidth;
                const widthPercent = (range.high - range.low + 1) * barWidth;
                const brightness = Math.max(0.3, 1 - idx * 0.2);
                return (
                  <div
                    key={idx}
                    className="absolute h-5 rounded flex items-center justify-center border"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      backgroundColor: range.active 
                        ? `rgba(64, 144, 208, ${0.3 * brightness})` 
                        : `rgba(100, 100, 100, ${0.15 * brightness})`,
                      borderColor: range.active ? `rgba(64, 144, 208, ${0.6 * brightness})` : 'transparent',
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
                <span className="text-xs text-gray-600">Empty</span>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="absolute inset-0 pt-12 pb-6">
          {/* Active Range Background */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '12px',
              bottom: '24px',
              left: `${currentStepData.activeRange[0] * barWidth}%`,
              width: `${(currentStepData.activeRange[1] - currentStepData.activeRange[0] + 1) * barWidth}%`,
              backgroundColor: 'rgba(255,255,255,0.025)',
            }}
          />

          {/* Bars */}
          <div className="relative w-full h-full flex items-end justify-center px-4 pb-4">
            {displayArray.map((val, idx) => {
              let bgColor = COLORS.default;
              let glow = 'none';
              let scale = 1;

              if (currentStepData.sortedIndices.includes(idx)) {
                bgColor = COLORS.sorted;
              } else if (idx < currentStepData.activeRange[0] || idx > currentStepData.activeRange[1]) {
                bgColor = COLORS.outside;
              } else if (currentStepData.pivotIndex === idx) {
                bgColor = COLORS.pivot;
                glow = '0 0 20px #e8c040, 0 -5px 15px rgba(232,192,64,0.4), 0 5px 15px rgba(232,192,64,0.4)';
                scale = 1.06;
              } else if (currentStepData.leftPointer === idx && currentStepData.rightPointer === idx) {
                bgColor = `linear-gradient(90deg, ${COLORS.leftPointer} 50%, ${COLORS.rightPointer} 50%)`;
              } else if (currentStepData.leftPointer === idx) {
                bgColor = COLORS.leftPointer;
                glow = `0 0 10px ${COLORS.leftPointer}`;
              } else if (currentStepData.rightPointer === idx) {
                bgColor = COLORS.rightPointer;
                glow = `0 0 10px ${COLORS.rightPointer}`;
              }

              if (currentStepData.swapping?.includes(idx)) {
                bgColor = COLORS.swapping;
              }

              if (currentStepData.medianHighlight?.includes(idx) && currentStepData.phase === 'selecting') {
                bgColor = COLORS.pivot;
              }

              return (
                <div
                  key={idx}
                  className="absolute bottom-0 rounded-t transition-all"
                  style={{
                    left: `${idx * barWidth}%`,
                    width: `${actualWidth}%`,
                    height: `${val}%`,
                    background: bgColor,
                    boxShadow: glow,
                    transform: `scaleY(${scale})`,
                    transformOrigin: 'bottom',
                  }}
                />
              );
            })}

            {/* Sorted Dividers */}
            {currentStepData.sortedIndices.map(idx => (
              <div
                key={`div-${idx}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${idx * barWidth + actualWidth / 2}%`,
                  bottom: '0',
                  width: '1px',
                  height: '100%',
                  backgroundColor: 'rgba(74, 154, 112, 0.2)',
                }}
              />
            ))}
          </div>

          {/* Pointer Indicators Below Bars */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-8">
            {currentStepData.leftPointer !== null && (
              <div className="text-blue-400 text-xs font-mono">
                <span className="mr-2">▶</span>L: {currentStepData.leftPointer}
              </div>
            )}
            {currentStepData.rightPointer !== null && (
              <div className="text-rose-400 text-xs font-mono">
                <span className="mr-2">◀</span>R: {currentStepData.rightPointer}
              </div>
            )}
          </div>
        </div>

        {/* Pulse Effect */}
        {showPulse && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${pulsePosition * barWidth + actualWidth / 2}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}
          >
            <div className="w-16 h-16 rounded-full bg-green-400/30 animate-ping" />
          </div>
        )}

        {/* Phase Badge */}
        <div className="absolute top-14 right-4 flex gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            currentStepData.phase === 'selecting' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
            : currentStepData.phase === 'placing' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : currentStepData.phase === 'complete' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            : currentStepData.phase === 'partitioning' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
          }`}>
            {currentStepData.phase.toUpperCase()}
          </div>
          <div className="px-2 py-1 rounded-full text-[10px] font-mono bg-gray-800/50 text-gray-400">
            {partitionScheme.toUpperCase()}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-14 left-4 flex flex-wrap gap-3 text-[10px]">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.pivot }} /><span className="text-gray-500">Pivot</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.leftPointer }} /><span className="text-gray-500">Left</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.rightPointer }} /><span className="text-gray-500">Right</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.swapping }} /><span className="text-gray-500">Swap</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS.sorted }} /><span className="text-gray-500">Sorted</span></div>
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0d1420] border border-green-500/50 rounded-xl px-8 py-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">Sorted!</div>
              <div className="text-lg text-green-400 font-mono mb-3">{summaryText}</div>
              <div className="flex gap-6 text-sm">
                <span className="text-green-400">Best: O(n log n)</span>
                <span className="text-red-400">Worst: O(n²)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-[#0a1120] border-t border-gray-800 p-3">
        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="bg-[#0d1420] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] uppercase text-gray-500 mb-1">Comparisons</div>
            <div className="text-xl font-bold text-white font-mono">{currentStepData.comparisons}</div>
          </div>
          <div className="bg-[#0d1420] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] uppercase text-gray-500 mb-1">Swaps</div>
            <div className="text-xl font-bold text-[#e07050] font-mono">{currentStepData.swaps}</div>
          </div>
          <div className="bg-[#0d1420] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] uppercase text-gray-500 mb-1">Depth</div>
            <div className="text-xl font-bold text-purple-400 font-mono">{currentStepData.recursionDepth}</div>
          </div>
          <div className="bg-[#0d1420] rounded-lg p-2 border border-gray-800">
            <div className="text-[10px] uppercase text-gray-500 mb-1">Partitions</div>
            <div className="text-xl font-bold text-[#4a9a70] font-mono">{currentStepData.partitionsComplete}</div>
          </div>
        </div>

        {/* Info Labels */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-green-500/5 rounded-lg px-3 py-1.5 border border-green-500/20 text-center">
            <span className="text-xs text-green-400">Best: O(n log n)</span>
            <span className="text-xs text-gray-500 ml-2">with good pivots</span>
          </div>
          <div className="bg-red-500/5 rounded-lg px-3 py-1.5 border border-red-500/20 text-center">
            <span className="text-xs text-red-400">Worst: O(n²)</span>
            <span className="text-xs text-gray-500 ml-2">with bad pivots</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Size</span>
              <input type="range" min="10" max="50" value={arraySize} onChange={e => {
                setArraySize(Number(e.target.value));
                generateNewArray(Number(e.target.value));
              }} className="w-20 accent-cyan-500" />
              <span className="text-xs text-gray-400 font-mono w-8">{arraySize}</span>
            </div>

            <button onClick={() => generateNewArray(arraySize)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300">
              <Shuffle size={14} />Randomize
            </button>

            <button onClick={() => {
              setPivotStrategy('first');
              generateNewArray(arraySize, true);
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 border border-red-500/30">
              <AlertTriangle size={14} />Worst Case
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">Pivot:</span>
              {(['first', 'last', 'median', 'random'] as PivotStrategy[]).map(s => (
                <button key={s} onClick={() => {
                  setPivotStrategy(s);
                  generateNewArray(arraySize);
                }} className={`px-2 py-1 rounded text-xs ${pivotStrategy === s ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {s === 'median' ? 'Med3' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 ml-2 mr-1">Scheme:</span>
              {(['lomuto', 'hoare'] as PartitionScheme[]).map(s => (
                <button key={s} onClick={() => {
                  setPartitionScheme(s);
                  generateNewArray(arraySize);
                }} className={`px-2 py-1 rounded text-xs ${partitionScheme === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => generateNewArray(arraySize)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300" title="Reset">
              <RotateCcw size={16} />
            </button>

            <button onClick={() => setPlaying(!playing)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium ${playing ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause' : 'Play'}
            </button>

            <button onClick={handleStep} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300">
              <SkipForward size={14} />Step
            </button>

            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">Speed</span>
              <input type="range" min="1" max="100" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-20 accent-cyan-500" />
              <span className="text-xs text-gray-400 font-mono w-10">{speed}%</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping { animation: ping 0.6s ease-out; }
      `}</style>
    </div>
  );
}
