import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Share } from "lucide-react";
import { Mode, mode } from "app";

interface Props {
  sessionId: string | null;
  meetingTitle?: string;
}

export const ShareSessionLink: React.FC<Props> = ({ sessionId, meetingTitle }) => {
  if (!sessionId) {
    return null;
  }

  const handleCopyLink = async () => {
    // Generate the shareable link based on current environment
    let shareableLink: string;
    
    if (mode === Mode.DEV) {
      // Development environment - use full path
      shareableLink = `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}/live-share-meeting?sessionId=${sessionId}`;
    } else {
      // Production environment - use custom domain
      shareableLink = `https://dicta-notes.com/live-share-meeting?sessionId=${sessionId}`;
    }
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard!");
    }
  };

  // Generate display URL for the UI
  const getDisplayUrl = () => {
    if (mode === Mode.DEV) {
      return `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}/live-share-meeting?sessionId=${sessionId}`;
    } else {
      return `https://dicta-notes.com/live-share-meeting?sessionId=${sessionId}`;
    }
  };

  return (
    <div className="space-y-3">
      {meetingTitle && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-1">Meeting Title</h4>
          <p className="text-blue-800 text-sm">{meetingTitle}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono text-gray-600 truncate">
          {getDisplayUrl()}
        </div>
        <Button 
          onClick={handleCopyLink}
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
    </div>
  );
};
