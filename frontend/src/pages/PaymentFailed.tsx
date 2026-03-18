import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, RefreshCw, Mail, CreditCard, ArrowLeft } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || 'Your payment could not be processed.';

  const handleTryAgain = () => {
    navigate('/pricing');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleManagePayment = () => {
    navigate('/settings?tab=subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            We couldn't process your payment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage || 'Your payment could not be completed. Please check your payment details and try again.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Common reasons:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Insufficient funds</li>
              <li>Expired or invalid card</li>
              <li>Card declined by bank</li>
              <li>Incorrect billing information</li>
            </ul>
          </div>

          <div className="space-y-2 pt-4">
            <Button onClick={handleTryAgain} className="w-full" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button onClick={handleManagePayment} variant="outline" className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Need help?
            </p>
            <Button onClick={handleContactSupport} variant="link" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
