'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

type Pattern = {
  name: string;
  animation: {
    opacity: number[];
    scale?: number[];
    rotate?: number[];
  };
  duration: number;
  delay: number;
};

const patterns: Pattern[] = [
  {
    name: 'sequential',
    animation: {
      opacity: [1, 0.2, 1],
      scale: [1, 1.1, 1],
    },
    duration: 1,
    delay: 0.005,
  },
  {
    name: 'pulse',
    animation: {
      scale: [1, 1.2, 0.9, 1],
      rotate: [0, 15, -15, 0],
      opacity: [1, 0.7, 1],
    },
    duration: 2,
    delay: 0.003,
  },
  {
    name: 'pulse-individual',
    animation: {
      scale: [1, 1.3, 1],
      opacity: [1, 0.3, 1],
    },
    duration: 1.5,
    delay: 0.004,
  },
  {
    name: 'wave',
    animation: {
      opacity: [1, 0.2, 1],
      rotate: [0, 5, 0],
    },
    duration: 2.5,
    delay: 0.002,
  },
  {
    name: 'fade',
    animation: {
      scale: [1, 0.7, 1.2, 1],
      opacity: [1, 0.4, 0.8, 1],
    },
    duration: 2,
    delay: 0.003,
  }
];

export default function SangreSVG() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [elements, setElements] = useState<SVGElement[]>([]);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const text = 'sgr9';
  const LETTER_SPACING = 50;

  useEffect(() => {
    fetch('/svg/sangre.svg')
      .then(response => response.text())
      .then(data => {
        setSvgContent(data);
      });
  }, []);

  useEffect(() => {
    if (svgContent) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      // Get all rect elements directly
      const allElements = Array.from(svgDoc.querySelectorAll('rect')).filter(
        (el): el is SVGRectElement => el instanceof SVGRectElement
      );
      setElements(allElements);
    }
  }, [svgContent]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern((prev) => (prev + 1) % patterns.length);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const renderElement = (element: SVGElement | SVGRectElement, index: number) => {
    const pattern = patterns[currentPattern];
    const x = element.getAttribute('x') || '0';
    const y = element.getAttribute('y') || '0';
    const width = element.getAttribute('width') || '0';
    const height = element.getAttribute('height') || '0';
    const rx = element.getAttribute('rx') || '0';
    const ry = element.getAttribute('ry') || '0';

    return (
      <motion.rect
        key={index}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        ry={ry}
        fill="#2a2a2a"
        initial={{ opacity: 1, scale: 1, rotate: 0 }}
        animate={pattern.animation}
        transition={{
          duration: pattern.duration,
          repeat: Infinity,
          delay: index * pattern.delay,
          ease: "easeInOut",
          repeatType: "reverse"
        }}
        style={{
          transformOrigin: 'center',
          originX: '50%',
          originY: '50%'
        }}
      />
    );
  };

  return (
    <motion.div 
      className="svg-container"
      initial={false}
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
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1026.91 986.75"
          width="100%"
          height="100%"
          initial={false}
          style={{
            willChange: 'transform',
            maxHeight: 'calc(100vh - 4rem)',
            maxWidth: '100%',
            height: 'auto',
            width: 'auto',
            objectFit: 'contain'
          }}
        >
          <g>
            {elements.map((element, index) => renderElement(element, index))}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                pointerEvents: 'none'
              }}
            >
              {text.split('').map((char, index) => (
                <motion.text
                  key={index}
                  className="svg-text"
                  x={560 + (index * LETTER_SPACING)}
                  y="445"
                  style={{
                    fill: '#2a2a2a',
                    fontSize: '128px',
                    fontFamily: '"Architype", Arial, sans-serif'
                  }}
                >
                  {char}
                </motion.text>
              ))}
            </motion.g>
          </g>
        </motion.svg>
      </motion.div>
      <motion.button 
        className="fullscreen-btn" 
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
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
      </motion.button>
    </motion.div>
  );
} 