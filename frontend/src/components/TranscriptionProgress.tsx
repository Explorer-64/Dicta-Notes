import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Sparkles } from 'lucide-react';

interface Props {
  isVisible: boolean;
  stage?: 'processing' | 'enhancing' | 'saving';
  message?: string;
}

/**
 * Progress overlay that appears when final transcription processing is in progress
 * Shows user that the system is working after recording stops
 */
export const TranscriptionProgress: React.FC<Props> = ({
  isVisible,
  stage = 'processing',
  message
}) => {
  if (!isVisible) return null;

  const getStageConfig = () => {
    switch (stage) {
      case 'processing':
        return {
          icon: <FileText className="w-5 h-5" />,
          title: 'Processing Audio',
          description: 'Converting your recording to text...',
          color: 'bg-blue-500'
        };
      case 'enhancing':
        return {
          icon: <Sparkles className="w-5 h-5" />,
          title: 'AI Enhancement',
          description: 'Enhancing transcription with speaker identification...',
          color: 'bg-purple-500'
        };
      case 'saving':
        return {
          icon: <FileText className="w-5 h-5" />,
          title: 'Saving Session',
          description: 'Saving your transcription...',
          color: 'bg-green-500'
        };
      default:
        return {
          icon: <FileText className="w-5 h-5" />,
          title: 'Processing',
          description: 'Working on your transcription...',
          color: 'bg-blue-500'
        };
    }
  };

  const config = getStageConfig();
  const displayMessage = message || config.description;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      
      {/* Progress card */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md mx-4 shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Animated icon and spinner */}
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${config.color} opacity-20 animate-pulse`} />
                <Badge 
                  variant="secondary" 
                  className="h-16 w-16 rounded-full flex items-center justify-center border-0 bg-white shadow-sm relative z-10"
                >
                  <div className="relative flex items-center justify-center">
                    {config.icon}
                    <Loader2 className="w-3 h-3 animate-spin absolute -top-1 -right-1 text-blue-500" />
                  </div>
                </Badge>
              </div>
              
              {/* Progress text */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {config.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {displayMessage}
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-2 h-2 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-2 h-2 rounded-full ${config.color} animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Please wait...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TranscriptionProgress;