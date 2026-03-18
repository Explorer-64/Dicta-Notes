import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PenLine, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isRecording: boolean;
  isPaused?: boolean;
  speakers: string[];
  onUpdateSpeakers: (speakers: string[]) => void;
  onPauseRecording?: () => void;
  activeSpeakerIndex?: number;
  setActiveSpeakerIndex?: (index: number) => void;
}

export const SpeakerNameEditor: React.FC<Props> = ({
  isRecording,
  isPaused,
  speakers,
  onUpdateSpeakers,
  onPauseRecording,
  activeSpeakerIndex = 0,
  setActiveSpeakerIndex
}) => {
  const [open, setOpen] = useState(false);
  const [editableSpeakers, setEditableSpeakers] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [wasRecordingPaused, setWasRecordingPaused] = useState(false);

  // Initialize editable speakers when dialog opens
  const handleOpenDialog = () => {
    // Remove auto-pause functionality - allow editing while recording continues
    // This matches the Gemini Live behavior for seamless meeting flow
    
    setEditableSpeakers(speakers.length > 0 ? [...speakers] : ["Speaker 1"]);
    setOpen(true);
  };

  // Add a new speaker
  const handleAddSpeaker = () => {
    setEditableSpeakers([...editableSpeakers, `Speaker ${editableSpeakers.length + 1}`]);
  };

  // Handle speaker name change
  const handleSpeakerChange = (index: number, name: string) => {
    const newSpeakers = [...editableSpeakers];
    newSpeakers[index] = name;
    setEditableSpeakers(newSpeakers);
  };

  // Remove a speaker
  const handleRemoveSpeaker = (index: number) => {
    const newSpeakers = [...editableSpeakers];
    newSpeakers.splice(index, 1);
    setEditableSpeakers(newSpeakers);
  };

  // Quick add active speaker during recording
  const handleQuickAddSpeaker = () => {
    const newSpeaker = `Speaker ${speakers.length + 1}`;
    const updatedSpeakers = [...speakers, newSpeaker];
    onUpdateSpeakers(updatedSpeakers);
    toast.success(`Added ${newSpeaker}`);
    
    // Set this as the active speaker
    setActiveIndex(updatedSpeakers.length - 1);
  };
  
  // Set the active speaker and record in timeline
  const setActiveSpeaker = (index: number) => {
    setActiveIndex(index);
    if (setActiveSpeakerIndex) {
      setActiveSpeakerIndex(index);
    }
    toast.success(`Speaker timeline: Marked ${speakers[index]} as current speaker`);
  };

  // Save changes
  const handleSave = () => {
    const validSpeakers = editableSpeakers.filter(name => name.trim() !== "");
    onUpdateSpeakers(validSpeakers.length > 0 ? validSpeakers : ["Speaker 1"]);
    setOpen(false);
  };
  
  // Close dialog
  const handleClose = () => {
    setOpen(false);
  };
  
  // Effect to reset wasRecordingPaused when dialog closes
  useEffect(() => {
    if (!open && wasRecordingPaused) {
      setWasRecordingPaused(false);
    }
  }, [open, wasRecordingPaused]);

  return (
    <div className="flex items-center gap-2">
      {/* Quick speaker controls for active recording with timeline tracking */}
      {isRecording && speakers.length > 0 && (
        <div className="flex flex-col gap-1 mr-1">
          <div className="text-xs text-muted-foreground mb-1">Current speaker:</div>
          <div className="flex items-center gap-1">
            {speakers.map((speaker, index) => (
              <Button
                key={index}
                size="sm"
                variant={(activeIndex === index || activeSpeakerIndex === index) ? "default" : "ghost"}
                className={`px-2 py-1 h-8 text-xs ${(activeIndex === index || activeSpeakerIndex === index) ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                onClick={() => setActiveSpeaker(index)}
                title={`Mark ${speaker} as current speaker (creates a timeline marker to improve identification)`}
              >
                {speaker}
              </Button>
            ))}
            
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-8 w-8"
              onClick={handleQuickAddSpeaker}
              title="Add new speaker to timeline"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit speakers button */}
      <Button
        onClick={handleOpenDialog}
        size="sm"
        variant="ghost"
        className={`text-gray-600 h-10 px-3 rounded-md`}
      >
        <PenLine className="mr-2 h-4 w-4" />
        Edit Speakers
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="speaker-dialog-description">
          <DialogHeader>
            <DialogTitle id="speaker-dialog-title">Speaker Management</DialogTitle>
            <DialogDescription id="speaker-dialog-description" className="text-sm text-muted-foreground">
              Add names of meeting participants below. During recording, click on a speaker's name when they start talking - this creates timeline markers that significantly improve Gemini's speaker identification accuracy.
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-xs">
                <strong>How speaker timeline works:</strong> Each time you select a different speaker, we record a timestamp in the timeline. This helps Gemini match voices to names with much higher accuracy in the final transcript.
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {editableSpeakers.map((speaker, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={speaker}
                  onChange={(e) => handleSpeakerChange(index, e.target.value)}
                  placeholder={`Speaker ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleRemoveSpeaker(index)}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  ✕
                </Button>
              </div>
            ))}

            <Button
              onClick={handleAddSpeaker}
              variant="outline"
              className="w-full mt-2"
            >
              + Add Speaker
            </Button>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              onClick={handleClose}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
