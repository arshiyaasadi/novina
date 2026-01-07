"use client";

import { Fund } from "../data/funds";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { Check } from "lucide-react";
import { useRef } from "react";

interface FundCardProps {
  fund: Fund;
  isSelected?: boolean;
  onToggle?: () => void;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  conservative: "محافظه‌کار",
  balanced: "متعادل",
  aggressive: "جسور",
};

const categoryColors: Record<string, string> = {
  conservative: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  balanced: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  aggressive: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function FundCard({ fund, isSelected = false, onToggle, className }: FundCardProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasHandledTouchRef = useRef(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if we've already handled a touch event
    if (hasHandledTouchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasHandledTouchRef.current = false;
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    onToggle?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    hasHandledTouchRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only trigger if it's a tap (not a swipe) and within reasonable time
    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
      e.preventDefault();
      e.stopPropagation();
      hasHandledTouchRef.current = true;
      onToggle?.();
      
      // Reset the flag after a short delay to allow click event to be prevented
      setTimeout(() => {
        hasHandledTouchRef.current = false;
      }, 300);
    }

    touchStartRef.current = null;
  };

  return (
    <Card
      className={cn(
        "h-full flex flex-col cursor-pointer transition-all hover:border-primary border select-none",
        "active:scale-[0.98] active:opacity-90",
        isSelected && "border-primary",
        className
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center w-5 h-5 rounded border-2 mt-1 flex-shrink-0 transition-all",
            isSelected
              ? "bg-primary border-primary"
              : "border-border bg-background"
          )}>
            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
          <div className="flex items-start justify-between gap-2 flex-1">
            <CardTitle className="text-lg font-semibold leading-tight flex-1">
              {fund.name}
            </CardTitle>
            <span
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                categoryColors[fund.category]
              )}
            >
              {categoryLabels[fund.category]}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {fund.shortDescription}
        </p>
      </CardContent>
    </Card>
  );
}

