'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Analysis } from './Analysis';
import { useToast } from '@/hooks/use-toast';
import { Controls } from './Controls';

export const Whiteboard = () => {
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const editorRef = useRef(null);
  const { toast } = useToast();

  // Handle tldraw editor mount
  const handleMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      
      if (!editorRef.current) {
        toast({
          title: 'No Whiteboard Data',
          description: 'Please draw something on the whiteboard first.',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }

      // Check if there are any shapes on the canvas
      const editor = editorRef.current;
      const shapeIds = editor.getCurrentPageShapeIds();
      
      if (shapeIds.size === 0) {
        toast({
          title: 'Empty Whiteboard',
          description: 'Please draw something on the whiteboard first.',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }
      
      // Use the built-in toImage method from tldraw
      const { blob, width, height } = await editor.toImage([...shapeIds], { 
        format: 'png',
        background: true,
        padding: 32,
        scale: 2, // Higher resolution
      });
      
      // Convert blob to base64 for API submission
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const imageData = reader.result;
        
        // Send to server API for analysis
        try {
          const response = await fetch('/api/analyze-whiteboard', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData }),
          });

          if (!response.ok) {
            throw new Error('Analysis failed on server');
          }

          const { analysis: analysisResult } = await response.json();
          setAnalysis(analysisResult);
        } catch (apiError) {
          console.error('API error:', apiError);
          toast({
            title: 'Analysis Failed',
            description: `Failed to analyze the whiteboard: ${apiError.message}`,
            variant: 'destructive',
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({
          title: 'Image Processing Failed',
          description: 'Failed to process the whiteboard image.',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
      };
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: `Failed to analyze the whiteboard: ${error.message}`,
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    if (editorRef.current) {
      // Clear the canvas by deleting all shapes
      const editor = editorRef.current;
      editor.selectAll();
      editor.deleteShapes();
      setAnalysis(null);
    }
  };

  const handleDownload = async () => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const shapeIds = editor.getCurrentPageShapeIds();
    
    if (shapeIds.size === 0) {
      toast({
        title: 'Empty Whiteboard',
        description: 'Please draw something on the whiteboard first.',
        variant: 'destructive',
      });
      return;
    }
    
    const { blob } = await editor.toImage([...shapeIds], { 
      format: 'png', 
      background: true,
      padding: 32,
      scale: 2,
    });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'whiteboard-export.png';
    link.click();
    URL.revokeObjectURL(link.href);
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
        onDownload={handleDownload}
        isAnalyzing={isAnalyzing}
        editorRef={editorRef}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="aspect-video bg-white rounded-xl shadow-sm overflow-hidden">
            <Tldraw
              onMount={handleMount}
              autoFocus
              className="h-full w-full"
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