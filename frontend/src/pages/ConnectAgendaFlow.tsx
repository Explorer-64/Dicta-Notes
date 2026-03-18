import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import { useNavigate } from 'react-router-dom';
import brain from 'brain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Copy, Check, Clock, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface TokenData {
  token: string;
  userId: string;
  expiresIn: number;
  connectUrl: string;
}

export default function ConnectAgendaFlow() {
  const { user, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [generatedAt, setGeneratedAt] = useState<number>(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast.error('Please log in to connect to Agenda Flow');
      navigate('/login');
    }
  }, [user, userLoading, navigate]);

  // Calculate time remaining
  useEffect(() => {
    if (!generatedAt || !tokenData) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - generatedAt) / 1000);
      const remaining = tokenData.expiresIn - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generatedAt, tokenData]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await brain.generate_agenda_flow_token();
      const data = await response.json();
      
      setTokenData(data);
      setGeneratedAt(Date.now());
      setTimeRemaining(data.expiresIn);
      toast.success('Connection token generated successfully');
    } catch (error) {
      console.error('Failed to generate token:', error);
      toast.error('Failed to generate connection token');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (!tokenData) return;
    
    try {
      await navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      toast.success('Token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy token');
    }
  };

  const handleOpenAgendaFlow = () => {
    if (!tokenData) return;
    window.open(tokenData.connectUrl, '_blank');
    toast.success('Opening Agenda Flow...');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTokenExpired = timeRemaining <= 0 && generatedAt > 0;

  // Auto-generate token on mount
  useEffect(() => {
    generateToken();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Connect to Agenda Flow</h1>
          <p className="text-muted-foreground">
            Connect your Dicta-Notes account to Agenda Flow for seamless calendar integration and auto-join capabilities.
          </p>
        </div>

        {/* What is Agenda Flow */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What is Agenda Flow?</strong> Agenda Flow is a companion PWA that integrates with your calendar
            to automatically join and transcribe scheduled meetings. It shares your Dicta-Notes account and all your sessions.
          </AlertDescription>
        </Alert>

        {/* Token Status */}
        {tokenData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>
                    Token generated for user: {tokenData.userId}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className={isTokenExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {isTokenExpired ? 'Expired' : formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Connection Methods */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Option A: Direct Link */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Direct Link (Recommended)
              </CardTitle>
              <CardDescription>
                Click to open Agenda Flow with automatic sign-in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleOpenAgendaFlow}
                disabled={!tokenData || isTokenExpired || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Agenda Flow
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                This will open Agenda Flow in a new tab with your authentication token. You'll be automatically signed in.
              </p>
            </CardContent>
          </Card>

          {/* Option B: Manual Copy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Manual Copy (Fallback)
              </CardTitle>
              <CardDescription>
                Copy the token and paste it in Agenda Flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={tokenData?.token || 'Generating token...'}
                readOnly
                className="font-mono text-xs min-h-[100px] resize-none"
              />
              <Button
                onClick={handleCopyToken}
                disabled={!tokenData || isTokenExpired || loading}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Token
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Copy this token and paste it in the Agenda Flow authentication page if the direct link doesn't work.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Token Expired - Regenerate */}
        {isTokenExpired && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your connection token has expired. Generate a new one to continue.
                </p>
                <Button onClick={generateToken} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Regenerate Token'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Connect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click "Open Agenda Flow" to launch the app in a new tab</li>
              <li>The app will automatically sign you in using your Dicta-Notes account</li>
              <li>You'll have access to all your sessions and settings</li>
              <li>If automatic sign-in fails, use the manual copy method to paste the token</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
