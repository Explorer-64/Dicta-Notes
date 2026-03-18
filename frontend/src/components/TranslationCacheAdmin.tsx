
import React, { useState, useEffect } from 'react';
import { useCurrentUser } from 'app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cleanupCache, clearTranslationCache, forceCleanupCache, getTranslationMetrics } from 'utils/translationCache';
import { Loader2, AlertTriangle, RefreshCw, Trash2, Database, Search, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { firestore } from 'app';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

/**
 * Admin component for managing the translation cache
 * Shows metrics and provides controls for cache cleanup
 */
export const TranslationCacheAdmin: React.FC = () => {
  const { user } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState({
    hits: 0,
    misses: 0,
    apiCalls: 0,
    savedApiCalls: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [languageStats, setLanguageStats] = useState<{language: string, count: number, totalSize: number}[]>([]);
  const [cacheStats, setCacheStats] = useState({ totalEntries: 0, totalSize: 0, oldestEntry: null, newestEntry: null });
  
  // Check if user is admin
  useEffect(() => {
    // In a real app, this would check a proper admin role
    // For this example, we're using a specific email
    const adminEmails = ['abereimer64@gmail.com', 'dward@wevad.com', 'dianareimer90@gmail.com'];
    setIsAdmin(adminEmails.includes(user?.email || ''));
  }, [user]);
  
  // Load metrics on mount and when refreshed
  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      // Get metrics from the cache
      const currentMetrics = await getTranslationMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Error getting translation metrics:', error);
      toast.error('Failed to load translation metrics');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshMetrics();
    // Set up periodic refresh
    const intervalId = setInterval(refreshMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate metrics
  const totalRequests = metrics.hits + metrics.misses;
  const cacheHitRate = totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0;
  const apiSavingsRate = metrics.apiCalls > 0 
    ? (metrics.savedApiCalls / (metrics.apiCalls + metrics.savedApiCalls)) * 100 
    : 0;
  
  // Handle cache cleanup
  const handleCleanupCache = async () => {
    if (!isAdmin) return;
    
    setIsCleaning(true);
    try {
      await forceCleanupCache();
      toast.success('Translation cache cleanup completed');
      refreshMetrics();
    } catch (error) {
      console.error('Error cleaning up translation cache:', error);
      toast.error('Failed to clean up translation cache');
    } finally {
      setIsCleaning(false);
    }
  };
  
  // Handle clearing entire cache
  const handleClearCache = async () => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to clear the entire translation cache? This cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearTranslationCache();
      toast.success('Translation cache cleared successfully');
      refreshMetrics();
    } catch (error) {
      console.error('Error clearing translation cache:', error);
      toast.error('Failed to clear translation cache');
    } finally {
      setIsClearing(false);
    }
  };

  // Load recent cache entries for diagnostic purposes
  const loadRecentEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const cacheRef = collection(firestore, 'translationCache');
      const q = query(cacheRef, orderBy('timestamp', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        contentPreview: doc.data().translatedContent?.substring(0, 100) + '...'
      }));
      
      setRecentEntries(entries);
    } catch (error) {
      console.error('Error loading recent entries:', error);
      toast.error('Failed to load recent cache entries');
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Load language statistics
  const loadLanguageStats = async () => {
    setIsLoadingStats(true);
    try {
      const cacheRef = collection(firestore, 'translationCache');
      const querySnapshot = await getDocs(cacheRef);
      
      const languageMap = new Map<string, {count: number, totalSize: number}>();
      let totalEntries = 0;
      let totalSize = 0;
      let oldestTimestamp = Number.MAX_SAFE_INTEGER;
      let newestTimestamp = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const language = data.language || 'unknown';
        const contentSize = (data.translatedContent || '').length;
        const timestamp = data.timestamp || 0;
        
        totalEntries++;
        totalSize += contentSize;
        
        if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
        if (timestamp > newestTimestamp) newestTimestamp = timestamp;
        
        const existing = languageMap.get(language) || { count: 0, totalSize: 0 };
        languageMap.set(language, {
          count: existing.count + 1,
          totalSize: existing.totalSize + contentSize
        });
      });
      
      const languageStatsArray = Array.from(languageMap.entries())
        .map(([language, stats]) => ({ language, ...stats }))
        .sort((a, b) => b.count - a.count);
      
      setLanguageStats(languageStatsArray);
      setCacheStats({
        totalEntries,
        totalSize,
        oldestEntry: oldestTimestamp === Number.MAX_SAFE_INTEGER ? null : new Date(oldestTimestamp),
        newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp)
      });
    } catch (error) {
      console.error('Error loading language stats:', error);
      toast.error('Failed to load cache statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Export cache data as JSON
  const exportCacheData = async () => {
    try {
      const cacheRef = collection(firestore, 'translationCache');
      const querySnapshot = await getDocs(cacheRef);
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation-cache-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Cache data exported successfully');
    } catch (error) {
      console.error('Error exporting cache data:', error);
      toast.error('Failed to export cache data');
    }
  };
  
  if (!isAdmin) {
    return null; // Don't render anything for non-admin users
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Translation Cache Management</CardTitle>
        <CardDescription>
          Monitor and manage the translation cache system to optimize API usage and performance.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Cache Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Cache Metrics</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshMetrics}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                <span className="text-sm font-medium">{cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={cacheHitRate} className="h-2" />
              <div className="grid grid-cols-2 text-xs text-muted-foreground">
                <div>Hits: {metrics.hits}</div>
                <div>Misses: {metrics.misses}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">API Call Savings</span>
                <span className="text-sm font-medium">{apiSavingsRate.toFixed(1)}%</span>
              </div>
              <Progress value={apiSavingsRate} className="h-2" />
              <div className="grid grid-cols-2 text-xs text-muted-foreground">
                <div>Saved: {metrics.savedApiCalls}</div>
                <div>Made: {metrics.apiCalls}</div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Cache Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cache Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button 
                variant="secondary" 
                onClick={handleCleanupCache} 
                disabled={isCleaning}
                className="w-full"
              >
                {isCleaning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Clean Up Expired Entries
              </Button>
              <p className="text-xs text-muted-foreground">
                Removes outdated entries and enforces size limits per language.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="destructive" 
                onClick={handleClearCache} 
                disabled={isClearing}
                className="w-full"
              >
                {isClearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Clear All Cache
              </Button>
              <p className="text-xs text-muted-foreground">
                Deletes all cached translations. Use with caution!
              </p>
            </div>
          </div>
        </div>
        
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cache Information</AlertTitle>
          <AlertDescription>
            <p className="text-sm">The translation cache stores previously translated content to reduce API calls and improve performance. Cached entries only expire when content changes.</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
