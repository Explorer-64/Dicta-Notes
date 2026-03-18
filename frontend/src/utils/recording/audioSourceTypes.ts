/**
 * Audio source types for different capture methods
 */
export enum AudioSourceType {
  MICROPHONE = 'microphone',
  SYSTEM_AUDIO = 'system_audio',
  TAB_AUDIO = 'tab_audio'
}

export interface AudioSource {
  type: AudioSourceType;
  label: string;
  description: string;
  supported: boolean;
  requiresScreenShare: boolean;
  icon: string;
}

export interface AudioCaptureConstraints {
  audio: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

export interface AudioCaptureResult {
  stream: MediaStream;
  sourceType: AudioSourceType;
  displayInfo?: {
    isScreenShare: boolean;
    hasSystemAudio: boolean;
    hasTabAudio: boolean;
  };
}

/**
 * Browser capability detection results
 */
export interface BrowserCapabilities {
  supportsGetDisplayMedia: boolean;
  supportsSystemAudio: boolean;
  supportsTabAudio: boolean;
  supportsMicrophone: boolean;
  browserName: string;
  platform: string;
}
