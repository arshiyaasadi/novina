"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Activity, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

const navItems = [
  {
    href: "/app",
    icon: LayoutDashboard,
    translationKey: "home",
  },
  {
    href: "/app/assets",
    icon: Wallet,
    translationKey: "assets",
  },
  {
    href: "/app/activities",
    icon: Activity,
    translationKey: "activities",
  },
  {
    href: "/app/profile",
    icon: User,
    translationKey: "profile",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("app.navigation");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            // For home route (/app), only match exactly
            // For other routes, match exact or child routes
            const isActive = item.href === "/app" 
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs font-medium">{t(item.translationKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

