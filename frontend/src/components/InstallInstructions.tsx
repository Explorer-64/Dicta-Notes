/**
 * Component for showing custom installation instructions based on device/browser
 */
export function InstallInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isFirefox = userAgent.indexOf('firefox') > -1;
  const isChrome = userAgent.indexOf('chrome') > -1 && !isFirefox;
  const isSafari = /safari/.test(userAgent) && !isChrome;
  const isAndroid = /android/.test(userAgent);
  
  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 my-4">
      <h3 className="text-lg font-medium mb-2">Installation Instructions</h3>
      
      {isIOS && (
        <div className="space-y-2">
          <p>To install Dicta-Notes on your iOS device:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Tap the <span className="inline-flex items-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> Share</span> button in Safari</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> in the top-right corner</li>
          </ol>
        </div>
      )}
      
      {isAndroid && isChrome && (
        <div className="space-y-2">
          <p>To install Dicta-Notes on your Android device:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Tap the menu button in Chrome <span className="inline-flex items-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></span></li>
            <li>Select <strong>Add to Home screen</strong></li>
            <li>Follow the on-screen instructions</li>
          </ol>
        </div>
      )}
      
      {isFirefox && (
        <div className="space-y-2">
          <p>To install Dicta-Notes in Firefox:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Tap the menu button <span className="inline-flex items-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></span></li>
            <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
          </ol>
        </div>
      )}
      
      {!isIOS && !isAndroid && !isFirefox && (
        <div className="space-y-2">
          <p>To install Dicta-Notes on your device:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Look for the install icon in your browser's address bar</li>
            <li>Click the install button and follow the instructions</li>
          </ol>
        </div>
      )}
    </div>
  );
}