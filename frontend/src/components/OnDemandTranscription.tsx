import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from 'utils/firebase';

interface OnDemandTranscriptionProps {
  sessionId: string;
  onTranscriptionComplete?: () => void;
}

export function OnDemandTranscription({ sessionId, onTranscriptionComplete }: OnDemandTranscriptionProps) {
  const [transcriptionStatus, setTranscriptionStatus] = useState<'none' | 'processing' | 'completed' | 'failed'>('none');
  const [isInitiating, setIsInitiating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for transcription status updates
  useEffect(() => {
    console.log(`[OnDemandTranscription] Setting up Firestore listener for session: ${sessionId}`);
    const sessionRef = doc(db, 'sessions', sessionId);
    
    const unsubscribe = onSnapshot(
      sessionRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const status = data.transcription_status || 'none';
          const error = data.transcription_error || null;
          console.log(`[OnDemandTranscription] Status update: ${status}`, { 
            status, 
            error,
            hasTranscript: !!data.transcript_data,
            hasFullText: !!data.full_text
          });
          
          setTranscriptionStatus(status);
          
          // Simulate progress for processing state
          if (status === 'processing') {
            // Start progress animation
            let currentProgress = 0;
            const progressInterval = setInterval(() => {
              currentProgress += Math.random() * 5;
              if (currentProgress >= 90) {
                currentProgress = 90; // Cap at 90% until completion
                clearInterval(progressInterval);
              }
              setProgress(currentProgress);
            }, 800);
            
            return () => clearInterval(progressInterval);
          } else if (status === 'completed') {
            setProgress(100);
            setError(null);
            toast.success('Transcription completed successfully!');
            // Call completion callback after a short delay
            setTimeout(() => {
              onTranscriptionComplete?.();
            }, 1000);
          } else if (status === 'failed') {
            setProgress(0);
            const errorMessage = error || 'Transcription failed. Please try again.';
            console.error(`[OnDemandTranscription] Transcription failed: ${errorMessage}`);
            setError(errorMessage);
            toast.error(`Transcription failed: ${errorMessage}`);
          }
        } else {
          console.warn(`[OnDemandTranscription] Session document does not exist: ${sessionId}`);
        }
      },
      (error) => {
        console.error('[OnDemandTranscription] Error listening to session updates:', error);
        setError('Failed to monitor transcription status');
      }
    );

    return () => {
      console.log(`[OnDemandTranscription] Cleaning up Firestore listener for session: ${sessionId}`);
      unsubscribe();
    };
  }, [sessionId, onTranscriptionComplete]);

  const handleStartTranscription = async () => {
    console.log(`[OnDemandTranscription] Starting transcription for session: ${sessionId}`);
    setIsInitiating(true);
    setError(null);
    
    try {
      console.log(`[OnDemandTranscription] Calling API: initiate_on_demand_transcription(${sessionId})`);
      const response = await brain.initiate_on_demand_transcription(sessionId);
      console.log(`[OnDemandTranscription] API response status: ${response.status}, ok: ${response.ok}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[OnDemandTranscription] API response data:`, result);
        toast.success('Transcription started in background');
        setProgress(10); // Initial progress
      } else {
        const errorText = await response.text();
        console.error(`[OnDemandTranscription] API error: ${response.status} - ${errorText}`);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || 'Failed to start transcription' };
        }
        throw new Error(errorData.detail || 'Failed to start transcription');
      }
    } catch (error) {
      console.error('[OnDemandTranscription] Error starting transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription';
      setError(errorMessage);
      toast.error(`Failed to start transcription: ${errorMessage}`);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setTranscriptionStatus('none');
    setProgress(0);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mt-1">
            Generate transcript using AI speech recognition
          </div>
        </div>
        <CardTitle>Meeting Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          {transcriptionStatus === 'none' && (
            <>
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-6">
                No transcript available for this session.
              </p>
              <Button 
                onClick={handleStartTranscription} 
                disabled={isInitiating}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 text-lg rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                {isInitiating ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                {isInitiating ? 'Starting...' : 'Click here to transcribe this Audio'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This process may take a few minutes depending on audio length
              </p>
            </>
          )}
          
          {transcriptionStatus === 'processing' && (
            <>
              <div className="relative mb-4">
                <FileText className="w-12 h-12 mx-auto opacity-20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Transcribing audio in background...
              </p>
              <div className="max-w-xs mx-auto">
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                You can navigate away - the page will update automatically when complete
              </p>
            </>
          )}
          
          {transcriptionStatus === 'failed' && (
            <>
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-4">
                {error || 'Transcription failed. Please try again.'}
              </p>
              <Button 
                onClick={handleRetry} 
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </>
          )}
          
          {transcriptionStatus === 'completed' && (
            <>
              <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-green-600 mb-4">
                Transcription completed successfully!
              </p>
              <p className="text-xs text-muted-foreground">
                The page will refresh to show your transcript...
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
