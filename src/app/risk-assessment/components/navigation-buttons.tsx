"use client";

import { Button } from "@/shared/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  hasAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  hasAnswer,
  onPrevious,
  onNext,
  className,
}: NavigationButtonsProps) {
  const isFirstStep = typeof currentStep === "number" && currentStep === 0;
  const isLastStep = typeof currentStep === "number" && currentStep === totalSteps - 1;

  return (
    <div className={cn("flex gap-3", className)}>
      <Button
        onClick={onNext}
        disabled={!hasAnswer}
        className={cn(
          "flex-1 min-h-[48px]",
          !hasAnswer && "opacity-50 cursor-not-allowed"
        )}
      >
        {!isLastStep && <ChevronRight className="w-5 h-5 ml-2" />}
        {isLastStep ? "مشاهده نتیجه" : "بعدی"}
      </Button>
      <Button
        onClick={onPrevious}
        disabled={isFirstStep}
        variant="outline"
        className={cn(
          "flex-1 min-h-[48px]",
          isFirstStep && "opacity-50 cursor-not-allowed"
        )}
      >
        قبلی
        <ChevronLeft className="w-5 h-5 mr-2" />
      </Button>
    </div>
  );
}

