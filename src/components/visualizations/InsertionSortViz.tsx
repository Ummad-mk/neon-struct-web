import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'picking' | 'comparing' | 'shifting' | 'dropping' | 'complete';

interface SortStep {
  array: number[];
  phase: Phase;
  sortedCount: number;
  currentIndex: number;
  heldValue: number | null;
  comparingWith: number | null;
  shiftingIndices: number[];
  emptySlotIndex: number | null;
  caption: string;
  comparisons: number;
  shifts: number;
  isNoShift: boolean;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  sorted: { border: '#3a8a60', text: '#80c8a0', bg: '#0a1e14' },
  holding: { border: '#40d8d0', text: '#ffffff', bg: '#0a2020' },
  comparing: { border: '#60ff90', text: '#ffffff', bg: '#0a2014' },
  shifting: { border: '#d4a040', text: '#ffffff', bg: '#0a1a10' },
  empty: { border: 'rgba(255,255,255,0.2)', text: 'rgba(255,255,255,0.1)', bg: 'transparent' },
  victory: { border: '#4ad880', text: '#ffffff', bg: '#0a2014' },
};

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function generateNearlySortedArray(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 10);
  // Swap just a few elements
  const swaps = Math.floor(size / 5);
  for (let i = 0; i < swaps; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }
  return arr;
}

function generateReverseSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i + 10);
}

function generateSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  let shifts = 0;

  // Initial state
  steps.push({
    array: [...array],
    phase: 'idle',
    sortedCount: 1,
    currentIndex: 1,
    heldValue: null,
    comparingWith: null,
    shiftingIndices: [],
    emptySlotIndex: null,
    caption: `Starting with ${n} unsorted numbers. The first number is already sorted.`,
    comparisons: 0,
    shifts: 0,
    isNoShift: false,
  });

  // Insertion sort logic
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    // Picking up the tile
    steps.push({
      array: [...array],
      phase: 'picking',
      sortedCount: i,
      currentIndex: i,
      heldValue: key,
      comparingWith: null,
      shiftingIndices: [],
      emptySlotIndex: i,
      caption: `Picking up ${key}. Now finding where ${key} belongs in the sorted region.`,
      comparisons,
      shifts,
      isNoShift: false,
    });

    // Check if no shift needed (best case)
    if (j >= 0 && array[j] > key) {
      comparisons++;

      steps.push({
        array: [...array],
        phase: 'comparing',
        sortedCount: i,
        currentIndex: i,
        heldValue: key,
        comparingWith: array[j],
        shiftingIndices: [],
        emptySlotIndex: i,
        caption: `Comparing ${key} with ${array[j]}. Is ${array[j]} bigger than ${key}?`,
        comparisons,
        shifts,
        isNoShift: false,
      });

      // Shift and compare loop
      while (j >= 0 && array[j] > key) {
        array[j + 1] = array[j];
        j--;
        shifts++;
        comparisons++;

        // Show the shift
        steps.push({
          array: [...array],
          phase: 'shifting',
          sortedCount: i,
          currentIndex: i,
          heldValue: key,
          comparingWith: j >= 0 ? array[j] : null,
          shiftingIndices: [j + 1],
          emptySlotIndex: j + 1,
          caption: `Yes! ${array[j + 1] > key ? array[j + 1] : key} shifts right. ${j >= 0 ? `Comparing ${key} with ${array[j]}.` : 'Finding final position...'}`,
          comparisons,
          shifts,
          isNoShift: false,
        });
      }

      // Drop the tile
      array[j + 1] = key;

      steps.push({
        array: [...array],
        phase: 'dropping',
        sortedCount: i + 1,
        currentIndex: i,
        heldValue: key,
        comparingWith: null,
        shiftingIndices: [],
        emptySlotIndex: j + 1,
        caption: `${key} drops into position after ${j + 1 >= 0 ? array[j] : 'start'}. Sorted region now has ${i + 1} numbers.`,
        comparisons,
        shifts,
        isNoShift: false,
      });
    } else {
      // No shift needed - best case
      comparisons++;

      steps.push({
        array: [...array],
        phase: 'comparing',
        sortedCount: i,
        currentIndex: i,
        heldValue: key,
        comparingWith: j >= 0 ? array[j] : null,
        shiftingIndices: [],
        emptySlotIndex: i,
        caption: `Comparing ${key} with ${array[j]}. Is ${array[j]} bigger than ${key}?`,
        comparisons,
        shifts,
        isNoShift: true,
      });

      // Drop without shifting
      steps.push({
        array: [...array],
        phase: 'dropping',
        sortedCount: i + 1,
        currentIndex: i,
        heldValue: key,
        comparingWith: null,
        shiftingIndices: [],
        emptySlotIndex: i,
        caption: `No! ${key} is already larger than everything to its left. ${key} stays in place.`,
        comparisons,
        shifts,
        isNoShift: true,
      });
    }
  }

  // Complete state
  steps.push({
    array: [...array],
    phase: 'complete',
    sortedCount: n,
    currentIndex: n,
    heldValue: null,
    comparingWith: null,
    shiftingIndices: [],
    emptySlotIndex: null,
    caption: `Sorted! Read the numbers left to right: ${array.join(', ')}`,
    comparisons,
    shifts,
    isNoShift: false,
  });

  return steps;
}

export default function InsertionSortViz() {
  const [arraySize, setArraySize] = useState(10);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<'random' | 'nearly' | 'reverse'>('random');
  const [array, setArray] = useState<number[]>(() => generateRandomArray(10));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number, type: 'random' | 'nearly' | 'reverse' = arrayType) => {
    let newArr: number[];
    switch (type) {
      case 'nearly':
        newArr = generateNearlySortedArray(size);
        break;
      case 'reverse':
        newArr = generateReverseSortedArray(size);
        break;
      default:
        newArr = generateRandomArray(size);
    }
    setArray(newArr);
    setSteps(generateSortSteps(newArr));
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
      const delay = Math.max(10, 800 - speed * 9);
      
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
      sortedCount: 0,
      currentIndex: 0,
      heldValue: null,
      comparingWith: null,
      shiftingIndices: [],
      emptySlotIndex: null,
      caption: 'Ready to start',
      comparisons: 0,
      shifts: 0,
      isNoShift: false,
    };
  }, [currentStep, steps, array]);

  // Calculate tile size based on array size
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

  const getTileColor = (idx: number) => {
    const { sortedCount, phase, heldValue, comparingWith, shiftingIndices, emptySlotIndex, array } = currentStepData;

    // Complete phase - all victory green
    if (phase === 'complete') {
      return COLORS.victory;
    }

    // Held tile
    if (phase === 'picking' || phase === 'comparing' || phase === 'shifting' || phase === 'dropping') {
      const isHeldTile = array[idx] === heldValue;
      if (isHeldTile) {
        if (phase === 'dropping') {
          return COLORS.sorted;
        }
        return COLORS.holding;
      }

      // Empty slot (where held tile will go)
      if (emptySlotIndex === idx) {
        return COLORS.empty;
      }

      // Shifting tiles
      if (shiftingIndices.includes(idx)) {
        return COLORS.shifting;
      }

      // Comparing tile
      if (comparingWith !== null && array[idx] === comparingWith) {
        return COLORS.comparing;
      }
    }

    // Sorted region
    if (idx < sortedCount) {
      return COLORS.sorted;
    }

    // Unsorted region
    return COLORS.unsorted;
  };

  const isLifted = (idx: number) => {
    const { phase, heldValue, array } = currentStepData;
    return (phase === 'picking' || phase === 'comparing' || phase === 'shifting') && array[idx] === heldValue;
  };

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'idle') {
      return 'Insertion sort is like sorting playing cards in your hand. We start with the first tile already sorted, then pick up each remaining tile and insert it into its correct position in the sorted region.';
    }
    if (step.phase === 'picking') {
      return `We're picking up ${step.heldValue} and will find where it belongs among the ${step.sortedCount} sorted tiles on the left. The tile lifts up and hovers while we compare.`;
    }
    if (step.phase === 'comparing') {
      return `Comparing ${step.heldValue} (held) with ${step.comparingWith} (sorted). If ${step.comparingWith} is bigger than ${step.heldValue}, it needs to shift right to make room.`;
    }
    if (step.phase === 'shifting') {
      return 'A tile is shifting right to make space for the held tile. Watch as tiles ripple rightward, each one moving one position to make room.';
    }
    if (step.phase === 'dropping') {
      if (step.isNoShift) {
        return `${step.heldValue} was already larger than all sorted tiles to its left. No shifting needed - this is insertion sort's best case!`;
      }
      return `${step.heldValue} has found its correct position and drops into place. The sorted region grows by one!`;
    }
    if (step.phase === 'complete') {
      const efficiency = step.shifts === 0 
        ? 'No shifts needed - this array was nearly sorted!'
        : step.shifts > step.comparisons * 0.5 
          ? 'Many shifts were needed - this array was close to reverse sorted.'
          : 'Moderate shifts - typical random array performance.';
      return `All ${arraySize} numbers are sorted! Made ${step.comparisons} comparisons and ${step.shifts} shifts. ${efficiency}`;
    }
    return 'Insertion sort builds the sorted region one tile at a time.';
  };

  const sortedCount = currentStepData.sortedCount;
  const unsortedCount = arraySize - sortedCount;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Insertion Sort</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Sorted:</div>
            <div className="text-sm text-green-400 font-bold">{sortedCount}</div>
            <div className="text-xs text-gray-500 ml-2">Unsorted:</div>
            <div className="text-sm text-teal-400 font-bold">{unsortedCount}</div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          currentStepData.phase === 'complete' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          {currentStepData.phase === 'complete' ? '✓ Complete' : `${currentStepData.shifts} shifts`}
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col" style={{ minHeight: 0 }}>
        {/* Held Tile Display - above the array */}
        {currentStepData.heldValue !== null && currentStepData.phase !== 'complete' && (
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="text-xs text-gray-500 mb-2">Holding</div>
            <div 
              className="rounded-lg flex items-center justify-center font-bold"
              style={{
                width: '56px',
                height: '56px',
                border: `3px solid ${COLORS.holding.border}`,
                backgroundColor: COLORS.holding.bg,
                color: COLORS.holding.text,
                fontSize: '20px',
                boxShadow: `0 0 20px ${COLORS.holding.border}60`,
              }}
            >
              {currentStepData.heldValue}
            </div>
          </div>
        )}

        {/* Sorted/Unsorted Labels */}
        <div className="flex items-center justify-center mb-2">
          <div className="relative w-full max-w-2xl">
            {/* Sorted bracket */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-green-500/50 rounded transition-all duration-300"
              style={{ width: `${(sortedCount / arraySize) * 100}%` }}
            />
            {/* Labels */}
            <div className="flex justify-between text-xs">
              <div className="text-green-400">Sorted ({sortedCount})</div>
              <div className="text-teal-400/60">Unsorted ({unsortedCount})</div>
            </div>
          </div>
        </div>

        {/* Main Tiles Row */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative flex gap-2">
            {currentStepData.array.map((val, idx) => {
              const colors = getTileColor(idx);
              const lifted = isLifted(idx);
              
              return (
                <div
                  key={idx}
                  className="rounded-lg flex items-center justify-center font-bold transition-all duration-200"
                  style={{
                    width: `${tileSize}px`,
                    height: `${tileSize}px`,
                    border: `2px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontSize: `${fontSize}px`,
                    transform: lifted ? 'translateY(-28px) scale(1.1)' : 'none',
                    boxShadow: lifted 
                      ? `0 8px 24px rgba(64, 216, 208, 0.4), 0 0 20px rgba(64, 216, 208, 0.2)`
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: lifted ? 10 : 1,
                  }}
                >
                  {val}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Panel */}
        {currentStepData.comparingWith !== null && currentStepData.heldValue !== null && (
          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 bg-[#0d1420] border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 shadow-xl min-w-[280px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Comparing</div>
            <div className="flex items-center gap-4">
              <div 
                className="rounded-lg flex flex-col items-center justify-center gap-1"
                style={{
                  width: '52px',
                  border: `2px solid ${COLORS.sorted.border}`,
                  backgroundColor: COLORS.sorted.bg,
                  padding: '8px',
                }}
              >
                <div className="text-xs text-gray-500">Sorted</div>
                <div className="text-xl font-bold" style={{ color: COLORS.sorted.text }}>
                  {currentStepData.comparingWith}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-500">vs</div>
              <div 
                className="rounded-lg flex flex-col items-center justify-center gap-1"
                style={{
                  width: '52px',
                  border: `2px solid ${COLORS.holding.border}`,
                  backgroundColor: COLORS.holding.bg,
                  padding: '8px',
                }}
              >
                <div className="text-xs text-gray-500">Held</div>
                <div className="text-xl font-bold" style={{ color: COLORS.holding.text }}>
                  {currentStepData.heldValue}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.isNoShift
                ? `${currentStepData.heldValue} is already in the right place!`
                : `Is ${currentStepData.comparingWith} > ${currentStepData.heldValue}?`
              }
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center max-w-2xl">
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
                  <div className="text-3xl font-bold text-amber-400">{currentStepData.shifts}</div>
                  <div className="text-xs text-gray-500 uppercase">Shifts</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-6">
                {currentStepData.shifts === 0 
                  ? 'Perfect! No shifts needed — this was nearly sorted!'
                  : currentStepData.shifts < currentStepData.comparisons 
                    ? 'Good performance! Fewer shifts than comparisons.'
                    : 'Many shifts were needed. Try "Nearly Sorted" for better performance.'
                }
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Best case: O(n) — when array is nearly sorted
                <br />
                Worst case: O(n²) — when array is reverse sorted
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
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-300"
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
              {(['random', 'nearly', 'reverse'] as const).map(type => (
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
                  {type === 'nearly' ? 'Nearly' : type === 'reverse' ? 'Reverse' : 'Random'}
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
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.sorted.border, backgroundColor: COLORS.sorted.bg }} />
          <span className="text-gray-500">Sorted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.holding.border, backgroundColor: COLORS.holding.bg }} />
          <span className="text-gray-500">Holding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.shifting.border, backgroundColor: COLORS.shifting.bg }} />
          <span className="text-gray-500">Shifting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.victory.border, backgroundColor: COLORS.victory.bg }} />
          <span className="text-gray-500">Complete</span>
        </div>
      </div>
    </div>
  );
}
