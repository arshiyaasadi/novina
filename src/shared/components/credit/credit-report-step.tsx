"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";

const NATIONAL_ID_LENGTH = 10;

export interface CreditReportStepProps {
  /** Initial national ID value */
  value?: string;
  /** After inquiry, locked national ID is shown */
  lockedNationalId?: string;
  /** Display credit grade (mock) */
  creditGrade?: string;
  /** When user taps "Request credit score" */
  onInquiry: (nationalId: string) => void;
  /** When user taps "Continue" after grade is shown */
  onContinue: () => void;
  /** Go back to previous step */
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Credit report step: enter national ID → inquiry → show grade A+ → continue.
 */
export function CreditReportStep({
  value = "",
  lockedNationalId,
  creditGrade = "A+",
  onInquiry,
  onContinue,
  onBack,
  backLabel = "بازگشت",
}: CreditReportStepProps) {
  const [nationalId, setNationalId] = useState(value);
  const [touched, setTouched] = useState(false);

  const digitsOnly = convertToEnglishDigits(nationalId).replace(/\D/g, "");
  const isValid = digitsOnly.length === NATIONAL_ID_LENGTH;
  const showError = touched && nationalId.length > 0 && !isValid;
  const showResult = !!lockedNationalId;

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

  const handleInquiry = () => {
    setTouched(true);
    if (digitsOnly.length !== NATIONAL_ID_LENGTH) return;
    onInquiry(digitsOnly);
  };

  if (showResult) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>کد ملی</Label>
          <Input
            type="text"
            inputMode="numeric"
            dir="ltr"
            readOnly
            disabled
            value={lockedNationalId}
            className="font-mono text-center bg-muted"
          />
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
          <p className="text-sm font-medium">گرید اعتبار سنجی ایران</p>
          <div className="flex items-center justify-center py-2">
            <span className="text-2xl font-bold text-primary tabular-nums">{creditGrade}</span>
          </div>
        </div>

        <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 dark:bg-amber-500/10 rounded-md p-2">
          رتبه مورد قبول برای دریافت وام B و بالاتر است.
        </p>

        <div className="flex items-center gap-2 pt-2">
          <Button type="button" className="flex-1" onClick={onContinue}>
            ادامه
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

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        کد ملی باید با دارنده شماره همراه ثبت‌شده در سامانه تطابق داشته باشد.
      </p>

      <div className="space-y-2">
        <Label htmlFor="credit-report-national-id">کد ملی</Label>
        <Input
          id="credit-report-national-id"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          maxLength={NATIONAL_ID_LENGTH}
          placeholder="0024568905"
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
        <p className="text-[11px] text-muted-foreground text-right">{NATIONAL_ID_LENGTH} رقم</p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          className="flex-1"
          disabled={!isValid}
          onClick={handleInquiry}
        >
          استعلام رتبه اعتبار سنجی
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
