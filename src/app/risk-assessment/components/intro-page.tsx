"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { TrendingUp, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface IntroPageProps {
  onStart: () => void;
  onStartAi: () => void;
  className?: string;
}

export function IntroPage({ onStart, onStartAi, className }: IntroPageProps) {
  return (
    <div className={cn("flex-1 flex items-center justify-center px-4 py-8", className)}>
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl border-2 border-primary bg-card flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">ارزیابی ریسک سرمایه‌گذاری</CardTitle>
            <CardDescription className="mt-4 text-base">
              شخصیت‌شناسی مالی (رویکرد مالی رفتاری)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                این پرسشنامه به شما کمک می‌کند تا با شناخت بهتر از شخصیت مالی خود، 
                بهترین استراتژی سرمایه‌گذاری را انتخاب کنید.
              </p>
            </div>
            
            {/* Standard mode button */}
            <Button
              onClick={onStart}
              variant="outline"
              className="w-full min-h-[48px]"
            >
              شروع ارزیابی
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>

            {/* AI mode section */}
            <div className="border-2 border-primary/20 rounded-lg bg-primary/5 p-4 space-y-3 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">ارزیابی با هوش مصنوعی</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                به سوالات پاسخ خود را با حس و حال واقعی خودت تایپ کن و در نهایت این دسته‌بندی 
                را به صورت دقیق‌تر و حرفه‌ای‌تر به نتیجه برسان.
              </p>
              <Button
                onClick={onStartAi}
                className="w-full min-h-[48px] bg-primary hover:bg-primary/90"
              >
                شروع ارزیابی با AI
                <Sparkles className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

