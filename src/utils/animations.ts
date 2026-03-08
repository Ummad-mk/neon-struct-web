import { ANIMATION_TIMINGS } from './colors';

export const animateNode = (element: HTMLElement, animation: string) => {
  element.style.animation = animation;
  setTimeout(() => {
    element.style.animation = '';
  }, ANIMATION_TIMINGS.insert);
};

export const ANIMATIONS = {
  insert: 'insert-animation 0.6s ease-in-out',
  delete: 'delete-animation 0.6s ease-in-out',
  search: 'search-animation 0.4s ease-in-out',
  found: 'found-animation 0.6s ease-in-out',
  visiting: 'visiting-animation 0.4s ease-in-out',
  visitedTrail: 'visited-trail 0.3s ease-out',
  pulse: 'pulse-animation 0.3s ease-in-out infinite',
  glow: 'glow-animation 0.5s ease-in-out',
};

// Sequential animation helper for search operations
export const animateSequentialSearch = async (
  nodes: number[],
  targetValue: number,
  onVisit: (index: number) => void,
  onFound: (index: number) => void,
  onComplete: () => void,
  searchDelay: number = ANIMATION_TIMINGS.search
): Promise<void> => {
  for (let i = 0; i < nodes.length; i++) {
    // Visit current node
    onVisit(i);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, searchDelay));
    
    // Check if found
    if (nodes[i] === targetValue) {
      onFound(i);
      
      // Keep found state for 5 seconds
      await new Promise(resolve => setTimeout(resolve, ANIMATION_TIMINGS.found));
      onComplete();
      return;
    }
  }
  
  // Not found
  onComplete();
};

// Helper to create staggered animations
export const createStaggeredAnimation = (
  count: number,
  baseDelay: number,
  callback: (index: number) => void
) => {
  for (let i = 0; i < count; i++) {
    setTimeout(() => callback(i), i * baseDelay);
  }
};

// Pulse animation controller
export class PulseAnimationController {
  private pulseValue: number = 0;
  private animationFrame: number | null = null;
  private startTime: number = 0;
  
  start(onUpdate: (pulseValue: number) => void) {
    const animate = (timestamp: number) => {
      if (!this.startTime) this.startTime = timestamp;
      const progress = timestamp - this.startTime;
      
      // Sine wave for smooth pulse (0 to 1)
      this.pulseValue = Math.sin(progress / ANIMATION_TIMINGS.pulse) * 0.5 + 0.5;
      onUpdate(this.pulseValue);
      
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  stop() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

// CSS keyframes (add these to your global CSS)
export const CSS_KEYFRAMES = `
@keyframes insert-animation {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes delete-animation {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

@keyframes search-animation {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes found-animation {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 20px 10px rgba(16, 185, 129, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 30px 15px rgba(16, 185, 129, 0);
  }
}

@keyframes visiting-animation {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes visited-trail {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse-animation {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes glow-animation {
  0%, 100% {
    filter: drop-shadow(0 0 5px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 20px currentColor);
  }
}
`;