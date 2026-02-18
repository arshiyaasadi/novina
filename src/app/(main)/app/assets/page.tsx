"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { getAllFunds, Fund } from "@/app/risk-assessment/data/funds";
import { getFundPrice } from "./lib/fund-prices";
import { cn } from "@/shared/lib/utils";

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function AssetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") ?? null;
  const modeParam = searchParams.get("mode") ?? null;
  const activeTab =
    modeParam === "commit"
      ? "commit"
      : tabParam === null
        ? "trade"
        : tabParam === "history"
          ? "history"
          : tabParam === "trade" || tabParam === "commit"
            ? tabParam
            : "funds";

  // وقتی کاربر مستقیماً /app/assets را باز می‌کند (بدون tab)، به تب معامله برو
  useEffect(() => {
    if (tabParam === null) {
      router.replace("/app/assets/trade?tab=issue");
    }
  }, [tabParam, router]);
  // تاریخچه معاملات به صفحه فعالیت‌ها منتقل شده
  useEffect(() => {
    if (tabParam === "history") {
      router.replace("/app/activities?type=trade");
    }
  }, [tabParam, router]);

  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const allFunds = getAllFunds();
    setFunds(allFunds);
  }, []);

  const formatPrice = (price: number): string => formatNumber(price);

  const handleInfoClick = (fund: Fund) => {
    setSelectedFund(fund);
    setIsModalOpen(true);
  };

  const handleTradeClick = (fund: Fund) => {
    router.push(`/app/assets/trade?tab=issue&fundId=${fund.id}`);
  };

  const handleTabChange = (tab: string) => {
    if (tab === "trade") {
      router.push("/app/assets/trade?tab=issue");
      return;
    }
    if (tab === "commit") {
      router.push("/app/assets/trade?mode=commit&tab=issue");
      return;
    }
    if (tab === "history") {
      router.push("/app/activities?type=trade");
      return;
    }
    router.push("/app/assets?tab=funds");
  };

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* تب‌های مینیمال — ترتیب ثابت با order تا با عوض کردن تب جابه‌جا نشوند */}
        <div className="flex flex-row rounded-xl border bg-muted/30 p-1.5" dir="rtl">
          <button
            type="button"
            className={cn(
              "order-1 flex-1 min-w-0 rounded-lg py-2.5 text-sm font-medium transition-colors shrink-0 basis-0",
              activeTab === "trade" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("trade")}
          >
            معامله
          </button>
          <button
            type="button"
            className={cn(
              "order-2 flex-1 min-w-0 rounded-lg py-2.5 text-sm font-medium transition-colors shrink-0 basis-0",
              activeTab === "commit" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("commit")}
          >
            معامله تعهدی
          </button>
          <button
            type="button"
            className={cn(
              "order-3 flex-1 min-w-0 rounded-lg py-2.5 text-sm font-medium transition-colors shrink-0 basis-0",
              activeTab === "funds" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("funds")}
          >
            صندوق‌ها
          </button>
          <button
            type="button"
            className={cn(
              "order-4 flex-1 min-w-0 rounded-lg py-2.5 text-sm font-medium transition-colors shrink-0 basis-0",
              activeTab === "history" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("history")}
          >
            تاریخچه معاملات
          </button>
        </div>

        {activeTab === "funds" && (
        <div className="space-y-3">
          {funds.map((fund) => {
            const price = getFundPrice(fund.id);
            if (!price) return null;

            const isPositive = price.change24h >= 0;

            return (
              <div
                key={fund.id}
                className="p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{fund.name}</h3>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleInfoClick(fund); }}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                        aria-label="اطلاعات"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-lg font-bold tabular-nums">
                        {formatPrice(price.currentPrice)}
                      </span>
                      <span className="text-xs text-muted-foreground">تومان</span>
                      <span
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          isPositive ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {price.change24h.toFixed(2)}% ۲۴س
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleTradeClick(fund)}
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    معامله
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Fund Info Modal */}
      {selectedFund && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-md max-h-[90vh] overflow-y-auto"
            onClose={() => setIsModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>{selectedFund.name}</DialogTitle>
              <DialogDescription>{selectedFund.shortDescription}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">توضیحات کامل:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedFund.fullDescription}
                </p>
              </div>

              {(() => {
                const price = getFundPrice(selectedFund.id);
                if (!price) return null;

                return (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">قیمت فعلی:</span>
                      <span className="text-lg font-bold tabular-nums">
                        {formatPrice(price.currentPrice)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تغییر ۲۴ ساعت گذشته:</span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          price.change24h >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {price.change24h >= 0 ? "+" : ""}
                        {price.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

