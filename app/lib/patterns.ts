export type AnimationParams = {
  opacity: number[];
  scale?: number[];
  rotate?: number[];
  x?: number[];
  y?: number[];
  duration: number;
  delay: number;
  ease?: string;
};

export type Pattern = {
  name: string;
  description: string;
  animation: AnimationParams;
};

export const defaultPatterns: Pattern[] = [
  {
    name: 'sequential',
    description: 'Fade in/out sequentially',
    animation: {
      opacity: [1, 0.2],
      scale: [1, 0.8],
      duration: 0.8,
      delay: 0.002,
      ease: "sine.inOut"
    }
  },
  {
    name: 'pulse',
    description: 'Pulse all elements together',
    animation: {
      opacity: [1, 0.4],
      scale: [1, 1.2],
      duration: 1,
      delay: 0.001,
      ease: "sine.inOut"
    }
  },
  {
    name: 'wave',
    description: 'Wave effect from left to right',
    animation: {
      opacity: [1, 0.2],
      scale: [1, 0.9],
      x: [0, 10],
      duration: 1.2,
      delay: 0.001,
      ease: "sine.inOut"
    }
  },
  {
    name: 'spiral',
    description: 'Spiral rotation effect',
    animation: {
      opacity: [1, 0.3],
      rotate: [0, 360],
      scale: [1, 0.7],
      duration: 2,
      delay: 0.002,
      ease: "sine.inOut"
    }
  },
  {
    name: 'bounce',
    description: 'Bounce effect',
    animation: {
      opacity: [1, 0.5],
      y: [0, -20],
      scale: [1, 1.1],
      duration: 0.8,
      delay: 0.001,
      ease: "bounce.out"
    }
  },
  {
    name: 'random',
    description: 'Random movement',
    animation: {
      opacity: [1, 0.4],
      x: [0, 15],
      y: [0, 15],
      rotate: [0, 45],
      duration: 1.5,
      delay: 0.003,
      ease: "sine.inOut"
    }
  }
]; 