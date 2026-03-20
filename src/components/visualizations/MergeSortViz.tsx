import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Shuffle, Layers } from 'lucide-react';

type BarState = 'default' | 'dividing' | 'leftMerge' | 'rightMerge' | 'comparingLeft' | 'comparingRight' | 'placing' | 'merged' | 'sorted';

interface MergeStep {
  phase: 'divide' | 'merge';
  arrays: {
    data: number[];
    state: BarState;
    level: number;
    isAuxiliary?: boolean;
    comparingLeft?: number | null;
    comparingRight?: number | null;
    placingIndex?: number | null;
  }[];
  comparisons: number;
  arrayAccesses: number;
  mergesCompleted: number;
  currentLevel: number;
  maxLevel: number;
}

const COLORS = {
  default: '#2a5a58',
  dividing: '#3a6a68',
  leftMerge: '#3a7ab0',
  rightMerge: '#7a5ab0',
  comparingLeft: '#60c0f0',
  comparingRight: '#b080f0',
  placing: '#40d8d0',
  merged: '#4a9a70',
  sorted: '#5ab880',
  auxiliary: '#1a3a3a',
};

const generateArray = (size: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 90) + 10);
  }
  return arr;
};

const generateSortSteps = (arr: number[]): MergeStep[] => {
  const steps: MergeStep[] = [];
  const maxLevel = Math.ceil(Math.log2(arr.length));
  
  const initialArray = {
    data: [...arr],
    state: 'default' as BarState,
    level: 0,
  };
  
  steps.push({
    phase: 'divide',
    arrays: [initialArray],
    comparisons: 0,
    arrayAccesses: 0,
    mergesCompleted: 0,
    currentLevel: 0,
    maxLevel,
  });

  const divide = (arr: number[], level: number): number[][] => {
    if (arr.length <= 1) return [[...arr]];
    
    const mid = Math.floor(arr.length / 2);
    const left = divide(arr.slice(0, mid), level + 1);
    const right = divide(arr.slice(mid), level + 1);
    
    steps.push({
      phase: 'divide',
      arrays: [
        { data: arr, state: 'dividing', level },
        { data: arr.slice(0, mid), state: 'default', level: level + 1 },
        { data: arr.slice(mid), state: 'default', level: level + 1 },
      ],
      comparisons: steps[steps.length - 1].comparisons,
      arrayAccesses: steps[steps.length - 1].arrayAccesses,
      mergesCompleted: steps[steps.length - 1].mergesCompleted,
      currentLevel: level + 1,
      maxLevel,
    });
    
    return [...left, ...right];
  };
  
  const baseArrays = divide(arr, 0);
  
  const merge = (left: number[], right: number[], level: number, auxData: number[]): { result: number[]; aux: number[]; comparisons: number; accesses: number } => {
    let result: number[] = [];
    let aux: number[] = [...auxData];
    let i = 0, j = 0, k = 0;
    let comparisons = 0;
    let accesses = 0;
    
    const leftArr = [...left];
    const rightArr = [...right];
    
    while (i < leftArr.length && j < rightArr.length) {
      comparisons++;
      accesses += 2;
      
      const currentArrays: MergeStep['arrays'] = [
        { data: leftArr, state: 'leftMerge', level, comparingLeft: i, comparingRight: null },
        { data: rightArr, state: 'rightMerge', level, comparingLeft: null, comparingRight: j },
        { data: [...result], state: 'merged', level, isAuxiliary: true },
      ];
      
      steps.push({
        phase: 'merge',
        arrays: currentArrays,
        comparisons: steps[steps.length - 1].comparisons + comparisons,
        arrayAccesses: steps[steps.length - 1].arrayAccesses + accesses,
        mergesCompleted: 0,
        currentLevel: level,
        maxLevel,
      });
      
      if (leftArr[i] <= rightArr[j]) {
        result.push(leftArr[i]);
        aux[k++] = leftArr[i++];
      } else {
        result.push(rightArr[j]);
        aux[k++] = rightArr[j++];
      }
      
      accesses += 2;
      
      steps.push({
        phase: 'merge',
        arrays: [
          { data: leftArr, state: 'leftMerge', level, comparingLeft: i, comparingRight: null },
          { data: rightArr, state: 'rightMerge', level, comparingLeft: null, comparingRight: j },
          { data: [...result], state: 'merged', level, isAuxiliary: true },
        ],
        comparisons: steps[steps.length - 1].comparisons + comparisons,
        arrayAccesses: steps[steps.length - 1].arrayAccesses + accesses,
        mergesCompleted: 0,
        currentLevel: level,
        maxLevel,
      });
    }
    
    while (i < leftArr.length) {
      accesses++;
      result.push(leftArr[i]);
      aux[k++] = leftArr[i++];
      
      steps.push({
        phase: 'merge',
        arrays: [
          { data: leftArr, state: 'leftMerge', level, comparingLeft: i, comparingRight: null },
          { data: rightArr, state: 'rightMerge', level, comparingLeft: null, comparingRight: j },
          { data: [...result], state: 'merged', level, isAuxiliary: true },
        ],
        comparisons: steps[steps.length - 1].comparisons + comparisons,
        arrayAccesses: steps[steps.length - 1].arrayAccesses + accesses,
        mergesCompleted: 0,
        currentLevel: level,
        maxLevel,
      });
    }
    
    while (j < rightArr.length) {
      accesses++;
      result.push(rightArr[j]);
      aux[k++] = rightArr[j++];
      
      steps.push({
        phase: 'merge',
        arrays: [
          { data: leftArr, state: 'leftMerge', level, comparingLeft: i, comparingRight: null },
          { data: rightArr, state: 'rightMerge', level, comparingLeft: null, comparingRight: j },
          { data: [...result], state: 'merged', level, isAuxiliary: true },
        ],
        comparisons: steps[steps.length - 1].comparisons + comparisons,
        arrayAccesses: steps[steps.length - 1].arrayAccesses + accesses,
        mergesCompleted: 0,
        currentLevel: level,
        maxLevel,
      });
    }
    
    return { result, aux, comparisons, accesses };
  };
  
  let currentLevelArrays = baseArrays;
  let auxiliarySpace = new Array(arr.length).fill(0);
  
  for (let level = maxLevel - 1; level >= 0; level--) {
    const nextLevelArrays: number[][] = [];
    
    for (let i = 0; i < currentLevelArrays.length; i += 2) {
      if (i + 1 < currentLevelArrays.length) {
        const { result, aux, comparisons: comps, accesses: accs } = merge(
          currentLevelArrays[i],
          currentLevelArrays[i + 1],
          level,
          auxiliarySpace
        );
        
        auxiliarySpace = aux;
        
        steps.push({
          phase: 'merge',
          arrays: [
            { data: result, state: 'sorted', level },
          ],
          comparisons: steps[steps.length - 1].comparisons + comps,
          arrayAccesses: steps[steps.length - 1].arrayAccesses + accs,
          mergesCompleted: Math.floor(i / 2) + 1,
          currentLevel: level,
          maxLevel,
        });
        
        nextLevelArrays.push(result);
      } else {
        nextLevelArrays.push(currentLevelArrays[i]);
      }
    }
    
    currentLevelArrays = nextLevelArrays;
  }
  
  steps.push({
    phase: 'merge',
    arrays: [
      { data: currentLevelArrays[0], state: 'sorted', level: 0 },
    ],
    comparisons: steps[steps.length - 1].comparisons,
    arrayAccesses: steps[steps.length - 1].arrayAccesses,
    mergesCompleted: arr.length - 1,
    currentLevel: 0,
    maxLevel,
  });
  
  return steps;
};

export function MergeSortViz() {
  const [arraySize, setArraySize] = useState(32);
  const [speed, setSpeed] = useState(50);
  const [array, setArray] = useState<number[]>(() => generateArray(32));
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<MergeStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAuxiliary, setShowAuxiliary] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<{ value: number; x: number; y: number } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

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
    setShowSummary(false);
    setSummaryText('');
  }, []);

  useEffect(() => {
    generateNewArray(arraySize);
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
    setShowSummary(false);
    setSummaryText('');
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!completed) {
      setCompleted(true);
      setShowCelebration(true);
      const bubbleComparisons = Math.floor((arraySize * (arraySize - 1)) / 2);
      const mergeComparisons = steps[steps.length - 1]?.comparisons || 0;
      setSummaryText(`${mergeComparisons} comparisons vs ~${bubbleComparisons} for bubble sort`);
      setTimeout(() => {
        setShowCelebration(false);
        setShowSummary(true);
      }, 1500);
    }
  }, [currentStep, steps.length, completed, arraySize]);

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
          const bubbleComparisons = Math.floor((arraySize * (arraySize - 1)) / 2);
          const mergeComparisons = steps[steps.length - 1]?.comparisons || 0;
          setSummaryText(`${mergeComparisons} comparisons vs ~${bubbleComparisons} for bubble sort`);
          setTimeout(() => {
            setShowCelebration(false);
            setShowSummary(true);
          }, 1500);
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
  }, [playing, speed, currentStep, steps.length, completed, arraySize]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      phase: 'divide',
      arrays: [{ data: array, state: 'default', level: 0 }],
      comparisons: 0,
      arrayAccesses: 0,
      mergesCompleted: 0,
      currentLevel: 0,
      maxLevel: 1,
    };
  }, [currentStep, steps, array]);

  const metrics = useMemo(() => {
    return {
      comparisons: currentStepData.comparisons,
      arrayAccesses: currentStepData.arrayAccesses,
      mergesCompleted: currentStepData.mergesCompleted,
      currentLevel: currentStepData.currentLevel,
      recursionDepth: currentStepData.maxLevel,
    };
  }, [currentStepData]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] p-4">
      <div className="flex-1 flex gap-4">
        {/* Main Visualization Area */}
        <div className="flex-1 flex flex-col">
          {/* Phase Indicator */}
          <div className="flex items-center justify-center mb-2">
            <div className={`px-4 py-1 rounded-full text-xs font-semibold ${
              currentStepData.phase === 'divide' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            }`}>
              {currentStepData.phase === 'divide' ? 'DIVIDE PHASE' : 'MERGE PHASE'}
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 rounded-xl bg-[#0d1420] border border-gray-800 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              {currentStepData.phase === 'divide' ? (
                /* Divide Phase - Tree Structure */
                <div className="flex flex-col items-center gap-2">
                  {currentStepData.arrays.map((arr, idx) => (
                    <div key={idx} className="flex items-end gap-0.5" style={{ marginLeft: `${idx * 20}px` }}>
                      {arr.data.map((val, i) => (
                        <div
                          key={i}
                          className="rounded-t transition-all duration-200"
                          style={{
                            width: `${Math.max(4, 200 / arr.data.length - 1)}px`,
                            height: `${val}%`,
                            backgroundColor: arr.state === 'dividing' ? COLORS.dividing : COLORS.default,
                            minHeight: '4px',
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({ value: val, x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                /* Merge Phase */
                <div className="flex flex-col items-center gap-4 w-full overflow-y-auto">
                  {currentStepData.arrays.map((arr, arrIdx) => {
                    const getLabel = () => {
                      if (arr.state === 'leftMerge') return '← Left Subarray';
                      if (arr.state === 'rightMerge') return 'Right Subarray →';
                      if (arr.state === 'merged' || arr.state === 'sorted') return '✓ Merged Result';
                      return '';
                    };
                    
                    return (
                      <div key={arrIdx} className="flex flex-col items-center">
                        {getLabel() && (
                          <div className={`text-xs mb-1 ${arr.state === 'leftMerge' ? 'text-blue-400' : arr.state === 'rightMerge' ? 'text-purple-400' : 'text-green-400'}`}>
                            {getLabel()}
                          </div>
                        )}
                        <div className="flex items-end gap-0.5">
                          {arr.data.map((val, i) => {
                            const isComparingLeft = arr.comparingLeft === i && arr.state === 'leftMerge';
                            const isComparingRight = arr.comparingRight === i && arr.state === 'rightMerge';
                            const color = arr.state === 'leftMerge' 
                              ? (isComparingLeft ? COLORS.comparingLeft : COLORS.leftMerge)
                              : arr.state === 'rightMerge'
                              ? (isComparingRight ? COLORS.comparingRight : COLORS.rightMerge)
                              : arr.state === 'merged' || arr.state === 'sorted'
                              ? COLORS.merged
                              : COLORS.default;
                            
                            return (
                              <div
                                key={i}
                                className="rounded-t transition-all duration-200 relative"
                                style={{
                                  width: `${Math.max(6, 400 / arr.data.length - 1)}px`,
                                  height: arr.isAuxiliary && !showAuxiliary 
                                    ? `${val * 0.4}%` 
                                    : `${val}%`,
                                  backgroundColor: color,
                                  minHeight: arr.isAuxiliary && !showAuxiliary ? '3px' : '4px',
                                  boxShadow: isComparingLeft || isComparingRight ? `0 0 10px ${color}` : 'none',
                                  transform: isComparingLeft || isComparingRight ? 'translateY(-4px)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredBar({ value: val, x: rect.left + rect.width / 2, y: rect.top });
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                              />
                            );
                          })}
                        </div>
                        {arr.isAuxiliary && showAuxiliary && (
                          <div className="text-xs text-gray-600 mt-1">Auxiliary Space</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hover Tooltip */}
            {hoveredBar && (
              <div 
                className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
                style={{
                  left: hoveredBar.x,
                  top: hoveredBar.y - 30,
                  transform: 'translateX(-50%)',
                }}
              >
                Value: {hoveredBar.value}
              </div>
            )}

            {/* Summary Popup */}
            {showSummary && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-[#0d1420] border border-purple-500/50 rounded-xl px-8 py-6 text-center animate-scale-in">
                  <div className="text-3xl font-bold text-white mb-2">{arraySize} elements sorted!</div>
                  <div className="text-lg text-purple-400">{summaryText}</div>
                  <div className="text-sm text-gray-500 mt-2">O(n log n) guaranteed — best, average, and worst case</div>
                </div>
              </div>
            )}

            {/* Celebration Animation */}
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-4xl font-bold text-green-400 animate-ping">
                  Sorted!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recursion Tree Sidebar */}
        <div className="w-48 rounded-xl bg-[#0d1420] border border-gray-800 p-2 overflow-hidden">
          <div className="text-xs text-gray-500 text-center mb-2">Recursion Tree</div>
          <div className="flex flex-col items-center gap-1">
            {Array.from({ length: currentStepData.maxLevel + 1 }).map((_, level) => (
              <div key={level} className="flex items-center gap-1">
                {Array.from({ length: Math.pow(2, level) }).map((_, node) => {
                  const isActive = currentStepData.currentLevel === level;
                  const isComplete = currentStepData.phase === 'merge' && level > currentStepData.currentLevel;
                  const isPending = level > currentStepData.currentLevel;
                  
                  return (
                    <div
                      key={node}
                      className={`w-2 h-2 rounded-sm transition-all ${
                        isActive ? 'bg-cyan-400 animate-pulse' :
                        isComplete ? 'bg-green-500' :
                        isPending ? 'bg-gray-600' :
                        'bg-gray-700'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-5 gap-4">
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Comparisons</div>
          <div className="text-2xl font-bold text-white">{metrics.comparisons}</div>
          <div className="text-[10px] text-gray-600 mt-1">O(n log n) guaranteed</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Array Accesses</div>
          <div className="text-2xl font-bold text-[#3a7ab0]">{metrics.arrayAccesses}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Merges</div>
          <div className="text-2xl font-bold text-[#2a5a58]">{metrics.mergesCompleted}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Current Level</div>
          <div className="text-2xl font-bold text-[#7a5ab0]">{metrics.currentLevel}</div>
        </div>
        <div className="bg-[#0d1420] rounded-lg p-3 border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500 mb-1">Recursion Depth</div>
          <div className="text-2xl font-bold text-gray-400">{metrics.recursionDepth}</div>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Size</span>
            <input
              type="range"
              min="8"
              max="64"
              step="8"
              value={arraySize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-24 accent-cyan-500"
            />
            <span className="text-xs text-gray-400 w-8">{arraySize}</span>
          </div>
          
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
          >
            <Shuffle size={14} />
            Randomize
          </button>

          <button
            onClick={() => setShowAuxiliary(!showAuxiliary)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showAuxiliary ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <Layers size={14} />
            Aux Space
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
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
