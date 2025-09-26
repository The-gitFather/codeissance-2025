import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";

interface AnalysisProps {
  analysis: string | null;
}

export const Analysis = ({ analysis }: AnalysisProps) => {
  return (
    <Card className="h-full max-h-[560px]"> {/* Fixed height card */}
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>Analysis Result</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-7rem)] overflow-y-auto">
        {analysis === null ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="text-center">
              <p>Draw something on the canvas</p>
              <p className="text-sm">I'll try to understand what you've drawn</p>
            </div>
          </div>
        ) : analysis === '' ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Analyzing your drawing...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="whitespace-pre-wrap">{analysis}</p>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              <p>Need to make changes? Clear the canvas and try again!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};