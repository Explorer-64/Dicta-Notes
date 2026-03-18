import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, UserRound, Users } from "lucide-react";
import { format } from "date-fns";

interface DocumentMetadata {
  title?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  expected_attendees?: string[];
  document_type?: string;
  extracted_text?: string;
}

interface MeetingInfoCardProps {
  actualStartTime: Date;
  actualAttendees: string[];
  scheduledInfo?: DocumentMetadata;
}

export function MeetingInfoCard({ actualStartTime, actualAttendees, scheduledInfo }: MeetingInfoCardProps) {
  // Comparison function to check if a time is earlier
  const isTimeEarlier = (time1: string, time2: string): boolean => {
    // Convert time strings (assuming format like "10:00 AM") to minutes since midnight
    const convertToMinutes = (timeStr: string): number => {
      const [timePart, ampm] = timeStr.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };
    
    return convertToMinutes(time1) < convertToMinutes(time2);
  };
  
  // Format for displaying date comparison
  const formatDateComparison = (scheduledDate: string, actualDate: Date): React.ReactNode => {
    try {
      // Parse scheduled date (assuming format YYYY-MM-DD)
      const scheduled = new Date(scheduledDate);
      
      // Compare dates
      const scheduledTime = scheduled.getTime();
      const actualTime = new Date(
        actualDate.getFullYear(),
        actualDate.getMonth(),
        actualDate.getDate()
      ).getTime();
      
      const diffDays = Math.round((actualTime - scheduledTime) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Schedule</Badge>;
      } else if (diffDays > 0) {
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{diffDays} day(s) late</Badge>;
      } else {
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{Math.abs(diffDays)} day(s) early</Badge>;
      }
    } catch (e) {
      return null;
    }
  };

  if (!scheduledInfo) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Meeting Information</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Scheduled vs Actual Date/Time */}
        <div>
          <h3 className="text-lg font-medium mb-3">Date & Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> Scheduled
              </h4>
              <div className="flex items-center gap-2">
                {scheduledInfo.scheduled_date && (
                  <div>
                    {scheduledInfo.scheduled_date}
                    {scheduledInfo.scheduled_time && (
                      <span> at {scheduledInfo.scheduled_time}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1" /> Actual
              </h4>
              <div>{format(actualStartTime, "yyyy-MM-dd 'at' h:mm a")}</div>
            </div>
          </div>
          
          {/* Comparison of scheduled vs actual */}
          {scheduledInfo.scheduled_date && (
            <div className="mt-2">
              {formatDateComparison(scheduledInfo.scheduled_date, actualStartTime)}
              
              {scheduledInfo.scheduled_time && (
                <div className="text-sm mt-1">
                  {isTimeEarlier(
                    format(actualStartTime, "h:mm a"), 
                    scheduledInfo.scheduled_time
                  ) ? (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Started early</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Started late</Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Attendees */}
        <div>
          <h3 className="text-lg font-medium mb-3">Attendees</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <UserRound className="w-4 h-4 mr-1" /> Expected
              </h4>
              {scheduledInfo.expected_attendees && scheduledInfo.expected_attendees.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {scheduledInfo.expected_attendees.map((attendee, i) => (
                    <li key={i}>{attendee}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No expected attendees listed</div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1" /> Actual
              </h4>
              {actualAttendees.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {actualAttendees.map((attendee, i) => (
                    <li key={i}>{attendee}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No detected speakers</div>
              )}
            </div>
          </div>
          
          {/* Comparison */}
          {scheduledInfo.expected_attendees && scheduledInfo.expected_attendees.length > 0 && actualAttendees.length > 0 && (
            <div className="mt-2">
              {scheduledInfo.expected_attendees.length === actualAttendees.length ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">All expected attendees present</Badge>
              ) : scheduledInfo.expected_attendees.length > actualAttendees.length ? (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  Missing {scheduledInfo.expected_attendees.length - actualAttendees.length} expected attendees
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {actualAttendees.length - scheduledInfo.expected_attendees.length} additional attendees
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
