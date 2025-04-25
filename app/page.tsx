'use client';

// import SangreSVG from './components/SangreSVG';
import SangreCanvas from './components/SangreCanvas';
// import CircleAnimation from './components/CircleAnimation';
// import CanvasAnimation from './components/CanvasAnimation';

export default function Home() {
  return (
    <main className="main">
      <div className="container">
        {/* <SangreSVG /> */}
        <SangreCanvas />
        {/* <CanvasAnimation /> */}
      </div>
    </main>
  );
}
