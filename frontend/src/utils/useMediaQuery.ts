import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting if a media query matches
 * @param query The media query to match against
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize with the current match state
      const media = window.matchMedia(query);
      setMatches(media.matches);

      // Create a callback function to handle changes
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      // Add the listener to the media query
      media.addEventListener('change', listener);

      // Clean up the listener when the component unmounts
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    return undefined;
  }, [query]);

  return matches;
}
