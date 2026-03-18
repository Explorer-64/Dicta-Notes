import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface AudioPreviewProps {
  audioBlob: Blob;
  sessionId?: string;
  sessionDuration?: number; // Add session duration prop
  className?: string;
}

export function AudioPreview({ audioBlob, sessionId, sessionDuration, className = "" }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create object URL for the blob
  useEffect(() => {
    if (!audioBlob) return;
    
    // Create URL for audio blob
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    
    // Cleanup function
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  // Set up audio element
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      // Handle invalid or infinite duration with a reasonable default
      if (!audio.duration || !isFinite(audio.duration)) {
        console.warn('Invalid audio duration detected, using session duration if available');
        // Use session duration if available, otherwise use a small default
        setDuration(sessionDuration || 18); // 18 seconds as fallback instead of 100
      } else {
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current!);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    // Ensure we get the duration
    if (audio.readyState >= 1) { // HAVE_METADATA or higher
      handleLoadedMetadata();
    }
    
    // Set initial volume
    audio.volume = volume;
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl, volume]);

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(updateProgress);
      } catch (err) {
        console.error("Audio playback failed:", err);
        setIsPlaying(false);
      }
    }
  };

  // Update progress
  const updateProgress = () => {
    if (!audioRef.current) return;
    
    setCurrentTime(audioRef.current.currentTime);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const seekTime = value[0];
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  // Handle download
  const handleDownload = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `recording_${sessionId || new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Audio download started");
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Hidden audio element */}
          <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
          
          {/* Time progress and slider */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="h-9 w-9 rounded-full"
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
              onClick={handleDownload}
              disabled={!audioUrl}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download Recording
            </Button>
            
            {/* Volume control */}
            <div className="flex items-center space-x-2 ml-1">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                className="w-24"
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
