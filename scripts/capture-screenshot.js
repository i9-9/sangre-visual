import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const OUTPUT_DIR = path.join(__dirname, '../output');
const SCREENSHOT_PATH = path.join(OUTPUT_DIR, 'sangre_screenshot.png');
const VIEWPORT = { width: 1920, height: 1080 }; // Resolución Full HD para mejor calidad
const URL = 'http://localhost:3000?render=true&mode=video&videoIndex=0';

// Asegurar que el directorio exista
if (!fs.existsSync(OUTPUT_DIR)) {
  console.log(`Creando directorio de salida: ${OUTPUT_DIR}`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshot() {
  console.log('Iniciando captura de screenshot...');
  
  // Encontrar Chrome instalado en Mac
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  // Verificar si existe
  if (!fs.existsSync(executablePath)) {
    console.error('No se encontró Chrome en la ruta esperada. Instala Chrome o ajusta la ruta.');
    return false;
  }
  
  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: false,
      defaultViewport: VIEWPORT,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Navegador iniciado correctamente');
    const page = await browser.newPage();
    
    // Configurar viewport de alta resolución
    await page.setViewport(VIEWPORT);
    
    // Navegar a la URL
    console.log(`Navegando a ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Esperar a que se cargue la animación
    console.log('Esperando a que el canvas aparezca...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // Esperar un poco más para que la animación se estabilice
    // Reemplazar waitForTimeout con una promesa setTimeout
    console.log('Esperando para que la animación se estabilice (10 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Capturar screenshot
    console.log(`Guardando screenshot en ${SCREENSHOT_PATH}...`);
    await page.screenshot({ 
      path: SCREENSHOT_PATH,
      type: 'png',
      fullPage: true
      // Quitar quality que no es compatible con PNG
    });
    
    await browser.close();
    console.log('Screenshot capturado exitosamente.');
    return true;
  } catch (error) {
    console.error('Error durante la captura:', error);
    return false;
  }
}

// Punto de entrada principal
async function main() {
  console.log(`Iniciando proceso de captura (${new Date().toISOString()})...`);
  
  try {
    const success = await captureScreenshot();
    
    if (success) {
      console.log(`Screenshot guardado en: ${SCREENSHOT_PATH}`);
      
      // Verificar que el archivo existe
      if (fs.existsSync(SCREENSHOT_PATH)) {
        const stats = fs.statSync(SCREENSHOT_PATH);
        console.log(`Tamaño del archivo: ${(stats.size / 1024).toFixed(2)} KB`);
      } else {
        console.error('El archivo no existe después de la captura.');
      }
    } else {
      console.error('No se pudo capturar el screenshot.');
    }
  } catch (error) {
    console.error('Error en el proceso:', error);
  }
}

main(); 