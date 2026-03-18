import { useState, useRef, useEffect } from 'react';
import brain from 'brain';
import { languageSegmentQueue } from './languageSegmentQueue';

const useLanguageOrchestrator = (stream: MediaStream | null) => {
  // Simple null state that resets when stream changes
  const [language, setLanguage] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // Add ref to track requestAnimationFrame ID for proper cleanup
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setLanguage(null); // Clear language when stream stops
      return;
    }

    // Create audio context for pitch detection
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.fftSize = 2048;
    
    const buffer = new Float32Array(analyserRef.current.fftSize);
    
    if (analyserRef.current && audioContextRef.current) {
      // Audio analysis for pitch detection and language detection
      let lastPitch = 0;
      let mediaRecorder: MediaRecorder | null = null;
      let audioChunks: Blob[] = [];
      
      let pitchHistory: number[] = [];
      let lastCheckTime = 0;
      const checkCooldown = 5000; // 5 seconds to prevent rapid triggers

      const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
        let SIZE = buf.length;
        let rms = 0;
        
        for (let i = 0; i < SIZE; i++) {
          rms += buf[i] * buf[i];
        }
        rms = Math.sqrt(rms / SIZE);
        
        if (rms < 0.01) return -1;
        
        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
          if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
          if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }
        
        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
          for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buf[j] * buf[j + i];
          }
        }
        
        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
          if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
          }
        }
        let T0 = maxpos;
        
        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 - 2 * x2 + x3) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
        
        return sampleRate / T0;
      };

      const detectPitch = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        analyserRef.current.getFloatTimeDomainData(buffer);
        const pitch = autoCorrelate(buffer, audioContextRef.current.sampleRate);
        const now = Date.now();

        if (pitch > 0 && now - lastCheckTime > checkCooldown) {
          pitchHistory.push(pitch);
          if (pitchHistory.length > 10) {
            pitchHistory.shift();
          }

          if (pitchHistory.length === 10) {
            const avg = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
            const variance = pitchHistory.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / pitchHistory.length;
            
            if (lastPitch > 0) {
              const pitchChange = Math.abs(avg - lastPitch);
              
              // Much higher thresholds to only trigger on major speaker changes
              // NOT on normal speech variations that break transcription
              if (pitchChange > 400 || variance > 20000) {
                console.log(`🎵 Major pitch change detected (change: ${pitchChange.toFixed(1)}, variance: ${variance.toFixed(1)}) - checking for language change`); 
                lastCheckTime = now;
                // Reset history after a check
                pitchHistory = [];
                
                // Start language detection WITHOUT triggering speaker segmentation
                // This preserves language detection while avoiding API conflicts
                if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                  audioChunks = [];
                  console.log('Capturing audio for language detection...');
                  
                  // Clone the stream for language detection without affecting main audio
                  const clonedStream = stream.clone();
                  
                  // Use the best available audio format
                  let mimeType = 'audio/webm';
                  if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/wav';
                  }
                  
                  mediaRecorder = new MediaRecorder(clonedStream, 
                    mimeType ? { mimeType } : undefined
                  );
                  
                  mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                      audioChunks.push(event.data);
                    }
                  };
                  
                  mediaRecorder.onstop = async () => {
                    console.log('Language detection recording complete');
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    
                    try {
                      // Convert to base64 and detect language
                      const arrayBuffer = await audioBlob.arrayBuffer();
                      const uint8Array = new Uint8Array(arrayBuffer);
                      const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
                      
                      const response = await brain.detect_language({
                        audio_file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' })
                      });

                      const detectedLanguage = await response.text();
                      if (detectedLanguage && detectedLanguage !== language) {
                        console.log(`🌍 Language change detected: ${language} → ${detectedLanguage}`);
                        setLanguage(detectedLanguage);
                          if (response.ok)
  
                        // Store the last detected language
                        localStorage.setItem('last_detected_language', detectedLanguage);
  
                        // Queue the language change instead of immediately applying
                       languageSegmentQueue.addLanguageChange(detectedLanguage);
                        
                        // Trigger event for audio delay processor
                        window.dispatchEvent(new CustomEvent('languageDetectionComplete', { 
                          detail: { language: detectedLanguage } 
                        }));
                        console.log('🎯 [Language Detection] Language queued for future segments');
                        
                        return detectedLanguage;
                      }
                    } catch (err) {
                      console.error("Error during language detection:", err);
                    }
                  };
                  
                  mediaRecorder.onerror = (event) => {
                    console.error("MediaRecorder error:", event);
                  };
                  
                  // Record 1.5 seconds of audio for detection
                  mediaRecorder.start();
                  setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                      mediaRecorder.stop();
                    }
                  }, 1500);
                }
              }
            }
            lastPitch = avg;
          }
        }
        // Store the rAF ID so we can cancel it later
        animationIdRef.current = requestAnimationFrame(detectPitch);
      };

      detectPitch();
    }

    return () => {
      // Cancel the requestAnimationFrame loop to prevent memory leaks
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, [stream]);

  return language;
};

export default useLanguageOrchestrator;
