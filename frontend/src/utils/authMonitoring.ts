import brain from 'brain';

interface AuthError {
  code: string;
  message: string;
}

interface BrowserInfo {
  browser: string;
  version: string;
  isMobile: boolean;
  isIOS: boolean;
  isSafari: boolean;
}

// Get detailed browser information
const getBrowserInfo = (): BrowserInfo => {
  const ua = navigator.userAgent;
  
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isMobile = /Mobi|Android/i.test(ua) || isIOS;
  
  let browser = 'Unknown';
  let version = 'Unknown';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (isSafari) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return {
    browser,
    version,
    isMobile,
    isIOS,
    isSafari
  };
};

// Log authentication error
export const logAuthError = async (error: AuthError, authMethod: 'popup' | 'redirect') => {
  try {
    const browserInfo = getBrowserInfo();
    
    await brain.log_auth_error({
      error_code: error.code || 'unknown',
      error_message: error.message || 'Unknown error',
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      auth_method: authMethod,
      browser_info: `${browserInfo.browser} ${browserInfo.version}`,
      device_info: `${browserInfo.isMobile ? 'Mobile' : 'Desktop'} | iOS: ${browserInfo.isIOS} | Safari: ${browserInfo.isSafari}`
    });
    
    console.log('[Auth Monitor] Error logged:', error.code);
  } catch (e) {
    console.error('[Auth Monitor] Failed to log error:', e);
  }
};

// Log authentication success
export const logAuthSuccess = async (authMethod: 'popup' | 'redirect', userId?: string) => {
  try {
    const browserInfo = getBrowserInfo();
    
    await brain.log_auth_success({
      auth_method: authMethod,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      user_id: userId,
      browser_info: `${browserInfo.browser} ${browserInfo.version}`,
      device_info: `${browserInfo.isMobile ? 'Mobile' : 'Desktop'} | iOS: ${browserInfo.isIOS} | Safari: ${browserInfo.isSafari}`
    });
    
    console.log('[Auth Monitor] Success logged:', authMethod);
  } catch (e) {
    console.error('[Auth Monitor] Failed to log success:', e);
  }
};

// Get authentication statistics (for admin use)
export const getAuthStats = async () => {
  try {
    const response = await brain.get_auth_stats();
    return await response.json();
  } catch (e) {
    console.error('[Auth Monitor] Failed to get stats:', e);
    return null;
  }
};
