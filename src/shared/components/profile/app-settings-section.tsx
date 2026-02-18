"use client";

import { useRouter } from "next/navigation";
import { Info, Clock, LogOut, SunMedium, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

interface AppSettingsSectionProps {
  lastActivity?: string | null;
}

export function AppSettingsSection({ lastActivity }: AppSettingsSectionProps) {
  const t = useTranslations("app.profile.settings");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
        // TODO(phase2): Navigate to about page or show modal
        console.log("About clicked");
      },
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-2 p-6">
        {/* Theme toggle */}
        <div className="mb-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("theme.title")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              className="flex items-center justify-center gap-1 text-xs"
              onClick={() => setTheme("light")}
            >
              <SunMedium className="w-3 h-3" />
              <span>{t("theme.light")}</span>
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              className="flex items-center justify-center gap-1 text-xs"
              onClick={() => setTheme("dark")}
            >
              <Moon className="w-3 h-3" />
              <span>{t("theme.dark")}</span>
            </Button>
            <Button
              type="button"
              variant={theme === "system" || !theme ? "default" : "outline"}
              className="flex items-center justify-center gap-1 text-xs"
              onClick={() => setTheme("system")}
            >
              <Monitor className="w-3 h-3" />
              <span>{t("theme.system")}</span>
            </Button>
          </div>
        </div>

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
              // TODO(phase2): Navigate to activity history page
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

