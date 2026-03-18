import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  Database, 
  FileText, 
  Music, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  HardDrive,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { Helmet } from 'react-helmet-async';
import { NoIndexMeta } from 'components/NoIndexMeta';

interface StorageStats {
  total_files: number;
  total_size: number;
  by_type: Record<string, { count: number; size: number; files: string[] }>;
  by_pattern: Record<string, { count: number; size: number; files: string[] }>;
}

interface CleanupResult {
  success: boolean;
  files_deleted: number;
  size_freed: number;
  errors: string[];
  deleted_files: string[];
  dry_run: boolean;
}

const StorageCleanup = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [maxFiles, setMaxFiles] = useState<number>(100);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await brain.get_storage_stats();
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load storage statistics');
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleCleanupAudio = async () => {
    setCleanupLoading(true);
    try {
      const response = await brain.cleanup_audio_files({ dry_run: isDryRun, max_files: maxFiles });
      const result = await response.json();
      setLastCleanupResult(result);
      
      if (result.success) {
        if (result.dry_run) {
          toast.success(`Preview: Would delete ${result.files_deleted} audio files (${formatBytes(result.size_freed)})`);
        } else {
          toast.success(`Deleted ${result.files_deleted} audio files, freed ${formatBytes(result.size_freed)}`);
          // Refresh stats after actual cleanup
          loadStats();
        }
      } else {
        toast.error(`Cleanup had ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Failed to cleanup audio files');
      console.error('Cleanup failed:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCleanupTestData = async () => {
    setCleanupLoading(true);
    try {
      const response = await brain.cleanup_test_data({ dry_run: isDryRun, max_files: maxFiles });
      const result = await response.json();
      setLastCleanupResult(result);
      
      if (result.success) {
        if (result.dry_run) {
          toast.success(`Preview: Would delete ${result.files_deleted} test files (${formatBytes(result.size_freed)})`);
        } else {
          toast.success(`Deleted ${result.files_deleted} test files, freed ${formatBytes(result.size_freed)}`);
          // Refresh stats after actual cleanup
          loadStats();
        }
      } else {
        toast.error(`Cleanup had ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Failed to cleanup test data');
      console.error('Cleanup failed:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading storage statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <NoIndexMeta />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8" />
          Storage Cleanup
        </h1>
        <p className="text-gray-600">
          Manage and clean up test transcriptions, audio files, and other storage to free up space.
        </p>
      </div>

      {/* Storage Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_files.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total_size)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audio Files</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.by_pattern.audio_files?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.by_pattern.audio_files?.size || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Categories */}
      {stats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Storage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3">By File Type</h4>
                <div className="space-y-2">
                  {Object.entries(stats.by_type).map(([type, data]) => (
                    <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="capitalize font-medium">{type}</span>
                      <div className="text-right">
                        <Badge variant="outline">{data.count} files</Badge>
                        <div className="text-xs text-gray-600">{formatBytes(data.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">By Category</h4>
                <div className="space-y-2">
                  {Object.entries(stats.by_pattern).map(([pattern, data]) => (
                    <div key={pattern} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="capitalize font-medium">{pattern.replace('_', ' ')}</span>
                      <div className="text-right">
                        <Badge variant="outline">{data.count} files</Badge>
                        <div className="text-xs text-gray-600">{formatBytes(data.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Cleanup Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Safety Controls */}
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="dry-run"
                    checked={isDryRun}
                    onCheckedChange={setIsDryRun}
                  />
                  <Label htmlFor="dry-run" className="font-medium">
                    Preview Mode (Dry Run)
                  </Label>
                </div>
                <p className="text-sm text-yellow-700">
                  {isDryRun 
                    ? "Preview what would be deleted without actually deleting anything" 
                    : "⚠️ Files will be permanently deleted!"}
                </p>
              </div>
            </div>
            
            {/* Max Files Limit */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="max-files" className="whitespace-nowrap">Max Files:</Label>
              <Input
                id="max-files"
                type="number"
                value={maxFiles}
                onChange={(e) => setMaxFiles(parseInt(e.target.value) || 100)}
                className="w-24"
                min={1}
                max={1000}
              />
              <span className="text-sm text-gray-600">Limit deletion to prevent accidents</span>
            </div>
            
            <Separator />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleCleanupAudio}
                disabled={cleanupLoading}
                variant={isDryRun ? "outline" : "destructive"}
                className="h-auto p-4 flex flex-col items-start space-y-2"
              >
                {cleanupLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Music className="w-5 h-5" />
                )}
                <div className="text-left">
                  <div className="font-semibold">
                    {isDryRun ? 'Preview' : 'Delete'} Audio Files
                  </div>
                  <div className="text-xs opacity-75">
                    Clean up all audio_* files
                  </div>
                </div>
              </Button>
              
              <Button
                onClick={handleCleanupTestData}
                disabled={cleanupLoading}
                variant={isDryRun ? "outline" : "destructive"}
                className="h-auto p-4 flex flex-col items-start space-y-2"
              >
                {cleanupLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                <div className="text-left">
                  <div className="font-semibold">
                    {isDryRun ? 'Preview' : 'Delete'} Test Data
                  </div>
                  <div className="text-xs opacity-75">
                    Clean up test files and recordings
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup Results */}
      {lastCleanupResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastCleanupResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Cleanup Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {lastCleanupResult.files_deleted}
                  </div>
                  <div className="text-sm text-blue-700">
                    Files {lastCleanupResult.dry_run ? 'would be deleted' : 'deleted'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatBytes(lastCleanupResult.size_freed)}
                  </div>
                  <div className="text-sm text-green-700">
                    Space {lastCleanupResult.dry_run ? 'would be freed' : 'freed'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {lastCleanupResult.errors.length}
                  </div>
                  <div className="text-sm text-gray-700">Errors</div>
                </div>
              </div>
              
              {lastCleanupResult.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Errors occurred:</strong>
                    <ul className="mt-2 list-disc list-inside">
                      {lastCleanupResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {lastCleanupResult.dry_run && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This was a preview. Turn off "Preview Mode" to actually delete the files.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button onClick={loadStats} variant="outline">
          Refresh Statistics
        </Button>
      </div>
    </div>
  );
};

export default StorageCleanup;
