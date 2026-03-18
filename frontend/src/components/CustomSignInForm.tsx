
import React, { useState } from 'react';
import { firebaseAuth } from 'app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EyeIcon, EyeOffIcon, AlertCircle, Mail } from 'lucide-react';
import { getFriendlyErrorMessage } from 'utils/errorMessages';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { logAuthError, logAuthSuccess } from '../utils/authMonitoring';
import { Link } from 'react-router-dom';

interface CustomSignInFormProps {
  mode: 'signIn' | 'signUp';
  onSuccess: (uid: string) => void;
  onError: (error: Error) => void;
}

export const CustomSignInForm: React.FC<CustomSignInFormProps> = ({
  mode,
  onSuccess,
  onError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false); // State for Terms checkbox
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false); // State for Privacy checkbox
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // State for displaying form errors

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null); // Clear previous errors
    setFormError(null); // Clear previous errors

    try {
      // Validate passwords match for sign up
      if (mode === 'signUp' && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Authenticate with Firebase
      let userCredential;
      if (mode === 'signUp') {
        // Safeguard check: Ensure terms and privacy are agreed upon before proceeding
        if (!agreedToTerms || !agreedToPrivacy) {
          // This should ideally not be reachable due to the button's disabled state
          console.error("Attempted signup without agreeing to terms/privacy."); 
          throw new Error('You must agree to the Terms of Service and Privacy Policy.');
        }
        userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      
      // Call success callback with user ID
      onSuccess(userCredential.user.uid);
    } catch (error) {
      // Use helper function to get user-friendly message
      const friendlyMessage = getFriendlyErrorMessage(error);
      setFormError(friendlyMessage);
      // Call original onError prop if needed for other side effects
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // On iOS standalone PWA (installed to home screen), popups can't communicate
      // results back to the WKWebView context. Use redirect directly instead.
      const isIosStandalone = /iPhone|iPad|iPod/.test(navigator.userAgent) &&
        ((navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches);

      if (isIosStandalone) {
        console.log('[Auth] iOS standalone PWA detected, using redirect flow directly');
        try {
          sessionStorage.setItem('auth_redirect_pending', 'true');
        } catch (e) {
          console.warn('[Auth] Could not set auth_redirect_pending flag:', e);
        }
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }

      // Try popup first (works on all devices including iOS Safari when triggered by user gesture)
      try {
        console.log('[Auth] Attempting popup authentication');
        const userCredential = await signInWithPopup(firebaseAuth, provider);

        // Success - log and complete
        await logAuthSuccess('popup', userCredential.user.uid);
        onSuccess(userCredential.user.uid);
        return;

      } catch (popupError: any) {
        console.log('[Auth] Popup failed:', popupError.code);

        // If popup was blocked or closed, try redirect
        if (popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {

          console.log('[Auth] Popup blocked, switching to redirect strategy');

          // Store that we're using redirect so we can handle the result
          try {
            sessionStorage.setItem('auth_redirect_pending', 'true');
          } catch (e) {
            console.warn('[Auth] Could not set auth_redirect_pending flag:', e);
          }

          // Use redirect as fallback
          await signInWithRedirect(firebaseAuth, provider);
          return; // Don't set loading to false - redirect will navigate away

        } else {
          // Other popup errors - throw to be handled below
          throw popupError;
        }
      }
      
    } catch (error) {
      // Log the error for monitoring
      await logAuthError(error as any, 'popup');
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
          setFormError("Sign-in popup was blocked. Please:\n1. Allow popups for this site\n2. Or try refreshing and clicking sign-in again");
        } else {
          setFormError(getFriendlyErrorMessage(error));
        }
      } else {
        setFormError(getFriendlyErrorMessage(error));
      }
      
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card shadow-lg rounded-lg p-6 border border-border">
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {/* Display Form Error Alert */} 
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle data-translate>Authentication Failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium" data-translate>
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="name@company.com"
            data-translate
            className="w-full"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium" data-translate>
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="••••••••"
            data-translate
            className="w-full"
            autoComplete={mode === 'signUp' ? "new-password" : "current-password"}
          />
        </div>

        {mode === 'signUp' && (
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium" data-translate>
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="••••••••"
              data-translate
              className="w-full"
              autoComplete="new-password"
            />
          </div>
        )}

        {/* Added Terms and Privacy Checkboxes for Sign Up mode */} 
        {mode === 'signUp' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                required
              />
              {/* Using Label component for accessibility */}
              <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" data-translate>
                I agree to the <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy"
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                required
              />
              {/* Using Label component for accessibility */}
              <Label htmlFor="privacy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" data-translate>
                I agree to the <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
              </Label>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          // Disable button if submitting OR if in signup mode and terms/privacy not agreed
          disabled={isSubmitting || (mode === 'signUp' && (!agreedToTerms || !agreedToPrivacy))}
          data-translate
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'signIn' ? <span data-translate>Signing in...</span> : <span data-translate>Creating account...</span>}
            </span>
          ) : (
            <span>{mode === 'signIn' ? <span data-translate>Sign in</span> : <span data-translate>Create account</span>}</span>
          )}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground" data-translate>Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          data-translate
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span data-translate>Connecting...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Mail className="h-4 w-4 mr-2" />
              <span data-translate>Sign in with Google</span>
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
