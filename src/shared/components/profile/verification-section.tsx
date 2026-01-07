"use client";

import { Shield, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type VerificationLevel = "none" | "basic" | "advanced";

interface VerificationSectionProps {
  level: VerificationLevel;
}

export function VerificationSection({ level }: VerificationSectionProps) {
  const t = useTranslations("app.profile.verification");

  // Only display if level is basic or advanced
  if (level === "none") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("levelTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-md border-2 px-3 py-1.5 text-sm font-semibold",
              level === "basic" && "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400",
              level === "advanced" && "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
            )}
          >
            {level === "basic" && <Shield className="ml-2 h-4 w-4" />}
            {level === "advanced" && <ShieldCheck className="ml-2 h-4 w-4" />}
            {t(`status.${level}`)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

