import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import brain from 'brain';

interface UsageDashboardProps {
  compact?: boolean;
}

export function UsageDashboard({ compact = false }: UsageDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<{
    currentUsage: number;
    quota: number;
    tier: string;
    resetDate: string;
    billingAnniversary: string;
  } | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await brain.get_usage_stats();
        if (response.ok) {
          const data = await response.json();
          setUsageData({
            currentUsage: data.current_usage || 0,
            quota: data.quota || 30,
            tier: data.tier || 'free',
            resetDate: data.reset_date || new Date().toISOString(),
            billingAnniversary: data.billing_anniversary || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const percentUsed = Math.round((usageData.currentUsage / usageData.quota) * 100);
  const isNearLimit = percentUsed >= 80;
  const isOverLimit = percentUsed >= 100;
  const resetDate = new Date(usageData.resetDate);
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getTierDisplay = (tier: string) => {
    const tierMap: Record<string, string> = {
      free: 'Free',
      individual: 'Individual',
      professional: 'Professional',
      business: 'Business',
    };
    return tierMap[tier] || tier;
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {usageData.currentUsage} / {usageData.quota} minutes
            </span>
          </div>
          <Badge variant={isOverLimit ? 'destructive' : isNearLimit ? 'default' : 'secondary'}>
            {percentUsed}%
          </Badge>
        </div>
        <Progress value={Math.min(percentUsed, 100)} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Resets in {daysUntilReset} days</span>
          {(isNearLimit || isOverLimit) && (
            <Link to="/pricing">
              <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usage This Month</CardTitle>
          <Badge variant="outline">{getTierDisplay(usageData.tier)}</Badge>
        </div>
        <CardDescription>
          Your transcription usage for the current billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">
                {usageData.currentUsage}
              </span>
              <span className="text-muted-foreground">/ {usageData.quota} minutes</span>
            </div>
            <Badge 
              variant={isOverLimit ? 'destructive' : isNearLimit ? 'default' : 'secondary'}
              className="text-lg px-3 py-1"
            >
              {percentUsed}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(percentUsed, 100)} 
            className="h-3"
          />
        </div>

        {/* Warning/Alert Messages */}
        {isOverLimit && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              ⚠️ You've reached your monthly limit
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade your plan to continue transcribing or wait until {resetDate.toLocaleDateString()}.
            </p>
            <Link to="/pricing">
              <Button size="sm" className="w-full">
                View Plans
              </Button>
            </Link>
          </div>
        )}

        {isNearLimit && !isOverLimit && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
              ⚡ You're using {percentUsed}% of your quota
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Consider upgrading to avoid interruptions.
            </p>
            <Link to="/pricing">
              <Button size="sm" variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        )}

        {/* Reset Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <Calendar className="w-4 h-4" />
          <span>
            Resets on {resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-muted-foreground/70">({daysUntilReset} days)</span>
        </div>

        {/* View Details Link */}
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="w-full">
            View Subscription Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
