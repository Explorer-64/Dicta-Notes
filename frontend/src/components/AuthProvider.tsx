import { ReactNode, createContext, useContext, useEffect } from "react";
import { useTokenRefresh } from "../utils/useTokenRefresh";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "app";
import { analytics } from "utils/analytics";
import { getRedirectResult } from "firebase/auth";
import { firebaseAuth } from "app";
import { logAuthSuccess, logAuthError } from "../utils/authMonitoring";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  loading: true,
  error: null,
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider component that handles Firebase authentication token refresh
 * This ensures we always have a valid token for API calls
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { token, loading, error } = useTokenRefresh();
  const { user } = useCurrentUser();
  
  // Handle Google OAuth redirect result on app load
  // NOTE: We call getRedirectResult() unconditionally because on iOS Safari,
  // sessionStorage is cleared during cross-origin OAuth redirects (Apple ITP).
  // Firebase uses indexedDB internally to track pending redirects, so this is
  // safe to call on every load — it returns null when there's nothing to process.
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);

        if (result?.user) {
          console.log('[Auth] Redirect authentication successful');

          // Clear any stale pending flag
          try { sessionStorage.removeItem('auth_redirect_pending'); } catch (_) {}

          // Log success
          await logAuthSuccess('redirect', result.user.uid);

          // Navigate to sessions (main app page)
          navigate('/sessions');

          // Show success message
          toast.success('Successfully signed in!');
        }
      } catch (redirectError: any) {
        console.error('[Auth] Redirect result error:', redirectError);

        try { sessionStorage.removeItem('auth_redirect_pending'); } catch (_) {}

        // Log error
        await logAuthError(redirectError, 'redirect');

        // Show error to user
        toast.error('Sign-in failed. Please try again.');
      }
    };

    // Only run once on mount
    handleRedirectResult();
  }, []); // Empty dependency array - run once on mount
  
  // When user changes, update analytics
  useEffect(() => {
    if (user) {
      // Set user ID for analytics when signed in
      analytics.setUserId(user.uid);
      
      // Set user properties
      analytics.setUserProperties({
        sign_in_provider: user.providerData[0]?.providerId || 'unknown',
        is_anonymous: user.isAnonymous
      });
      
      console.log('User authenticated, analytics updated');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication error");
    }
  }, [error]);

  return (
    <AuthContext.Provider value={{ token, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
