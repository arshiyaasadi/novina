"use client";

import { useRouter } from "next/navigation";
import { Info, Clock, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

interface AppSettingsSectionProps {
  lastActivity?: string | null;
}

export function AppSettingsSection({ lastActivity }: AppSettingsSectionProps) {
  const t = useTranslations("app.profile.settings");
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }

    // Navigate to login page
    router.push("/login");
  };

  const menuItems = [
    {
      icon: Info,
      label: t("about"),
      onClick: () => {
        // TODO: Navigate to about page or show modal
        console.log("About clicked");
      },
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start items-center"
              onClick={item.onClick}
            >
              <Icon className="ml-2 h-4 w-4 shrink-0" />
              <span className="text-right">{item.label}</span>
            </Button>
          );
        })}

        {lastActivity && (
          <Button
            variant="ghost"
            className="w-full justify-start items-center"
            onClick={() => {
              // TODO: Navigate to activity history page
              console.log("Activity history clicked");
            }}
          >
            <Clock className="ml-2 h-4 w-4 shrink-0" />
            <span className="text-right">{t("activityHistory")}</span>
          </Button>
        )}

        <Button
          variant="outline"
          className="mt-2 w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive items-center"
          onClick={handleLogout}
        >
          <LogOut className="ml-2 h-4 w-4 shrink-0" />
          <span className="text-right">{t("logout")}</span>
        </Button>
      </CardContent>
    </Card>
  );
}

