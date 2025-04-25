'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import React from 'react';

type FocalPoint = {
  x: number;
  y: number;
  startTime: number;
  frequency: number;
  intensity: number;
};

export default function CircleAnimation() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focalPoints, setFocalPoints] = useState<FocalPoint[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const animationRef = useRef<number | null>(null);
  const dotsRef = useRef<Array<{x: number, y: number, size: number}>>([]);
  const lastTimeRef = useRef<number>(0);

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

  // Generate halftone grid points
  useEffect(() => {
    if (windowSize.width > 0 && windowSize.height > 0) {
      const spacing = 30; // Reducido de 40 para una grilla más densa
      const dots = [];
      
      // Extender la grilla más allá de los bordes para asegurar cobertura completa
      for (let x = 0; x <= windowSize.width + spacing; x += spacing) {
        for (let y = 0; y <= windowSize.height + spacing; y += spacing) {
          // Add some variation to grid but less than before for more uniformity
          const jitter = spacing * 0.05; // Reducido de 0.1 para más uniformidad
          const jx = x + (Math.random() * jitter * 2 - jitter);
          const jy = y + (Math.random() * jitter * 2 - jitter);
          
          dots.push({
            x: jx,
            y: jy,
            size: 5 + Math.random() * 3 // Aumentado de 3-5 a 5-8 para círculos más grandes
          });
        }
      }
      
      dotsRef.current = dots;
      
      // Initial focal points - distribuidos por toda la pantalla
      createRandomFocalPoints();
    }
  }, [windowSize]);

  // Create random focal points
  const createRandomFocalPoints = useCallback(() => {
    const now = Date.now();
    const newPoints: FocalPoint[] = [];
    
    // Create 2-3 initial focal points
    const numPoints = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numPoints; i++) {
      newPoints.push({
        x: Math.random() * windowSize.width,
        y: Math.random() * windowSize.height,
        startTime: now - Math.random() * 5000, 
        frequency: 1 + Math.random() * 2, // Slower waves
        intensity: 0.5 + Math.random() * 0.5
      });
    }
    
    setFocalPoints(newPoints);
  }, [windowSize]);

  // Add new focal point occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2) { // Reduced chance to 20%
        setFocalPoints(prev => {
          // Remove oldest point if we have too many
          let points = [...prev];
          if (points.length > 4) { // Reduced maximum points
            points = points.slice(1);
          }
          
          // Add new point
          points.push({
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
            startTime: Date.now(),
            frequency: 1 + Math.random() * 2,
            intensity: 0.5 + Math.random() * 0.5
          });
          
          return points;
        });
      }
    }, 7000); // Longer interval
    
    return () => clearInterval(interval);
  }, [windowSize]);

  // Animation loop for wave patterns
  useEffect(() => {
    if (windowSize.width === 0 || windowSize.height === 0) return;
    
    const animate = (time: number) => {
      lastTimeRef.current = time;
      setCurrentTime(Date.now());
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [windowSize]);

  // Calculate dot size based on wave patterns - optimized
  const calculateDotScale = useCallback((x: number, y: number, time: number) => {
    if (focalPoints.length === 0) return 0;
    
    let totalScale = 0;
    const maxDimension = Math.min(windowSize.width, windowSize.height) * 0.7; // Aumentado de 0.6
    
    // Use for loop instead of forEach for better performance
    for (let i = 0; i < focalPoints.length; i++) {
      const point = focalPoints[i];
      const elapsed = (time - point.startTime) / 1000;
      
      // Calculate distance to focal point
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Fixed speed for better performance (no random)
      const speed = 100; // Ligeramente más rápido
      
      // Calculate phase of the wave at this distance
      const phase = elapsed * point.frequency - distance / speed;
      
      // Wave diminishes with distance - more gradual falloff
      const attenuation = Math.max(0, 1 - distance / maxDimension);
      
      // Sine wave oscillation (adjusted to start at 0)
      const waveEffect = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
      
      // Add this wave's contribution to the total
      totalScale += waveEffect * attenuation * point.intensity;
    }
    
    // Normalize and add a base scale - increased for stronger effect
    return Math.min(1, totalScale * 1.8) * 5;
  }, [focalPoints, windowSize]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Optimized render of rings
  const renderRings = () => {
    const rings: React.ReactNode[] = [];
    const maxRadius = Math.min(windowSize.width, windowSize.height) * 0.6;
    
    focalPoints.forEach((point, fpIndex) => {
      const elapsed = (currentTime - point.startTime) / 1000;
      
      // Reduced from 5 to 3 rings
      for (let i = 0; i < 3; i++) {
        const ringPhase = (elapsed * point.frequency + i / 3) % 1;
        const ringRadius = ringPhase * maxRadius;
        
        // Only show rings that have started expanding but haven't reached max
        if (ringPhase > 0 && ringPhase < 0.9) {
          rings.push(
            <motion.circle
              key={`ring-${fpIndex}-${i}`}
              cx={point.x}
              cy={point.y}
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="2,4"
            />
          );
        }
      }
    });
    
    return rings;
  };

  return (
    <motion.div 
      className="animation-container"
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
      <svg 
        width="100%" 
        height="100%" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {dotsRef.current.map((dot, index) => (
          <motion.circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            initial={{ r: dot.size, opacity: 0 }}
            animate={{
              r: dot.size + calculateDotScale(dot.x, dot.y, currentTime),
              opacity: calculateDotScale(dot.x, dot.y, currentTime) > 0.15 
                ? Math.min(1, calculateDotScale(dot.x, dot.y, currentTime) * 0.7) 
                : 0.05,
              fill: calculateDotScale(dot.x, dot.y, currentTime) > 1.2
                ? '#ffffff' 
                : '#808080'
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
        
        {/* Render focal points as subtle indicators */}
        {focalPoints.map((point, index) => (
          <motion.circle
            key={`focal-${index}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        ))}
        
        {/* Render optimized expanding rings */}
        {renderRings()}
      </svg>
      
      {/* Minimal fullscreen toggle */}
      <motion.button 
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
        whileHover={{ opacity: 0.8 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
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
          cursor: 'pointer'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isFullscreen ? (
            <path fill="white" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          ) : (
            <path fill="white" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          )}
        </svg>
      </motion.button>
    </motion.div>
  );
}
