"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Wallet, FileStack, Banknote } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "ولت دیجیتال خود را متصل کنید",
    description: "کیف پول دیجیتال خود را به نوینا متصل کنید تا دارایی‌ها قابل مشاهده باشند.",
  },
  {
    icon: FileStack,
    title: "دارایی خودتان را ثبت کنید",
    description: "دارایی‌های وثیقه (کریپتو یا TWIN) را در پنل ثبت کنید.",
  },
  {
    icon: Banknote,
    title: "به ارزش دارایی وام دریافت کنید",
    description: "بر اساس ارزش داراییِ ثبت‌شده، اعتبار و وام دریافت کنید.",
  },
];

export default function CreditAssetsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col p-4 min-h-full">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex flex-row-reverse items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted/60 transition-colors -ml-2 shrink-0"
            aria-label="بازگشت"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-0.5 flex-1 min-w-0">
            <h1 className="text-xl font-bold">اعتبار با دارایی‌ها</h1>
            <p className="text-xs text-muted-foreground">
              وثیقه‌گذاری دارایی (کریپتو یا TWIN) و دریافت وام بر اساس ارزش آن
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">راهنما</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-4 text-right">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
              );
            })}
            <Button
              className="w-full mt-2"
              onClick={() => router.push("/app/wallet")}
            >
              اتصال کیف پول
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
