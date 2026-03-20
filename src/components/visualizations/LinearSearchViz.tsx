import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'examining' | 'flipped' | 'match' | 'eliminated' | 'complete' | 'not-found';
type ArrayType = 'random' | 'best' | 'worst' | 'sorted';

interface SearchStep {
  array: number[];
  target: number;
  phase: Phase;
  currentIndex: number;
  checkedCount: number;
  tilesChecked: number[];
  tilesEliminated: number[];
  tilesFaceUp: number[];
  foundIndex: number | null;
  comparisons: number;
  caption: string;
  comparisonText: string;
}

const COLORS = {
  target: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  eliminated: { border: '#1a3030', text: '#3a5a50', bg: '#0a1414' },
  match: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  foundArc: '#40d8d0',
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i + 15);
}

function generateBestCaseArray(size: number): number[] {
  const arr = generateArray(size);
  arr[0] = Math.floor(Math.random() * 80) + 15;
  return arr;
}

function generateWorstCaseArray(size: number): number[] {
  const arr = generateArray(size);
  arr[size - 1] = Math.floor(Math.random() * 80) + 15;
  return arr;
}

function generateSearchSteps(arr: number[], target: number, _arrayType: ArrayType): SearchStep[] {
  const steps: SearchStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  const tilesChecked: number[] = [];
  const tilesEliminated: number[] = [];
  const tilesFaceUp: number[] = [];
  let foundIndex: number | null = null;

  const addStep = (partial: Partial<SearchStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      target,
      currentIndex: -1,
      checkedCount: 0,
      tilesChecked: [...tilesChecked],
      tilesEliminated: [...tilesEliminated],
      tilesFaceUp: [...tilesFaceUp],
      foundIndex,
      comparisons,
      caption: '',
      comparisonText: '',
      ...partial,
    } as SearchStep);
  };

  addStep({
    array: [...array],
    phase: 'idle',
    currentIndex: 0,
    checkedCount: 0,
    tilesChecked: [],
    tilesEliminated: [],
    tilesFaceUp: [],
    foundIndex: null,
    comparisons: 0,
    caption: `Looking for ${target}. Checking each tile one by one from left to right until we find it.`,
    comparisonText: '',
  });

  for (let i = 0; i < n; i++) {
    comparisons++;

    addStep({
      array: [...array],
      phase: 'examining',
      currentIndex: i,
      checkedCount: i,
      tilesChecked: [...tilesChecked],
      tilesEliminated: [...tilesEliminated],
      tilesFaceUp: [...tilesFaceUp],
      foundIndex: null,
      comparisons,
      caption: `Checking position ${i + 1} of ${n}...`,
      comparisonText: `Is ${array[i]} equal to ${target}?`,
    });

    addStep({
      array: [...array],
      phase: 'flipped',
      currentIndex: i,
      checkedCount: i + 1,
      tilesChecked: [...tilesChecked],
      tilesEliminated: [...tilesEliminated],
      tilesFaceUp: [...tilesFaceUp, i],
      foundIndex: null,
      comparisons,
      caption: `Revealed ${array[i]} — comparing to ${target}...`,
      comparisonText: `${array[i]} ${array[i] === target ? '==' : '!='} ${target}`,
    });

    if (array[i] === target) {
      foundIndex = i;
      tilesChecked.push(i);
      tilesFaceUp.push(i);

      addStep({
        array: [...array],
        phase: 'match',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        tilesEliminated: [...tilesEliminated],
        tilesFaceUp: [...tilesFaceUp],
        foundIndex: i,
        comparisons,
        caption: `Found ${target} at position ${i + 1} after checking ${i + 1} tile${i === 0 ? '' : 's'}!`,
        comparisonText: `${array[i]} is ${target} — found it!`,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        tilesEliminated: [...tilesEliminated],
        tilesFaceUp: [...tilesFaceUp],
        foundIndex: i,
        comparisons,
        caption: `Found ${target} at position ${i + 1} after checking ${i + 1} of ${n} tiles.`,
        comparisonText: `Found at position ${i + 1} — checked ${i + 1} of ${n} tiles (${Math.round(((i + 1) / n) * 100)}% of the array).`,
      });

      return steps;
    } else {
      tilesChecked.push(i);
      tilesEliminated.push(i);

      addStep({
        array: [...array],
        phase: 'eliminated',
        currentIndex: i,
        checkedCount: i + 1,
        tilesChecked: [...tilesChecked],
        tilesEliminated: [...tilesEliminated],
        tilesFaceUp: [...tilesFaceUp],
        foundIndex: null,
        comparisons,
        caption: `${array[i]} is not ${target}. Keep looking.`,
        comparisonText: `${array[i]} is not ${target}. Keep looking.`,
      });
    }
  }

  addStep({
    array: [...array],
    phase: 'not-found',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    tilesEliminated: [...tilesEliminated],
    tilesFaceUp: [],
    foundIndex: null,
    comparisons,
    caption: `Checked all ${n} tiles. ${target} is not in the array.`,
    comparisonText: `${target} is not in the array. Had to check all ${n} tiles to be sure.`,
  });

  addStep({
    array: [...array],
    phase: 'complete',
    currentIndex: n,
    checkedCount: n,
    tilesChecked: [...tilesChecked],
    tilesEliminated: [...tilesEliminated],
    tilesFaceUp: [],
    foundIndex: null,
    comparisons,
    caption: `${target} is not in the array. Had to check all ${n} tiles to be sure.`,
    comparisonText: `Not found — checked 100% of the array. Linear search has no shortcut.`,
  });

  return steps;
}

export default function LinearSearchViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateArray(16));
  const [target, setTarget] = useState<number>(() => {
    const arr = generateArray(16);
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [steps, setSteps] = useState<SearchStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [_showSummary, setShowSummary] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [showMatchArc, setShowMatchArc] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => (p + 1) % 120), 50);
    return () => clearInterval(interval);
  }, []);

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType, forcedTarget?: number) => {
    let newArr: number[];
    switch (type) {
      case 'sorted': newArr = generateSortedArray(size); break;
      case 'best': newArr = generateBestCaseArray(size); break;
      case 'worst': newArr = generateWorstCaseArray(size); break;
      default: newArr = generateArray(size);
    }
    setArray(newArr);
    const newTarget = forcedTarget !== undefined ? forcedTarget : newArr[Math.floor(Math.random() * newArr.length)];
    setTarget(newTarget);
    setSteps(generateSearchSteps(newArr, newTarget, type));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
  }, [arrayType]);

  const regenerateTarget = useCallback(() => {
    if (array.length === 0) return;
    const newTarget = array[Math.floor(Math.random() * array.length)];
    setTarget(newTarget);
    setSteps(generateSearchSteps([...array], newTarget, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
  }, [array, arrayType]);

  const regenerateMissingTarget = useCallback(() => {
    let missing = Math.floor(Math.random() * 80) + 5;
    while (array.includes(missing)) {
      missing = Math.floor(Math.random() * 80) + 5;
    }
    setTarget(missing);
    setSteps(generateSearchSteps([...array], missing, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
  }, [array, arrayType]);

  const searchCustomTarget = useCallback(() => {
    const val = parseInt(customTargetInput);
    if (isNaN(val)) return;
    setTarget(val);
    setSteps(generateSearchSteps([...array], val, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
  }, [array, arrayType, customTargetInput]);

  const generateRandomArray = useCallback(() => {
    const newArr = generateArray(arraySize);
    setArray(newArr);
    const newTarget = newArr[Math.floor(Math.random() * newArr.length)];
    setTarget(newTarget);
    setSteps(generateSearchSteps(newArr, newTarget, 'random'));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setArrayType('random');
  }, [arraySize]);

  useEffect(() => {
    generateNewArray(arraySize, arrayType);
  }, []);

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];

      if (nextStep.phase === 'match') {
        setShowMatchArc(true);
        setTimeout(() => setShowMatchArc(false), 600);
      }

      setCurrentStep(prev => prev + 1);
    } else {
      setPlaying(false);
      setShowSummary(true);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (!playing) return;

    const animate = (time: number) => {
      const delay = Math.max(10, 700 - speed * 8);
      if (time - lastTimeRef.current >= delay) {
        handleStep();
        lastTimeRef.current = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [playing, speed, handleStep]);

  const currentStepData = useMemo(() => {
    if (steps.length === 0) return steps[0] || null;
    return steps[currentStep] || steps[steps.length - 1];
  }, [steps, currentStep]);

  const handleReset = () => {
    generateNewArray(arraySize, arrayType);
  };

  const handlePreset = (type: ArrayType) => {
    setArrayType(type);
    generateNewArray(arraySize, type);
  };

  const tileSize = useMemo(() => {
    const base = Math.min(52, 680 / arraySize);
    return Math.max(40, base);
  }, [arraySize]);

  const getExplanation = (step: SearchStep) => {
    if (step.phase === 'idle') {
      return `Linear search is the simplest search algorithm — check each tile from left to right until you find the target. No shortcuts, no preparation. Just looking.`;
    }
    if (step.phase === 'examining') {
      return `Checking position ${step.currentIndex + 1}. The pointer moves to the next tile.`;
    }
    if (step.phase === 'flipped') {
      const val = step.array[step.currentIndex];
      return `Comparing ${val} with ${step.target}...`;
    }
    if (step.phase === 'match') {
      return `Match found! ${step.target} was at position ${step.foundIndex! + 1}. The search stops immediately — no need to check any more tiles.`;
    }
    if (step.phase === 'eliminated') {
      const val = step.array[step.currentIndex];
      return `${val} is not ${step.target}. This tile is eliminated. Keep searching.`;
    }
    if (step.phase === 'not-found') {
      return `${step.target} is not in this array. Every single tile was checked and none matched. Linear search has no choice but to check everything.`;
    }
    if (step.phase === 'complete') {
      if (step.foundIndex !== null) {
        return `Found ${step.target} at position ${step.foundIndex + 1} after checking ${step.checkedCount} of ${arraySize} tiles. That is ${Math.round((step.checkedCount / arraySize) * 100)}% of the array.`;
      }
      return `Searched the entire array — ${step.target} was not found. Linear search always takes O(n) time because it cannot skip tiles.`;
    }
    return 'Searching...';
  };

  const pointerBounce = useMemo(() => {
    return Math.sin(pulsePhase * 0.1) * 3;
  }, [pulsePhase]);

  const targetGlow = useMemo(() => {
    const intensity = 8 + Math.sin(pulsePhase * 0.05) * 4;
    return `0 0 ${intensity}px #40d8d080, 0 0 ${intensity * 2}px #40d8d040`;
  }, [pulsePhase]);

  const eliminatedBreath = useMemo(() => {
    return 0.65 + Math.sin(pulsePhase * 0.03) * 0.05;
  }, [pulsePhase]);

  if (!currentStepData) return null;

  const totalWidth = tileSize * arraySize + (arraySize - 1) * 6;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Linear Search</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Checked:</div>
            <div className="text-sm text-white font-bold font-mono">{currentStepData.checkedCount}</div>
            <div className="text-xs text-gray-500">/ {arraySize}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Comparisons:</div>
              <div className="text-white font-bold font-mono">{currentStepData.comparisons}</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete' && currentStepData.foundIndex !== null
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : currentStepData.phase === 'complete'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete'
              ? (currentStepData.foundIndex !== null ? `✓ Found at ${currentStepData.foundIndex + 1}` : '✗ Not Found')
              : currentStepData.phase === 'match' ? '✓ Found!'
              : currentStepData.phase === 'not-found' ? '✗ Not Found'
              : 'Searching...'}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Target Display */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Looking for</div>
          <div
            className="rounded-xl flex items-center justify-center font-bold font-mono transition-all duration-300"
            style={{
              width: 72,
              height: 72,
              border: `3px solid ${COLORS.target.border}`,
              backgroundColor: COLORS.target.bg,
              color: COLORS.target.text,
              fontSize: 28,
              boxShadow: targetGlow,
            }}
          >
            {target}
          </div>
        </div>

        {/* Input Controls */}
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
            Generate Array
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

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto w-full">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 mb-1 text-center">Search Progress</div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(currentStepData.checkedCount / arraySize) * 100}%`,
                  backgroundColor: currentStepData.foundIndex !== null ? '#40d8d0' : currentStepData.phase === 'complete' ? '#6a3040' : '#2a7a70',
                }}
              />
            </div>
          </div>
        </div>

        {/* Position Counter */}
        <div className="text-center">
          <div className="text-xs text-gray-500">
            {currentStepData.phase === 'idle'
              ? 'Ready to search'
              : currentStepData.phase === 'complete' && currentStepData.foundIndex !== null
              ? `Found ${target} at position ${currentStepData.foundIndex + 1}`
              : currentStepData.phase === 'complete'
              ? `Checked all ${arraySize} tiles — ${target} not found`
              : `Checking position ${Math.min(currentStepData.currentIndex + 1, arraySize)} of ${arraySize}`}
          </div>
          {currentStepData.checkedCount > 0 && (
            <div className="text-[10px] text-gray-600 mt-0.5">
              {currentStepData.checkedCount} of {arraySize} tiles checked ({Math.round((currentStepData.checkedCount / arraySize) * 100)}% of array)
            </div>
          )}
        </div>

        {/* Tile Row */}
        <div className="flex flex-col items-center">
          {/* Search Pointer */}
          <div className="relative" style={{ width: `${totalWidth}px`, height: 30 }}>
            {currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize && currentStepData.phase !== 'complete' && currentStepData.phase !== 'not-found' && (
              <div
                className="absolute transition-all duration-150"
                style={{
                  left: currentStepData.currentIndex * (tileSize + 6) + tileSize / 2 - 12,
                  top: pointerBounce,
                  transform: 'translateX(-50%)',
                }}
              >
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                  <path d="M12 0 L24 16 L0 16 Z" fill="#40d8d0" filter="drop-shadow(0 0 4px #40d8d080)" />
                </svg>
              </div>
            )}
            {currentStepData.phase === 'match' && currentStepData.foundIndex !== null && (
              <div
                className="absolute transition-all duration-300"
                style={{
                  left: currentStepData.foundIndex * (tileSize + 6) + tileSize / 2 - 12,
                  top: 2,
                  transform: 'translateX(-50%)',
                }}
              >
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                  <path d="M12 0 L24 16 L0 16 Z" fill="#40d8d0" filter="url(#glow)" />
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                </svg>
              </div>
            )}
          </div>

          {/* Tiles */}
          <div className="relative">
            {/* Arc connecting target to found tile */}
            {showMatchArc && currentStepData.foundIndex !== null && (
              <svg
                className="absolute pointer-events-none"
                style={{
                  top: -40,
                  left: 0,
                  width: totalWidth,
                  height: 50,
                  zIndex: 10,
                }}
              >
                <path
                  d={`M 36 Q ${currentStepData.foundIndex * (tileSize + 6) + tileSize / 2} -30, ${currentStepData.foundIndex * (tileSize + 6) + tileSize / 2} 0`}
                  stroke="#40d8d0"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                />
              </svg>
            )}

            <div className="flex items-center gap-[6px]">
              {currentStepData.array.map((val, idx) => {
                const isEliminated = currentStepData.tilesEliminated.includes(idx);
                const isCurrent = currentStepData.currentIndex === idx;
                const isFound = currentStepData.foundIndex === idx;

                const dimFactor = isEliminated ? eliminatedBreath : 1;

                let borderColor = COLORS.unsorted.border;
                let bgColor = COLORS.unsorted.bg;
                let textColor = COLORS.unsorted.text;
                let glow = 'none';

                if (isFound) {
                  borderColor = COLORS.match.border;
                  bgColor = COLORS.match.bg;
                  textColor = COLORS.match.text;
                  glow = `0 0 20px ${COLORS.match.border}80, 0 0 40px ${COLORS.match.border}40`;
                } else if (isCurrent) {
                  borderColor = '#40d8d0';
                  bgColor = '#0a1e1e';
                  textColor = '#40d8d0';
                  glow = `0 0 12px #40d8d060`;
                } else if (isEliminated) {
                  borderColor = COLORS.eliminated.border;
                  bgColor = COLORS.eliminated.bg;
                  textColor = COLORS.eliminated.text;
                }

                return (
                  <div
                    key={idx}
                    className="relative transition-all duration-200"
                    style={{
                      width: tileSize,
                      height: tileSize,
                      opacity: dimFactor,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold"
                      style={{
                        border: `3px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: tileSize * 0.35,
                        boxShadow: glow,
                      }}
                    >
                      {val}
                      {isEliminated && !isFound && (
                        <div className="absolute top-0.5 right-1 text-[8px]">✗</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison Panel */}
        <div className="flex items-center justify-center gap-4">
          <div
            className="rounded-lg flex items-center justify-center font-mono font-bold"
            style={{
              width: 52,
              height: 52,
              border: `3px solid ${COLORS.target.border}`,
              backgroundColor: COLORS.target.bg,
              color: COLORS.target.text,
              fontSize: 18,
              boxShadow: `0 0 8px ${COLORS.target.border}40`,
            }}
          >
            {target}
          </div>
          <div className="text-2xl font-bold text-gray-500">
            {currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null)
              ? <span className="text-green-400">✓</span>
              : currentStepData.phase === 'complete' || currentStepData.phase === 'not-found'
              ? <span className="text-rose-400/60">✗</span>
              : currentStepData.phase === 'flipped' || currentStepData.phase === 'eliminated'
              ? <span className="text-gray-500">✗</span>
              : <span className="text-gray-600">=?</span>}
          </div>
          <div
            className="rounded-lg flex items-center justify-center font-mono font-bold"
            style={{
              width: 52,
              height: 52,
              border: `3px solid ${
                currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null)
                  ? COLORS.match.border
                  : currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
                  ? currentStepData.tilesEliminated.includes(currentStepData.currentIndex)
                    ? COLORS.eliminated.border
                    : COLORS.unsorted.border
                  : COLORS.unsorted.border
              }`,
              backgroundColor: currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
                ? currentStepData.tilesEliminated.includes(currentStepData.currentIndex)
                  ? COLORS.eliminated.bg
                  : currentStepData.phase === 'match'
                  ? COLORS.match.bg
                  : COLORS.unsorted.bg
                : COLORS.unsorted.bg,
              color: currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
                ? currentStepData.tilesEliminated.includes(currentStepData.currentIndex)
                  ? COLORS.eliminated.text
                  : currentStepData.phase === 'match'
                  ? COLORS.match.text
                  : COLORS.unsorted.text
                : COLORS.unsorted.text,
              fontSize: 18,
              boxShadow: currentStepData.phase === 'match' ? `0 0 12px ${COLORS.match.border}60` : 'none',
            }}
          >
            {currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
              ? currentStepData.array[currentStepData.currentIndex]
              : '-'}
          </div>
        </div>

        {/* Caption */}
        <div className="text-center px-8">
          <div className={`text-sm leading-relaxed ${currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null) ? 'text-cyan-400' : currentStepData.phase === 'not-found' || (currentStepData.phase === 'complete' && !currentStepData.foundIndex) ? 'text-rose-400/80' : 'text-gray-400'}`}>
            {currentStepData.caption}
          </div>
        </div>

        {/* Educational note */}
        <div className="text-center px-8">
          <div className="text-xs text-gray-600">
            Linear search always starts from the beginning and checks one by one.
            {currentStepData.foundIndex !== null
              ? ` Found ${target} after checking ${currentStepData.checkedCount} of ${arraySize} tiles — ${Math.round((currentStepData.checkedCount / arraySize) * 100)}% of the array.`
              : currentStepData.phase === 'complete'
              ? ` Checked all ${arraySize} tiles — 100% of the array. Simple, reliable, but O(n) time on large arrays.`
              : ` In the worst case, every tile must be checked — O(n) time.`}
          </div>
          {currentStepData.phase === 'complete' && (
            <div className="text-[10px] text-gray-700 mt-1">
              Want to see a faster way to search? Try Binary Search — it can find numbers in a sorted array much faster by always checking the middle.
            </div>
          )}
        </div>

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
            onClick={() => { setPlaying(false); setCurrentStep(0); setShowMatchArc(false); }}
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
            {playing ? 'Pause' : 'Search'}
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
          {(['random', 'best', 'worst', 'sorted'] as ArrayType[]).map(type => (
            <button
              key={type}
              onClick={() => handlePreset(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                arrayType === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {type === 'random' ? 'Random Array' : type === 'best' ? 'Best Case (Pos 1)' : type === 'worst' ? 'Worst Case (Pos 16)' : 'Sorted Array'}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Size:</label>
            <input
              type="range"
              min={4}
              max={16}
              value={arraySize}
              onChange={(e) => {
                const size = parseInt(e.target.value);
                setArraySize(size);
                generateNewArray(size, arrayType);
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

        {/* Explanation Panel */}
        {showExplanation && (
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50 max-w-2xl mx-auto">
            <div className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">Explain This Step</div>
            <div className="text-sm text-gray-300 leading-relaxed">
              {getExplanation(currentStepData)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flashFade {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
