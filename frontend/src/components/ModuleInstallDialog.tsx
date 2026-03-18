/**
 * Component: ModuleInstallDialog
 * 
 * Description:
 * A dialog component that allows users to select which modules to include
 * when installing the PWA.
 */

import { useState, useEffect } from "react";
import { usePWAStore } from "../utils/pwaStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ModuleInstallDialog({ open, onOpenChange, onConfirm }: Props) {
  const pwStore = usePWAStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Load available modules when dialog opens
  useEffect(() => {
    if (open) {
      pwStore.syncWithModuleRegistry();
    }
  }, [open]);
  
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleModule = (moduleId: string) => {
    pwStore.toggleModuleInstallOption(moduleId);
  };
  
  // Get module options safely with fallbacks
  const moduleOptions = pwStore.installOptions || [];
  const hasRequiredModules = moduleOptions.some(option => option.required);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="module-install-dialog-description">
        <DialogHeader>
          <DialogTitle id="module-install-dialog-title">Install Dicta-Notes</DialogTitle>
          <DialogDescription id="module-install-dialog-description">
            Select which features you want to make available offline when installing the app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
            {moduleOptions.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No optional modules available</div>
            ) : (
              moduleOptions.map(option => (
                <div key={option.moduleId} className="flex items-start space-x-3">
                  <Checkbox
                    id={`module-${option.moduleId}`}
                    checked={option.selected}
                    disabled={option.required}
                    onCheckedChange={() => toggleModule(option.moduleId)}
                  />
                  <div className="grid gap-1.5">
                    <Label 
                      htmlFor={`module-${option.moduleId}`}
                      className="font-medium"
                    >
                      {option.name} {option.required && <span className="text-xs text-muted-foreground">(Required)</span>}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {hasRequiredModules && (
            <p className="text-xs text-muted-foreground mt-4">
              Required modules are needed for the app to function properly.
            </p>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

