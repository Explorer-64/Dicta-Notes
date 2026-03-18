import { useEffect, useRef, useState } from 'react';

/**
 * Simple pitch-based speaker detector.
 * Detects significant pitch changes and assigns speaker labels.
 * Extracted from useLanguageOrchestrator - pure pitch analysis only.
 */
export const usePitchDetector = (stream: MediaStream | null, onSpeakerChange?: (speaker: string) => void) => {
  const [currentSpeaker, setCurrentSpeaker] = useState('Speaker 1');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeakerChangeRef = useRef<number>(0);
  const speakerCounterRef = useRef(1);
  const pitchHistoryRef = useRef<number[]>([]);

  // Constants for speaker detection
  const PITCH_CHANGE_THRESHOLD = 150; // Changed from 50Hz to 150Hz - larger pitch change needed
  const VARIANCE_THRESHOLD = 50000; // Changed from 5000 to 50000 - much larger variance needed
  const SPEAKER_CHANGE_COOLDOWN = 5000; // Changed from 3000ms to 5000ms - longer cooldown

  useEffect(() => {
    if (!stream) {
      // Reset when stream stops
      setCurrentSpeaker('Speaker 1');
      speakerCounterRef.current = 1;
      pitchHistoryRef.current = [];
      lastSpeakerChangeRef.current = 0;
      return;
    }

    // Create audio context for pitch detection
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.fftSize = 2048;
    
    const buffer = new Float32Array(analyserRef.current.fftSize);
    
    // Pitch detection state
    let lastPitch = 0;
    let pitchHistory: number[] = [];
    let lastChangeTime = 0;
    const changeCooldown = 2000; // 3 seconds between speaker changes

    // Autocorrelation algorithm for pitch detection
    const autoCorrelate = (buf: Float32Array, sampleRate: number): number => {
      const SIZE = buf.length;
      let rms = 0;
      
      for (let i = 0; i < SIZE; i++) {
        rms += buf[i] * buf[i];
      }
      rms = Math.sqrt(rms / SIZE);
      
      // Need sufficient signal
      if (rms < 0.01) return -1;
      
      let r1 = 0;
      let r2 = SIZE - 1;
      const threshold = 0.2;
      
      // Trim silence from start
      for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < threshold) {
          r1 = i;
          break;
        }
      }
      
      // Trim silence from end
      for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < threshold) {
          r2 = SIZE - i;
          break;
        }
      }
      
      buf = buf.slice(r1, r2);
      const newSize = buf.length;
      
      const correlations = new Float32Array(newSize);
      for (let i = 0; i < newSize; i++) {
        for (let j = 0; j < newSize - i; j++) {
          correlations[i] += buf[j] * buf[j + i];
        }
      }
      
      let d = 0;
      while (correlations[d] > correlations[d + 1]) d++;
      
      let maxval = -1;
      let maxpos = -1;
      for (let i = d; i < newSize; i++) {
        if (correlations[i] > maxval) {
          maxval = correlations[i];
          maxpos = i;
        }
      }
      
      let T0 = maxpos;
      
      // Parabolic interpolatio
      const x1 = correlations[T0 - 1];
      const x2 = correlations[T0];
      const x3 = correlations[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
      
      return sampleRate / T0;
    };

    const detectPitch = () => {
      if (!analyserRef.current || !audioContextRef.current) return;

      const analyser = analyserRef.current;
      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);

      const pitch = autoCorrelate(buffer, audioContextRef.current.sampleRate);
      const now = Date.now();

      if (pitch > 0 && now - lastChangeTime > changeCooldown) {
        pitchHistory.push(pitch);
        if (pitchHistory.length > 10) {
          pitchHistory.shift();
        }

        if (pitchHistory.length === 3) {
          const avg = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
          const variance = pitchHistory.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / pitchHistory.length;
          
          if (lastPitch > 0) {
            const pitchChange = Math.abs(avg - lastPitch);
            
            // High threshold to only trigger on actual speaker changes
            if (pitchChange > PITCH_CHANGE_THRESHOLD || variance > VARIANCE_THRESHOLD) {
              console.log(`🎵 Speaker change detected (pitch: ${pitchChange.toFixed(1)}Hz, variance: ${variance.toFixed(1)})`);
              lastChangeTime = now;
              pitchHistory = [];
              
              // Cycle through speakers (simple approach)
              speakerCounterRef.current = speakerCounterRef.current >= 3 ? 1 : speakerCounterRef.current + 1;
              const newSpeaker = `Speaker ${speakerCounterRef.current}`;
              setCurrentSpeaker(newSpeaker);
              
              console.log(`👤 Switched to ${newSpeaker}`);
            }
          }
          lastPitch = avg;
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    detectPitch();

    return () => {
      // Cleanup
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, [stream]);

  return currentSpeaker;
}
