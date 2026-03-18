

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import type { Speaker, UpdateSpeakerNamesRequest, UpdateSpeakerNamesResponse } from 'types';
import { 
  validateSpeakerNames, 
  createSpeakerNameMapping, 
  hasChangedSpeakerNames 
} from 'utils/speakerUtils';

export interface Props {
  sessionId: string;
  speakers: Speaker[];
  onSuccess: (updatedSpeakers: Speaker[]) => void;
  onError?: (error: string) => void;
}

export function SpeakerNameUpdateForm({ sessionId, speakers, onSuccess, onError }: Props) {
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form with current speaker names
  useEffect(() => {
    const initialNames: Record<string, string> = {};
    speakers.forEach(speaker => {
      initialNames[speaker.id] = speaker.name;
    });
    setNewNames(initialNames);
  }, [speakers]);

  // Handle input change for speaker names
  const handleNameChange = (speaker: string, newName: string) => {
    setNewNames(prev => ({
      ...prev,
      [speaker]: newName
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Reset form to original names
  const handleReset = () => {
    const originalNames: Record<string, string> = {};
    speakers.forEach(speaker => {
      originalNames[speaker.id] = speaker.name;
    });
    setNewNames(originalNames);
    setValidationErrors([]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against undefined sessionId
    if (!sessionId || sessionId === 'undefined') {
      const errorMsg = 'Session ID is not available. Please reload the page and try again.';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return;
    }
    
    // Validate speaker names
    const validation = validateSpeakerNames(speakers, newNames);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Check if any names have actually changed
    if (!hasChangedSpeakerNames(speakers, newNames)) {
      toast.info('No changes detected in speaker names');
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);

    try {
      // Create mapping for API request
      const speakerMappings = createSpeakerNameMapping(speakers, newNames);
      
      const requestBody: UpdateSpeakerNamesRequest = {
        speaker_mappings: speakerMappings
      };

      // Call API to update speaker names
      const response = await brain.update_speaker_names(
        { sessionId }, 
        requestBody
      );
      
      const result: UpdateSpeakerNamesResponse = await response.json();
      
      if (result.success) {
        toast.success('Speaker names updated successfully!');
        onSuccess(result.updated_speakers);
      } else {
        const errorMsg = result.message || 'Failed to update speaker names';
        toast.error(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      console.error('Error updating speaker names:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to update speaker names');
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = hasChangedSpeakerNames(speakers, newNames);

  if (speakers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No speakers found in this session transcript.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Edit Speaker Names
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Speaker Name Inputs */}
          <div className="space-y-4">
            {speakers.map((speaker) => (
              <div key={speaker.id} className="space-y-2">
                <Label htmlFor={`speaker-${speaker.id}`} className="text-sm font-medium">
                  Speaker {speaker.id}
                </Label>
                <Input
                  id={`speaker-${speaker.id}`}
                  type="text"
                  value={newNames[speaker.id] || ''}
                  onChange={(e) => handleNameChange(speaker.id, e.target.value)}
                  placeholder={`Enter name for ${speaker.name}`}
                  className="w-full"
                  disabled={isLoading}
                />
                {speaker.name !== newNames[speaker.id] && newNames[speaker.id] && (
                  <p className="text-xs text-muted-foreground">
                    Current: {speaker.name} → New: {newNames[speaker.id]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Info Text */}
          <Alert>
            <AlertDescription className="text-sm">
              Updating speaker names will re-process the entire transcript using AI. 
              This may take a few moments to complete.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !hasChanges}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-processing transcript...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Names
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isLoading || !hasChanges}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
