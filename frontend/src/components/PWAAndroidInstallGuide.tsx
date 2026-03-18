/**
 * Component: PWAAndroidInstallGuide
 * 
 * Description:
 * Provides specific installation instructions for Android devices,
 * particularly optimized for Pixel 7A with interactive visual guide.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Smartphone, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_TITLES = [
  "Tap the Chrome menu",
  "Select 'Install app'",
  "Confirm installation",
  "Launch from home screen"
];

const STEP_DESCRIPTIONS = [
  "Look for the three dots (⋮) in the top-right corner of Chrome and tap it",
  "In the dropdown menu, tap 'Install app' near the top of the list",
  "When prompted, tap 'Install' to add Dicta-Notes to your home screen",
  "After installation, find and tap the Dicta-Notes icon on your home screen to launch the app"
];

export function PWAAndroidInstallGuide({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  
  const isLastStep = step === STEP_TITLES.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      onOpenChange(false);
      setStep(0); // Reset for next time
    } else {
      setStep(step + 1);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="android-install-dialog-description">
        <DialogHeader>
          <DialogTitle id="android-install-dialog-title" className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {STEP_TITLES[step]}
          </DialogTitle>
          <DialogDescription id="android-install-dialog-description">
            {STEP_DESCRIPTIONS[step]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Visual representation based on current step */}
          <div className="w-full p-4 rounded-lg bg-slate-100 dark:bg-slate-800 min-h-[120px] flex items-center justify-center">
            {step === 0 && (
              <div className="relative border border-slate-300 rounded-md w-64 h-10 flex items-center justify-end pr-3">
                <span className="absolute left-3 text-sm text-slate-500">dicta-notes.com</span>
                <div className="flex space-x-2">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <div className="flex flex-col space-y-3 border rounded-md p-3 bg-white dark:bg-slate-700 shadow-md w-48">
                <div className="flex items-center space-x-3 p-2 bg-slate-100 dark:bg-slate-600 rounded">
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Install app</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-600"></div>
                <div className="flex items-center space-x-3 p-2">
                  <span className="text-sm">Other options...</span>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="border rounded-lg p-4 bg-white dark:bg-slate-700 shadow-md max-w-xs">
                <div className="text-center space-y-4">
                  <h3 className="font-medium">Install Dicta-Notes?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This app will be installed on your device</p>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="text-sm">Cancel</Button>
                    <Button size="sm" className="text-sm">Install</Button>
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${i === 2 ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                    {i === 2 ? (
                      <span className="font-medium text-xs">Dicta-Notes</span>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-500"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Step indicator */}
          <div className="flex space-x-1">
            {STEP_TITLES.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button onClick={handleNext}>
            {isLastStep ? "Finish" : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

