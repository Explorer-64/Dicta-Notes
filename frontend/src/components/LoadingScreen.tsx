import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-900/20">
      <div className="backdrop-blur-[110px] bg-background/60 p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-blue-400 animate-spin animate-reverse"></div>
            <div className="absolute inset-4 rounded-full border-b-2 border-purple-500 animate-spin animate-delay-500"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-primary">Loading...</p>
        </div>
      </div>
    </div>
  );
};
