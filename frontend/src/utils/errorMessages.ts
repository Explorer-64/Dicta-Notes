// Helper function to map Firebase error codes to user-friendly messages
export const getFriendlyErrorMessage = (error: any): string => {
  if (!(error instanceof Error) || !('code' in error)) {
    return "An unexpected error occurred. Please try again.";
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return "The email address you entered is not valid. Please check and try again.";
    case 'auth/user-not-found':
      return "No account found with this email address.";
    case 'auth/missing-email':
      return "Please enter your email address.";
    case 'auth/weak-password':
      return "Password is too weak. Please choose a stronger password.";
    case 'auth/email-already-in-use':
      return "An account with this email address already exists.";
    case 'auth/wrong-password':
      return "Incorrect password. Please try again.";
    case 'auth/invalid-credential':
      return "Invalid email or password. Please check your credentials and try again.";
    case 'auth/too-many-requests':
      return "Too many failed attempts. Please try again later.";
    case 'auth/user-disabled':
      return "This account has been disabled. Please contact support.";
    case 'auth/popup-blocked':
      return "Sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
    case 'auth/popup-closed-by-user':
      return "Sign-in was cancelled. Please try again.";
    case 'auth/cancelled-popup-request':
      return "Another sign-in attempt is in progress. Please wait and try again.";
    case 'auth/network-request-failed':
      return "Network error. Please check your internet connection and try again.";
    case 'auth/internal-error':
      return "An internal error occurred. Please try again later.";
    case 'auth/invalid-api-key':
      return "Authentication service configuration error. Please contact support.";
    case 'auth/app-deleted':
      return "Authentication service is unavailable. Please contact support.";
    case 'auth/requires-recent-login':
      return "This action requires recent authentication. Please sign out and sign in again.";
    // Add more specific Firebase error codes as needed
    default:
      console.error("Unhandled Firebase Auth Error:", error);
      return `An error occurred (${error.code}). Please try again later.`;
  }
};
