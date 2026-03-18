
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { logAuthError, logAuthSuccess } from './authMonitoring';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect result for mobile Safari sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('[Auth] Redirect sign-in successful:', result.user.uid);
          await logAuthSuccess('redirect', result.user.uid);
          setUser(result.user);
          
          // Navigate away from login page to complete the flow
          console.log('[Auth] Completing redirect auth, navigating to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('[Auth] Redirect result error:', error);
        await logAuthError(error as any, 'redirect');
      }
    };

    // Check for redirect result first
    handleRedirectResult();

    // Then set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await logAuthSuccess('email', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      await logAuthError(error as any, 'email');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await logAuthSuccess('email', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      await logAuthError(error as any, 'email');
      throw error;
    }
  };

  const logOut = () => {
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Detect mobile Safari
      const isMobileSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isMobileSafari) {
        // Use redirect for mobile Safari
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        console.log('[Auth] Mobile Safari detected, using redirect flow');
        
        // Mark that we are about to perform a redirect-based auth flow so the app can handle the result on return
        try {
          sessionStorage.setItem('auth_redirect_pending', 'true');
        } catch (e) {
          // sessionStorage may be unavailable in some privacy modes; proceed regardless
          console.warn('[Auth] Could not set auth_redirect_pending flag:', e);
        }
        
        await signInWithRedirect(auth, provider);
        
        // Success will be logged by handleRedirectResult
        // Return dummy user - actual user will be set after redirect
        return {} as User;
      } else {
        // Use popup for desktop and other browsers
        const userCredential = await signInWithPopup(auth, provider);
        await logAuthSuccess('popup', userCredential.user.uid);
        return userCredential.user;
      }
    } catch (error) {
      const authMethod = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) ? 'redirect' : 'popup';
      await logAuthError(error as any, authMethod);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-gray-200 mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
