import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, ArrowDownUp } from 'lucide-react';

type BarState = 'default' | 'sorted' | 'key' | 'scanning' | 'shifting' | 'insertionPoint' | 'finalPlacement' | 'sortedComplete';

interface SortStep {
  array: number[];
  keyIndex: number | null;
  keyValue: number | null;
  scanning: number | null;
  shiftingIndices: number[];
  insertionPoint: number | null;
  sortedEnd: number;
  pass: number;
  shifts: number;
}

interface BarData {
  value: number;
  state: BarState;
  offsetX: number;
  offsetY: number;
}

const COLORS = {
  default: '#2a5a58',
  sorted: '#3a7a70',
  sortedComplete: '#4a9a70',
  key: '#40d8d0',
  scanning: '#8878d0',
  shifting: '#d4a040',
  insertionPoint: '#ffffff15',
  finalPlacement: '#3a7a70',
};

const generateArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 95) + 5);
  }
  return arr;
};

const generateNearlySortedArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 95) + 5);
  }
  arr.sort((a, b) => a - b);
  const swapCount = Math.floor(size * 0.05);
  for (let i = 0; i < swapCount; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }
  return arr;
};

const generateReverseSortedArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 95) + 5);
  }
  arr.sort((a, b) => b - a);
  return arr;
};

const generateSortSteps = (arr: number[]): SortStep[] => {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;

  steps.push({
    array: [...array],
    keyIndex: null,
    keyValue: null,
    scanning: null,
    shiftingIndices: [],
    insertionPoint: null,
    sortedEnd: 0,
    pass: 0,
    shifts: 0,
  });

  let totalShifts = 0;

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    steps.push({
      array: [...array],
      keyIndex: i,
      keyValue: key,
      scanning: null,
      shiftingIndices: [],
      insertionPoint: null,
      sortedEnd: i,
      pass: i,
      shifts: totalShifts,
    });

    while (j >= 0 && array[j] > key) {
      steps.push({
        array: [...array],
        keyIndex: i,
        keyValue: key,
        scanning: j,
        shiftingIndices: [],
        insertionPoint: j,
        sortedEnd: i,
        pass: i,
        shifts: totalShifts,
      });

      array[j + 1] = array[j];
      totalShifts++;

      steps.push({
        array: [...array],
        keyIndex: i,
        keyValue: key,
        scanning: null,
        shiftingIndices: Array.from({ length: i - j }, (_, k) => j + 1 + k),
        insertionPoint: j,
        sortedEnd: i,
        pass: i,
        shifts: totalShifts,
      });

      j--;
    }

    array[j + 1] = key;

    steps.push({
      array: [...array],
      keyIndex: null,
      keyValue: null,
      scanning: null,
      shiftingIndices: [],
      insertionPoint: j + 1,
      sortedEnd: i + 1,
      pass: i,
      shifts: totalShifts,
    });
  }

  steps.push({
    array: [...array],
    keyIndex: null,
    keyValue: null,
    scanning: null,
    shiftingIndices: [],
    insertionPoint: null,
    sortedEnd: n,
    pass: n - 1,
    shifts: totalShifts,
  });

  return steps;
};

export function InsertionSortViz() {
  const [arraySize, setArraySize] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(50));
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ index: number; value: number; x: number } | null>(null);
  const [totalShifts, setTotalShifts] = useState(0);
  const [showShiftCount, setShowShiftCount] = useState(false);
  const [insertionDepth, setInsertionDepth] = useState(0);
  const [showCards, setShowCards] = useState(true);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number, type: 'random' | 'nearly' | 'reverse' = 'random') => {
    let newArr: number[];
    switch (type) {
      case 'nearly':
        newArr = generateNearlySortedArray(size);
        break;
      case 'reverse':
        newArr = generateReverseSortedArray(size);
        break;
      default:
        newArr = generateArray(size);
    }
    setArray(newArr);
    setOriginalArray(newArr);
    setSteps(generateSortSteps(newArr));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setTotalShifts(0);
    setShowShiftCount(false);
    setInsertionDepth(0);
    setShowCards(true);
  }, []);

  useEffect(() => {
    generateNewArray(arraySize);
  }, []);

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    generateNewArray(newSize);
  };

  const handleRandomize = () => {
    generateNewArray(arraySize, 'random');
  };

  const handleNearlySorted = () => {
    generateNewArray(arraySize, 'nearly');
  };

  const handleReverseSorted = () => {
    generateNewArray(arraySize, 'reverse');
  };

  const handleReset = () => {
    setArray(originalArray);
    setSteps(generateSortSteps(originalArray));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setTotalShifts(0);
    setShowShiftCount(false);
    setInsertionDepth(0);
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const currentStepData = steps[currentStep];
      const nextStepData = steps[currentStep + 1];
      
      if (currentStepData.keyIndex !== null && nextStepData?.shiftingIndices?.length > 0) {
        setTotalShifts(prev => prev + nextStepData.shiftingIndices.length);
      }
      
      if (currentStepData.keyIndex !== null && nextStepData?.insertionPoint !== null) {
        const depth = currentStepData.keyIndex - nextStepData.insertionPoint;
        setInsertionDepth(Math.max(0, depth));
      }
      
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setShowCelebration(true);
      setShowCards(false);
      setTimeout(() => {
        setShowCelebration(false);
        setShowShiftCount(true);
      }, 1000);
    }
  }, [currentStep, steps.length, completed]);

  useEffect(() => {
    if (!playing || completed) return;

    const animate = (time: number) => {
      const baseDelay = Math.max(10, 500 - speed * 9);
      
      let delay = baseDelay;
      
      const currentStepData = steps[currentStep];
      
      if (currentStepData?.shiftingIndices?.length > 0) {
        delay = baseDelay * 1.5;
      }
      
      if (time - lastTimeRef.current >= delay) {
        if (currentStep < steps.length - 1) {
          const nextStepData = steps[currentStep + 1];
          
          if (currentStepData?.keyIndex !== null && nextStepData?.shiftingIndices?.length > 0) {
            setTotalShifts(prev => prev + nextStepData.shiftingIndices.length);
          }
          
          if (currentStepData?.keyIndex !== null && nextStepData?.insertionPoint !== null) {
            const depth = currentStepData.keyIndex - nextStepData.insertionPoint;
            setInsertionDepth(Math.max(0, depth));
          }
          
          setCurrentStep(prev => prev + 1);
        } else {
          setCompleted(true);
          setPlaying(false);
          setShowCelebration(true);
          setShowCards(false);
          setTimeout(() => {
            setShowCelebration(false);
            setShowShiftCount(true);
          }, 1000);
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
  }, [playing, speed, currentStep, steps.length, completed]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      array: array,
      keyIndex: null,
      keyValue: null,
      scanning: null,
      shiftingIndices: [],
      insertionPoint: null,
      sortedEnd: 0,
      pass: 0,
      shifts: 0,
    };
  }, [currentStep, steps, array]);

  const bars = useMemo<BarData[]>(() => {
    const { array: arr, keyIndex, scanning, shiftingIndices, insertionPoint, sortedEnd } = currentStepData;
    const barWidth = 100 / arr.length;
    const gap = arr.length <= 50 ? 1 : 0.5;
    const actualWidth = barWidth - gap;

    return arr.map((value, index) => {
      let state: BarState = 'default';
      let offsetX = 0;
      let offsetY = 0;

      if (index < sortedEnd) {
        state = 'sorted';
      }

      if (keyIndex === index) {
        state = 'key';
        offsetY = -8;
      }

      if (scanning === index && keyIndex !== index) {
        state = 'scanning';
      }

      if (shiftingIndices.includes(index)) {
        state = 'shifting';
        offsetX = actualWidth;
      }

      if (insertionPoint === index && keyIndex !== index && !shiftingIndices.includes(index)) {
        state = 'insertionPoint';
      }

      return { value, state, offsetX, offsetY };
    });
  }, [currentStepData]);

  const metrics = useMemo(() => {
    let comparisons = 0;
    
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      if (steps[i]?.scanning !== null) comparisons++;
    }

    return {
      comparisons,
      shifts: totalShifts,
      currentPass: currentStepData.pass,
      totalPasses: arraySize - 1,
      insertionDepth,
    };
  }, [currentStep, currentStepData.pass, arraySize, steps, totalShifts, insertionDepth]);

  const progress = useMemo(() => {
    return (currentStepData.sortedEnd / arraySize) * 100;
  }, [currentStepData.sortedEnd, arraySize]);

  const sortedRegionEnd = currentStepData.sortedEnd;

  const barWidth = 100 / arraySize;
  const gap = arraySize <= 50 ? 1 : 0.5;
  const actualWidth = barWidth - gap;

  const isNearlySorted = useMemo(() => {
    const arr = originalArray;
    if (arr.length === 0) return false;
    let inversions = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) inversions++;
    }
    return inversions < arr.length * 0.1;
  }, [originalArray]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] p-6">
      {showCards && !playing && !completed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex gap-1 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-12 rounded bg-gradient-to-b from-white to-gray-200 border border-gray-400"
              style={{
                transform: `rotate(${(i - 2.5) * 3}deg) translateY(${i % 2 * -2}px)`,
                animation: `cardFloat 2s ease-in-out infinite ${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      <div 
        className="flex-1 flex flex-col rounded-xl bg-[#0d1420] border border-gray-800 relative overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        <div className="absolute inset-0 p-6 pb-4 flex flex-col">
          <div className="flex-1 relative">
            {[0.25, 0.5, 0.75, 1].map((ratio) => (
              <div
                key={ratio}
                className="absolute left-0 right-0 h-px"
                style={{ 
                  bottom: `${ratio * 100}%`, 
                  backgroundColor: 'rgba(255,255,255,0.03)' 
                }}
              />
            ))}
            
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700" />

            <div className="absolute inset-0 flex items-end justify-center pb-6">
              <div className="relative w-full h-full flex items-end">
                {sortedRegionEnd > 0 && (
                  <div
                    className="absolute bottom-0 h-full border-r"
                    style={{ 
                      left: `${sortedRegionEnd * barWidth}%`,
                      width: '2px',
                      borderColor: 'rgba(255,255,255,0.3)'
                    }}
                  />
                )}
                
                {bars.map((bar, index) => (
                  <div
                    key={index}
                    className="absolute bottom-0 cursor-pointer transition-colors duration-75"
                    style={{
                      left: `${index * barWidth}%`,
                      width: `${actualWidth}%`,
                      height: `${bar.value}%`,
                      backgroundColor: COLORS[bar.state],
                      borderTopLeftRadius: '2px',
                      borderTopRightRadius: '2px',
                      transform: `translate(${bar.offsetX}%, ${bar.offsetY}%)`,
                      transition: bar.state === 'shifting' ? 'transform 100ms ease-out' : 
                                  bar.state === 'key' ? 'transform 150ms ease-out' : 'none',
                      boxShadow: bar.state === 'key' ? '0 -4px 20px rgba(64, 216, 208, 0.5)' : 'none',
                      opacity: bar.state === 'sorted' ? 1 : undefined,
                      animation: bar.state === 'sorted' ? 'shimmer 3s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredBar({ index, value: bar.value, x: rect.left + rect.width / 2 });
                    }}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                ))}
              </div>
            </div>

            {hoveredBar && (
              <div 
                className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
                style={{
                  left: hoveredBar.x,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                Value: {hoveredBar.value} (Index: {hoveredBar.index})
              </div>
            )}

            {showShiftCount && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="bg-[#0d1420]/90 px-8 py-4 rounded-xl border animate-fade-in"
                  style={{ borderColor: isNearlySorted ? '#30c8c0' : '#d4a040' }}
                >
                  <div 
                    className="text-4xl font-bold text-center" 
                    style={{ color: isNearlySorted ? '#30c8c0' : '#d4a040' }}
                  >
                    {totalShifts}
                  </div>
                  <div className="text-sm text-gray-400 text-center mt-1">shifts</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div 
              className="h-1 bg-gray-800 rounded-full overflow-hidden"
            >
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  backgroundColor: completed ? '#4a9a70' : '#3a7a70'
                }}
              />
            </div>
          </div>
        </div>

        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: arraySize }).map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0"
                style={{
                  left: `${(i / arraySize) * 100}%`,
                  width: `${actualWidth}%`,
                  height: `${bars[i]?.value || 0}%`,
                  backgroundColor: '#4a9a70',
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                  animation: `insertWave 250ms ease-out forwards ${i * (1000 / arraySize)}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Comparisons</div>
          <div className="text-2xl font-bold text-white">{metrics.comparisons}</div>
          <div className="text-[10px] text-gray-600 mt-1">Best case O(n) on nearly sorted data</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Shifts</div>
          <div className="text-2xl font-bold text-[#d4a040]">{totalShifts}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Current Pass</div>
          <div className="text-2xl font-bold text-[#2a5a58]">{metrics.currentPass}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Insertion Depth</div>
          <div className="text-2xl font-bold text-[#40d8d0]">{metrics.insertionDepth}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Size</span>
            <input
              type="range"
              min="10"
              max="100"
              value={arraySize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-24 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 w-6">{arraySize}</span>
          </div>
          
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <Shuffle size={14} />
            Randomize
          </button>

          <button
            onClick={handleNearlySorted}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <ArrowDownUp size={14} />
            Nearly Sorted
          </button>

          <button
            onClick={handleReverseSorted}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <ArrowDownUp size={14} className="rotate-180" />
            Reverse
          </button>
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
            onClick={() => {
              setPlaying(!playing);
              setShowCards(false);
            }}
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 accent-cyan-500"
          />
          <span className="text-xs text-gray-400 w-10">{speed}%</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes insertWave {
          0% { transform: scaleY(1); filter: brightness(1); }
          50% { transform: scaleY(1.08); filter: brightness(1.3); }
          100% { transform: scaleY(1); filter: brightness(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
