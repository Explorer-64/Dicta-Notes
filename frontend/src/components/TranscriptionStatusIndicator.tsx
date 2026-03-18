import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

type TranscriptionMode = 'browser' | 'gemini' | 'hybrid';

interface Props {
  mode: TranscriptionMode;
  isOffline: boolean;
  isProcessing: boolean;
  className?: string;
}

export const TranscriptionStatusIndicator: React.FC<Props> = ({
  mode,
  isOffline,
  isProcessing,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={mode === 'browser' ? 'default' : 
               (mode === 'gemini' ? 'secondary' : 'outline')}
      >
        {mode === 'browser' ? 'Browser Text' : 
         (mode === 'gemini' ? 'Gemini Enhanced' : 'Hybrid Transcription')}
      </Badge>
      
      {isOffline && (
        <Badge variant="destructive">Offline Mode</Badge>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Processing audio...</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptionStatusIndicator;
