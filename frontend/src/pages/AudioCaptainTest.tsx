import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { audioCaptain } from '../utils/recording/audioCaptain';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

/**
 * Dedicated test page for Audio Captain testing
 * Route: /audio-captain-test
 * Purpose: Test our "Audio Captain" in complete isolation
 */
export default function AudioCaptainTest() {
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
      addLog('🚀 Starting Audio Captain test...');
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
      
      // Step 4: Test audio levels (basic check)
      addLog('Step 3: Testing audio activity...');
      setTimeout(() => {
        const tracks = originalStream.getAudioTracks();
        if (tracks.length > 0) {
          addLog(`✅ Audio track active: ${tracks[0].readyState}`);
        }
      }, 1000);
      
      addLog('🎉 Test successful! Audio Captain is working.');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
      setIsRecording(false);
    }
  };

  const stopTest = () => {
    addLog('🛑 Stopping Audio Captain test...');
    
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
    <>
    <NoIndexMeta />
    <Helmet>
      <title>Audio Captain Test - Dicta-Notes</title>
    </Helmet>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Audio Captain Test Lab
          </h1>
          <p className="text-gray-600">
            Testing our "Audio Captain" in isolation before connecting to recording systems
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            ⚠️ This is a development test page - not part of public UI
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={startTest} 
                disabled={isRecording}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isRecording ? '🔄 Testing...' : '▶️ Start Audio Test'}
              </Button>
              
              <Button 
                onClick={stopTest} 
                disabled={!isRecording}
                variant="destructive"
                size="lg"
              >
                ⏹️ Stop Test
              </Button>
              
              <Button 
                onClick={clearLogs} 
                variant="outline"
                size="lg"
              >
                🗑️ Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Display */}
        {status && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">📊 Audio Captain Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <strong>Capturing:</strong> 
                    <span className={status.isCapturing ? 'text-green-600' : 'text-red-600'}>
                      {status.isCapturing ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Original Stream:</strong> 
                    <span className={status.hasOriginalStream ? 'text-green-600' : 'text-red-600'}>
                      {status.hasOriginalStream ? '✅ Active' : '❌ None'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <strong>Active Copies:</strong> 
                    <span className="font-mono">{status.activeCopies}</span>
                  </div>
                  <div>
                    <strong>Consumers:</strong>
                    <ul className="ml-4 mt-1">
                      {status.consumers.map((consumer: any, i: number) => (
                        <li key={i} className="text-xs flex justify-between">
                          <span>{consumer.consumer}</span>
                          <span className={consumer.streamActive ? 'text-green-600' : 'text-red-600'}>
                            {consumer.streamActive ? '✅' : '❌'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  💡 No logs yet. Start a test to see detailed logs here.
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 leading-relaxed">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">📋 Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Start Audio Test" and grant audio permissions when prompted</li>
              <li>Choose "Share tab audio" or "Share system audio" for best results</li>
              <li>Check that status shows capturing and active copies</li>
              <li>Verify logs show successful audio capture and stream cloning</li>
              <li>Click "Stop Test" to clean up when finished</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
