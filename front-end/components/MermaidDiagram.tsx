'use client'

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        setError(false);
        setSvgContent(null);
        
        // Ensure a unique ID for each render
        const id = `mermaid-chart-${Math.random().toString(36).substring(2, 9)}`;
        
        const { svg } = await mermaid.render(id, chart);
        
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-500 rounded-xl border border-red-100 h-48">
        <p className="font-bold">Failed to render diagram.</p>
        <p className="text-xs text-red-400 mt-2 text-center overflow-auto max-h-24 max-w-full">
          The AI generated invalid flowchart syntax.
        </p>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-[#1363CB]" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center bg-white p-4 overflow-auto rounded-xl w-full h-full min-h-[12rem] shadow-sm [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
