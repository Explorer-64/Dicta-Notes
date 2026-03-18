import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[Auth Error Boundary] Caught error:', error);
    console.error('[Auth Error Boundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });

    // Log to our monitoring system if available
    try {
      // Send error to backend for monitoring
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          context: 'auth-error-boundary'
        })
      }).catch(() => {
        // Silently fail if logging doesn't work
      });
    } catch {
      // Silently fail if logging doesn't work
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900/20">
          <div className="min-h-screen backdrop-blur-[110px] bg-background/60 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6 p-6 bg-card rounded-lg shadow-lg border border-destructive/20">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication System Error</AlertTitle>
                <AlertDescription>
                  We're experiencing a technical issue with the login system. 
                  This might be a temporary problem with your browser compatibility.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                <p>If this problem persists, please try:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Using a different browser</li>
                  <li>• Clearing your browser cache</li>
                  <li>• Disabling browser extensions</li>
                  <li>• Updating your browser to the latest version</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
