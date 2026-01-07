"use client";

import { Suspense } from "react";
import { RiskWizard } from "./components/risk-wizard";

function RiskWizardWrapper() {
  return <RiskWizard />;
}

export default function RiskAssessmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RiskWizardWrapper />
    </Suspense>
  );
}

