import React from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { NoIndexMeta } from "components/NoIndexMeta";

export default function ViewSessionPage() {
  // Completely invisible to users
  return (
    <>
      <NoIndexMeta />
      <Navigate to="/" replace />
    </>
  );
}
