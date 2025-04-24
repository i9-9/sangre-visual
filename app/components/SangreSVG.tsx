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
    },
    duration: 1,
    delay: 0.05,
  },
  {
    name: 'pulse',
    animation: {
      opacity: [1, 0.2, 1],
      scale: [1, 1.1, 1],
    },
    duration: 1.5,
    delay: 0.1,
  },
  {
    name: 'wave',
    animation: {
      opacity: [1, 0.2, 1],
      rotate: [0, 5, 0],
    },
    duration: 2,
    delay: 0.15,
  },
  {
    name: 'fade',
    animation: {
      opacity: [1, 0.2, 1],
    },
    duration: 0.8,
    delay: 0.02,
  },
];

export default function SangreSVG() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [elements, setElements] = useState<SVGElement[]>([]);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const text = 'sgr9';
  const LETTER_SPACING = 50; // Increased spacing between letters

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
      const allElements = Array.from(svgDoc.querySelectorAll('*')).filter(
        (el): el is SVGElement => el instanceof SVGElement
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

  useEffect(() => {
    const interval = setInterval(() => {
      setIsInverted(prev => !prev);
      document.body.classList.toggle('inverted');
    }, 30000);

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

  const renderElement = (element: SVGElement, index: number) => {
    const pattern = patterns[currentPattern];
    const isRect = element.tagName === 'rect';

    if (isRect) {
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
          fill={isInverted ? "#ffffff" : "#2a2a2a"}
          initial={{ opacity: 1 }}
          animate={pattern.animation}
          transition={{
            duration: pattern.duration,
            repeat: Infinity,
            delay: index * pattern.delay,
            ease: "easeInOut"
          }}
        />
      );
    }

    return null;
  };

  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0
      }
    }
  };

  const letterVariant = {
    hidden: { opacity: 0.2 },
    visible: { opacity: 1 }
  };

  return (
    <div className={`svg-container ${isInverted ? 'inverted' : ''}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1026.91 986.75"
        width="100%"
        height="100%"
      >
        <g>
          {elements.map((element, index) => renderElement(element, index))}
          <motion.g
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {text.split('').map((char, index) => (
              <motion.text
                key={index}
                className="svg-text"
                x={560 + (index * LETTER_SPACING)}
                y="445"
                variants={letterVariant}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: index * 0.1
                }}
              >
                {char}
              </motion.text>
            ))}
          </motion.g>
        </g>
      </svg>
      <button 
        className="fullscreen-btn" 
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
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