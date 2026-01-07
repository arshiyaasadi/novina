"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export function VerificationAlert() {
  const t = useTranslations("app.profile.verification.alert");

  return (
    <Card className="border-warning/20 bg-warning/10">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-warning-foreground">
              {t("title")}
            </h4>
            <p className="text-sm text-warning-foreground/90">
              {t("message")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-warning/30 text-warning-foreground hover:bg-warning/20"
            >
              {t("completeButton")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

