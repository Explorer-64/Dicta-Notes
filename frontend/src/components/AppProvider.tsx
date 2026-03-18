import { ReactNode, useEffect, useRef } from "react";
import { useCurrentUser } from "app";
import { useLanguageStore } from "../utils/languageStore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "sonner";
import { PWAHead } from "components/PWAHead";
import { PWAInstall } from "./PWAInstall";
import { PWAController } from "components/PWAController";
import { PWAUpdatePrompt } from "components/PWAUpdatePrompt";
import { PWAOfflineIndicator } from "components/PWAOfflineIndicator";
import { useUserPreferences } from "../utils/useUserPreferences";
import { ModuleProvider } from "../utils/ModuleContext";
import { AuthProvider } from "components/AuthProvider";
import { SuspenseWrapper } from "components/SuspenseWrapper";
import { AutoTranslatePrompt } from "components/AutoTranslatePrompt";
import { DocumentAttributes } from "components/DocumentAttributes";
import { AICrawlerMetaTagsV2 } from "components/AICrawlerMetaTagsV2";
import { AutoLanguageInitializer } from "components/AutoLanguageInitializer";
import { FloatingSupportChat } from 'components/FloatingSupportChat';
import { useLocation } from "react-router-dom";
import { initializeErrorTracking } from "../utils/adminDiagnostics";

// Import early PWA initialization
import "../utils/pwa-global-init";

interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 */
export const AppProvider = ({ children }: Props) => {
  const { theme } = useUserPreferences();
  const { user, loading } = useCurrentUser(); // Get the user and loading state
  const { initializeLanguagePreference } = useLanguageStore();
  const location = useLocation(); // This requires router context - AppProvider is used as a route element so context should be available

  // --- Instrumentation: stable mount id and lifecycle logs ---
  const mountIdRef = useRef<string>(`app-provider-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const mountId = mountIdRef.current;

  // Initialize global error tracking ONCE on mount
  useEffect(() => {
    console.log(`[AppProvider ${mountId}] ✅ mounted at`, new Date().toISOString());
    
    // Enable blanket error tracking for all errors
    initializeErrorTracking();
    
    return () => {
      console.log(`[AppProvider ${mountId}] 🧹 unmounted at`, new Date().toISOString());
    };
  }, [mountId]);

  // Debug: Track dependency changes
  const prevDepsRef = useRef<any>(null);
  useEffect(() => {
    const currentDeps = { 
      userUid: user?.uid, 
      loading, 
      theme,
      hasInitFn: !!initializeLanguagePreference 
    };
    
    if (prevDepsRef.current) {
      const changes = Object.entries(currentDeps).filter(
        ([key, value]) => prevDepsRef.current[key] !== value
      );
      if (changes.length > 0) {
        console.log(`[AppProvider ${mountId}] 🔍 deps changed ->`, changes);
      }
    }
    
    prevDepsRef.current = currentDeps;
  });

  // --- Instrumentation: route change correlation ---
  const prevPathRef = useRef<string>(location.pathname + location.search + location.hash);
  useEffect(() => {
    const current = location.pathname + location.search + location.hash;
    if (prevPathRef.current !== current) {
      console.log(`[AppProvider ${mountId}] 🧭 route changed:`, {
        from: prevPathRef.current,
        to: current,
        time: new Date().toISOString(),
      });
      prevPathRef.current = current;
    }
  }, [location, mountId]);

  // Single stable initialization when auth completes
  useEffect(() => {
    console.log(`[AppProvider ${mountId}] 🔐 auth init effect:`, { loading, userUid: user?.uid });
    if (!loading) {
      // Initialize language preference once when auth state stabilizes
      initializeLanguagePreference(user)
        .then(() => {
          console.log(`[AppProvider ${mountId}] 🌐 language prefs initialized for:`, user?.uid || 'anonymous');
        })
        .catch((error) => {
          console.error(`[AppProvider ${mountId}] ❌ language prefs init failed:`, error);
        });
    }
  }, [loading]); // Only depend on loading state to prevent cascading

  // --- Instrumentation: global event listeners that may cause remounts ---
  useEffect(() => {
    const onVisibility = () => console.log(`[AppProvider ${mountId}] 👁️ visibilitychange:`, {
      hidden: document.hidden, time: new Date().toISOString()
    });
    const onPageHide = (e: PageTransitionEvent) => console.log(`[AppProvider ${mountId}] 📄 pagehide:`, {
      persisted: e.persisted, time: new Date().toISOString()
    });
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log(`[AppProvider ${mountId}] 🚪 beforeunload fired at`, new Date().toISOString());
    };
    const onPopState = (e: PopStateEvent) => console.log(`[AppProvider ${mountId}] 🔙 popstate:`, {
      state: e.state, url: window.location.href, time: new Date().toISOString()
    });

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide as any);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);

    // Monkey-patch history methods to log navigations (no behavior change)
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    (history as any).pushState = function (...args: any[]) {
      console.log(`[AppProvider ${mountId}] ➕ history.pushState`, { args, url: window.location.href, time: new Date().toISOString() });
      return origPush.apply(this, args as any);
    } as any;
    (history as any).replaceState = function (...args: any[]) {
      console.log(`[AppProvider ${mountId}] ♻️ history.replaceState`, { args, url: window.location.href, time: new Date().toISOString() });
      return origReplace.apply(this, args as any);
    } as any;

    // Service Worker related logs
    let swUnsubscribe: Array<() => void> = [];
    if ('serviceWorker' in navigator) {
      const controllerHandler = () => console.log(`[AppProvider ${mountId}] 🧭 SW controllerchange at`, new Date().toISOString());
      navigator.serviceWorker.addEventListener('controllerchange', controllerHandler);
      swUnsubscribe.push(() => navigator.serviceWorker.removeEventListener('controllerchange', controllerHandler));

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        const updateFound = () => console.log(`[AppProvider ${mountId}] 🔄 SW updatefound at`, new Date().toISOString());
        reg.addEventListener('updatefound', updateFound);
        swUnsubscribe.push(() => reg.removeEventListener('updatefound', updateFound));
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide as any);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
      // restore history methods
      history.pushState = origPush;
      history.replaceState = origReplace;
      // cleanup sw listeners
      swUnsubscribe.forEach(fn => {
        try { fn(); } catch {}
      });
    };
  }, [mountId]);
  
  // If Firebase auth is still initializing, show a loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ThemeProvider defaultTheme={(theme as "dark" | "light" | "system") || "light"}>
        <ModuleProvider>
          <AuthProvider>
            <SuspenseWrapper>{children}</SuspenseWrapper>
            <Toaster position="top-right" richColors />
            <FloatingSupportChat />
          </AuthProvider>
        </ModuleProvider>
      </ThemeProvider>
      <PWAHead />
      <PWAInstall />
      <PWAController />
      <PWAUpdatePrompt />
      <PWAOfflineIndicator />
      <AutoTranslatePrompt />
      <AICrawlerMetaTagsV2 />
      <AutoLanguageInitializer showNotification={false} />
    </>
  );
};
