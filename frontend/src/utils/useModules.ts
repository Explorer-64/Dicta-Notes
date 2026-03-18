import { useState, useEffect } from 'react';
import brain from 'brain';
import { useCurrentUser } from 'app';

export interface Module {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled?: boolean;
}

export const useModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading } = useCurrentUser();
  
  // Fetch all available modules
  const fetchModules = async () => {
    setLoading(true);
    try {
      // Get all available modules
      const availableResponse = await brain.list_available_modules();
      const availableData = await availableResponse.json();
      
      // If we have a user ID, get user's enabled modules
      if (userId) {
        const userResponse = await brain.get_user_modules({ user_id: userId });
        const userData = await userResponse.json();
        
        // Combine the data
        const combinedModules = availableData.modules.map((module: Module) => ({
          ...module,
          enabled: userData.modules[module.id] || module.required
        }));
        
        setModules(combinedModules);
      } else {
        // If not logged in, only core modules are enabled
        const combinedModules = availableData.modules.map((module: Module) => ({
          ...module,
          enabled: module.required
        }));
        
        setModules(combinedModules);
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err);
      setError('Failed to load modules');
      
      // Set default modules (core only)
      setModules([
        { id: 'core', name: 'Core Transcription', description: 'Basic meeting transcription', required: true, enabled: true },
        { id: 'transcription', name: 'Transcription', description: 'Audio transcription capabilities', required: true, enabled: true },
        { id: 'speakerIdentification', name: 'Speaker Identification', description: 'Identify different speakers in meetings', required: true, enabled: true }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Enable a module
  const enableModule = async (moduleId: string) => {
    if (!userId) return false;
    
    try {
      await brain.enable_user_module({ user_id: userId, module_id: moduleId });
      // Update local state
      setModules(prev => 
        prev.map(m => m.id === moduleId ? { ...m, enabled: true } : m)
      );
      return true;
    } catch (err) {
      console.error(`Failed to enable module ${moduleId}:`, err);
      return false;
    }
  };
  
  // Disable a module
  const disableModule = async (moduleId: string) => {
    if (!userId) return false;
    
    try {
      await brain.disable_user_module({ user_id: userId, module_id: moduleId });
      // Update local state
      setModules(prev => 
        prev.map(m => m.id === moduleId ? { ...m, enabled: m.required } : m)
      );
      return true;
    } catch (err) {
      console.error(`Failed to disable module ${moduleId}:`, err);
      return false;
    }
  };
  
  // Check if user has access to a specific module
  const hasModuleAccess = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module?.enabled || false;
  };
  
  // Load modules on component mount and when user changes
  useEffect(() => {
    if (!userLoading) {
      fetchModules();
    }
  }, [userId, userLoading]);
  
  return {
    modules,
    loading,
    error,
    hasModuleAccess,
    enableModule,
    disableModule,
    refreshModules: fetchModules
  };
};
