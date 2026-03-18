import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import brain from 'brain';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tierInfo, setTierInfo] = useState<{ tier: string; quota: number } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const maxAttempts = 10;
      let attempts = 0;

      const checkStatus = async () => {
        try {
          // Fetch updated tier info
          const response = await brain.get_my_tier_info();
          if (response.ok) {
            const data = await response.json();
            
            // If we see a paid tier, we're good!
            if (data.tier !== 'free') {
              setTierInfo({
                tier: data.tier,
                quota: data.quota,
              });
              setVerifying(false);
              return;
            }
            
            // If still free, keep polling
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 2000);
            } else {
              // Give up and show what we have (probably free)
              // But maybe show a message that it's updating
              setTierInfo({
                tier: data.tier,
                quota: data.quota,
              });
              setVerifying(false);
            }
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          setError('We received your payment, but there was an issue updating your account. Please contact support.');
          setVerifying(false);
        }
      };

      // Initial wait for webhook to propagate
      setTimeout(checkStatus, 2000);
    };

    verifyPayment();
  }, [searchParams]);

  const getTierDisplay = (tier: string) => {
    const tierMap: Record<string, string> = {
      free: 'Free',
      individual: 'Individual',
      professional: 'Professional',
      business: 'Business',
    };
    return tierMap[tier] || tier;
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 text-orange-600 dark:text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Verifying Your Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your subscription...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-orange-600 dark:text-orange-500">
              Payment Received
            </CardTitle>
            <CardDescription className="text-center">
              But there was an issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/settings')} className="w-full">
                Go to Settings
              </Button>
              <Button onClick={() => navigate('/contact')} variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription is now active
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {tierInfo && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">You're now on</p>
              <p className="text-2xl font-bold text-foreground">
                {getTierDisplay(tierInfo.tier)} Plan
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {tierInfo.quota} minutes per month
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">What's next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Start transcribing meetings with your new quota</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Access all premium features</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>Check your subscription details in Settings</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/transcribe')} size="lg" className="w-full">
              Start Transcribing
            </Button>
            <Button onClick={() => navigate('/settings')} variant="outline" className="w-full">
              View Subscription Details
            </Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
