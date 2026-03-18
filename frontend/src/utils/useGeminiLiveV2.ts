import { useEffect, useRef, useState } from "react";
import brain from "brain";
import { toast } from "sonner";

// V2 ONLY – DO NOT MIX WITH LEGACY GEMINI LIVE
// -------------------------------------------------------------
// This hook wraps the exact logic previously implemented inline in
// GeminiLiveSimpleTest. Behavior is intended to be IDENTICAL:
// - Same websocket message handling
// - Same buffer + parsing strategy
// - Same turnComplete handling (flush when the field is present, even if false)
// - Same audio pipeline (getDisplayMedia + ScriptProcessor -> PCM16)
//
// Public API:
// {
//   isRecording, isConnected, status,
//   segments, // identical shape used by the page
//   start, stop, clear,
//   errors,
//   debug: { wsActive, audioStreamActive, audioContextActive, processorActive }
// }
//
// Manual test:
// 1) Open GeminiLiveSimpleTest
// 2) Click Start, select the tab/window and CHECK "Share audio"
// 3) Speak and observe segments rendered as SPEAKER: TEXT lines
// 4) Stop -> ensure cleanup

export interface TranscriptionSegment {
  text: string;
  speaker?: string;
  timestamp?: number;
  language?: string;
}

export function useGeminiLiveV2() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [status, setStatus] = useState("Ready");
  const [errors, setErrors] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const turnBufferRef = useRef<string>("");
  const knownNamesRef = useRef<Set<string>>(new Set());
  
  // NEW: MediaRecorder for saving audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Parse one or more SPEAKER/TEXT pairs from a block of text (IDENTICAL logic)
  const parseSpeakerTextPairs = (
    block: string
  ): Array<{ speaker?: string; text: string }> => {
    const results: Array<{ speaker?: string; text: string }> = [];
    if (!block) return results;

    console.log('🔍 [PARSER] Starting to parse block:', block);

    // Normalize line endings
    const normalized = block.replace(/\r\n/g, "\n");

    // 1) Primary: Match repeated structured pairs (SPEAKER + TEXT lines)
    const regex = /SPEAKER:\s*(.+?)\s*\nTEXT:\s*([\s\S]*?)(?=\nSPEAKER:|$)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(normalized)) !== null) {
      const speaker = match[1]?.trim();
      const text = match[2]?.trim();
      console.log('🎯 [PARSER] Primary regex matched - speaker:', speaker, 'text:', text);
      if (text) {
        if (speaker && !/^Speaker\s*\d+$/i.test(speaker)) {
          knownNamesRef.current.add(speaker);
        }
        results.push({ speaker, text });
      }
    }

    if (results.length > 0) {
      console.log('✅ [PARSER] Primary regex succeeded with', results.length, 'segments');
      return results;
    }

    console.log('⚠️ [PARSER] Primary regex failed, trying fallback...');

    // 2) Fallback: Split by inline speaker labels like "Hannah:" or "Speaker 1:" inside the text
    const known = Array.from(knownNamesRef.current);
    const nameAlternatives: string[] = [];
    // Include generic Speaker N pattern
    nameAlternatives.push("Speaker\\s*\\d+");
    // Include known names and a couple of common aliases if present
    for (const name of known) {
      nameAlternatives.push(escapeRegExp(name));
      // Simple alias handling for minor variants
      if (/Alice/i.test(name)) nameAlternatives.push("Alice");
      if (/Anna/i.test(name)) nameAlternatives.push("Anna");
    }

    if (nameAlternatives.length > 0) {
      console.log('🔄 [PARSER] Trying inline regex with known names:', nameAlternatives);
      const alt = nameAlternatives.join("|");
      const inlineRegex = new RegExp(
        `(?:^|\\n)\\s*(${alt})\\s*:\\s*([\\s\\S]*?)(?=(\\n\\s*(?:${alt})\\s*:\\s*)|$)`,
        "gi"
      );
      let inlineMatch: RegExpExecArray | null;
      while ((inlineMatch = inlineRegex.exec(normalized)) !== null) {
        const speaker = inlineMatch[1]?.toString().trim();
        const text = inlineMatch[2]?.toString().trim();
        console.log('🎯 [PARSER] Inline regex matched - speaker:', speaker, 'text:', text);
        if (text) {
          const speakerNorm = speaker;
          if (speakerNorm && !/^Speaker\s*\d+$/i.test(speakerNorm)) {
            knownNamesRef.current.add(speakerNorm);
          }
          results.push({ speaker: speakerNorm, text });
        }
      }
      if (results.length > 0) {
        console.log('✅ [PARSER] Inline regex succeeded with', results.length, 'segments');
        return results;
      }
    }

    console.log('⚠️ [PARSER] All regex patterns failed, using final fallback (plain text)');

    // 3) Final fallback: if no explicit pairs were matched but we have content, treat as plain text
    const trimmed = normalized.trim();
    if (trimmed) {
      console.log('📝 [PARSER] Final fallback - treating as plain text:', trimmed);
      results.push({ text: trimmed });
    }

    return results;
  };

  const start = async () => {
    try {
      setStatus("Fetching Live Prompt...");

      // Step 1: Get the transcription prompt (Gemini Live prompt API)
      const promptResponse = await brain.get_gemini_live_prompt_api();
      const promptData = await promptResponse.json();
      const livePrompt = promptData.prompt;

      setStatus("Getting websocket URL...");

      // Step 2: Get websocket URL from backend
      const response = await brain.get_gemini_websocket_url();
      const data = await response.json();
      const wsUrl = data.ws_url;

      setStatus("Connecting to Gemini Live...");

      // Step 3: Connect to websocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatus("Requesting system audio...");

        try {
          // Step 4: Get system audio (user must select tab/window and check "Share audio")
          const stream = await (navigator.mediaDevices as any).getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            } as any,
          });

          const audioTrack = stream.getAudioTracks()[0];
          if (!audioTrack) {
            throw new Error(
              'No audio track available. Please check "Share audio" when selecting.'
            );
          }

          audioStreamRef.current = stream;
          
          // NEW: Start MediaRecorder
          audioChunksRef.current = [];
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          
          mediaRecorder.start(1000); // Emit chunks every 1000ms
          
          setStatus("Processing audio...");

          // Step 5: Send setup message to Gemini with promp
          const setupMessage = {
            setup: {
              model: "models/gemini-2.0-flash-exp",
              generation_config: {
                response_modalities: ["TEXT"],
              },
              system_instruction: {
                parts: [
                  {
                    text: livePrompt,
                  },
                ],
              },
              realtime_input_config: {
                automatic_activity_detection: {
                  start_of_speech_sensitivity: "START_SENSITIVITY_HIGH",
                  end_of_speech_sensitivity: "END_SENSITIVITY_LOW",
                  prefix_padding_ms: 200,
                  silence_duration_ms: 600,
                },
              },
            },
          } as const;
          ws.send(JSON.stringify(setupMessage));

          // Step 6: Process audio and send to websocke
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          } as any);
          audioContextRef.current = audioContext;

          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);

              // Convert Float32Array to Int16Array (PCM16)
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }

              const audioMessage = {
                realtime_input: {
                  media_chunks: [
                    {
                      mime_type: "audio/pcm",
                      data: btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer))),
                    },
                  ],
                },
              } as const;

              ws.send(JSON.stringify(audioMessage));
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);

          setIsRecording(true);
          setStatus("Recording system audio...");
          toast.success("Recording started! Speak into your selected audio source.");
        } catch (audioError: any) {
          setStatus("Failed to get audio");
          setErrors((prev) => [...prev, audioError?.message || String(audioError)]);
          toast.error(audioError?.message || "Failed to capture system audio");
          ws.close();
        }
      };

      ws.onmessage = async (event) => {
        try {
          let raw: string;
          if (event.data instanceof Blob) {
            raw = await event.data.text();
          } else {
            raw = event.data;
          }

          let obj: any;
          try {
            obj = JSON.parse(raw);
          } catch {
            console.log('🔴 [WS] Non-JSON frame received, ignoring');
            return; // ignore non-JSON frames
          }

          // Log all incoming messages for debugging
          console.log('📨 [WS] Received message:', JSON.stringify(obj, null, 2));

          // Handle interruption
          if (obj.serverContent?.interrupted) {
            console.log("⚠️ [WS] Interruption detected - saving buffer before clearing");
            
            // CRITICAL: Save any accumulated content BEFORE clearing
            const bufferedText = turnBufferRef.current.trim();
            if (bufferedText) {
              console.log("💾 [WS] Saving interrupted buffer content:", bufferedText);
              const pairs = parseSpeakerTextPairs(bufferedText);
              console.log(`🎯 [WS] Parsed ${pairs.length} segment(s) from interrupted buffer:`, pairs);
              
              if (pairs.length > 0) {
                setSegments((prev) => {
                  const newSegments = [...prev, ...pairs];
                  console.log(`✅ [WS] Added ${pairs.length} segment(s) from interrupted turn, total segments: ${newSegments.length}`);
                  return newSegments;
                });
              }
            }
            
            turnBufferRef.current = "";
            return;
          }

          // Accumulate model turn parts into buffer (IDENTICAL)
          const modelTurn = obj?.serverContent?.modelTurn;
          if (modelTurn?.parts && Array.isArray(modelTurn.parts)) {
            for (const part of modelTurn.parts) {
              if (typeof part?.text === "string") {
                console.log('📝 [WS] Adding text to buffer:', part.text);
                turnBufferRef.current += part.text;
                console.log('📊 [WS] Current buffer size:', turnBufferRef.current.length, 'chars');
              }
            }
          }

          // When turn completes, parse buffer into clean segments
          // IMPORTANT: keep the exact condition (flush whenever turnComplete is present, even if false)
          const turnComplete = obj?.serverContent?.turnComplete;
          if (turnComplete !== undefined) {
            console.log('🏁 [WS] Turn complete signal received. turnComplete:', turnComplete);
            const buffered = turnBufferRef.current;
            console.log('📋 [WS] Processing buffered text:', buffered);
            turnBufferRef.current = "";

            if (buffered && buffered.trim().length > 0) {
              const pairs = parseSpeakerTextPairs(buffered);
              console.log('🎯 [WS] Parsed', pairs.length, 'segment(s) from buffer:', pairs);
              if (pairs.length > 0) {
                setSegments((prev) => [...prev, ...pairs]);
                console.log('✅ [WS] Added', pairs.length, 'new segment(s) to state');
              } else {
                console.warn('⚠️ [WS] No segments parsed from buffered text');
              }
            } else {
              console.log('⏭️ [WS] Empty buffer, skipping segment creation');
            }
          }
        } catch (e: any) {
          console.error('❌ [WS] Error processing message:', e);
          setErrors((prev) => [...prev, e?.message || String(e)]);
        }
      };

      ws.onerror = (error) => {
        setStatus("Connection error");
        setErrors((prev) => [...prev, "Websocket connection failed"]);
        toast.error("Websocket connection failed");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatus("Disconnected");
        stop();
      };
    } catch (error: any) {
      setStatus("Failed to start");
      setErrors((prev) => [...prev, error?.message || String(error)]);
      toast.error(error?.message || "Failed to start recording");
    }
  };

  const stop = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Close websocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Stop audio processing
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      audioStreamRef.current = null;
    }

    setIsRecording(false);
    setIsConnected(false);
    setStatus("Stopped");
    toast.info("Recording stopped");
  };

  const clear = () => {
    setSegments([]);
    toast.success("Transcription cleared");
  };
  
  /**
   * Saves the complete transcription and audio to a session.
   * @param title The title for the session.
   * @param clientName The client's name.
   * @param projectName The project's name.
   * @param tags An array of tags for the session.
   * @returns The new session ID if successful, otherwise null.
   */
  const saveSession = async (
    title: string,
    clientName?: string,
    projectName?: string,
    tags?: string[]
  ): Promise<string | null> => {
    if (!audioChunksRef.current.length) {
      console.error('No audio chunks recorded');
      toast.error('No audio recorded');
      return null;
    }

    try {
      toast.info('Saving session...');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const filename = `recording_${Date.now()}.webm`;
      const audioFile = new File([audioBlob], filename, { type: 'audio/webm' });
      
      // Match the exact format from apiDispatcher.ts
      const sessionDetails = {
        meetingTitle: title || 'Untitled Session',
        meetingPurpose: '',
        participants: [],
        clientName: null,
        projectName: null,
        tags: [],
      };
      
      // Upload to backend with correct format
      // Only include language_preference if it has a value (omit null/undefined)
      const formData: Record<string, any> = {
        session_details_json: JSON.stringify(sessionDetails),
      };
      
      const response = await brain.upload_and_create_session(
        formData,
        {
          audio_file: audioFile,
        }
      );
      
      const result = await response.json();
      console.log('Session saved:', result);
      toast.success('Session saved successfully!');
      return result.session_id;
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session');
      return null;
    }
  };

  return {
    isRecording,
    isConnected,
    status,
    segments,
    start,
    stop,
    clear,
    saveSession,
    errors,
    debug: {
      wsActive: !!wsRef.current,
      audioStreamActive: !!audioStreamRef.current,
      audioContextActive: !!audioContextRef.current,
      processorActive: !!processorRef.current,
    },
  } as const;
}
