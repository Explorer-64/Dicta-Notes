import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, User, Clock, Tags as TagsIcon } from 'lucide-react';
import { TranscribeCompanySection } from './TranscribeCompanySection';
import { Company } from '../utils/company/types';

interface Props {
  meetingTitle: string;
  setMeetingTitle: (value: string) => void;
  meetingPurpose: string;
  setMeetingPurpose: (value: string) => void;
  clientName: string;
  setClientName: (value: string) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  tags: string[];
  setTags: (value: string[]) => void;
  timeSpent: number;
  increaseTimeSpent: (minutes: number) => void;
  onCompanyChange: (companyId: string | null, company: Company | null) => void;
  showFreelancerFields: boolean;
}

/**
 * Form component for meeting metadata inputs
 * Extracted from Transcribe.tsx to improve maintainability
 */
export function MeetingMetadataForm({
  meetingTitle,
  setMeetingTitle,
  meetingPurpose,
  setMeetingPurpose,
  clientName,
  setClientName,
  projectName,
  setProjectName,
  tags,
  setTags,
  timeSpent,
  increaseTimeSpent,
  onCompanyChange,
  showFreelancerFields,
}: Props) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Meeting Setup
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Meeting Title */}
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input 
                id="meeting-title" 
                value={meetingTitle} 
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title" 
                className="w-full" 
              />
              {/* Company context indicator */}
              <TranscribeCompanySection 
                onCompanyChange={onCompanyChange}
                onMeetingTitleUpdate={setMeetingTitle}
              />
            </div>
            
            {/* Meeting Purpose */}
            <div className="space-y-2">
              <Label htmlFor="meeting-purpose">Meeting Purpose</Label>
              <Input 
                id="meeting-purpose" 
                value={meetingPurpose} 
                onChange={(e) => setMeetingPurpose(e.target.value)}
                placeholder="E.g., Staff Meeting, Team Sync, Shareholders" 
                className="w-full" 
              />
              <p className="text-sm text-muted-foreground">
                Specify the type or purpose of this meeting
              </p>
            </div>
            
            {/* Client Name for Freelancers */}
            {showFreelancerFields && (
              <div className="space-y-2">
                <Label htmlFor="client-name" className="flex items-center gap-1">
                  <User size={16} className="text-muted-foreground" />
                  Client Name
                </Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client or organization name"
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name" className="flex items-center gap-1">
                <Briefcase size={16} className="text-muted-foreground" />
                Project Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project or matter name"
                className="w-full"
              />
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags-input" className="flex items-center gap-1">
                <TagsIcon size={16} className="text-muted-foreground" />
                Tags
              </Label>
              <Input
                id="tags-input"
                value={tags.join(", ")}
                onChange={(e) => setTags(e.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
                placeholder="meeting, interview, legal"
                className="w-full"
              />
            </div>
            
            {/* Time Tracking */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock size={16} className="text-muted-foreground" />
                Time Tracking
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => increaseTimeSpent(15)}>+15 min</Button>
                <Button size="sm" variant="outline" onClick={() => increaseTimeSpent(30)}>+30 min</Button>
                <Button size="sm" variant="outline" onClick={() => increaseTimeSpent(60)}>+1 hour</Button>
              </div>
              {timeSpent > 0 && (
                <div className="text-sm font-medium text-green-600">
                  Additional time: {timeSpent} minutes
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
