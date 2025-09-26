'use client';

import React, { useState, useRef } from 'react';
import { Canvas, CanvasRef } from './Canvas';
import { Analysis } from './Analysis';
import { useToast } from '@/hooks/use-toast';
import { Controls } from './Controls';

export const Whiteboard: React.FC = () => {
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const canvasRef = useRef<CanvasRef>(null);
  const { toast } = useToast();

  // In your Whiteboard component
const handleAnalyze = async () => {
  try {
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL();
    
    const response = await fetch('/api/analyze-whiteboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const { analysis } = await response.json();
    console.log(analysis);
    setAnalysis(analysis);
  } catch (error) {
    toast({
      title: 'Analysis Failed',
      description: 'Failed to analyze the drawing. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setIsAnalyzing(false);
  }
};

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setAnalysis(null);
    }
  };

  return (
    <div className="space-y-4">
      <Controls
        color={color}
        size={size}
        onColorChange={setColor}
        onSizeChange={setSize}
        onClear={handleClear}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="aspect-video bg-card rounded-xl shadow-sm">
            <Canvas
              ref={canvasRef}
              color={color}
              size={size}
              onCapture={handleAnalyze}
              onClear={() => setAnalysis(null)}
            />
          </div>
        </div>
        <div className="lg:col-span-1">
          <Analysis analysis={analysis} />
        </div>
      </div>
    </div>
  );
};