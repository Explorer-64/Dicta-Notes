
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Module } from '../utils/useModules';
import brain from 'brain';
import { useCurrentUser } from 'app';
import { toast } from 'sonner';

// Default fallback modules when real modules can't be loaded
const DEFAULT_MODULES: Module[] = [
  { id: 'core', name: 'Core Transcription', description: 'Real-time transcription with speaker differentiation', required: true, enabled: true },
  { id: 'persistence', name: 'Transcript Storage', description: 'Permanent storage of meeting transcripts', required: false, enabled: false },
  { id: 'recording', name: 'Audio Storage', description: 'Recording and playback of meeting audio', required: false, enabled: false }
];

// Create context for modules
interface ModuleContextType {
  modules: Module[];
  loading: boolean;
  error: string | null;
  hasModuleAccess: (moduleId: string) => boolean;
  enableModule: (moduleId: string) => Promise<boolean>;
  disableModule: (moduleId: string) => Promise<boolean>;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function useModuleContext() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModuleContext must be used within a ModuleProvider');
  }
  return context;
}

interface ModuleProviderProps {
  children: React.ReactNode;
}

// Export as named components to ensure consistent Fast Refresh
export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children }) => {
  // Get current user for API calls
  const { user } = useCurrentUser();
  
  // State for modules
  const [modules, setModules] = useState<Module[]>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if a module is enabled
  const hasModuleAccess = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module?.enabled || false;
  }, [modules]);
  
  // Enable a module
  const enableModule = useCallback(async (moduleId: string) => {
    if (!user) {
      toast.warning("Please sign in to save your settings");
      // Still update UI optimistically
      setModules(prev => 
        prev.map(m => m.id === moduleId ? { ...m, enabled: true } : m)
      );
      return false;
    }
    
    try {
      console.log(`Enabling module ${moduleId} for user ${user.uid}...`);
      // Ensure parameters are correctly formatted with the exact parameter names expected by the API
      const requestParams = {
        userId: user.uid,
        moduleId: moduleId
      };
      console.log('Request params:', requestParams);
      
      const response = await brain.enable_user_module(requestParams);
      console.log(`Module enable response status: ${response.status}`);
      
      if (response.ok) {
        // Use response.data - the http-client already parsed the JSON
        const responseData = (response as any).data || response;
        console.log('Module enable success:', responseData);
        
        // Update local state
        setModules(prev => 
          prev.map(m => m.id === moduleId ? { ...m, enabled: true } : m)
        );
        return true;
      } else {
        // Use response.error - the http-client already parsed the JSON
        const errorData = (response as any).error || { detail: 'Unknown error' };
        console.error("Failed to enable module:", errorData);
        toast.error(`Couldn't enable module: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Error enabling module:", error);
      toast.error("Couldn't save settings");
      return false;
    }
  }, [user]);
  
  // Disable a module
  const disableModule = useCallback(async (moduleId: string) => {
    if (!user) {
      toast.warning("Please sign in to save your settings");
      // Still update UI optimistically
      setModules(prev => 
        prev.map(m => m.id === moduleId ? { ...m, enabled: m.required } : m)
      );
      return false;
    }
    
    try {
      console.log(`Disabling module ${moduleId} for user ${user.uid}...`);
      // Ensure parameters are correctly formatted with the exact parameter names expected by the API
      const requestParams = {
        userId: user.uid,
        moduleId: moduleId
      };
      console.log('Request params:', requestParams);
      
      const response = await brain.disable_user_module(requestParams);
      console.log(`Module disable response status: ${response.status}`);
      
      if (response.ok) {
        // Use response.data - the http-client already parsed the JSON
        const responseData = (response as any).data || response;
        console.log('Module disable success:', responseData);
        
        // Update local state
        setModules(prev => 
          prev.map(m => m.id === moduleId ? { ...m, enabled: m.required } : m)
        );
        return true;
      } else {
        // Use response.error - the http-client already parsed the JSON
        const errorData = (response as any).error || { detail: 'Unknown error' };
        console.error("Failed to disable module:", errorData);
        toast.error(`Couldn't disable module: ${errorData.detail || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Error disabling module:", error);
      toast.error("Couldn't save settings");
      return false;
    }
  }, [user]);
  
  // Refresh modules from backend
  const refreshModules = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Refreshing modules for user:', user.uid);
      
      // Check if brain client method exists (handles development regeneration)
      if (typeof brain.list_available_modules !== 'function') {
        console.warn('Brain client method list_available_modules not available yet, using fallback');
        setLoading(false);
        return;
      }
      
      // Fetch available modules first
      const availableResponse = await brain.list_available_modules();
      // Use response.data - the http-client already parsed the JSON
      const availableData = (availableResponse as any).data || availableResponse;
      console.log('Available modules:', availableData);
      
      // Process modules from API response instead of using hardcoded list
      const processedModules = availableData.modules.map((module: Module) => ({
        ...module,
        enabled: module.required || false
      }));
      
      // If user is logged in, get their enabled modules
      try {
        console.log(`Fetching user modules for ${user.uid}...`);
        const userModulesResponse = await brain.get_user_modules({ userId: user.uid });
        // Use response.data - the http-client already parsed the JSON
        const userModulesData = (userModulesResponse as any).data || userModulesResponse;
        console.log('User modules data:', userModulesData);
        
        // Update enabled status based on user's preferences
        processedModules.forEach(module => {
          if (userModulesData.modules[module.id] !== undefined) {
            module.enabled = userModulesData.modules[module.id];
            console.log(`Module ${module.id} enabled state: ${module.enabled}`);
          }
        });
        
        // Set modules
        setModules(processedModules);
        setError(null);
      } catch (userModulesError) {
        console.error('Failed to fetch user modules:', userModulesError);
        // Continue with default modules
      }
    } catch (err) {
      console.error('Failed to refresh modules:', err);
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Load modules on component mount
  useEffect(() => {
    refreshModules();
  }, [refreshModules]); // This will refresh when user changes
  
  const contextValue = {
    modules,
    loading,
    error,
    hasModuleAccess,
    enableModule,
    disableModule,
    refreshModules
  };
  
  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
};

// Safe version of useModuleContext that returns fallback values if context is not available
export function useSafeModuleContext() {
  try {
    return useModuleContext();
  } catch (error) {
    console.warn('ModuleContext not available, using fallback implementation');
    // Fallback implementation
    return {
      modules: DEFAULT_MODULES,
      loading: false,
      error: null,
      hasModuleAccess: (moduleId: string) => {
        // Only core transcription is always enabled
        return moduleId === 'core';
      },
      enableModule: async () => {
        toast.error('Module management not available');
        return false;
      },
      disableModule: async () => {
        toast.error('Module management not available');
        return false;
      },
      refreshModules: async () => {}
    };
  }
}
