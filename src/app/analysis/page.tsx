"use client";

import { ClinicalWorkspace } from "@/components/analysis/ClinicalWorkspace";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AnalysisPage() {
  return (
    <ErrorBoundary>
      <ClinicalWorkspace />
    </ErrorBoundary>
  );
}
