import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const OUTPUT_DIR = path.join(__dirname, '../output');
const VIDEO_PATH = path.join(OUTPUT_DIR, 'sangre_video.mp4');

// Duración y calidad
const DURATION = 20; // segundos
const RESOLUTION = '1920x1080';
const FRAMERATE = 30;

// Asegurar que el directorio exista
if (!fs.existsSync(OUTPUT_DIR)) {
  console.log(`Creando directorio de salida: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Función para grabar la pantalla (este método funciona en macOS)
function recordScreen() {
  console.log(`Iniciando grabación de pantalla (${DURATION} segundos)...`);
  console.log(`Resolución: ${RESOLUTION}, Framerate: ${FRAMERATE}`);
  
  try {
    // En macOS, utilizamos el comando 'screencapture' integrado
    const command = `ffmpeg -f avfoundation -framerate ${FRAMERATE} -i "1:none" -t ${DURATION} -pix_fmt yuv420p -c:v libx264 -preset ultrafast -profile:v baseline ${VIDEO_PATH}`;

    console.log('Comenzando grabación...');
    console.log('Por favor, muestra la aplicación en pantalla completa');
    console.log('La grabación comenzará en 5 segundos...');
    
    // Countdown
    for (let i = 5; i > 0; i--) {
      console.log(`${i}...`);
      execSync('sleep 1');
    }
    
    console.log(`Grabando durante ${DURATION} segundos...`);
    execSync(command, { stdio: 'inherit' });
    
    // Verificar que se generó el video
    if (fs.existsSync(VIDEO_PATH)) {
      const stats = fs.statSync(VIDEO_PATH);
      console.log(`Video grabado exitosamente: ${VIDEO_PATH}`);
      console.log(`Tamaño del archivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Abrir el archivo automáticamente
      console.log('Abriendo el video...');
      execSync(`open ${VIDEO_PATH}`);
      
      return true;
    } else {
      console.error('El archivo de video no se generó');
      return false;
    }
  } catch (error) {
    console.error('Error al grabar la pantalla:', error);
    return false;
  }
}

async function main() {
  console.log(`Iniciando proceso de grabación (${new Date().toISOString()})...`);
  console.log('Este script grabará tu pantalla para crear un video de la animación.');
  console.log('Asegúrate de tener la aplicación en ejecución y visible en la pantalla.');
  console.log('=================================================================');
  
  try {
    // Verificar si ffmpeg está instalado
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
    } catch (error) {
      console.error('ERROR: ffmpeg no está instalado o no está en el PATH');
      console.error('Por favor, instala ffmpeg:');
      console.error('  - macOS: brew install ffmpeg');
      console.error('  - Linux: sudo apt-get install ffmpeg');
      console.error('  - Windows: descarga desde https://ffmpeg.org/download.html');
      process.exit(1);
    }
    
    const success = recordScreen();
    
    if (success) {
      console.log('Proceso completado con éxito.');
    } else {
      console.error('No se pudo completar la grabación.');
    }
  } catch (error) {
    console.error('Error en el proceso principal:', error);
  }
}

main(); 