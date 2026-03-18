import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RecordingLeaveDialogProps {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

/**
 * Warning dialog shown when user attempts to navigate away from the Transcribe page
 * while recording is in progress.
 * 
 * Provides two options:
 * - Cancel: Stay on the page and continue recording
 * - Continue: Leave the page and lose the recording session
 */
export function RecordingLeaveDialog({
  open,
  onCancel,
  onContinue,
}: RecordingLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // If dialog is being closed via X or overlay click, treat as cancel
      if (!isOpen) {
        onCancel();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Recording in Progress
          </DialogTitle>
          <DialogDescription className="pt-2">
            You have an active recording session. If you leave this page, the session will be lost.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to leave? Any unsaved recording data will be permanently lost.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel - Stay on Page
          </Button>
          <Button
            variant="destructive"
            onClick={onContinue}
            className="w-full sm:w-auto"
          >
            Continue - Leave Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
