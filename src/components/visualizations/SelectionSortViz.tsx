import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'scanning' | 'comparing' | 'champion-handoff' | 'scan-complete' | 'swapping' | 'confirmed' | 'complete';

interface SortStep {
  array: number[];
  phase: Phase;
  pass: number;
  sortedCount: number;
  targetIndex: number;
  scannerIndex: number;
  currentMinIndex: number;
  currentMinValue: number;
  comparingValue: number;
  comparisons: number;
  swaps: number;
  caption: string;
  comparisonText: string;
  isNoSwap: boolean;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  sorted: { border: '#3a8a60', text: '#80c8a0', bg: '#0a1e14' },
  target: { border: '#5a90c0', text: '#7ab0d8', bg: '#0a1520' },
  scanner: { border: '#9080d0', text: '#c0b0f0', bg: '#12101e' },
  champion: { border: '#40d8d0', text: '#ffffff', bg: '#0a2020' },
  swapping: { border: '#e07050', text: '#ffffff', bg: '#1a0e08' },
  confirmed: { border: '#4ad880', text: '#ffffff', bg: '#0a2014' },
  victory: { border: '#4ad880', text: '#ffffff', bg: '#0a2014' },
};

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function generateNearlySortedArray(size: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 10);
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
  let swaps = 0;

  steps.push({
    array: [...array],
    phase: 'idle',
    pass: 0,
    sortedCount: 0,
    targetIndex: 0,
    scannerIndex: 0,
    currentMinIndex: -1,
    currentMinValue: -1,
    comparingValue: -1,
    comparisons: 0,
    swaps: 0,
    caption: `Selection sort scans every unsorted number to find the smallest, then locks it in place. One hunt per pass.`,
    comparisonText: '',
    isNoSwap: false,
  });

  for (let pass = 0; pass < n - 1; pass++) {
    const targetIndex = pass;
    let minIdx = targetIndex;
    let minVal = array[targetIndex];

    steps.push({
      array: [...array],
      phase: 'scanning',
      pass: pass + 1,
      sortedCount: pass,
      targetIndex,
      scannerIndex: targetIndex,
      currentMinIndex: minIdx,
      currentMinValue: minVal,
      comparingValue: -1,
      comparisons,
      swaps,
      caption: `Pass ${pass + 1}: Scanning unsorted region for the smallest number.`,
      comparisonText: '',
      isNoSwap: false,
    });

    for (let i = targetIndex + 1; i < n; i++) {
      comparisons++;

      steps.push({
        array: [...array],
        phase: 'comparing',
        pass: pass + 1,
        sortedCount: pass,
        targetIndex,
        scannerIndex: i,
        currentMinIndex: minIdx,
        currentMinValue: minVal,
        comparingValue: array[i],
        comparisons,
        swaps,
        caption: `Scanning ${array[i]}...`,
        comparisonText: `Is ${array[i]} smaller than the current minimum ${minVal}?`,
        isNoSwap: false,
      });

      if (array[i] < minVal) {
        minIdx = i;
        minVal = array[i];

        steps.push({
          array: [...array],
          phase: 'champion-handoff',
          pass: pass + 1,
          sortedCount: pass,
          targetIndex,
          scannerIndex: i,
          currentMinIndex: minIdx,
          currentMinValue: minVal,
          comparingValue: array[i],
          comparisons,
          swaps,
          caption: `Yes — ${minVal} is the new minimum!`,
          comparisonText: `Yes — ${minVal} is the new minimum!`,
          isNoSwap: false,
        });
      } else {
        steps.push({
          array: [...array],
          phase: 'comparing',
          pass: pass + 1,
          sortedCount: pass,
          targetIndex,
          scannerIndex: i,
          currentMinIndex: minIdx,
          currentMinValue: minVal,
          comparingValue: array[i],
          comparisons,
          swaps,
          caption: `No — ${minVal} is still the smallest found so far.`,
          comparisonText: `No — ${minVal} is still the smallest found so far.`,
          isNoSwap: false,
        });
      }
    }

    steps.push({
      array: [...array],
      phase: 'scan-complete',
      pass: pass + 1,
      sortedCount: pass,
      targetIndex,
      scannerIndex: -1,
      currentMinIndex: minIdx,
      currentMinValue: minVal,
      comparingValue: -1,
      comparisons,
      swaps,
      caption: `Pass ${pass + 1} scan complete. Scanned ${n - targetIndex} tiles.`,
      comparisonText: `Smallest number found: ${minVal}. ${minIdx === targetIndex ? 'Already at target!' : 'Moving it to position ' + targetIndex + '.'}`,
      isNoSwap: minIdx === targetIndex,
    });

    if (minIdx !== targetIndex) {
      swaps++;
      const temp = array[targetIndex];
      array[targetIndex] = array[minIdx];
      array[minIdx] = temp;

      steps.push({
        array: [...array],
        phase: 'swapping',
        pass: pass + 1,
        sortedCount: pass,
        targetIndex,
        scannerIndex: -1,
        currentMinIndex: minIdx,
        currentMinValue: minVal,
        comparingValue: -1,
        comparisons,
        swaps,
        caption: `${minVal} swaps into position ${targetIndex} and is now locked in place forever.`,
        comparisonText: `Swapping ${minVal} to position ${targetIndex}.`,
        isNoSwap: false,
      });
    }

    steps.push({
      array: [...array],
      phase: 'confirmed',
      pass: pass + 1,
      sortedCount: pass + 1,
      targetIndex,
      scannerIndex: -1,
      currentMinIndex: minIdx,
      currentMinValue: minVal,
      comparingValue: -1,
      comparisons,
      swaps,
      caption: `Pass ${pass + 1} complete: found minimum ${minVal}, moved it to position ${targetIndex}. Scanned ${n - targetIndex} tiles.`,
      comparisonText: minIdx === targetIndex
        ? `${minVal} is already in the right place — no swap needed this pass!`
        : `${minVal} confirmed at position ${targetIndex}!`,
      isNoSwap: minIdx === targetIndex,
    });
  }

  steps.push({
    array: [...array],
    phase: 'complete',
    pass: n - 1,
    sortedCount: n,
    targetIndex: n - 1,
    scannerIndex: -1,
    currentMinIndex: -1,
    currentMinValue: -1,
    comparingValue: -1,
    comparisons,
    swaps,
    caption: `Done! Every number found its correct position through the hunt. Read them left to right to confirm.`,
    comparisonText: `Sorted ${n} numbers with ${comparisons} comparisons and ${swaps} swaps.`,
    isNoSwap: false,
  });

  return steps;
}

export default function SelectionSortViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<'random' | 'nearly' | 'reverse'>('random');
  const [array, setArray] = useState<number[]>(() => generateRandomArray(16));
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
      const delay = Math.max(10, 800 - speed * 8);
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
      pass: 0,
      sortedCount: 0,
      targetIndex: 0,
      scannerIndex: 0,
      currentMinIndex: -1,
      currentMinValue: -1,
      comparingValue: -1,
      comparisons: 0,
      swaps: 0,
      caption: 'Ready to start',
      comparisonText: '',
      isNoSwap: false,
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

  const getTileColor = (idx: number) => {
    const { phase, sortedCount, targetIndex, scannerIndex, currentMinIndex } = currentStepData;

    if (phase === 'complete' || phase === 'confirmed') {
      if (idx < sortedCount) return COLORS.victory;
    }

    if (phase === 'confirmed' && idx === sortedCount - 1) {
      return COLORS.confirmed;
    }

    if (idx < sortedCount) {
      return COLORS.sorted;
    }

    if (phase === 'swapping') {
      if (idx === targetIndex || idx === currentMinIndex) {
        return COLORS.swapping;
      }
    }

    if (idx === targetIndex && phase !== 'swapping') {
      return COLORS.target;
    }

    if (phase === 'comparing' || phase === 'champion-handoff') {
      if (idx === currentMinIndex) {
        return COLORS.champion;
      }
      if (idx === scannerIndex) {
        return COLORS.scanner;
      }
    }

    if (phase === 'scanning') {
      if (idx === currentMinIndex) {
        return COLORS.champion;
      }
    }

    if (phase === 'scan-complete') {
      if (idx === currentMinIndex) {
        return COLORS.champion;
      }
    }

    return COLORS.unsorted;
  };

  const isLocked = (idx: number) => {
    const { sortedCount, phase } = currentStepData;
    return idx < sortedCount || phase === 'complete';
  };

  const getScale = (idx: number) => {
    const { phase, sortedCount, targetIndex, currentMinIndex, scannerIndex } = currentStepData;

    if (phase === 'complete') return 1;

    if (phase === 'confirmed' && idx === sortedCount - 1) return 1.12;
    if (phase === 'confirmed') return 1;

    if (phase === 'swapping') {
      if (idx === targetIndex || idx === currentMinIndex) return 1.1;
    }

    if (phase === 'comparing') {
      if (idx === currentMinIndex) return 1.08;
      if (idx === scannerIndex) return 1.04;
    }

    if (phase === 'champion-handoff') {
      if (idx === currentMinIndex) return 1.08;
    }

    if (phase === 'scan-complete' || phase === 'scanning') {
      if (idx === currentMinIndex) return 1.08;
    }

    return 1;
  };

  const sortedCount = currentStepData.sortedCount;
  const unsortedCount = arraySize - sortedCount;
  const huntingLineWidth = ((arraySize - sortedCount) / arraySize) * 100;

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'idle') {
      return 'Selection sort is a hunter. Each pass it scans the entire unsorted region looking for the smallest number, then places it in its final position. One hunt, one placement, repeat.';
    }
    if (step.phase === 'scanning') {
      return `Pass ${step.pass} is starting. The scanner will examine each unsorted tile one by one, tracking the smallest value found. The current minimum is ${step.currentMinValue}.`;
    }
    if (step.phase === 'comparing') {
      return `Comparing ${step.comparingValue} with current minimum ${step.currentMinValue}. If ${step.comparingValue} is smaller, it becomes the new champion.`;
    }
    if (step.phase === 'champion-handoff') {
      return `${step.currentMinValue} is the new minimum! The cyan crown passes to this tile. The scanner continues looking for something even smaller.`;
    }
    if (step.phase === 'scan-complete') {
      if (step.isNoSwap) {
        return `${step.currentMinValue} is already at position ${step.targetIndex}. No swap needed — but the entire scan still happened! Selection sort always checks everything.`;
      }
      return `Scan complete! Found minimum ${step.currentMinValue}. It will now swap with the tile at position ${step.targetIndex} and be locked forever.`;
    }
    if (step.phase === 'swapping') {
      return 'The swap is ceremonial — the payoff for an entire pass of scanning. Both tiles turn coral and execute the cross-slide.';
    }
    if (step.phase === 'confirmed') {
      return `${step.currentMinValue} is now locked in its final position. Notice the green lock dot — this tile will never move again. The hunting ground shrinks by one.`;
    }
    if (step.phase === 'complete') {
      return `All ${arraySize} numbers are sorted! ${step.comparisons} comparisons but only ${step.swaps} swaps. Selection sort looks a lot but moves very little — useful when moving is expensive.`;
    }
    return 'Selection sort hunts for the minimum in each pass.';
  };

  const maxComparisons = (arraySize * (arraySize - 1)) / 2;
  const maxSwaps = arraySize - 1;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Selection Sort</div>
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
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete' ? '✓ Complete' : `Pass ${currentStepData.pass}`}
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

        {/* Target Slot Marker + Labels */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 8}px` }}>
            {/* Target slot marker */}
            {currentStepData.phase !== 'complete' && currentStepData.targetIndex < arraySize && (
              <div
                className="absolute flex flex-col items-center"
                style={{
                  left: currentStepData.targetIndex * (tileSize + 8) + tileSize / 2 - 6,
                  top: -28,
                  transform: 'translateX(-50%)',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                  style={{
                    borderColor: COLORS.target.border,
                    backgroundColor: 'transparent',
                    boxShadow: `0 0 ${6 + Math.sin(pulsePhase * 0.1) * 3}px ${COLORS.target.border}60`,
                  }}
                />
                <div className="text-[9px] text-gray-500 mt-0.5">target</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Tiles Row */}
        <div className="flex items-center justify-center">
          <div className="relative flex gap-2">
            {currentStepData.array.map((val, idx) => {
              const colors = getTileColor(idx);
              const scale = getScale(idx);
              const locked = isLocked(idx);

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
                    transform: `scale(${scale})`,
                    boxShadow: scale > 1 ? `0 0 16px ${colors.border}40` : '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: scale > 1 ? 10 : 1,
                  }}
                >
                  {val}
                  {/* Lock dot */}
                  {locked && (
                    <div
                      className="absolute rounded-full transition-all duration-300"
                      style={{
                        width: '5px',
                        height: '5px',
                        backgroundColor: '#4ad880',
                        bottom: '3px',
                        right: '3px',
                        boxShadow: currentStepData.phase === 'complete'
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

        {/* Hunting Ground Line */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: `${tileSize * arraySize + (arraySize - 1) * 8}px` }}>
            {/* Hunting ground line */}
            <div
              className="h-0.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: `${COLORS.target.border}40`,
                width: `${huntingLineWidth}%`,
                marginLeft: `${(sortedCount / arraySize) * 100}%`,
              }}
            />
            {/* Scanner diamond cursor */}
            {currentStepData.phase === 'comparing' && currentStepData.scannerIndex >= sortedCount && (
              <div
                className="absolute transition-all duration-150"
                style={{
                  left: currentStepData.scannerIndex * (tileSize + 8) + tileSize / 2 - 4,
                  top: -10,
                }}
              >
                <div
                  className="w-2 h-2 rotate-45"
                  style={{ backgroundColor: COLORS.scanner.border }}
                />
              </div>
            )}
            {/* Labels */}
            <div className="flex justify-between text-xs mt-1">
              <div className="text-green-400">Sorted ({sortedCount})</div>
              <div className="text-teal-400/60">Unsorted ({unsortedCount})</div>
            </div>
          </div>
        </div>

        {/* Comparison Panel */}
        {(currentStepData.phase === 'comparing' || currentStepData.phase === 'champion-handoff' || currentStepData.phase === 'scan-complete') && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Comparison</div>
            <div className="flex items-center gap-4">
              {/* Current minimum */}
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.champion.border}`,
                  backgroundColor: COLORS.champion.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[10px] text-gray-500">Min</div>
                <div className="text-lg font-bold" style={{ color: COLORS.champion.text }}>
                  {currentStepData.currentMinValue}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">vs</div>
              {/* Scanner tile */}
              {currentStepData.phase !== 'scan-complete' && currentStepData.scannerIndex >= 0 && (
                <div
                  className="rounded-lg flex flex-col items-center justify-center"
                  style={{
                    width: '48px',
                    border: `2px solid ${COLORS.scanner.border}`,
                    backgroundColor: COLORS.scanner.bg,
                    padding: '6px',
                  }}
                >
                  <div className="text-[10px] text-gray-500">Scanning</div>
                  <div className="text-lg font-bold" style={{ color: COLORS.scanner.text }}>
                    {currentStepData.comparingValue}
                  </div>
                </div>
              )}
              {currentStepData.phase === 'scan-complete' && (
                <div
                  className="rounded-lg flex flex-col items-center justify-center"
                  style={{
                    width: '48px',
                    border: `2px solid ${currentStepData.isNoSwap ? COLORS.champion.border : COLORS.confirmed.border}`,
                    backgroundColor: currentStepData.isNoSwap ? COLORS.champion.bg : COLORS.confirmed.bg,
                    padding: '6px',
                  }}
                >
                  <div className="text-[10px] text-gray-500">
                    {currentStepData.isNoSwap ? 'No swap' : 'Min'}
                  </div>
                  <div className="text-lg font-bold" style={{ color: currentStepData.isNoSwap ? COLORS.champion.text : COLORS.confirmed.text }}>
                    {currentStepData.currentMinValue}
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.comparisonText}
            </div>
          </div>
        )}

        {/* Swap Panel */}
        {currentStepData.phase === 'swapping' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Swapping</div>
            <div className="flex items-center gap-3">
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
                <div className="text-[10px] text-gray-500">Min</div>
                <div className="text-lg font-bold" style={{ color: COLORS.swapping.text }}>
                  {currentStepData.currentMinValue}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">→</div>
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
                <div className="text-[10px] text-gray-500">Pos {currentStepData.targetIndex}</div>
                <div className="text-lg font-bold" style={{ color: COLORS.swapping.text }}>
                  {currentStepData.array[currentStepData.targetIndex]}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.currentMinValue} swaps into position {currentStepData.targetIndex}
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
              </div>
              <div className="text-sm text-gray-400 mb-4">
                {arrayType === 'nearly'
                  ? 'Selection sort checked every number the same number of times — it doesn\'t matter how sorted the array already is.'
                  : arrayType === 'reverse'
                    ? 'Even completely backwards, selection sort stays calm and scans the same way it always does.'
                    : 'Selection sort looks at a lot but moves very little — useful when moving is expensive but looking is cheap.'
                }
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Best / Average / Worst case: O(n²) — always the same comparisons regardless of input
                <br />
                Space: O(1)
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
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.champion.border, backgroundColor: COLORS.champion.bg }} />
          <span className="text-gray-500">Min found</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.scanner.border, backgroundColor: COLORS.scanner.bg }} />
          <span className="text-gray-500">Scanning</span>
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
