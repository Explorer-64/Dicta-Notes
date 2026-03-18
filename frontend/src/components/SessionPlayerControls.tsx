import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Volume2, Download } from "lucide-react";
import { formatTime } from "utils/transcriptionUtils";

export interface Props {
  // State
  isConverting: boolean;
  convertProgress: number;
  isPlaying: boolean;
  canInteract: boolean;
  currentTime: number;
  duration: number; // computed audio duration (may be 0)
  sessionDuration?: number; // fallback for display only
  volume: number;

  // Actions
  onReset: () => void;
  onPlayPause: () => void;
  onDownload: () => void;
  onSeek: (newTime: number) => void;
  onVolumeChange: (newVolume: number) => void;
}

export function SessionPlayerControls(props: Props) {
  const {
    isConverting,
    convertProgress,
    isPlaying,
    canInteract,
    currentTime,
    duration,
    sessionDuration,
    volume,
    onReset,
    onPlayPause,
    onDownload,
    onSeek,
    onVolumeChange,
  } = props;

  const displayDuration = (duration && isFinite(duration))
    ? duration
    : (sessionDuration && sessionDuration > 0 ? sessionDuration : 0);

  return (
    <div className="space-y-4">
      {isConverting && (
        <div className="text-xs text-muted-foreground">
          Preparing audio for Safari… {convertProgress}%
          <div className="w-full h-1 bg-gray-200 rounded mt-1">
            <div className="h-1 bg-blue-500 rounded" style={{ width: `${convertProgress}%` }} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          disabled={!canInteract}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant={isPlaying ? "default" : "outline"}
          size="icon"
          onClick={onPlayPause}
          disabled={!canInteract}
          className={isPlaying ? "bg-primary text-primary-foreground" : ""}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onDownload}
          disabled={!canInteract}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div
          className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (!displayDuration || isConverting) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percentage * displayDuration;
            onSeek(newTime);
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-black transition-all duration-100"
            style={{ width: `${displayDuration ? (currentTime / displayDuration) * 100 : 0}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -mt-1.5 rounded-full bg-black shadow-lg border border-white"
            style={{ left: `calc(${displayDuration ? (currentTime / displayDuration) * 100 : 0}% - 6px)`, display: displayDuration ? 'block' : 'none' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(Math.floor(currentTime || 0))}</span>
          <span>{displayDuration ? formatTime(Math.floor(displayDuration)) : '--:--'}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="w-28"
          disabled={isConverting}
        />
      </div>
    </div>
  );
}
