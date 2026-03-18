import React from "react";
import { Button } from "@/components/ui/button";
import { FileAudio, FileVideo, X } from "lucide-react";

export interface Props {
  file: File;
  isVideo: boolean;
  duration?: number | null;
  isUploading: boolean;
  onRemove: () => void;
}

export function SelectedFileInfo({ file, isVideo, duration, isUploading, onRemove }: Props) {
  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-start gap-3">
        {isVideo ? (
          <FileVideo className="h-10 w-10 text-purple-500 flex-shrink-0" />
        ) : (
          <FileAudio className="h-10 w-10 text-blue-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
            {isVideo && (
              <span className="ml-2 text-purple-600">• Video file - audio will be extracted</span>
            )}
          </p>
          {typeof duration === "number" && !Number.isNaN(duration) && Number.isFinite(duration) && (
            <p className="text-sm text-muted-foreground mt-1">Duration: {Math.round(duration)} minutes</p>
          )}
        </div>
        {!isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
