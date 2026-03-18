import { Suspense, ReactNode } from 'react';
import { Spinner } from './Spinner';

interface SuspenseWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper for React.Suspense with a loading spinner
 */
export function SuspenseWrapper({ children }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>}>
      {children}
    </Suspense>
  );
}
