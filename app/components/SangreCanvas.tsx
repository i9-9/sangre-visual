'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

type Pattern = {
  name: string;
  animation: {
    opacity: number[];
  };
  duration: number;
  delay: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
};

const patterns: Pattern[] = [
  {
    name: 'sequential',
    animation: {
      opacity: [1, 0.2, 1],
    },
    duration: 1,
    delay: 0.005,
  },
  {
    name: 'pulse',
    animation: {
      opacity: [1, 0.7, 1],
    },
    duration: 2,
    delay: 0.003,
  },
  {
    name: 'pulse-individual',
    animation: {
      opacity: [1, 0.3, 1],
    },
    duration: 1.5,
    delay: 0.004,
  },
  {
    name: 'wave',
    animation: {
      opacity: [1, 0.2, 1],
    },
    duration: 2.5,
    delay: 0.002,
  },
  {
    name: 'fade',
    animation: {
      opacity: [1, 0.4, 0.8, 1],
    },
    duration: 2,
    delay: 0.003,
  }
];

export default function SangreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const text = 'sgr9';
  const LETTER_SPACING = 55;
  const svgViewBox = { width: 1026.91, height: 986.75 };

  // Update window size
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch SVG and extract rectangle data
  useEffect(() => {
    fetch('/svg/sangre.svg')
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(data, 'image/svg+xml');
        const rectElements = Array.from(svgDoc.querySelectorAll('rect'));
        
        const rects = rectElements.map(rect => ({
          x: parseFloat(rect.getAttribute('x') || '0'),
          y: parseFloat(rect.getAttribute('y') || '0'),
          width: parseFloat(rect.getAttribute('width') || '0'),
          height: parseFloat(rect.getAttribute('height') || '0'),
          rx: parseFloat(rect.getAttribute('rx') || '0'),
          ry: parseFloat(rect.getAttribute('ry') || '0')
        }));
        
        setRectangles(rects);
      });
  }, []);

  // Change pattern periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern((prev) => (prev + 1) % patterns.length);
      // Force re-render when pattern changes
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Reset animation frame to ensure smooth transition
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          animationRef.current = requestAnimationFrame(() => {
            if (ctx) {
              // Clear and redraw canvas
              const width = canvasRef.current?.width || 0;
              const height = canvasRef.current?.height || 0;
              ctx.clearRect(0, 0, width, height);
            }
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Draw a rounded rectangle on canvas
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number,
    opacity: number
  ) => {
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  // Calculate opacity for a given element at current time
  const calculateOpacity = (index: number, time: number) => {
    const pattern = patterns[currentPattern];
    const cycleTime = pattern.duration * 1000;
    const delayTime = index * pattern.delay * 1000;
    
    // Use the actual timestamp instead of relying on startTimeRef
    const elapsedTime = (time + delayTime) % cycleTime;
    const progress = elapsedTime / cycleTime;
    
    const opacities = pattern.animation.opacity;
    const numSteps = opacities.length - 1;
    const stepSize = 1 / numSteps;
    
    let i = Math.floor(progress / stepSize);
    if (i >= numSteps) i = numSteps - 1;
    
    const stepProgress = (progress - (i * stepSize)) / stepSize;
    const start = opacities[i];
    const end = opacities[i + 1];
    
    return start + (end - start) * stepProgress;
  };

  // Main animation loop
  useEffect(() => {
    if (!canvasRef.current || rectangles.length === 0 || windowSize.width === 0) return;
    
    const canvas = canvasRef.current;
    // Set canvas size for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = windowSize.width * dpr;
    canvas.height = windowSize.height * dpr;
    
    // Update canvas style dimensions
    canvas.style.width = `${windowSize.width}px`;
    canvas.style.height = `${windowSize.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale for high-DPI displays
    ctx.scale(dpr, dpr);
    
    const animate = (time: number) => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, windowSize.width, windowSize.height);
      
      // Calculate scale to fit SVG viewBox
      const scale = Math.min(
        windowSize.width / svgViewBox.width,
        (windowSize.height - 80) / svgViewBox.height
      );
      
      // Center the drawing
      const offsetX = (windowSize.width - (svgViewBox.width * scale)) / 2;
      const offsetY = (windowSize.height - (svgViewBox.height * scale)) / 2;
      
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      // Draw rectangles
      ctx.fillStyle = '#2a2a2a';
      rectangles.forEach((rect, index) => {
        const opacity = calculateOpacity(index, time);
        drawRoundedRect(
          ctx,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          rect.rx, // Using rx as the corner radius
          opacity
        );
      });
      
      // Draw text
      ctx.fillStyle = '#2a2a2a';
      ctx.font = '128px "Architype", Arial, sans-serif';
      ctx.globalAlpha = 1;
      
      text.split('').forEach((char, index) => {
        ctx.fillText(char, 560 + (index * LETTER_SPACING), 445);
      });
      
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [rectangles, currentPattern, windowSize]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
      
      <button 
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1,
          backgroundColor: '#2a2a2a',
          color: '#ffffff',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.9)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isFullscreen ? (
            <path fill="white" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          ) : (
            <path fill="white" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          )}
        </svg>
      </button>
    </div>
  );
} 