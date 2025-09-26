import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Point {
  x: number;
  y: number;
}

interface CanvasProps {
  color: string;
  size: number;
  onCapture: (imageData: string) => void;
  onClear: () => void;
}

export interface CanvasRef {
  toDataURL: () => string;
  clear: () => void;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ color, size, onCapture, onClear }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (!canvasRef.current) return '';
      // Ensure we're getting the full canvas data at the correct resolution
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
  
      // Get the actual drawing bounds
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      let left = canvas.width;
      let right = 0;
      let top = canvas.height;
      let bottom = 0;
  
      // Find the bounds of the actual drawing
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
  
      // Add padding
      const padding = 20;
      left = Math.max(0, left - padding);
      right = Math.min(canvas.width, right + padding);
      top = Math.max(0, top - padding);
      bottom = Math.min(canvas.height, bottom + padding);
  
      // If there's no drawing, return the full canvas
      if (left >= right || top >= bottom) {
        return canvas.toDataURL('image/png');
      }
  
      // Create a new canvas with just the drawing
      const tempCanvas = document.createElement('canvas');
      const width = right - left;
      const height = bottom - top;
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return canvas.toDataURL('image/png');
  
      // Copy the relevant portion
      tempCtx.drawImage(
        canvas,
        left, top, width, height,
        0, 0, width, height
      );
  
      return tempCanvas.toDataURL('image/png');
    },
    clear: () => {
      clearCanvas();
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getPoint(e);
    setIsDrawing(true);
    setLastPoint(point);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPoint = getPoint(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastPoint(currentPoint);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full border border-border rounded-lg touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
});