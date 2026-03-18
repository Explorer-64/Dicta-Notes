import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, Undo2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Speaker } from "types";

interface AssignSpeakerPopoverProps {
  /** Current speaker info for the segment */
  currentSpeaker: {
    id: string;
    name: string;
    confidence?: number;
  };
  /** List of all speakers in the session */
  availableSpeakers: Speaker[];
  /** Whether this segment has been user-assigned */
  isUserAssigned?: boolean;
  /** Original AI-assigned speaker (for revert functionality) */
  originalSpeaker?: {
    id: string;
    name: string;
    confidence?: number;
  };
  /** Whether user owns this session (controls editability) */
  canEdit: boolean;
  /** Callback when speaker is assigned */
  onAssignSpeaker: (speakerId: string, speakerName: string, isNew: boolean) => void;
  /** Callback when reverting to AI assignment */
  onRevertToAI?: () => void;
  /** Whether the assignment operation is in progress */
  isLoading?: boolean;
  children: React.ReactNode;
}

export function AssignSpeakerPopover({
  currentSpeaker,
  availableSpeakers,
  isUserAssigned = false,
  originalSpeaker,
  canEdit,
  onAssignSpeaker,
  onRevertToAI,
  isLoading = false,
  children
}: AssignSpeakerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'existing' | 'new'>('existing');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [newSpeakerName, setNewSpeakerName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset form when popover opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedAction('existing');
      setSelectedSpeakerId('');
      setNewSpeakerName('');
      setError('');
    }
    setIsOpen(open);
  };

  // Handle assignment
  const handleAssign = () => {
    setError('');
    
    if (selectedAction === 'existing') {
      if (!selectedSpeakerId) {
        setError('Please select a speaker');
        return;
      }
      
      const selectedSpeaker = availableSpeakers.find(s => s.id === selectedSpeakerId);
      if (!selectedSpeaker) {
        setError('Selected speaker not found');
        return;
      }
      
      onAssignSpeaker(selectedSpeaker.id, selectedSpeaker.name, false);
    } else {
      const trimmedName = newSpeakerName.trim();
      if (!trimmedName) {
        setError('Please enter a speaker name');
        return;
      }
      
      // Check if name already exists
      const existingSpeaker = availableSpeakers.find(s => 
        s.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (existingSpeaker) {
        setError('Speaker name already exists. Please choose a different name or select from existing speakers.');
        return;
      }
      
      // Generate new speaker ID with usr_ prefix and nanoid
      const newSpeakerId = `usr_${trimmedName.toLowerCase().replace(/\s+/g, '_')}_${nanoid(6)}`;
      onAssignSpeaker(newSpeakerId, trimmedName, true);
    }
    
    setIsOpen(false);
  };

  // Don't show popover if user can't edit
  if (!canEdit) {
    return <>{children}</>;
  }

  const isUnknown = /^unknown\b/i.test(currentSpeaker.name) || /Unknown Speaker/i.test(currentSpeaker.name);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign Speaker
            </h4>
            <div className="text-xs text-muted-foreground">
              Current: <span className={isUnknown ? "italic text-gray-500" : "font-medium text-blue-600"}>
                {currentSpeaker.name}
              </span>
              {currentSpeaker.confidence !== undefined && !isUnknown && (
                <span className="ml-1 text-gray-500">({Math.round(currentSpeaker.confidence * 100)}%)</span>
              )}
              {isUserAssigned && (
                <Badge variant="secondary" className="ml-2 text-xs">User Assigned</Badge>
              )}
            </div>
          </div>

          {/* Action selection */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Choose action:</Label>
              <Select value={selectedAction} onValueChange={(value: 'existing' | 'new') => setSelectedAction(value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Assign to existing speaker</SelectItem>
                  <SelectItem value="new">Create new speaker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Existing speaker selection */}
            {selectedAction === 'existing' && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Select speaker:</Label>
                <Select value={selectedSpeakerId} onValueChange={setSelectedSpeakerId}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Choose a speaker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpeakers.map((speaker) => (
                      <SelectItem key={speaker.id} value={speaker.id}>
                        {speaker.name}
                        {speaker.confidence !== undefined && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({Math.round(speaker.confidence * 100)}%)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* New speaker creation */}
            {selectedAction === 'new' && (
              <div className="space-y-2">
                <Label htmlFor="newSpeakerName" className="text-xs font-medium">Speaker name:</Label>
                <Input
                  id="newSpeakerName"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  placeholder="Enter speaker name..."
                  className="h-8"
                  maxLength={50}
                />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={isLoading}
                className="h-8 px-3"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Assign
                  </div>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="h-8 px-3"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
            
            {/* Revert to AI button - only show if user assigned and we have original */}
            {isUserAssigned && originalSpeaker && onRevertToAI && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onRevertToAI();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="h-8 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Revert to AI
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
