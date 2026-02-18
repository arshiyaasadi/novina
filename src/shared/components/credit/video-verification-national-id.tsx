"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";

const NATIONAL_ID_LENGTH = 10;

export interface VideoVerificationNationalIdStepProps {
  /** Initial national ID (e.g. from parent state) */
  value?: string;
  /** When user continues, valid national ID is passed */
  onContinue: (nationalId: string) => void;
  /** Continue button label */
  continueLabel?: string;
  /** Go back to previous step */
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Video verification — step 1: enter national ID.
 * Hint: must match mobile holder; validated as 10 digits.
 */
export function VideoVerificationNationalIdStep({
  value = "",
  onContinue,
  continueLabel = "ادامه",
  onBack,
  backLabel = "بازگشت",
}: VideoVerificationNationalIdStepProps) {
  const [nationalId, setNationalId] = useState(value);
  const [touched, setTouched] = useState(false);

  const digitsOnly = convertToEnglishDigits(nationalId).replace(/\D/g, "");
  const isValid = digitsOnly.length === NATIONAL_ID_LENGTH;
  const showError = touched && nationalId.length > 0 && !isValid;

  const errorMessage =
    showError && digitsOnly.length > 0 && digitsOnly.length !== NATIONAL_ID_LENGTH
      ? `کد ملی باید دقیقاً ${NATIONAL_ID_LENGTH} رقم باشد.`
      : showError && nationalId.length > 0
        ? "کد ملی باید فقط عدد و ۱۰ رقم باشد."
        : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const english = convertToEnglishDigits(raw);
    const digits = english.replace(/\D/g, "").slice(0, NATIONAL_ID_LENGTH);
    setNationalId(digits);
  };

  const handleContinue = () => {
    setTouched(true);
    if (digitsOnly.length !== NATIONAL_ID_LENGTH) return;
    onContinue(digitsOnly);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        کد ملی باید با دارنده شماره همراه ثبت‌شده در سامانه تطابق داشته باشد.
      </p>

      <div className="space-y-2">
        <Label htmlFor="video-verification-national-id">کد ملی</Label>
        <Input
          id="video-verification-national-id"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          maxLength={NATIONAL_ID_LENGTH}
          placeholder="0024000000"
          value={nationalId}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          className="font-mono text-center"
          aria-invalid={showError}
          aria-describedby={errorMessage ? "national-id-error" : undefined}
        />
        {errorMessage && (
          <p id="national-id-error" className="text-xs text-destructive text-right">
            {errorMessage}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground text-right">
          {NATIONAL_ID_LENGTH} رقم
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          className="flex-1"
          disabled={!isValid}
          onClick={handleContinue}
        >
          {continueLabel}
        </Button>
        {onBack && (
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
