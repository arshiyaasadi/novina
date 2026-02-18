"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";

interface NationalIdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (nationalId: string, username: string) => void;
}

export function NationalIdModal({
  open,
  onOpenChange,
  onSubmit,
}: NationalIdModalProps) {
  const t = useTranslations("app.profile.verification");
  const tCommon = useTranslations("common");
  const [nationalId, setNationalId] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nationalId.trim() || !username.trim()) return;

    setIsSubmitting(true);
    // TODO(phase2): Call API to verify national ID
    // For now, simulate API call
    setTimeout(() => {
      onSubmit(nationalId, username);
      setNationalId("");
      setUsername("");
      setIsSubmitting(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modal.title")}</DialogTitle>
          <DialogDescription>
            {t("modal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("modal.usernameLabel")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("modal.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">{t("modal.nationalIdLabel")}</Label>
            <Input
              id="nationalId"
              type="text"
              placeholder="1234567890"
              value={nationalId}
              onChange={(e) => {
                const englishValue = convertToEnglishDigits(e.target.value);
                setNationalId(englishValue);
              }}
              maxLength={10}
              dir="ltr"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!nationalId.trim() || !username.trim() || isSubmitting}>
            {isSubmitting ? t("modal.submittingButton") : t("modal.submitButton")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

