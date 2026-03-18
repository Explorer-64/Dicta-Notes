import React, { useState, useEffect, useRef } from "react";
import { auth } from "app"; // Import auth for getting the token
import { API_URL } from "app";
import { Play, Pause, Volume2, Music, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type WaveSurfer from "wavesurfer.js";
import { createWaveSurfer } from "utils/lazyWaveSurfer";
import { recordingTimer } from "utils/recording/RecordingTimerService";

interface AudioPlaybackProps {
  audioKey?: string | null;
  audioUrl?: string | null;
  sessionId: string;
  sessionDuration?: number; // Add session duration prop
  className?: string;
  useUnifiedTimer?: boolean; // Option to use master clock
}

export function AudioPlayback({ audioKey, audioUrl, sessionId, sessionDuration, className = "", useUnifiedTimer = false }: AudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccessToModule, setHasAccessToModule] = useState(true); // Start with true, check in useEffect
  const [unifiedTimerState, setUnifiedTimerState] = useState({ isRunning: false, currentTime: 0, startTime: null });
  
  // Refs
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch audio using the robust get_session_audio endpoint and fallbacks
  useEffect(() => {
    const fetchAudioUrl = async () => {
      const token = await auth.getAuthToken(); // Get auth token
      if (!token) {
        console.error("User not authenticated, cannot fetch audio.");
        setError("Authentication required to load audio.");
        setIsLoading(false);
        setHasAccessToModule(false); // Treat as lack of access
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      console.log("Starting audio retrieval process for session ID:", sessionId);
      setIsLoading(true);
      
      try {
        // First try to use Firebase URL if available
        if (audioUrl) {
          console.log("Using Firebase audio URL:", audioUrl);
          setAudioSrc(audioUrl);
          setIsLoading(false);
          setError(null);
          setHasAccessToModule(true);
          return;
        }
        
        // Next try to use the provided audioKey if available
        if (audioKey) {
          console.log("Trying direct audio key:", audioKey);
          const directUrl = `${API_URL}/get_audio_file/${audioKey}`;
          try {
            const testResponse = await fetch(directUrl, { method: 'HEAD', headers }); // Add headers
            if (testResponse.ok) {
              console.log("Direct audio key successful");
              setAudioSrc(directUrl);
              setIsLoading(false);
              setError(null);
              setHasAccessToModule(true);
              return;
            }
            // Check if this is a permissions error
            if (testResponse.status === 403) {
              console.log("Audio playback module not enabled");
              setError("Audio playback feature not enabled");
              setHasAccessToModule(false);
              setIsLoading(false);
              return;
            }
            console.log("Direct audio key not found, trying session API");
          } catch (err) {
            console.log("Error checking direct audio key:", err);
            // Continue to session-based lookup
          }
        }
        
        // Use the get_session_audio endpoint to find the correct audio key
        console.log("Querying get_session_audio endpoint for session ID:", sessionId);
        const sessionAudioUrl = `${API_URL}/get_session_audio/${sessionId}`;
        const response = await fetch(sessionAudioUrl, { headers }); // Add headers
        
        if (!response.ok) {
          // Check if this is a permissions error
          if (response.status === 403) {
            console.log("User not authorized or module not enabled");
            setError("Audio playback feature not enabled or not authorized");
            setHasAccessToModule(false);
            throw new Error("Not authorized to access audio");
          }
          throw new Error(`Failed to retrieve audio info: ${response.status}`);
        }
        
        const audioInfo = await response.json();
        console.log("Session audio info retrieved:", audioInfo);
        
        if (audioInfo.found && audioInfo.audio_key) {
          // Audio info found with a valid key
          const resolvedAudioUrl = `${API_URL}/get_audio_file/${audioInfo.audio_key}`;
          console.log("Using resolved audio key:", audioInfo.audio_key);
          setAudioSrc(resolvedAudioUrl);
          setError(null);
          setHasAccessToModule(true);
        } else if (audioInfo.possible_keys && audioInfo.possible_keys.length > 0) {
          // Try the first possible key
          const bestGuessKey = audioInfo.possible_keys[0];
          console.log("Using best guess audio key:", bestGuessKey);
          const bestGuessUrl = `${API_URL}/get_audio_file/${bestGuessKey}`;
          setAudioSrc(bestGuessUrl);
          setError(null);
          setHasAccessToModule(true);
        } else {
          // No audio found for this session
          console.log("No audio found for this session");
          setError("This session doesn't have an audio recording");
        }
      } catch (err) {
        console.error("Error in audio retrieval process:", err);
        // Don't overwrite more specific error messages
        if (!error?.includes("not enabled")) {
          setError("Failed to load audio recording");
          toast.error("Could not load audio recording");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudioUrl();
  }, [sessionId, audioKey, audioUrl]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!audioSrc || !containerRef.current) {
      console.log("Cannot initialize WaveSurfer - missing URL or container", { 
        hasUrl: !!audioSrc, 
        hasContainer: !!containerRef.current 
      });
      return;
    }
    
    console.log("Initializing WaveSurfer with audio URL:", audioSrc);

    // Clean up any existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    // Create WaveSurfer instance with async lazy loading
    const initializeWaveSurfer = async () => {
      try {
        const wavesurfer = await createWaveSurfer({
          container: containerRef.current!,
          waveColor: 'rgba(59, 130, 246, 0.4)',
          progressColor: 'rgba(37, 99, 235, 0.7)',
          cursorColor: '#3b82f6',
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          responsive: true,
          height: 80,
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false,
          hideScrollbar: true,
        });

        // Load audio
        wavesurfer.load(audioSrc);

        // Events
        wavesurfer.on('ready', () => {
          wavesurferRef.current = wavesurfer;
          // Handle invalid or infinite duration with a reasonable default
          const waveDuration = wavesurfer.getDuration();
          if (!waveDuration || !isFinite(waveDuration)) {
            console.warn('Invalid waveform duration detected, using session duration if available');
            // Use session duration if available, otherwise use a small default
            setDuration(sessionDuration || 18); // 18 seconds as fallback instead of 100
          } else {
            setDuration(waveDuration);
          }
          wavesurfer.setVolume(volume);
          setIsLoading(false);
          console.log("WaveSurfer ready with duration:", wavesurfer.getDuration());
        });

        wavesurfer.on('audioprocess', () => {
          // Only update from WaveSurfer if NOT using unified timer
          if (!useUnifiedTimer) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('seek', () => {
          // Only update from WaveSurfer if NOT using unified timer
          if (!useUnifiedTimer) {
            setCurrentTime(wavesurfer.getCurrentTime());
          }
        });

        wavesurfer.on('finish', () => {
          setIsPlaying(false);
          console.log("Audio playback finished");
        });

        wavesurfer.on('error', (err) => {
          console.error('WaveSurfer error:', err);
          setError('Error loading audio waveform');
          setIsLoading(false);
        });

        // Store cleanup function
        return () => {
          if (wavesurfer) {
            wavesurfer.destroy();
          }
        };
      } catch (error) {
        console.error('Failed to load WaveSurfer:', error);
        setError('Failed to load audio visualization');
        setIsLoading(false);
      }
    };

    initializeWaveSurfer();

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioSrc, volume]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (!wavesurferRef.current) return;
    const seekTime = value[0];
    wavesurferRef.current.seekTo(seekTime / duration);
    setCurrentTime(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!wavesurferRef.current) return;
    const newVolume = value[0];
    wavesurferRef.current.setVolume(newVolume);
    setVolume(newVolume);
  };

  // Subscribe to unified timer if requested
  useEffect(() => {
    if (!useUnifiedTimer) return;

    const unsubscribe = recordingTimer.subscribe((state) => {
      setUnifiedTimerState(state);
      // REPLACE local timing with master clock when unified timer is enabled
      setCurrentTime(state.currentTime);
    });

    return unsubscribe;
  }, [useUnifiedTimer]);

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg font-medium mb-4">Audio Recording</h3>
        
        {isLoading ? (
          <div className="animate-pulse flex flex-col space-y-3">
            <div className="h-20 bg-gray-200 rounded-md"></div>
            <div className="h-8 bg-gray-200 rounded-md w-full"></div>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-14 bg-gray-200 rounded"></div>
              <div className="h-4 flex-1 bg-gray-200 rounded"></div>
              <div className="h-4 w-14 bg-gray-200 rounded"></div>
            </div>
            <div className="text-xs text-blue-500 mt-1 animate-pulse text-center">
              Loading audio...
            </div>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-muted-foreground">
            <div className="flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">{error}</p>
              {error?.includes("doesn't have") ? (
                <div className="text-sm max-w-md">
                  <p className="mb-2">This session doesn't have an associated audio recording.</p>
                  <p>Audio recordings are available for sessions created with the <strong>Meeting Recording</strong> feature enabled.</p>
                  <p className="mt-2 text-xs">You can enable this feature in <strong>Settings → Features → Meeting Recording</strong>.</p>
                </div>
              ) : error?.includes("not enabled") ? (
                <div className="text-sm max-w-md">
                  <p className="mb-2">The audio playback feature is not enabled for your account.</p>
                  <p>To use waveform visualization and advanced playback features, please enable the <strong>Audio Playback & Visualization</strong> module.</p>
                  <p className="mt-2 text-xs">You can enable this feature in <strong>Settings → Features → Audio Playback</strong>.</p>
                </div>
              ) : (
                <div className="text-xs">
                  <p>Session ID: {sessionId}</p>
                  <p>Audio key: {audioKey || "Not provided"}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Waveform visualization */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 transition-opacity duration-200 bg-blue-50/80 rounded-md"
                style={{ opacity: !isPlaying && !isLoading && audioSrc ? 0.7 : 0 }}>
                <Music className="h-8 w-8 text-blue-500" />
              </div>
              <div 
                ref={containerRef} 
                className="w-full h-32 rounded-md overflow-hidden bg-gray-50 p-2 border border-gray-100"
              />
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="h-10 w-10 rounded-full"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="text-sm font-mono text-muted-foreground min-w-14">
                {formatTime(currentTime)}
              </div>
              
              <Slider
                className="flex-1"
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
              />
              
              <div className="text-sm font-mono text-muted-foreground min-w-14 text-right">
                {formatTime(duration)}
              </div>
            </div>
            
            {/* Download and Volume controls */}
            <div className="flex items-center justify-between w-full">            
              {/* Download button */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={() => {
                  if (audioSrc) {
                    const a = document.createElement('a');
                    a.href = audioSrc;
                    a.download = `audio_recording_${sessionId}.wav`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success("Audio file download started");
                  }
                }}
                disabled={!audioSrc}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Save Audio File
              </Button>
              
              {/* Volume control */}
              <div className="flex items-center space-x-2 ml-1">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                className="w-28"
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
              />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





