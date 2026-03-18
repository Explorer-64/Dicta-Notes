import brain from "brain";
import { TranscriptionRequest } from "types";
import { AppConfig } from 'app-config';

type Architecture = 'v1' | 'v2';

interface DispatcherData {
    audioBlob: Blob;
    meetingTitle: string;
    participants?: string[];
    sessionId?: string | null;
    recordingStartTime?: number | null;
    clientName?: string;
    projectName?: string;
    tags?: string[];
    meetingPurpose?: string;
    languagePreference?: string;
    userId?: string;
}

export const dispatchTranscription = async (data: DispatcherData, architecture: Architecture) => {
    const { audioBlob, meetingTitle, participants, sessionId, recordingStartTime, clientName, projectName, tags, meetingPurpose, languagePreference, userId } = data;

    if (architecture === 'v2') {
        // --- New On-Demand Architecture ---
        console.log("Using v2 architecture: Uploading for on-demand transcription.");
        
        // Build request body according to Brain client contract:
        // BodyUploadAndCreateSession: { audio_file: File; session_details_json: string; language_preference?: string | null }
        const filename = `recording_${Date.now()}.webm`;
        const audioFile = new File([audioBlob], filename, { type: audioBlob.type || 'audio/webm' });

        // Participants must be a string[] per backend model. Do NOT send names if not desired.
        const participantList = (participants || []).filter((p): p is string => typeof p === 'string');

        const sessionDetails = {
            meetingTitle,
            meetingPurpose: meetingPurpose || '',
            participants: participantList, // string[] only
            clientName: clientName || null,
            projectName: projectName || null,
            tags: tags || [],
        };

        try {
            // Only include language_preference if it has a value (omit null/undefined)
            const formData: Record<string, any> = {
                session_details_json: JSON.stringify(sessionDetails),
            };
            if (languagePreference) {
                formData.language_preference = languagePreference;
            }
            
            const response = await brain.upload_and_create_session(
                formData,
                {
                    audio_file: audioFile,
                }
            );
            console.log("v2 upload successful");
            return response;
        } catch (error) {
            console.error("Error dispatching to v2 architecture:", error);
            throw error;
        }

    } else {
        // --- Legacy Streaming Architecture ---
        console.log("Using v1 architecture: Processing with legacy endpoint.");
        
        const base64Audio = await blobToBase64(audioBlob);
        // Strip the data URL prefix to get just the base64 string
        const base64Only = base64Audio.split(',')[1] || base64Audio;
        
        // Determine file extension from MIME type
        const getFileExtension = (mimeType: string) => {
            if (mimeType.includes('webm')) return 'webm';
            if (mimeType.includes('ogg')) return 'ogg';
            if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
            return 'webm'; // fallback
        };
        
        const fileExtension = getFileExtension(audioBlob.type);
        
        const requestBody: TranscriptionRequest = {
            audio_data: base64Only,
            filename: `meeting_${Date.now()}.${fileExtension}`,
            content_type: audioBlob.type,
            meeting_title: meetingTitle,
            participants: participants || [],
            session_id: sessionId || undefined,
            recording_start_time: recordingStartTime || undefined,
            client_name: clientName || undefined,
            project_name: projectName || undefined,
            tags: tags && tags.length > 0 ? tags : undefined,
            meeting_purpose: meetingPurpose || undefined,
            language_preference: languagePreference || undefined
        };

        try {
            const response = await brain.transcribe_audio(requestBody);
            console.log("v1 transcription successful");
            return response;
        } catch (error) {
            console.error("Error dispatching to v1 architecture:", error);
            throw error;
        }
    }
};

/**
 * Dispatches the audio processing request to the appropriate backend architecture (v1 or v2).
 * @returns {Promise<any>} A promise that resolves with the transcription result.
 */
export const dispatchAudioProcessing = async (data: DispatcherData) => {
    const { audioBlob, sessionId, metadata } = data;

    // --- Modern Streaming Architecture ---
    try {
        console.log(`Using v2 architecture: Calling upload_and_create_session for session ${sessionId}`);

        // The 'upload_and_create_session' endpoint now handles everything:
        // - Uploads the audio file
        // - Creates the session document in Firestore
        // - Kicks off the transcription process
        const response = await brain.upload_and_create_session(
            {
                session_id: sessionId,
                on_demand: true,
                // TODO: Clarify where to get the language from. Using 'en-US' as placeholder.
                language: 'en-US',
            },
            {
                audio_file: audioBlob,
                metadata: new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
            }
        );

        console.log("v2 upload_and_create_session response:", response);
        return response;

    } catch (error) {
        console.error("Error in v2 architecture:", error);
        throw error;
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to convert blob to base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
