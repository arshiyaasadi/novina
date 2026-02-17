"use client"

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Coins, Sparkles, ArrowLeft, Calendar } from "lucide-react";

const creditOptions = [
  {
    id: "loan",
    title: "وام",
    description: "دریافت اعتبار نقدی برای شروع یا ادامه سرمایه‌گذاری.",
    icon: Banknote,
    href: "/app/credit/loan",
  },
  {
    id: "funds",
    title: "اوراق صندوق‌های سرمایه‌گذاری نوین",
    description: "استفاده از اوراق صندوق‌های نوین به عنوان پشتوانه اعتبار.",
    icon: Landmark,
    href: "/app/credit/funds",
  },
  {
    id: "crypto",
    title: "دارایی کریپتو",
    description: "وثیقه‌گذاری دارایی‌های کریپتویی برای دریافت اعتبار.",
    icon: Coins,
    href: "/app/credit/crypto",
  },
  {
    id: "twin",
    title: "توکن تیوین TWIN",
    description: "دریافت اعتبار بر اساس ارزش توکن تیوین (TWIN).",
    icon: Sparkles,
    href: "/app/credit/twin",
  },
];

export default function CreditPage() {
  const router = useRouter();

  const nextInstallment = useMemo<{
    dueDate: Date;
    investmentIndex: number;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const savedInvestments = window.localStorage.getItem("investments");
      if (!savedInvestments) return null;

      const investments = JSON.parse(savedInvestments) as Array<{
        loanAmount: number | null;
        loanPeriod: number | null;
        loanInterest: number | null;
        loanDetails: {
          interestAmount: number;
          totalPayable: number;
          monthlyInstallment: number;
          dueDate: string;
          isLumpSum?: boolean;
        } | null;
        createdAt: string;
      }>;

      let best: {
        dueDate: Date;
        investmentIndex: number;
      } | null = null;

      investments.forEach((investment, index) => {
        if (!investment.loanAmount || !investment.loanDetails || !investment.loanPeriod) return;
        if (investment.loanDetails.isLumpSum) return;

        const startDate = new Date(investment.loanDetails.dueDate);
        const monthlyInstallment = investment.loanDetails.monthlyInstallment;

        for (let i = 0; i < investment.loanPeriod; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          dueDate.setHours(0, 0, 0, 0);

          const paymentKey = `installment_${index}_${i + 1}_paid`;
          const isPaid = window.localStorage.getItem(paymentKey) === "true";
          if (!isPaid) {
            if (!best || dueDate < best.dueDate) {
              best = { dueDate, investmentIndex: index };
            }
            break;
          }
        }
      });

      return best;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="flex flex-col p-4 min-h-full">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">اعتبار</h1>
          <p className="text-xs text-muted-foreground">
            با روش‌های مختلف می‌توانید اعتبار دریافت کنید و روند سرمایه‌گذاری خودت را شروع و ادامه بدی.
          </p>
        </div>

        {nextInstallment && (
          <Card
            className="border-primary/20 bg-primary/5 cursor-pointer transition-all hover:bg-primary/10 hover:border-primary/30 active:scale-[0.98]"
            onClick={() => {
              router.push(`/app/activities/installments?index=${nextInstallment.investmentIndex}`);
            }}
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">سررسید قسط بعدی</p>
                    <p className="text-base font-semibold">
                      {nextInstallment.dueDate.toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg flex-shrink-0">
                  <ArrowLeft className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">روش‌های دریافت اعتبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => router.push(opt.href)}
                  className="w-full flex items-center justify-between rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors px-3 py-3 text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-sm font-semibold">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

