import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, HelpCircle } from 'lucide-react';

type Phase = 'idle' | 'build_heap' | 'extracting' | 'complete';
type ArrayType = 'random' | 'sorted' | 'reverse';

interface SortStep {
  array: number[];
  phase: Phase;
  heapSize: number;
  heapifyNode: number;
  compareLeft: boolean;
  compareRight: boolean;
  swapIdx1: number;
  swapIdx2: number;
  sinkNode: number;
  sinkChild: number;
  extracting: boolean;
  extractValue: number;
  extractTargetIdx: number;
  moveLastToRoot: boolean;
  lastNodeIdx: number;
  sortedCount: number;
  comparisons: number;
  swaps: number;
  caption: string;
  comparisonText: string;
  syncFlashIndices: number[];
  phaseBanner: string;
}

const COLORS = {
  unsorted: { border: '#2a5a58', text: '#7abfb8', bg: '#0f1e1e' },
  heapify: { border: '#9080d0', text: '#c0b0ff', bg: '#12101e' },
  heapifyChild: { border: '#6060a0', text: '#9090c8', bg: '#0e0c18' },
  compare: { border: '#d4a040', text: '#f0d070', bg: '#1a1408' },
  compareChild: { border: '#b090f0', text: '#d0b8ff', bg: '#140e1e' },
  sinking: { border: '#e07050', text: '#ffffff', bg: '#1a0e08' },
  max: { border: '#e8c040', text: '#ffffff', bg: '#1a1408' },
  extracting: { border: '#40d8d0', text: '#ffffff', bg: '#0a1e1e' },
  sorted: { border: '#3a8a60', text: '#80c8a0', bg: '#0a1a14' },
  victory: { border: '#4ad880', text: '#ffffff', bg: '#0a1e14' },
  ghost: { border: '#1a3030', text: '#2a5050', bg: '#0a1414' },
};

function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 80) + 15);
}

function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i + 15);
}

function generateReverseArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i + 14);
}

function leftChild(i: number): number { return 2 * i + 1; }
function rightChild(i: number): number { return 2 * i + 2; }

interface TreeNode {
  value: number;
  index: number;
  level: number;
  x: number;
  y: number;
  children: number[];
}

function buildTree(heapSize: number, tileWidth: number, treeCenterX: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  const levelHeight = 70;

  for (let i = 0; i < heapSize; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const nodesInLevel = Math.pow(2, level);
    const levelStartX = treeCenterX - (tileWidth * nodesInLevel) / 2;
    const x = levelStartX + (i - (nodesInLevel - 1)) * tileWidth + tileWidth / 2;
    const y = 30 + level * levelHeight;

    nodes.push({ value: 0, index: i, level, x, y, children: [] });
  }

  for (let i = 0; i < nodes.length; i++) {
    const left = leftChild(i);
    const right = rightChild(i);
    if (left < heapSize) nodes[i].children.push(left);
    if (right < heapSize) nodes[i].children.push(right);
  }

  return nodes;
}

function generateSortSteps(arr: number[], _arrayType: ArrayType): SortStep[] {
  const steps: SortStep[] = [];
  const array = [...arr];
  const n = array.length;

  const addStep = (partial: Partial<SortStep> & { array: number[]; phase: Phase }): void => {
    steps.push({
      heapSize: n,
      heapifyNode: -1,
      compareLeft: false,
      compareRight: false,
      swapIdx1: -1,
      swapIdx2: -1,
      sinkNode: -1,
      sinkChild: -1,
      extracting: false,
      extractValue: -1,
      extractTargetIdx: -1,
      moveLastToRoot: false,
      lastNodeIdx: -1,
      sortedCount: 0,
      comparisons: 0,
      swaps: 0,
      caption: '',
      comparisonText: '',
      syncFlashIndices: [],
      phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
      ...partial,
    });
  };

  addStep({
    array: [...array],
    phase: 'idle',
    phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
    caption: `Heap sort first transforms the array into a max-heap \u2014 a binary tree where every parent is bigger than its children. Then it extracts the maximum, one by one.`,
    comparisonText: '',
  });

  let comparisons = 0;
  let swaps = 0;

  const arrSwap = (i: number, j: number) => {
    [array[i], array[j]] = [array[j], array[i]];
  };

  const heapify = (size: number, root: number) => {
    let largest = root;
    const left = leftChild(root);

    if (left < size) {
      comparisons++;
      const parentVal = array[root];
      const leftVal = array[left];

      addStep({
        array: [...array],
        phase: 'build_heap',
        heapSize: size,
        heapifyNode: root,
        compareLeft: true,
        compareRight: false,
        swapIdx1: -1,
        swapIdx2: -1,
        sinkNode: -1,
        sinkChild: -1,
        extracting: false,
        extractValue: -1,
        extractTargetIdx: -1,
        moveLastToRoot: false,
        lastNodeIdx: -1,
        sortedCount: n - size,
        comparisons,
        swaps,
        syncFlashIndices: [root, left],
        phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
        caption: `Is ${leftVal} bigger than ${parentVal}?`,
        comparisonText: `Comparing parent ${parentVal} with left child ${leftVal}`,
      });

      if (leftVal > parentVal) {
        largest = left;
        addStep({
          array: [...array],
          phase: 'build_heap',
          heapSize: size,
          heapifyNode: root,
          compareLeft: true,
          compareRight: false,
          swapIdx1: -1,
          swapIdx2: -1,
          sinkNode: root,
          sinkChild: left,
          extracting: false,
          extractValue: -1,
          extractTargetIdx: -1,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - size,
          comparisons,
          swaps,
          syncFlashIndices: [],
          phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
          caption: `Yes \u2014 ${leftVal} is the new largest. Comparing with right child...`,
          comparisonText: `${leftVal} is bigger \u2014 checking right child now`,
        });
      }
    }

    const right = rightChild(root);
    if (right < size) {
      comparisons++;
      const currLargest = array[largest];
      const rightVal = array[right];

      addStep({
        array: [...array],
        phase: 'build_heap',
        heapSize: size,
        heapifyNode: root,
        compareLeft: false,
        compareRight: true,
        swapIdx1: -1,
        swapIdx2: -1,
        sinkNode: -1,
        sinkChild: -1,
        extracting: false,
        extractValue: -1,
        extractTargetIdx: -1,
        moveLastToRoot: false,
        lastNodeIdx: -1,
        sortedCount: n - size,
        comparisons,
        swaps,
        syncFlashIndices: [largest, right],
        phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
        caption: `Is ${rightVal} bigger than ${currLargest}?`,
        comparisonText: `Comparing ${currLargest} with right child ${rightVal}`,
      });

      if (rightVal > currLargest) {
        largest = right;
        addStep({
          array: [...array],
          phase: 'build_heap',
          heapSize: size,
          heapifyNode: root,
          compareLeft: false,
          compareRight: true,
          swapIdx1: -1,
          swapIdx2: -1,
          sinkNode: root,
          sinkChild: right,
          extracting: false,
          extractValue: -1,
          extractTargetIdx: -1,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - size,
          comparisons,
          swaps,
          syncFlashIndices: [],
          phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
          caption: `Yes \u2014 ${rightVal} is the new largest. ${rightVal} needs to move up.`,
          comparisonText: `${rightVal} is bigger than ${currLargest} \u2014 sink swap needed`,
        });
      }
    }

    if (largest !== root) {
      swaps++;
      arrSwap(largest, root);

      addStep({
        array: [...array],
        phase: 'build_heap',
        heapSize: size,
        heapifyNode: largest,
        compareLeft: false,
        compareRight: false,
        swapIdx1: largest,
        swapIdx2: root,
        sinkNode: largest,
        sinkChild: -1,
        extracting: false,
        extractValue: -1,
        extractTargetIdx: -1,
        moveLastToRoot: false,
        lastNodeIdx: -1,
        sortedCount: n - size,
        comparisons,
        swaps,
        syncFlashIndices: [largest, root],
        phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
        caption: `${array[root]} moves up, ${array[largest]} moves down.`,
        comparisonText: `${array[root]} swaps with ${array[largest]}`,
      });

      heapify(size, largest);
    } else {
      addStep({
        array: [...array],
        phase: 'build_heap',
        heapSize: size,
        heapifyNode: root,
        compareLeft: false,
        compareRight: false,
        swapIdx1: -1,
        swapIdx2: -1,
        sinkNode: -1,
        sinkChild: -1,
        extracting: false,
        extractValue: -1,
        extractTargetIdx: -1,
        moveLastToRoot: false,
        lastNodeIdx: -1,
        sortedCount: n - size,
        comparisons,
        swaps,
        syncFlashIndices: [],
        phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
        caption: `${array[root]} is already bigger than its children \u2014 heap order maintained.`,
        comparisonText: `${array[root]} is in the right place`,
      });
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  addStep({
    array: [...array],
    phase: 'build_heap',
    heapSize: n,
    heapifyNode: 0,
    compareLeft: false,
    compareRight: false,
    swapIdx1: -1,
    swapIdx2: -1,
    sinkNode: -1,
    sinkChild: -1,
    extracting: false,
    extractValue: -1,
    extractTargetIdx: -1,
    moveLastToRoot: false,
    lastNodeIdx: -1,
    sortedCount: 0,
    comparisons,
    swaps,
    syncFlashIndices: [],
    phaseBanner: 'PHASE 1 \u2014 BUILDING THE HEAP',
    caption: `Heap built! ${array[0]} is at the top \u2014 the biggest number. Now extracting sorted order.`,
    comparisonText: `Heap ready \u2014 max is ${array[0]}`,
  });

  for (let size = n; size > 1; size--) {
    const maxVal = array[0];
    const sortedIdx = n - (n - size) - 1;

    addStep({
      array: [...array],
      phase: 'extracting',
      heapSize: size,
      heapifyNode: -1,
      compareLeft: false,
      compareRight: false,
      swapIdx1: -1,
      swapIdx2: -1,
      sinkNode: -1,
      sinkChild: -1,
      extracting: true,
      extractValue: maxVal,
      extractTargetIdx: sortedIdx,
      moveLastToRoot: false,
      lastNodeIdx: -1,
      sortedCount: n - size,
      comparisons,
      swaps,
      syncFlashIndices: [0],
      phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
      caption: `Taking ${maxVal} off the top \u2014 it's the biggest, so it goes to position ${sortedIdx}.`,
      comparisonText: `Extracting max ${maxVal} to position ${sortedIdx}`,
    });

    const lastIdx = size - 1;
    arrSwap(0, lastIdx);

    addStep({
      array: [...array],
      phase: 'extracting',
      heapSize: size - 1,
      heapifyNode: 0,
      compareLeft: false,
      compareRight: false,
      swapIdx1: 0,
      swapIdx2: lastIdx,
      sinkNode: 0,
      sinkChild: -1,
      extracting: false,
      extractValue: maxVal,
      extractTargetIdx: sortedIdx,
      moveLastToRoot: true,
      lastNodeIdx: 0,
      sortedCount: n - size + 1,
      comparisons,
      swaps,
      syncFlashIndices: [0, lastIdx],
      phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
      caption: `Moving ${array[0]} to the root \u2014 temporary, it will likely sink back down.`,
      comparisonText: `${array[0]} moves to root`,
    });

    const heapifyDown = (root: number, sz: number) => {
      let largest2 = root;
      const left = leftChild(root);
      const right = rightChild(root);

      if (left < sz) {
        comparisons++;
        addStep({
          array: [...array],
          phase: 'extracting',
          heapSize: sz,
          heapifyNode: root,
          compareLeft: true,
          compareRight: false,
          swapIdx1: -1,
          swapIdx2: -1,
          sinkNode: -1,
          sinkChild: -1,
          extracting: false,
          extractValue: maxVal,
          extractTargetIdx: sortedIdx,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - sz,
          comparisons,
          swaps,
          syncFlashIndices: [root, left],
          phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
          caption: `Checking if ${array[root]} belongs above its left child ${array[left]}...`,
          comparisonText: `Comparing parent ${array[root]} with left child ${array[left]}`,
        });
        if (array[left] > array[largest2]) largest2 = left;
      }

      if (right < sz) {
        comparisons++;
        addStep({
          array: [...array],
          phase: 'extracting',
          heapSize: sz,
          heapifyNode: root,
          compareLeft: false,
          compareRight: true,
          swapIdx1: -1,
          swapIdx2: -1,
          sinkNode: -1,
          sinkChild: -1,
          extracting: false,
          extractValue: maxVal,
          extractTargetIdx: sortedIdx,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - sz,
          comparisons,
          swaps,
          syncFlashIndices: [largest2, right],
          phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
          caption: `Checking right child ${array[right]}...`,
          comparisonText: `Comparing ${array[largest2]} with right child ${array[right]}`,
        });
        if (array[right] > array[largest2]) largest2 = right;
      }

      if (largest2 !== root) {
        swaps++;
        arrSwap(largest2, root);
        addStep({
          array: [...array],
          phase: 'extracting',
          heapSize: sz,
          heapifyNode: largest2,
          compareLeft: false,
          compareRight: false,
          swapIdx1: largest2,
          swapIdx2: root,
          sinkNode: largest2,
          sinkChild: -1,
          extracting: false,
          extractValue: maxVal,
          extractTargetIdx: sortedIdx,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - sz,
          comparisons,
          swaps,
          syncFlashIndices: [largest2, root],
          phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
          caption: `${array[root]} sinks down \u2014 ${array[largest2]} rises up.`,
          comparisonText: `${array[root]} swaps with ${array[largest2]} \u2014 sinking down`,
        });
        heapifyDown(largest2, sz);
      } else {
        addStep({
          array: [...array],
          phase: 'extracting',
          heapSize: sz,
          heapifyNode: root,
          compareLeft: false,
          compareRight: false,
          swapIdx1: -1,
          swapIdx2: -1,
          sinkNode: -1,
          sinkChild: -1,
          extracting: false,
          extractValue: maxVal,
          extractTargetIdx: sortedIdx,
          moveLastToRoot: false,
          lastNodeIdx: -1,
          sortedCount: n - sz,
          comparisons,
          swaps,
          syncFlashIndices: [],
          phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
          caption: `${array[root]} found its place. Heap order restored.`,
          comparisonText: `${array[root]} is in the right place \u2014 heap order maintained`,
        });
      }
    };

    heapifyDown(0, size - 1);
  }

  addStep({
    array: [...array],
    phase: 'complete',
    heapSize: 1,
    heapifyNode: -1,
    compareLeft: false,
    compareRight: false,
    swapIdx1: -1,
    swapIdx2: -1,
    sinkNode: -1,
    sinkChild: -1,
    extracting: false,
    extractValue: -1,
    extractTargetIdx: -1,
    moveLastToRoot: false,
    lastNodeIdx: -1,
    sortedCount: n,
    comparisons,
    swaps,
    syncFlashIndices: [],
    phaseBanner: 'PHASE 2 \u2014 EXTRACTING SORTED ORDER',
    caption: `Done! Every number found its place through heap operations.`,
    comparisonText: `Sorted ${n} numbers with ${comparisons} comparisons and ${swaps} swaps.`,
  });

  return steps;
}

export default function HeapSortViz() {
  const [arraySize, setArraySize] = useState(16);
  const [speed, setSpeed] = useState(50);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [array, setArray] = useState<number[]>(() => generateArray(16));
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {}, 50);
    return () => clearInterval(interval);
  }, []);

  const generateNewArray = useCallback((size: number, type: ArrayType = arrayType) => {
    let newArr: number[];
    switch (type) {
      case 'sorted': newArr = generateSortedArray(size); break;
      case 'reverse': newArr = generateReverseArray(size); break;
      default: newArr = generateArray(size);
    }
    setArray(newArr);
    setSteps(generateSortSteps(newArr, type));
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
      const delay = Math.max(10, 600 - speed * 8);
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
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [playing, speed, currentStep, steps.length]);

  const currentStepData = useMemo(() => {
    return steps[currentStep] || {
      array: array,
      phase: 'idle' as Phase,
      heapSize: arraySize,
      heapifyNode: -1,
      compareLeft: false,
      compareRight: false,
      swapIdx1: -1,
      swapIdx2: -1,
      sinkNode: -1,
      sinkChild: -1,
      extracting: false,
      extractValue: -1,
      extractTargetIdx: -1,
      moveLastToRoot: false,
      lastNodeIdx: -1,
      sortedCount: 0,
      comparisons: 0,
      swaps: 0,
      caption: 'Ready',
      comparisonText: '',
      syncFlashIndices: [],
      phaseBanner: 'PHASE 1 — BUILDING THE HEAP',
    };
  }, [currentStep, steps, array, arraySize]);

  const getTileSize = () => {
    if (arraySize <= 8) return 44;
    if (arraySize <= 12) return 36;
    if (arraySize <= 16) return 28;
    return 22;
  };

  const getFontSize = () => {
    if (arraySize <= 8) return 16;
    if (arraySize <= 12) return 13;
    if (arraySize <= 16) return 11;
    return 9;
  };

  const tileSize = getTileSize();
  const fontSize = getFontSize();
  const treeCenterX = 400;
  const treeNodes = useMemo(() => buildTree(currentStepData.heapSize, tileSize * 2, treeCenterX), [currentStepData.heapSize, tileSize, treeCenterX]);
  const sortedCount = currentStepData.sortedCount;

  const getTileColor = (idx: number) => {
    const { phase, heapSize, heapifyNode, compareLeft, compareRight, swapIdx1, swapIdx2, sinkNode, extracting, extractTargetIdx, syncFlashIndices } = currentStepData;

    if (phase === 'complete') return COLORS.victory;

    if (idx >= arraySize - currentStepData.sortedCount) return COLORS.sorted;

    if (idx >= heapSize) return COLORS.ghost;

    if (extracting && idx === 0) return COLORS.extracting;
    if (extracting && idx === extractTargetIdx) return COLORS.extracting;

    if (swapIdx1 === idx || swapIdx2 === idx) return COLORS.sinking;
    if (sinkNode === idx) return COLORS.sinking;

    if (compareLeft && leftChild(heapifyNode) === idx) return COLORS.compareChild;
    if (compareRight && rightChild(heapifyNode) === idx) return COLORS.compareChild;
    if (heapifyNode === idx) return COLORS.heapify;

    if (idx === 0 && phase === 'build_heap') return COLORS.max;

    if (syncFlashIndices.includes(idx)) {
      return { border: '#50d0c0', text: '#a0f0e8', bg: '#0a1e1c' };
    }

    return COLORS.unsorted;
  };

  const getExplanation = (step: SortStep) => {
    if (step.phase === 'idle') {
      return 'Heap sort has two phases. First, it builds a max-heap — a binary tree where every parent is bigger than its children. Then it extracts the maximum repeatedly, placing it at the end of the array. The tree above and the tiles below show the same data two ways.';
    }
    if (step.phase === 'build_heap') {
      if (step.swapIdx1 >= 0) {
        return `A swap! The larger value moves up toward the root, the smaller value moves down. This ensures every parent is bigger than its children.`;
      }
      if (step.heapifyNode >= 0) {
        return `Checking if node at index ${step.heapifyNode} is bigger than its children. If either child is larger, we swap to maintain heap order — every parent larger than its children.`;
      }
      return `Building the heap bottom-up. Starting from the last non-leaf node and working toward the root.`;
    }
    if (step.phase === 'extracting') {
      if (step.extracting) {
        return `Extracting the maximum! ${step.extractValue} is the biggest number in the heap, so it goes to position ${step.extractTargetIdx} — the right end of the sorted region.`;
      }
      if (step.moveLastToRoot) {
        return `Moving the last element to the root temporarily. This gap at the top of the heap needs to be filled before we can extract the next maximum.`;
      }
      if (step.swapIdx1 >= 0) {
        return `${step.array[step.swapIdx1]} sinks down — it's smaller than its children. The larger child rises up to take its place.`;
      }
      return `Restoring heap order after removing the maximum. The small element at the root sinks down until it finds its correct position among its children.`;
    }
    if (step.phase === 'complete') {
      return `All ${arraySize} numbers are sorted! ${step.comparisons} comparisons and ${step.swaps} swaps. Heap sort is always O(n log n) — it never has a bad day. Whether the input is random, sorted, or reversed, it takes about the same amount of work every single time.`;
    }
    return 'Heap sort transforms the array into a tree structure, then extracts the maximum repeatedly.';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14] overflow-hidden">
      {/* Header */}
      <div className="h-12 px-6 py-2 bg-[#0d1420] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-cyan-400 font-medium">Heap Sort</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Sorted:</div>
            <div className="text-sm text-green-400 font-bold">{sortedCount}</div>
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
            <div className="flex items-center gap-1.5">
              <div className="text-gray-500">Heap:</div>
              <div className="text-teal-400 font-bold font-mono">{currentStepData.heapSize}/{arraySize}</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentStepData.phase === 'complete'
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {currentStepData.phase === 'complete' ? '✓ Complete' : currentStepData.phase === 'build_heap' ? 'Building' : 'Extracting'}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative p-4 flex flex-col gap-2 overflow-hidden">
        {/* Phase Banner */}
        <div className={`text-center py-1 rounded text-sm font-bold tracking-wide transition-all duration-300 ${
          currentStepData.phase === 'build_heap'
            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
            : currentStepData.phase === 'extracting'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'
        }`}>
          {currentStepData.phaseBanner}
        </div>

        {/* Tree Area */}
        <div className="flex-1 relative" style={{ minHeight: '200px' }}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            {treeNodes.map(node => {
              const isActive = currentStepData.heapifyNode === node.index;
              const isSwap = currentStepData.swapIdx1 === node.index || currentStepData.swapIdx2 === node.index;
              const isSink = currentStepData.sinkNode === node.index;
              const isExtract = currentStepData.extracting && node.index === 0;
              const isSync = currentStepData.syncFlashIndices.includes(node.index);

              let strokeColor = '#1e3030';
              if (isActive || isSwap || isSink || isExtract || isSync) {
                strokeColor = '#40d8d0';
              }

              return node.children.map(childIdx => {
                const child = treeNodes[childIdx];
                if (!child) return null;
                return (
                  <line
                    key={`${node.index}-${childIdx}`}
                    x1={node.x}
                    y1={node.y + tileSize / 2}
                    x2={child.x}
                    y2={child.y - tileSize / 2}
                    stroke={strokeColor}
                    strokeWidth={isActive || isSwap || isSink || isExtract ? 2 : 1}
                    style={{
                      transition: 'stroke 0.3s',
                      strokeDasharray: isSync ? '4 2' : 'none',
                    }}
                  />
                );
              });
            })}
          </svg>

          {/* Tree Nodes */}
          {treeNodes.map(node => {
            const { phase, heapSize, heapifyNode, compareLeft, compareRight, swapIdx1, swapIdx2, sinkNode, extracting } = currentStepData;
            const value = currentStepData.array[node.index];

            let colors = COLORS.unsorted;
            let scale = 1;
            let glow = false;

            if (phase === 'complete') {
              colors = COLORS.victory;
            } else if (extracting && node.index === 0) {
              colors = COLORS.extracting;
              glow = true;
              scale = 1.1;
            } else if (swapIdx1 === node.index || swapIdx2 === node.index) {
              colors = COLORS.sinking;
              scale = 1.1;
              glow = true;
            } else if (sinkNode === node.index) {
              colors = COLORS.sinking;
              glow = true;
            } else if (heapifyNode === node.index) {
              colors = COLORS.heapify;
              glow = true;
            } else if (node.index === 0 && phase === 'build_heap' && heapifyNode !== 0) {
              colors = COLORS.max;
              glow = true;
            } else if (compareLeft && leftChild(heapifyNode) === node.index) {
              colors = COLORS.compareChild;
              glow = true;
            } else if (compareRight && rightChild(heapifyNode) === node.index) {
              colors = COLORS.compareChild;
              glow = true;
            } else if (node.index >= heapSize) {
              colors = COLORS.ghost;
            }

            if (currentStepData.syncFlashIndices.includes(node.index)) {
              colors = { border: '#50d0c0', text: '#a0f0e8', bg: '#0a1e1c' };
              glow = true;
            }

            return (
              <div
                key={node.index}
                className="absolute flex flex-col items-center"
                style={{
                  left: node.x - tileSize / 2,
                  top: node.y - tileSize / 2,
                  width: tileSize,
                  height: tileSize,
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center font-bold transition-all duration-200"
                  style={{
                    width: tileSize,
                    height: tileSize,
                    border: `2px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontSize: `${fontSize}px`,
                    transform: `scale(${scale})`,
                    boxShadow: glow ? `0 0 12px ${colors.border}40` : '0 2px 6px rgba(0,0,0,0.3)',
                    zIndex: glow ? 10 : 1,
                    opacity: node.index >= heapSize ? 0.3 : 1,
                  }}
                >
                  {value}
                </div>
                <div
                  className="text-[8px] font-mono mt-0.5"
                  style={{ color: '#2a4a48' }}
                >
                  [{node.index}]
                </div>
              </div>
            );
          })}
        </div>

        {/* Heap / Sorted Divider Line */}
        {currentStepData.phase === 'extracting' && currentStepData.heapSize < arraySize && (
          <div className="relative">
            <div
              className="absolute h-px bg-gray-500/30"
              style={{
                left: `${(arraySize - currentStepData.heapSize) / arraySize * 100}%`,
                right: `${(currentStepData.heapSize) / arraySize * 100}%`,
                top: 0,
              }}
            />
            <div className="flex justify-between text-[9px] text-gray-500 px-2">
              <span>Heap Region</span>
              <span>Sorted ({sortedCount})</span>
            </div>
          </div>
        )}

        {/* Array Row */}
        <div className="flex items-center justify-center">
          <div className="relative flex gap-1">
            {currentStepData.array.map((val, idx) => {
              const colors = getTileColor(idx);
              const isSorted = idx >= arraySize - sortedCount;
              const isSync = currentStepData.syncFlashIndices.includes(idx);

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
                    boxShadow: isSync || (currentStepData.swapIdx1 === idx || currentStepData.swapIdx2 === idx)
                      ? `0 0 12px ${colors.border}40`
                      : '0 2px 6px rgba(0,0,0,0.3)',
                    zIndex: isSync ? 10 : 1,
                    opacity: idx >= currentStepData.heapSize && idx < arraySize - sortedCount ? 0.3 : 1,
                  }}
                >
                  {val}
                  {/* Lock dot */}
                  {isSorted && currentStepData.phase !== 'complete' && (
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '4px',
                        height: '4px',
                        backgroundColor: '#4ad880',
                        bottom: '2px',
                        right: '2px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Panel */}
        {currentStepData.phase !== 'idle' && currentStepData.phase !== 'complete' && currentStepData.heapifyNode >= 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Comparing</div>
            <div className="flex items-center gap-4">
              {/* Left child */}
              {leftChild(currentStepData.heapifyNode) < currentStepData.heapSize && (
                <>
                  <div
                    className="rounded-lg flex flex-col items-center justify-center"
                    style={{
                      width: '44px',
                      border: `2px solid ${COLORS.compareChild.border}`,
                      backgroundColor: COLORS.compareChild.bg,
                      padding: '4px',
                    }}
                  >
                    <div className="text-[9px] text-gray-500">Left child</div>
                    <div className="text-base font-bold" style={{ color: COLORS.compareChild.text }}>
                      {currentStepData.array[leftChild(currentStepData.heapifyNode)]}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-500">vs</div>
                </>
              )}
              {/* Parent */}
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '44px',
                  border: `2px solid ${COLORS.heapify.border}`,
                  backgroundColor: COLORS.heapify.bg,
                  padding: '4px',
                  boxShadow: `0 0 10px ${COLORS.heapify.border}30`,
                }}
              >
                <div className="text-[9px] text-gray-500">Parent</div>
                <div className="text-base font-bold" style={{ color: COLORS.heapify.text }}>
                  {currentStepData.array[currentStepData.heapifyNode]}
                </div>
              </div>
              {/* Right child */}
              {rightChild(currentStepData.heapifyNode) < currentStepData.heapSize && (
                <>
                  <div className="text-xl font-bold text-gray-500">vs</div>
                  <div
                    className="rounded-lg flex flex-col items-center justify-center"
                    style={{
                      width: '44px',
                      border: `2px solid ${COLORS.compareChild.border}`,
                      backgroundColor: COLORS.compareChild.bg,
                      padding: '4px',
                    }}
                  >
                    <div className="text-[9px] text-gray-500">Right child</div>
                    <div className="text-base font-bold" style={{ color: COLORS.compareChild.text }}>
                      {currentStepData.array[rightChild(currentStepData.heapifyNode)]}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.comparisonText}
            </div>
          </div>
        )}

        {/* Extraction Panel */}
        {currentStepData.extracting && currentStepData.extractValue >= 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Extracting Max</div>
            <div className="flex items-center gap-4">
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.extracting.border}`,
                  backgroundColor: COLORS.extracting.bg,
                  padding: '6px',
                  boxShadow: `0 0 12px ${COLORS.extracting.border}40`,
                }}
              >
                <div className="text-[9px] text-gray-500">Max</div>
                <div className="text-lg font-bold" style={{ color: COLORS.extracting.text }}>
                  {currentStepData.extractValue}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500">→</div>
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: '48px',
                  border: `2px solid ${COLORS.sorted.border}`,
                  backgroundColor: COLORS.sorted.bg,
                  padding: '6px',
                }}
              >
                <div className="text-[9px] text-gray-500">Pos {currentStepData.extractTargetIdx}</div>
                <div className="text-lg font-bold" style={{ color: COLORS.sorted.text }}>
                  {currentStepData.array[currentStepData.extractTargetIdx]}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 text-center">
              {currentStepData.array[currentStepData.extractTargetIdx]} goes to position {currentStepData.extractTargetIdx}
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
                {arrayType === 'sorted'
                  ? 'Even though the numbers were already sorted, heap sort had to build the heap from scratch — it can\'t take shortcuts.'
                  : arrayType === 'reverse'
                    ? 'Reverse order happened to already be a valid heap — phase one was almost instant.'
                    : 'Heap sort never has a bad day — random, sorted, or reversed, it always takes about the same amount of work. That consistency is what makes it special.'
                }
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Best / Average / Worst case: O(n log n) — always the same performance
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
            className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full transition-all duration-300"
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

            {/* Array Type Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-500 mr-1">Array:</span>
              {(['random', 'sorted', 'reverse'] as ArrayType[]).map(type => (
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
                  {type === 'sorted' ? 'Sorted' : type === 'reverse' ? 'Reverse' : 'Random'}
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
          <span className="text-gray-500">Heap Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.heapify.border, backgroundColor: COLORS.heapify.bg }} />
          <span className="text-gray-500">Heapifying</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.max.border, backgroundColor: COLORS.max.bg }} />
          <span className="text-gray-500">Max</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.sinking.border, backgroundColor: COLORS.sinking.bg }} />
          <span className="text-gray-500">Sinking/Swap</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.extracting.border, backgroundColor: COLORS.extracting.bg }} />
          <span className="text-gray-500">Extracting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.sorted.border, backgroundColor: COLORS.sorted.bg }} />
          <span className="text-gray-500">Sorted</span>
        </div>
      </div>
    </div>
  );
}
