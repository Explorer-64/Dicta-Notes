import { formatTime } from "utils/transcriptionUtils";

// Enhanced speaker name correction utility for transcripts
export const updateTranscriptWithSpeakerNames = (text: string, speakers: string[]): string => {
  if (!text || !speakers || speakers.length === 0) return text;
  
  let updatedTranscript = text;
  
  // Create a mapping of generic speaker names to their updated names
  const speakerMapping: Record<string, string> = {};
  
  // Map "Speaker 1" to the actual name if available
  speakers.forEach((speaker, index) => {
    speakerMapping[`Speaker ${index + 1}`] = speaker;
  });
  
  // Replace all occurrences of generic speaker names with their actual names
  Object.entries(speakerMapping).forEach(([genericName, actualName]) => {
    // Only replace if the actual name is different from the generic name
    if (actualName !== genericName) {
      // Match at line start or after timestamp
      const pattern = new RegExp(`(^|\\]\\s*)${genericName}(\\s*\\(LIVE\\))?:`, 'gm');
      updatedTranscript = updatedTranscript.replace(pattern, `$1${actualName}$2:`);
      
      // Also replace mentions within text that look like "Speaker X"
      const mentionPattern = new RegExp(`\\b${genericName}\\b(?! \\(LIVE\\))(?!:)`, 'g');
      updatedTranscript = updatedTranscript.replace(mentionPattern, actualName);
    }
  });
  
  return updatedTranscript;
};

// Format timestamp for transcript entries
export const formatTimestamp = (seconds: number): string => {
  return formatTime(seconds);
};

// Store local backup of transcript for offline scenarios
export const storeLocalBackup = (text: string, meetingTitle: string, companyId?: string | null, meetingPurpose?: string | null) => {
  try {
    // Store in sessionStorage for recovery if browser closed
    sessionStorage.setItem('dictaNotes_transcript_backup', text);
    sessionStorage.setItem('dictaNotes_title_backup', meetingTitle);
    sessionStorage.setItem('dictaNotes_timestamp_backup', new Date().toISOString());
    sessionStorage.setItem('dictaNotes_company_backup', companyId || '');
    sessionStorage.setItem('dictaNotes_purpose_backup', meetingPurpose || '');
  } catch (error) {
    console.error('Error saving local backup:', error);
  }
};

// Clear local backup data
export const clearLocalBackup = () => {
  sessionStorage.removeItem('dictaNotes_transcript_backup');
  sessionStorage.removeItem('dictaNotes_title_backup');
  sessionStorage.removeItem('dictaNotes_timestamp_backup');
  sessionStorage.removeItem('dictaNotes_company_backup');
  sessionStorage.removeItem('dictaNotes_purpose_backup');
};

// Identify potential speaker names from transcript context
export const identifySpeakerNamesFromContext = (transcript: string): string[] => {
  if (!transcript) return [];
  
  // Common patterns where names might be mentioned:
  // - Direct address: "John, can you explain..."
  // - References: "as Mary mentioned earlier"
  // - Introductions: "I'm Sarah from marketing"
  
  const possiblePatterns = [
    /([A-Z][a-z]+),\s+(?:can|could|would|will)/g,  // Direct address with comma
    /(?:this is|I'm|I am|my name is)\s+([A-Z][a-z]+)/gi,  // Self-introductions
    /(?:thanks|thank you)\s+([A-Z][a-z]+)/gi,  // Thanking someone
    /(?:ask|tell|said|mentioned)\s+([A-Z][a-z]+)/gi,  // References to others
  ];
  
  const potentialNames = new Set<string>();
  
  // Extract potential names from each pattern
  possiblePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      if (match[1] && match[1].length > 1) {  // Names should be at least 2 chars
        potentialNames.add(match[1]);
      }
    }
  });
  
  return Array.from(potentialNames);
};

// Smart speaker name resolution from context
export const resolveSpeakerNames = (
  transcript: string, 
  currentSpeakers: string[],
  segments: any[]
): string[] => {
  // Extract potential names from context
  const contextNames = identifySpeakerNamesFromContext(transcript);
  
  // Start with current speakers
  const updatedSpeakers = [...currentSpeakers];
  
  // For each generic speaker, try to find a matching name from context
  updatedSpeakers.forEach((speaker, index) => {
    if (speaker.startsWith('Speaker ')) {
      // Look for a name in segments that might correspond to this speaker
      const potentialName = contextNames[0]; // Just take the first identified name as an example
      
      if (potentialName) {
        updatedSpeakers[index] = potentialName;
        // Remove the used name
        contextNames.shift();
      }
    }
  });
  
  return updatedSpeakers;
};