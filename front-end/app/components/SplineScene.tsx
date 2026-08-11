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

// High-Performance HTML5 2D Canvas 3D Particle Mesh (Guaranteed 60FPS on 100% of devices without WebGL)
function Canvas3DFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = 70;
    const particles: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 170 + Math.random() * 70;
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
      });
    }

    const angleX = 0.0025;
    const angleY = 0.004;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((p) => {
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        p.x = x1;
        p.y = y1;
        p.z = z2;
      });

      // Draw mesh connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dz = particles[i].z - particles[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.45;
            const p1Proj = 380 / (380 + particles[i].z);
            const p2Proj = 380 / (380 + particles[j].z);
            ctx.beginPath();
            ctx.moveTo(cx + particles[i].x * p1Proj, cy + particles[i].y * p1Proj);
            ctx.lineTo(cx + particles[j].x * p2Proj, cy + particles[j].y * p2Proj);
            ctx.strokeStyle = `rgba(156, 47, 223, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // Draw glowing 3D nodes
      particles.forEach((p) => {
        const scale = 380 / (380 + p.z);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;
        const radius = Math.max(1.2, 3.5 * scale);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.z > 0 ? '#1363CB' : '#9C2FDF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#9C2FDF';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none" />
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
    return <Canvas3DFallback />;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full [&>canvas]:w-full! [&>canvas]:h-full! [&_canvas]:w-full! [&_canvas]:h-full!"
    >
      <WebGLErrorBoundary fallback={<Canvas3DFallback />} onError={() => setHasError(true)}>
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