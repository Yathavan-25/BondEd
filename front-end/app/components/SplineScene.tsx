/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'framer-motion';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />
});

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    if ('isContextLost' in gl && (gl as WebGLRenderingContext).isContextLost()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function VideoFallback() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-80"
      >
        <source src="/animations/square-chips.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
    </div>
  );
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("WebGL threw error, switching to 3D Canvas Mesh fallback:", error);
    if (this.props.onError) this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function SplineScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineApp = useRef<any>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const isInView = useInView(containerRef, { margin: "0px" });

  useEffect(() => {
    if (!checkWebGLSupport()) {
      setHasError(true);
    }

    const handleWebGLError = () => setHasError(true);
    window.addEventListener('webglcontextcreationerror', handleWebGLError);
    return () => window.removeEventListener('webglcontextcreationerror', handleWebGLError);
  }, []);

  useEffect(() => {
    if (!splineApp.current) return;
    if (isInView) {
      splineApp.current.play?.();
    } else {
      splineApp.current.stop?.();
    }
  }, [isInView]);

  const handleLoad = (app: any) => {
    splineApp.current = app;
    if (!isInView) {
      app.stop?.();
    }
  };

  if (hasError) {
    return <VideoFallback />;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full [&>canvas]:w-full! [&>canvas]:h-full! [&_canvas]:w-full! [&_canvas]:h-full!"
    >
      <WebGLErrorBoundary fallback={<VideoFallback />} onError={() => setHasError(true)}>
        <Spline
          scene="https://prod.spline.design/yyrnSXM5GuJDvtAR/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleLoad}
          onError={() => setHasError(true)}
        />
      </WebGLErrorBoundary>
    </div>
  );
}