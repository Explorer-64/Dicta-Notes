/**
 * Implementation: moduleRegistry
 * 
 * Description:
 * Store and utilities for managing app modules registration and status.
 */

import { create } from 'zustand';

interface ModuleRegistryState {
  modules: Record<string, {
    id: string;
    name: string;
    enabled: boolean;
    description?: string;
    required?: boolean;
  }>;  
  registerModule: (moduleId: string, name: string, description?: string, required?: boolean) => void;
  setModuleEnabled: (moduleId: string, enabled: boolean) => void;
  isModuleRegistered: (moduleId: string) => boolean;
  getModuleInfo: (moduleId: string) => { id: string; name: string; enabled: boolean; description?: string; required?: boolean; } | null;
}

export const useModuleRegistryStore = create<ModuleRegistryState>((set, get) => ({
  modules: {
    'core': {
      id: 'core',
      name: 'Core Transcription',
      description: 'Real-time transcription with speaker differentiation',
      required: true,
      enabled: true
    },
    'persistence': {
      id: 'persistence',
      name: 'Transcript Storage',
      description: 'Permanent storage of meeting transcripts',
      required: false,
      enabled: true  // Enable by default
    },
    'recording': {
      id: 'recording',
      name: 'Audio Storage',
      description: 'Recording and playback of meeting audio',
      required: false,
      enabled: true  // Enable by default
    }
  },
  
  registerModule: (moduleId, name, description, required = false) => {
    console.log(`ModuleRegistry: Registering module ${moduleId}`);
    
    set(state => ({
      modules: {
        ...state.modules,
        [moduleId]: {
          id: moduleId,
          name,
          description,
          required,
          enabled: required || (state.modules[moduleId]?.enabled ?? false)
        }
      }
    }));
  },
  
  setModuleEnabled: (moduleId, enabled) => {
    console.log(`ModuleRegistry: Setting module ${moduleId} enabled=${enabled}`);
    
    set(state => {
      // Don't disable required modules
      if (!enabled && state.modules[moduleId]?.required) {
        console.warn(`ModuleRegistry: Can't disable required module ${moduleId}`);
        return state;
      }
      
      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...state.modules[moduleId],
            enabled
          }
        }
      };
    });
  },
  
  isModuleRegistered: (moduleId) => {
    return !!get().modules[moduleId];
  },
  
  getModuleInfo: (moduleId) => {
    return get().modules[moduleId] || null;
  }
}));
