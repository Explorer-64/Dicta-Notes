import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_URL } from "app";
import { Helmet } from "react-helmet-async";
import { NoIndexMeta } from 'components/NoIndexMeta';

export default function AudioTest() {
  const [audioKey, setAudioKey] = useState<string>("audio_1d6145ba-4092-4479-b09f-1dcd53889969");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create audio element ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  // Update audio URL when key changes
  useEffect(() => {
    // Clean up previous audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // Reset states
    setAudioUrl(null);
    setError(null);
    setIsPlaying(false);
  }, [audioKey]);
  
  const testDirectUrl = () => {
    setError(null);
    const url = `${API_URL}/get_audio_file/${audioKey}`;
    console.log("Testing direct URL:", url);
    
    // Create a new audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Set up event listeners
    audioRef.current.onerror = (e) => {
      console.error("Audio loading error:", e);
      setError("Failed to load audio file");
      setAudioUrl(null);
    };
    
    audioRef.current.onloadeddata = () => {
      console.log("Audio loaded successfully");
      setAudioUrl(url);
    };
    
    // Load the audio
    audioRef.current.src = url;
    audioRef.current.load();
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Playback error:", err);
        setError("Could not play the audio file");
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  return (
    <>
    <NoIndexMeta />
    <div className="container mx-auto py-8">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Audio Test - Dicta-Notes</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Audio File Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input 
                value={audioKey} 
                onChange={(e) => setAudioKey(e.target.value)} 
                placeholder="Enter audio key"
                className="flex-grow"
              />
              <Button onClick={testDirectUrl}>Test Audio</Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-md">
                {error}
              </div>
            )}
            
            {audioUrl && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 text-green-500 rounded-md">
                  Audio file loaded successfully!
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={togglePlayback}
                    variant={isPlaying ? "destructive" : "default"}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                </div>
                
                <div className="mt-4">
                  <p><strong>Direct URL:</strong></p>
                  <div className="p-2 bg-muted rounded overflow-x-auto">
                    <code className="text-xs">{audioUrl}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
