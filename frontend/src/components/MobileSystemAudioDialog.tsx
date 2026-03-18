import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { detectDevice, getFriendlyBrowserName, getBrowserRedirectUrl } from 'utils/deviceDetection';
import { blockIfRecording } from 'utils/recording/navigationGuards';
import { useMemo } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSystemAudioDialog({ open, onOpenChange }: Props) {
  // Memoize these calls to prevent re-running on every render
  const device = useMemo(() => detectDevice(), []);
  const browserName = useMemo(() => getFriendlyBrowserName(device), [device]);
  const browserUrl = useMemo(() => getBrowserRedirectUrl(), []);
  
  const handleOpenInBrowser = () => {
    const { blocked } = blockIfRecording('Open in Browser');
    if (blocked) {
      // Dialog stays open; user can try again after stopping
      return;
    }
    
    // Simple, reliable approach - just open the URL 
    // Let the system handle how it opens
    window.open(browserUrl, '_blank');
    onOpenChange(false);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(browserUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open in {browserName}</DialogTitle>
          <DialogDescription>
            To capture system audio on mobile, open Dicta-Notes in your device browser.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCopyLink}>Copy Link</Button>
          <Button onClick={handleOpenInBrowser}>Open in {browserName}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
