import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface Props {
  sessionTitle: string;
  onSessionTitleChange: (value: string) => void;
  participants: string;
  onParticipantsChange: (value: string) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  meetingPurpose: string;
  onMeetingPurposeChange: (value: string) => void;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
}

export function UploadSessionDetailsForm({
  sessionTitle,
  onSessionTitleChange,
  participants,
  onParticipantsChange,
  clientName,
  onClientNameChange,
  projectName,
  onProjectNameChange,
  meetingPurpose,
  onMeetingPurposeChange,
  tags,
  onAddTag,
  onRemoveTag,
  disabled = false,
}: Props) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTagClick = () => {
    if (tagInput.trim()) {
      onAddTag(tagInput.trim());
      setTagInput("");
    }
  };

  const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTagClick();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Details</CardTitle>
        <CardDescription>Add information about this session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Session Title *</Label>
          <Input
            id="title"
            value={sessionTitle}
            onChange={(e) => onSessionTitleChange(e.target.value)}
            placeholder="Enter session title"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="participants">Participants</Label>
          <Input
            id="participants"
            value={participants}
            onChange={(e) => onParticipantsChange(e.target.value)}
            placeholder="Comma-separated names (e.g., John, Jane, Bob)"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              placeholder="Client name (optional)"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project Name</Label>
            <Input
              id="project"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Project name (optional)"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Meeting Purpose</Label>
          <Textarea
            id="purpose"
            value={meetingPurpose}
            onChange={(e) => onMeetingPurposeChange(e.target.value)}
            placeholder="Brief description of the meeting purpose (optional)"
            rows={3}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag and press Enter"
              disabled={disabled}
            />
            <Button type="button" onClick={handleAddTagClick} disabled={disabled} variant="outline">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {tag}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
