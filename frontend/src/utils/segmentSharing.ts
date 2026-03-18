import brain from 'brain';
import { toast } from 'sonner';
import type { SaveSegmentRequest } from 'types';

/**
 * Save a transcript segment to Firestore for sharing purposes
 * This is separate from session management and focused on real-time segment sharing
 */
export async function saveSegmentToFirestore(
  text: string,
  speakerId: string,
  speakerName: string,
  timestamp: number,
  sessionId: string,
  startTime?: number,
  endTime?: number,
  language?: string,
  isFinal: boolean = true
): Promise<void> {
  try {
    const segmentData: SaveSegmentRequest = {
      session_id: sessionId,
      text: text,
      speaker_id: speakerId,
      speaker_name: speakerName,
      timestamp: timestamp,
      start_time: startTime || null,
      end_time: endTime || null,
      language: language || null,
      is_final: isFinal
    };

    console.log('💾 Saving segment to Firestore for sharing:', {
      sessionId,
      speakerName,
      textLength: text.length,
      timestamp
    });

    const response = await brain.save_segment_to_firestore(segmentData);
    
    if (!response.ok) {
      throw new Error(`Failed to save segment: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to save segment');
    }

    console.log('✅ Segment saved successfully for sharing:', result.segment_id);

  } catch (error) {
    console.error('❌ Failed to save segment to Firestore:', error);
    toast.error('Failed to save segment for sharing');
    throw error; // Re-throw so caller can handle if needed
  }
}
