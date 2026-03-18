import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ color: "red" }}>Something went wrong</h1>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {error.message}
      </pre>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", color: "#666" }}>
        {error.stack}
      </pre>
      <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Reload
      </button>
    </div>
  );
}

export const OuterErrorBoundary = ({ children }: Props) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error("Caught error in AppWrapper", error.message, error.stack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
