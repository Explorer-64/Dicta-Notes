import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Lazy load the heavy WaveSurfer component
const AudioPlayback = lazy(() => import("./AudioPlayback"));

// Loading fallback component
const AudioPlaybackSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Props interface - re-export from original component
interface AudioPlaybackProps {
  audioKey?: string | null;
  audioUrl?: string | null;
  sessionId: string;
  sessionDuration?: number;
  className?: string;
  useUnifiedTimer?: boolean;
}

// Lazy wrapper component
export function LazyAudioPlayback(props: AudioPlaybackProps) {
  return (
    <Suspense fallback={<AudioPlaybackSkeleton />}>
      <AudioPlayback {...props} />
    </Suspense>
  );
}

export default LazyAudioPlayback;
