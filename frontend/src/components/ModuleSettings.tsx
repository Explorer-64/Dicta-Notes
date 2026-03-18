import React, { useState } from 'react';
import { Module } from 'utils/useModules';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCurrentUser } from 'app';
import { toast } from 'sonner';
import { useSafeModuleContext } from 'utils/ModuleContext';

export const ModuleSettings: React.FC = () => {
  // Use the module context instead of managing modules locally
  const { modules, loading, error, enableModule, disableModule, refreshModules } = useSafeModuleContext();
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showDisableWarning, setShowDisableWarning] = useState<string | null>(null);
  const { user } = useCurrentUser();
  
  // Handle module toggling with context functions
  const handleEnableModule = async (moduleId: string) => {
    setIsSaving(prev => ({ ...prev, [moduleId]: true }));
    try {
      const success = await enableModule(moduleId);
      if (success) {
        toast.success(`Enabled ${moduleId} module`);
      }
      return success;
    } finally {
      setIsSaving(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  const handleDisableModule = async (moduleId: string) => {
    setIsSaving(prev => ({ ...prev, [moduleId]: true }));
    try {
      const success = await disableModule(moduleId);
      if (success) {
        toast.success(`Disabled ${moduleId} module`);
      }
      return success;
    } finally {
      setIsSaving(prev => ({ ...prev, [moduleId]: false }));
    }
  };
  
  // Handle toggle module with conditional linking
  const handleToggleModule = async (module: Module, enabled: boolean) => {
    if (module.required) return;
    
    try {
      if (enabled) {
        await handleEnableModule(module.id);
      } else {
        // Show warning for critical modules
        if (['recording', 'audioPlayback', 'persistence'].includes(module.id)) {
          setShowDisableWarning(module.id);
        } else {
          await handleDisableModule(module.id);
        }
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} module`);
    }
  };
  
  // Handle confirmed disable
  const handleConfirmedDisable = async () => {
    if (!showDisableWarning) return;
    
    try {
      await handleDisableModule(showDisableWarning);
    } finally {
      setShowDisableWarning(null);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Feature Modules</h2>
      <p className="text-gray-500">
        Enable or disable additional features for your meetings
      </p>
      
      {!user && (
        <Alert className="mb-4">
          <AlertDescription>
            Sign in to save your feature settings. Changes will not be saved until you sign in.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map(module => (
          <Card key={module.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {module.name}
                  {module.required && (
                    <Badge variant="outline" className="ml-2">Required</Badge>
                  )}
                </CardTitle>
              </div>
              {module.required ? (
                <Badge variant="secondary">Always On</Badge>
              ) : (
                <Switch
                  checked={!!module.enabled}
                  onCheckedChange={(checked) => handleToggleModule(module, checked)}
                  disabled={module.required || isSaving[module.id]}
                />
              )}
            </CardHeader>
            <CardContent>
              <CardDescription className="mt-1">
                {module.description}
              </CardDescription>
              {isSaving[module.id] && (
                <div className="mt-2 text-xs text-blue-500 animate-pulse">
                  Saving settings...
                </div>
              )}
              {module.id === 'recording' && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="mb-1">When enabled:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Permanent storage</strong> of meeting audio</li>
                    <li>Audio playback with waveform visualization</li>
                    <li>Access recordings from past meetings</li>
                  </ul>
                  <p className="mt-1 text-xs"><strong>Note:</strong> Without this module, audio is only available during the session.</p>
                </div>
              )}
              {module.id === 'persistence' && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="mb-1">When enabled:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Permanently save</strong> meeting transcripts</li>
                    <li>Access past meeting transcripts at any time</li>
                    <li>Share transcripts with team members</li>
                  </ul>
                  <p className="mt-1 text-xs"><strong>Note:</strong> Without this module, transcripts are only available during the session.</p>
                </div>
              )}
              {module.id === 'document-analysis' && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="mb-1">When enabled:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Upload and analyze existing documents</li>
                      <li>Extract key insights and summaries</li>
                      <li>Integrate document content into your session</li>
                    </ul>
                  </div>
              )}
              {module.id === 'translation' && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="mb-1">When enabled:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Translate transcripts into multiple languages</li>
                      <li>Real-time translation during live sessions</li>
                      <li>Supports a wide range of languages</li>
                    </ul>
                  </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showDisableWarning && (
        <AlertDialog open={true} onOpenChange={() => setShowDisableWarning(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable {showDisableWarning} Module?</AlertDialogTitle>
              <AlertDialogDescription>
                {showDisableWarning === 'recording' && (
                  "Disabling the recording module will prevent you from saving audio recordings. You'll lose access to audio playback and waveform visualization for future meetings."
                )}
                {showDisableWarning === 'audioPlayback' && (
                  "Disabling audio playback will prevent you from listening to recorded audio from your meetings, even if recordings are saved."
                )}
                {showDisableWarning === 'persistence' && (
                  "Disabling persistence will prevent you from saving meeting transcripts permanently. Transcripts will only be available during the current session."
                )}
                <br /><br />
                Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Enabled</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmedDisable} className="bg-red-600 hover:bg-red-700">
                Disable Module
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
