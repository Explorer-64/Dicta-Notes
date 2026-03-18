import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import brain from 'brain';

interface LanguageState {
  // Current language preference
  preferredLanguage: string;
  // Flag to indicate if the preference has been loaded from storage
  isInitialized: boolean;
  // Set preferred language and store it in appropriate storage
  setPreferredLanguage: (language: string, user: User | null) => Promise<void>;
  // Initialize language preference from appropriate storage
  initializeLanguagePreference: (user: User | null) => Promise<void>;
}

// Create the store with persistence for non-authenticated users
export const useLanguageStore = create<LanguageState>()(  
  persist(
    (set, get) => ({
      preferredLanguage: getBrowserLanguage(),
      isInitialized: false,
      
      // Set preferred language and store it in appropriate storage
      setPreferredLanguage: async (language: string, user: User | null) => {
        // UNIVERSAL REDUNDANCY CHECK: Skip if already set to target language
        const currentPreference = get().preferredLanguage;
        if (currentPreference === language) {
          console.log(`Language preference already set to '${language}', skipping redundant save`);
          return;
        }
        
        console.log(`Changing language preference from '${currentPreference}' to '${language}'`);
        
        // Update state first (optimistic update)
        set({ preferredLanguage: language });
        
        // If user is authenticated, store via backend API
        if (user) {
          try {
            const response = await brain.update_language_preference({ preferred_language: language });
            if (response.ok) {
              console.log('Language preference saved via API');
            } else {
              throw new Error('API call failed');
            }
          } catch (error) {
            console.error('Failed to save language preference via API:', error);
            // Still keep the local state updated even if API fails
          }
        }
        // For non-authenticated users, update localStorage through persist middleware
        
        // Also save to localStorage directly to ensure availability for page refresh
        // regardless of auth state
        try {
          localStorage.setItem('user-language-preference', language);
        } catch (e) {
          console.error('Failed to save language preference to localStorage:', e);
        }
      },

      // Initialize language preference from appropriate storage
      initializeLanguagePreference: async (user: User | null) => {
        // Add guard to prevent multiple initializations
        if (get().isInitialized) {
          console.log('Language preference already initialized, skipping');
          return;
        }
        
        try {
          // For authenticated users, load from backend API first
          if (user) {
            try {
              // Check if brain client method exists (handles development regeneration)
              if (typeof brain.get_language_preference !== 'function') {
                console.warn('Brain client method get_language_preference not available yet, using fallback');
                throw new Error('Brain client not ready');
              }
              
              const response = await brain.get_language_preference();
              if (response.ok) {
                const data = await response.json();
                const preferredLanguage = data.preferred_language || 'en';
                
                console.log(`Loaded language preference from API: ${preferredLanguage}`);
                set({ preferredLanguage, isInitialized: true });
                return;
              }
            } catch (error) {
              console.error('Failed to load language preference from API:', error);
              // Fall through to localStorage fallback
            }
          }
          
          // If we reach here, either:
          // 1. User is not authenticated
          // 2. User is authenticated but has no stored preference
          // 3. Firebase access failed
          // In all cases, the persist middleware will have loaded any localStorage value
          
          // Check direct localStorage value as a fallback (may be set by another browser tab)
          try {
            const directStorageValue = localStorage.getItem('user-language-preference');
            if (directStorageValue && directStorageValue !== get().preferredLanguage) {
              console.log('Using direct localStorage language preference:', directStorageValue);
              set({ preferredLanguage: directStorageValue });
            }
          } catch (e) {
            console.error('Failed to read direct localStorage preference:', e);
          }
          
          // Just mark as initialized
          set({ isInitialized: true });
        } catch (error) {
          console.error('Error initializing language preference:', error);
          // Ensure we're still marked as initialized even if errors occur
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'dicta-notes-language', // localStorage key
      partialize: (state) => ({ preferredLanguage: state.preferredLanguage, isInitialized: state.isInitialized }), // only persist preferredLanguage
    }
  )
);

// Helper function to get the browser language
function getBrowserLanguage(): string {
  return navigator.language.split('-')[0] || 'en';
}
