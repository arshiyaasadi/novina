"use client";

import { User } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";

interface UserInfoSectionProps {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  onVerifyClick?: () => void;
}

export function UserInfoSection({
  firstName,
  lastName,
  username,
  onVerifyClick,
}: UserInfoSectionProps) {
  const t = useTranslations("app.profile");
  const hasName = username || firstName || lastName;
  const displayName = username || [firstName, lastName].filter(Boolean).join(" ") || "-";

  if (!hasName && onVerifyClick) {
    return (
      <Card className="border-2">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <Button onClick={onVerifyClick} className="w-full">
            احراز هویت پایه رو انجام بده
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold leading-tight">{displayName}</p>
        </div>
      </CardContent>
    </Card>
  );
}

