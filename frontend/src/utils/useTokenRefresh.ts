import { firebaseAuth } from "../app/auth/firebase";
import { useEffect, useState } from "react";

/**
 * Hook to manage token refresh and authentication state
 * This ensures we always have a valid token for API calls
 */
export const useTokenRefresh = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const setupTokenRefresh = async () => {
      try {
        // Set up token refresh listener using onAuthStateChanged only
        unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const token = await user.getIdToken(true);
              console.log("Auth token refreshed");
              setToken(token);
            } catch (err) {
              console.error("Error refreshing token:", err);
              setError(err instanceof Error ? err : new Error(String(err)));
            }
          } else {
            setToken(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error("Error setting up token refresh:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    setupTokenRefresh();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { token, loading, error };
};
