import React, { useEffect, useRef, useState } from 'react';

interface TimerDisplayProps {
  startTime: number | null;
  isRunning: boolean;
  className?: string;
  showMs?: boolean;
}

/**
 * High-performance timer display that uses requestAnimationFrame
 * to maintain smooth updates independent of React render cycles.
 * 
 * This component is completely decoupled from parent state updates
 * regarding the current time - it only needs the startTime.
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  startTime, 
  isRunning, 
  className = "",
  showMs = false 
}) => {
  const [displayTime, setDisplayTime] = useState("00:00");
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  // Update function that runs on every animation frame
  const animate = (time: number) => {
    if (startTime && isRunning) {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      
      // Only update React state if the visible second has changed
      // This drastically reduces re-renders compared to 10-100ms intervals
      if (previousTimeRef.current !== diff) {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setDisplayTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        previousTimeRef.current = diff;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning && startTime) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (!isRunning && startTime) {
        // If stopped but has start time, show final time
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setDisplayTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    } else {
        // Reset
        setDisplayTime("00:00");
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, startTime]);

  return (
    <span className={`font-mono font-semibold ${className}`}>
      {displayTime}
    </span>
  );
};
