import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface Props {
  isProcessing: boolean;
  progress: number;
}

export function UploadProgressCard({ isProcessing, progress }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{isProcessing ? "Processing video..." : "Uploading..."}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}
