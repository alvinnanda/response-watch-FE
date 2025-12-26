import { useCallback, useSyncExternalStore } from 'react';

// Hook to detect page visibility using useSyncExternalStore
// This ensures React properly tracks visibility changes
// Listens to both Tab Visibility and Window Focus
export function usePageVisibility(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    document.addEventListener('visibilitychange', callback);
    window.addEventListener('focus', callback);
    window.addEventListener('blur', callback);
    
    return () => {
      document.removeEventListener('visibilitychange', callback);
      window.removeEventListener('focus', callback);
      window.removeEventListener('blur', callback);
    };
  }, []);
  
  const getSnapshot = useCallback(() => {
    // Page is visible if document is visible AND window has focus
    return document.visibilityState === 'visible' && document.hasFocus();
  }, []);

  const getServerSnapshot = useCallback(() => true, []); // SSR fallback
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
