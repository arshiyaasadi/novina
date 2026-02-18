"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { OtpInput } from "./otp-input";
import { cn } from "@/shared/lib/utils";

interface PhoneLoginProps {
  onContinue: (phoneNumber: string) => void;
  onVerify?: (otp: string) => void;
}

type AuthStep = "phoneEntry" | "otpEntry";

/** Iranian mobile: digits only, max 11 chars, must start with 09 */
const IRAN_MOBILE_LENGTH = 11;
const IRAN_MOBILE_PREFIX = "09";

function validatePhoneNumber(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length === IRAN_MOBILE_LENGTH && digitsOnly.startsWith(IRAN_MOBILE_PREFIX);
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Restrict input to English digits only, max 11 (Iranian mobile) */
function formatPhoneInput(raw: string): string {
  const digits = normalizeNumericInput(raw).slice(0, IRAN_MOBILE_LENGTH);
  return digits;
}

export function PhoneLogin({ onContinue, onVerify }: PhoneLoginProps) {
  const t = useTranslations("auth.login");
  const projectNameT = useTranslations("auth.initialLoading");
  const [step, setStep] = useState<AuthStep>("phoneEntry");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [initialPhoneNumber, setInitialPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [hasChangedPhone, setHasChangedPhone] = useState(false);

  const isValid = validatePhoneNumber(phoneNumber);
  const isOtpComplete = otp.every((digit) => digit !== "");

  // Timer effect
  useEffect(() => {
    if (step === "otpEntry" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // Check if this is the first time or if phone number has changed
      if (initialPhoneNumber === "") {
        // First time - show modal
        setInitialPhoneNumber(normalizedPhone);
        setShowVerificationModal(true);
      } else if (normalizedPhone !== initialPhoneNumber) {
        // Phone number changed - proceed directly without modal
        setInitialPhoneNumber(normalizedPhone);
        setHasChangedPhone(true);
        proceedToOtp(normalizedPhone);
      } else {
        // Same phone number - show modal again
        setShowVerificationModal(true);
      }
    }
  };

  const proceedToOtp = (normalizedPhone: string) => {
    setStep("otpEntry");
    setTimeRemaining(30);
    setCanResend(false);
    onContinue(normalizedPhone);
  };

  const handleModalContinue = () => {
    setShowVerificationModal(false);
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    proceedToOtp(normalizedPhone);
  };

  const handleModalChangePhone = () => {
    setShowVerificationModal(false);
    setHasChangedPhone(true);
    setPhoneNumber("");
    // Focus will return to phone input automatically
  };

  const handleResend = () => {
    setTimeRemaining(30);
    setCanResend(false);
    setOtp(["", "", "", ""]);
    // TODO(phase2): Call API to resend OTP
  };

  const handleVerify = () => {
    // Remove condition - allow verify even if OTP is not complete
    if (onVerify) {
      onVerify(otp.join(""));
    }
  };

  const handleOtpComplete = (value: string) => {
    // Auto-verify when all 4 digits are entered
    if (onVerify) {
      onVerify(value);
    }
  };

  const handleEditPhone = () => {
    setStep("phoneEntry");
    setOtp(["", "", "", ""]);
    setTimeRemaining(30);
    setCanResend(false);
  };

  const progressPercentage = ((30 - timeRemaining) / 30) * 100;
  const isProgressComplete = progressPercentage >= 100;

  return (
    <>
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="max-w-[400px]">
          <DialogDescription className="text-center text-base">
            {t("phoneVerificationMessage")}
          </DialogDescription>
          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              onClick={handleModalContinue}
              className="w-full min-h-[44px]"
            >
              {t("continue")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleModalChangePhone}
              className="w-full min-h-[44px]"
            >
              {t("changePhoneNumber")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative flex h-full flex-col overflow-hidden">
      {/* Logo and project name - animated position */}
      {step === "phoneEntry" ? (
        // Phone entry: Div on top, name below, both centered
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 transition-all duration-500 ease-in-out">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl border-2 border-primary bg-card" />
            <h1 className="text-2xl font-bold">{projectNameT("projectName")}</h1>
          </div>
        </div>
      ) : (
        // OTP entry: Div and name side by side in top right corner
        <div className="absolute right-4 top-4 z-10 flex items-center gap-3 transition-all duration-500 ease-in-out">
          <div className="h-16 w-16 rounded-2xl border-2 border-primary bg-card" />
          <h1 className="text-2xl font-bold">{projectNameT("projectName")}</h1>
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-6" style={{ paddingTop: step === "phoneEntry" ? "120px" : "80px" }}>
        <div className="w-full max-w-sm space-y-8">
          {/* Phone input form - fade out when OTP step */}
          <div
            className={cn(
              "w-full transition-all duration-500 ease-in-out",
              step === "phoneEntry"
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none absolute"
            )}
          >
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="09[0-9]{9}"
                  maxLength={IRAN_MOBILE_LENGTH}
                  placeholder={t("phonePlaceholder")}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                  className="text-lg"
                  dir="ltr"
                  autoComplete="tel"
                  autoFocus
                />
                {phoneNumber.length > 0 && !isValid && (
                  <p className="text-xs text-destructive">
                    {phoneNumber.length !== IRAN_MOBILE_LENGTH
                      ? `شماره موبایل باید ${IRAN_MOBILE_LENGTH} رقم باشد.`
                      : !phoneNumber.startsWith(IRAN_MOBILE_PREFIX)
                        ? "شماره موبایل معتبر ایران با ۰۹ شروع می‌شود."
                        : "شماره موبایل معتبر نیست."}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* OTP input - fade in from bottom */}
          <div
            className={cn(
              "w-full transition-all duration-500 ease-in-out",
              step === "otpEntry"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none absolute"
            )}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-1">
                <button
                    type="button"
                    onClick={handleEditPhone}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Edit phone number"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                <p className="text-md text-muted-foreground">
                  {t("otpDescription", { phone: phoneNumber })}
                </p>
              </div>
              <div className="flex justify-center">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleOtpComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section with progress bar and button */}
      <div className="relative border-t border-border bg-background p-6">
        {/* Progress bar */}
        {step === "otpEntry" && (
          <div
            className={cn(
              "absolute top-0 left-0 h-[1px] transition-all duration-1000 ease-linear",
              isProgressComplete ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        )}

        {step === "phoneEntry" ? (
          <Button
            type="submit"
            onClick={handlePhoneSubmit}
            disabled={!isValid}
            className="w-full min-h-[44px]"
          >
            {t("continue")}
          </Button>
        ) : canResend ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            className="w-full min-h-[44px] border-primary text-primary hover:bg-primary/10"
          >
            {t("resendCode")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleVerify}
            className="w-full min-h-[44px]"
          >
            {t("verify")}
          </Button>
        )}
      </div>
    </div>
    </>
  );
}

