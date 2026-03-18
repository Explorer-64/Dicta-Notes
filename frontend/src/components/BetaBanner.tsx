import React, { useState } from "react";
import { X } from "lucide-react";

interface Props {
  className?: string;
}

export const BetaBanner: React.FC<Props> = ({ className = "" }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`bg-blue-50 border-b border-blue-100 ${className}`}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            BETA
          </span>
          <p className="text-sm text-blue-800">
            <span className="font-medium">Free during beta period.</span>{" "}
            <span className="hidden sm:inline">Premium plans will be available soon. We welcome your feedback on features and any issues you encounter!</span>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-500 hover:text-blue-700 focus:outline-none"
          aria-label="Dismiss banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
