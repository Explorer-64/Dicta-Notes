import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from 'app'; // Assuming firebaseAuth is exported from app
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Helper function to map Firebase error codes to user-friendly messages
const getFriendlyErrorMessage = (error: any): string => {
  if (!(error instanceof Error) || !('code' in error)) {
    return "An unexpected error occurred. Please try again.";
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return "The email address you entered is not valid. Please check and try again.";
    case 'auth/user-not-found':
      // For security reasons, often it's better not to reveal if an email exists or not.
      // You might want to show a generic success message even if the user isn't found.
      // However, for clearer debugging/development, we'll show the specific error here.
      return "No account found with this email address.";
    case 'auth/missing-email':
        return "Please enter your email address.";
    // Add more specific Firebase error codes as needed
    default:
      console.error("Unhandled Firebase Auth Error:", error);
      return `An error occurred (${error.code}). Please try again later.`;
  }
};


export const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setEmailSent(false);

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      toast.success('Password reset email sent! Check your inbox (and spam folder).');
      setEmailSent(true); // Show success message in the form area
      setEmail(''); // Clear email field on success
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setFormError(friendlyMessage);
      toast.error(`Failed to send reset email: ${friendlyMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
       <h2 className="text-2xl font-semibold text-center">Forgot Password</h2>
       <p className="text-center text-muted-foreground">
         Enter your email address below and we'll send you a link to reset your password.
       </p>
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {emailSent && !formError && (
         <Alert variant="default" className="bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700">
            <AlertTitle className="text-green-800 dark:text-green-300">Email Sent</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              A password reset link has been sent to your email address. Please check your inbox.
            </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isSubmitting || emailSent} // Disable input after sending
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || emailSent}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
};
