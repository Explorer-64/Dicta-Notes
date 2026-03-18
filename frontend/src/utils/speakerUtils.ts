import { Speaker, TranscriptionSegment } from 'types';

/**
 * Extract unique speakers from a session's speaker list or transcript segments
 * @param speakers - Array of speakers from session data
 * @param segments - Array of transcript segments (fallback if speakers array is empty)
 * @returns Array of unique speakers
 */
export function extractUniqueSpeakers(
  speakers?: Speaker[] | null,
  segments?: TranscriptionSegment[] | null
): Speaker[] {
  // First try to use the speakers array if available
  if (speakers && speakers.length > 0) {
    return speakers;
  }
  
  // Fallback: extract speakers from segments
  if (!segments || segments.length === 0) {
    return [];
  }
  
  const speakerMap = new Map<string, Speaker>();
  
  segments.forEach(segment => {
    if (segment.speaker) {
      const speakerId = segment.speaker.id;
      if (!speakerMap.has(speakerId)) {
        speakerMap.set(speakerId, {
          id: segment.speaker.id,
          name: segment.speaker.name
        });
      }
    }
  });
  
  return Array.from(speakerMap.values());
}

/**
 * Create speaker name mapping from old names to new names
 * @param speakers - Array of current speakers
 * @param newNames - Object mapping speaker IDs to new names
 * @returns Object mapping old names to new names for API request
 */
export function createSpeakerNameMapping(
  speakers: Speaker[],
  newNames: Record<string, string>
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  speakers.forEach(speaker => {
    const newName = newNames[speaker.id];
    if (newName && newName.trim() !== '' && newName !== speaker.name) {
      mapping[speaker.name] = newName.trim();
    }
  });
  
  return mapping;
}

/**
 * Validate speaker names to ensure they're not empty or duplicated
 * @param speakers - Array of current speakers
 * @param newNames - Object mapping speaker IDs to new names
 * @returns Object with validation result and error messages
 */
export function validateSpeakerNames(
  speakers: Speaker[],
  newNames: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const usedNames = new Set<string>();
  
  // Check each speaker's new name
  speakers.forEach(speaker => {
    const newName = newNames[speaker.id]?.trim() || speaker.name;
    
    // Check for empty names
    if (!newName || newName.length === 0) {
      errors.push(`Speaker name cannot be empty`);
      return;
    }
    
    // Check for duplicate names
    if (usedNames.has(newName.toLowerCase())) {
      errors.push(`Duplicate speaker name: "${newName}"`);
    } else {
      usedNames.add(newName.toLowerCase());
    }
    
    // Check for reasonable length
    if (newName.length > 50) {
      errors.push(`Speaker name "${newName}" is too long (max 50 characters)`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get display names for speakers, using new names if provided
 * @param speakers - Array of current speakers
 * @param newNames - Object mapping speaker IDs to new names
 * @returns Object mapping speaker IDs to display names
 */
export function getSpeakerDisplayNames(
  speakers: Speaker[],
  newNames: Record<string, string>
): Record<string, string> {
  const displayNames: Record<string, string> = {};
  
  speakers.forEach(speaker => {
    displayNames[speaker.id] = newNames[speaker.id]?.trim() || speaker.name;
  });
  
  return displayNames;
}

/**
 * Check if any speaker names have been changed
 * @param speakers - Array of current speakers
 * @param newNames - Object mapping speaker IDs to new names
 * @returns True if any names have been changed
 */
export function hasChangedSpeakerNames(
  speakers: Speaker[],
  newNames: Record<string, string>
): boolean {
  return speakers.some(speaker => {
    const newName = newNames[speaker.id]?.trim();
    return newName && newName !== speaker.name;
  });
}
