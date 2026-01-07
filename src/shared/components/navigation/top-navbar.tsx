"use client";

import { useState, useEffect } from "react";
import { Bell, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";

export function TopNavbar() {
  const t = useTranslations("app");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock notification data - در آینده از API یا context دریافت می‌شود
  const hasNotification = true;
  const lastMessage = "سرمایه گذاری با وام";
  
  // Typewriter effect - repeats every 5 seconds
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!lastMessage || !hasNotification) return;

    let typingInterval: NodeJS.Timeout | null = null;
    let repeatInterval: NodeJS.Timeout | null = null;

    const typeText = () => {
      // Clear any existing typing interval
      if (typingInterval) {
        clearInterval(typingInterval);
      }

      setDisplayedText("");
      setIsTyping(true);
      let currentIndex = 0;
      const speed = 80; // milliseconds per character

      typingInterval = setInterval(() => {
        if (currentIndex < lastMessage.length) {
          setDisplayedText(lastMessage.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
          }
        }
      }, speed);
    };

    // Start typing immediately
    typeText();

    // Repeat every 5 seconds (5000ms)
    repeatInterval = setInterval(() => {
      typeText();
    }, 5000);

    return () => {
      if (typingInterval) {
        clearInterval(typingInterval);
      }
      if (repeatInterval) {
        clearInterval(repeatInterval);
      }
    };
  }, [lastMessage, hasNotification]);

  const handleNotificationClick = () => {
    if (hasNotification) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side (RTL) - App Name */}
        <h1 className="text-lg font-semibold text-primary">{t("name")}</h1>
        {/* Right side (RTL) - Notifications */}
          <div className="flex items-center gap-2">
            {hasNotification && lastMessage && (
              <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground max-w-[120px] truncate">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse" />
                )}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 hover:bg-primary/10 hover:text-primary relative"
              )}
              onClick={handleNotificationClick}
            >
            <Bell className="h-5 w-5" />
              {hasNotification && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            <span className="sr-only">نوتیفیکیشن‌ها</span>
          </Button>
          </div>
      </div>
    </nav>

      {/* Modal for Notification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="max-w-md"
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-semibold">سرمایه گذاری با وام</p>
                <p className="text-sm text-muted-foreground">
                  می‌توانید تا ۷۰٪ مبلغ سرمایه‌گذاری خود را از طریق وام دریافت کنید و در صندوق‌های پیشنهادی سرمایه‌گذاری کنید.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

