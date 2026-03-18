import { AudioSourceType, AudioSource, BrowserCapabilities } from './audioSourceTypes';

/**
 * Detect browser capabilities for different audio capture methods
 */
export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detect browser
  let browserName = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
  }
  
  // Check basic API support
  const supportsGetDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  const supportsMicrophone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  // System audio support based on browser and platform
  let supportsSystemAudio = false;
  let supportsTabAudio = false;
  
  if (browserName === 'Chrome' || browserName === 'Edge') {
    // Chrome/Edge support system audio on Windows and ChromeOS
    // Tab audio on macOS and Linux
    if (platform.includes('Win') || userAgent.includes('CrOS')) {
      supportsSystemAudio = true;
    } else if (platform.includes('Mac') || platform.includes('Linux')) {
      supportsTabAudio = true;
    }
  }
  // Firefox and Safari don't support system/tab audio capture
  
  return {
    supportsGetDisplayMedia,
    supportsSystemAudio,
    supportsTabAudio,
    supportsMicrophone,
    browserName,
    platform
  };
}

/**
 * Get available audio sources based on browser capabilities
 */
export async function getAvailableAudioSources(): Promise<AudioSource[]> {
  const capabilities = await detectBrowserCapabilities();
  const sources: AudioSource[] = [];
  
  // Microphone is always the primary option
  if (capabilities.supportsMicrophone) {
    sources.push({
      type: AudioSourceType.MICROPHONE,
      label: 'Microphone',
      description: 'Capture audio from your microphone',
      supported: true,
      requiresScreenShare: false,
      icon: 'mic'
    });
  }
  
  // System audio (full computer audio)
  if (capabilities.supportsSystemAudio) {
    sources.push({
      type: AudioSourceType.SYSTEM_AUDIO,
      label: 'System Audio',
      description: 'Capture all audio from your computer (requires screen sharing)',
      supported: true,
      requiresScreenShare: true,
      icon: 'monitor-speaker'
    });
  }
  
  // Tab audio (browser tab audio)
  if (capabilities.supportsTabAudio) {
    sources.push({
      type: AudioSourceType.TAB_AUDIO,
      label: 'Tab Audio',
      description: 'Capture audio from a browser tab (requires tab sharing)',
      supported: true,
      requiresScreenShare: true,
      icon: 'browser'
    });
  }
  
  // Add unsupported options with explanations
  if (!capabilities.supportsSystemAudio && !capabilities.supportsTabAudio) {
    if (capabilities.browserName === 'Firefox') {
      sources.push({
        type: AudioSourceType.SYSTEM_AUDIO,
        label: 'System Audio (Not Available)',
        description: 'Firefox does not support system audio capture. Use Chrome or Edge for meeting audio.',
        supported: false,
        requiresScreenShare: true,
        icon: 'monitor-speaker-off'
      });
    } else if (capabilities.browserName === 'Safari') {
      sources.push({
        type: AudioSourceType.SYSTEM_AUDIO,
        label: 'System Audio (Not Available)',
        description: 'Safari does not support system audio capture. Use Chrome or Edge for meeting audio.',
        supported: false,
        requiresScreenShare: true,
        icon: 'monitor-speaker-off'
      });
    }
  }
  
  return sources;
}

/**
 * Get capability warning message for unsupported browsers
 */
export function getCapabilityWarning(capabilities: BrowserCapabilities): string | null {
  if (!capabilities.supportsSystemAudio && !capabilities.supportsTabAudio) {
    if (capabilities.browserName === 'Firefox') {
      return 'For best meeting audio capture, consider using Chrome or Edge which support system audio sharing.';
    }
    if (capabilities.browserName === 'Safari') {
      return 'Safari does not support meeting audio capture. For capturing meeting audio, please use Chrome or Edge.';
    }
  }
  return null;
}
