import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { TimeTrackingReport } from "components/TimeTrackingReport";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import brain from "brain";

interface NotesTabProps {
  sessionId: string;
  notes?: string | null;
  timeSpent?: number | null;
  onNotesUpdated: (notes: string, timeSpent: number) => void;
  clientName?: string | null;
  projectName?: string | null;
  sessionTitle: string;
  sessionDuration?: number | null;
  sessionStartTime: Date;
}

export function NotesTab({ 
  sessionId, 
  notes, 
  timeSpent = 0, 
  onNotesUpdated, 
  clientName, 
  projectName, 
  sessionTitle,
  sessionDuration,
  sessionStartTime
}: NotesTabProps) {
  const [editMode, setEditMode] = useState(false);
  const [notesContent, setNotesContent] = useState(notes || "");
  const [editorValue, setEditorValue] = useState("");
  
  // Initialize editor value when notes change
  useEffect(() => {
    setEditorValue(notes || "");
  }, [notes]);
  const [editTimeSpent, setEditTimeSpent] = useState(timeSpent || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [savedTimeSpent, setSavedTimeSpent] = useState(timeSpent || 0);
  const [savedNotes, setSavedNotes] = useState(notes || "");

  // Format minutes into hours and minutes display
  const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
    }
  };

  // Handle saving notes and time spent
  const handleSaveNotes = async () => {
    if (editorValue === savedNotes && editTimeSpent === savedTimeSpent) {
      setEditMode(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use brain API to update notes
      const response = await brain.update_session(
        { sessionId },
        {
          notes: editorValue,
          time_spent: editTimeSpent
        }
      );
      
      if (response.ok) {
        toast.success("Notes and time tracking updated");
        setSavedNotes(editorValue);
        setNotesContent(editorValue);
        setSavedTimeSpent(editTimeSpent);
        setEditMode(false);
        onNotesUpdated(notesContent, editTimeSpent);
      } else {
        throw new Error("Failed to update notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle increment/decrement time
  const adjustTime = (amount: number) => {
    const newTime = Math.max(0, editTimeSpent + amount);
    setEditTimeSpent(newTime);
  };

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
      </TabsList>
      
      <TabsContent value="notes" className="mt-4">
        <Card>
      <CardHeader className="pb-3">
        <CardTitle>Professional Notes</CardTitle>
        <div className="text-sm text-muted-foreground mt-1">
          {!editMode ? (
            savedTimeSpent > 0 ? (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Time spent: {formatTimeSpent(savedTimeSpent)}</span>
              </div>
            ) : (
              <span>Add professional notes and track time for this session</span>
            )
          ) : (
            <span>Edit your professional notes and time tracking</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!editMode ? (
          savedNotes ? (
            <ScrollArea className="h-[300px] w-full pr-4">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: savedNotes }}></div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No notes have been added yet.</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setEditMode(true)}
              >
                Add Notes
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="min-h-[220px]">
              <ReactQuill 
                theme="snow"
                value={editorValue}
                onChange={setEditorValue}
                placeholder="Add your professional notes here..."
                className="h-[180px] mb-10"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                  ]
                }}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Time Spent on This Session</label>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustTime(-5)}
                  disabled={editTimeSpent <= 0}
                >
                  -5m
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustTime(-15)}
                  disabled={editTimeSpent < 15}
                >
                  -15m
                </Button>
                
                <div className="flex-1 text-center font-medium">
                  {formatTimeSpent(editTimeSpent)}
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustTime(15)}
                >
                  +15m
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustTime(5)}
                >
                  +5m
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        {editMode ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditorValue(savedNotes);
                setEditTimeSpent(savedTimeSpent);
                setEditMode(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNotes} 
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div></div> {/* Empty div for spacing */}
            <Button 
              onClick={() => setEditMode(true)}
              variant={savedNotes ? "outline" : "default"}
              className="gap-1"
            >
              {savedNotes ? "Edit Notes" : "Add Notes"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
      </TabsContent>
      
      <TabsContent value="time-tracking" className="mt-4">
        <TimeTrackingReport
          clientName={clientName}
          projectName={projectName}
          sessionTitle={sessionTitle}
          sessionDuration={sessionDuration}
          editingTime={savedTimeSpent}
          startTime={sessionStartTime}
        />
      </TabsContent>
    </Tabs>
  );
}
