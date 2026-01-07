"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, className }: StepIndicatorProps) {
  const projectNameT = useTranslations("auth.initialLoading");

  return (
    <div className={cn("w-full px-4 pt-4 pb-2", className)}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo and project name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-primary bg-card" />
            <h1 className="text-lg font-bold">{projectNameT("projectName")}</h1>
          </div>
          {/* Risk assessment chart icon */}
          <div className="flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

