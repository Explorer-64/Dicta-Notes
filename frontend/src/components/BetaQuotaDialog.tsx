import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  type: 'warning' | 'blocked';
  usage: number;
  resetDate: Date | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog component for beta quota warnings and blocks
 */
export function BetaQuotaDialog({ type, usage, resetDate, open, onClose }: Props) {
  const isBlocked = type === 'blocked';
  const formattedResetDate = resetDate
    ? resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'soon';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isBlocked ? (
              <Lock className="h-6 w-6 text-red-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
            <DialogTitle>
              {isBlocked ? 'Beta Limit Reached' : 'Usage Warning'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isBlocked ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  You've used <strong>{usage} of 60</strong> beta minutes this month.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                You've reached your 60-minute beta limit and cannot start new recording sessions.
              </p>
              <p className="text-sm text-muted-foreground">
                Your usage will reset on <strong>{formattedResetDate}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Full pricing plans are coming soon! Thank you for being a beta user.
              </p>
            </>
          ) : (
            <>
              <Alert>
                <AlertDescription>
                  You've used <strong>{usage} of 60</strong> beta minutes this month.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                You're approaching your monthly beta limit. Usage resets on <strong>{formattedResetDate}</strong>.
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant={isBlocked ? 'default' : 'outline'}>
            {isBlocked ? 'I Understand' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
