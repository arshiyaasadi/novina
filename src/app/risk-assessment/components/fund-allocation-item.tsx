"use client";

import { Fund } from "../data/funds";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { useRef, useEffect, useState } from "react";

interface FundAllocationItemProps {
  fund: Fund;
  percentage: number;
  onPercentageChange: (percentage: number) => void;
  step?: number;
  isSingleFund?: boolean;
  className?: string;
}

export const categoryLabels: Record<string, string> = {
  conservative: "محافظه‌کار",
  balanced: "متعادل",
  aggressive: "جسور",
};

export const categoryColors: Record<string, string> = {
  conservative: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  balanced: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  aggressive: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function FundAllocationItem({
  fund,
  percentage,
  onPercentageChange,
  step = 1,
  isSingleFund = false,
  className,
}: FundAllocationItemProps) {
  const lastHapticValue = useRef<number>(percentage);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(percentage);
  const isDraggingRef = useRef(false);
  const [inputValue, setInputValue] = useState(String(Math.round(percentage)));
  const [inputFocused, setInputFocused] = useState(false);

  // Sync local value when percentage prop changes (from parent)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(percentage);
    }
  }, [percentage]);

  // Sync input text when percentage changes and input not focused
  useEffect(() => {
    if (!inputFocused) {
      setInputValue(String(Math.round(percentage)));
    }
  }, [percentage, inputFocused]);

  // Haptic feedback every 10 units
  useEffect(() => {
    const currentTens = Math.floor(localValue / 10);
    const lastTens = Math.floor(lastHapticValue.current / 10);
    
    if (currentTens !== lastTens && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    lastHapticValue.current = localValue;
  }, [localValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.round(parseFloat(e.target.value));
    setLocalValue(newValue);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/67f948b8-794c-4178-a942-4c9f88678cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'fund-allocation-item.tsx:57',message:'handleSliderChange',data:{fundId:fund.id,newValue,currentPercentage:percentage,localValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    onPercentageChange(newValue);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = () => {
    isDraggingRef.current = true;
  };

  return (
    <Card className={cn("border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-lg font-semibold leading-tight">
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            ref={sliderRef}
            type="range"
            min={5}
            max={isSingleFund ? 100 : 95}
            step={step}
            disabled={isSingleFund}
            value={localValue}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary slider"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="flex items-center gap-1 min-w-[60px] justify-end">
            <Input
              type="text"
              inputMode="numeric"
              value={inputFocused ? inputValue : String(Math.round(percentage))}
              onChange={(e) => setInputValue(normalizeNumericInput(e.target.value))}
              onFocus={() => {
                setInputFocused(true);
                setInputValue(String(Math.round(percentage)));
              }}
              onBlur={() => {
                setInputFocused(false);
                const num = parseInt(normalizeNumericInput(inputValue), 10);
                const clamped = Number.isNaN(num)
                  ? (isSingleFund ? 100 : Math.round(percentage))
                  : isSingleFund
                    ? Math.max(0, Math.min(100, num))
                    : Math.max(5, Math.min(95, num));
                setInputValue(String(clamped));
                onPercentageChange(clamped);
              }}
              className="h-9 w-14 text-center text-lg font-bold tabular-nums px-1"
              aria-label={`درصد ${fund.name}`}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {fund.shortDescription}
        </p>
      </CardContent>
    </Card>
  );
}

