import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import brain from "brain";
import { API_URL } from "app";
import { auth } from "app";
import { recordingTimer } from "utils/recording/RecordingTimerService";
import { SessionPlayerControls } from "components/SessionPlayerControls";
import { applySafariMp3Fallback } from "utils/SafariMp3Fallback";
import { getFileExtensionFromContentTypeAndUrl } from "utils/audioExt";

interface SessionAudioPlayerProps {
  sessionId: string;
  useUnifiedTimer?: boolean; // Option to use centralized timer instead of audio element timing
  sessionDuration?: number; // Duration in seconds from session data
  seekRequest?: { time: number; id: number } | null; // External seek request
}

export const SessionAudioPlayer: React.FC<SessionAudioPlayerProps> = ({ sessionId, useUnifiedTimer = false, sessionDuration, seekRequest }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  // Transcoding state
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track the original source extension (from key/url) to help detection when content-type is generic
  const sourceExtRef = useRef<string | null>(null);
  // Track original public URL (if any) so downloads use the original even if src is replaced with mp3 blob
  const originalPublicUrlRef = useRef<string | null>(null);

  // Subscribe to unified timer if requested
  useEffect(() => {
    if (!useUnifiedTimer) return;

    const unsubscribe = recordingTimer.subscribe((state) => {
      // Replace local timing with master clock when unified timer is enabled
      setCurrentTime(state.currentTime);
    });

    return unsubscribe;
  }, [useUnifiedTimer]);

  // Seek to external time request (e.g. from transcript click)
  // Uses a {time, id} pair so the same timestamp can be clicked twice
  useEffect(() => {
    if (!seekRequest) return;
    // Small delay: lets the tab switch (CSS show) settle before seeking
    const timer = setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = seekRequest.time;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [seekRequest]);

  // Combined effect for fetching and loading audio
  useEffect(() => {
    const loadAudio = async () => {
      if (!sessionId || sessionId === "undefined") {
        setError("No session selected");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAudioUrl(null); // Reset on new session ID
      setAudioBlob(null);
      setContentType(null);
      sourceExtRef.current = null;
      originalPublicUrlRef.current = null;

      try {
        // 1. Fetch Audio Info
        // The brain client's http-client already parses JSON responses and returns HttpResponse
        // HttpResponse has data/error properties - use response.data directly, don't call .json()
        const response = await brain.get_session_audio({ sessionId });
        
        // Check response.ok first (HttpResponse extends Response)
        if (!response.ok) {
          const errorData = (response as any).error || { message: "Failed to fetch audio information" };
          throw new Error(typeof errorData === 'string' ? errorData : errorData.message || "Failed to fetch audio information");
        }
        
        // Use response.data - the http-client already parsed the JSON
        const data = (response as any).data;
        if (!data || !data.found || !data.audio_key) {
          throw new Error("No audio recording found for this session");
        }

        const audioKey = data.audio_key as string;
        console.log("Audio key/URL received from API:", audioKey);

        // Capture extension from key if present
        const m = audioKey.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (m) sourceExtRef.current = m[1].toLowerCase();

        // 2. Setup Audio Element
        const audio = audioRef.current ?? new Audio();
        if (!audioRef.current) {
          audioRef.current = audio;
          // --- Set up event listeners ONCE ---
          audio.addEventListener("loadedmetadata", () => {
            const newDuration = audio.duration && isFinite(audio.duration) ? audio.duration : 0;
            const finalDuration = newDuration > 0 ? newDuration : (sessionDuration || 0);
            setDuration(finalDuration);
            console.log("Audio metadata loaded, duration:", newDuration, "using final duration:", finalDuration);
          });
          audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
          audio.addEventListener("ended", () => setIsPlaying(false));
          audio.addEventListener("error", (e) => {
            const audioElement = e.target as HTMLAudioElement;
            const err = audioElement.error;
            let errorMessage = "Audio playback error";
            if (err) {
              switch (err.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  errorMessage = "Audio playback was aborted"; break;
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage = "Network error while loading audio"; break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage = "Audio file could not be decoded"; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "Audio format not supported"; break;
                default:
                  errorMessage = err.message || errorMessage;
              }
            }
            console.error(`Audio playback error: ${errorMessage} | audioKey: ${audio.src}`);
            // Do not set error state here; we may perform Safari fallback.
          });
          audio.volume = volume;
        }

        // 3. Load Audio Source based on URL type
        const isPublicUrl = typeof audioKey === 'string' && audioKey.startsWith("http");
        if (isPublicUrl) {
          console.log("Loading public URL directly:", audioKey);
          audio.src = audioKey as string;
          setAudioUrl(audioKey as string);
          setAudioBlob(null);
          setContentType(null);
          originalPublicUrlRef.current = audioKey as string;
        } else {
          console.log("Fetching internal audio key via brain client:", audioKey);
          // For streaming responses (audio files), we need to fetch directly
          // The brain client's http-client tries to parse as JSON, but audio is binary
          const token = await auth.getAuthToken();
          if (!token) {
            throw new Error("Authentication required to fetch audio");
          }
          
          // Construct the URL manually for blob response
          const isLocalhost = /localhost:\d{4}/i.test(window.location.origin);
          const baseUrl = isLocalhost 
            ? `${window.location.origin}/routes` 
            : (import.meta.env.VITE_API_URL || window.location.origin) + '/routes';
          const audioUrl = `${baseUrl}/get_audio_file/${encodeURIComponent(audioKey)}`;
          
          console.log("Fetching audio from:", audioUrl);
          const audioResponse = await fetch(audioUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!audioResponse.ok) {
            if (audioResponse.status === 404) {
              throw new Error(`Audio file not found. The audio recording may not be available for this session. Please check if the audio was properly saved.`);
            }
            const errorText = await audioResponse.text().catch(() => audioResponse.statusText);
            throw new Error(`Failed to fetch audio (${audioResponse.status}): ${errorText || audioResponse.statusText}`);
          }
          
          const blob = await audioResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          audio.src = objectUrl;
          setAudioUrl(objectUrl);
          setAudioBlob(blob);
          setContentType(blob.type || audioResponse.headers.get('content-type') || null);
        }
      } catch (err: any) {
        console.error("Error in audio loading process:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        // Attempt Safari fallback after initial load decisions are made
        applySafariMp3Fallback({
          sessionId,
          audioRef: audioRef.current,
          audioBlob,
          audioUrl,
          contentType,
          sourceExt: sourceExtRef.current,
          onProgress: (pct) => setConvertProgress(pct),
          setConverting: (v) => setIsConverting(v),
          onSuccess: (mp3Url) => setAudioUrl(mp3Url),
        });
      }
    };

    loadAudio();

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [sessionId, useUnifiedTimer]);

  // Playback controls
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.error("Playback error:", err);
        setError("Could not play the audio file");
      });
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const resetPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.error("Playback error:", err);
        setError("Could not play the audio file");
      });
    }
  };

  // Download audio (preserve original when possible)
  const downloadAudio = async () => {
    if (!audioUrl) return;

    try {
      const fileExt = getFileExtensionFromContentTypeAndUrl(contentType, audioUrl, sourceExtRef.current);
      const filename = `session-${sessionId}-recording.${fileExt}`;

      // Case 1: We already have the Blob (internal/protected audio)
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        toast.success("Audio download started");
        return;
      }

      // Case 2: If original public URL is known, proxy-download that to preserve original format
      if (originalPublicUrlRef.current) {
        const token = await auth.getAuthToken();
        const res = await fetch(`${API_URL}/downloads/audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ url: originalPublicUrlRef.current, filename }),
        });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const effectiveFilename = (() => {
          const cd = res.headers.get('Content-Disposition') || '';
          const match = cd.match(/filename="?([^";]+)"?/i);
          if (match && match[1]) return match[1];
          return filename;
        })();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = effectiveFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        toast.success("Audio download started");
        return;
      }

      // Case 3: blob: URL (we can download directly without fetch)
      if (audioUrl.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); }, 100);
        toast.success("Audio download started");
        return;
      }

      // Case 4: Public HTTP(S) URL - proxy via backend to force attachment
      if (audioUrl.startsWith('http')) {
        const token = await auth.getAuthToken();
        const res = await fetch(`${API_URL}/downloads/audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ url: audioUrl, filename }),
        });
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        const effectiveFilename = (() => {
          const cd = res.headers.get('Content-Disposition') || '';
          const match = cd.match(/filename="?([^";]+)"?/i);
          if (match && match[1]) return match[1];
          return filename;
        })();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = effectiveFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        toast.success("Audio download started");
        return;
      }

      throw new Error('Unsupported audio URL scheme');
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast.error("Failed to download audio file");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-muted rounded-full mb-2"></div>
              <div className="h-4 w-40 bg-muted rounded mt-2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!audioUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Recording</CardTitle>
      </CardHeader>
      <CardContent>
        <SessionPlayerControls
          isConverting={isConverting}
          convertProgress={convertProgress}
          isPlaying={isPlaying}
          canInteract={!!audioUrl && !isConverting}
          currentTime={currentTime}
          duration={duration}
          sessionDuration={sessionDuration}
          volume={volume}
          onReset={resetPlayback}
          onPlayPause={togglePlayback}
          onDownload={downloadAudio}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
        />
      </CardContent>
    </Card>
  );
};
