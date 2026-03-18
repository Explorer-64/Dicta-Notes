import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    sessionId: string;
    sessionTitle: string;
  } | null;
}

export function SessionSavedModal({ isOpen, onClose, sessionData }: Props) {
  const navigate = useNavigate();

  const handleViewSession = () => {
    if (!sessionData) return;
    // Navigate to session detail page with the session ID
    navigate(`/session-detail?sessionId=${sessionData.sessionId}`);
    onClose();
  };

  if (!sessionData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg border-0 shadow-2xl" aria-describedby="session-saved-description">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="sr-only">Session Saved Successfully</DialogTitle>
          <DialogDescription id="session-saved-description" className="sr-only">
            Your session {sessionData.sessionTitle} was successfully processed and saved to your account.
          </DialogDescription>
        </DialogHeader>

        {/* Main content */}
        <div className="flex flex-col items-center text-center py-8 px-6">
          {/* Success icon with animation */}
          <div className="mb-6">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-500 animate-pulse" />
              <div className="absolute inset-0 h-20 w-20 border-4 border-green-200 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your session has been saved!
          </h2>
          
          <p className="text-gray-600 mb-8 text-lg">
            {sessionData.sessionTitle} was successfully processed and saved to your account.
          </p>

          {/* Yellow View Session button */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              onClick={handleViewSession}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 px-8 text-lg flex-1 transition-all duration-200 transform hover:scale-105 shadow-lg"
              size="lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              View Session
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="py-3 px-6 text-gray-600 border-gray-300 hover:bg-gray-50 flex-1 sm:flex-initial"
              size="lg"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SessionSavedModal;
