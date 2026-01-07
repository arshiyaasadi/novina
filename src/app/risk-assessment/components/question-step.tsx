"use client";

import { Question } from "../data/questions";
import { cn } from "@/shared/lib/utils";

interface QuestionStepProps {
  question: Question;
  className?: string;
}

export function QuestionStep({ question, className }: QuestionStepProps) {
  return (
    <div className={cn("flex-1 flex items-center justify-center px-4 py-8", className)}>
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
            {question.question}
          </h2>
        </div>
      </div>
    </div>
  );
}

