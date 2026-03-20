import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, HelpCircle } from 'lucide-react';

type Phase = 'intro' | 'split' | 'sortLeft' | 'sortRight' | 'sortingLeft' | 'sortingRight' | 'sortedLeft' | 'sortedRight' | 'merge' | 'complete';

interface SortStep {
  array: number[];
  phase: Phase;
  leftIndices: number[];
  rightIndices: number[];
  comparing: [number, number] | null;
  placing: number | null;
  output: number[];
  outputIndices: number[];
  caption: string;
  comparisons: number;
  placed: number;
  leftPointer: number | null;
  rightPointer: number | null;
}

const COLORS = {
  unsorted: '#2a5a58',
  left: '#4a90d0',
  right: '#d06080',
  placing: '#40d8d0',
  merged: '#5ac880',
  empty: 'rgba(255,255,255,0.06)',
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const n = arr.length;
  const array = [...arr];
  const output: number[] = [];
  const outputIndices: number[] = [];
  let comparisons = 0;
  let placed = 0;

  // Phase 1: Intro
  steps.push({
    array: [...array],
    phase: 'intro',
    leftIndices: [],
    rightIndices: [],
    comparing: null,
    placing: null,
    output: [],
    outputIndices: [],
    caption: `Starting with an unsorted array of ${n} numbers`,
    comparisons: 0,
    placed: 0,
    leftPointer: null,
    rightPointer: null,
  });

  // Phase 2: Split
  const mid = Math.floor(n / 2);
  steps.push({
    array: [...array],
    phase: 'split',
    leftIndices: Array.from({ length: mid }, (_, i) => i),
    rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
    comparing: null,
    placing: null,
    output: [],
    outputIndices: [],
    caption: 'The array has been split into two halves',
    comparisons: 0,
    placed: 0,
    leftPointer: null,
    rightPointer: null,
  });

  // Sort left half using insertion sort visualization
  const leftArr = array.slice(0, mid);
  const leftSorted: number[] = [];
  
  for (let i = 0; i < leftArr.length; i++) {
    const key = leftArr[i];
    let j = i - 1;
    
    steps.push({
      array: [...array],
      phase: i === 0 ? 'sortingLeft' : 'sortingLeft',
      leftIndices: Array.from({ length: mid }, (_, idx) => idx),
      rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
      comparing: null,
      placing: i,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: i === 0 ? 'Sorting the left half...' : `Inserting ${key} into sorted left portion`,
      comparisons,
      placed,
      leftPointer: i,
      rightPointer: null,
    });
    
    while (j >= 0 && leftArr[j] > key) {
      leftArr[j + 1] = leftArr[j];
      j--;
      comparisons++;
      steps.push({
        array: [...array],
        phase: 'sortingLeft',
        leftIndices: Array.from({ length: mid }, (_, idx) => idx),
        rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
        comparing: [j, j + 1],
        placing: null,
        output: [...output],
        outputIndices: [...outputIndices],
        caption: `Comparing ${leftArr[j]} with ${key}`,
        comparisons,
        placed,
        leftPointer: j,
        rightPointer: null,
      });
    }
    leftArr[j + 1] = key;
    
    steps.push({
      array: [...array],
      phase: 'sortingLeft',
      leftIndices: Array.from({ length: mid }, (_, idx) => idx),
      rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
      comparing: null,
      placing: j + 1,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: `${key} placed at position ${j + 1}`,
      comparisons,
      placed,
      leftPointer: j + 1,
      rightPointer: null,
    });
  }
  leftSorted.push(...leftArr);

  steps.push({
    array: [...array],
    phase: 'sortedLeft',
    leftIndices: Array.from({ length: mid }, (_, i) => i),
    rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
    comparing: null,
    placing: null,
    output: [...output],
    outputIndices: [...outputIndices],
    caption: 'Left half is sorted! Smallest to largest.',
    comparisons,
    placed,
    leftPointer: null,
    rightPointer: null,
  });

  // Sort right half using insertion sort visualization
  const rightArr = array.slice(mid);
  const rightSorted: number[] = [];
  
  for (let i = 0; i < rightArr.length; i++) {
    const key = rightArr[i];
    let j = i - 1;
    
    steps.push({
      array: [...array],
      phase: 'sortingRight',
      leftIndices: Array.from({ length: mid }, (_, idx) => idx),
      rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
      comparing: null,
      placing: mid + i,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: 'Sorting the right half...',
      comparisons,
      placed,
      leftPointer: null,
      rightPointer: mid + i,
    });
    
    while (j >= 0 && rightArr[j] > key) {
      rightArr[j + 1] = rightArr[j];
      j--;
      comparisons++;
      steps.push({
        array: [...array],
        phase: 'sortingRight',
        leftIndices: Array.from({ length: mid }, (_, idx) => idx),
        rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
        comparing: [mid + j, mid + j + 1],
        placing: null,
        output: [...output],
        outputIndices: [...outputIndices],
        caption: `Comparing ${rightArr[j]} with ${key}`,
        comparisons,
        placed,
        leftPointer: null,
        rightPointer: mid + j + 1,
      });
    }
    rightArr[j + 1] = key;
    
    steps.push({
      array: [...array],
      phase: 'sortingRight',
      leftIndices: Array.from({ length: mid }, (_, idx) => idx),
      rightIndices: Array.from({ length: n - mid }, (_, idx) => mid + idx),
      comparing: null,
      placing: mid + j + 1,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: `${key} placed at position ${mid + j + 1}`,
      comparisons,
      placed,
      leftPointer: null,
      rightPointer: mid + j + 1,
    });
  }
  rightSorted.push(...rightArr);

  steps.push({
    array: [...array],
    phase: 'sortedRight',
    leftIndices: Array.from({ length: mid }, (_, i) => i),
    rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
    comparing: null,
    placing: null,
    output: [...output],
    outputIndices: [...outputIndices],
    caption: 'Right half is sorted! Both halves are ready to merge.',
    comparisons,
    placed,
    leftPointer: null,
    rightPointer: null,
  });

  // Phase 3: Merge
  let leftIdx = 0;
  let rightIdx = 0;

  steps.push({
    array: [...array],
    phase: 'merge',
    leftIndices: Array.from({ length: mid }, (_, i) => i),
    rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
    comparing: [leftIdx, mid + rightIdx],
    placing: null,
    output: [...output],
    outputIndices: [...outputIndices],
    caption: 'Both halves are sorted. Now we merge them together.',
    comparisons,
    placed,
    leftPointer: leftIdx,
    rightPointer: mid + rightIdx,
  });

  while (leftIdx < leftSorted.length && rightIdx < rightSorted.length) {
    comparisons++;
    const leftVal = leftSorted[leftIdx];
    const rightVal = rightSorted[rightIdx];

    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices: Array.from({ length: mid }, (_, i) => i),
      rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
      comparing: [leftIdx, mid + rightIdx],
      placing: null,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: `Comparing ${leftVal} from left and ${rightVal} from right`,
      comparisons,
      placed,
      leftPointer: leftIdx,
      rightPointer: mid + rightIdx,
    });

    if (leftVal <= rightVal) {
      output.push(leftVal);
      outputIndices.push(leftIdx);
      placed++;
      steps.push({
        array: [...array],
        phase: 'merge',
        leftIndices: Array.from({ length: mid }, (_, i) => i),
        rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
        comparing: null,
        placing: leftIdx,
        output: [...output],
        outputIndices: [...outputIndices],
        caption: `${leftVal} is smaller or equal, so ${leftVal} goes next`,
        comparisons,
        placed,
        leftPointer: leftIdx,
        rightPointer: mid + rightIdx,
      });
      leftIdx++;
    } else {
      output.push(rightVal);
      outputIndices.push(mid + rightIdx);
      placed++;
      steps.push({
        array: [...array],
        phase: 'merge',
        leftIndices: Array.from({ length: mid }, (_, i) => i),
        rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
        comparing: null,
        placing: mid + rightIdx,
        output: [...output],
        outputIndices: [...outputIndices],
        caption: `${rightVal} is smaller, so ${rightVal} goes next`,
        comparisons,
        placed,
        leftPointer: leftIdx,
        rightPointer: mid + rightIdx,
      });
      rightIdx++;
    }
  }

  // Add remaining elements from left half
  while (leftIdx < leftSorted.length) {
    const val = leftSorted[leftIdx];
    output.push(val);
    outputIndices.push(leftIdx);
    placed++;
    comparisons++;
    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices: Array.from({ length: mid }, (_, i) => i),
      rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
      comparing: null,
      placing: leftIdx,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: 'Left half is empty — remaining right half values go straight in',
      comparisons,
      placed,
      leftPointer: leftIdx,
      rightPointer: mid + rightIdx,
    });
    leftIdx++;
  }

  // Add remaining elements from right half
  while (rightIdx < rightSorted.length) {
    const val = rightSorted[rightIdx];
    output.push(val);
    outputIndices.push(mid + rightIdx);
    placed++;
    comparisons++;
    steps.push({
      array: [...array],
      phase: 'merge',
      leftIndices: Array.from({ length: mid }, (_, i) => i),
      rightIndices: Array.from({ length: n - mid }, (_, i) => mid + i),
      comparing: null,
      placing: mid + rightIdx,
      output: [...output],
      outputIndices: [...outputIndices],
      caption: 'Left half is empty — remaining right half values go straight in',
      comparisons,
      placed,
      leftPointer: leftIdx,
      rightPointer: mid + rightIdx,
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
    placing: null,
    output: [...output],
    outputIndices: Array.from({ length: n }, (_, i) => i),
    caption: 'Merge complete! The array is sorted.',
    comparisons,
    placed: n,
    leftPointer: null,
    rightPointer: null,
  });

  return steps;
}

export default function MergeSortViz() {
  const [arraySize, setArraySize] = useState(12);
  const [speed, setSpeed] = useState(40);
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
      const delay = Math.max(10, 600 - speed * 9);
      
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
      placing: null,
      output: [],
      outputIndices: [],
      caption: 'Ready to start',
      comparisons: 0,
      placed: 0,
      leftPointer: null,
      rightPointer: null,
    };
  }, [currentStep, steps, array]);

  const barWidth = 100 / arraySize;
  const barGap = Math.max(0.5, 1.5 - arraySize / 50);
  const actualWidth = barWidth - barGap;

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'merge' && step.comparing) {
      const leftVal = array[step.leftPointer || 0];
      const rightVal = array[step.rightPointer || 0] || array[array.length - 1];
      return `We compared ${leftVal} from the left half and ${rightVal} from the right half. Since ${leftVal <= rightVal ? leftVal : rightVal} is the smaller number, it gets placed into the output first. The ${leftVal <= rightVal ? 'left' : 'right'} pointer now moves to the next element in its half.`;
    }
    if (step.phase === 'sortingLeft' || step.phase === 'sortingRight') {
      return `We're sorting this half using insertion sort. Each element is compared with the sorted portion and placed in its correct position. This is like sorting a hand of playing cards - easy to understand!`;
    }
    if (step.phase === 'split') {
      return `Merge sort works by first splitting the array in half. Each half will be sorted independently, then merged together. This "divide and conquer" approach makes it very efficient.`;
    }
    return 'Merge sort combines the simple idea of splitting with the intuitive process of insertion sort to create an efficient sorting algorithm.';
  };

  const mid = Math.floor(arraySize / 2);

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Phase Indicator */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-center gap-4">
        {['Step 1 — Split', 'Step 2 — Sort each half', 'Step 3 — Merge'].map((label, idx) => {
          const isActive = 
            (idx === 0 && (currentStepData.phase === 'intro' || currentStepData.phase === 'split')) ||
            (idx === 1 && (currentStepData.phase.includes('sort'))) ||
            (idx === 2 && (currentStepData.phase === 'merge' || currentStepData.phase === 'complete'));
          return (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-sm ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-4 pb-2" style={{ minHeight: 0 }}>
        {/* Bars Area */}
        <div className="relative w-full h-[60%] flex items-end justify-center">
          {/* Split line */}
          {currentStepData.phase === 'split' || currentStepData.phase === 'sortingLeft' || currentStepData.phase === 'sortingRight' ||
           currentStepData.phase === 'sortedLeft' || currentStepData.phase === 'sortedRight' || currentStepData.phase === 'merge' ? (
            <div 
              className="absolute top-0 bottom-0 w-px bg-gray-600/50 z-10"
              style={{ left: `calc(50% - ${barWidth * mid / 2}%)` }}
            />
          ) : null}

          {/* Left/Right labels */}
          {(currentStepData.phase === 'split' || currentStepData.phase.includes('sort') || currentStepData.phase === 'merge') && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-full -translate-y-6 text-xs text-blue-400">
                Left half
              </div>
              <div className="absolute top-0 left-1/2 translate-x-2 -translate-y-6 text-xs text-rose-400">
                Right half
              </div>
            </>
          )}

          {/* Bars */}
          <div className="relative w-full h-full flex items-end justify-center">
            {currentStepData.array.map((val, idx) => {
              let bgColor = COLORS.unsorted;
              
              // Left half coloring
              if (currentStepData.leftIndices.includes(idx) && !currentStepData.outputIndices.includes(idx)) {
                bgColor = COLORS.left;
              }
              
              // Right half coloring
              if (currentStepData.rightIndices.includes(idx) && !currentStepData.outputIndices.includes(idx)) {
                bgColor = COLORS.right;
              }

              // Output coloring
              if (currentStepData.outputIndices.includes(idx)) {
                bgColor = COLORS.merged;
              }

              // Placing highlight
              if (currentStepData.placing === idx) {
                bgColor = COLORS.placing;
              }

              // Comparison highlight
              if (currentStepData.comparing?.includes(idx)) {
                bgColor = COLORS.placing;
              }

              // Sorted phases
              if (currentStepData.phase === 'sortedLeft' && currentStepData.leftIndices.includes(idx)) {
                bgColor = COLORS.merged;
              }
              if (currentStepData.phase === 'sortedRight' && currentStepData.rightIndices.includes(idx)) {
                bgColor = COLORS.merged;
              }

              // Complete
              if (currentStepData.phase === 'complete') {
                bgColor = COLORS.merged;
              }

              return (
                <div
                  key={idx}
                  className="absolute bottom-0 rounded-t transition-all"
                  style={{
                    left: `${idx * barWidth}%`,
                    width: `${actualWidth}%`,
                    height: `${val}%`,
                    backgroundColor: bgColor,
                    boxShadow: currentStepData.placing === idx ? `0 0 15px ${COLORS.placing}` : 'none',
                    transform: currentStepData.placing === idx ? 'scaleY(1.05)' : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Output Row */}
        <div className="relative w-full h-[25%] flex items-start justify-center mt-2">
          <div className="text-xs text-gray-500 mb-1 text-center">Output</div>
          <div className="relative w-full h-[calc(100%-20px)] flex items-end justify-center">
            {currentStepData.output.map((val, idx) => (
              <div
                key={`output-${idx}`}
                className="absolute bottom-0 rounded-t transition-all duration-300"
                style={{
                  left: `${idx * barWidth}%`,
                  width: `${actualWidth}%`,
                  height: `${val}%`,
                  backgroundColor: COLORS.merged,
                  boxShadow: '0 0 10px rgba(90, 200, 128, 0.3)',
                }}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: arraySize - currentStepData.output.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="absolute rounded-t border"
                style={{
                  left: `${(currentStepData.output.length + idx) * barWidth}%`,
                  width: `${actualWidth}%`,
                  height: '100%',
                  borderColor: COLORS.empty,
                  backgroundColor: 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Pointer Arrows */}
        {currentStepData.phase === 'merge' && (
          <div className="absolute top-[40%] left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex gap-8">
              {currentStepData.leftPointer !== null && currentStepData.leftPointer < mid && (
                <div 
                  className="text-2xl text-blue-400"
                  style={{ 
                    marginLeft: `${currentStepData.leftPointer * barWidth * 7}px`,
                    textShadow: `0 0 10px ${COLORS.left}`
                  }}
                >
                  ▼
                </div>
              )}
              {currentStepData.rightPointer !== null && currentStepData.rightPointer >= mid && (
                <div 
                  className="text-2xl text-rose-400"
                  style={{ 
                    marginLeft: `${(currentStepData.rightPointer - mid) * barWidth * 7 + 200}px`,
                    textShadow: `0 0 10px ${COLORS.right}`
                  }}
                >
                  ▼
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Panel */}
        {currentStepData.phase === 'merge' && currentStepData.comparing && (
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 bg-[#0d1420] border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 border-2 border-blue-500 rounded-lg flex items-center justify-center text-xl font-bold text-blue-400">
                {currentStepData.array[currentStepData.leftPointer || 0]}
              </div>
              <div className="text-gray-500 font-bold">vs</div>
              <div className="w-16 h-12 border-2 border-rose-500 rounded-lg flex items-center justify-center text-xl font-bold text-rose-400">
                {currentStepData.array[currentStepData.rightPointer || mid] || '-'}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {currentStepData.caption}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 text-center py-2">
          <div className="text-sm text-gray-300 bg-[#0d1420]/80 rounded-lg px-4 py-2 inline-block">
            {currentStepData.caption}
          </div>
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-[#0d1420] border border-green-500/50 rounded-xl px-8 py-6 text-center">
              <div className="text-2xl font-bold text-white mb-2">Done!</div>
              <div className="text-gray-300 mb-4">The array is sorted from smallest to largest.</div>
              <div className="flex gap-6 justify-center">
                <div className="text-white">{currentStepData.comparisons} comparisons made</div>
                <div className="text-green-400">{currentStepData.placed} numbers placed</div>
              </div>
            </div>
          </div>
        )}

        {/* Explanation Modal */}
        {showExplanation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70" onClick={() => setShowExplanation(false)}>
            <div className="bg-[#0d1420] border border-cyan-500/50 rounded-xl px-8 py-6 max-w-md" onClick={e => e.stopPropagation()}>
              <div className="text-lg font-bold text-cyan-400 mb-3">What's happening?</div>
              <div className="text-gray-300 leading-relaxed">
                {getExplanation(currentStepData)}
              </div>
              <button 
                onClick={() => setShowExplanation(false)}
                className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-[#0a1120] border-t border-gray-800 p-4">
        {/* Metrics */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Comparisons</div>
            <div className="text-2xl font-bold text-white">{currentStepData.comparisons}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Numbers Placed</div>
            <div className="text-2xl font-bold text-green-400">{currentStepData.placed} / {arraySize}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepData.placed / arraySize) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Size</span>
              <input 
                type="range" 
                min="6" 
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

            <button 
              onClick={() => generateNewArray(arraySize)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300"
            >
              <Shuffle size={14} />Randomize
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
              title="Explain this step"
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
              <span className="text-xs text-gray-400 font-mono w-8">{speed}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#0d1420] border-t border-gray-800 px-4 py-2 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.unsorted }} /><span className="text-gray-500">Unsorted</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.left }} /><span className="text-gray-500">Left half</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.right }} /><span className="text-gray-500">Right half</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.placing }} /><span className="text-gray-500">Being placed</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.merged }} /><span className="text-gray-500">Merged</span></div>
      </div>
    </div>
  );
}
