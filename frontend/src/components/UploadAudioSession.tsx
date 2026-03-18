import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, FileAudio, FileVideo, X, AlertCircle, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { useUserGuardContext } from 'app';
import { UpgradeModal } from 'components/UpgradeModal';
import { Badge } from '@/components/ui/badge';
import { SelectedFileInfo } from 'components/SelectedFileInfo';
import { UploadSessionDetailsForm } from 'components/UploadSessionDetailsForm';
import { UploadProgressCard } from 'components/UploadProgressCard';

// Supported file formats
const AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'flac', 'aac'];
const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
const ALL_FORMATS = [...AUDIO_FORMATS, ...VIDEO_FORMATS];

// File size limits (in bytes) - can be adjusted based on tier
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB default

export default function UploadAudioSession() {
  const navigate = useNavigate();
  const { user } = useUserGuardContext();
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form data
  const [sessionTitle, setSessionTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [participants, setParticipants] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [availableQuota, setAvailableQuota] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'quota_reached' | 'file_too_long'>('quota_reached');

  const goToUploadInstructions = useCallback(() => {
    navigate('/instructions', { state: { tab: 'upload' } });
  }, [navigate]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !ALL_FORMATS.includes(extension)) {
      return `Unsupported file format. Please upload: ${AUDIO_FORMATS.join(', ')} (audio) or ${VIDEO_FORMATS.join(', ')} (video)`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
    }
    
    return null;
  }, []);

  // Helper: Get file duration in minutes
  const getFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const tryElement = (tagName: 'video' | 'audio') => {
        return new Promise<number>((res, rej) => {
          const element = document.createElement(tagName) as HTMLVideoElement | HTMLAudioElement;
          
          element.preload = 'metadata';
          
          // Timeout after 5 seconds
          const timeout = setTimeout(() => {
            window.URL.revokeObjectURL(element.src);
            rej(new Error('Timeout reading metadata'));
          }, 5000);
          
          element.onloadedmetadata = () => {
            clearTimeout(timeout);
            window.URL.revokeObjectURL(element.src);
            const durationMinutes = element.duration / 60;
            
            // Check for invalid duration values
            if (!isFinite(durationMinutes) || isNaN(durationMinutes) || durationMinutes === 0) {
              rej(new Error('Invalid duration'));
              return;
            }
            
            res(durationMinutes);
          };
          
          element.onerror = () => {
            clearTimeout(timeout);
            window.URL.revokeObjectURL(element.src);
            rej(new Error('Failed to load media'));
          };
          
          element.src = URL.createObjectURL(file);
        });
      };

      // Try video element first for video files, then audio element as fallback
      const isVideo = file.type.startsWith('video/') || VIDEO_FORMATS.includes(file.name.split('.').pop()?.toLowerCase() || '');
      const firstTry = isVideo ? 'video' : 'audio';
      const secondTry = isVideo ? 'audio' : 'video';
      
      tryElement(firstTry)
        .then(resolve)
        .catch(() => {
          // If first attempt fails, try the other element type
          tryElement(secondTry)
            .then(resolve)
            .catch(reject);
        });
    });
  };

  // Fetch available quota on mount
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await brain.get_my_tier_info();
        const data = await response.json();
        setAvailableQuota(data.quota_remaining || 0);
      } catch (err) {
        console.error('Failed to fetch quota:', err);
      }
    };
    fetchQuota();
  }, []);

  // Check if file is video
  const isVideoFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? VIDEO_FORMATS.includes(extension) : false;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Auto-populate session title from filename (without extension)
    const filenameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
    setSessionTitle(filenameWithoutExtension);

    // Show info for video files
    if (isVideoFile(file)) {
      toast.info('Video file detected. Audio will be extracted for transcription.');
    }

    // Get file duration
    try {
      const duration = await getFileDuration(file);
      setFileDuration(duration);
      
      // Check if duration exceeds available quota
      if (availableQuota !== null && duration > availableQuota) {
        setUpgradeReason('file_too_long');
        setShowUpgradeModal(true);
        // Do not also show a toast to avoid duplicate messaging
      }
    } catch (err) {
      console.error('Failed to get file duration:', err);
      toast.warning('Could not determine file duration. Upload may fail if file is too long.');
    }
  }, [validateFile, availableQuota]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [sessionTitle]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // Handle tag management moved to callbacks for child component
  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    // Validate duration before upload
    if (fileDuration !== null && availableQuota !== null && fileDuration > availableQuota) {
      setUpgradeReason('file_too_long');
      setShowUpgradeModal(true);
      // Avoid extra toast: modal communicates the limit
      return;
    }

    if (!sessionTitle.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Show processing message for video files
      if (isVideoFile(selectedFile)) {
        setIsProcessing(true);
        toast.info('Processing video file for audio extraction...');
      }

      // Parse participants into array
      const participantsList = participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Prepare session details
      const sessionDetails = {
        meetingTitle: sessionTitle.trim(),
        participants: participantsList,
        clientName: clientName.trim() || null,
        projectName: projectName.trim() || null,
        meetingPurpose: meetingPurpose.trim() || null,
        tags: tags.length > 0 ? tags : null,
      };

      // Simulate upload progress (since the API doesn't provide progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Call the upload API
      // Only include language_preference if it has a value (omit null/undefined)
      const formData: Record<string, any> = {
        session_details_json: JSON.stringify(sessionDetails),
      };
      
      const response = await brain.upload_and_create_session(
        formData,
        {
          audio_file: selectedFile,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Upload response received:', result);
        console.log('🔍 Session ID from response:', result.session_id);
        toast.success('Session created successfully!');
        
        // Navigate to the session detail page
        setTimeout(() => {
          const dest = `/session-detail?sessionId=${result.session_id}`;
          console.log('🔍 Navigating to:', dest);
          navigate(dest);
        }, 500);
      } else {
        // Extract error detail from response
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || `Upload failed with status ${response.status}`;
        
        // Check if this is a quota error
        if (errorMessage.includes('limit') || errorMessage.includes('quota') || errorMessage.includes('minutes')) {
          setUpgradeReason('quota_reached');
          setShowUpgradeModal(true);
          // Modal will show the proper message, no need for toast
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      
      // Extract error message from Response object
      let errorMessage = 'Upload failed';
      
      try {
        // Brain client throws Response objects on error
        if (err instanceof Response) {
          const errorData = await err.json();
          errorMessage = errorData?.detail || `Error ${err.status}: Upload failed`;
        } else if (err?.message) {
          errorMessage = err.message;
        }
      } catch (parseErr) {
        console.error('Failed to parse error:', parseErr);
        errorMessage = `Error: Upload failed with status ${err?.status || 'unknown'}`;
      }
      
      // Check if this is a quota error
      if (errorMessage.includes('limit') || errorMessage.includes('quota') || errorMessage.includes('minutes')) {
        setUpgradeReason('quota_reached');
        setShowUpgradeModal(true);
        // Modal will show the proper message, no need for toast
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Audio or Video File</CardTitle>
          <CardDescription>
            Upload a pre-recorded audio or video file to transcribe. Video files will be processed for audio extraction.
          </CardDescription>
          <div className="mt-2">
            <Button variant="link" size="sm" className="px-0" onClick={goToUploadInstructions}>
              How it works
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drag and drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <Label htmlFor="file-upload">
                <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Browse Files
                </Button>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept={ALL_FORMATS.map(f => `.${f}`).join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: {AUDIO_FORMATS.join(', ')} (audio), {VIDEO_FORMATS.join(', ')} (video)
              </p>
              <p className="text-xs text-muted-foreground">Max file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
            </div>
          ) : (
            <SelectedFileInfo
              file={selectedFile}
              isVideo={isVideoFile(selectedFile)}
              duration={fileDuration}
              isUploading={isUploading}
              onRemove={handleRemoveFile}
            />
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details Form */}
      {selectedFile && (
        <UploadSessionDetailsForm
          sessionTitle={sessionTitle}
          onSessionTitleChange={setSessionTitle}
          participants={participants}
          onParticipantsChange={setParticipants}
          clientName={clientName}
          onClientNameChange={setClientName}
          projectName={projectName}
          onProjectNameChange={setProjectName}
          meetingPurpose={meetingPurpose}
          onMeetingPurposeChange={setMeetingPurpose}
          tags={tags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          disabled={isUploading}
        />
      )}

      {/* Upload Progress */}
      {isUploading && (
        <UploadProgressCard isProcessing={isProcessing} progress={uploadProgress} />
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveFile}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !sessionTitle.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUploading ? 'Saving...' : 'Save to Sessions'}
          </Button>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal}
        onOpenChange={(open) => setShowUpgradeModal(open)}
        trigger={upgradeReason}
      />
    </div>
  );
};
