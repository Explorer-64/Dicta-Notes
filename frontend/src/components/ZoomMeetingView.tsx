import React, { useState, useEffect } from 'react';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, Video } from 'lucide-react';
import type { Meeting } from 'types';

interface ZoomMeetingViewProps {
  onNewMeeting: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
}

export function ZoomMeetingView({ onNewMeeting, onSelectMeeting }: ZoomMeetingViewProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await brain.list_meetings();
        if (response.ok) {
          const data = await response.json();
          setMeetings(data.meetings);
        } else {
          setError('Failed to fetch meetings. Please ensure you are logged into your Zoom account.');
        }
      } catch (err) {
        setError('An error occurred while fetching meetings.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Zoom Meetings
          </CardTitle>
          <Button onClick={onNewMeeting} size="sm">
            New Meeting
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading meetings...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        {!isLoading && !error && (
          <ul className="space-y-2">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="flex justify-between items-center p-2 border rounded-md">
                <div>
                  <p className="font-semibold">{meeting.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    Started at: {new Date(meeting.start_time).toLocaleString()}
                  </p>
                </div>
                <Button onClick={() => onSelectMeeting(meeting)} size="sm">
                  Start Session
                </Button>
              </li>
            ))}
            {meetings.length === 0 && <p>No recent Zoom meetings found.</p>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
