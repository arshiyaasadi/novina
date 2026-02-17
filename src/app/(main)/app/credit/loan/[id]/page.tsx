"use client";

import { useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import { MOCK_LOAN_REQUESTS, formatNumber, type LoanRequest } from "../page";

export default function LoanRequestDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  const request: LoanRequest | undefined = useMemo(
    () => (id ? MOCK_LOAN_REQUESTS.find((req) => req.id === id) : undefined),
    [id]
  );

  if (!id || !request) {
    return (
      <div className="flex flex-col p-4 space-y-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">جزئیات وام</h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="بازگشت"
              onClick={() => router.push("/app/credit/loan")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">درخواستی با این شناسه پیدا نشد.</p>
              <Button type="button" variant="outline" onClick={() => router.push("/app/credit/loan")}>
                بازگشت به لیست درخواست‌ها
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const requestedDate = new Date(request.requestedAt);
  const firstDue = new Date(request.firstDueDate);

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">جزئیات وام</h1>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="بازگشت"
            onClick={() => router.push("/app/credit/loan")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">خلاصه وام</CardTitle>
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium ${request.statusBadgeClass}`}
              >
                {request.statusLabel}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">شناسه درخواست:</span>
              <span className="font-mono text-[11px]">{request.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">تاریخ درخواست:</span>
              <span className="tabular-nums">
                {requestedDate.toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">مبلغ وام:</span>
              <span className="font-semibold tabular-nums">
                {formatNumber(request.amount)} تومان
              </span>
            </div>
            <div className="flex items-center justify بین text-xs">
              <span className="text-muted-foreground">نرخ سود:</span>
              <span className="font-semibold tabular-nums">{request.interest}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">مدت بازپرداخت:</span>
              <span className="font-semibold tabular-nums">{request.months} ماهه</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">مبلغ هر قسط:</span>
              <span className="font-bold tabular-nums text-primary">
                {formatNumber(request.monthlyInstallment)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">سررسید اول وام:</span>
              <span className="font-semibold tabular-nums">
                {firstDue.toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-xs">
              <span className="text-muted-foreground">مجموع بازپرداخت:</span>
              <span className="font-semibold tabular-nums">
                {formatNumber(request.totalPayable)} تومان
              </span>
            </div>
            {request.status === "rejected" && request.rejectReason && (
              <p className="text-[11px] text-red-600 mt-2">
                دلیل رد این درخواست: {request.rejectReason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">برنامه اقساط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {Array.from({ length: request.months }, (_, i) => {
              const dueDate = new Date(firstDue);
              dueDate.setMonth(dueDate.getMonth() + i);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      قسط {i + 1} از {request.months}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {dueDate.toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatNumber(request.monthlyInstallment)} تومان
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

