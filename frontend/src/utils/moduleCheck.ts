/**
 * Implementation: moduleCheck
 * 
 * Description:
 * Hooks and utilities for checking module status and access.
 */

import { create } from 'zustand';
import { useModuleRegistryStore } from './moduleRegistry';
import { useEffect } from 'react';

interface ModuleCheckState {
  isModuleEnabled: (moduleId: string) => boolean;
  requiresModule: (moduleId: string) => boolean;
  checkModuleAccess: (moduleId: string) => Promise<boolean>;
}

export const useModuleCheck = create<ModuleCheckState>((set, get) => ({
  isModuleEnabled: (moduleId) => {
    const registry = useModuleRegistryStore.getState();
    const moduleInfo = registry.getModuleInfo(moduleId);
    
    // Core module is always enabled
    if (moduleId === 'core') return true;
    
    return moduleInfo?.enabled ?? false;
  },
  
  requiresModule: (moduleId) => {
    const registry = useModuleRegistryStore.getState();
    const moduleInfo = registry.getModuleInfo(moduleId);
    return moduleInfo?.required ?? false;
  },
  
  checkModuleAccess: async (moduleId) => {
    // This would be a more complex check in a full implementation
    // with potential server verification, license checking, etc.
    return get().isModuleEnabled(moduleId);
  }
}));

/**
 * Hook to ensure required modules are enabled
 */
export const useEnsureRequiredModules = () => {
  const registry = useModuleRegistryStore();
  
  useEffect(() => {
    // Ensure all required modules are enabled
    Object.values(registry.modules).forEach(module => {
      if (module.required && !module.enabled) {
        console.log(`ModuleCheck: Enabling required module ${module.id}`);
        registry.setModuleEnabled(module.id, true);
      }
    });
  }, [registry]);
};

/**
 * Hook to check if a specific feature requires a module that isn't enabled
 */
export const useFeatureModuleCheck = (moduleId: string) => {
  const isEnabled = useModuleCheck(state => state.isModuleEnabled(moduleId));
  const registry = useModuleRegistryStore();
  const moduleInfo = registry.getModuleInfo(moduleId);
  
  return {
    isEnabled,
    moduleName: moduleInfo?.name || moduleId,
    moduleDescription: moduleInfo?.description,
    isRequired: moduleInfo?.required ?? false
  };
};
