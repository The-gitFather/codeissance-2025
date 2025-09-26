'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

/**
 * AnalysisProps Interface
 * 
 * Defines the props for the Analysis component:
 * - analysis: string | null - The text content of the analysis from the AI,
 *   or null if no analysis is available yet
 */
interface AnalysisProps {
  analysis: string | null;
}

export const Analysis: React.FC<AnalysisProps> = ({ analysis }) => {
  // Function to format the AI response if needed
  const formatAnalysis = (text: any) => {
    if (!text) return '';
    
    // If text already contains markdown, we can return it as is
    return text;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Whiteboard Analysis</CardTitle>
        <CardDescription>
          AI-powered analysis of your whiteboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)] pr-4">
          {analysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{formatAnalysis(analysis)}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-center">
              <p>No analysis available yet.</p>
              <p className="text-sm mt-2">
                Draw on the whiteboard and click "Analyze" to get insights.
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};