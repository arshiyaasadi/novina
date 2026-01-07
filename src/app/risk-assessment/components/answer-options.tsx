"use client";

import { Question } from "../data/questions";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

interface AnswerOptionsProps {
  question: Question;
  selectedAnswer: number | null;
  onSelect: (optionIndex: number) => void;
  className?: string;
}

export function AnswerOptions({
  question,
  selectedAnswer,
  onSelect,
  className,
}: AnswerOptionsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {question.options.map((option, index) => (
        <Button
          key={option.id}
          onClick={() => onSelect(index)}
          variant="outline"
          className={cn(
            "w-full min-h-[56px] h-auto py-3 px-4 text-right justify-start",
            "transition-all duration-300",
            "border-2",
            selectedAnswer === index
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-secondary",
            "text-sm font-normal leading-relaxed whitespace-normal"
          )}
        >
          <span className="flex-1">{option.text}</span>
        </Button>
      ))}
    </div>
  );
}

