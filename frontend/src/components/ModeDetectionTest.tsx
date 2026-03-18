import { Mode, mode } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export function ModeDetectionTest() {
  const [testResult, setTestResult] = useState<string>("");
  
  const runModeTest = () => {
    const currentMode = mode;
    const isDev = mode === Mode.DEV;
    const isProd = mode === Mode.PROD;
    
    const result = `
Current mode: ${currentMode}
Is DEV: ${isDev}
Is PROD: ${isProd}
Mode.DEV value: ${Mode.DEV}
Mode.PROD value: ${Mode.PROD}
Vite env mode: ${(import.meta as any).env?.MODE || 'not available'}
Node env: ${(import.meta as any).env?.NODE_ENV || 'not available'}
    `;
    
    setTestResult(result);
    console.log("Mode Detection Test:", result);
  };
  
  // Test if error boundary would show in current mode
  const testErrorBoundary = () => {
    throw new Error("Test error to trigger UserErrorBoundary");
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mode Detection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runModeTest} className="w-full">
          Test Mode Detection
        </Button>
        
        <Button 
          onClick={testErrorBoundary} 
          variant="destructive"
          className="w-full"
        >
          Test Error Display (WILL BREAK PAGE)
        </Button>
        
        {testResult && (
          <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">
            {testResult}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
