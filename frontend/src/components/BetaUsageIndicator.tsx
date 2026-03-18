import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import brain from 'brain';
import { toast } from 'sonner';
import { useCurrentUser } from 'app';

interface UsageStats {
  minutes_used: number;
  minutes_remaining: number;
  limit: number;
  reset_date: number | null;
  warning_threshold_reached: boolean;
  limit_reached: boolean;
}

export function BetaUsageIndicator() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await brain.get_usage_stats();
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching beta usage stats:', error);
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds while user is active
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || loading || !stats) return null;

  const percentage = (stats.minutes_used / stats.limit) * 100;
  const resetDate = stats.reset_date ? new Date(stats.reset_date * 1000) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col gap-1 min-w-[100px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {Math.round(stats.minutes_used)}/{stats.limit} min
                </span>
                {stats.limit_reached && (
                  <span className="text-xs text-destructive font-semibold">LIMIT</span>
                )}
                {!stats.limit_reached && stats.warning_threshold_reached && (
                  <span className="text-xs text-orange-600 font-semibold">⚠️</span>
                )}
              </div>
              <Progress 
                value={percentage} 
                className={`h-1.5 ${stats.limit_reached ? '[&>div]:bg-destructive' : stats.warning_threshold_reached ? '[&>div]:bg-orange-500' : '[&>div]:bg-primary'}`}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Beta Usage Limit</p>
            <p>{Math.round(stats.minutes_remaining)} minutes remaining this month</p>
            {resetDate && (
              <p className="text-xs text-muted-foreground">
                Resets on {resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            {stats.limit_reached && (
              <p className="text-xs text-destructive font-medium mt-2">
                You've reached your 60-minute limit. Full pricing plans coming soon!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
