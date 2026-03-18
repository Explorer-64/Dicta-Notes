

"""Audio noise filtering and preprocessing using RNNoise.

This library provides real-time noise suppression for audio chunks
before they are sent to Gemini for transcription.
"""

import logging
import numpy as np

logger = logging.getLogger("dicta.noise_filter")
import subprocess
import tempfile
import os
from typing import Optional
import struct

class AudioNoiseFilter:
    """RNNoise-based audio noise suppression filter."""
    
    def __init__(self):
        """Initialize the noise filter."""
        self.sample_rate = 16000  # Fixed sample rate for RNNoise
        self.rnnoise_available = self._check_rnnoise_availability()
        logger.debug("RNNoise available: %s", self.rnnoise_available)
    
    def _check_rnnoise_availability(self) -> bool:
        """Check if RNNoise binary is available."""
        try:
            result = subprocess.run(['which', 'rnnoise_demo'], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def _pcm_to_float32(self, pcm_data: bytes) -> np.ndarray:
        """Convert PCM int16 data to float32 array for processing."""
        # Unpack PCM data as signed 16-bit integers
        samples = struct.unpack(f'<{len(pcm_data)//2}h', pcm_data)
        # Convert to float32 in range [-1, 1]
        return np.array(samples, dtype=np.float32) / 32768.0
    
    def _float32_to_pcm(self, float_data: np.ndarray) -> bytes:
        """Convert float32 array back to PCM int16 bytes."""
        # Clamp values to [-1, 1] range
        clamped = np.clip(float_data, -1.0, 1.0)
        # Convert to int16 range
        int16_data = (clamped * 32767).astype(np.int16)
        # Pack back to bytes
        return struct.pack(f'<{len(int16_data)}h', *int16_data)
    
    def _apply_rnnoise(self, pcm_data: bytes) -> bytes:
        """Apply RNNoise filtering to PCM audio data."""
        try:
            with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as input_file:
                input_file.write(pcm_data)
                input_file.flush()
                
                with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as output_file:
                    # Run RNNoise on the audio file
                    result = subprocess.run([
                        'rnnoise_demo', input_file.name, output_file.name
                    ], capture_output=True, text=True, timeout=10)
                    
                    if result.returncode == 0:
                        # Read the filtered audio
                        with open(output_file.name, 'rb') as f:
                            filtered_audio = f.read()
                        logger.debug("RNNoise processed %d -> %d bytes", len(pcm_data), len(filtered_audio))
                        return filtered_audio
                    else:
                        logger.warning("RNNoise failed: %s", result.stderr)
                        return pcm_data  # Return original on failure
                        
        except Exception as e:
            logger.error("RNNoise error: %s", e)
            return pcm_data  # Return original on any error
        finally:
            # Cleanup temp files
            try:
                os.unlink(input_file.name)
                os.unlink(output_file.name)
            except Exception:
                pass
    
    def _apply_simple_filter(self, pcm_data: bytes) -> bytes:
        """Apply simple noise reduction when RNNoise is not available."""
        try:
            # Convert to float32 for processing
            audio_float = self._pcm_to_float32(pcm_data)
            
            # Simple high-pass filter to remove low-frequency noise
            # This is a basic substitute for RNNoise
            if len(audio_float) > 1:
                # Apply gentler moving average filter
                filtered = np.copy(audio_float)
                for i in range(1, len(filtered)):
                    filtered[i] = 0.85 * filtered[i] + 0.15 * filtered[i-1]  # Less aggressive filtering
                
                # Apply very gentle noise gate to preserve speech
                threshold = np.std(filtered) * 0.05  # Lower threshold
                filtered = np.where(np.abs(filtered) < threshold, 
                                  filtered * 0.7, filtered)  # Less reduction (70% instead of 30%)
                
                return self._float32_to_pcm(filtered)
            
            return pcm_data
            
        except Exception as e:
            logger.warning("Simple filter error: %s", e)
            return pcm_data
    
    def filter_audio_chunk(self, pcm_data: bytes, enable_filtering: bool = True) -> bytes:
        """Filter noise from audio chunk.
        
        Args:
            pcm_data: Raw PCM audio data (16-bit, 16kHz, mono)
            enable_filtering: Whether to apply noise filtering
            
        Returns:
            Filtered PCM audio data
        """
        if not enable_filtering:
            return pcm_data
            
        if len(pcm_data) == 0:
            return pcm_data
            
        logger.debug("Filtering audio chunk: %d bytes", len(pcm_data))
        
        if self.rnnoise_available:
            return self._apply_rnnoise(pcm_data)
        else:
            logger.debug("RNNoise not available, using simple filter")
            return self._apply_simple_filter(pcm_data)
    
    def get_filter_info(self) -> dict:
        """Get information about the current filter setup."""
        return {
            "rnnoise_available": self.rnnoise_available,
            "sample_rate": self.sample_rate,
            "filter_type": "RNNoise" if self.rnnoise_available else "Simple"
        }

# Global instance for reuse
_noise_filter_instance: Optional[AudioNoiseFilter] = None

def get_noise_filter() -> AudioNoiseFilter:
    """Get the global noise filter instance."""
    global _noise_filter_instance
    if _noise_filter_instance is None:
        _noise_filter_instance = AudioNoiseFilter()
    return _noise_filter_instance
