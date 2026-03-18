import React from "react";
import { InfoIcon } from "lucide-react";

interface Props {
  transcriptionMode: 'browser' | 'gemini' | 'hybrid';
  isOffline: boolean;
  className?: string;
}

export const TranscriptionLegend: React.FC<Props> = ({
  transcriptionMode,
  isOffline,
  className = "",
}) => {
  return (
    <div className={`p-3 bg-white rounded-md border-l-4 border-blue-500 mb-2 shadow-sm ${className}`}>
      <div className="flex items-start">
        <InfoIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 mb-1">Transcription Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {(transcriptionMode === 'browser' || transcriptionMode === 'hybrid') && !isOffline && (
              <div className="flex items-center">
                <span className="h-3 w-3 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-blue-600 font-medium">Browser Speech API</span>
                <span className="text-gray-500 ml-2">(immediate, less accurate)</span>
              </div>
            )}
            {isOffline && (
              <div className="flex items-center">
                <span className="h-3 w-3 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-blue-600 font-medium">Offline Mode</span>
                <span className="text-gray-500 ml-2">(browser only)</span>
              </div>
            )}
            {(transcriptionMode === 'gemini' || transcriptionMode === 'hybrid') && !isOffline && (
              <div className="flex items-center">
                <span className="h-3 w-3 bg-gray-800 rounded-full mr-2"></span>
                <span className="text-gray-900 font-medium">Gemini Enhanced</span>
                <span className="text-gray-500 ml-2">(speaker identification)</span>
              </div>
            )}
            {transcriptionMode === 'hybrid' && !isOffline && (
              <div className="flex items-center sm:col-span-2 mt-1">
                <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-green-700 font-medium">Hybrid Mode Active</span>
                <span className="text-gray-500 ml-2">(combining immediate display with AI corrections)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
