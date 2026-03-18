export interface TranscriptSegment {
  id: string;
  timestamp: Date;
  text: string;
  speaker?: string;
  translation?: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  audioSize?: number;
}
