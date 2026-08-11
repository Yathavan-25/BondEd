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
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch {
    return false;
  }
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
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
    console.warn("WebGL unavailable or threw error, switching to 3D video fallback:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
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
        <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-purple-and-blue-mesh-40871-large.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />
    </div>
  );
}

export default function SplineScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineApp = useRef<any>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const isInView = useInView(containerRef, { margin: "0px" });

  useEffect(() => {
    setIsSupported(checkWebGLSupport());
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

  if (!isSupported) {
    return <VideoFallback />;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full [&>canvas]:w-full! [&>canvas]:h-full! [&_canvas]:w-full! [&_canvas]:h-full!"
    >
      <WebGLErrorBoundary fallback={<VideoFallback />}>
        <Spline
          scene="https://prod.spline.design/yyrnSXM5GuJDvtAR/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleLoad} 
        />
      </WebGLErrorBoundary>
    </div>
  );
}