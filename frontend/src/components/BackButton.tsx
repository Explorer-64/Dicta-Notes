import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Reusable Back button component
 * Navigates to previous page in history, or falls back to home if no history
 */
export function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to home if no history (e.g., direct link)
      navigate('/');
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="mb-4"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
