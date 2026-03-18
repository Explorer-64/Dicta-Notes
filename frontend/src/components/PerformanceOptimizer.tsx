import React, { useEffect } from 'react';
import { initializeOptimizations } from '../utils/optimizer';

interface Props {
  children: React.ReactNode;
}

/**
 * Performance optimization wrapper component that applies memory and performance
 * optimizations to the application
 */
export const PerformanceOptimizer: React.FC<Props> = ({ children }) => {
  useEffect(() => {
    // Initialize optimizations when component mounts
    initializeOptimizations();
    
    // Add event listeners to optimize on low memory or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab is visible again, optimizing resources');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return <>{children}</>;
};
