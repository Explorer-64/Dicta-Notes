// Utility functions for handling authentication and navigation

// Flag to track if authentication is in progress to prevent loops
let authInProgress = false;

// Store the URL to return to after authentication
const AUTH_RETURN_URL_KEY = 'auth_return_url';

/**
 * Set the authentication in progress flag
 */
export const setAuthInProgress = (value: boolean): void => {
  authInProgress = value;
};

/**
 * Check if authentication is in progress
 */
export const isAuthInProgress = (): boolean => {
  return authInProgress;
};

/**
 * Store the current URL to return to after authentication
 */
export const storeAuthReturnUrl = (url: string = window.location.pathname): void => {
  // Only store if not already on an auth page
  if (!url.includes('/login') && !url.includes('/signup') && !url.includes('/reset-password')) {
    sessionStorage.setItem(AUTH_RETURN_URL_KEY, url);
  }
};

/**
 * Get the URL to return to after authentication
 */
export const getAuthReturnUrl = (): string => {
  return sessionStorage.getItem(AUTH_RETURN_URL_KEY) || '/';
};

/**
 * Clear the stored return URL
 */
export const clearAuthReturnUrl = (): void => {
  sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
};

/**
 * Prepare for authentication by storing the current URL
 */
export const prepareForAuth = (returnUrl?: string): void => {
  storeAuthReturnUrl(returnUrl);
  setAuthInProgress(true);
};

/**
 * Complete the authentication flow
 */
export const completeAuth = (): void => {
  setAuthInProgress(false);
};
