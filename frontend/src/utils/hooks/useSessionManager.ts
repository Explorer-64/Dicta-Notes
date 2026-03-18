

import { useCallback } from 'react';
import { useSessionStore } from 'utils/stores/sessionStore';
import { createSessionIfNeeded } from '../recording/sessionHelpers';
import type { TranscriptionResponse } from 'types';

export const useSessionManager = () => {
  const { sessionId, setSessionId, isCreatingSession, setIsCreatingSession } = useSessionStore();

  const handleCreateSession = useCallback(async (options: {
    meetingTitle: string,
    clientName?: string,
    projectName?: string,
    tags?: string[],
  }) => {
    // This logic is now a direct copy of what was in useRecordingManager
    if (sessionId || isCreatingSession) return;

    await createSessionIfNeeded(
      false, // isRecording is false when this is called
      sessionId,
      isCreatingSession,
      options.meetingTitle,
      options.clientName,
      options.projectName,
      options.tags,
      setIsCreatingSession,
      setSessionId
    );
  }, [sessionId, isCreatingSession, setIsCreatingSession, setSessionId]);

  return {
    sessionId,
    isCreatingSession,
    setSessionId, // Expose setter for direct updates from legacy components
    createSessionIfNeeded: handleCreateSession,
  };
};
