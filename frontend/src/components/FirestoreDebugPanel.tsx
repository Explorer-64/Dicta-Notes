import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Eye, RefreshCw } from 'lucide-react';
import { verifyFirestoreSegments, watchFirestoreSegments } from 'utils/firestoreVerification';
import { mode, Mode } from '../constants';

interface Props {
  sessionId: string | null;
  isVisible?: boolean;
}

/**
 * Debug panel to verify that unified transcription is saving to Firestore
 * Shows real-time count of segments and allows manual verification
 * ONLY VISIBLE IN DEVELOPMENT MODE
 */
export function FirestoreDebugPanel({ sessionId, isVisible = true }: Props) {
  const [segmentCount, setSegmentCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Manual verification
  const handleVerify = async () => {
    if (!sessionId) {
      console.log('No session ID available');
      return;
    }
    
    console.log('🔍 Manual Firestore verification...');
    await verifyFirestoreSegments(sessionId);
  };

  // Start/stop watching Firestore
  useEffect(() => {
    if (!sessionId || !isVisible) {
      setIsWatching(false);
      return;
    }

    setIsWatching(true);
    
    const unsubscribe = watchFirestoreSegments(sessionId, (count) => {
      setSegmentCount(count);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    return () => {
      unsubscribe();
      setIsWatching(false);
    };
  }, [sessionId, isVisible]);

  // ONLY show in development mode
  if (mode !== Mode.DEV || !isVisible || !sessionId) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Firestore Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Segments in Firestore:</span>
          <Badge variant={segmentCount > 0 ? "default" : "secondary"}>
            {segmentCount}
          </Badge>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last update:</span>
            <span className="text-xs text-muted-foreground">{lastUpdate}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isWatching ? "default" : "secondary"}>
            {isWatching ? (
              <><Eye className="h-3 w-3 mr-1" /> Watching</>
            ) : (
              "Not watching"
            )}
          </Badge>
        </div>
        
        <Button 
          onClick={handleVerify} 
          size="sm" 
          variant="outline" 
          className="w-full"
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Verify Firestore
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Session: {sessionId.substring(0, 8)}...
        </p>
      </CardContent>
    </Card>
  );
}
