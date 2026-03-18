import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useUserGuardContext } from 'app';
import brain from '../brain';
import { toast } from 'sonner';

interface MigrationState {
  checking: boolean;
  migrating: boolean;
  needed: boolean;
  storageCount: number;
  firestoreCount: number;
  progress: number;
  error: string | null;
  success: boolean;
}

/**
 * Component to handle migration of sessions from db.storage to Firestore
 */
export const MigrationManager = () => {
  const { user } = useUserGuardContext();
  const [state, setState] = useState<MigrationState>({
    checking: true,
    migrating: false,
    needed: false,
    storageCount: 0,
    firestoreCount: 0,
    progress: 0,
    error: null,
    success: false
  });

  // Check if migration is needed
  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, checking: false, needed: false }));
      return;
    }

    const checkMigrationStatus = async () => {
      try {
        setState(prev => ({ ...prev, checking: true }));
        
        // Let the brain client handle the auth headers via securityWorker
        const response = await brain.check_migration_status();
        
        const data = await response.json();
        
        // Determine if migration is needed
        const storageCount = data.storage_session_count || 0;
        const firestoreCount = data.firestore_session_count || 0;
        const needed = storageCount > 0 && firestoreCount < storageCount;
        
        setState(prev => ({
          ...prev,
          checking: false,
          needed,
          storageCount,
          firestoreCount
        }));
      } catch (error) {
        console.error('Error checking migration status:', error);
        setState(prev => ({
          ...prev,
          checking: false,
          error: 'Failed to check migration status. Please try again.'
        }));
      }
    };

    checkMigrationStatus();
  }, [user]);

  // Start migration process
  const startMigration = async () => {
    try {
      if (!user) {
        toast.error('You must be signed in to migrate sessions');
        return;
      }
      
      setState(prev => ({
        ...prev,
        migrating: true,
        progress: 10,
        error: null
      }));
      setState(prev => ({ ...prev, progress: 30 }));
      
      // Let the brain client handle the auth headers via securityWorker
      // Use migrate_sessions with the current user's ID
      const response = await brain.migrate_sessions({ user_id: user.uid });
      
      setState(prev => ({ ...prev, progress: 70 }));
      
      const result = await response.json();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          migrating: false,
          needed: false,
          progress: 100,
          success: true,
          firestoreCount: prev.firestoreCount + result.migrated
        }));
        
        toast.success(`Migration complete! ${result.migrated} sessions migrated successfully.`);
      } else {
        setState(prev => ({
          ...prev,
          migrating: false,
          error: result.error || 'Migration failed. Please try again.',
          progress: 0
        }));
        
        toast.error('Migration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      setState(prev => ({
        ...prev,
        migrating: false,
        error: 'An error occurred during migration. Please try again.',
        progress: 0
      }));
      
      toast.error('Migration failed. Please try again.');
    }
  };

  // Don't show anything if no migration is needed
  if (!state.checking && !state.needed && !state.success) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Migration Assistant</CardTitle>
        <CardDescription>
          Migrate your sessions to secure cloud storage for better reliability and access control
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {state.checking ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <p>Checking migration status...</p>
          </div>
        ) : state.needed ? (
          <>
            <p className="mb-4">
              We found {state.storageCount} sessions in local storage that need to be migrated to 
              your secure cloud storage. This will ensure your data is protected and accessible only to you.
            </p>
            
            {state.migrating && (
              <div className="my-4">
                <Progress value={state.progress} className="mb-2" />
                <p className="text-sm text-gray-500">Migration in progress...</p>
              </div>
            )}
            
            {state.error && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Migration Failed</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : state.success ? (
          <Alert className="my-4">
            <AlertTitle>Migration Complete</AlertTitle>
            <AlertDescription>
              Your sessions have been successfully migrated to secure cloud storage.
              You now have {state.firestoreCount} sessions in your personal cloud storage.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      
      {(state.needed && !state.migrating) && (
        <CardFooter>
          <Button onClick={startMigration} disabled={state.migrating}>
            {state.migrating ? 'Migrating...' : 'Start Migration'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
