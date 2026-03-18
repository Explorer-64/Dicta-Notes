import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import brain from '../brain';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

/**
 * Test page for cleaning up empty Firestore sessions to fix memory issues
 */
export default function MemoryCleanupTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runCleanup = async (dryRun: boolean = true) => {
    setIsLoading(true);
    try {
      const response = await brain.cleanup_firestore_sessions({ dry_run: dryRun });
      const data = await response.json();
      setResult(data);
      
      if (dryRun) {
        toast.info(`Dry run: Would delete ${data.total_sessions} sessions`);
      } else {
        toast.success(`Cleanup complete: Deleted ${data.total_sessions} sessions`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Cleanup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <NoIndexMeta />
      <Card>
        <CardHeader>
          <CardTitle>Memory Cleanup Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This page helps clean up empty Firestore sessions that are causing memory issues.
              The app is loading 669 empty sessions into memory, consuming ~200MB+.
            </AlertDescription>
          </Alert>
          
          <div className="space-x-4">
            <Button 
              onClick={() => runCleanup(true)} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Running...' : 'Dry Run (Preview)'}
            </Button>
            
            <Button 
              onClick={() => runCleanup(false)} 
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? 'Running...' : 'Actually Delete Sessions'}
            </Button>
          </div>
          
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Cleanup Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
