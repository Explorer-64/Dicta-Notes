import React from "react";
import { Loader2 } from "lucide-react";

const SavingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-lg font-semibold text-foreground">
        Saving Recording...
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Please keep this page open.
      </p>
    </div>
  );
};

export default SavingSpinner;
