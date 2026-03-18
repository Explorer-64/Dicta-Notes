import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  color?: string;
  height?: number;
  duration?: number;
}

/**
 * Simple animated waveform component for visual feedback during processing
 */
export const Waveform: React.FC<WaveformProps> = ({
  color = '#3b82f6',
  height = 4,
  duration = 1500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Make sure canvas is sized correctly
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    // Animation variables
    const waveCount = 3; // Number of waves
    let animationId: number;
    let startTime = Date.now();
    
    // Draw wave function
    const draw = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set wave style
      context.strokeStyle = color;
      context.lineWidth = 2 * window.devicePixelRatio;
      
      // Draw waves
      const amplitude = canvas.height / 3;
      const frequency = 10;
      
      for (let i = 0; i < waveCount; i++) {
        // Each wave has a different phase
        const phaseOffset = (i / waveCount) * Math.PI * 2;
        const opacity = 1 - (i / waveCount) * 0.6;
        
        context.beginPath();
        context.globalAlpha = opacity;
        
        for (let x = 0; x < canvas.width; x += 5) {
          const xProgress = x / canvas.width;
          const y = amplitude * Math.sin((xProgress * frequency + progress * Math.PI * 2 + phaseOffset)) + canvas.height / 2;
          
          if (x === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        
        context.stroke();
      }
      
      // Continue animation loop
      animationId = requestAnimationFrame(draw);
    };
    
    // Start animation
    draw();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, height, duration]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
      style={{ height }} 
    />
  );
};
