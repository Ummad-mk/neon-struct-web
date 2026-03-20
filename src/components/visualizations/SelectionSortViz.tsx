import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, ArrowDownUp } from 'lucide-react';

type BarState = 'default' | 'scanning' | 'currentMin' | 'swapping' | 'sorted' | 'passBoundary' | 'noSwap';

interface SortStep {
  array: number[];
  scanning: number | null;
  currentMin: number | null;
  swapping: [number, number] | null;
  sortedIndices: number[];
  passBoundary: number | null;
  noSwap: boolean | null;
  pass: number;
}

interface BarData {
  value: number;
  state: BarState;
  offset: number;
}

const COLORS = {
  default: '#2a5a58',
  scanning: '#8878d0',
  currentMin: '#30c8c0',
  swapping: '#e07050',
  sorted: '#4a9a70',
  passBoundary: '#5a90c0',
  noSwap: '#c0d8d0',
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
  for (let i = 0; i < Math.floor(size * 0.1); i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }
  return arr;
};

const generateSortSteps = (arr: number[]): SortStep[] => {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sortedIndices: number[] = [];

  for (let pass = 0; pass < n - 1; pass++) {
    let minIndex = pass;

    steps.push({
      array: [...array],
      scanning: null,
      currentMin: null,
      swapping: null,
      sortedIndices: [...sortedIndices],
      passBoundary: pass,
      noSwap: null,
      pass: pass + 1,
    });

    for (let i = pass; i < n; i++) {
      steps.push({
        array: [...array],
        scanning: i,
        currentMin: minIndex,
        swapping: null,
        sortedIndices: [...sortedIndices],
        passBoundary: pass,
        noSwap: null,
        pass: pass + 1,
      });

      if (array[i] < array[minIndex]) {
        minIndex = i;
        steps.push({
          array: [...array],
          scanning: i,
          currentMin: minIndex,
          swapping: null,
          sortedIndices: [...sortedIndices],
          passBoundary: pass,
          noSwap: null,
          pass: pass + 1,
        });
      }
    }

    if (minIndex !== pass) {
      steps.push({
        array: [...array],
        scanning: null,
        currentMin: minIndex,
        swapping: [pass, minIndex],
        sortedIndices: [...sortedIndices],
        passBoundary: pass,
        noSwap: null,
        pass: pass + 1,
      });

      [array[pass], array[minIndex]] = [array[minIndex], array[pass]];
    } else {
      steps.push({
        array: [...array],
        scanning: null,
        currentMin: null,
        swapping: null,
        sortedIndices: [...sortedIndices],
        passBoundary: pass,
        noSwap: true,
        pass: pass + 1,
      });
    }

    sortedIndices.push(pass);
  }

  sortedIndices.push(n - 1);
  steps.push({
    array: [...array],
    scanning: null,
    currentMin: null,
    swapping: null,
    sortedIndices: [...sortedIndices].sort((a, b) => a - b),
    passBoundary: null,
    noSwap: null,
    pass: n - 1,
  });

  return steps;
};

export function SelectionSortViz() {
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
  const [totalSwaps, setTotalSwaps] = useState(0);
  const [showSwapCount, setShowSwapCount] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const pauseBeforeSwap = useRef(false);
  const swapExecuted = useRef(false);

  const generateNewArray = useCallback((size: number, nearlySorted = false) => {
    const newArr = nearlySorted ? generateNearlySortedArray(size) : generateArray(size);
    setArray(newArr);
    setOriginalArray(newArr);
    setSteps(generateSortSteps(newArr));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setTotalSwaps(0);
    setShowSwapCount(false);
    pauseBeforeSwap.current = false;
    swapExecuted.current = false;
  }, []);

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

  const handleNearlySorted = () => {
    generateNewArray(arraySize, true);
  };

  const handleReset = () => {
    setArray(originalArray);
    setSteps(generateSortSteps(originalArray));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
    setTotalSwaps(0);
    setShowSwapCount(false);
    pauseBeforeSwap.current = false;
    swapExecuted.current = false;
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = steps[currentStep + 1];
      if (nextStep?.swapping && !swapExecuted.current) {
        swapExecuted.current = true;
      }
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setShowSwapCount(true);
      }, 1200);
    }
  }, [currentStep, steps.length, completed]);

  useEffect(() => {
    if (!playing || completed) return;

    const animate = (time: number) => {
      const baseDelay = Math.max(10, 500 - speed * 9);
      
      const currentStepData = steps[currentStep];
      let delay = baseDelay;

      if (currentStepData?.currentMin !== null && currentStepData?.scanning !== null && !currentStepData?.swapping) {
        const nextStep = steps[currentStep + 1];
        if (nextStep?.currentMin !== currentStepData.currentMin) {
          delay = baseDelay * 0.5;
        }
      }

      if (currentStepData?.swapping && !swapExecuted.current) {
        delay = baseDelay + 200;
        pauseBeforeSwap.current = true;
      }

      if (time - lastTimeRef.current >= delay) {
        if (currentStep < steps.length - 1) {
          const nextStep = steps[currentStep + 1];
          if (nextStep?.swapping && !swapExecuted.current) {
            swapExecuted.current = true;
            setTotalSwaps(prev => prev + 1);
          }
          setCurrentStep(prev => prev + 1);
        } else {
          setCompleted(true);
          setPlaying(false);
          setShowCelebration(true);
          setTimeout(() => {
            setShowCelebration(false);
            setShowSwapCount(true);
          }, 1200);
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
      scanning: null,
      currentMin: null,
      swapping: null,
      sortedIndices: [],
      passBoundary: null,
      noSwap: null,
      pass: 0,
    };
  }, [currentStep, steps, array]);

  const currentMinValue = useMemo(() => {
    if (currentStepData.currentMin !== null) {
      return currentStepData.array[currentStepData.currentMin];
    }
    return null;
  }, [currentStepData]);

  const bars = useMemo<BarData[]>(() => {
    const { array: arr, scanning, currentMin, swapping, sortedIndices, passBoundary, noSwap } = currentStepData;
    const barWidth = 100 / arr.length;
    const gap = arr.length <= 50 ? 1 : 0.5;
    const actualWidth = barWidth - gap;

    return arr.map((value, index) => {
      let state: BarState = 'default';
      let offset = 0;

      if (sortedIndices.includes(index)) {
        state = 'sorted';
      } else if (swapping && (swapping[0] === index || swapping[1] === index)) {
        state = 'swapping';
        if (swapping[0] === index) {
          offset = actualWidth;
        } else {
          offset = -actualWidth;
        }
      } else if (noSwap && passBoundary === index) {
        state = 'noSwap';
      } else if (currentMin === index) {
        state = 'currentMin';
      } else if (scanning === index) {
        state = 'scanning';
      } else if (passBoundary === index) {
        state = 'passBoundary';
      }

      return { value, state, offset };
    });
  }, [currentStepData]);

  const metrics = useMemo(() => {
    let comparisons = 0;
    let swaps = 0;
    
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      if (steps[i]?.scanning !== null) comparisons++;
      if (steps[i]?.swapping) swaps++;
    }

    return {
      comparisons,
      swaps,
      currentPass: currentStepData.pass,
      totalPasses: arraySize - 1,
      currentMinValue,
    };
  }, [currentStep, currentStepData.pass, arraySize, steps, currentMinValue]);

  const progress = useMemo(() => {
    return (currentStepData.pass - 1) / (arraySize - 1) * 100;
  }, [currentStepData.pass, arraySize]);

  const sortedRegionEnd = useMemo(() => {
    return currentStepData.sortedIndices.length > 0 
      ? Math.max(...currentStepData.sortedIndices) + 1
      : 0;
  }, [currentStepData.sortedIndices]);

  const barWidth = 100 / arraySize;
  const gap = arraySize <= 50 ? 1 : 0.5;
  const actualWidth = barWidth - gap;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] p-6">
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
                    className="absolute bottom-0 h-full border-r border-white/10"
                    style={{ 
                      left: `${sortedRegionEnd * barWidth}%`,
                      width: '1px'
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
                      transform: bar.offset !== 0 ? `translateX(${bar.offset}%)` : 'none',
                      transition: bar.state === 'swapping' ? 'transform 150ms ease-in-out' : 'none',
                      boxShadow: bar.state === 'currentMin' ? '0 0 12px #30c8c0' : 
                                bar.state === 'passBoundary' ? '0 0 8px #5a90c0' : 'none',
                      animation: bar.state === 'passBoundary' ? 'pulse 1.5s ease-in-out infinite' : 'none',
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

            {showSwapCount && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-[#0d1420]/90 px-8 py-4 rounded-xl border border-gray-700 animate-fade-in">
                  <div className="text-4xl font-bold text-[#30c8c0] text-center">{totalSwaps}</div>
                  <div className="text-sm text-gray-400 text-center mt-1">swaps</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div 
              className="h-1 bg-gray-800 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-[#4a9a70] transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        </div>

        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: arraySize }).map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 animate-celebration"
                style={{
                  left: `${(i / arraySize) * 100}%`,
                  width: `${actualWidth}%`,
                  height: `${bars[i]?.value || 0}%`,
                  backgroundColor: '#6abf8f',
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px',
                  animationDelay: `${i * (1200 / arraySize)}ms`,
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
          <div className="text-[10px] text-gray-600 mt-1">Always O(n²) regardless of input</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Swaps</div>
          <div className="text-2xl font-bold text-[#e07050]">{totalSwaps}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Current Pass</div>
          <div className="text-2xl font-bold text-[#2a5a58]">{metrics.currentPass}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Current Min</div>
          <div className="text-2xl font-bold text-[#30c8c0]">{metrics.currentMinValue ?? '-'}</div>
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
              swapExecuted.current = false;
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
        @keyframes celebration {
          0% { transform: scaleY(1); filter: brightness(1); }
          50% { transform: scaleY(1.1); filter: brightness(1.5); }
          100% { transform: scaleY(1); filter: brightness(1); }
        }
        .animate-celebration {
          animation: celebration 300ms ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
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
