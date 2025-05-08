'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Pattern, defaultPatterns } from '../lib/patterns';

export default function SangreSVG() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [patterns] = useState<Pattern[]>(defaultPatterns);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/svg/sangre.svg')
      .then(response => response.text())
      .then(data => {
        setSvgContent(data);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern((prev) => (prev + 1) % patterns.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [patterns.length]);

  useEffect(() => {
    if (!svgRef.current) return;

    const pattern = patterns[currentPattern];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Get all rect elements
    const rects = svgRef.current.querySelectorAll('rect');
    
    // Create new timeline
    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true
    });

    // Add animations for each element
    rects.forEach((rect, index) => {
      tl.to(rect, {
        opacity: pattern.animation.opacity[1],
        duration: pattern.animation.duration,
        delay: index * pattern.animation.delay
      }, 0);
    });

    animationRef.current = tl;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [currentPattern, patterns]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      className="svg-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        padding: '2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1026.91 986.75"
          width="100%"
          height="100%"
          style={{
            willChange: 'transform',
            maxHeight: 'calc(100vh - 4rem)',
            maxWidth: '100%',
            height: 'auto',
            width: 'auto',
            objectFit: 'contain'
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      <button 
        className="fullscreen-btn" 
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
          cursor: 'pointer'
        }}
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isFullscreen ? (
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          ) : (
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          )}
        </svg>
      </button>
    </div>
  );
} 