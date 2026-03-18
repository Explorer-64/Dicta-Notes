

import React, { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { MobileOptimizations } from "components/MobileOptimizations";
import { useCurrentUser } from "app";
import { CustomSignInForm } from "@/components/CustomSignInForm";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { setAuthInProgress, getAuthReturnUrl, clearAuthReturnUrl } from 'utils/navigation';
import { Helmet } from "react-helmet-async";

export default function Login() {
  const location = useLocation();
  // Check location state passed from navigation to default to sign-up mode if applicable
  const initialMode = location.state?.mode === 'signUp';
  const [isSignUp, setIsSignUp] = useState(initialMode);
  const [pageError, setPageError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();
  // Add refs to track component mount state
  const isMountedRef = useRef(true);

  const { user, loading } = useCurrentUser();
  
  // Set up the mounted ref cleanup and handle redirection/initial mode
  useEffect(() => {
    // Check for invitation parameters and store them if present
    const params = new URLSearchParams(location.search);
    const invitationId = params.get('invitationId');
    const companyId = params.get('companyId');
    if (invitationId && companyId) {
      sessionStorage.setItem('pendingInvitation', JSON.stringify({ invitationId, companyId }));
      // Optional: Remove params from URL after storing
      // navigate(location.pathname, { replace: true }); 
    }
    
    // Also check for redirect parameter as in the original code
    const redirectParam = params.get('redirect');
    if (redirectParam && redirectParam.includes('accept-invitation')) {
      // Store the redirect URL for post-authentication navigation
      import('../utils/navigation').then(({ storeAuthReturnUrl }) => {
        storeAuthReturnUrl(redirectParam);
      });
    }
    
    // Redirect user if already logged in
    if (!loading && user) {
      const returnUrl = getAuthReturnUrl();
      clearAuthReturnUrl();
      navigate(returnUrl, { replace: true });
    } else {
      // Ensure the component reflects the mode from navigation state if not logged in
      setIsSignUp(location.state?.mode === 'signUp'); 
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loading, navigate, location.state, location.search]); // Add dependencies
  
  // Detect if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleSuccess = async (uid: string) => {
    console.log('[Login] handleSuccess called with uid:', uid);
    // Set a flag to indicate authentication is in progress to break potential loops
    setAuthInProgress(true);
    
    try {
      // Store returning user state
      localStorage.setItem('returningUser', 'true');
      
      // Only navigate if component is still mounted
      if (isMountedRef.current) {
        // Clear auth progress flags BEFORE navigation
        setAuthInProgress(false);
        
        // Get return URL from navigation utility
        const returnUrl = getAuthReturnUrl();
        console.log('[Login] Redirecting to:', returnUrl);
        // Clear the return URL
        clearAuthReturnUrl();
        // Use React Router navigation instead of hard redirect
        navigate(returnUrl);
      }
    } catch (error) {
      console.error('Error in handleSuccess function:', error);
      if (isMountedRef.current) {
        toast.error('Authentication error. Please try again.');
        // Clear auth progress flag
        setAuthInProgress(false);
      }
    }
  };

  const handleError = (error: Error) => {
    console.error('Auth error:', error);
    
    // Only update UI if component is still mounted
    if (isMountedRef.current) {
      toast.error('Authentication failed: ' + (error.message || 'Please try again'));
      // Store error for potential debugging
      setPageError(error);
    }
  };

  // Handle authentication system errors
  if (pageError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900/20">
        <div className="min-h-screen backdrop-blur-[110px] bg-background/60 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 p-6 bg-card rounded-lg shadow-lg border border-destructive/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive">Authentication Error</h2>
              <p className="mt-2 text-muted-foreground">
                {pageError.message || 'We encountered an error with the authentication system'}
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsRetrying(true);
                  setPageError(null);
                  // Use React Router navigation instead of reload
                  navigate(0);
                }}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md"
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('[Login] Initial loading state');
    return (
      <LoadingScreen />
    );
  }

  // Temporary bypass for web crawler
  const isWebCrawler = /bot|crawler|spider|crawling/i.test(navigator.userAgent);
  
  if (user || isWebCrawler) {
    // For mobile devices, check if we have a stored return URL to prevent loops
    if (isMobile) {
      const returnUrl = getAuthReturnUrl();
      if (returnUrl && returnUrl !== '/' && returnUrl !== '') {
        console.log('[Login] Mobile device with return URL, navigating to:', returnUrl);
        clearAuthReturnUrl();
        return <Navigate to={returnUrl} replace />;
      }
    }
    
    // Default redirect to home page
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900/20">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://dicta-notes.com/" />
        <title>Login - Dicta-Notes</title>
      </Helmet>
      <MobileOptimizations />
      <div className="min-h-screen backdrop-blur-[110px] bg-background/60 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500" data-translate>
            {isSignUp ? <span data-translate>Create your account</span> : <span data-translate>Sign in to Dicta-Notes</span>}
          </h2>
          <p className="mt-2 text-muted-foreground" data-translate>
            {isSignUp 
              ? <span data-translate>Create an account to start using Dicta-Notes for real-time transcriptions</span>
              : <span data-translate>Sign in to access your transcription sessions and settings</span>
            }
          </p>
        </div>
        <AuthErrorBoundary>
          <CustomSignInForm 
            mode={isSignUp ? 'signUp' : 'signIn'}
            onError={handleError}
            onSuccess={handleSuccess}
          />
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            data-translate
          >
            {isSignUp 
              ? <span data-translate>Already have an account? Sign in</span>
              : <span data-translate>Need an account? Sign up</span>
            }
          </button>
        </AuthErrorBoundary>

        <Toaster position="bottom-right" />
      </div>
      </div>
    </div>
  );
}
