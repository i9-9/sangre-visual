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

type DisplayMode = 'light' | 'dark' | 'video' | 'render';

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
      opacity: [1, 0.2, 1],
    },
    duration: 2,
    delay: 0.003,
  },
  {
    name: 'pulse-individual',
    animation: {
      opacity: [1, 0.1, 1],
    },
    duration: 1.5,
    delay: 0.004,
  },
  {
    name: 'wave',
    animation: {
      opacity: [1, 0.05, 1],
    },
    duration: 2.5,
    delay: 0.002,
  },
  {
    name: 'fade',
    animation: {
      opacity: [1, 0.2, 0.9, 1],
    },
    duration: 2,
    delay: 0.003,
  }
];

const videoList = [
  '/video/lava.mov',
  '/video/lava4.mov',
  '/video/lava3.mov',
];

export default function SangreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const changingVideoRef = useRef<boolean>(false);
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [displayMode, setDisplayMode] = useState<DisplayMode>('video');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeVideoRef, setActiveVideoRef] = useState<'primary' | 'secondary'>('primary');
  const text = 'SANGRE';
  
  // Ajustes de animación
  const [animSettings] = useState({
    individualModules: true,    // Animar módulos individualmente vs. por bloques
    moduleVariance: 1,        // 0-1: Qué tanto varía la animación entre módulos cercanos
    animationSpeed: 0.5,       // Multiplicador de velocidad de animación (más bajo = más lento)
    patternDuration: 20,        // Segundos antes de cambiar de patrón
    randomness: 0.05,           // 0-1: Nivel de aleatoriedad en animaciones
    waveIntensity: 1,         // 0-1: Intensidad de efecto ondulatorio
    waveSpeed: 0.0001,          // Velocidad de propagación de ondas
    pulseRange: [0.2, 1.0],     // Rango de opacidad para pulsos
    // Nuevos parámetros
    useVideoBackground: false,   // Controlado automáticamente por displayMode
    videoPath: videoList[0],     // Ruta al video de fondo actual
    videoOpacity: 1.0,          // Opacidad del video de fondo
    darkMode: false,            // Controlado automáticamente por displayMode
    displayModeInterval: 45,    // Segundos antes de cambiar de modo (light/dark/video)
    renderMode: false,          // Modo especial para renderizado de video
    backgroundGlow: {
      enabled: false,            // Activar/desactivar efecto de glow en el fondo
      intensity: 0.1 ,          // 0-1: Intensidad del efecto de glow (más sutil)
      speed: 0.03,              // Velocidad del LFO triangular (más bajo = más lento)
      color: '#fff',         // Color base del fondo (negro)
      glowColor: '#f0f0ff',     // Color del glow (ligeramente azulado)
      centerX: 0.5,             // Posición X del centro del glow (0-1)
      centerY: 0.5,             // Posición Y del centro del glow (0-1)
      pulseAmount: 0.2          // Cantidad de movimiento en el radio del glow
    },
    textSpacing: 2.0,           // Multiplicador de espaciado entre letras
    textOpacity: 1.0,           // Opacidad del texto
    textPosition: {
      x: 645,               // Posición X del texto (centrado por defecto)
      y: 450,                   // Posición Y del texto
      alignment: 'center',      // Alineación del texto: 'left', 'center', 'right'
      fontSize: 100,            // Tamaño de fuente
      fontFamily: '"Architype", sans-serif' // Familia de fuente
    },
    rectOpacityMultiplier: 1.0, // Multiplicador general de opacidad para rectángulos
    useGridEffect: false,       // Efecto visual de grid sobre los módulos
    gridOpacity: 5,          // Opacidad del grid
    gridSpacing: 20,            // Espaciado del grid en píxeles
    colorShift: {
      enabled: false,           // Aplicar desplazamiento de color a los rectángulos
      hue: 0,                   // Desplazamiento de tono (0-360)
      saturation: 0,            // Ajuste de saturación (-100 a 100)
      lightness: 0              // Ajuste de luminosidad (-100 a 100)
    }
  });
  
  const svgViewBox = { width: 1026.91, height: 986.75 };

  // Detectar si estamos en modo de renderizado desde URL
  useEffect(() => {
    // Comprobar si estamos en un contexto de navegador
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const renderParam = urlParams.get('render');
      if (renderParam === 'true') {
        console.log('Activando modo de renderizado');
        animSettings.renderMode = true;
        
        // Establecer modo para el renderizado
        const mode = urlParams.get('mode') as DisplayMode;
        if (mode && ['light', 'dark', 'video'].includes(mode)) {
          setDisplayMode(mode);
        }
        
        // Establecer índice de video si es necesario
        const videoIndex = urlParams.get('videoIndex');
        if (videoIndex && !isNaN(parseInt(videoIndex))) {
          const index = parseInt(videoIndex);
          if (index >= 0 && index < videoList.length) {
            setCurrentVideoIndex(index);
          }
        }
      }
    }
  }, []);

  // Sincronizar displayMode con los ajustes apropiados
  useEffect(() => {
    // Evitar cambios si ya estamos en proceso de cambiar video
    if (changingVideoRef.current) return;

    // Actualizar configuración basada en el modo actual
    switch (displayMode) {
      case 'light':
        animSettings.darkMode = false;
        animSettings.useVideoBackground = false;
        break;
      case 'dark':
        animSettings.darkMode = true;
        animSettings.useVideoBackground = false;
        break;
      case 'video':
        animSettings.useVideoBackground = true;
        loadVideoSafely();
        break;
      case 'render':
        // Modo especial para renderizado, sin cambios automáticos
        break;
    }
  }, [displayMode, currentVideoIndex]);

  // Forzar precarga de todos los videos al inicio
  useEffect(() => {
    // Precargar todos los videos al iniciar
    const preloadAllVideos = async () => {
      if (videoList.length === 0) {
        console.warn("No videos in the list to load");
        return;
      }
      
      console.log("Preloading all videos on startup:", videoList);
      
      try {
        // Check that the first video exists and is accessible
        if (!videoList[0]) {
          console.error("First video is undefined or null");
          return;
        }
        
        // Stop any current loading
        if (videoRef.current) videoRef.current.pause();
        if (secondaryVideoRef.current) secondaryVideoRef.current.pause();
        
        // Load first video after a small pause
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set up the primary video with the first video
        if (videoRef.current) {
          const handlePrimaryLoaded = async () => {
            if (!videoRef.current) return;
            
            videoRef.current.removeEventListener('loadeddata', handlePrimaryLoaded);
            try {
              // Only try to play when video is fully loaded
              if (videoRef.current && videoRef.current.readyState >= 3) {
                // Add a small delay to prevent play interruption
                await new Promise(resolve => setTimeout(resolve, 50));
                await videoRef.current.play();
                console.log("Primary video started successfully");
              }
            } catch (error) {
              console.error("Error playing primary video:", error);
              if (videoRef.current) {
                videoRef.current.setAttribute("muted", "");
                try {
                  // Add a delay before retry
                  await new Promise(resolve => setTimeout(resolve, 100));
                  await videoRef.current.play();
                } catch (e) {
                  console.error("Second attempt failed:", e);
                }
              }
            }
          };
          
          const handlePrimaryError = () => {
            videoRef.current?.removeEventListener('error', handlePrimaryError);
            
            const video = videoRef.current;
            console.error("Error loading primary video:", {
              src: video?.src || "No source",
              error: video?.error ? {
                code: video.error.code,
                message: video.error.message
              } : "No error object"
            });
            
            // Try with different format if it fails
            if (videoRef.current && videoRef.current.src.endsWith('.mov')) {
              console.log("Trying MP4 format instead of MOV");
              const mp4Src = videoRef.current.src.replace('.mov', '.mp4');
              videoRef.current.src = mp4Src;
              videoRef.current.load();
            }
          };
          
          videoRef.current.addEventListener('loadeddata', handlePrimaryLoaded);
          videoRef.current.addEventListener('error', handlePrimaryError);
          videoRef.current.muted = true;
          videoRef.current.loop = true;
          videoRef.current.playsInline = true;
          videoRef.current.autoplay = false;
          videoRef.current.preload = "auto";
          videoRef.current.src = videoList[0];
          videoRef.current.load();
          
          // Wait a while before loading the second video
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Only try to load the second video if the first one loaded correctly
        if (videoList.length > 1 && secondaryVideoRef.current && videoRef.current && videoRef.current.readyState > 0) {
          console.log("Loading second video after ensuring the first is ready");
          
          if (!videoList[1]) {
            console.error("Second video is undefined or null");
            return;
          }
          
          // Use a load event to play the video when ready
          const handleSecondaryLoaded = async () => {
            if (!secondaryVideoRef.current) return;
            
            secondaryVideoRef.current.removeEventListener('loadeddata', handleSecondaryLoaded);
            try {
              if (secondaryVideoRef.current && secondaryVideoRef.current.readyState >= 3) {
                // Add a small delay to prevent play interruption
                await new Promise(resolve => setTimeout(resolve, 50));
                await secondaryVideoRef.current.play();
                console.log("Secondary video preloaded successfully");
              }
            } catch (error) {
              console.error("Error preloading secondary video:", error);
              if (secondaryVideoRef.current) {
                secondaryVideoRef.current.setAttribute("muted", "");
                try {
                  // Add a delay before retry
                  await new Promise(resolve => setTimeout(resolve, 100));
                  await secondaryVideoRef.current.play();
                } catch (e) {
                  console.error("Second attempt failed for secondary video:", e);
                }
              }
            }
          };
          
          const handleSecondaryError = () => {
            secondaryVideoRef.current?.removeEventListener('error', handleSecondaryError);
            
            const video = secondaryVideoRef.current;
            console.error("Error loading secondary video:", {
              src: video?.src || "No source",
              error: video?.error ? {
                code: video.error.code,
                message: video.error.message
              } : "No error object"
            });
            
            // Try with different format if it fails
            if (secondaryVideoRef.current && secondaryVideoRef.current.src.endsWith('.mov')) {
              console.log("Trying MP4 format instead of MOV for secondary video");
              const mp4Src = secondaryVideoRef.current.src.replace('.mov', '.mp4');
              secondaryVideoRef.current.src = mp4Src;
              secondaryVideoRef.current.load();
            }
          };
          
          secondaryVideoRef.current.addEventListener('loadeddata', handleSecondaryLoaded);
          secondaryVideoRef.current.addEventListener('error', handleSecondaryError);
          secondaryVideoRef.current.muted = true;
          secondaryVideoRef.current.loop = true;
          secondaryVideoRef.current.playsInline = true;
          secondaryVideoRef.current.autoplay = false;
          secondaryVideoRef.current.preload = "auto";
          secondaryVideoRef.current.style.opacity = '0';
          secondaryVideoRef.current.src = videoList[1];
          secondaryVideoRef.current.load();
        } else {
          console.warn("Cannot load secondary video because primary is not ready yet");
        }
        
        // Mark as loaded after a time to allow operations to complete
        setTimeout(() => {
          setVideoLoaded(true);
        }, 2000);
        
      } catch (error) {
        console.error("Critical error preloading videos:", error);
      }
    };

    preloadAllVideos();
  }, []);

  // Función para cargar videos de manera segura
  const loadVideoSafely = async () => {
    if (!videoRef.current || !secondaryVideoRef.current) return;
    
    // If is the first load and no video has been loaded yet
    if (!videoLoaded && currentVideoIndex === 0 && videoRef.current.readyState < 2) {
      console.log("Initializing videos for the first time");
      // Don't attempt to load here, the preloadAllVideos useEffect handles this
      return;
    }
    
    // Avoid loading interruptions if we're already changing video
    if (changingVideoRef.current) return;
    
    // Mark that we're changing video
    changingVideoRef.current = true;
    
    try {
      // Determine which video is inactive to preload the new one
      const inactiveVideoRef = activeVideoRef === 'primary' ? secondaryVideoRef : videoRef;
      const activeVideo = activeVideoRef === 'primary' ? videoRef.current : secondaryVideoRef.current;
      
      // Configure the inactive video with the new source
      if (inactiveVideoRef.current) {
        // Stop any current playback
        inactiveVideoRef.current.pause();
        
        // Configure the video
        inactiveVideoRef.current.muted = true;
        inactiveVideoRef.current.loop = true;
        inactiveVideoRef.current.style.opacity = '0';
        
        // Define a handler to play when ready
        const handleVideoLoaded = async () => {
          if (!inactiveVideoRef.current) return;
          
          // Remove the event to avoid duplicate calls
          inactiveVideoRef.current.removeEventListener('loadeddata', handleVideoLoaded);
          
          // Only play if the video is in an appropriate state
          if (inactiveVideoRef.current.readyState >= 3) {
            try {
              // Make sure we're not making a play request immediately after a load request
              await new Promise(resolve => setTimeout(resolve, 50));
              await inactiveVideoRef.current.play();
            } catch (error) {
              console.error("Error playing video:", error);
              // Check if the error has the name property
              if (error instanceof Error && error.name === "NotAllowedError") {
                inactiveVideoRef.current.setAttribute("muted", "");
                setTimeout(async () => {
                  try {
                    if (inactiveVideoRef.current) {
                      await inactiveVideoRef.current.play();
                    }
                  } catch (e) {
                    console.error("Failed to recover from autoplay error:", e);
                  }
                }, 100);
              }
            }
            
            // Make the new video visible
            inactiveVideoRef.current.style.transition = 'opacity 500ms ease-in-out';
            inactiveVideoRef.current.style.opacity = '1';
          }
        };
        
        // Add the event and load the video
        inactiveVideoRef.current.addEventListener('loadeddata', handleVideoLoaded);
        inactiveVideoRef.current.src = videoList[currentVideoIndex];
        console.log("Preloading new video:", videoList[currentVideoIndex]);
        inactiveVideoRef.current.load();
      }
      
      // Fade out the current video
      if (activeVideo) {
        activeVideo.style.transition = 'opacity 500ms ease-in-out';
        activeVideo.style.opacity = '0';
      }
      
      // Wait for the transition to finish
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms for the transition
      
      // Change the active reference
      setActiveVideoRef(activeVideoRef === 'primary' ? 'secondary' : 'primary');
      
      // Update the configuration
      console.log("Video preloaded successfully");
      animSettings.videoPath = videoList[currentVideoIndex];
      setVideoLoaded(true);
      
    } catch (error) {
      console.error("Error preloading video:", error);
      setVideoLoaded(false);
    } finally {
      // No longer changing video
      setTimeout(() => {
        changingVideoRef.current = false;
      }, 1000); // Give time for the transition to finish
    }
  };

  // Cambiar el modo de visualización periódicamente
  useEffect(() => {
    // No cambiar automáticamente en modo de renderizado
    if (animSettings.renderMode) return;
    
    // Verificar si es un despliegue real (no localhost)
    const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
    
    // En producción, usar solo el modo video para mayor impacto visual
    if (isProduction && displayMode !== 'video') {
      setDisplayMode('video');
      return;
    }
    
    const intervalId = setInterval(() => {
      // No cambiar si estamos en proceso de cambio de video
      if (changingVideoRef.current) return;
      
      setDisplayMode(prevMode => {
        // Rotar entre los tres modos
        switch (prevMode) {
          case 'light': return 'dark';
          case 'dark': return 'video';
          case 'video': 
            // Al cambiar de video a light, primero verificar si el siguiente video existe
            const nextVideoIndex = (currentVideoIndex + 1) % videoList.length;
            
            // Verificar si el siguiente video está realmente disponible
            const testVideoPath = videoList[nextVideoIndex];
            console.log(`Comprobando disponibilidad del siguiente video: ${testVideoPath}`);
            
            // Avanzar al siguiente video después de verificar
            setCurrentVideoIndex(nextVideoIndex);
            
            return isProduction ? 'video' : 'light'; // En producción, siempre volver a video
          default: return 'light';
        }
      });
    }, animSettings.displayModeInterval * 1000);

    return () => clearInterval(intervalId);
  }, [animSettings.displayModeInterval, animSettings.renderMode]);

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

  // Calculate opacity for a given element at current time
  const calculateOpacity = (index: number, time: number) => {
    const pattern = patterns[currentPattern];
    const cycleTime = pattern.duration * 1000 / animSettings.animationSpeed;
    
    // Aplicar variación a los retrasos según ajustes
    let delayMultiplier = 1;
    
    if (animSettings.individualModules) {
      // Para generar ondas visuales, usamos coordenadas virtuales basadas en el índice
      const row = Math.floor(index / 30); // Asumimos aproximadamente 30 elementos por fila
      const col = index % 30;
      
      // Creamos un centro móvil para las ondas
      const centerX = 15 + Math.sin(time * 0.00005) * 10;
      const centerY = 10 + Math.cos(time * 0.00004) * 5;
      
      // Efecto de ondas radiales que se expanden desde el centro móvil
      const distance = Math.sqrt(Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2));
      
      // La distancia influye directamente en el retraso, generando un patrón ondulatorio
      // visible que se propaga hacia afuera desde el centro
      delayMultiplier = Math.sin(distance * 0.3 - time * animSettings.waveSpeed) * 0.5 + 0.5;
      
      // Aplica la varianza del módulo configurada (más sutil)
      delayMultiplier = delayMultiplier * animSettings.moduleVariance + (1 - animSettings.moduleVariance);
      
      // Añadir efecto de onda adicional si está activado (para doble patrón)
      if (animSettings.waveIntensity > 0) {
        // Creamos ondas concéntricas que se mueven lentamente 
        const waveEffect = Math.sin(time * 0.00008 + distance * 0.2) * animSettings.waveIntensity;
        delayMultiplier += waveEffect * 0.2;
      }
      
      // Añadir aleatoriedad mínima para suavizar
      if (animSettings.randomness > 0) {
        const randomOffset = (Math.sin(index * 12.9898 + time * 0.0001) * 43758.5453) % 1;
        delayMultiplier += (randomOffset - 0.5) * animSettings.randomness * 0.1;
      }
    }
    
    const delayTime = index * pattern.delay * 1000 * delayMultiplier;
    
    // Usar el timestamp para calcular el tiempo transcurrido
    const elapsedTime = (time + delayTime) % cycleTime;
    const progress = elapsedTime / cycleTime;
    
    const opacities = pattern.animation.opacity;
    const numSteps = opacities.length - 1;
    const stepSize = 1 / numSteps;
    
    let i = Math.floor(progress / stepSize);
    if (i >= numSteps) i = numSteps - 1;
    
    const stepProgress = (progress - (i * stepSize)) / stepSize;
    let start = opacities[i];
    let end = opacities[i + 1];
    
    // Ajustar el rango de opacidad según la configuración
    if (pattern.name.includes('pulse')) {
      const [min, max] = animSettings.pulseRange;
      start = min + (max - min) * start;
      end = min + (max - min) * end;
    }
    
    // Aplicar el multiplicador general de opacidad
    return (start + (end - start) * stepProgress) * animSettings.rectOpacityMultiplier;
  };

  // Function to calculate background LFO triangular wave
  const calculateBackgroundGlow = (time: number) => {
    if (!animSettings.backgroundGlow.enabled) return 0;
    
    // Triangular LFO wave: intensidad varía de 0 a 1 y luego baja de 1 a 0
    const period = 1000 / animSettings.backgroundGlow.speed; // ms
    const t = (time % period) / period;
    
    // Triangular wave formula (0->1->0)
    return t < 0.5 
      ? 2 * t * animSettings.backgroundGlow.intensity 
      : (2 - 2 * t) * animSettings.backgroundGlow.intensity;
  };

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
    }, animSettings.patternDuration * 1000);

    return () => clearInterval(interval);
  }, [animSettings.patternDuration]);

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
    
    const animate = (time: number) => {
      if (!ctx) return;
      
      // Calculate background glow effect
      const glowIntensity = calculateBackgroundGlow(time);
      
      // Limpiar el canvas con el color base si no hay video
      if (!animSettings.useVideoBackground) {
        ctx.fillStyle = animSettings.darkMode ? '#000000' : '#ffffff';
        ctx.fillRect(0, 0, windowSize.width, windowSize.height);
      } else {
        // Si usamos video, dibujamos el video en el fondo manteniéndolo en proporción
        const currentVideoElement = activeVideoRef === 'primary' ? videoRef.current : secondaryVideoRef.current;
        
        if (currentVideoElement && currentVideoElement.readyState >= 2 && videoLoaded) { // HAVE_CURRENT_DATA y video cargado
          ctx.globalAlpha = animSettings.videoOpacity;
          
          // Calcular dimensiones para mantener la proporción del video
          const videoRatio = currentVideoElement.videoWidth / currentVideoElement.videoHeight;
          const canvasRatio = windowSize.width / windowSize.height;
          
          let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
          
          if (videoRatio > canvasRatio) {
            // El video es más ancho proporcionalmente que el canvas
            drawHeight = windowSize.height;
            drawWidth = drawHeight * videoRatio;
            offsetX = (windowSize.width - drawWidth) / 2;
          } else {
            // El video es más alto proporcionalmente que el canvas
            drawWidth = windowSize.width;
            drawHeight = drawWidth / videoRatio;
            offsetY = (windowSize.height - drawHeight) / 2;
          }
          
          // Rellenar el fondo con negro primero
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, windowSize.width, windowSize.height);
          
          // Dibujar el video manteniendo la proporción
          ctx.drawImage(
            currentVideoElement,
            offsetX, offsetY,
            drawWidth, drawHeight
          );
          
          ctx.globalAlpha = 1.0;
        } else {
          // Si el video no está listo, usar color negro como fallback
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, windowSize.width, windowSize.height);
        }
      }
      
      // Crear un gradiente radial para el efecto de glow
      if (animSettings.backgroundGlow.enabled && glowIntensity > 0) {
        const centerX = windowSize.width * animSettings.backgroundGlow.centerX;
        const centerY = windowSize.height * animSettings.backgroundGlow.centerY;
        
        // El radio del gradiente depende del tamaño de la ventana y la intensidad
        const maxRadius = Math.max(windowSize.width, windowSize.height);
        
        // Añadir pulsación suave al radio interno para crear efecto de respiración
        const pulseOffset = Math.sin(time * 0.0005) * animSettings.backgroundGlow.pulseAmount;
        const innerRadius = maxRadius * (0.05 + pulseOffset * 0.05);
        const outerRadius = maxRadius * (0.6 + glowIntensity * 0.4);
        
        const gradient = ctx.createRadialGradient(
          centerX, centerY, innerRadius,
          centerX, centerY, outerRadius
        );
        
        // Obtener componentes RGB del color de glow configurado
        const glowColor = animSettings.backgroundGlow.glowColor;
        const glowR = parseInt(glowColor.slice(1, 3), 16);
        const glowG = parseInt(glowColor.slice(3, 5), 16);
        const glowB = parseInt(glowColor.slice(5, 7), 16);
        
        // Crear gradiente con múltiples paradas para un efecto más suave
        gradient.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${glowIntensity * 0.6})`);
        gradient.addColorStop(0.3, `rgba(${glowR}, ${glowG}, ${glowB}, ${glowIntensity * 0.3})`);
        gradient.addColorStop(0.7, `rgba(${glowR}, ${glowG}, ${glowB}, ${glowIntensity * 0.1})`);
        gradient.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0)`);
        
        // Aplicar el gradiente con modo de fusión que intensifica los colores
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, windowSize.width, windowSize.height);
        
        // Restaurar modo de composición normal
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Dibujar grid si está activado
      if (animSettings.useGridEffect) {
        ctx.save();
        ctx.strokeStyle = '#2a2a2a';
        ctx.globalAlpha = animSettings.gridOpacity;
        ctx.lineWidth = 0.5;
        
        const gridSize = animSettings.gridSpacing;
        // Dibujar líneas horizontales
        for (let y = gridSize; y < windowSize.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(windowSize.width, y);
          ctx.stroke();
        }
        
        // Dibujar líneas verticales
        for (let x = gridSize; x < windowSize.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, windowSize.height);
          ctx.stroke();
        }
        ctx.restore();
      }
      
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
      if (animSettings.colorShift.enabled) {
        // HSL color shift basado en configuración
        const hue = animSettings.colorShift.hue;
        const saturation = animSettings.colorShift.saturation;
        const lightness = animSettings.colorShift.lightness;
        ctx.fillStyle = `hsl(${hue}, ${50 + saturation}%, ${20 + lightness}%)`;
      } else if (animSettings.useVideoBackground) {
        // Con video de fondo, siempre usamos módulos blancos semi-transparentes
        ctx.fillStyle = '#ffffff';
      } else {
        // En modo normal, invertimos los colores según darkMode
        ctx.fillStyle = animSettings.darkMode ? '#ffffff' : '#000000';
      }
      
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
      
      // Dibujar texto estático
      if (animSettings.useVideoBackground) {
        // Con video de fondo, texto siempre blanco sin contorno
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0; // Asegurar opacidad completa
      } else {
        // Invertir color de texto según modo (negro en light, blanco en dark)
        ctx.fillStyle = animSettings.darkMode ? '#ffffff' : '#000000';
      }
      ctx.font = `${animSettings.textPosition.fontSize}px ${animSettings.textPosition.fontFamily}`;
      ctx.textAlign = animSettings.textPosition.alignment as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = animSettings.textOpacity;
      
      // Eliminar el contorno del texto
      
      // Dibujar el texto en posición configurable
      ctx.fillText(text, animSettings.textPosition.x, animSettings.textPosition.y);
      
      // Restaurar opacidad global
      ctx.globalAlpha = 1.0;
      
      ctx.restore();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [rectangles, currentPattern, windowSize]);

  // Video background setup
  useEffect(() => {
    // Configurar ambos videos
    const setupVideo = (video: HTMLVideoElement | null) => {
      if (!video) return;
      
      // Configuración simple para evitar el flicker en el loop
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      
      // Habilitar decodificación acelerada por hardware
      video.style.transform = 'translateZ(0)'; 
      
      // Mejorar rendimiento
      video.style.backfaceVisibility = 'hidden';
      video.style.willChange = 'opacity';
      
      // Usar buffer más grande
      if ('mozHasAudio' in video || 'webkitAudioDecodedByteCount' in video) {
        try {
          // Firefox/Chrome specific attribute
          video.preload = 'auto';  
          
          // Solo aplicar atributos específicos de Firefox si estamos en Firefox
          if ('mozHasAudio' in video) {
            // Usar unknown como intermediario para hacer el cast
            const firefoxVideo = video as unknown;
            // Ahora hacemos el cast seguro
            const videoWithMozFeatures = firefoxVideo as { mozPreservesPitch?: boolean };
            
            if (typeof videoWithMozFeatures.mozPreservesPitch !== 'undefined') {
              videoWithMozFeatures.mozPreservesPitch = false;
            }
          }
        } catch (e) {
          console.warn('Browser does not support some video attributes', e);
        }
      }
      
      // Deshabilitar transiciones CSS que podrían causar flicker
      video.style.transition = 'opacity 500ms ease-in-out';
      
      // Asegurar reproducción
      video.play().catch(error => {
        console.error("Error en setupVideo:", error);
        // Intento adicional con muted como atributo
        video.setAttribute("muted", "");
        video.play().catch(e => console.error("Falló intento adicional:", e));
      });
    };
    
    setupVideo(videoRef.current);
    setupVideo(secondaryVideoRef.current);
    
    // Preparar videos precargados
    const preloadVideos = () => {
      console.log("Intentando precargar videos:", videoList);
      
      // Verificar que los archivos de video existan usando fetch
      videoList.forEach((videoUrl, index) => {
        // Intentar cargar el video con fetch para comprobar si existe
        fetch(videoUrl, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              console.log(`✅ Video ${index} (${videoUrl}) verificado y accesible`);
              
              // Crear enlaces preload solo si el archivo existe
              const link = document.createElement('link');
              link.rel = 'preload';
              link.href = videoUrl;
              link.as = 'video';
              document.head.appendChild(link);
            } else {
              console.error(`❌ Error: Video ${index} (${videoUrl}) no encontrado (${response.status})`);
              
              // Intentar con formato MP4 si el MOV no existe
              if (videoUrl.endsWith('.mov')) {
                const mp4Url = videoUrl.replace('.mov', '.mp4');
                fetch(mp4Url, { method: 'HEAD' })
                  .then(mp4Response => {
                    if (mp4Response.ok) {
                      console.log(`✅ Alternativa MP4 encontrada: ${mp4Url}`);
                      // Crear enlace preload para la versión MP4
                      const mp4Link = document.createElement('link');
                      mp4Link.rel = 'preload';
                      mp4Link.href = mp4Url;
                      mp4Link.as = 'video';
                      document.head.appendChild(mp4Link);
                    } else {
                      console.error(`❌ Error: Tampoco se encuentra versión MP4 (${mp4Response.status})`);
                    }
                  })
                  .catch(error => console.error(`❌ Error al verificar MP4: ${error}`));
              }
            }
          })
          .catch(error => {
            console.error(`❌ Error al verificar video ${index} (${videoUrl}):`, error);
          });
      });
    };
    
    preloadVideos();
    
    // Mejorar la técnica de loop suave
    const handleTimeUpdate = () => {
      const primaryVideo = videoRef.current;
      const secondaryVideo = secondaryVideoRef.current;
      const currentVideo = activeVideoRef === 'primary' ? primaryVideo : secondaryVideo;
      
      if (!currentVideo || currentVideo.paused) return;
      
      // Detectar cuándo estamos cerca del final para realizar un loop suave
      // Ajustar este valor según la duración del video para evitar saltos visibles
      const endThreshold = 0.3; // 300ms antes del final
      
      if (currentVideo.duration > 0 && 
          currentVideo.currentTime > currentVideo.duration - endThreshold) {
        
        // Si estamos aún más cerca del final (últimos 100ms), preparar el reinicio inmediato
        if (currentVideo.currentTime > currentVideo.duration - 0.1) {
          // Usar requestVideoFrameCallback si está disponible (Chrome/Edge)
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            try {
              // Experimental API
              // Define un tipo para el videoElement con el método experimental
              type VideoElementWithFrameCallback = HTMLVideoElement & {
                requestVideoFrameCallback: (callback: () => void) => number;
              };
              (currentVideo as VideoElementWithFrameCallback).requestVideoFrameCallback(() => {
                currentVideo.currentTime = 0;
              });
            } catch (e) {
              console.warn('requestVideoFrameCallback failed', e);
              // Fallback
              requestAnimationFrame(() => {
                if (currentVideo) currentVideo.currentTime = 0;
              });
            }
          } else {
            // Fallback para otros navegadores
            requestAnimationFrame(() => {
              // Verificar si el elemento aún existe y es reproducible
              if (currentVideo && currentVideo.readyState >= 2) {
                currentVideo.currentTime = 0;
              }
            });
          }
        }
      }
    };
    
    const primaryVideo = videoRef.current;
    const secondaryVideo = secondaryVideoRef.current;
    
    if (primaryVideo) primaryVideo.addEventListener('timeupdate', handleTimeUpdate);
    if (secondaryVideo) secondaryVideo.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      if (primaryVideo) primaryVideo.removeEventListener('timeupdate', handleTimeUpdate);
      if (secondaryVideo) secondaryVideo.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeVideoRef]);

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
      {/* Video principal */}
      {/* <video 
        ref={videoRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: -1,
          opacity: activeVideoRef === 'primary' ? 1 : 0,
          transition: 'opacity 500ms ease-in-out'
        }}
        muted
        loop
        playsInline
        preload="auto"
        onCanPlayThrough={() => console.log("Primary video can play through now")}
        onPlay={() => console.log("Primary video playing")}
        onCanPlay={() => console.log("Primary video can play now")}
        onLoadedData={() => console.log("Primary video data loaded")}
        onError={(e) => {
          // More detailed error logging
          const video = e.currentTarget;
          
          let errorInfo: {
            message: string;
            code?: number;
            MEDIA_ERR_ABORTED?: boolean;
            MEDIA_ERR_NETWORK?: boolean;
            MEDIA_ERR_DECODE?: boolean;
            MEDIA_ERR_SRC_NOT_SUPPORTED?: boolean;
          } = {
            message: "Unknown error"
          };
          
          if (video.error) {
            errorInfo = {
              code: video.error.code,
              message: video.error.message,
              MEDIA_ERR_ABORTED: (video.error.code === 1),
              MEDIA_ERR_NETWORK: (video.error.code === 2),
              MEDIA_ERR_DECODE: (video.error.code === 3),
              MEDIA_ERR_SRC_NOT_SUPPORTED: (video.error.code === 4)
            };
          }
          
          console.error("Error in primary video:", {
            event: e,
            src: video.src || "No source",
            videoSrc: videoList[currentVideoIndex], // Show what should be the current source
            videoList,
            currentVideoIndex,
            networkState: video.networkState,
            readyState: video.readyState,
            error: errorInfo
          });
          
          // Recovery attempt: switch to MP4 or reload after a while
          if (video.src.endsWith('.mov')) {
            try {
              console.log("Attempting to recover primary video with MP4 format");
              const mp4Src = video.src.replace('.mov', '.mp4');
              video.src = mp4Src;
              video.load();
            } catch (err) {
              console.error("Error trying to recover with MP4:", err);
            }
          } else {
            // Wait a bit and retry with the same source
            setTimeout(() => {
              try {
                if (videoList[currentVideoIndex]) {
                  console.log("Retrying primary video load after error");
                  video.src = videoList[currentVideoIndex];
                  video.load();
                }
              } catch (err) {
                console.error("Error in primary video retry:", err);
              }
            }, 2000);
          }
        }}
      /> */}
      
      {/* Video secundario (para transiciones suaves) */}
      {/* <video 
        ref={secondaryVideoRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: -1,
          opacity: activeVideoRef === 'secondary' ? 1 : 0,
          transition: 'opacity 500ms ease-in-out'
        }}
        muted
        loop
        playsInline
        preload="auto"
        onCanPlayThrough={() => console.log("Secondary video can play through now")}
        onPlay={() => console.log("Secondary video playing")}
        onCanPlay={() => console.log("Secondary video can play now")}
        onLoadedData={() => console.log("Secondary video data loaded")}
        onError={(e) => {
          // More detailed error logging
          const video = e.currentTarget;
          
          let errorInfo: {
            message: string;
            code?: number;
            MEDIA_ERR_ABORTED?: boolean;
            MEDIA_ERR_NETWORK?: boolean;
            MEDIA_ERR_DECODE?: boolean;
            MEDIA_ERR_SRC_NOT_SUPPORTED?: boolean;
          } = {
            message: "Unknown error"
          };
          
          if (video.error) {
            errorInfo = {
              code: video.error.code,
              message: video.error.message,
              MEDIA_ERR_ABORTED: (video.error.code === 1),
              MEDIA_ERR_NETWORK: (video.error.code === 2),
              MEDIA_ERR_DECODE: (video.error.code === 3),
              MEDIA_ERR_SRC_NOT_SUPPORTED: (video.error.code === 4)
            };
          }
          
          console.error("Error in secondary video:", {
            event: e,
            src: video.src || "No source",
            videoSrc: videoList[currentVideoIndex], // Show what should be the current source
            videoList,
            currentVideoIndex,
            networkState: video.networkState,
            readyState: video.readyState,
            error: errorInfo
          });
          
          // Recovery attempt: switch to MP4 or reload after a while
          if (video.src.endsWith('.mov')) {
            try {
              console.log("Attempting to recover secondary video with MP4 format");
              const mp4Src = video.src.replace('.mov', '.mp4');
              video.src = mp4Src;
              video.load();
            } catch (err) {
              console.error("Error trying to recover with MP4:", err);
            }
          } else {
            // Wait a bit and retry with the same source
            setTimeout(() => {
              try {
                if (videoList[currentVideoIndex]) {
                  console.log("Retrying secondary video load after error");
                  video.src = videoList[currentVideoIndex];
                  video.load();
                }
              } catch (err) {
                console.error("Error in secondary video retry:", err);
              }
            }, 2000);
          }
        }}
      /> */}
      
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