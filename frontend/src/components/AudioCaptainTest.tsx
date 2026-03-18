import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { audioCaptain, AudioCaptain } from '../utils/recording/audioCaptain';

/**
 * Simple test component to verify Audio Captain works in isolation
 * Tests:
 * - System audio capture
 * - Stream cloning
 * - Cleanup
 */
export function AudioCaptainTest() {
  const [status, setStatus] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [testStreams, setTestStreams] = useState<MediaStream[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const startTest = async () => {
    try {
      addLog('Starting Audio Captain test...');
      setIsRecording(true);
      
      // Step 1: Capture audio
      addLog('Step 1: Capturing system audio...');
      const originalStream = await audioCaptain.captureAudio();
      addLog(`✅ Audio captured! Tracks: ${originalStream.getAudioTracks().length}`);
      
      // Step 2: Create clones
      addLog('Step 2: Creating stream clones...');
      const clone1 = await audioCaptain.createStreamCopy('test-1', 'Test Consumer 1');
      const clone2 = await audioCaptain.createStreamCopy('test-2', 'Test Consumer 2');
      
      setTestStreams([clone1, clone2]);
      addLog(`✅ Created 2 clones: ${clone1.getAudioTracks().length} + ${clone2.getAudioTracks().length} tracks`);
      
      // Step 3: Check status
      const currentStatus = audioCaptain.getStatus();
      setStatus(currentStatus);
      addLog(`✅ Status: ${currentStatus.activeCopies} active copies`);
      
      addLog('🎉 Test successful! Audio Captain is working.');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
      setIsRecording(false);
    }
  };

  const stopTest = () => {
    addLog('Stopping Audio Captain test...');
    
    // Clean up test streams
    testStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    setTestStreams([]);
    
    // Stop Audio Captain
    audioCaptain.stopAllCapture();
    
    setIsRecording(false);
    setStatus(null);
    addLog('✅ Test stopped and cleaned up');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Captain Test Lab 🧪</CardTitle>
          <p className="text-sm text-gray-600">
            Testing our "Audio Captain" in isolation before connecting to recording systems
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startTest} 
              disabled={isRecording}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRecording ? 'Testing...' : 'Start Audio Test'}
            </Button>
            
            <Button 
              onClick={stopTest} 
              disabled={!isRecording}
              variant="destructive"
            >
              Stop Test
            </Button>
            
            <Button 
              onClick={clearLogs} 
              variant="outline"
            >
              Clear Logs
            </Button>
          </div>

          {status && (
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Audio Captain Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Capturing:</strong> {status.isCapturing ? '✅ Yes' : '❌ No'}
                  </div>
                  <div>
                    <strong>Original Stream:</strong> {status.hasOriginalStream ? '✅ Active' : '❌ None'}
                  </div>
                  <div>
                    <strong>Active Copies:</strong> {status.activeCopies}
                  </div>
                  <div>
                    <strong>Consumers:</strong>
                    <ul className="ml-4">
                      {status.consumers.map((consumer: any, i: number) => (
                        <li key={i} className="text-xs">
                          {consumer.consumer} ({consumer.streamActive ? '✅' : '❌'})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet. Start a test to see logs here.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
