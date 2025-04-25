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

const videoList = [
  '/video/lava.mov',
/*   '/video/galaxy.mov',
  '/video/water.mov', */
];

export default function SangreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const changingVideoRef = useRef<boolean>(false);
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [displayMode, setDisplayMode] = useState<DisplayMode>('video');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const text = 'SANGRE';
  
  // Ajustes de animación
  const [animSettings] = useState({
    individualModules: false,    // Animar módulos individualmente vs. por bloques
    moduleVariance: 0.1,        // 0-1: Qué tanto varía la animación entre módulos cercanos
    animationSpeed: 0.6,       // Multiplicador de velocidad de animación (más bajo = más lento)
    patternDuration: 30,        // Segundos antes de cambiar de patrón
    randomness: 0.05,           // 0-1: Nivel de aleatoriedad en animaciones
    waveIntensity: 0.8,         // 0-1: Intensidad de efecto ondulatorio
    waveSpeed: 0.0001,          // Velocidad de propagación de ondas
    pulseRange: [0.5, 1.0],     // Rango de opacidad para pulsos
    // Nuevos parámetros
    useVideoBackground: false,   // Controlado automáticamente por displayMode
    videoPath: videoList[0],     // Ruta al video de fondo actual
    videoOpacity: 1.0,          // Opacidad del video de fondo
    darkMode: false,            // Controlado automáticamente por displayMode
    displayModeInterval: 45,    // Segundos antes de cambiar de modo (light/dark/video)
    renderMode: false,          // Modo especial para renderizado de video
    backgroundGlow: {
      enabled: false,            // Activar/desactivar efecto de glow en el fondo
      intensity: 1,          // 0-1: Intensidad del efecto de glow (más sutil)
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

  // Función para cargar videos de manera segura
  const loadVideoSafely = async () => {
    if (!videoRef.current) return;
    
    // Marcar que estamos cambiando video
    changingVideoRef.current = true;
    setVideoLoaded(false);
    
    try {
      // Detener cualquier reproducción anterior
      videoRef.current.pause();
      
      // Esperar un momento para asegurar que se detuvo
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log("Cargando video:", videoList[currentVideoIndex]);
      animSettings.videoPath = videoList[currentVideoIndex];
      videoRef.current.src = animSettings.videoPath;
      videoRef.current.load();
      
      // Esperar a que el video esté listo antes de reproducir
      videoRef.current.onloadeddata = async () => {
        if (!videoRef.current) return;
        
        console.log("Video cargado, reproduciendo...");
        try {
          await videoRef.current.play();
          console.log("Video reproduciéndose correctamente");
          setVideoLoaded(true);
        } catch (error) {
          console.error("Error al reproducir:", error);
        } finally {
          // Ya no estamos cambiando video
          changingVideoRef.current = false;
        }
      };
      
      // Manejar errores de carga
      videoRef.current.onerror = () => {
        console.error("Error al cargar el video");
        changingVideoRef.current = false;
        setVideoLoaded(false);
      };
    } catch (error) {
      console.error("Error en la secuencia de carga:", error);
      changingVideoRef.current = false;
    }
  };

  // Cambiar el modo de visualización periódicamente
  useEffect(() => {
    // No cambiar automáticamente en modo de renderizado
    if (animSettings.renderMode) return;
    
    const intervalId = setInterval(() => {
      // No cambiar si estamos en proceso de cambio de video
      if (changingVideoRef.current) return;
      
      setDisplayMode(prevMode => {
        // Rotar entre los tres modos
        switch (prevMode) {
          case 'light': return 'dark';
          case 'dark': return 'video';
          case 'video': 
            // Al cambiar de video a light, avanzar al siguiente video
            setCurrentVideoIndex(prev => (prev + 1) % videoList.length);
            return 'light';
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
        if (videoRef.current && videoRef.current.readyState >= 2 && videoLoaded) { // HAVE_CURRENT_DATA y video cargado
          ctx.globalAlpha = animSettings.videoOpacity;
          
          // Calcular dimensiones para mantener la proporción del video
          const videoRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
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
            videoRef.current,
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
      {/* Video siempre presente pero oculto */}
      <video 
        ref={videoRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: -1,
          display: 'none' // Hidden, only used as source for canvas
        }}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        onError={(e) => console.error("Error en video:", e)}
      />
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