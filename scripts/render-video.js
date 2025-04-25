import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const OUTPUT_DIR = path.join(__dirname, '../output');
const FRAME_DIR = path.join(OUTPUT_DIR, 'frames');
const VIDEO_PATH = path.join(OUTPUT_DIR, 'sangre_animation.mp4');
const FPS = 30;
const DURATION = 20; // Duración total en segundos
const VIEWPORT = { width: 1280, height: 720 }; // Resolución más baja para reducir carga
const URL = 'http://localhost:3000?render=true&mode=dark'; // Modo renderizado activado
const RETRY_ATTEMPTS = 3;

console.log(`Directorio de salida: ${OUTPUT_DIR}`);
console.log(`Directorio de frames: ${FRAME_DIR}`);

// Asegurar que los directorios existan
if (!fs.existsSync(OUTPUT_DIR)) {
  console.log(`Creando directorio de salida: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(FRAME_DIR)) {
  console.log(`Creando directorio de frames: ${FRAME_DIR}`);
  fs.mkdirSync(FRAME_DIR, { recursive: true });
}

// Limpiar frames anteriores
const existingFrames = fs.readdirSync(FRAME_DIR)
  .filter(file => file.endsWith('.png'));

if (existingFrames.length > 0) {
  console.log(`Limpiando ${existingFrames.length} frames anteriores...`);
  existingFrames.forEach(file => fs.unlinkSync(path.join(FRAME_DIR, file)));
}

async function captureFrames() {
  console.log('Iniciando captura de frames...');
  
  // Opciones mejoradas para Puppeteer
  const browser = await puppeteer.launch({
    defaultViewport: VIEWPORT,
    headless: false, // Usar modo no-headless para mayor estabilidad
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    timeout: 60000 // 60 segundos de timeout
  });
  
  try {
    console.log('Navegador iniciado correctamente');
    const page = await browser.newPage();
    
    // Mejorar gestión de errores y tiempos de espera
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    // Capturar logs de consola para depuración
    page.on('console', msg => console.log('PÁGINA:', msg.text()));
    page.on('error', err => console.error('ERROR EN PÁGINA:', err));
    
    console.log(`Navegando a ${URL}...`);
    await page.goto(URL, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Esperar a que se inicialice la página
    console.log('Esperando a que el canvas aparezca...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    console.log('Canvas detectado, esperando carga completa...');
    await page.waitForTimeout(5000); // Espera más larga para asegurar carga completa
    
    // Verificar que la página esté lista
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas !== null && canvas.width > 0 && canvas.height > 0;
    });
    
    if (!canvasExists) {
      throw new Error('Canvas no disponible o no inicializado correctamente');
    }
    
    console.log('Página cargada completamente, iniciando captura de frames');
    
    // Capturar frames
    const totalFrames = FPS * DURATION;
    for (let i = 0; i < totalFrames; i++) {
      const frameNumber = String(i).padStart(5, '0');
      const framePath = path.join(FRAME_DIR, `frame_${frameNumber}.png`);
      
      await page.screenshot({
        path: framePath,
        type: 'png',
        omitBackground: false
      });
      
      // Verificar si se guardó correctamente
      if (!fs.existsSync(framePath)) {
        console.error(`Error: No se pudo guardar el frame ${frameNumber}`);
        continue;
      }
      
      // Pequeña pausa para el siguiente frame (ajuste de fps)
      await page.waitForTimeout(1000 / FPS);
      
      if (i % FPS === 0 || i === totalFrames - 1) {
        console.log(`Capturado frame ${i+1}/${totalFrames} (${Math.round((i+1)/totalFrames*100)}%)`);
      }
    }
    
    console.log('Captura de frames completada');
  } catch (error) {
    console.error('Error durante la captura de frames:', error);
    throw error;
  } finally {
    console.log('Cerrando navegador...');
    await browser.close();
  }
}

function combineFramesToVideo() {
  console.log('Combinando frames en video...');
  
  // Verificar que haya frames para combinar
  const frames = fs.readdirSync(FRAME_DIR).filter(file => file.endsWith('.png'));
  
  if (frames.length === 0) {
    throw new Error('No hay frames para combinar en video');
  }
  
  console.log(`Encontrados ${frames.length} frames para combinar`);
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(FRAME_DIR, 'frame_%05d.png'))
      .inputFPS(FPS)
      .output(VIDEO_PATH)
      .videoCodec('libx264')
      .outputFPS(FPS)
      .on('start', commandLine => {
        console.log('Comando FFmpeg:', commandLine);
      })
      .on('progress', progress => {
        console.log(`Progreso: ${Math.round(progress.percent || 0)}%`);
      })
      .on('end', () => {
        console.log(`Video generado en: ${VIDEO_PATH}`);
        resolve();
      })
      .on('error', err => {
        console.error('Error al generar video con fluent-ffmpeg:', err);
        reject(err);
      })
      .run();
  });
}

// Función alternativa usando ffmpeg directamente
function combineFramesWithFfmpegCommand() {
  console.log('Combinando frames usando comando ffmpeg directo...');
  
  // Verificar que haya frames para combinar
  const frames = fs.readdirSync(FRAME_DIR).filter(file => file.endsWith('.png'));
  
  if (frames.length === 0) {
    throw new Error('No hay frames para combinar en video');
  }
  
  console.log(`Encontrados ${frames.length} frames para combinar con comando directo`);
  
  const command = `ffmpeg -r ${FPS} -i "${path.join(FRAME_DIR, 'frame_%05d.png')}" -c:v libx264 -pix_fmt yuv420p -crf 23 -r ${FPS} "${VIDEO_PATH}"`;
  
  try {
    console.log(`Ejecutando: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`Video generado en: ${VIDEO_PATH}`);
    return true;
  } catch (error) {
    console.error('Error al ejecutar ffmpeg:', error);
    return false;
  }
}

// Función para intentar múltiples veces la captura
async function captureWithRetries() {
  let lastError = null;
  
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`Intento ${attempt} de ${RETRY_ATTEMPTS}...`);
      await captureFrames();
      return; // Éxito, salir de la función
    } catch (error) {
      console.error(`Fallo en intento ${attempt}:`, error);
      lastError = error;
      // Esperar antes del siguiente intento
      if (attempt < RETRY_ATTEMPTS) {
        console.log(`Esperando 5 segundos antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(`Todos los ${RETRY_ATTEMPTS} intentos fallaron. Último error: ${lastError}`);
}

// Punto de entrada principal
async function main() {
  console.log(`Iniciando proceso de renderizado de video (${new Date().toISOString()})...`);
  console.log(`Resolución: ${VIEWPORT.width}x${VIEWPORT.height}, FPS: ${FPS}, Duración: ${DURATION}s`);
  
  try {
    await captureWithRetries();
    
    const frameCount = fs.readdirSync(FRAME_DIR).filter(file => file.endsWith('.png')).length;
    console.log(`Total de frames capturados: ${frameCount}`);
    
    if (frameCount === 0) {
      throw new Error('No se capturó ningún frame');
    }
    
    try {
      await combineFramesToVideo();
    } catch (ffmpegError) {
      console.log('Intentando método alternativo de generación de video...');
      const success = combineFramesWithFfmpegCommand();
      
      if (!success) {
        throw new Error('Ambos métodos de generación de video fallaron');
      }
    }
    
    // Verificar que el video se haya generado
    if (fs.existsSync(VIDEO_PATH)) {
      const stats = fs.statSync(VIDEO_PATH);
      console.log(`Video generado correctamente (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      throw new Error('El archivo de video no existe después de la generación');
    }
    
    console.log(`Proceso completado exitosamente (${new Date().toISOString()}).`);
  } catch (error) {
    console.error('Error fatal en el proceso:', error);
    process.exit(1);
  }
}

main(); 