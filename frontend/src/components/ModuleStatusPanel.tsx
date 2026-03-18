import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeModuleContext } from 'utils/ModuleContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, X, Info, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider 
} from '@/components/ui/tooltip';

interface ModuleStatus {
  id: string;
  name: string;
  enabled: boolean;
  required: boolean;
  warningMessage?: string;
  explanation?: string;
  description: string;
}

interface Props {
  className?: string;
  onClose?: () => void;
}

export function ModuleStatusPanel({ className = '', onClose }: Props) {
  const navigate = useNavigate();
  const { modules, hasModuleAccess, enableModule } = useSafeModuleContext();
  
  // Function to navigate to settings
  const goToModuleSettings = () => {
    navigate('/settings');
  };
  
  // Handle enabling a module directly
  const handleEnableModule = async (moduleId: string) => {
    const success = await enableModule(moduleId);
    if (success) {
      toast.success(`${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} module enabled successfully`);
    } else {
      toast.error(`Could not enable ${moduleId} module`);
    }
  };
  
  // Check if any critical modules are disabled
  const hasCriticalDisabled = !hasModuleAccess('recording') || !hasModuleAccess('persistence');
  
  // Get formatted module statuses with warnings and explanations
  const moduleStatuses: ModuleStatus[] = modules.map(module => ({
    ...module,
    enabled: !!module.enabled,
    warningMessage: getModuleWarning(module.id),
    explanation: getModuleExplanation(module.id)
  }));
  
  // Helper to get specific warning message for each module
  function getModuleWarning(moduleId: string): string | undefined {
    switch (moduleId) {
      case 'core':
        return undefined; // Always enabled
      case 'persistence':
        return 'Transcripts will be lost after the session ends unless manually saved.';
      case 'recording':
        return 'Audio will be available during the session but lost when the session ends.';
      default:
        return undefined;
    }
  }
  
  // Helper to get detailed explanation of each module's function
  function getModuleExplanation(moduleId: string): string | undefined {
    switch (moduleId) {
      case 'core':
        return 'Real-time transcription with speaker differentiation. Always enabled.';
      case 'persistence':
        return 'Permanently stores meeting transcripts for later access. Without this, transcripts are only available during the current session. This module works independently from Audio Storage.';
      case 'recording':
        return 'Records and stores audio for later playback with waveform visualization. Without this, audio is only available during the current session. This module works independently from Transcript Storage.';
      default:
        return undefined;
    }
  }
  
  return (
    <Card className={`border-amber-200 bg-amber-50 ${className}`}>
      <CardContent className="p-4 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Module Overview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage feature modules for your meetings. Each module provides independent functionality that can be enabled or disabled separately.
              </p>
            </div>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="mt-4 space-y-3 divide-y divide-amber-100">
          {moduleStatuses.map((module) => (
            <div key={module.id} className="py-3 first:pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {module.enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className={`font-medium ${module.enabled ? 'text-green-700' : 'text-amber-700'}`}>
                    {module.name}
                  </span>
                  {module.required && (
                    <Badge variant="outline" className="text-xs bg-blue-100 border-blue-200 text-blue-700">
                      Required
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={module.enabled ? "outline" : "secondary"}
                    className={module.enabled 
                      ? "bg-green-100 hover:bg-green-100 text-green-700 border-green-200" 
                      : "bg-amber-200 hover:bg-amber-200 text-amber-700 border-amber-300"}
                  >
                    {module.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="max-w-xs">
                        <p>{module.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {!module.enabled && !module.required && (
                <div className="mt-2 flex justify-between items-start">
                  <p className="text-xs text-amber-600 max-w-md">
                    {module.warningMessage}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => handleEnableModule(module.id)}
                  >
                    Enable Now
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {hasCriticalDisabled && (
          <Alert variant="destructive" className="mt-4 bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              <p>
                {!hasModuleAccess('recording') && !hasModuleAccess('persistence') && (
                  "Both Audio Storage and Transcript Storage are disabled. Your meeting data will only be available during this session."
                )}
                {!hasModuleAccess('recording') && hasModuleAccess('persistence') && (
                  "Audio Storage is disabled. Audio will be available during this meeting but won't be saved permanently. Transcripts will still be saved."
                )}
                {hasModuleAccess('recording') && !hasModuleAccess('persistence') && (
                  "Transcript Storage is disabled. Transcripts will be available during the meeting but won't be saved permanently. Audio recordings will still be saved."
                )}
              </p>
              <div className="mt-2 flex gap-2">
                {!hasModuleAccess('recording') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7 border-red-200 text-red-700 hover:bg-red-100"
                    onClick={() => handleEnableModule('recording')}
                  >
                    Enable Audio Storage
                  </Button>
                )}
                {!hasModuleAccess('persistence') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs h-7 border-red-200 text-red-700 hover:bg-red-100"
                    onClick={() => handleEnableModule('persistence')}
                  >
                    Enable Transcript Storage
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            onClick={goToModuleSettings}
          >
            <Settings className="h-4 w-4 mr-1" />
            Manage All Modules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
