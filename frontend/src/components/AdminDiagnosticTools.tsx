import React, { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import brain from 'brain';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertTriangle,
  Activity,
  CheckCircle,
  Clock,
  Database,
  Download,
  Globe,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  getRecentErrors,
  getUsageMetrics,
  checkSystemHealth,
  getUserActivityAnalytics,
  exportDiagnosticData,
  cleanupDiagnosticData,
  logAdminError,
  type ErrorLog,
  type UsageMetrics,
  type SystemHealth,
  type UserActivity
} from 'utils/adminDiagnostics';

/**
 * Comprehensive admin diagnostic tools for system monitoring
 */
export const AdminDiagnosticTools: React.FC = () => {
  const { user } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Loading states
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingAuthStats, setIsLoadingAuthStats] = useState(false);
  const [isLoadingConversion, setIsLoadingConversion] = useState(false);
  
  // Data states
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalTranscriptions: 0,
    totalTranslations: 0,
    averageSessionDuration: 0
  });
  const [health, setHealth] = useState<SystemHealth>({
    firestoreConnected: false,
    authWorking: false,
    apiResponding: false,
    storageAccessible: false,
    lastHealthCheck: new Date()
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [conversionAnalytics, setConversionAnalytics] = useState<any>(null);
  
  // Enhanced error stats state
  const [errorStats, setErrorStats] = useState<any>({});
  
  // Auth monitoring state
  const [authStats, setAuthStats] = useState<any>({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    successRate: 0,
    recentErrors: [],
    browserBreakdown: {},
    deviceBreakdown: {},
    iPhoneSafariIssues: 0
  });
  
  // Check if user is admin
  useEffect(() => {
    const adminEmails = ['abereimer64@gmail.com', 'dward@wevad.com', 'dianareimer90@gmail.com'];
    setIsAdmin(adminEmails.includes(user?.email || ''));
  }, [user]);
  
  // Load all data on component mount
  useEffect(() => {
    if (isAdmin) {
      refreshAll();
      fetchConversionAnalytics(); // Auto-load conversion data
    }
  }, [isAdmin]);
  
  // Enhanced refresh function that includes error stats
  const refreshAll = async () => {
    await Promise.all([
      fetchErrors(), // This now includes fetchErrorStats internally
      loadMetrics(),
      loadHealth(),
      loadActivity(),
      fetchAuthStats()
    ]);
  };
  
  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && isAdmin) {
      const interval = setInterval(() => {
        refreshAll();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, isAdmin]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  // Enhanced error fetching - local only to avoid permission errors
  const fetchErrors = async () => {
    setIsLoadingErrors(true);
    try {
      // Fetch errors from production backend
      const response = await brain.get_recent_errors({ limit: 100 });
      const data = await response.json();
      
      // Sort by timestamp, most recent first
      const sortedErrors = data.errors.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Convert to ErrorLog format
      const formattedErrors: ErrorLog[] = sortedErrors.map((err: any) => ({
        id: err.id,
        timestamp: new Date(err.timestamp).getTime(),
        level: err.level,
        message: err.message,
        component: err.component,
        userId: err.userId,
        source: err.source,
        stackTrace: err.stackTrace,
        metadata: err.metadata,
        errorType: err.errorType,
      }));
      
      setErrors(formattedErrors);
      
      // Fetch stats separately
      await fetchErrorStats();
      
      toast.success('Error logs refreshed');
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
      toast.error('Failed to fetch production error logs');
      setErrors([]);
      setErrorStats({});
    } finally {
      setIsLoadingErrors(false);
    }
  };
  
  // Fetch error statistics
  const fetchErrorStats = async () => {
    try {
      const response = await brain.get_error_stats();
      const stats = await response.json();
      setErrorStats(stats);
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
    }
  };
  
  // Clear all error logs - production backend
  const clearErrorLogs = async () => {
    try {
      await brain.clear_error_logs();
      
      // Clear display
      setErrors([]);
      setErrorStats({});
      toast.success('All production error logs cleared successfully');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
      toast.error('Failed to clear production error logs');
    }
  };
  
  // Fetch auth stats
  const fetchAuthStats = async () => {
    setIsLoadingAuthStats(true);
    try {
      // Get auth stats from backend
      const response = await brain.get_auth_stats();
      const stats = await response.json();
      
      // Map backend response to frontend format
      const totalAttempts = (stats.total_errors || 0) + (stats.total_successes || 0);
      const successfulAttempts = stats.total_successes || 0;
      const failedAttempts = stats.total_errors || 0;
      const successRate = stats.success_rate || 0;
      
      // Count iPhone Safari specific issues
      const iPhoneSafariIssues = stats.recent_errors?.filter((error: any) => 
        error.browser_info?.includes('Safari') && 
        error.device_info?.includes('iPhone')
      ).length || 0;
      
      setAuthStats({
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        successRate,
        recentErrors: stats.recent_errors || [],
        browserBreakdown: {},
        deviceBreakdown: {},
        iPhoneSafariIssues
      });
    } catch (error) {
      console.error('Error fetching auth stats:', error);
      // If backend fails, get local auth data
      const localAuthLogs = localStorage.getItem('auth-monitoring-logs');
      if (localAuthLogs) {
        const logs = JSON.parse(localAuthLogs);
        const successes = logs.filter((log: any) => log.type === 'success').length;
        const failures = logs.filter((log: any) => log.type === 'error').length;
        const total = successes + failures;
        
        setAuthStats({
          totalAttempts: total,
          successfulAttempts: successes,
          failedAttempts: failures,
          successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
          recentErrors: logs.filter((log: any) => log.type === 'error'),
          browserBreakdown: {},
          deviceBreakdown: {},
          iPhoneSafariIssues: logs.filter((log: any) => 
            log.type === 'error' && 
            log.browser?.includes('Safari') && 
            log.device?.includes('iPhone')
          ).length
        });
      }
    } finally {
      setIsLoadingAuthStats(false);
    }
  };
  
  // Load usage metrics
  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const usageMetrics = await getUsageMetrics();
      setMetrics(usageMetrics);
    } catch (error) {
      console.error('Error loading usage metrics:', error);
      toast.error('Failed to load usage metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  
  // Check system health
  const loadHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const systemHealth = await checkSystemHealth();
      setHealth(systemHealth);
    } catch (error) {
      console.error('Error checking system health:', error);
      toast.error('Failed to check system health');
    } finally {
      setIsLoadingHealth(false);
    }
  };
  
  // Load user activity
  const loadActivity = async () => {
    setIsLoadingActivity(true);
    try {
      const activity = await getUserActivityAnalytics(30);
      setUserActivity(activity);
    } catch (error) {
      console.error('Error loading user activity:', error);
      toast.error('Failed to load user activity');
    } finally {
      setIsLoadingActivity(false);
    }
  };
  
  // Handle data export
  const handleExport = async () => {
    try {
      await exportDiagnosticData();
      toast.success('Diagnostic data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export diagnostic data');
    }
  };
  
  // Handle data cleanup - local only to avoid permission errors
  const handleCleanup = async () => {
    try {
      // Clean up localStorage
      const logs = localStorage.getItem('admin-error-logs');
      let cleanedCount = 0;
      
      if (logs) {
        const parsedLogs = JSON.parse(logs);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentLogs = parsedLogs.filter((log: ErrorLog) => log.timestamp > weekAgo);
        const oldLogsCount = parsedLogs.length - recentLogs.length;
        
        localStorage.setItem('admin-error-logs', JSON.stringify(recentLogs));
        cleanedCount = oldLogsCount;
        
        // Update the display to only show the cleaned logs
        const displayErrors = errors.filter(error => error.timestamp > weekAgo);
        setErrors(displayErrors);
      }
      
      if (cleanedCount > 0) {
        toast.success(`Cleaned up ${cleanedCount} old error logs`);
      } else {
        toast.success('No old logs to clean up');
      }
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error('Failed to clean up data');
    }
  };
  
  // Fetch conversion analytics
  const fetchConversionAnalytics = async () => {
    setIsLoadingConversion(true);
    try {
      // Get conversion analytics from backend
      const response = await brain.get_user_conversion_analytics({ days_back: 30 });
      const analytics = await response.json();
      
      setConversionAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching conversion analytics:', error);
      toast.error('Failed to fetch conversion analytics');
    } finally {
      setIsLoadingConversion(false);
    }
  };
  
  if (!isAdmin) {
    return null;
  }
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / 1048576)}MB`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header with refresh and export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Diagnostics</h2>
          <p className="text-muted-foreground">Monitor system health, usage, and troubleshoot issues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="auth">Auth Monitoring</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="conversion">User Conversion</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeUsers} active this week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {formatDuration(metrics.averageSessionDuration)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Translations</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTranslations}</div>
                <p className="text-xs text-muted-foreground">
                  API calls saved
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errors.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Health Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  {health.firestoreConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Firestore</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {health.authWorking ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Authentication</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {health.apiResponding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">API</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {health.storageAccessible ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Storage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Error Logs Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Recent Error Logs</h3>
              <p className="text-muted-foreground">Monitor and diagnose system errors</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCleanup}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clean Up Old Logs
              </Button>
              <Button
                onClick={fetchErrors}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoadingErrors}
              >
                {isLoadingErrors ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                onClick={clearErrorLogs}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Error Logs
              </Button>
            </div>
          </div>
          
          {isLoadingErrors ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Loading production error logs...</p>
                </div>
              </CardContent>
            </Card>
          ) : errors.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent errors found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.slice(0, 50).map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="text-xs">
                          {new Date(error.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={error.level === 'error' ? 'destructive' : error.level === 'warning' ? 'secondary' : 'outline'}>
                            {error.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{error.component || 'Unknown'}</TableCell>
                        <TableCell className="text-sm max-w-md">
                          <div className="truncate">{error.message}</div>
                          {error.metadata && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              {error.metadata.recipient && <div>To: {error.metadata.recipient}</div>}
                              {error.metadata.session_title && <div>Session: {error.metadata.session_title}</div>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{error.userId ? error.userId.substring(0, 8) : 'Anonymous'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Error Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Errors</span>
                  <span className="text-sm">{errorStats?.totalErrors || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recent Errors (24h)</span>
                  <span className="text-sm">{errorStats?.recentErrors24h || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Errors by Level</span>
                  <span className="text-sm">
                    {errorStats?.errorsByLevel ? Object.entries(errorStats.errorsByLevel).map(([level, count]) => (
                      <span key={level} className="mr-2">
                        {level}: {count}
                      </span>
                    )) : 'No data'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Errors by Source</span>
                  <span className="text-sm">
                    {errorStats?.errorsBySource ? Object.entries(errorStats.errorsBySource).map(([source, count]) => (
                      <span key={source} className="mr-2">
                        {source}: {count}
                      </span>
                    )) : 'No data'}
                  </span>
                </div>
                
                <Button variant="outline" size="sm" onClick={fetchErrors} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Usage Analytics</h3>
              <p className="text-muted-foreground">Track system usage patterns and metrics</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadMetrics} disabled={isLoadingMetrics}>
              {isLoadingMetrics ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-medium">{metrics.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users (7d)</span>
                  <span className="font-medium">{metrics.activeUsers}</span>
                </div>
                <Progress value={(metrics.activeUsers / Math.max(metrics.totalUsers, 1)) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.activeUsers / Math.max(metrics.totalUsers, 1)) * 100)}% of users active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="font-medium">{metrics.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Duration</span>
                  <span className="font-medium">{formatDuration(metrics.averageSessionDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sessions/User</span>
                  <span className="font-medium">
                    {metrics.totalUsers > 0 ? Math.round(metrics.totalSessions / metrics.totalUsers * 10) / 10 : 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transcriptions</span>
                  <span className="font-medium">{metrics.totalTranscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Translations</span>
                  <span className="font-medium">{metrics.totalTranslations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Translation Rate</span>
                  <span className="font-medium">
                    {metrics.totalTranscriptions > 0 ? Math.round((metrics.totalTranslations / metrics.totalTranscriptions) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Usage trends visualization placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Daily activity patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <p>Usage trend chart will be displayed here</p>
                  <p className="text-xs">Coming soon: Historical usage patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">System Health</h3>
              <p className="text-muted-foreground">Monitor critical system components</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadHealth} disabled={isLoadingHealth}>
              {isLoadingHealth ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Check Health
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database & Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Firestore Connection</span>
                  <div className="flex items-center gap-2">
                    {health.firestoreConnected ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Local Storage</span>
                  <div className="flex items-center gap-2">
                    {health.storageAccessible ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Working
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <div className="flex items-center gap-2">
                    {health.authWorking ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Working
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Endpoints</span>
                  <div className="flex items-center gap-2">
                    {health.apiResponding ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Responding
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Responding
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Health Check Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Health Check</span>
                  <span className="text-sm">{health.lastHealthCheck.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  <p>Health checks verify critical system components including database connectivity, authentication services, API responsiveness, and local storage access.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">User Activity</h3>
              <p className="text-muted-foreground">Monitor individual user behavior and engagement</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadActivity} disabled={isLoadingActivity}>
              {isLoadingActivity ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          {userActivity.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>No user activity data available</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Transcriptions</TableHead>
                      <TableHead>Translations</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.map((activity) => {
                      const isActive = Date.now() - activity.lastSeen.getTime() < 7 * 24 * 60 * 60 * 1000;
                      return (
                        <TableRow key={activity.userId}>
                          <TableCell className="font-mono text-xs">
                            {activity.email || activity.userId.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {activity.lastSeen.getTime() > 0 
                              ? activity.lastSeen.toLocaleDateString() + ' ' + activity.lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell className="text-sm">{activity.sessionCount}</TableCell>
                          <TableCell className="text-sm">{activity.transcriptionCount}</TableCell>
                          <TableCell className="text-sm">{activity.translationCount}</TableCell>
                          <TableCell className="text-sm">
                            {activity.errorCount > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {activity.errorCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? "outline" : "secondary"} className="text-xs">
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {userActivity.filter(u => Date.now() - u.lastSeen.getTime() < 7 * 24 * 60 * 60 * 1000).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Users (7d)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {userActivity.reduce((sum, u) => sum + u.sessionCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {userActivity.reduce((sum, u) => sum + u.transcriptionCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Transcriptions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {userActivity.reduce((sum, u) => sum + u.errorCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Auth Monitoring Tab */}
        <TabsContent value="auth" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Authentication Monitoring</h3>
              <p className="text-muted-foreground">Track auth success rates and troubleshoot sign-in issues</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAuthStats} disabled={isLoadingAuthStats}>
              {isLoadingAuthStats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className={`h-4 w-4 ${authStats.successRate >= 80 ? 'text-green-500' : authStats.successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{authStats.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {authStats.totalAttempts} total attempts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
                <XCircle className={`h-4 w-4 ${authStats.failedAttempts === 0 ? 'text-green-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{authStats.failedAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  {authStats.failedAttempts === 0 ? 'No failures' : `${Math.round((authStats.failedAttempts / authStats.totalAttempts) * 100)}% failure rate`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">iPhone Safari Issues</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${authStats.iPhoneSafariIssues === 0 ? 'text-green-500' : 'text-orange-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{authStats.iPhoneSafariIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Mobile Safari auth problems
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{authStats.recentErrors?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Browser & Device Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Browser Breakdown</CardTitle>
                <CardDescription>Auth failure rates by browser</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(authStats.browserBreakdown || {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(authStats.browserBreakdown).map(([browser, count]) => (
                      <div key={browser} className="flex justify-between items-center">
                        <span className="text-sm">{browser}</span>
                        <Badge variant={browser.includes('Safari') ? 'destructive' : 'secondary'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No browser data available</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Breakdown</CardTitle>
                <CardDescription>Auth failure rates by device</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(authStats.deviceBreakdown || {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(authStats.deviceBreakdown).map(([device, count]) => (
                      <div key={device} className="flex justify-between items-center">
                        <span className="text-sm">{device}</span>
                        <Badge variant={device.includes('iPhone') ? 'destructive' : 'secondary'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No device data available</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Auth Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Authentication Errors</CardTitle>
              <CardDescription>Latest auth failures requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {authStats.recentErrors && authStats.recentErrors.length > 0 ? (
                <div className="space-y-2">
                  {authStats.recentErrors.slice(0, 10).map((error: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg space-y-1">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{error.errorCode || 'Unknown Error'}</p>
                          <p className="text-xs text-muted-foreground">{error.message}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {error.browser && <span>Browser: {error.browser}</span>}
                            {error.device && <span>Device: {error.device}</span>}
                          </div>
                        </div>
                        <Badge variant={error.browser?.includes('Safari') && error.device?.includes('iPhone') ? 'destructive' : 'secondary'}>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No recent authentication errors</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* iPhone Safari Specific Alert */}
          {authStats.iPhoneSafariIssues > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>iPhone Safari Authentication Issues Detected</AlertTitle>
              <AlertDescription>
                {authStats.iPhoneSafariIssues} users are experiencing sign-in problems on iPhone Safari. 
                This may be related to tracking prevention or popup blocking. 
                Consider implementing redirect-based auth flow for mobile Safari.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Recent Errors Details */}
          {authStats.recentErrors && authStats.recentErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Authentication Errors</CardTitle>
                <CardDescription>
                  Detailed breakdown of recent auth failures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {authStats.recentErrors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="flex flex-col space-y-1 p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-red-600">{error.error_code}</p>
                          <p className="text-sm text-muted-foreground">{error.error_message}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {new Date(error.timestamp).toLocaleString()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Browser:</span> {error.browser_info || 'Unknown'} |
                        <span className="font-medium ml-2">Device:</span> {error.device_info || 'Unknown'} |
                        <span className="font-medium ml-2">Method:</span> {error.auth_method || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* User Conversion Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">User Conversion Analytics</h3>
              <p className="text-muted-foreground">Track signup vs usage conversion rates and identify drop-off issues</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConversionAnalytics} disabled={isLoadingConversion}>
              {isLoadingConversion ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          {/* Conversion Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Auth Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionAnalytics?.total_auth_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Signed up via Firebase Auth
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users With Sessions</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionAnalytics?.users_with_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully using the app
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionAnalytics?.conversion_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Signup to first session
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Red Flag Users</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionAnalytics?.users_without_sessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Signed up but never used app
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Signup Activity</CardTitle>
                <CardDescription>Users who signed up recently but haven't created sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recent signups (7 days)</span>
                    <Badge variant={conversionAnalytics?.recent_signups_no_activity > 3 ? 'destructive' : 'secondary'}>
                      {conversionAnalytics?.recent_signups_no_activity || 0}
                    </Badge>
                  </div>
                  {conversionAnalytics?.avg_time_to_first_session_hours && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. time to first session</span>
                      <span className="text-sm font-medium">
                        {conversionAnalytics.avg_time_to_first_session_hours < 24 
                          ? `${Math.round(conversionAnalytics.avg_time_to_first_session_hours)}h`
                          : `${Math.round(conversionAnalytics.avg_time_to_first_session_hours / 24)}d`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion Health</CardTitle>
                <CardDescription>Overall signup to usage health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Status</span>
                    <Badge variant={
                      !conversionAnalytics ? 'secondary' :
                      conversionAnalytics.conversion_rate >= 70 ? 'default' :
                      conversionAnalytics.conversion_rate >= 50 ? 'secondary' : 'destructive'
                    }>
                      {!conversionAnalytics ? 'No data' :
                       conversionAnalytics.conversion_rate >= 70 ? 'Excellent' :
                       conversionAnalytics.conversion_rate >= 50 ? 'Good' : 'Needs Attention'
                      }
                    </Badge>
                  </div>
                  {conversionAnalytics?.recent_signups_no_activity > 5 && (
                    <div className="p-2 bg-red-50 text-red-800 rounded text-sm">
                      ⚠️ High number of recent signups with no activity - investigate onboarding flow
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Users Without Sessions List */}
          {conversionAnalytics?.users_zero_sessions && conversionAnalytics.users_zero_sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users Who Signed Up But Never Used App</CardTitle>
                <CardDescription>These users may indicate onboarding or UX issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {conversionAnalytics.users_zero_sessions
                      .sort((a: any, b: any) => new Date(b.creation_time).getTime() - new Date(a.creation_time).getTime())
                      .slice(0, 20)
                      .map((user: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium">{user.email || 'No email'}</div>
                          <div className="text-xs text-muted-foreground">
                            Signed up: {user.creation_time ? new Date(user.creation_time).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          0 sessions
                        </Badge>
                      </div>
                    ))}
                    {conversionAnalytics.users_zero_sessions.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Showing 20 of {conversionAnalytics.users_zero_sessions.length} users
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-refresh" 
            checked={autoRefresh} 
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh">Auto Refresh</Label>
        </div>
      </div>
    </div>
  );
};
