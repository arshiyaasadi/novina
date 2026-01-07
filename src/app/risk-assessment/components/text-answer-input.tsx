"use client";

import { Question } from "../data/questions";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";

interface TextAnswerInputProps {
  question: Question;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const MIN_CHARS = 5;
const MAX_CHARS = 50;

export function TextAnswerInput({
  question,
  value,
  onValueChange,
  className,
}: TextAnswerInputProps) {
  const charCount = value.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Textarea
          id="text-answer"
          value={value}
          onChange={handleChange}
          placeholder="احساسات و افکار واقعی خود را در مورد این سوال بنویسید..."
          className={cn(
            "min-h-[120px] resize-none",
            isValid
              ? "border-primary focus-visible:ring-primary"
              : charCount > 0 && charCount < MIN_CHARS
              ? "border-warning focus-visible:ring-warning"
              : ""
          )}
          dir="rtl"
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={cn(
              charCount < MIN_CHARS
                ? "text-warning"
                : isValid
                ? "text-muted-foreground"
                : "text-destructive"
            )}
          >
            {charCount < MIN_CHARS
              ? `حداقل ${MIN_CHARS} کاراکتر لازم است (${MIN_CHARS - charCount} کاراکتر باقی مانده)`
              : isValid
              ? "پاسخ شما معتبر است"
              : `حداکثر ${MAX_CHARS} کاراکتر مجاز است`}
          </span>
          <span
            className={cn(
              "font-medium",
              charCount > MAX_CHARS
                ? "text-destructive"
                : charCount >= MIN_CHARS
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
}

