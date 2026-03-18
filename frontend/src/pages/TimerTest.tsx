import React, { useEffect, useState } from 'react';
import { RecordingTimerService, formatDuration } from 'utils/recording/RecordingTimerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

/**
 * Test page for RecordingTimerService
 * 
 * This page provides a UI to test all RecordingTimerService functionality:
 * - Start/Stop timer
 * - Pause/Resume functionality  
 * - External start time coordination
 * - Subscription system
 * - Duration formatting
 * - Edge case handling
 */
const TimerTest = () => {
  const [timer] = useState(() => new RecordingTimerService());
  const [duration, setDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    const unsubscribe = timer.subscribe((state) => {
      setDuration(state.currentTime);
      setIsRunning(state.isRunning);
      setStartTime(state.startTime);
      setSubscriberCount(timer.getSubscriberCount());
    });

    addLog('Timer service initialized and subscribed');

    return () => {
      unsubscribe();
      timer.destroy();
      addLog('Timer service destroyed');
    };
  }, [timer]);

  const handleStart = () => {
    timer.start();
    addLog('Timer started');
  };

  const handleStartWithExternalTime = () => {
    const externalTime = Date.now() - 5000; // 5 seconds ago
    timer.start({ externalStartTime: externalTime });
    addLog('Timer started with external time (5s ago)');
  };

  const handleStop = () => {
    const finalDuration = timer.getDuration();
    timer.stop();
    addLog(`Timer stopped - Final duration: ${finalDuration}s`);
  };

  const handlePause = () => {
    const pausedAt = timer.getDuration();
    timer.pause();
    addLog(`Timer paused at ${pausedAt}s`);
  };

  const handleResume = () => {
    timer.resume();
    addLog('Timer resumed');
  };

  const handleReset = () => {
    timer.reset();
    addLog('Timer reset');
  };

  const testMultipleSubscribers = () => {
    let updateCount = 0;
    const testSub = timer.subscribe((state) => {
      updateCount++;
      if (updateCount === 1) {
        addLog(`Test subscriber added (total: ${timer.getSubscriberCount()})`);
      }
    });

    setTimeout(() => {
      testSub();
      addLog(`Test subscriber removed (total: ${timer.getSubscriberCount()})`);
    }, 3000);
  };

  const runQuickTest = () => {
    addLog('Running quick automated test...');
    
    timer.start();
    
    setTimeout(() => {
      timer.pause();
      addLog('Auto-test: Paused');
      
      setTimeout(() => {
        timer.resume();
        addLog('Auto-test: Resumed');
        
        setTimeout(() => {
          const finalDuration = timer.getDuration();
          timer.stop();
          addLog(`Auto-test complete: ${finalDuration}s total`);
        }, 2000);
      }, 1000);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <NoIndexMeta />
      <Helmet>
        <title>RecordingTimerService Test</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">RecordingTimerService Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timer Display */}
        <Card>
          <CardHeader>
            <CardTitle>Timer Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-mono mb-4 p-4 bg-gray-100 rounded">
                {formatDuration(duration)}
              </div>
              <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
                <span>Status: {isRunning ? '🔴 Recording' : '⏹️ Stopped'}</span>
                <span>Subscribers: {subscriberCount}</span>
              </div>
              {startTime && (
                <div className="text-xs text-gray-500 mt-2">
                  Started: {new Date(startTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Timer Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleStart}
                disabled={isRunning}
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                Start
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isRunning}
                variant="default"
                className="bg-red-500 hover:bg-red-600"
              >
                Stop
              </Button>
              <Button
                onClick={handlePause}
                disabled={!isRunning}
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Pause
              </Button>
              <Button
                onClick={handleResume}
                disabled={isRunning}
                variant="default"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Resume
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
              >
                Reset
              </Button>
              <Button
                onClick={handleStartWithExternalTime}
                disabled={isRunning}
                variant="outline"
              >
                Start +5s
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Functions */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                onClick={testMultipleSubscribers}
                variant="outline"
                className="w-full"
              >
                Test Multiple Subscribers
              </Button>
              <Button
                onClick={runQuickTest}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                Run Automated Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {log.length === 0 ? (
                <div className="text-gray-500">No activity yet...</div>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className="mb-1">{entry}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>Manual Tests:</h4>
            <ul>
              <li><strong>Basic Operation:</strong> Start → Wait → Stop</li>
              <li><strong>Pause/Resume:</strong> Start → Pause → Wait → Resume → Stop</li>
              <li><strong>External Time:</strong> Use "Start +5s" to test coordination</li>
              <li><strong>Multiple Subscribers:</strong> Test subscription system</li>
              <li><strong>Edge Cases:</strong> Try multiple starts, stops when not running</li>
            </ul>
            <h4>Automated Test:</h4>
            <p>Runs a complete pause/resume cycle automatically</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimerTest;
