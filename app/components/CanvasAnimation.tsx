'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type FocalPoint = {
  x: number;
  y: number;
  startTime: number;
  frequency: number;
  intensity: number;
};

type Dot = {
  x: number;
  y: number;
  size: number;
};

export default function CanvasAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const dotsRef = useRef<Dot[]>([]);
  const focalPointsRef = useRef<FocalPoint[]>([]);
  
  // Update window size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);
  
  // Initialize dots grid
  useEffect(() => {
    if (windowSize.width > 0 && windowSize.height > 0) {
      initializeDots();
      initializeFocalPoints();
    }
  }, [windowSize]);
  
  const initializeDots = () => {
    const spacing = 30;
    const dots: Dot[] = [];
    
    // Extend grid beyond edges to ensure full coverage
    for (let x = 0; x <= windowSize.width + spacing; x += spacing) {
      for (let y = 0; y <= windowSize.height + spacing; y += spacing) {
        const jitter = spacing * 0.05;
        const jx = x + (Math.random() * jitter * 2 - jitter);
        const jy = y + (Math.random() * jitter * 2 - jitter);
        
        dots.push({
          x: jx,
          y: jy,
          size: 5 + Math.random() * 3
        });
      }
    }
    
    dotsRef.current = dots;
  };
  
  const initializeFocalPoints = () => {
    const now = Date.now();
    const points: FocalPoint[] = [];
    
    // Create 2-3 initial focal points
    const numPoints = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * windowSize.width,
        y: Math.random() * windowSize.height,
        startTime: now - Math.random() * 5000,
        frequency: 1 + Math.random() * 2,
        intensity: 0.5 + Math.random() * 0.5
      });
    }
    
    focalPointsRef.current = points;
  };
  
  // Add new focal point occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const points = [...focalPointsRef.current];
        
        // Remove oldest point if we have too many
        if (points.length > 4) {
          points.shift();
        }
        
        // Add new point
        points.push({
          x: Math.random() * windowSize.width,
          y: Math.random() * windowSize.height,
          startTime: Date.now(),
          frequency: 1 + Math.random() * 2,
          intensity: 0.5 + Math.random() * 0.5
        });
        
        focalPointsRef.current = points;
      }
    }, 7000);
    
    return () => clearInterval(interval);
  }, [windowSize]);
  
  // Calculate dot scale based on wave patterns
  const calculateDotScale = (x: number, y: number, time: number) => {
    const focalPoints = focalPointsRef.current;
    if (focalPoints.length === 0) return 0;
    
    let totalScale = 0;
    const maxDimension = Math.min(windowSize.width, windowSize.height) * 0.7;
    
    for (let i = 0; i < focalPoints.length; i++) {
      const point = focalPoints[i];
      const elapsed = (time - point.startTime) / 1000;
      
      // Calculate distance to focal point
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Fixed speed for better performance
      const speed = 100;
      
      // Calculate phase of the wave at this distance
      const phase = elapsed * point.frequency - distance / speed;
      
      // Wave diminishes with distance - more gradual falloff
      const attenuation = Math.max(0, 1 - distance / maxDimension);
      
      // Sine wave oscillation (adjusted to start at 0)
      const waveEffect = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
      
      // Add this wave's contribution to the total
      totalScale += waveEffect * attenuation * point.intensity;
    }
    
    // Normalize and add a base scale
    return Math.min(1, totalScale * 1.8) * 5;
  };
  
  // Main animation loop
  useEffect(() => {
    if (!canvasRef.current || windowSize.width === 0 || windowSize.height === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match window
    canvas.width = windowSize.width;
    canvas.height = windowSize.height;
    
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now();
      const dots = dotsRef.current;
      const focalPoints = focalPointsRef.current;
      
      // Draw dots
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const scale = calculateDotScale(dot.x, dot.y, currentTime);
        const radius = dot.size + scale;
        const opacity = scale > 0.15 ? Math.min(1, scale * 0.7) : 0.05;
        
        // Set color based on scale
        if (scale > 1.2) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(128, 128, 128, ${opacity})`;
        }
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw focal points and rings
      for (let i = 0; i < focalPoints.length; i++) {
        const point = focalPoints[i];
        const elapsed = (currentTime - point.startTime) / 1000;
        const maxRadius = Math.min(windowSize.width, windowSize.height) * 0.7;
        
        // Draw focal point indicator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw rings (3 per focal point)
        ctx.setLineDash([2, 4]);
        for (let j = 0; j < 3; j++) {
          const ringPhase = (elapsed * point.frequency + j / 3) % 1;
          const ringRadius = ringPhase * maxRadius;
          
          if (ringPhase > 0 && ringPhase < 0.9) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [windowSize]);
  
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
        backgroundColor: '#000000'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      
      <button 
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1,
          backgroundColor: 'transparent',
          border: 'none',
          width: '30px',
          height: '30px',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3,
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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