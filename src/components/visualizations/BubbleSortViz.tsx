import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle } from 'lucide-react';

type BarState = 'default' | 'comparing' | 'swapping' | 'sorted' | 'minOfPass';

interface SortStep {
  array: number[];
  comparing: [number, number] | null;
  swapping: [number, number] | null;
  sortedIndices: number[];
  minOfPass: number | null;
  pass: number;
}

interface BarData {
  value: number;
  state: BarState;
  offset: number;
}

const COLORS = {
  default: '#2a5a58',
  comparing: '#f0c060',
  swapping: '#e07050',
  sorted: '#4a9a70',
  minOfPass: '#4a80b0',
};

const generateArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 95) + 5);
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

    for (let i = 0; i < n - pass - 1; i++) {
      steps.push({
        array: [...array],
        comparing: [i, i + 1],
        swapping: null,
        sortedIndices: [...sortedIndices],
        minOfPass: minIndex,
        pass: pass + 1,
      });

      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        minIndex = i + 1;

        steps.push({
          array: [...array],
          comparing: null,
          swapping: [i, i + 1],
          sortedIndices: [...sortedIndices],
          minOfPass: minIndex,
          pass: pass + 1,
        });
      }
    }

    sortedIndices.push(n - pass - 1);
  }

  sortedIndices.push(0);
  steps.push({
    array: [...array],
    comparing: null,
    swapping: null,
    sortedIndices: [...sortedIndices].sort((a, b) => a - b),
    minOfPass: null,
    pass: n - 1,
  });

  return steps;
};

export function BubbleSortViz() {
  const [arraySize, setArraySize] = useState(40);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(40));
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ index: number; value: number; x: number } | null>(null);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateNewArray = useCallback((size: number) => {
    const newArr = generateArray(size);
    setArray(newArr);
    setOriginalArray(newArr);
    setSteps(generateSortSteps(newArr));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
  }, [arraySize]);

  useEffect(() => {
    generateNewArray(arraySize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    generateNewArray(newSize);
  };

  const handleRandomize = () => {
    generateNewArray(arraySize);
  };

  const handleReset = () => {
    setArray(originalArray);
    setSteps(generateSortSteps(originalArray));
    setCurrentStep(0);
    setPlaying(false);
    setCompleted(false);
    setShowCelebration(false);
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 800);
    }
  }, [currentStep, steps.length, completed]);

  useEffect(() => {
    if (!playing || completed) return;

    const animate = (time: number) => {
      const delay = Math.max(10, 500 - speed * 9);
      
      if (time - lastTimeRef.current >= delay) {
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setCompleted(true);
          setPlaying(false);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 800);
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
      comparing: null,
      swapping: null,
      sortedIndices: [],
      minOfPass: null,
      pass: 0,
    };
  }, [currentStep, steps, array]);

  const bars = useMemo<BarData[]>(() => {
    const { array: arr, comparing, swapping, sortedIndices, minOfPass } = currentStepData;
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
      } else if (comparing && (comparing[0] === index || comparing[1] === index)) {
        state = 'comparing';
      } else if (minOfPass === index) {
        state = 'minOfPass';
      }

      return { value, state, offset };
    });
  }, [currentStepData]);

  const metrics = useMemo(() => {
    const actualComparisons = Math.min(currentStep, (arraySize - 1) * arraySize / 2);
    
    let swaps = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      if (steps[i]?.swapping) swaps++;
    }

    return {
      comparisons: Math.floor(actualComparisons),
      swaps,
      currentPass: currentStepData.pass,
      totalPasses: arraySize - 1,
    };
  }, [currentStep, currentStepData.pass, arraySize, steps]);

  const progress = useMemo(() => {
    return (currentStepData.pass - 1) / (arraySize - 1) * 100;
  }, [currentStepData.pass, arraySize]);

  const sortedRegionIndex = useMemo(() => {
    return currentStepData.sortedIndices.length > 0 
      ? Math.min(...currentStepData.sortedIndices) 
      : arraySize;
  }, [currentStepData.sortedIndices, arraySize]);

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
                {sortedRegionIndex < arraySize && (
                  <div
                    className="absolute bottom-0 h-full border-l border-white/10"
                    style={{ 
                      left: `${sortedRegionIndex * barWidth}%`,
                      width: `${(arraySize - sortedRegionIndex) * barWidth}%`
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
                  animationDelay: `${i * (800 / arraySize)}ms`,
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
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Swaps</div>
          <div className="text-2xl font-bold text-[#e07050]">{metrics.swaps}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Current Pass</div>
          <div className="text-2xl font-bold text-[#2a5a58]">{metrics.currentPass}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Array Size</div>
          <div className="text-2xl font-bold text-gray-500">{arraySize}</div>
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
          animation: celebration 200ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
