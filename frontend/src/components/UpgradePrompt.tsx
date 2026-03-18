import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export interface UpgradePromptProps {
  /** Name of the feature being gated */
  feature: string;
  
  /** Minimum tier required ('individual', 'professional', or 'business') */
  requiredTier: 'individual' | 'professional' | 'business';
  
  /** Custom message to display */
  message?: string;
  
  /** Custom CTA text */
  ctaText?: string;
  
  /** Whether to show as a dialog (modal) or inline alert */
  variant?: 'dialog' | 'inline';
  
  /** For dialog variant: controls visibility */
  open?: boolean;
  
  /** For dialog variant: callback when dialog closes */
  onOpenChange?: (open: boolean) => void;
  
  /** Custom upgrade link (defaults to /pricing) */
  upgradeLink?: string;
}

const TIER_INFO = {
  individual: {
    name: 'Individual',
    price: '$9/mo',
    color: 'text-blue-600 dark:text-blue-400',
  },
  professional: {
    name: 'Professional',
    price: '$24/mo',
    color: 'text-purple-600 dark:text-purple-400',
  },
  business: {
    name: 'Business',
    price: '$79/mo',
    color: 'text-orange-600 dark:text-orange-400',
  },
};

export function UpgradePrompt({
  feature,
  requiredTier,
  message,
  ctaText,
  variant = 'dialog',
  open,
  onOpenChange,
  upgradeLink = '/pricing',
}: UpgradePromptProps) {
  const tierInfo = TIER_INFO[requiredTier];
  const defaultMessage = message || `${feature} is available on ${tierInfo.name} plan and above.`;
  const defaultCtaText = ctaText || `Upgrade to ${tierInfo.name} - ${tierInfo.price}`;

  const handleUpgrade = () => {
    window.location.href = upgradeLink;
  };

  if (variant === 'inline') {
    return (
      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Upgrade Required</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <p className="mb-3">{defaultMessage}</p>
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {defaultCtaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">Unlock {feature}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{tierInfo.name} Plan</p>
              <p className="text-sm text-muted-foreground">Full access to premium features</p>
            </div>
            <p className={`text-2xl font-bold ${tierInfo.color}`}>{tierInfo.price}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {defaultCtaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange?.(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Hook for managing upgrade prompt state */
export function useUpgradePrompt() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [promptConfig, setPromptConfig] = React.useState<Omit<UpgradePromptProps, 'open' | 'onOpenChange'>>(
    {
      feature: '',
      requiredTier: 'individual',
    }
  );

  const showUpgradePrompt = (config: Omit<UpgradePromptProps, 'open' | 'onOpenChange' | 'variant'>) => {
    setPromptConfig(config);
    setIsOpen(true);
  };

  const closeUpgradePrompt = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    promptConfig,
    showUpgradePrompt,
    closeUpgradePrompt,
  };
}

import React from 'react';
