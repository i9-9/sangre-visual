# Sangre Visual

Proyecto de animación visual interactiva.

## Renderización a Video

Para crear un video de la animación, sigue estos pasos:

1. **Instala las dependencias necesarias**:

```bash
npm install puppeteer fluent-ffmpeg
```

También necesitarás tener FFmpeg instalado en tu sistema:
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`
- **Windows**: Descárgalo desde https://ffmpeg.org/download.html y configura la variable PATH

2. **Ejecuta el script de renderizado**:

```bash
npm run render
```

Esto generará un video en la carpeta `output/sangre_animation.mp4`.

3. **Personalización del renderizado**:

Puedes modificar estos parámetros en el archivo `scripts/render-video.js`:

- `FPS`: Cuadros por segundo (predeterminado: 30)
- `DURATION`: Duración del video en segundos (predeterminado: 20)
- `VIEWPORT`: Resolución del video (predeterminado: 1920x1080)
- `URL`: URL de la aplicación (predeterminado: http://localhost:3000)

Para renderizar un modo específico, puedes modificar la URL con parámetros:

- Modo claro: `http://localhost:3000?render=true&mode=light`
- Modo oscuro: `http://localhost:3000?render=true&mode=dark`
- Modo video específico: `http://localhost:3000?render=true&mode=video&videoIndex=0`

## Ejecución del Proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar la versión de producción
npm run start
```

Visita http://localhost:3000 en tu navegador para ver la aplicación.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
