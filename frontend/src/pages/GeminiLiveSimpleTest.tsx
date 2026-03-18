import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Square, Wifi, WifiOff } from 'lucide-react';
import { useGeminiLiveV2 } from 'utils/useGeminiLiveV2';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUserGuardContext } from 'app';
import { useEffect } from 'react';
import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

/**
 * Gemini Live WebSocket Test (V2 wrapper)
 *
 * IMPORTANT: Logic is IDENTICAL to the previously working inline version.
 * We only wrapped it via useGeminiLiveV2 to keep code organized without changing behavior.
 */
export default function GeminiLiveSimpleTest() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  
  // Admin-only access (Abe's user ID)
  const ADMIN_UID = 'a6oQ5CjOv9dlwEIsDEmgmZcfdfk1';
  
  useEffect(() => {
    if (user.uid !== ADMIN_UID) {
      console.warn('Access denied: Admin only');
      navigate('/');
    }
  }, [user.uid, navigate]);
  
  // If not admin, show nothing while redirecting
  if (user.uid !== ADMIN_UID) {
    return null;
  }

  const [title, setTitle] = useState('');
  
  const {
    isRecording,
    isConnected,
    status,
    segments,
    start,
    stop,
    clear,
    saveSession,
    debug,
  } = useGeminiLiveV2();
  
  const handleStop = async () => {
    stop();
    
    if (segments.length > 0) {
      const sessionId = await saveSession(title);
      if (sessionId) {
        toast.success('Session saved!', {
          description: 'Your transcription has been saved',
          action: {
            label: 'View Session',
            onClick: () => navigate(`/session-detail?id=${sessionId}`)
          },
          duration: 10000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <NoIndexMeta />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Gemini Live WebSocket Test</h1>
          <p className="text-muted-foreground">
            Simple one-page test with system audio capture
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge className="bg-green-500">
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {isRecording && (
                  <Badge className="bg-red-500 animate-pulse">
                    <Monitor className="w-3 h-3 mr-1" />
                    Recording
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{status}</p>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter session title..."
                  disabled={isRecording}
                />
              </div>
              
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button 
                    onClick={start}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    Start System Audio Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStop}
                    variant="destructive"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop & Save Recording
                  </Button>
                )}
                
                <Button
                  onClick={clear}
                  variant="outline"
                  disabled={segments.length === 0}
                >
                  Clear Transcription
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Important:</strong> When the browser prompts you to share your screen:
                <br />1. Select the tab/window playing audio
                <br />2. <strong>Check the "Share audio" checkbox</strong>
                <br />3. Click "Share"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transcription Display */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transcription ({segments.length} segments)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {segments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No transcription yet. Start recording to see results.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {segments.map((segment, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-muted rounded-md"
                  >
                    <p className="text-sm">
                      {segment.speaker ? (
                        <>
                          <span className="font-medium">{segment.speaker}:</span> {segment.text}
                        </>
                      ) : (
                        <>{segment.text}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono space-y-1">
              <div>WebSocket: {debug.wsActive ? 'Active' : 'Null'}</div>
              <div>Audio Stream: {debug.audioStreamActive ? 'Active' : 'Null'}</div>
              <div>Audio Context: {debug.audioContextActive ? 'Active' : 'Null'}</div>
              <div>Processor: {debug.processorActive ? 'Active' : 'Null'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
