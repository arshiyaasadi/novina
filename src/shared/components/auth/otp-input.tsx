"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { cn } from "@/shared/lib/utils";

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (value: string) => void;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus last input on mount (RTL: right to left)
    if (inputRefs.current[3]) {
      inputRefs.current[3].focus();
    }
  }, []);

  const handleChange = (index: number, newValue: string) => {
    const digit = normalizeNumericInput(newValue).slice(0, 1);
    
    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    // Auto-focus previous input if digit entered (RTL: right to left)
    if (digit && index > 0) {
      // Small delay to ensure value is set
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 0);
    }

    // Check if all digits are filled
    const updatedOtp = [...newOtp];
    if (updatedOtp.every((d) => d !== "") && onComplete) {
      onComplete(updatedOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace (RTL: move to next input on right)
    if (e.key === "Backspace" && !value[index] && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Handle arrow keys (RTL: ArrowRight goes to previous, ArrowLeft goes to next)
    if (e.key === "ArrowRight" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index < 3) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = normalizeNumericInput(pastedData).slice(0, 4).split("");

    if (digits.length > 0) {
      const newOtp = [...value];
      
      // Fill inputs starting from the current index
      const startIndex = parseInt(e.currentTarget.dataset.index || "0");
      for (let i = 0; i < digits.length && startIndex + i < 4; i++) {
        newOtp[startIndex + i] = digits[i];
      }
      
      onChange(newOtp);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(startIndex + digits.length, 3);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
      
      // Check if all digits are filled
      if (newOtp.every((d) => d !== "") && onComplete) {
        onComplete(newOtp.join(""));
      }
    }
  };

  const handleInputPaste = (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = normalizeNumericInput(pastedData).slice(0, 4).split("");

    if (digits.length > 0) {
      const newOtp = [...value];
      
      // Fill inputs starting from the current index (RTL: fill from right to left)
      // For RTL, we fill backwards: if pasting in index 3, fill 3,2,1,0
      // If pasting in index 0, fill 0,1,2,3 (normal order)
      const startIndex = index;
      
      // If pasting in the last input (index 3), fill backwards
      if (startIndex === 3) {
        for (let i = 0; i < digits.length && startIndex - i >= 0; i++) {
          newOtp[startIndex - i] = digits[i];
        }
        // Focus the first empty input or first input
        const prevIndex = Math.max(startIndex - digits.length + 1, 0);
        setTimeout(() => {
          inputRefs.current[prevIndex]?.focus();
        }, 0);
      } else {
        // Otherwise, fill forwards from current index
        for (let i = 0; i < digits.length && startIndex + i < 4; i++) {
          newOtp[startIndex + i] = digits[i];
        }
        // Focus the next empty input or last input
        const nextIndex = Math.min(startIndex + digits.length, 3);
        setTimeout(() => {
          inputRefs.current[nextIndex]?.focus();
        }, 0);
      }
      
      onChange(newOtp);
      
      // Check if all digits are filled
      if (newOtp.every((d) => d !== "") && onComplete) {
        onComplete(newOtp.join(""));
      }
    }
  };

  return (
    <div className={cn("flex gap-3", className)}>
      {value.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handleInputPaste(index)}
          data-index={index}
          className="h-14 w-14 text-center text-2xl font-semibold"
          dir="ltr"
        />
      ))}
    </div>
  );
}

