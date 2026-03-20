import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, HelpCircle } from 'lucide-react';

type Phase = 'intro' | 'split' | 'sortLeft' | 'sortRight' | 'sorted' | 'merge' | 'complete';

interface SortStep {
  array: number[];
  phase: Phase;
  leftIndices: number[];
  rightIndices: number[];
  comparing: [number, number] | null;
  winner: 'left' | 'right' | null;
  placing: number | null;
  output: number[];
  caption: string;
  comparisons: number;
  placed: number;
  leftPointer: number | null;
  rightPointer: number | null;
  sortedInHalf: number[];
  movingTile: number | null;
  tilePosition: { x: number; y: number } | null;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  left: { border: '#4a90d0', text: '#90c8f0', bg: '#0a1828' },
  right: { border: '#d06080', text: '#f090a8', bg: '#1a0e16' },
  comparing: { border: '#60c0ff', text: '#ffffff', bg: '#0a2030' },
  winner: { border: '#40d8d0', text: '#ffffff', bg: '#0a2020' },
  placing: { border: '#40d8d0', text: '#ffffff', bg: '#0a1a1e' },
  sorted: { border: '#4a9a70', text: '#80e8a8', bg: '#0a1a0e' },
  empty: { border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.1)', bg: 'transparent' },
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function generateSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const n = arr.length;
  const array = [...arr];
  const output: number[] = [];
  let comparisons = 0;
  let placed = 0;

  const mid = Math.floor(n / 2);
  const leftIndices = Array.from({ length: mid }, (_, i) => i);
  const rightIndices = Array.from({ length: n - mid }, (_, i) => mid + i);

  // Phase 1: Intro
  steps.push({
    array: [...array],
    phase: 'intro',
    leftIndices: [],
    rightIndices: [],
    comparing: null,
    winner: null,
    placing: null,
    output: [],
    caption: `Starting with ${n} unsorted numbers. Merge sort will split, sort, and merge.`,
    comparisons: 0,
    placed: 0,
    leftPointer: null,
    rightPointer: null,
    sortedInHalf: [],
    movingTile: null,
    tilePosition: null,
  });

  // Phase 2: Split
  steps.push({
    array: [...array],
    phase: 'split',
    leftIndices,
    rightIndices,
    comparing: null,
    winner: null,
    placing: null,
    output: [],
    caption: 'The array has been split into two halves. Each half will be sorted independently.',
    comparisons: 0,
    placed: 0,
    leftPointer: null,
    rightPointer: null,
    sortedInHalf: [],
    movingTile: null,
    tilePosition: null,
  });

  // Sort left half using insertion sort
  const leftArr = array.slice(0, mid);
  const leftSorted: number[] = [];
  
  for (let i = 0; i < leftArr.length; i++) {
    const key = leftArr[i];
    const keyOrigIdx = i;
    let j = i - 1;

    // Show the tile being picked up
    steps.push({
      array: [...array],
      phase: 'sortLeft',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: null,
      placing: keyOrigIdx,
      output: [...output],
      caption: `Picking up ${key} to insert into sorted left portion`,
      comparisons,
      placed,
      leftPointer: keyOrigIdx,
      rightPointer: null,
      sortedInHalf: [...leftSorted],
      movingTile: key,
      tilePosition: null,
    });

    // Show comparisons
    while (j >= 0 && leftArr[j] > key) {
      leftArr[j + 1] = leftArr[j];
      j--;
      comparisons++;

      steps.push({
        array: [...array],
        phase: 'sortLeft',
        leftIndices,
        rightIndices,
        comparing: [j, j + 1],
        winner: 'right',
        placing: j + 1,
        output: [...output],
        caption: `${key} is smaller than ${leftArr[j]}, shifting ${leftArr[j]} right`,
        comparisons,
        placed,
        leftPointer: j,
        rightPointer: j + 1,
        sortedInHalf: [...leftSorted],
        movingTile: key,
        tilePosition: null,
      });
    }
    leftArr[j + 1] = key;
    leftSorted.push(key);

    steps.push({
      array: [...array],
      phase: 'sortLeft',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: 'left',
      placing: j + 1,
      output: [...output],
      caption: `${key} placed at position ${j + 1}. Left half: [${leftSorted.join(', ')}]`,
      comparisons,
      placed,
      leftPointer: j + 1,
      rightPointer: null,
      sortedInHalf: [...leftSorted],
      movingTile: null,
      tilePosition: null,
    });
  }

  // Sort right half using insertion sort
  const rightArr = array.slice(mid);
  const rightSorted: number[] = [];
  
  for (let i = 0; i < rightArr.length; i++) {
    const key = rightArr[i];
    const keyOrigIdx = mid + i;
    let j = i - 1;

    steps.push({
      array: [...array],
      phase: 'sortRight',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: null,
      placing: keyOrigIdx,
      output: [...output],
      caption: `Picking up ${key} to insert into sorted right portion`,
      comparisons,
      placed,
      leftPointer: null,
      rightPointer: keyOrigIdx,
      sortedInHalf: [...leftSorted, ...rightSorted],
      movingTile: key,
      tilePosition: null,
    });

    while (j >= 0 && rightArr[j] > key) {
      rightArr[j + 1] = rightArr[j];
      j--;
      comparisons++;

      steps.push({
        array: [...array],
        phase: 'sortRight',
        leftIndices,
        rightIndices,
        comparing: [mid + j, mid + j + 1],
        winner: 'right',
        placing: mid + j + 1,
        output: [...output],
        caption: `${key} is smaller than ${rightArr[j]}, shifting ${rightArr[j]} right`,
        comparisons,
        placed,
        leftPointer: mid + j,
        rightPointer: mid + j + 1,
        sortedInHalf: [...leftSorted, ...rightSorted],
        movingTile: key,
        tilePosition: null,
      });
    }
    rightArr[j + 1] = key;
    rightSorted.push(key);

    steps.push({
      array: [...array],
      phase: 'sortRight',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: 'left',
      placing: mid + j + 1,
      output: [...output],
      caption: `${key} placed at position ${mid + j + 1}. Right half: [${rightSorted.join(', ')}]`,
      comparisons,
      placed,
      leftPointer: null,
      rightPointer: mid + j + 1,
      sortedInHalf: [...leftSorted, ...rightSorted],
      movingTile: null,
      tilePosition: null,
    });
  }

  // Both halves sorted
  steps.push({
    array: [...array],
    phase: 'sorted',
    leftIndices,
    rightIndices,
    comparing: null,
    winner: null,
    placing: null,
    output: [],
    caption: `Both halves sorted! Left: [${leftSorted.join(', ')}] | Right: [${rightSorted.join(', ')}]. Now merging...`,
    comparisons,
    placed: 0,
    leftPointer: null,
    rightPointer: null,
    sortedInHalf: [...leftSorted, ...rightSorted],
    movingTile: null,
    tilePosition: null,
  });

  // Phase 3: Merge
  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < leftSorted.length && rightIdx < rightSorted.length) {
    comparisons++;
    const leftVal = leftSorted[leftIdx];
    const rightVal = rightSorted[rightIdx];

    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices,
      rightIndices,
      comparing: [leftIdx, rightIdx],
      winner: null,
      placing: null,
      output: [...output],
      caption: `Comparing ${leftVal} (left) vs ${rightVal} (right)`,
      comparisons,
      placed,
      leftPointer: leftIdx,
      rightPointer: mid + rightIdx,
      sortedInHalf: [...leftSorted, ...rightSorted],
      movingTile: null,
      tilePosition: null,
    });

    if (leftVal <= rightVal) {
      output.push(leftVal);
      placed++;

      steps.push({
        array: [...array],
        phase: 'merge',
        leftIndices,
        rightIndices,
        comparing: null,
        winner: 'left',
        placing: leftIdx,
        output: [...output],
        caption: `${leftVal} is smaller than ${rightVal}. Placing ${leftVal} into output.`,
        comparisons,
        placed,
        leftPointer: leftIdx,
        rightPointer: mid + rightIdx,
        sortedInHalf: [...leftSorted, ...rightSorted],
        movingTile: leftVal,
        tilePosition: null,
      });
      leftIdx++;
    } else {
      output.push(rightVal);
      placed++;

      steps.push({
        array: [...array],
        phase: 'merge',
        leftIndices,
        rightIndices,
        comparing: null,
        winner: 'right',
        placing: mid + rightIdx,
        output: [...output],
        caption: `${rightVal} is smaller than ${leftVal}. Placing ${rightVal} into output.`,
        comparisons,
        placed,
        leftPointer: leftIdx,
        rightPointer: mid + rightIdx,
        sortedInHalf: [...leftSorted, ...rightSorted],
        movingTile: rightVal,
        tilePosition: null,
      });
      rightIdx++;
    }
  }

  // Add remaining left elements
  while (leftIdx < leftSorted.length) {
    const val = leftSorted[leftIdx];
    output.push(val);
    placed++;

    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: 'left',
      placing: leftIdx,
      output: [...output],
      caption: 'Left half empty! Remaining right half values go straight in.',
      comparisons,
      placed,
      leftPointer: leftIdx,
      rightPointer: null,
      sortedInHalf: [...leftSorted, ...rightSorted],
      movingTile: val,
      tilePosition: null,
    });
    leftIdx++;
  }

  // Add remaining right elements
  while (rightIdx < rightSorted.length) {
    const val = rightSorted[rightIdx];
    output.push(val);
    placed++;

    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices,
      rightIndices,
      comparing: null,
      winner: 'right',
      placing: mid + rightIdx,
      output: [...output],
      caption: 'Left half values all placed! Remaining right values flow in.',
      comparisons,
      placed,
      leftPointer: null,
      rightPointer: mid + rightIdx,
      sortedInHalf: [...leftSorted, ...rightSorted],
      movingTile: val,
      tilePosition: null,
    });
    rightIdx++;
  }

  // Final step
  steps.push({
    array: [...output],
    phase: 'complete',
    leftIndices: [],
    rightIndices: [],
    comparing: null,
    winner: null,
    placing: null,
    output: [...output],
    caption: `Sorted! Read left to right: ${output.join(', ')}. Much faster than bubble sort!`,
    comparisons,
    placed: n,
    leftPointer: null,
    rightPointer: null,
    sortedInHalf: [],
    movingTile: null,
    tilePosition: null,
  });

  return steps;
}

export default function MergeSortViz() {
  const [arraySize, setArraySize] = useState(12);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(12));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number) => {
    const newArr = generateArray(size);
    setArray(newArr);
    setSteps(generateSortSteps(newArr));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
  }, []);

  useEffect(() => {
    generateNewArray(arraySize);
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
      const delay = Math.max(10, 700 - speed * 9);
      
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
      phase: 'intro' as Phase,
      leftIndices: [],
      rightIndices: [],
      comparing: null,
      winner: null,
      placing: null,
      output: [],
      caption: 'Ready to start',
      comparisons: 0,
      placed: 0,
      leftPointer: null,
      rightPointer: null,
      sortedInHalf: [],
      movingTile: null,
      tilePosition: null,
    };
  }, [currentStep, steps, array]);

  const mid = Math.floor(arraySize / 2);
  
  // Calculate tile size based on array size
  const getTileSize = () => {
    if (arraySize <= 12) return 48;
    if (arraySize <= 20) return 38;
    return 28;
  };
  
  const getFontSize = () => {
    if (arraySize <= 12) return 18;
    if (arraySize <= 20) return 14;
    return 11;
  };

  const tileSize = getTileSize();
  const fontSize = getFontSize();
  const gap = 4;

  const getTileColor = (idx: number, isInOutput: boolean, isMoving: boolean, movingVal: number | null) => {
    // In output row
    if (isInOutput) {
      return currentStepData.phase === 'complete' 
        ? { border: '#6adc98', text: '#ffffff', bg: '#0a1a0e' }
        : COLORS.sorted;
    }

    // Moving tile being placed
    if (isMoving && movingVal !== null) {
      return COLORS.placing;
    }

    // Left half
    if (currentStepData.leftIndices.includes(idx)) {
      if (currentStepData.comparing?.includes(idx)) {
        return COLORS.comparing;
      }
      if (currentStepData.winner === 'left' && currentStepData.placing === idx) {
        return COLORS.winner;
      }
      if (currentStepData.phase === 'sortLeft' && currentStepData.sortedInHalf.includes(currentStepData.array[idx])) {
        return COLORS.sorted;
      }
      if (currentStepData.sortedInHalf.length > mid) {
        return COLORS.sorted;
      }
      return COLORS.left;
    }

    // Right half
    if (currentStepData.rightIndices.includes(idx)) {
      if (currentStepData.comparing?.includes(idx)) {
        return COLORS.comparing;
      }
      if (currentStepData.winner === 'right' && currentStepData.placing === idx) {
        return COLORS.winner;
      }
      if (currentStepData.phase === 'sortRight' && currentStepData.sortedInHalf.includes(currentStepData.array[idx])) {
        return COLORS.sorted;
      }
      if (currentStepData.sortedInHalf.length >= mid && currentStepData.phase !== 'sortLeft') {
        return COLORS.sorted;
      }
      return COLORS.right;
    }

    return COLORS.unsorted;
  };

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'split') {
      return 'Merge sort splits the array in half first. Each half will be sorted independently using insertion sort, then merged together. This "divide and conquer" approach makes it very efficient.';
    }
    if (step.phase === 'sortLeft' || step.phase === 'sortRight') {
      return `We're sorting each half using insertion sort. Pick up a tile, compare it with sorted tiles, and insert it in the correct position. Think of sorting playing cards in your hand!`;
    }
    if (step.phase === 'sorted') {
      return 'Both halves are now sorted! Left half has the smallest numbers, right half has the larger numbers. Now we merge them by comparing the first element of each half.';
    }
    if (step.phase === 'merge' && step.comparing) {
      const leftVal = step.sortedInHalf[step.leftPointer || 0];
      const rightVal = step.sortedInHalf[mid + (step.rightPointer || 0) - mid];
      const smaller = Math.min(leftVal, rightVal);
      return `Comparing the first unsorted tile from each half: ${leftVal} vs ${rightVal}. Since ${smaller} is smaller, it gets placed next into the output row. The other tile waits for its turn.`;
    }
    if (step.phase === 'merge' && !step.comparing) {
      return `A tile has won the comparison and is being placed into the output row. Watch as it arcs down and lands in its correct sorted position!`;
    }
    if (step.phase === 'complete') {
      return `All done! The merge sort algorithm sorted ${arraySize} numbers using divide and conquer. It made ${step.comparisons} comparisons - much more efficient than bubble sort's O(n²) comparisons!`;
    }
    return 'Merge sort combines the simple idea of splitting with the intuitive process of insertion sort to create an efficient sorting algorithm.';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Phase Indicator */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-center gap-6">
        {[
          { label: 'Split', phases: ['intro', 'split'] },
          { label: 'Sort Halves', phases: ['sortLeft', 'sortRight', 'sorted'] },
          { label: 'Merge', phases: ['merge'] },
        ].map((item, idx) => {
          const isActive = item.phases.includes(currentStepData.phase);
          return (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-sm ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
          currentStepData.phase === 'complete' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          {currentStepData.phase === 'complete' ? '✓ Complete' : `${currentStepData.placed} of ${arraySize} placed`}
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col" style={{ minHeight: 0 }}>
        {/* Split Line */}
        {currentStepData.phase !== 'intro' && currentStepData.phase !== 'complete' && (
          <div className="absolute left-1/2 top-[15%] bottom-[25%] w-px bg-gray-600/30 z-0" />
        )}

        {/* Half Labels */}
        {currentStepData.phase === 'split' || currentStepData.phase.includes('sort') || currentStepData.phase === 'merge' ? (
          <div className="absolute top-[8%] left-0 right-0 flex justify-center gap-1/2 z-10">
            <div className="text-sm text-blue-400 font-medium" style={{ position: 'absolute', left: '25%', transform: 'translateX(-50%)' }}>
              Left half
            </div>
            <div className="text-sm text-rose-400 font-medium" style={{ position: 'absolute', left: '75%', transform: 'translateX(-50%)' }}>
              Right half
            </div>
          </div>
        ) : null}

        {/* Input Tiles Row */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative" style={{ 
            display: 'flex', 
            gap: `${gap}px`,
            paddingLeft: currentStepData.phase === 'split' || currentStepData.phase.includes('sort') ? '100px' : '0px',
            paddingRight: currentStepData.phase === 'split' || currentStepData.phase.includes('sort') ? '100px' : '0px',
            transition: 'padding 0.4s ease-in-out'
          }}>
            {currentStepData.array.map((val, idx) => {
              const isInOutput = currentStepData.output.includes(val) && currentStepData.phase === 'complete';
              const isMoving = currentStepData.movingTile === val && currentStepData.phase === 'merge';
              const colors = getTileColor(idx, isInOutput, isMoving, currentStepData.movingTile);
              
              const isBeingLifted = currentStepData.placing === idx && (currentStepData.phase === 'sortLeft' || currentStepData.phase === 'sortRight');
              
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
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3)${isBeingLifted ? ', 0 0 15px ' + colors.border : ''}`,
                    transform: isBeingLifted ? 'translateY(-20px) scale(1.1)' : isMoving ? 'translateY(-30px) scale(1.15)' : 'none',
                    opacity: currentStepData.sortedInHalf.includes(val) && currentStepData.phase === 'merge' && !currentStepData.output.includes(val) ? 0.3 : 1,
                  }}
                >
                  {val}
                </div>
              );
            })}
          </div>
        </div>

        {/* Output Row Label */}
        <div className="text-center text-xs text-gray-500 mt-4 mb-2">
          Output Row
        </div>

        {/* Output Row */}
        <div className="flex items-start justify-center">
          <div className="relative flex gap-2" style={{ minHeight: `${tileSize}px` }}>
            {currentStepData.output.map((val, idx) => (
              <div
                key={`output-${idx}`}
                className="rounded-lg flex items-center justify-center font-bold transition-all duration-300"
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  border: `2px solid ${COLORS.sorted.border}`,
                  backgroundColor: COLORS.sorted.bg,
                  color: COLORS.sorted.text,
                  fontSize: `${fontSize}px`,
                  boxShadow: '0 0 15px rgba(74, 154, 112, 0.4)',
                }}
              >
                {val}
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: arraySize - currentStepData.output.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-lg border flex items-center justify-center"
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  borderColor: COLORS.empty.border,
                  color: COLORS.empty.text,
                  fontSize: `${fontSize}px`,
                }}
              >
                ?
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Panel */}
        {currentStepData.phase === 'merge' && currentStepData.comparing && (
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 bg-[#0d1420] border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-3 shadow-xl">
            <div className="flex items-center gap-6">
              <div 
                className="rounded-lg flex items-center justify-center font-bold"
                style={{
                  width: '64px',
                  height: '64px',
                  border: `3px solid ${COLORS.left.border}`,
                  backgroundColor: COLORS.left.bg,
                  color: COLORS.left.text,
                  fontSize: '24px',
                  boxShadow: `0 0 20px ${COLORS.left.border}40`,
                }}
              >
                {currentStepData.sortedInHalf[currentStepData.leftPointer || 0]}
              </div>
              <div className="text-2xl font-bold text-gray-500">vs</div>
              <div 
                className="rounded-lg flex items-center justify-center font-bold"
                style={{
                  width: '64px',
                  height: '64px',
                  border: `3px solid ${COLORS.right.border}`,
                  backgroundColor: COLORS.right.bg,
                  color: COLORS.right.text,
                  fontSize: '24px',
                  boxShadow: `0 0 20px ${COLORS.right.border}40`,
                }}
              >
                {currentStepData.sortedInHalf[mid + (currentStepData.rightPointer || 0) - mid] || '-'}
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center max-w-xs">
              {currentStepData.caption}
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
                  <div className="text-3xl font-bold text-green-400">{arraySize}</div>
                  <div className="text-xs text-gray-500 uppercase">Numbers Sorted</div>
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-6">
                Merge sort takes <span className="text-cyan-400">n × log(n)</span> steps — much faster than bubble sort's <span className="text-rose-400">n²</span>!
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
            className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepData.placed / arraySize) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Size</span>
              <input 
                type="range" 
                min="4" 
                max="16" 
                value={arraySize} 
                onChange={e => {
                  setArraySize(Number(e.target.value));
                  generateNewArray(Number(e.target.value));
                }} 
                className="w-20 accent-cyan-500" 
              />
              <span className="text-xs text-gray-400 font-mono w-6">{arraySize}</span>
            </div>

            <button 
              onClick={() => generateNewArray(arraySize)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300"
            >
              <Shuffle size={14} />New Array
            </button>
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
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 font-medium"
            >
              <SkipForward size={14} />Step
            </button>

            <button 
              onClick={() => setPlaying(!playing)} 
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
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
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.left.border, backgroundColor: COLORS.left.bg }} />
          <span className="text-gray-500">Left Half</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.right.border, backgroundColor: COLORS.right.bg }} />
          <span className="text-gray-500">Right Half</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.placing.border, backgroundColor: COLORS.placing.bg }} />
          <span className="text-gray-500">Placing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.sorted.border, backgroundColor: COLORS.sorted.bg }} />
          <span className="text-gray-500">Sorted</span>
        </div>
      </div>
    </div>
  );
}
