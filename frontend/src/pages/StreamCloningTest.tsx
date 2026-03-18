import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

export default function StreamCloningTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const originalStreamRef = useRef<MediaStream | null>(null);
  const clonedStreamRef = useRef<MediaStream | null>(null);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[StreamTest] ${message}`);
  };
  
  const testBasicCloning = async () => {
    try {
      setLogs([]);
      addLog('🎯 Starting basic MediaStream cloning test...');
      
      // Step 1: Capture original stream
      addLog('Step 1: Capturing original microphone stream...');
      const originalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      originalStreamRef.current = originalStream;
      
      // Log original track state
      const originalTrack = originalStream.getAudioTracks()[0];
      addLog(`Original track: readyState=${originalTrack.readyState}, enabled=${originalTrack.enabled}`);
      
      // Step 2: Clone the track
      addLog('Step 2: Cloning audio track...');
      const clonedTrack = originalTrack.clone();
      
      // Log cloned track state immediately
      addLog(`Cloned track (immediate): readyState=${clonedTrack.readyState}, enabled=${clonedTrack.enabled}`);
      
      // Step 3: Create new MediaStream with cloned track
      const clonedStream = new MediaStream([clonedTrack]);
      clonedStreamRef.current = clonedStream;
      
      // Log stream states
      addLog(`Original stream: active=${originalStream.active}, tracks=${originalStream.getAudioTracks().length}`);
      addLog(`Cloned stream: active=${clonedStream.active}, tracks=${clonedStream.getAudioTracks().length}`);
      
      // Step 4: Test audio data flow with AudioContext
      addLog('Step 3: Testing audio data flow through cloned track...');
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(clonedStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Monitor audio levels for 3 seconds
      let sampleCount = 0;
      const monitor = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length) / 255;
        addLog(`Audio sample ${sampleCount++}: RMS=${rms.toFixed(4)}, cloned track readyState=${clonedTrack.readyState}`);
        
        if (sampleCount >= 10) {
          clearInterval(monitor);
          addLog('✅ Audio monitoring complete');
          audioCtx.close();
          setIsCapturing(false);
        }
      }, 300);
      
      setIsCapturing(true);
      addLog('🎉 Test started! Please speak into your microphone...');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
      setIsCapturing(false);
    }
  };
  
  const stopTest = () => {
    if (originalStreamRef.current) {
      originalStreamRef.current.getTracks().forEach(track => track.stop());
      originalStreamRef.current = null;
    }
    if (clonedStreamRef.current) {
      clonedStreamRef.current.getTracks().forEach(track => track.stop());
      clonedStreamRef.current = null;
    }
    setIsCapturing(false);
    addLog('🛑 Test stopped and streams cleaned up');
  };
  
  return (
    <div className="container mx-auto p-8">
      <NoIndexMeta />
      <Card>
        <CardHeader>
          <CardTitle>MediaStream Track Cloning Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test basic MediaStream track cloning to verify readyState preservation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testBasicCloning}
              disabled={isCapturing}
              className="flex items-center gap-2"
            >
              🎯 Start Cloning Test
            </Button>
            
            <Button 
              onClick={stopTest}
              disabled={!isCapturing}
              variant="destructive"
              className="flex items-center gap-2"
            >
              🛑 Stop Test
            </Button>
          </div>
          
          {/* Test Logs */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">Test Logs:</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">Click "Start Cloning Test" to begin...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
