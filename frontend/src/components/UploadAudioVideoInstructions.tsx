import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Video, Music, Info, CheckCircle2 } from "lucide-react";

export interface Props {}

export const UploadAudioVideoInstructions: React.FC<Props> = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            Upload Audio/Video to Create a Session
          </CardTitle>
          <CardDescription>
            Add pre-recorded meetings by uploading audio or video files. Video files are processed for audio only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded p-3">
            <p className="text-blue-800 dark:text-blue-200">
              New Sessions tab: <strong>Upload Audio/Video</strong>. Drag & drop files or click to browse, add meeting details, then click
              <span className="mx-1 font-semibold text-green-700">Save to Sessions</span> to start processing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-zinc-900 rounded border p-3">
              <div className="flex items-center gap-2 mb-2"><Music className="h-4 w-4 text-green-600" /><h4 className="font-semibold">Audio formats</h4></div>
              <p className="text-muted-foreground">mp3, wav, m4a, webm, ogg, flac</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded border p-3">
              <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-purple-600" /><h4 className="font-semibold">Video formats</h4></div>
              <p className="text-muted-foreground">mp4, mov, avi, webm, mkv (audio will be extracted)</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded border p-3">
              <div className="flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-orange-600" /><h4 className="font-semibold">Notes</h4></div>
              <p className="text-muted-foreground">Video is processed for audio only. Large files show a progress bar during upload and extraction.</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Steps</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to <span className="font-medium">Sessions</span> and open the <Badge variant="secondary">Upload Audio/Video</Badge> tab.</li>
              <li>Drag your file into the drop zone or click to choose a file.</li>
              <li>Fill in meeting details: <em>Title</em> (required), <em>Client</em>, <em>Project</em>, <em>Purpose</em>, <em>Tags</em>.</li>
              <li>Click <span className="font-medium text-green-700">Save to Sessions</span> to upload. You’ll see an upload progress indicator.</li>
              <li>If you uploaded a video, the app will automatically extract audio before saving.</li>
              <li>After upload completes, you’ll be taken to the new Session Detail page.</li>
              <li>From the Session Detail page, click <strong>Process</strong> to run AI transcription (Google Gemini 2.5) when ready.</li>
            </ol>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Tips</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use descriptive titles so it’s easy to find your session later.</li>
              <li>Tags help you filter sessions by topic or client.</li>
              <li>Some plans include upload limits. If you hit a limit, you’ll see an upgrade prompt.</li>
              <li>Keep the browser tab open during upload; you can work in other tabs.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 text-green-700 mt-2">
            <CheckCircle2 className="h-4 w-4" />
            <p>Speaker identification and translation are available after transcription completes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
