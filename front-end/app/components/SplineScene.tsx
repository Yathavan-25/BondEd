/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'framer-motion';

// 1. DYNAMIC IMPORT: We use the standard react-spline, but strictly disable Server-Side Rendering (SSR)
// This prevents Next.js from crashing when trying to parse 3D WebGL on the server!
const Spline = dynamic(() => import('@splinetool/react-spline'), { 
  ssr: false,
  // Optional: A blank div that holds the space while the 3D scene loads in the browser
  loading: () => <div className="w-full h-full bg-transparent" /> 
});

export default function SplineScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use a Ref to hold the Spline engine to avoid re-render loops
  const splineApp = useRef<any>(null); 
  
  const isInView = useInView(containerRef, { margin: "200px" });

  useEffect(() => {
    if (!splineApp.current) return;

    if (isInView) {
      splineApp.current.play();
    } else {
      splineApp.current.stop(); // Frees up the GPU when scrolled away!
    }
  }, [isInView]);

  const handleLoad = (app: any) => {
    splineApp.current = app;
    
    // Safety check: if they already scrolled down by the time it loads, pause it
    if (!isInView) {
      app.stop();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full [&>canvas]:w-full! [&>canvas]:h-full! [&_canvas]:w-full! [&_canvas]:h-full!"
    >
      {/* Notice we are using the dynamically imported Spline here */}
      <Spline
        scene="https://prod.spline.design/yyrnSXM5GuJDvtAR/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad} 
      />
    </div>
  );
}