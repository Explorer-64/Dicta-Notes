import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Info } from "lucide-react";
import { recordingTimer } from 'utils/recording/RecordingTimerService';


interface Props {
  onAudioCaptured?: (audioBlob: Blob) => void;
}

const RecordingPanel: React.FC<Props> = ({ onAudioCaptured }) => {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Recording objects
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvasCtxRef.current = canvas.getContext('2d');
    }
  }, []);
  
  // Subscribe to singleton timer updates
  useEffect(() => {
    const unsubscribe = recordingTimer.subscribe((state) => {
      setRecordingTime(state.currentTime);
    });
    
    return unsubscribe;
  }, []);
  
  // Monitor online status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Format recording time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle visualization of audio data
  const visualizeAudio = () => {
    if (!analyserRef.current || !canvasCtxRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvasCtxRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      
      canvasCtx.fillStyle = 'rgb(249, 250, 251)';
      canvasCtx.fillRect(0, 0, width, height);
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(37, 99, 235)';
      canvasCtx.beginPath();
      
      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    };
    
    draw();
  };
  
  // Request audio permissions and setup
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      setErrorMessage(null);
      setupRecording(stream);
    } catch (err) {
      setPermissionGranted(false);
      setErrorMessage("Microphone access denied. Please enable it in your browser settings.");
      console.error("Error accessing microphone:", err);
    }
  };
  
  // Setup recording with media stream
  const setupRecording = (stream: MediaStream) => {
    // Initialize audio context and analyzer for visualization
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    // Setup media recorder
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setAudioBlob(audioBlob);
      setAudioUrl(audioUrl);
      
      if (onAudioCaptured) {
        onAudioCaptured(audioBlob);
      }
      
      // Store locally if offline
      if (!navigator.onLine) {
        storeAudioLocally(audioBlob);
      }
    };
    
    // Start recording
    mediaRecorderRef.current.start();
    setIsRecording(true);
    
    // Start singleton timer
    recordingTimer.start();
    
    // Start visualizer
    visualizeAudio();
  };
  
  // Store audio locally when offline
  const storeAudioLocally = (blob: Blob) => {
    try {
      const recordings = JSON.parse(localStorage.getItem('offlineRecordings') || '[]');
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob); 
      reader.onloadend = function() {
        const base64data = reader.result;
        recordings.push({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          audio: base64data,
          processed: false
        });
        
        localStorage.setItem('offlineRecordings', JSON.stringify(recordings));
        console.log("Stored recording locally for later processing");
      };
    } catch (error) {
      console.error("Error storing recording locally:", error);
    }
  };
  
  // Start recording
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setErrorMessage(null);
    
    if (permissionGranted === null) {
      await requestPermission();
    } else if (permissionGranted) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupRecording(stream);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop singleton timer
      recordingTimer.stop();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };
  
  // Render component
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto bg-white rounded-lg shadow-sm p-4 sm:p-6 border">
      {/* Status Badge */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-medium">DictaNotes Recorder</h3>
        {isOnline ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Online
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Offline - Recording Only
          </Badge>
        )}
      </div>
      
      {/* Waveform Visualizer */}
      <div className="w-full h-20 sm:h-24 mb-3 sm:mb-4 bg-gray-50 rounded-md overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          width={600}
          height={128}
        ></canvas>
      </div>
      
      {/* Recording Timer */}
      <div className="text-xl sm:text-2xl font-mono text-center py-2 mb-3 sm:mb-4">
        {formatTime(recordingTime)}
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <Button 
            size="lg"
            className="rounded-full w-20 h-20 sm:w-24 sm:h-24 bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md"
            onClick={startRecording}
            disabled={permissionGranted === false}
          >
            <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
          </Button>
        ) : (
          <Button 
            size="lg"
            variant="outline"
            className="rounded-full w-20 h-20 sm:w-24 sm:h-24 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center shadow-md"
            onClick={stopRecording}
          >
            <Square className="h-8 w-8 sm:h-10 sm:w-10" />
          </Button>
        )}
      </div>
      
      {/* Mobile Recording Hint */}
      <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 flex items-center justify-center">
        <Info className="h-3 w-3 mr-1" />
        <span>Tap the button to {!isRecording ? "start" : "stop"} recording</span>
      </div>
      
      {/* Playback for testing */}
      {audioUrl && (
        <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Recording Complete</h4>
          <p className="text-blue-700 text-xs sm:text-sm mb-3">Listen to your recording below:</p>
          <audio key={audioUrl} src={audioUrl} controls className="w-full" preload="metadata"></audio>
        </div>
      )}
      
      {/* Error Message */}
      {errorMessage && (
        <div className="mt-3 sm:mt-4 p-3 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm">
          {errorMessage}
        </div>
      )}
      
      {/* Permission Request Banner */}
      {permissionGranted === false && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800">Microphone Access Required</h4>
          <p className="text-amber-700 text-xs sm:text-sm mt-1">Please enable microphone access in your browser settings to use DictaNotes.</p>
          <Button 
            variant="outline" 
            className="mt-2 text-amber-800 border-amber-300 hover:bg-amber-100 text-sm h-10 sm:h-auto"
            onClick={requestPermission}
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800">Offline Mode</h4>
          <p className="text-blue-700 text-xs sm:text-sm mt-1">
            You're currently offline. You can still record audio, but transcription will happen when you're back online.
          </p>
        </div>
      )}
    </div>
  );
};

export { RecordingPanel };

