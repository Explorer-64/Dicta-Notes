import React, { useEffect, useState, useRef } from "react";
import { useCurrentUser } from "app";
import { useNavigate } from "react-router-dom";
import { Header } from 'components/Header';
import { Helmet } from "react-helmet-async";
import { NoIndexMeta } from 'components/NoIndexMeta';

const AdminSpeechTest: React.FC = () => {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [browserSupportError, setBrowserSupportError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);

  // State for on-page logging
  interface LogEntry {
    timestamp: string;
    event: string;
    data?: string;
  }
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Idle");

  const addLog = (event: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const dataString = data === undefined ? undefined : (typeof data === 'object' ? JSON.stringify(data) : String(data));
    setLogs((prevLogs) => [{ timestamp, event, data: dataString }, ...prevLogs.slice(0, 99)]); // Keep last 100 logs, new logs at the top
  };


  // Check for SpeechRecognition API vendor prefixes
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;


  const handleToggleListening = async () => {
    if (isListening) {
      // Currently listening, so stop
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped by user.");
      }
      setIsListening(false);
    } else {
      // Not listening, so start
      addLog("Button Click", "Attempting to start recognition...");
      // Clear interim transcript for a new session
      setInterimTranscript("");
      setStatusMessage("Initializing...");

      if (!SpeechRecognition) {
        console.error("Browser does not support SpeechRecognition API.");
        setBrowserSupportError("Your browser does not support the Speech Recognition API. Please try Chrome or Edge.");
        return;
      }
      setBrowserSupportError(null);
      setPermissionError(null);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        addLog("MicPermission", "Microphone permission granted.");
        setStatusMessage("Microphone access granted.");

        if (!recognitionRef.current) {
          addLog("InitRecognition", "Creating new SpeechRecognition instance.");
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;

          recognition.continuous = true; // Set to continuous as per working example
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            addLog("onstart", "Recognition service has started.");
            setStatusMessage("Listening...");
            setIsListening(true);
          };

          recognition.onaudiostart = () => {
            addLog("onaudiostart", "Audio capture started.");
          };

          recognition.onsoundstart = () => {
            addLog("onsoundstart", "Some sound detected.");
          };

          recognition.onspeechstart = () => {
            addLog("onspeechstart", "Speech has been detected.");
            setStatusMessage("Speech detected...");
          };

          recognition.onresult = (event: any) => {
            addLog("onresult raw event", event);
            let finalizedTextForThisEvent = "";
            let interimTextForThisEvent = ""; // Capture interim for potential display if needed

            if (event.results && event.results.length > 0) {
              addLog("onresult processing", `Results length: ${event.results.length}, resultIndex: ${event.resultIndex}`);
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                const isFinalPart = event.results[i].isFinal;
                addLog("onresult loop part", `Index: ${i}, isFinal: ${isFinalPart}, transcript: '${transcriptPart}'`);

                if (isFinalPart) {
                  finalizedTextForThisEvent += transcriptPart + " ";
                } else {
                  interimTextForThisEvent += transcriptPart;
                }
              }
            }
            
            // Update interim transcript display with the latest interim result from this event
            // This provides a more responsive feel, showing what's being heard before it's final
            if (interimTextForThisEvent.trim()) {
                // For now, let's just log it, as the main display is for finalized text
                addLog("onresult (interim text received)", interimTextForThisEvent);
            }

            finalizedTextForThisEvent = finalizedTextForThisEvent.trim();
            if (finalizedTextForThisEvent) {
              setInterimTranscript(prev => prev ? `${finalizedTextForThisEvent}\n${prev}` : finalizedTextForThisEvent);
              addLog("onresult (finalized text prepended to display)", finalizedTextForThisEvent);
            }
          };

          recognition.onspeechend = () => {
            addLog("onspeechend", "Speech has stopped being detected.");
            setStatusMessage("Speech ended, processing...");
          };

          recognition.onsoundend = () => {
            addLog("onsoundend", "Sound has stopped being detected.");
          };

          recognition.onaudioend = () => {
            addLog("onaudioend", "Audio capture ended.");
            // In continuous mode, onaudioend might not mean the end of the session if speech restarts quickly.
            // setIsListening(false) is handled by onend or stop().
          };

          recognition.onend = () => {
            addLog("onend", "Recognition service has disconnected.");
            // If continuous is true, onend might be called if the user stops talking for a while
            // or if there's a network error. We might want to automatically restart it here
            // for a true 'continuous' experience, or rely on the user to restart.
            // For this test page, we'll set listening to false and let the user restart.
            setStatusMessage("Recognition ended. Click Start to listen again.");
            setIsListening(false);
          };

          recognition.onerror = (event: any) => {
            addLog(`onerror: ${event.error}`, event.message);
            setStatusMessage(`Error: ${event.error}`);
            setPermissionError(event.message);
            setIsListening(false);
            // Consider if recognitionRef.current should be nulled here to force re-creation on next start
            // For now, we keep the instance, as per the 'reuse' pattern.
          };

          recognition.onnomatch = () => {
            addLog("onnomatch", "No significant speech recognized.");
            setStatusMessage("No speech recognized (onnomatch).");
            // onnomatch doesn't necessarily mean it stopped; it just means the last utterance wasn't recognized.
          };
        } else {
          addLog("ReuseRecognition", "Reusing existing SpeechRecognition instance.");
        }

        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            addLog("recognition.start()", "Called start() on recognition instance");
          } catch (startError: any) {
            addLog("recognition.start() error", startError.message || "Unknown error starting recognition");
            setStatusMessage(`Error starting: ${startError.message}`);
            setIsListening(false);
            // If start fails, maybe the instance is bad. Null it out to force re-creation next time.
            recognitionRef.current = null; 
          }
        } else {
            addLog("Error", "recognitionRef.current is null, cannot start.");
            setStatusMessage("Error: Recognition not initialized.");
        }

      } catch (err: any) {
        const errorMessage = err.message || "Unknown error during microphone access";
        addLog("getUserMedia error", errorMessage);
        setStatusMessage(`Mic Error: ${errorMessage}`);
        console.error("Error requesting microphone permission:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else {
          setPermissionError(`Error accessing microphone: ${errorMessage}`);
        }
        setIsListening(false);
      }
    }
  };

  // Cleanup recognition on component unmount
  useEffect(() => {
    // This cleanup effect for recognitionRef should also be inside the component
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        console.log("Speech recognition aborted on component unmount.");
      }
    };
  }, []); // Added recognitionRef to dependency array if it were stable, but it's a ref, so empty array is fine for mount/unmount cleanup

  // Admin restriction: Redirect if not admin or loading completes and no user
  useEffect(() => {
    const adminEmails = ["abereimer64@gmail.com", "dward@wevad.com", "dianareimer90@gmail.com"];
    
    if (!loading && !user) {
      // Not logged in, redirect to login or home
      addLog("AdminCheck", "User not logged in, redirecting.");
      navigate("/Login"); // Or "/" or any other appropriate page
    } else if (!loading && user && !adminEmails.includes(user.email || "")) {
      // Logged in, but not the admin
      addLog("AdminCheck", "User is not admin, redirecting.");
      navigate("/"); // Redirect to home page or a 'not authorized' page
    } else if (!loading && user && adminEmails.includes(user.email || "")) {
      addLog("AdminCheck", "Admin user verified.");
    }
  }, [user, loading, navigate]);

  // Conditional rendering: Show loading or page content
  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: "20px", textAlign: "center" }}>Loading user information...</div>
      </>
    );
  }

  const adminEmails = ["abereimer64@gmail.com", "dward@wevad.com", "dianareimer90@gmail.com"];
  if (!user || !adminEmails.includes(user.email || "")) {
    // This should ideally not be reached if the useEffect redirect works, but serves as a fallback.
    return (
      <>
        <Header />
        <div style={{ padding: "20px", textAlign: "center" }}>Access Denied. You are not authorized to view this page.</div>
      </>
    );
  }

  // If user is logged in and is the admin
  return (
    <>
    <NoIndexMeta />
    <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin Speech Test - Dicta-Notes</title>
      </Helmet>
      <Header /> {/* Added Header component here */}
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Admin Speech Test Page</h1>
      <p>
        This page is for testing speech-to-text functionality, logging all SpeechRecognition API events.
      </p>

      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={handleToggleListening} 
          style={{
            minWidth: "180px", 
            marginBottom: "20px", 
            padding: "12px 20px", 
            fontSize: "16px", 
            cursor: "pointer",
            backgroundColor: isListening ? "#dc3545" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px"
          }}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>

      {/* Status and Error Display */}
      <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #eee", borderRadius: "5px", backgroundColor: "#f9f9f9" }}>
        <strong>Status:</strong> <span style={{ fontWeight: "bold", color: isListening ? "green" : (statusMessage.startsWith("Error") ? "red" : "#333") }}>{statusMessage}</span>
        {permissionError && !isListening && (
          <p style={{ color: "red", marginTop: "5px", fontWeight: "bold" }}>Error: {permissionError}</p>
        )}
        {browserSupportError && (
          <p style={{ color: "red", marginTop: "5px", fontWeight: "bold" }}>Browser Support Error: {browserSupportError}</p>
        )}
      </div>

      {/* Transcript Display */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ width: "100%" }}> 
          <h4>Recognized Text:</h4>
          <div 
            style={{
              border: "1px solid #e0e0e0", 
              background: "#f8f9fa", // Slightly off-white background
              padding: "10px", 
              minHeight: "100px", // Ensure box is visible
              maxHeight: "250px", // Allow scrolling beyond this height
              color: "#212529", // Standard text color
              borderRadius: "3px", 
              overflowY: "auto",
              whiteSpace: "pre-wrap" // Respect newlines added between utterances
            }}
          >
            {interimTranscript || (isListening ? "Listening..." : "-")}
          </div>
        </div>
      </div>

      {/* Event Logs */}
      <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px"}}>
          <h3>Event Logs:</h3>
          <button 
            onClick={() => { 
              setLogs([]); 
              // setFinalTranscript(""); // Removed
              setInterimTranscript(""); 
              setStatusMessage("Idle (Logs Cleared)"); 
              addLog("ClearLogsClick", "Logs and transcripts cleared by user.");
            }}
            style={{ padding: "6px 12px", fontSize: "14px", cursor: "pointer" }}
          >
            Clear Logs & Transcript
          </button>
        </div>
        <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", background: "#fff", fontSize: "0.9em", borderRadius: "3px" }}>
          {logs.length === 0 && <p>No events yet. Click "Start Listening" to see logs.</p>}
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px dashed #eee", display: "flex", flexWrap: "wrap" }}>
              <strong style={{ marginRight: "10px", color: "#777", minWidth: "80px" }}>{log.timestamp}</strong>
              <span style={{ fontWeight: "bold", color: "#0056b3", marginRight: "5px" }}>{log.event}:</span>
              {log.data && <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", flexBasis: "100%", marginTop: "2px", marginLeft: "85px" }}>{log.data}</span>}
              {!log.data && <span style={{ fontStyle: "italic", color: "#666" }}>(No additional data)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminSpeechTest;
