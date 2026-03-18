import { useState, useCallback } from "react";
import {
  initializeEnhancedMediaRecorder,
  initializeMediaRecorderWithStream,
} from "utils/recording/mediaRecorderUtils";
import { AudioSourceType } from "utils/recording/audioSourceTypes";

export interface UseAudioSourceManagerProps {
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  setErrorMessage: (message: string | null) => void;
}

export const useAudioSourceManager = ({
  mediaRecorderRef,
  audioChunksRef,
  setErrorMessage,
}: UseAudioSourceManagerProps) => {
  const [actualMimeType, setActualMimeType] = useState<string>("audio/webm");

  const initializeAudioSource = useCallback(
    async (
      preferredAudioSource?: AudioSourceType,
      overrideStream?: MediaStream,
    ): Promise<{ success: boolean; sourceType?: AudioSourceType }> => {
      let result: {
        success: boolean;
        mimeType: string;
        sourceType?: AudioSourceType;
      };

      if (overrideStream) {
        // Use the provided stream directly with MediaRecorder
        result = await initializeMediaRecorderWithStream(
          mediaRecorderRef,
          audioChunksRef,
          setErrorMessage,
          overrideStream,
        );
      } else {
        // Try enhanced audio capture first, fall back to regular microphone
        result = await initializeEnhancedMediaRecorder(
          mediaRecorderRef,
          audioChunksRef,
          setErrorMessage,
          preferredAudioSource,
        );
      }

      if (result.success && result.mimeType) {
        setActualMimeType(result.mimeType);
        console.log("📼 Recording will use MIME type:", result.mimeType);
      }

      return { success: result.success, sourceType: result.sourceType };
    },
    [mediaRecorderRef, audioChunksRef, setErrorMessage],
  );

  return {
    actualMimeType,
    initializeAudioSource,
  };
};
