import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  currentSpeaker: string;
  availableSpeakers: string[];
  onSave: (newSpeaker: string) => void;
  onCancel: () => void;
}

/**
 * Inline editor for changing a specific segment's speaker name
 * Shows current speaker and allows quick edit or selection from existing speakers
 */
export function InlineSpeakerEditor({ currentSpeaker, availableSpeakers, onSave, onCancel }: Props) {
  const [newSpeaker, setNewSpeaker] = useState(currentSpeaker);
  const [isCustom, setIsCustom] = useState(false);

  // Auto-focus on input when component mounts
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    const trimmedSpeaker = newSpeaker.trim();
    if (!trimmedSpeaker) {
      toast.error('Speaker name cannot be empty');
      return;
    }
    
    onSave(trimmedSpeaker);
    toast.success(`Speaker updated to: ${trimmedSpeaker}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSelectExisting = (speaker: string) => {
    setNewSpeaker(speaker);
    setIsCustom(false);
  };

  return (
    <div className="p-3 bg-white border border-purple-300 rounded-lg shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
        <User className="w-4 h-4" />
        Edit Speaker Name
      </div>
      
      {/* Quick selection from existing speakers */}
      {availableSpeakers.length > 0 && !isCustom && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Select existing speaker:</div>
          <div className="flex flex-wrap gap-2">
            {availableSpeakers.map((speaker) => (
              <Button
                key={speaker}
                size="sm"
                variant={speaker === newSpeaker ? "default" : "outline"}
                className="text-xs px-3 py-1"
                onClick={() => handleSelectExisting(speaker)}
              >
                {speaker}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs px-3 py-1"
              onClick={() => setIsCustom(true)}
            >
              + Custom Name
            </Button>
          </div>
        </div>
      )}
      
      {/* Custom name input */}
      {(isCustom || availableSpeakers.length === 0) && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">Enter speaker name:</div>
          <Input
            ref={inputRef}
            value={newSpeaker}
            onChange={(e) => setNewSpeaker(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Speaker name"
            className="text-sm"
          />
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="text-xs"
        >
          <Check className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>
      
      <div className="text-xs text-gray-500">
        Tip: This will update the speaker name and inform Gemini for future recognition
      </div>
    </div>
  );
}
