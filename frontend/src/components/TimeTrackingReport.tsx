import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, User, Briefcase } from "lucide-react";

interface TimeTrackingReportProps {
  clientName?: string | null;
  projectName?: string | null;
  sessionTitle: string;
  sessionDuration?: number | null;
  editingTime?: number | null;
  startTime: Date;
}

export function TimeTrackingReport({
  clientName,
  projectName,
  sessionTitle,
  sessionDuration, // in seconds
  editingTime, // in minutes
  startTime
}: TimeTrackingReportProps) {
  // Format time for display (minutes or hours)
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? "s" : ""}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours} hr${hours !== 1 ? "s" : ""} ${remainingMinutes} min${remainingMinutes !== 1 ? "s" : ""}`;
    }
  };
  
  // Format seconds to minutes for display
  const formatSeconds = (seconds: number | null | undefined): string => {
    if (!seconds) return "0 mins";
    const minutes = Math.round(seconds / 60);
    return formatMinutes(minutes);
  };
  
  // Calculate total time (recording + editing)
  const calculateTotalTime = (): string => {
    const recordingMinutes = sessionDuration ? Math.round(sessionDuration / 60) : 0;
    const editingMinutes = editingTime || 0;
    return formatMinutes(recordingMinutes + editingMinutes);
  };
  
  // Calculate date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Time Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Client and project info */}
          <div className="grid grid-cols-2 gap-4">
            {clientName && (
              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm text-muted-foreground">{clientName}</p>
                </div>
              </div>
            )}
            
            {projectName && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{projectName}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Session info */}
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Session Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(startTime)}</p>
            </div>
          </div>
          
          {/* Time breakdown */}
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Breakdown
            </h3>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>Recording Session:</div>
              <div className="text-right">{formatSeconds(sessionDuration)}</div>
              
              <div>Editing & Notes:</div>
              <div className="text-right">{editingTime ? formatMinutes(editingTime) : "0 mins"}</div>
              
              <div className="font-medium border-t pt-1 mt-1">Total Billable:</div>
              <div className="text-right font-medium border-t pt-1 mt-1">{calculateTotalTime()}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
