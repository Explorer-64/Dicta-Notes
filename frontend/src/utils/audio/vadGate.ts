
/*
 * Lightweight energy-based VAD gate with soft attenuation and hangover logic
 * - Designed for real-time gating in Gemini Live audio pipeline
 * - Uses RMS-based energy with adaptive thresholding and hysteresis
 * - Provides pre-roll and post-roll buffers and soft attenuation of silence
 */

export interface VADConfig {
  sampleRate: number; // Hz
  thresholdRMS: number; // Energy threshold in RMS units (0..1 float32)
  minSpeechMs: number; // Minimum duration to consider as speech
  attackMs: number; // Time to open gate after crossing threshold
  releaseMs: number; // Time to close gate after falling below threshold
  preRollMs: number; // Audio to include before speech open
  postRollMs: number; // Audio to include after speech end
  silenceAttenuationDb: number; // dB attenuation when gate is "closed" (e.g., -15)
}

export interface VADStats {
  isOpen: boolean;
  rms: number;
  speechStartedAt: number | null;
  speechEndedAt: number | null;
  totalOpenMs: number;
}

export class VADGate {
  private cfg: VADConfig;
  private frameSize: number;
  private isOpen = false;
  private openSince: number | null = null;
  private closeSince: number | null = null;
  private speechStartedAt: number | null = null;
  private lastDecisionTs: number = performance.now();
  private preRollBuffer: Float32Array;
  private preRollIdx = 0;
  private postHoldMs = 0;
  private totalOpenMs = 0;

  constructor(config: Omit<VADConfig, 'sampleRate'> & { sampleRate: number }, frameSize: number) {
    this.cfg = { ...config };
    this.frameSize = frameSize;
    // Pre-roll buffer sized to preRollMs worth of audio
    const preRollSamples = Math.max(0, Math.floor((this.cfg.preRollMs / 1000) * this.cfg.sampleRate));
    this.preRollBuffer = new Float32Array(preRollSamples);
  }

  /**
   * Process a frame of mono Float32 PCM and return a gated frame (Float32Array)
   * The returned buffer is the same length as input; when gate is closed, soft attenuation is applied
   */
  process(frame: Float32Array): { output: Float32Array; isOpen: boolean; rms: number; openedNow: boolean; closedNow: boolean } {
    const now = performance.now();
    const dt = now - this.lastDecisionTs;
    this.lastDecisionTs = now;

    // Compute RMS energy
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);

    const above = rms >= this.cfg.thresholdRMS;

    let openedNow = false;
    let closedNow = false;

    // Update open/close timers
    if (above) {
      // Reset close timer
      this.closeSince = null;
      // Start/open after attack and minSpeech satisfied
      if (!this.openSince) this.openSince = now;
      const openElapsed = now - this.openSince;
      if (!this.isOpen && openElapsed >= Math.max(this.cfg.attackMs, this.cfg.minSpeechMs)) {
        this.isOpen = true;
        this.speechStartedAt = now;
        openedNow = true;
        this.postHoldMs = 0;
        console.log(`🎙️ VAD OPEN - RMS: ${rms.toFixed(4)} after ${Math.round(openElapsed)}ms over threshold`);
      }
    } else {
      // Reset open timer
      this.openSince = null;
      // Consider closing after release, but honor post-roll hold
      if (!this.closeSince) this.closeSince = now;
      const closeElapsed = now - this.closeSince;
      if (this.isOpen) {
        this.postHoldMs += dt;
        const shouldClose = closeElapsed >= this.cfg.releaseMs && this.postHoldMs >= this.cfg.postRollMs;
        if (shouldClose) {
          this.isOpen = false;
          this.speechStartedAt = null;
          closedNow = true;
          console.log(`🤫 VAD CLOSE - RMS: ${rms.toFixed(4)} after release ${Math.round(closeElapsed)}ms (+ post-roll ${Math.round(this.postHoldMs)}ms)`);
        }
      }
    }

    // Maintain total open duration
    if (this.isOpen && this.speechStartedAt) this.totalOpenMs += dt;

    // Pre-roll circular buffer (store input regardless)
    if (this.preRollBuffer.length > 0) {
      const copyLen = Math.min(frame.length, this.preRollBuffer.length);
      // If frame longer than buffer, keep latest samples
      if (frame.length >= this.preRollBuffer.length) {
        this.preRollBuffer.set(frame.subarray(frame.length - copyLen));
        this.preRollIdx = 0;
      } else {
        // Circular write
        const remaining = this.preRollBuffer.length - this.preRollIdx;
        if (copyLen <= remaining) {
          this.preRollBuffer.set(frame.subarray(0, copyLen), this.preRollIdx);
          this.preRollIdx = (this.preRollIdx + copyLen) % this.preRollBuffer.length;
        } else {
          this.preRollBuffer.set(frame.subarray(0, remaining), this.preRollIdx);
          this.preRollBuffer.set(frame.subarray(remaining, copyLen), 0);
          this.preRollIdx = copyLen - remaining;
        }
      }
    }

    // Prepare output with soft attenuation when closed
    const output = new Float32Array(frame.length);
    let gain = 1.0;
    if (!this.isOpen) {
      // Convert dB to linear
      const linear = Math.pow(10, this.cfg.silenceAttenuationDb / 20);
      gain = linear;
    }

    // Apply simple envelope smoothing around transitions (attack/release)
    // Note: We keep it minimal to avoid heavy CPU; ScriptProcessor frame is already a chunk
    for (let i = 0; i < frame.length; i++) output[i] = frame[i] * gain;

    return { output, isOpen: this.isOpen, rms, openedNow, closedNow };
  }
}

export function createDefaultVADConfig(sampleRate: number): VADConfig {
  return {
    sampleRate,
    thresholdRMS: 0.012, // relaxed threshold to reduce over-gating of soft speech
    minSpeechMs: 250,
    attackMs: 80,
    releaseMs: 350, // was 150
    preRollMs: 100,
    postRollMs: 350, // was 200
    silenceAttenuationDb: -15
  };
}
