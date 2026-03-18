import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeModuleContext } from 'utils/ModuleContext';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface ModuleInfo {
  id: string;
  name: string;
  enabled: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

interface Props {
  className?: string;
  compact?: boolean;
}

export function ModuleStatusIndicators({ className = '', compact = false }: Props) {
  const navigate = useNavigate();
  const { modules, hasModuleAccess } = useSafeModuleContext();
  
  // Get key modules to display as indicators
  const keyModules = ['core', 'persistence', 'recording'];
  
  // Generate formatted module info with icons and tooltips
  const moduleInfoList: ModuleInfo[] = keyModules
    .map(id => {
      const module = modules.find(m => m.id === id);
      if (!module) return null;
      
      const enabled = !!module.enabled;
      let tooltip = enabled 
        ? `${module.name} is enabled` 
        : `${module.name} is disabled`;
        
      // Add specific warnings for disabled modules
      if (!enabled) {
        switch (id) {
          case 'core':
            // Always enabled
            break;
          case 'persistence':
            tooltip += " - Transcripts will be lost after session ends. Audio can still be saved if Audio Storage is enabled.";
            break;
          case 'recording':
            tooltip += " - Audio available during session only. Transcripts can still be saved if Transcript Storage is enabled.";
            break;
        }
      }
      
      return {
        id,
        name: module.name,
        enabled,
        icon: enabled 
          ? <CheckCircle className="h-4 w-4" /> 
          : id === 'recording' 
            ? <AlertTriangle className="h-4 w-4 text-red-500" /> 
            : <AlertTriangle className="h-4 w-4" />,
        tooltip
      };
    })
    .filter(Boolean) as ModuleInfo[];
  
  // Function to navigate to settings
  const goToModuleSettings = () => {
    navigate('/settings');
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <TooltipProvider>
        {moduleInfoList.map((module) => (
          <Tooltip key={module.id}>
            <TooltipTrigger>
              <div 
                className={`inline-flex items-center border rounded-md px-2 py-0.5 text-xs font-semibold cursor-help ${
                  module.id === 'recording' && !module.enabled
                    ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 animate-pulse"
                    : module.enabled
                      ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200" 
                      : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToModuleSettings();
                }}
              >
                {!compact && (
                  <span className="mr-1">{module.name.split(' ')[0]}</span>
                )}
                {module.icon}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{module.tooltip}</p>
              <p className="text-xs mt-1 text-muted-foreground">Click to manage settings</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* Settings button */}
        <Tooltip>
          <TooltipTrigger>
            <div 
              className="inline-flex items-center border rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              onClick={goToModuleSettings}
            >
              <Settings className="h-3.5 w-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage module settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
