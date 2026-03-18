


import brain from 'brain';
import { toast } from 'sonner';

/**
 * Session management utilities for recording
 */

export async function createSessionIfNeeded(
  isRecording: boolean,
  sessionId: string | null,
  isCreatingSession: boolean,
  meetingTitle: string,
  clientName?: string,
  projectName?: string,
  tags?: string[],
  setIsCreatingSession: (value: boolean) => void,
  setSessionId: (value: string | null) => void
): Promise<void> {
  // Don't create a session if already recording or if a session ID already exists
  if (isRecording || sessionId || isCreatingSession) return;
  
  setIsCreatingSession(true);
  try {
    console.log('Creating session upfront for sharing...');
    const initialSessionResponse = await brain.save_session({
      title: meetingTitle || 'Untitled Meeting',
      client_name: clientName || null,
      project_name: projectName || null,
      tags: tags && tags.length > 0 ? tags : null,
      duration: 0,
    });

    if (initialSessionResponse.ok) {
      const sessionData = await initialSessionResponse.json();
      if (sessionData && sessionData.session_id) {
        setSessionId(sessionData.session_id);
        console.log('Session created for sharing with ID:', sessionData.session_id);
        toast.success('Session ready for sharing');
      } else {
        console.error('Failed to get session_id from initial save_session response', sessionData);
        toast.error('Could not create shareable session. Please try again.');
      }
    } else {
      const errorText = await initialSessionResponse.text();
      console.error('Failed to create shareable session:', initialSessionResponse.status, errorText);
      toast.error(`Could not create shareable session: ${errorText}. Please try again.`);
    }
  } catch (error) {
    console.error('Error creating shareable session:', error);
    toast.error('Error creating shareable session. Please try again.');
  } finally {
    setIsCreatingSession(false);
  }
}
