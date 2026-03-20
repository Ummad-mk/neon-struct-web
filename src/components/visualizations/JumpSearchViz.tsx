import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Phase = 'idle' | 'jumping' | 'jump-landed' | 'walk-back' | 'walk-check' | 'match' | 'not-found' | 'complete';
type ArrayType = 'random' | 'near-start' | 'near-end' | 'not-present' | 'max-jump';

interface JumpStep {
  array: number[];
  target: number;
  phase: Phase;
  currentIndex: number;
  jumpLanding: number;
  prevJumpLanding: number;
  jumpsMade: number;
  walkSteps: number;
  tilesChecked: number[];
  jumpsLanded: number[];
  walkZoneStart: number;
  walkZoneEnd: number;
  foundIndex: number | null;
  comparisons: number;
  caption: string;
  comparisonText: string;
  isJumpPhase: boolean;
}

const COLORS = {
  default: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  target: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  jumpLanding: { border: '#d4a040', text: '#ffffff', bg: '#1a1408' },
  jumpTooSmall: { border: '#6a5020', text: '#a08040', bg: '#141008' },
  jumpOvershoot: { border: '#6a2030', text: '#a05060', bg: '#140810' },
  walkActive: { border: '#d06080', text: '#ffffff', bg: '#1a0810' },
  walkEliminated: { border: '#4a1020', text: '#8a4050', bg: '#100508' },
  found: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  walkZone: 'rgba(32, 10, 16, 0.4)',
};

function generateSortedArray(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(i + Math.floor(Math.random() * 3) + 5);
  }
  return arr.sort((a, b) => a - b);
}

function generateNearStartArray(size: number): number[] {
  const arr = generateSortedArray(size);
  arr[0] = 50;
  return arr;
}

function generateNearEndArray(size: number): number[] {
  const arr = generateSortedArray(size);
  arr[arr.length - 1] = 100;
  return arr;
}

function generateNotPresentArray(size: number): number[] {
  const arr = generateSortedArray(size);
  return arr;
}

function generateMaxJumpArray(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 36; i++) arr.push(i + 5);
  return arr;
}

function generateSearchSteps(arr: number[], target: number, _arrayType: ArrayType): JumpStep[] {
  const steps: JumpStep[] = [];
  const array = [...arr];
  const n = array.length;
  const jumpSize = Math.ceil(Math.sqrt(n));
  let comparisons = 0;
  const tilesChecked: number[] = [];
  const jumpsLanded: number[] = [];
  let jumpsMade = 0;
  let walkSteps = 0;
  let foundIndex: number | null = null;
  let prevJumpLanding = -1;
  let walkZoneStart = -1;
  let walkZoneEnd = -1;

  const addStep = (partial: Partial<JumpStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      target,
      currentIndex: -1,
      jumpLanding: -1,
      prevJumpLanding,
      jumpsMade,
      walkSteps,
      tilesChecked: [...tilesChecked],
      jumpsLanded: [...jumpsLanded],
      walkZoneStart,
      walkZoneEnd,
      foundIndex,
      comparisons,
      caption: '',
      comparisonText: '',
      isJumpPhase: true,
      ...partial,
    } as JumpStep);
  };

  addStep({
    array: [...array],
    phase: 'idle',
    currentIndex: 0,
    jumpLanding: 0,
    prevJumpLanding: -1,
    jumpsMade: 0,
    walkSteps: 0,
    tilesChecked: [],
    jumpsLanded: [],
    walkZoneStart: -1,
    walkZoneEnd: -1,
    foundIndex: null,
    comparisons: 0,
    isJumpPhase: true,
    caption: `Jump search works on sorted arrays. It jumps forward in steps of ${jumpSize}, then walks back when it overshoots.`,
    comparisonText: `Jump size = ${jumpSize} (square root of ${n}). Watching for values >= ${target}.`,
  });

  let curr = 0;
  while (curr < n) {
    const landing = Math.min(curr, n - 1);
    comparisons++;
    jumpsMade++;
    prevJumpLanding = jumpsLanded.length > 0 ? jumpsLanded[jumpsLanded.length - 1] : -1;
    jumpsLanded.push(landing);

    addStep({
      array: [...array],
      phase: 'jumping',
      currentIndex: curr,
      jumpLanding: landing,
      prevJumpLanding: prevJumpLanding,
      jumpsMade,
      walkSteps,
      tilesChecked: [...tilesChecked],
      jumpsLanded: [...jumpsLanded],
      walkZoneStart,
      walkZoneEnd,
      foundIndex: null,
      comparisons,
      isJumpPhase: true,
      caption: `Jump ${jumpsMade} — leaping to position ${landing + 1} (${array[landing]})`,
      comparisonText: `Landing on position ${landing + 1}: ${array[landing]}. Comparing to ${target}...`,
    });

    addStep({
      array: [...array],
      phase: 'jump-landed',
      currentIndex: curr,
      jumpLanding: landing,
      prevJumpLanding,
      jumpsMade,
      walkSteps,
      tilesChecked: [...tilesChecked],
      jumpsLanded: [...jumpsLanded],
      walkZoneStart,
      walkZoneEnd,
      foundIndex: null,
      comparisons,
      isJumpPhase: true,
      caption: `Comparing ${array[landing]} to ${target}...`,
      comparisonText: `${array[landing]} ${array[landing] === target ? '==' : array[landing] < target ? '<' : '>'} ${target}`,
    });

    if (array[landing] === target) {
      foundIndex = landing;
      tilesChecked.push(landing);

      addStep({
        array: [...array],
        phase: 'match',
        currentIndex: landing,
        jumpLanding: landing,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: landing,
        comparisons,
        isJumpPhase: false,
        caption: `Found ${target} at position ${landing + 1}! Landed exactly on the jump!`,
        comparisonText: `${array[landing]} == ${target} — found it!`,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        currentIndex: landing,
        jumpLanding: landing,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: landing,
        comparisons,
        isJumpPhase: false,
        caption: `Found ${target} at position ${landing + 1}. Made ${jumpsMade} jump${jumpsMade > 1 ? 's' : ''}, 0 walk-back steps. Total: ${jumpsMade} tile${jumpsMade > 1 ? 's' : ''} checked.`,
        comparisonText: `Jump search: ${jumpsMade} tiles checked. Linear search would have checked up to ${landing + 1}.`,
      });

      return steps;
    }

    tilesChecked.push(landing);

    if (array[landing] > target) {
      walkZoneStart = prevJumpLanding >= 0 ? prevJumpLanding + 1 : 0;
      walkZoneEnd = landing;

      addStep({
        array: [...array],
        phase: 'jump-landed',
        currentIndex: curr,
        jumpLanding: landing,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: null,
        comparisons,
        isJumpPhase: false,
        caption: `${array[landing]} (${landing + 1}) > ${target} — jumped past the target! Now walking back.`,
        comparisonText: `${array[landing]} > ${target} — overshot! Starting walk-back from ${walkZoneEnd + 1} to ${walkZoneStart + 1}.`,
      });

      for (let j = landing - 1; j >= walkZoneStart; j--) {
        comparisons++;
        walkSteps++;

        addStep({
          array: [...array],
          phase: 'walk-back',
          currentIndex: j,
          jumpLanding: landing,
          prevJumpLanding,
          jumpsMade,
          walkSteps,
          tilesChecked: [...tilesChecked],
          jumpsLanded: [...jumpsLanded],
          walkZoneStart,
          walkZoneEnd,
          foundIndex: null,
          comparisons,
          isJumpPhase: false,
          caption: `Walk-back step ${walkSteps} — checking position ${j + 1}`,
          comparisonText: `Checking ${array[j]} against ${target}...`,
        });

        addStep({
          array: [...array],
          phase: 'walk-check',
          currentIndex: j,
          jumpLanding: landing,
          prevJumpLanding,
          jumpsMade,
          walkSteps,
          tilesChecked: [...tilesChecked],
          jumpsLanded: [...jumpsLanded],
          walkZoneStart,
          walkZoneEnd,
          foundIndex: null,
          comparisons,
          isJumpPhase: false,
          caption: `Comparing ${array[j]} to ${target}...`,
          comparisonText: `${array[j]} ${array[j] === target ? '==' : '!='} ${target}`,
        });

        tilesChecked.push(j);

        if (array[j] === target) {
          foundIndex = j;

          addStep({
            array: [...array],
            phase: 'match',
            currentIndex: j,
            jumpLanding: landing,
            prevJumpLanding,
            jumpsMade,
            walkSteps,
            tilesChecked: [...tilesChecked],
            jumpsLanded: [...jumpsLanded],
            walkZoneStart,
            walkZoneEnd,
            foundIndex: j,
            comparisons,
            isJumpPhase: false,
            caption: `Found ${target} during walk-back at position ${j + 1}!`,
            comparisonText: `${array[j]} == ${target} — found it in the walk-back zone!`,
          });

          addStep({
            array: [...array],
            phase: 'complete',
            currentIndex: j,
            jumpLanding: landing,
            prevJumpLanding,
            jumpsMade,
            walkSteps,
            tilesChecked: [...tilesChecked],
            jumpsLanded: [...jumpsLanded],
            walkZoneStart,
            walkZoneEnd,
            foundIndex: j,
            comparisons,
            isJumpPhase: false,
            caption: `Found ${target} at position ${j + 1}. Made ${jumpsMade} jump${jumpsMade > 1 ? 's' : ''} and ${walkSteps} walk-back step${walkSteps > 1 ? 's' : ''}. Total: ${tilesChecked.length} tiles checked.`,
            comparisonText: `Jump search checked ${tilesChecked.length} tiles. Linear search would have checked up to ${j + 1}.`,
          });

          return steps;
        }
      }

      addStep({
        array: [...array],
        phase: 'not-found',
        currentIndex: walkZoneStart,
        jumpLanding: landing,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: null,
        comparisons,
        isJumpPhase: false,
        caption: `Not found in walk-back zone (positions ${walkZoneStart + 1} to ${walkZoneEnd + 1}). ${target} is not in the array.`,
        comparisonText: `Walked back through ${walkSteps} tiles — target not found.`,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        currentIndex: walkZoneStart,
        jumpLanding: landing,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: null,
        comparisons,
        isJumpPhase: false,
        caption: `${target} is not in the array. Jump search checked ${tilesChecked.length} of ${n} tiles — faster than linear search's ${n} checks.`,
        comparisonText: `Not found — checked ${tilesChecked.length} tiles total. O(√n + √n) = O(√n) vs linear O(n).`,
      });

      return steps;
    }

    curr += jumpSize;
  }

  walkZoneStart = prevJumpLanding >= 0 ? prevJumpLanding + 1 : 0;
  walkZoneEnd = n - 1;

  addStep({
    array: [...array],
    phase: 'jump-landed',
    currentIndex: n - 1,
    jumpLanding: n - 1,
    prevJumpLanding,
    jumpsMade,
    walkSteps,
    tilesChecked: [...tilesChecked],
    jumpsLanded: [...jumpsLanded],
    walkZoneStart,
    walkZoneEnd,
    foundIndex: null,
    comparisons,
    isJumpPhase: false,
    caption: `Reached end of array. Starting final walk-back from position ${walkZoneEnd + 1}...`,
    comparisonText: `Reached end — walking back to find target.`,
  });

  for (let j = n - 1; j >= walkZoneStart; j--) {
    comparisons++;
    walkSteps++;

    addStep({
      array: [...array],
      phase: 'walk-back',
      currentIndex: j,
      jumpLanding: n - 1,
      prevJumpLanding,
      jumpsMade,
      walkSteps,
      tilesChecked: [...tilesChecked],
      jumpsLanded: [...jumpsLanded],
      walkZoneStart,
      walkZoneEnd,
      foundIndex: null,
      comparisons,
      isJumpPhase: false,
      caption: `Walk-back step ${walkSteps} — checking position ${j + 1}`,
      comparisonText: `Checking ${array[j]} against ${target}...`,
    });

    addStep({
      array: [...array],
      phase: 'walk-check',
      currentIndex: j,
      jumpLanding: n - 1,
      prevJumpLanding,
      jumpsMade,
      walkSteps,
      tilesChecked: [...tilesChecked],
      jumpsLanded: [...jumpsLanded],
      walkZoneStart,
      walkZoneEnd,
      foundIndex: null,
      comparisons,
      isJumpPhase: false,
      caption: `Comparing ${array[j]} to ${target}...`,
      comparisonText: `${array[j]} ${array[j] === target ? '==' : '!='} ${target}`,
    });

    tilesChecked.push(j);

    if (array[j] === target) {
      foundIndex = j;

      addStep({
        array: [...array],
        phase: 'match',
        currentIndex: j,
        jumpLanding: n - 1,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: j,
        comparisons,
        isJumpPhase: false,
        caption: `Found ${target} at position ${j + 1} during final walk-back!`,
        comparisonText: `${array[j]} == ${target} — found at the end!`,
      });

      addStep({
        array: [...array],
        phase: 'complete',
        currentIndex: j,
        jumpLanding: n - 1,
        prevJumpLanding,
        jumpsMade,
        walkSteps,
        tilesChecked: [...tilesChecked],
        jumpsLanded: [...jumpsLanded],
        walkZoneStart,
        walkZoneEnd,
        foundIndex: j,
        comparisons,
        isJumpPhase: false,
        caption: `Found ${target} at position ${j + 1}. Made ${jumpsMade} jumps and ${walkSteps} walk-back steps. Total: ${tilesChecked.length} tiles checked.`,
        comparisonText: `Jump search checked ${tilesChecked.length} tiles. Linear search would have checked ${j + 1}.`,
      });

      return steps;
    }
  }

  addStep({
    array: [...array],
    phase: 'not-found',
    currentIndex: walkZoneStart,
    jumpLanding: n - 1,
    prevJumpLanding,
    jumpsMade,
    walkSteps,
    tilesChecked: [...tilesChecked],
    jumpsLanded: [...jumpsLanded],
    walkZoneStart,
    walkZoneEnd,
    foundIndex: null,
    comparisons,
    isJumpPhase: false,
    caption: `${target} is not in the array. Checked all tiles.`,
    comparisonText: `Not found — walked back through ${walkSteps} tiles.`,
  });

  addStep({
    array: [...array],
    phase: 'complete',
    currentIndex: walkZoneStart,
    jumpLanding: n - 1,
    prevJumpLanding,
    jumpsMade,
    walkSteps,
    tilesChecked: [...tilesChecked],
    jumpsLanded: [...jumpsLanded],
    walkZoneStart,
    walkZoneEnd,
    foundIndex: null,
    comparisons,
    isJumpPhase: false,
    caption: `${target} is not in the array. Jump search checked ${tilesChecked.length} tiles.`,
    comparisonText: `Not found — checked ${tilesChecked.length} of ${n} tiles.`,
  });

  return steps;
}

export default function JumpSearchViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateSortedArray(16));
  const [target, setTarget] = useState<number>(() => {
    const arr = generateSortedArray(16);
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [steps, setSteps] = useState<JumpStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [_showSummary, setShowSummary] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [showMatchArc, setShowMatchArc] = useState(false);
  const [showPhaseBanner, setShowPhaseBanner] = useState(false);
  const [showJumpExplanation, setShowJumpExplanation] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const prevPhaseRef = useRef<Phase>('idle');

  const jumpSize = useMemo(() => Math.ceil(Math.sqrt(arraySize)), [arraySize]);

  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => (p + 1) % 120), 50);
    return () => clearInterval(interval);
  }, []);

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    let newTarget: number;

    switch (type) {
      case 'near-start': {
        newArr = generateNearStartArray(size);
        newTarget = newArr[0];
        break;
      }
      case 'near-end': {
        newArr = generateNearEndArray(size);
        newTarget = newArr[newArr.length - 1];
        break;
      }
      case 'not-present': {
        newArr = generateNotPresentArray(size);
        let missing = newArr[0] - 2;
        while (newArr.includes(missing)) missing--;
        newTarget = missing;
        break;
      }
      case 'max-jump': {
        newArr = generateMaxJumpArray();
        newTarget = newArr[34];
        break;
      }
      default: {
        newArr = generateSortedArray(size);
        newTarget = newArr[Math.floor(Math.random() * newArr.length)];
      }
    }

    setArray(newArr);
    setTarget(newTarget);
    setSteps(generateSearchSteps(newArr, newTarget, type));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowPhaseBanner(false);
    prevPhaseRef.current = 'idle';
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
    setShowPhaseBanner(false);
    prevPhaseRef.current = 'idle';
  }, [array, arrayType]);

  const regenerateMissingTarget = useCallback(() => {
    let missing = array[0] - 5;
    while (array.includes(missing)) missing--;
    setTarget(missing);
    setSteps(generateSearchSteps([...array], missing, arrayType));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowPhaseBanner(false);
    prevPhaseRef.current = 'idle';
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
    setShowPhaseBanner(false);
    prevPhaseRef.current = 'idle';
  }, [array, arrayType, customTargetInput]);

  const generateRandomArray = useCallback(() => {
    const newArr = generateSortedArray(arraySize);
    setArray(newArr);
    const newTarget = newArr[Math.floor(Math.random() * newArr.length)];
    setTarget(newTarget);
    setSteps(generateSearchSteps(newArr, newTarget, 'random'));
    setCurrentStep(0);
    setPlaying(false);
    setShowSummary(false);
    setShowExplanation(false);
    setShowMatchArc(false);
    setShowPhaseBanner(false);
    setArrayType('random');
    prevPhaseRef.current = 'idle';
  }, [arraySize]);

  useEffect(() => {
    generateNewArray(arraySize, arrayType);
  }, []);

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const curr = steps[currentStep];
      const next = steps[currentStep + 1];

      if (next.phase === 'match') {
        setShowMatchArc(true);
        setTimeout(() => setShowMatchArc(false), 600);
      }

      if (curr.isJumpPhase && !next.isJumpPhase) {
        setShowPhaseBanner(true);
        setTimeout(() => setShowPhaseBanner(false), 800);
      }

      prevPhaseRef.current = curr.phase;
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
    if (steps.length === 0) return null;
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

  const targetGlow = useMemo(() => {
    const intensity = 8 + Math.sin(pulsePhase * 0.05) * 4;
    return `0 0 ${intensity}px #40d8d080, 0 0 ${intensity * 2}px #40d8d040`;
  }, [pulsePhase]);

  const pointerBounce = useMemo(() => {
    return Math.sin(pulsePhase * 0.1) * 3;
  }, [pulsePhase]);

  const getTileColors = (idx: number) => {
    const step = currentStepData;
    if (!step) return COLORS.default;

    const isFound = step.foundIndex === idx;
    const isJumpLanding = step.jumpsLanded.includes(idx);
    const isWalkZone = step.walkZoneStart >= 0 && idx >= step.walkZoneStart && idx <= step.walkZoneEnd;
    const isCurrentWalk = step.phase === 'walk-back' || step.phase === 'walk-check';
    const isEliminatedDuringWalk = step.tilesChecked.includes(idx) && !isFound && isWalkZone;
    const isJumpChecked = step.tilesChecked.includes(idx) && isJumpLanding && !isFound;

    if (isFound) return COLORS.found;
    if (step.phase === 'jump-landed' && idx === step.jumpLanding) return COLORS.jumpLanding;
    if (step.phase === 'jumping' && idx === step.jumpLanding) return COLORS.jumpLanding;
    if (isCurrentWalk && idx === step.currentIndex) return COLORS.walkActive;
    if (isEliminatedDuringWalk) return COLORS.walkEliminated;
    if (isJumpChecked && !isWalkZone) return COLORS.jumpTooSmall;
    if (isWalkZone && !step.tilesChecked.includes(idx)) return { border: '#3a2030', text: '#6a4050', bg: '#0f0810' };
    if (isJumpLanding && !step.tilesChecked.includes(idx)) return COLORS.default;
    return COLORS.default;
  };

  const getExplanation = (step: JumpStep) => {
    if (step.phase === 'idle') {
      return `Jump search combines the simplicity of linear search with the speed of skipping tiles. It works only on sorted arrays — it jumps forward in fixed steps then walks back when it overshoots.`;
    }
    if (step.phase === 'jumping') {
      const landingVal = step.array[step.jumpLanding];
      return `Jump ${step.jumpsMade}: leaping to position ${step.jumpLanding + 1} (value ${landingVal}). The pointer arcs through the air, skipping ${jumpSize - 1} tiles!`;
    }
    if (step.phase === 'jump-landed') {
      const val = step.array[step.jumpLanding];
      if (val === step.target) return `Perfect! ${val} == ${step.target}. Found on a jump landing!`;
      if (val < step.target) return `${val} < ${step.target}. Too small — keep jumping right.`;
      return `${val} > ${step.target}. Too big — jumped past the target! Starting walk-back phase.`;
    }
    if (step.phase === 'walk-back' || step.phase === 'walk-check') {
      const val = step.array[step.currentIndex];
      return `Walk-back step ${step.walkSteps}: checking position ${step.currentIndex + 1}. ${val} vs ${step.target}...`;
    }
    if (step.phase === 'match') {
      return `Found ${step.target} at position ${step.foundIndex! + 1}! The search ends here. Total tiles checked: ${step.tilesChecked.length} (${step.jumpsMade} jumps + ${step.walkSteps} walk-back steps).`;
    }
    if (step.phase === 'not-found') {
      return `${step.target} is not in the array. The walk-back zone (positions ${step.walkZoneStart + 1} to ${step.walkZoneEnd + 1}) was exhausted. Jump search still checked fewer tiles than linear search would have.`;
    }
    if (step.phase === 'complete') {
      if (step.foundIndex !== null) {
        return `Found ${step.target} at position ${step.foundIndex + 1}! Made ${step.jumpsMade} jumps and ${step.walkSteps} walk-back steps. Total: ${step.tilesChecked.length} tiles checked.`;
      }
      return `${step.target} is not in the array. Jump search checked ${step.tilesChecked.length} tiles — faster than linear search's ${arraySize}.`;
    }
    return 'Searching...';
  };

  if (!currentStepData) return null;

  const totalWidth = tileSize * arraySize + (arraySize - 1) * 6;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Jump Search</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Jumps:</div>
            <div className="text-sm text-amber-400 font-bold font-mono">{currentStepData.jumpsMade}</div>
            <div className="text-xs text-gray-500">Walk:</div>
            <div className="text-sm text-rose-400 font-bold font-mono">{currentStepData.walkSteps}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Checked:</div>
              <div className="text-white font-bold font-mono">{currentStepData.tilesChecked.length}</div>
            </div>
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
              : currentStepData.isJumpPhase ? 'Phase 1: Jumping' : 'Phase 2: Walking Back'}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-6 flex flex-col gap-3 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Top row: target + jump size */}
        <div className="flex items-center justify-center gap-8">
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

          {/* Jump Size Indicator */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-500 mb-1 tracking-widest uppercase">Jump size</div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-lg flex items-center justify-center font-bold font-mono"
                style={{
                  width: 48,
                  height: 48,
                  border: '2px solid #d4a040',
                  backgroundColor: '#1a1408',
                  color: '#d4a040',
                  fontSize: 20,
                }}
              >
                {jumpSize}
              </div>
              <div className="flex gap-0.5 text-amber-500/60">
                {Array.from({ length: jumpSize }, (_, i) => (
                  <span key={i} className="text-sm">→</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowJumpExplanation(!showJumpExplanation)}
              className="text-[9px] text-gray-600 mt-1 hover:text-gray-400 flex items-center gap-0.5"
            >
              Why √n? {showJumpExplanation ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
            </button>
            {showJumpExplanation && (
              <div className="mt-1 text-[9px] text-gray-500 max-w-[200px] text-center leading-relaxed bg-gray-900/80 rounded p-2 border border-gray-800">
                Bigger jumps = fewer jumps but longer walk-backs. Smaller jumps = more jumps but shorter walk-backs. √n balances both — optimal!
              </div>
            )}
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

        {/* Phase Banner */}
        {showPhaseBanner && (
          <div className="flex justify-center">
            <div className="px-6 py-2 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold tracking-widest animate-pulse">
              PHASE 2 — WALKING BACK
            </div>
          </div>
        )}

        {/* Sorted label */}
        <div className="text-center">
          <span className="text-[10px] text-emerald-600/60 tracking-widest uppercase">Sorted array</span>
        </div>

        {/* Tile Row */}
        <div className="flex flex-col items-center gap-1">
          {/* Search Pointer */}
          <div className="relative" style={{ width: `${totalWidth}px`, height: 30 }}>
            {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && currentStepData.phase !== 'not-found' && (
              <div
                className="absolute transition-all duration-150"
                style={{
                  left: currentStepData.currentIndex * (tileSize + 6) + tileSize / 2 - 12,
                  top: pointerBounce,
                  transform: 'translateX(-50%)',
                }}
              >
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                  <path d="M12 0 L24 16 L0 16 Z" fill={currentStepData.isJumpPhase ? '#d4a040' : '#d06080'} filter={`drop-shadow(0 0 4px ${currentStepData.isJumpPhase ? '#d4a040' : '#d06080'}80)`} />
                </svg>
              </div>
            )}
          </div>

          {/* Walk Zone Background */}
          {currentStepData.walkZoneStart >= 0 && (currentStepData.phase === 'walk-back' || currentStepData.phase === 'walk-check' || currentStepData.phase === 'jump-landed') && (
            <div
              className="absolute rounded-lg pointer-events-none"
              style={{
                backgroundColor: COLORS.walkZone,
                left: 0,
                right: 0,
                height: tileSize + 6,
                top: 30,
                zIndex: 0,
              }}
            />
          )}

          {/* Jump Trail */}
          {currentStepData.jumpsLanded.length > 1 && currentStepData.phase !== 'complete' && currentStepData.phase !== 'not-found' && (
            <svg
              className="absolute pointer-events-none"
              style={{
                top: tileSize + 36,
                left: 0,
                width: totalWidth,
                height: 20,
                zIndex: 5,
              }}
            >
              {currentStepData.jumpsLanded.slice(0, -1).map((landing, i) => (
                <div key={i} className="absolute">
                  <div
                    className="absolute rounded"
                    style={{
                      left: landing * (tileSize + 6) + tileSize / 2,
                      top: 4,
                      width: (currentStepData.jumpsLanded[i + 1] - landing) * (tileSize + 6) - tileSize,
                      height: 2,
                      background: 'repeating-linear-gradient(90deg, #3a3a3a 0, #3a3a3a 4px, transparent 4px, transparent 8px)',
                      opacity: 0.5,
                    }}
                  />
                </div>
              ))}
            </svg>
          )}

          {/* Tiles */}
          <div className="flex items-center gap-[6px] relative">
            {/* Arc to found tile */}
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

            {currentStepData.array.map((val, idx) => {
              const colors = getTileColors(idx);
              const isWalkZone = currentStepData.walkZoneStart >= 0 && idx >= currentStepData.walkZoneStart && idx <= currentStepData.walkZoneEnd;
              const isJumpLanding = currentStepData.jumpsLanded.includes(idx);
              const isTooSmall = isJumpLanding && currentStepData.tilesChecked.includes(idx) && !isWalkZone && currentStepData.phase !== 'jump-landed' && currentStepData.phase !== 'jumping';
              const isOvershoot = isJumpLanding && currentStepData.phase === 'jump-landed' && currentStepData.array[idx] > currentStepData.target;

              return (
                <div
                  key={idx}
                  className="relative transition-all duration-200"
                  style={{
                    width: tileSize,
                    height: tileSize,
                    zIndex: isWalkZone ? 2 : 1,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-lg flex items-center justify-center font-mono font-bold transition-all duration-200"
                    style={{
                      border: `3px solid ${colors.border}`,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: tileSize * 0.35,
                      boxShadow: currentStepData.foundIndex === idx ? `0 0 20px ${COLORS.found.border}80, 0 0 40px ${COLORS.found.border}40` : 'none',
                      transform: currentStepData.phase === 'jump-landed' && idx === currentStepData.jumpLanding ? 'scale(1.06)' : 'scale(1)',
                    }}
                  >
                    {val}
                    {isTooSmall && currentStepData.array[idx] < currentStepData.target && (
                      <div className="absolute -top-0.5 -right-0.5 text-[8px] text-amber-500/70">→</div>
                    )}
                    {isOvershoot && (
                      <div className="absolute -top-0.5 -right-0.5 text-[8px] text-rose-400/70">←</div>
                    )}
                    {isWalkZone && currentStepData.tilesChecked.includes(idx) && currentStepData.foundIndex !== idx && (
                      <div className="absolute top-0.5 right-1 text-[8px] text-rose-400/60">✗</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jump History Trail */}
        {currentStepData.jumpsLanded.length > 0 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-800">
              <div className="text-[9px] text-gray-600 mr-2">Jumps:</div>
              {currentStepData.jumpsLanded.map((_pos, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className="w-2 h-2 rotate-45"
                    style={{
                      backgroundColor: i === currentStepData.jumpsLanded.length - 1 && !currentStepData.isJumpPhase
                        ? '#d06080'
                        : '#d4a040',
                      boxShadow: `0 0 4px ${i === currentStepData.jumpsLanded.length - 1 && !currentStepData.isJumpPhase ? '#d06080' : '#d4a040'}60`,
                    }}
                  />
                  <div className="w-4 h-px bg-gray-700" />
                </div>
              ))}
              {currentStepData.walkZoneStart >= 0 && (
                <>
                  <div className="w-4 h-px bg-gray-700" />
                  <div className="text-[9px] text-rose-400/60">walk</div>
                </>
              )}
            </div>
          </div>
        )}

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
          <div className="text-2xl font-bold" style={{ color: currentStepData.isJumpPhase ? '#d4a040' : '#d06080' }}>
            {currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null)
              ? <span className="text-green-400">=</span>
              : currentStepData.phase === 'complete' || currentStepData.phase === 'not-found'
              ? <span className="text-gray-500">≠</span>
              : currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
              ? (() => {
                  const curr = currentStepData.array[currentStepData.currentIndex];
                  if (curr === target) return <span className="text-green-400">=</span>;
                  if (curr < target) return <span className="text-amber-400">&lt;</span>;
                  return <span className="text-rose-400">&gt;</span>;
                })()
              : <span className="text-gray-600">?</span>}
          </div>
          <div
            className="rounded-lg flex items-center justify-center font-mono font-bold"
            style={{
              width: 52,
              height: 52,
              border: `3px solid ${
                currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null)
                  ? COLORS.found.border
                  : currentStepData.isJumpPhase
                  ? COLORS.jumpLanding.border
                  : COLORS.walkActive.border
              }`,
              backgroundColor: currentStepData.isJumpPhase ? COLORS.jumpLanding.bg : COLORS.walkActive.bg,
              color: currentStepData.isJumpPhase ? COLORS.jumpLanding.text : COLORS.walkActive.text,
              fontSize: 18,
              boxShadow: currentStepData.phase === 'match' ? `0 0 12px ${COLORS.found.border}60` : 'none',
            }}
          >
            {currentStepData.currentIndex >= 0 && currentStepData.currentIndex < arraySize
              ? currentStepData.array[currentStepData.currentIndex]
              : '-'}
          </div>
        </div>

        {/* Caption */}
        <div className="text-center px-8">
          <div className={`text-sm leading-relaxed ${
            currentStepData.phase === 'match' || (currentStepData.phase === 'complete' && currentStepData.foundIndex !== null) ? 'text-cyan-400'
            : currentStepData.phase === 'not-found' || (currentStepData.phase === 'complete' && !currentStepData.foundIndex) ? 'text-rose-400/80'
            : currentStepData.isJumpPhase ? 'text-amber-400/80' : 'text-rose-400/80'
          }`}>
            {currentStepData.caption}
          </div>
        </div>

        {/* Educational note */}
        <div className="text-center px-8">
          <div className="text-xs text-gray-600">
            Jump search: O(√n) — at most {jumpSize} + {jumpSize} = {jumpSize * 2} tiles checked.
            {currentStepData.tilesChecked.length > 0
              ? ` Checked ${currentStepData.tilesChecked.length} of ${arraySize} tiles (${Math.round((currentStepData.tilesChecked.length / arraySize) * 100)}%).`
              : ` Linear search would check up to ${arraySize} tiles in the worst case.`}
          </div>
          {currentStepData.phase === 'complete' && (
            <div className="text-[10px] text-gray-700 mt-1">
              Jump search is faster than linear on large sorted arrays but binary search is usually faster still.
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
            onClick={() => { setPlaying(false); setCurrentStep(0); setShowMatchArc(false); setShowPhaseBanner(false); }}
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
          {(['random', 'near-start', 'near-end', 'not-present', 'max-jump'] as ArrayType[]).map(type => (
            <button
              key={type}
              onClick={() => handlePreset(type)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                arrayType === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {type === 'random' ? 'Random'
               : type === 'near-start' ? 'Near Start'
               : type === 'near-end' ? 'Near End'
               : type === 'not-present' ? 'Not Present'
               : 'Max Jumps (36)'}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs text-gray-500">Size:</label>
            <input
              type="range"
              min={4}
              max={25}
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
    </div>
  );
}
