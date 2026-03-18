import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Lock, FileText, Users, Globe } from 'lucide-react';
import { toast } from 'sonner';

type TriggerReason = 
  | 'quota_reached'
  | 'translation_blocked'
  | 'export_blocked'
  | 'team_blocked'
  | 'session_limit';

type Tier = 'free' | 'individual' | 'professional' | 'business';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: TriggerReason;
  currentTier?: Tier;
  suggestedTier?: Tier;
}

const TIER_INFO: Record<Tier, { name: string; price: number; monthlyMinutes: number }> = {
  free: { name: 'Free', price: 0, monthlyMinutes: 30 },
  individual: { name: 'Individual', price: 19, monthlyMinutes: 300 },
  professional: { name: 'Professional', price: 49, monthlyMinutes: 1200 },
  business: { name: 'Business', price: 199, monthlyMinutes: 6000 },
};

const TRIGGER_MESSAGES: Record<TriggerReason, {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}> = {
  quota_reached: {
    icon: <Zap className="w-12 h-12 text-orange-600 dark:text-orange-500" />,
    title: "You've Reached Your Monthly Limit",
    description: "Upgrade to continue transcribing meetings without interruption.",
    features: [
      'More transcription minutes',
      'Unlimited sessions',
      'Priority support',
      'Advanced features',
    ],
  },
  translation_blocked: {
    icon: <Globe className="w-12 h-12 text-orange-600 dark:text-orange-500" />,
    title: 'Real-Time Translation is a Premium Feature',
    description: 'Upgrade to translate your transcriptions into 100+ languages in real-time.',
    features: [
      'Real-time translation',
      'Support for 100+ languages',
      'All transcription features',
      'More minutes included',
    ],
  },
  export_blocked: {
    icon: <FileText className="w-12 h-12 text-orange-600 dark:text-orange-500" />,
    title: 'Advanced Export Formats Are Premium',
    description: 'Upgrade to export in PDF, Markdown, and more professional formats.',
    features: [
      'PDF & Markdown export',
      'Custom formatting options',
      'Batch export',
      'More transcription minutes',
    ],
  },
  team_blocked: {
    icon: <Users className="w-12 h-12 text-orange-600 dark:text-orange-500" />,
    title: 'Team Sharing Requires Professional',
    description: 'Upgrade to Professional to share sessions with your team and collaborate.',
    features: [
      'Team sharing & collaboration',
      'Invite team members',
      '20 hours/month included',
      'Advanced export options',
    ],
  },
  session_limit: {
    icon: <Lock className="w-12 h-12 text-orange-600 dark:text-orange-500" />,
    title: "You've Reached Your Session Limit",
    description: 'Free accounts are limited to 3 sessions. Upgrade for unlimited sessions.',
    features: [
      'Unlimited sessions',
      'More transcription minutes',
      'All premium features',
      'Priority support',
    ],
  },
};

export function UpgradeModal({
  open,
  onOpenChange,
  trigger,
  currentTier = 'free',
  suggestedTier = 'individual',
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const triggerContent = TRIGGER_MESSAGES[trigger];
  const tierInfo = TIER_INFO[suggestedTier];

  const handleUpgrade = async () => {
    // Redirect to pricing page for PayPal checkout
    navigate('/pricing');
    onOpenChange(false);
  };

  const handleViewPlans = () => {
    navigate('/pricing');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {triggerContent.icon}
          </div>
          <DialogTitle className="text-center text-2xl">
            {triggerContent.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {triggerContent.description}
          </DialogDescription>
        </DialogHeader>

        {/* Suggested Tier */}
        <div className="my-6 p-4 border border-orange-600 dark:border-orange-500 rounded-lg bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {tierInfo.name} Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                {tierInfo.monthlyMinutes} minutes/month
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                ${tierInfo.price}
              </div>
              <div className="text-xs text-muted-foreground">/month</div>
            </div>
          </div>
          
          <Badge className="bg-orange-600 dark:bg-orange-500 text-white">
            Recommended
          </Badge>
        </div>

        {/* Features List */}
        <div className="space-y-2 mb-6">
          <p className="text-sm font-medium text-foreground mb-3">What you'll get:</p>
          {triggerContent.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full"
            size="lg"
          >
            {isUpgrading ? 'Processing...' : `Upgrade to ${tierInfo.name}`}
          </Button>
          <Button
            onClick={handleViewPlans}
            variant="outline"
            className="w-full"
            size="lg"
          >
            View All Plans
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
